import { Router } from 'express';
import { getStatsSummary, getTrends, getDistribution } from '../data/store.js';

const router = Router();

router.get('/summary', (_req, res) => {
  res.json(getStatsSummary());
});

router.get('/trends', (req, res) => {
  const days = Number(req.query.days) || 7;
  res.json(getTrends(days));
});

router.get('/distribution', (_req, res) => {
  res.json(getDistribution());
});

export default router;
