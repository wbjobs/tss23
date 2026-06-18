import { EventEmitter } from 'events';
import { models } from '../data/store.js';

interface PoolSlot {
  id: string;
  active: boolean;
  requestId: string | null;
  acquiredAt: number | null;
}

interface QueueItem {
  id: string;
  requestId: string;
  modelId: string;
  resolve: (slot: PoolSlot) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  enqueuedAt: number;
}

interface ModelPoolConfig {
  maxConnections: number;
  minConnections: number;
  queueTimeoutMs: number;
  idleTimeoutMs: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
}

const DEFAULT_POOL_CONFIG: ModelPoolConfig = {
  maxConnections: 10,
  minConnections: 1,
  queueTimeoutMs: 30000,
  idleTimeoutMs: 120000,
  scaleUpThreshold: 0.8,
  scaleDownThreshold: 0.3,
};

class ModelConnectionPool extends EventEmitter {
  private modelId: string;
  private config: ModelPoolConfig;
  private slots: PoolSlot[] = [];
  private queue: QueueItem[] = [];
  private idleCheckInterval: ReturnType<typeof setInterval> | null = null;
  private _stats = {
    totalAcquired: 0,
    totalReleased: 0,
    totalQueueTimeouts: 0,
    totalPoolExhausted: 0,
    currentActive: 0,
    currentQueued: 0,
    peakActive: 0,
  };

  constructor(modelId: string, config?: Partial<ModelPoolConfig>) {
    super();
    this.modelId = modelId;
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    this.initializeMinSlots();
    this.startIdleCheck();
  }

  private initializeMinSlots() {
    for (let i = 0; i < this.config.minConnections; i++) {
      this.slots.push({
        id: `${this.modelId}-slot-${i}`,
        active: false,
        requestId: null,
        acquiredAt: null,
      });
    }
  }

  private startIdleCheck() {
    this.idleCheckInterval = setInterval(() => {
      this.tryScaleDown();
    }, 30000);
  }

  private tryScaleUp() {
    const currentCapacity = this.slots.length;
    const activeCount = this.slots.filter((s) => s.active).length;
    const utilization = currentCapacity > 0 ? activeCount / currentCapacity : 0;

    if (
      utilization >= this.config.scaleUpThreshold &&
      currentCapacity < this.config.maxConnections &&
      this.queue.length > 0
    ) {
      const newSlot: PoolSlot = {
        id: `${this.modelId}-slot-${currentCapacity}`,
        active: false,
        requestId: null,
        acquiredAt: null,
      };
      this.slots.push(newSlot);
      this.emit('scale-up', {
        modelId: this.modelId,
        newCapacity: this.slots.length,
        reason: `利用率${Math.round(utilization * 100)}%，扩容至${this.slots.length}连接`,
      });
      this.processQueue();
    }
  }

  private tryScaleDown() {
    const currentCapacity = this.slots.length;
    if (currentCapacity <= this.config.minConnections) return;

    const activeCount = this.slots.filter((s) => s.active).length;
    const utilization = currentCapacity > 0 ? activeCount / currentCapacity : 0;

    if (utilization < this.config.scaleDownThreshold) {
      const idleSlot = this.slots.find((s) => !s.active);
      if (idleSlot && this.slots.length > this.config.minConnections) {
        this.slots = this.slots.filter((s) => s.id !== idleSlot.id);
        this.emit('scale-down', {
          modelId: this.modelId,
          newCapacity: this.slots.length,
          reason: `利用率${Math.round(utilization * 100)}%，缩容至${this.slots.length}连接`,
        });
      }
    }
  }

  private processQueue() {
    while (this.queue.length > 0) {
      const freeSlot = this.slots.find((s) => !s.active);
      if (!freeSlot) break;

      const item = this.queue.shift()!;
      clearTimeout(item.timer);
      this.acquireSlot(freeSlot, item.requestId);
      item.resolve(freeSlot);
    }
  }

  private acquireSlot(slot: PoolSlot, requestId: string) {
    slot.active = true;
    slot.requestId = requestId;
    slot.acquiredAt = Date.now();
    this._stats.totalAcquired++;
    this._stats.currentActive = this.slots.filter((s) => s.active).length;
    if (this._stats.currentActive > this._stats.peakActive) {
      this._stats.peakActive = this._stats.currentActive;
    }
    this._stats.currentQueued = this.queue.length;
    this.emit('acquire', {
      modelId: this.modelId,
      slotId: slot.id,
      requestId,
      activeCount: this._stats.currentActive,
      queueLength: this.queue.length,
    });
  }

  async acquire(requestId: string): Promise<PoolSlot> {
    const freeSlot = this.slots.find((s) => !s.active);
    if (freeSlot) {
      this.acquireSlot(freeSlot, requestId);
      this.tryScaleUp();
      return freeSlot;
    }

    if (this.slots.length < this.config.maxConnections) {
      const newSlot: PoolSlot = {
        id: `${this.modelId}-slot-${this.slots.length}`,
        active: false,
        requestId: null,
        acquiredAt: null,
      };
      this.slots.push(newSlot);
      this.acquireSlot(newSlot, requestId);
      this.emit('scale-up', {
        modelId: this.modelId,
        newCapacity: this.slots.length,
        reason: `按需创建新连接，当前${this.slots.length}连接`,
      });
      return newSlot;
    }

    this._stats.totalPoolExhausted++;

    return new Promise<PoolSlot>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex((q) => q.id === requestId);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          this._stats.totalQueueTimeouts++;
          this._stats.currentQueued = this.queue.length;
          reject(new Error(`QUEUE_TIMEOUT:${this.modelId}`));
        }
      }, this.config.queueTimeoutMs);

      this.queue.push({
        id: requestId,
        requestId,
        modelId: this.modelId,
        resolve,
        reject,
        timer,
        enqueuedAt: Date.now(),
      });

      this._stats.currentQueued = this.queue.length;
      this.emit('queued', {
        modelId: this.modelId,
        requestId,
        queueLength: this.queue.length,
      });
    });
  }

  release(slot: PoolSlot): void {
    slot.active = false;
    slot.requestId = null;
    slot.acquiredAt = null;
    this._stats.totalReleased++;
    this._stats.currentActive = this.slots.filter((s) => s.active).length;
    this._stats.currentQueued = this.queue.length;
    this.emit('release', {
      modelId: this.modelId,
      slotId: slot.id,
      activeCount: this._stats.currentActive,
      queueLength: this.queue.length,
    });
    this.processQueue();
    this.tryScaleUp();
  }

  getStats() {
    return {
      modelId: this.modelId,
      ...this._stats,
      capacity: this.slots.length,
      queueLength: this.queue.length,
    };
  }

  destroy() {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }
    for (const item of this.queue) {
      clearTimeout(item.timer);
      item.reject(new Error('Pool destroyed'));
    }
    this.queue = [];
    this.removeAllListeners();
  }
}

class ConnectionPoolManager {
  private pools: Map<string, ModelConnectionPool> = new Map();
  private static instance: ConnectionPoolManager;

  private constructor() {}

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  getPool(modelId: string): ModelConnectionPool {
    if (!this.pools.has(modelId)) {
      const model = models.find((m) => m.id === modelId);
      const config: Partial<ModelPoolConfig> = {};
      if (model) {
        const baseLimit = model.rateLimit || 100;
        config.maxConnections = Math.max(Math.floor(baseLimit / 10), 5);
        config.minConnections = Math.max(Math.floor(config.maxConnections / 5), 1);
        config.queueTimeoutMs = 30000;
      }
      const pool = new ModelConnectionPool(modelId, config);
      pool.on('scale-up', (info) => console.log(`[Pool] 扩容: ${JSON.stringify(info)}`));
      pool.on('scale-down', (info) => console.log(`[Pool] 缩容: ${JSON.stringify(info)}`));
      pool.on('queued', (info) => console.log(`[Pool] 排队: ${JSON.stringify(info)}`));
      pool.on('pool-exhausted', (info) => console.warn(`[Pool] 连接池耗尽: ${JSON.stringify(info)}`));
      this.pools.set(modelId, pool);
    }
    return this.pools.get(modelId)!;
  }

  getAllStats() {
    const result: Record<string, any> = {};
    for (const [modelId, pool] of this.pools) {
      result[modelId] = pool.getStats();
    }
    return result;
  }

  removePool(modelId: string) {
    const pool = this.pools.get(modelId);
    if (pool) {
      pool.destroy();
      this.pools.delete(modelId);
    }
  }

  destroyAll() {
    for (const pool of this.pools.values()) {
      pool.destroy();
    }
    this.pools.clear();
  }
}

export { ModelConnectionPool, ConnectionPoolManager, DEFAULT_POOL_CONFIG };
export type { ModelPoolConfig, PoolSlot };
