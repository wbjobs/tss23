import { Router } from 'express';
import { templates, genId, assertions } from '../data/store.js';
import type { PromptTemplate, ModalityBlock } from '../../shared/types.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(templates);
});

router.post('/', (req, res) => {
  const data = req.body as Partial<PromptTemplate>;
  const newTpl: PromptTemplate = {
    id: genId(),
    name: data.name || 'New Template',
    description: data.description || '',
    version: 'v1.0.0',
    blocks: (data.blocks as ModalityBlock[]) || [{ id: genId(), type: 'text', content: '' }],
    variables: data.variables || [],
    supportedModels: data.supportedModels || [],
    tags: data.tags || [],
    createdBy: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  templates.push(newTpl);
  res.status(201).json(newTpl);
});

router.get('/:id', (req, res) => {
  const tpl = templates.find((t) => t.id === req.params.id);
  if (!tpl) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json(tpl);
});

router.put('/:id', (req, res) => {
  const idx = templates.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  templates[idx] = {
    ...templates[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  res.json(templates[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = templates.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  templates.splice(idx, 1);
  res.json({ success: true });
});

router.get('/:id/versions', (req, res) => {
  const tpl = templates.find((t) => t.id === req.params.id);
  if (!tpl) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json([
    {
      id: genId(),
      templateId: tpl.id,
      version: tpl.version,
      blocks: tpl.blocks,
      variables: tpl.variables,
      createdAt: tpl.updatedAt,
    },
    {
      id: genId(),
      templateId: tpl.id,
      version: 'v' + (parseFloat(tpl.version.replace('v', '')) - 0.1).toFixed(1) + '.0',
      blocks: tpl.blocks,
      variables: tpl.variables,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ]);
});

router.post('/:id/render', (req, res) => {
  const tpl = templates.find((t) => t.id === req.params.id);
  if (!tpl) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const variables = req.body.variables || {};
  const modelId = req.body.modelId;

  let rendered = '';
  for (const block of tpl.blocks) {
    if (block.type === 'text') {
      let content = block.content;
      for (const [k, v] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
      }
      rendered += `[TEXT BLOCK]\n${content}\n\n`;
    } else if (block.type === 'image') {
      rendered += `[IMAGE] url=${block.url} alt="${block.alt || ''}"\n\n`;
    } else if (block.type === 'table') {
      rendered += `[TABLE]\nHeaders: ${block.headers.join(', ')}\nRows: ${block.rows.length} rows\n\n`;
    } else if (block.type === 'pdf_summary') {
      rendered += `[PDF SUMMARY] file=${block.fileName} (${block.pages || '?'} pages)\n${block.summary}\n\n`;
    }
  }
  rendered += `\n--- Rendered for model: ${modelId || 'default'} ---`;
  res.json({ rendered });
});

router.get('/:id/assertions', (req, res) => {
  const result = assertions.filter((a) => a.templateId === req.params.id);
  res.json(result);
});

router.post('/:id/assertions', (req, res) => {
  const data = req.body;
  const newAssertion = {
    id: genId(),
    templateId: req.params.id,
    type: data.type || 'keyword_contains',
    name: data.name || 'New Rule',
    weight: data.weight || 10,
    enabled: data.enabled ?? true,
    config: data.config || {},
  };
  assertions.push(newAssertion);
  res.status(201).json(newAssertion);
});

export default router;
