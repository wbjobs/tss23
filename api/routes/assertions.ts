import { Router } from 'express';
import { assertions } from '../data/store.js';

const router = Router();

router.put('/:id', (req, res) => {
  const idx = assertions.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Assertion not found' });
    return;
  }
  assertions[idx] = { ...assertions[idx], ...req.body };
  res.json(assertions[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = assertions.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Assertion not found' });
    return;
  }
  assertions.splice(idx, 1);
  res.json({ success: true });
});

export default router;
