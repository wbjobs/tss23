import { Router } from 'express';
import { getEvaluationReport, templates } from '../data/store.js';

const router = Router();

router.get('/', (_req, res) => {
  const result = templates.map((t) => ({
    templateId: t.id,
    templateName: t.name,
    ...getEvaluationReport(t.id),
  }));
  res.json(result);
});

router.get('/:templateId/report', (req, res) => {
  const report = getEvaluationReport(req.params.templateId);
  res.json(report);
});

export default router;
