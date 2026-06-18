import { create } from 'zustand';
import {
  type ModelConfig,
  type PromptTemplate,
  type CallLog,
  type StatsSummary,
  type TrendDataPoint,
  type ModelDistribution,
  type AssertionRule,
  type EvaluationReport,
  type GatewayChatRequest,
  type GatewayChatResponse,
  type GatewayErrorResponse,
  type ImageConstraints,
  GatewayErrorCode,
} from '@shared/types';

export class GatewayClientError extends Error {
  code: GatewayErrorCode;
  detail?: string;
  httpStatus: number;

  constructor(errorResponse: GatewayErrorResponse, httpStatus: number) {
    super(errorResponse.message);
    this.code = errorResponse.code;
    this.detail = errorResponse.detail;
    this.httpStatus = httpStatus;
    this.name = 'GatewayClientError';
  }

  isPoolError() {
    return this.code === GatewayErrorCode.POOL_EXHAUSTED || this.code === GatewayErrorCode.POOL_QUEUE_TIMEOUT;
  }

  isImageError() {
    return (
      this.code === GatewayErrorCode.IMAGE_TOO_LARGE ||
      this.code === GatewayErrorCode.IMAGE_FETCH_FAILED ||
      this.code === GatewayErrorCode.IMAGE_ENCODING_FAILED
    );
  }

  isRetryable() {
    return this.isPoolError() || this.code === GatewayErrorCode.INTERNAL_ERROR;
  }
}

interface AppState {
  models: ModelConfig[];
  templates: PromptTemplate[];
  callLogs: CallLog[];
  selectedLog: CallLog | null;
  stats: StatsSummary | null;
  trends: TrendDataPoint[];
  modelDistribution: ModelDistribution[];
  assertions: Record<string, AssertionRule[]>;
  reports: Record<string, EvaluationReport>;
  loading: Record<string, boolean>;
  sidebarCollapsed: boolean;
  imageConstraints: ImageConstraints | null;

  setSidebarCollapsed: (v: boolean) => void;
  fetchModels: () => Promise<void>;
  createModel: (data: Partial<ModelConfig>) => Promise<ModelConfig>;
  updateModel: (id: string, data: Partial<ModelConfig>) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  checkModelHealth: (id: string) => Promise<void>;

  fetchTemplates: () => Promise<void>;
  fetchTemplate: (id: string) => Promise<PromptTemplate | null>;
  createTemplate: (data: Partial<PromptTemplate>) => Promise<PromptTemplate>;
  updateTemplate: (id: string, data: Partial<PromptTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  renderTemplate: (id: string, variables: Record<string, any>, modelId: string) => Promise<string>;

  fetchAssertions: (templateId: string) => Promise<void>;
  createAssertion: (templateId: string, data: Partial<AssertionRule>) => Promise<AssertionRule>;
  updateAssertion: (id: string, data: Partial<AssertionRule>) => Promise<void>;
  deleteAssertion: (id: string) => Promise<void>;
  fetchReport: (templateId: string) => Promise<EvaluationReport>;

  fetchLogs: (params?: Record<string, any>) => Promise<void>;
  fetchLogDetail: (id: string) => Promise<CallLog>;
  fetchStats: () => Promise<void>;
  fetchTrends: (days?: number) => Promise<void>;
  fetchDistribution: () => Promise<void>;
  fetchImageConstraints: () => Promise<void>;

  gatewayChat: (req: GatewayChatRequest) => Promise<GatewayChatResponse>;
}

const asyncFetch = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    try {
      const errorBody = await res.json();
      if (errorBody && errorBody.code) {
        throw new GatewayClientError(errorBody as GatewayErrorResponse, res.status);
      }
    } catch (e) {
      if (e instanceof GatewayClientError) throw e;
    }
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
};

export const useAppStore = create<AppState>((set, get) => ({
  models: [],
  templates: [],
  callLogs: [],
  selectedLog: null,
  stats: null,
  trends: [],
  modelDistribution: [],
  assertions: {},
  reports: {},
  loading: {},
  sidebarCollapsed: false,
  imageConstraints: null,

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  fetchModels: async () => {
    set({ loading: { ...get().loading, models: true } });
    const data = await asyncFetch<ModelConfig[]>('/api/models');
    set({ models: data, loading: { ...get().loading, models: false } });
  },

  createModel: async (data) => {
    const res = await asyncFetch<ModelConfig>('/api/models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    set({ models: [...get().models, res] });
    return res;
  },

  updateModel: async (id, data) => {
    await asyncFetch(`/api/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    set({
      models: get().models.map((m) => (m.id === id ? { ...m, ...data } : m)),
    });
  },

  deleteModel: async (id) => {
    await asyncFetch(`/api/models/${id}`, { method: 'DELETE' });
    set({ models: get().models.filter((m) => m.id !== id) });
  },

  checkModelHealth: async (id) => {
    const res = await asyncFetch<{ status: string }>(`/api/models/${id}/health-check`, {
      method: 'POST',
    });
    set({
      models: get().models.map((m) =>
        m.id === id ? { ...m, healthStatus: res.status as any } : m
      ),
    });
  },

  fetchTemplates: async () => {
    set({ loading: { ...get().loading, templates: true } });
    const data = await asyncFetch<PromptTemplate[]>('/api/templates');
    set({ templates: data, loading: { ...get().loading, templates: false } });
  },

  fetchTemplate: async (id) => {
    return await asyncFetch<PromptTemplate>(`/api/templates/${id}`);
  },

  createTemplate: async (data) => {
    const res = await asyncFetch<PromptTemplate>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    set({ templates: [...get().templates, res] });
    return res;
  },

  updateTemplate: async (id, data) => {
    await asyncFetch(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    set({
      templates: get().templates.map((t) => (t.id === id ? { ...t, ...data } : t)),
    });
  },

  deleteTemplate: async (id) => {
    await asyncFetch(`/api/templates/${id}`, { method: 'DELETE' });
    set({ templates: get().templates.filter((t) => t.id !== id) });
  },

  renderTemplate: async (id, variables, modelId) => {
    const res = await asyncFetch<{ rendered: string }>(`/api/templates/${id}/render`, {
      method: 'POST',
      body: JSON.stringify({ variables, modelId }),
    });
    return res.rendered;
  },

  fetchAssertions: async (templateId) => {
    set({ loading: { ...get().loading, [`assertions_${templateId}`]: true } });
    const data = await asyncFetch<AssertionRule[]>(`/api/templates/${templateId}/assertions`);
    set({
      assertions: { ...get().assertions, [templateId]: data },
      loading: { ...get().loading, [`assertions_${templateId}`]: false },
    });
  },

  createAssertion: async (templateId, data) => {
    const res = await asyncFetch<AssertionRule>(`/api/templates/${templateId}/assertions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const current = get().assertions[templateId] || [];
    set({ assertions: { ...get().assertions, [templateId]: [...current, res] } });
    return res;
  },

  updateAssertion: async (id, data) => {
    await asyncFetch(`/api/assertions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const all = { ...get().assertions };
    for (const tid of Object.keys(all)) {
      all[tid] = all[tid].map((a) => (a.id === id ? { ...a, ...data } : a));
    }
    set({ assertions: all });
  },

  deleteAssertion: async (id) => {
    await asyncFetch(`/api/assertions/${id}`, { method: 'DELETE' });
    const all = { ...get().assertions };
    for (const tid of Object.keys(all)) {
      all[tid] = all[tid].filter((a) => a.id !== id);
    }
    set({ assertions: all });
  },

  fetchReport: async (templateId) => {
    const data = await asyncFetch<EvaluationReport>(`/api/evaluations/${templateId}/report`);
    set({ reports: { ...get().reports, [templateId]: data } });
    return data;
  },

  fetchLogs: async (params) => {
    set({ loading: { ...get().loading, logs: true } });
    const qs = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    const data = await asyncFetch<CallLog[]>(`/api/logs${qs}`);
    set({ callLogs: data, loading: { ...get().loading, logs: false } });
  },

  fetchLogDetail: async (id) => {
    const data = await asyncFetch<CallLog>(`/api/logs/${id}`);
    set({ selectedLog: data });
    return data;
  },

  fetchStats: async () => {
    const data = await asyncFetch<StatsSummary>('/api/stats/summary');
    set({ stats: data });
  },

  fetchTrends: async (days = 7) => {
    const data = await asyncFetch<TrendDataPoint[]>(`/api/stats/trends?days=${days}`);
    set({ trends: data });
  },

  fetchDistribution: async () => {
    const data = await asyncFetch<ModelDistribution[]>('/api/stats/distribution');
    set({ modelDistribution: data });
  },

  fetchImageConstraints: async () => {
    try {
      const data = await asyncFetch<ImageConstraints>('/api/gateway/constraints');
      set({ imageConstraints: data });
    } catch {
      set({
        imageConstraints: {
          MAX_IMAGE_SIZE_MB: 5,
          MAX_TOTAL_PAYLOAD_MB: 20,
          ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
          ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
        },
      });
    }
  },

  gatewayChat: async (req) => {
    return await asyncFetch<GatewayChatResponse>('/api/gateway/chat', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
}));
