import { Router } from 'express';
import { models, genId } from '../data/store.js';
import type { ModelConfig } from '../../shared/types.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(models);
});

router.post('/', (req, res) => {
  const data = req.body as Partial<ModelConfig>;
  const newModel: ModelConfig = {
    id: genId(),
    name: data.name || 'New Model',
    provider: data.provider || 'other',
    baseUrl: data.baseUrl || '',
    apiKey: data.apiKey || '',
    modelId: data.modelId || '',
    maxTokens: data.maxTokens || 4096,
    temperature: data.temperature ?? 0.7,
    enabled: data.enabled ?? true,
    rateLimit: data.rateLimit || 100,
    healthStatus: 'healthy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  models.push(newModel);
  res.status(201).json(newModel);
});

router.put('/:id', (req, res) => {
  const idx = models.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Model not found' });
    return;
  }
  models[idx] = { ...models[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json(models[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = models.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Model not found' });
    return;
  }
  models.splice(idx, 1);
  res.json({ success: true });
});

router.post('/:id/health-check', (req, res) => {
  const model = models.find((m) => m.id === req.params.id);
  if (!model) {
    res.status(404).json({ error: 'Model not found' });
    return;
  }
  const statuses: Array<'healthy' | 'degraded' | 'unhealthy'> = ['healthy', 'healthy', 'degraded'];
  model.healthStatus = statuses[Math.floor(Math.random() * statuses.length)];
  res.json({ status: model.healthStatus });
});

export default router;
