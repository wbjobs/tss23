import { Router } from 'express';
import { callLogs } from '../data/store.js';

const router = Router();

router.get('/', (req, res) => {
  const { modelId, templateId, status, keyword, limit = 50 } = req.query;
  let result = [...callLogs];

  if (modelId) result = result.filter((l) => l.modelId === modelId);
  if (templateId) result = result.filter((l) => l.templateId === templateId);
  if (status) result = result.filter((l) => l.status === status);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    result = result.filter(
      (l) =>
        l.response.content.toLowerCase().includes(kw) ||
        l.request.prompt.toLowerCase().includes(kw) ||
        (l.templateName || '').toLowerCase().includes(kw)
    );
  }

  res.json(result.slice(0, Number(limit)));
});

router.get('/:id', (req, res) => {
  const log = callLogs.find((l) => l.id === req.params.id);
  if (!log) {
    res.status(404).json({ error: 'Log not found' });
    return;
  }
  res.json(log);
});

export default router;
