import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import type { ModelConfig, ModelProvider } from '@shared/types';

const providers: { value: ModelProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI (GPT系列)' },
  { value: 'claude', label: 'Anthropic Claude' },
  { value: 'llama', label: 'Meta Llama (本地部署)' },
  { value: 'other', label: '其他 (兼容OpenAI协议)' },
];

const defaultForm: Partial<ModelConfig> = {
  name: '',
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  modelId: '',
  maxTokens: 4096,
  temperature: 0.7,
  enabled: true,
  rateLimit: 100,
};

export default function ModelForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { models, fetchModels, createModel, updateModel } = useAppStore();

  const [form, setForm] = useState<Partial<ModelConfig>>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchModels().then(() => {
        const existing = models.find((m) => m.id === id);
        if (existing) setForm(existing);
      });
    }
  }, [id, isEdit, fetchModels, models]);

  const handleChange = <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateModel(id!, form);
      } else {
        await createModel(form);
      }
      navigate('/models');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={isEdit ? '编辑模型配置' : '新增模型配置'}
        description={isEdit ? '修改已接入的大模型服务配置' : '接入新的大模型API服务到网关'}
        actions={
          <button className="btn-ghost flex items-center gap-2" onClick={() => navigate('/models')}>
            <ArrowLeft className="w-4 h-4" /> 返回列表
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="label">模型名称</label>
            <input
              className="input"
              placeholder="如: GPT-4 Turbo"
              value={form.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">模型供应商</label>
            <select
              className="input"
              value={form.provider}
              onChange={(e) => handleChange('provider', e.target.value as ModelProvider)}
            >
              {providers.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="label">API 基础地址</label>
            <input
              className="input"
              placeholder="https://api.openai.com/v1"
              value={form.baseUrl || ''}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">API Key</label>
            <input
              type="password"
              className="input font-mono"
              placeholder="sk-..."
              value={form.apiKey || ''}
              onChange={(e) => handleChange('apiKey', e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">模型 ID</label>
            <input
              className="input font-mono"
              placeholder="如: gpt-4-turbo-preview, claude-3-5-sonnet-20240620"
              value={form.modelId || ''}
              onChange={(e) => handleChange('modelId', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">最大输出 Tokens</label>
            <input
              type="number"
              className="input"
              value={form.maxTokens || 0}
              onChange={(e) => handleChange('maxTokens', Number(e.target.value))}
              min={1}
            />
          </div>

          <div>
            <label className="label">默认温度 (0-2)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={2}
              className="input"
              value={form.temperature ?? 0.7}
              onChange={(e) => handleChange('temperature', Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label">限流 (QPS)</label>
            <input
              type="number"
              className="input"
              value={form.rateLimit || 0}
              onChange={(e) => handleChange('rateLimit', Number(e.target.value))}
              min={1}
            />
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled ?? true}
                onChange={(e) => handleChange('enabled', e.target.checked)}
                className="w-4 h-4 rounded border-border bg-bg-secondary text-brand-accent focus:ring-brand-accent"
              />
              <span className="text-sm text-text-secondary">启用此模型</span>
            </label>
          </div>
        </div>

        <div className="divider" />

        <div className="flex items-center justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => navigate('/models')}>
            取消
          </button>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </form>
    </div>
  );
}
