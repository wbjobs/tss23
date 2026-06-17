import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Type,
  AlertOctagon,
  Braces,
  Regex,
  Heart,
  Code2,
  BarChart3,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import type { AssertionRule, AssertionType } from '@shared/types';

const ruleTypes: { value: AssertionType; label: string; icon: any; desc: string }[] = [
  { value: 'keyword_contains', label: '关键词包含', icon: Type, desc: '输出必须包含指定关键词' },
  { value: 'keyword_excludes', label: '关键词排除', icon: AlertOctagon, desc: '输出不得包含指定关键词' },
  { value: 'json_schema', label: 'JSON Schema校验', icon: Braces, desc: '输出必须符合指定JSON Schema' },
  { value: 'regex_match', label: '正则匹配', icon: Regex, desc: '输出必须匹配正则表达式' },
  { value: 'sentiment', label: '情感倾向', icon: Heart, desc: '检测输出的情感倾向' },
  { value: 'custom_script', label: '自定义脚本', icon: Code2, desc: '编写JavaScript自定义评估逻辑' },
];

export default function EvaluationEditor() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { templates, fetchTemplates, assertions, fetchAssertions, createAssertion, updateAssertion, deleteAssertion } =
    useAppStore();

  const [rules, setRules] = useState<AssertionRule[]>([]);

  useEffect(() => {
    fetchTemplates();
    if (templateId) {
      fetchAssertions(templateId).then(() => {
        setRules(assertions[templateId] || []);
      });
    }
  }, [templateId, fetchTemplates, fetchAssertions, assertions]);

  const tpl = templates.find((t) => t.id === templateId);
  const currentRules = assertions[templateId || ''] || rules;
  const totalWeight = currentRules.reduce((s, r) => s + r.weight, 0);

  const handleAddRule = async (type: AssertionType) => {
    if (!templateId) return;
    const defaultConfigs: Record<AssertionType, any> = {
      keyword_contains: { keywords: [] },
      keyword_excludes: { keywords: [] },
      json_schema: {
        schema: { type: 'object', properties: {}, required: [] },
      },
      regex_match: { pattern: '' },
      sentiment: { expected: 'positive_or_neutral' },
      custom_script: { code: '// return true if passed, false otherwise\nfunction evaluate(output) {\n  return true;\n}' },
    };
    await createAssertion(templateId, {
      type,
      name: ruleTypes.find((r) => r.value === type)?.label || '新规则',
      weight: 10,
      enabled: true,
      config: defaultConfigs[type],
    });
  };

  const handleUpdate = async (ruleId: string, updates: Partial<AssertionRule>) => {
    await updateAssertion(ruleId, updates);
  };

  const handleDelete = async (ruleId: string) => {
    await deleteAssertion(ruleId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`评估规则: ${tpl?.name || '...'}`}
        description="为该模板配置自动化断言规则，网关调用后将自动执行质量评估"
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => navigate('/evaluations')}
            >
              <ArrowLeft className="w-4 h-4" /> 返回
            </button>
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => navigate(`/evaluations/${templateId}/report`)}
            >
              <BarChart3 className="w-4 h-4" /> 查看报告
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card !p-4">
          <p className="text-xs text-text-muted">规则数量</p>
          <p className="text-2xl font-display font-bold text-text-primary mt-1">{currentRules.length}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-text-muted">总权重</p>
          <p className="text-2xl font-display font-bold text-text-primary mt-1">{totalWeight}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-text-muted">已启用规则</p>
          <p className="text-2xl font-display font-bold text-text-primary mt-1">
            {currentRules.filter((r) => r.enabled).length}
          </p>
        </div>
        <div className="card !p-4">
          <p className="text-xs text-text-muted">及格线</p>
          <p className="text-2xl font-display font-bold text-brand-accent mt-1">60分</p>
        </div>
      </div>

      <div className="card">
        <h3 className="font-display font-semibold text-text-primary mb-4">快速添加规则</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ruleTypes.map((rt) => (
            <button
              key={rt.value}
              onClick={() => handleAddRule(rt.value)}
              className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-bg-secondary/30 hover:border-border-hover hover:bg-bg-secondary/60 transition-all text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-brand-accentDim flex items-center justify-center group-hover:bg-brand-accent/30 transition-colors">
                <rt.icon className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{rt.label}</p>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{rt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {currentRules.length === 0 ? (
          <div className="card text-center py-16">
            <Plus className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-40" />
            <p className="text-text-muted">还没有配置断言规则，点击上方类型快速添加</p>
          </div>
        ) : (
          currentRules.map((rule, idx) => {
            const meta = ruleTypes.find((t) => t.value === rule.type);
            const Icon = meta?.icon || Code2;
            return (
              <div key={rule.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <GripVertical className="w-5 h-5 text-text-muted cursor-grab" />
                    <span className="text-xs font-mono text-text-muted">#{idx + 1}</span>
                  </div>

                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', rule.enabled ? 'bg-brand-accentDim' : 'bg-bg-tertiary/50')}>
                    <Icon className={cn('w-5 h-5', rule.enabled ? 'text-brand-accent' : 'text-text-muted')} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        className="input max-w-xs !py-1.5 text-sm font-medium"
                        value={rule.name}
                        onChange={(e) => handleUpdate(rule.id, { name: e.target.value })}
                      />
                      <span className="badge bg-bg-tertiary/50 text-text-secondary">{meta?.label}</span>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={(e) => handleUpdate(rule.id, { enabled: e.target.checked })}
                          className="rounded border-border bg-bg-secondary"
                        />
                        <span className="text-xs text-text-secondary">启用</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      {(rule.type === 'keyword_contains' || rule.type === 'keyword_excludes') && (
                        <KeywordConfig
                          keywords={rule.config.keywords || []}
                          onChange={(keywords) => handleUpdate(rule.id, { config: { ...rule.config, keywords } })}
                        />
                      )}

                      {rule.type === 'json_schema' && (
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">JSON Schema</label>
                          <textarea
                            className="input font-mono text-xs min-h-[120px]"
                            value={JSON.stringify(rule.config.schema, null, 2)}
                            onChange={(e) => {
                              try {
                                handleUpdate(rule.id, { config: { ...rule.config, schema: JSON.parse(e.target.value) } });
                              } catch {}
                            }}
                          />
                        </div>
                      )}

                      {rule.type === 'regex_match' && (
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">正则表达式</label>
                          <input
                            className="input font-mono text-sm"
                            placeholder="例如: ^[A-Z][a-z]+$"
                            value={rule.config.pattern || ''}
                            onChange={(e) => handleUpdate(rule.id, { config: { ...rule.config, pattern: e.target.value } })}
                          />
                        </div>
                      )}

                      {rule.type === 'sentiment' && (
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">期望情感倾向</label>
                          <select
                            className="input max-w-xs"
                            value={rule.config.expected || 'positive_or_neutral'}
                            onChange={(e) => handleUpdate(rule.id, { config: { ...rule.config, expected: e.target.value } })}
                          >
                            <option value="positive">必须正面</option>
                            <option value="positive_or_neutral">正面或中性</option>
                            <option value="negative">必须负面</option>
                          </select>
                        </div>
                      )}

                      {rule.type === 'custom_script' && (
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">自定义评估脚本 (JS)</label>
                          <textarea
                            className="input font-mono text-xs min-h-[140px]"
                            value={rule.config.code || ''}
                            onChange={(e) => handleUpdate(rule.id, { config: { ...rule.config, code: e.target.value } })}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <div>
                          <label className="text-xs text-text-muted mb-1 block">权重分</label>
                          <input
                            type="number"
                            className="input w-24 !py-1.5 text-sm"
                            value={rule.weight}
                            min={0}
                            max={100}
                            onChange={(e) => handleUpdate(rule.id, { weight: Number(e.target.value) })}
                          />
                        </div>
                        <div className="text-xs text-text-muted pt-5">
                          占比: {totalWeight > 0 ? Math.round((rule.weight / totalWeight) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function KeywordConfig({ keywords, onChange }: { keywords: string[]; onChange: (k: string[]) => void }) {
  const [val, setVal] = useState('');
  return (
    <div>
      <label className="text-xs text-text-muted mb-1.5 block">关键词列表（空格或逗号分隔批量添加）</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {keywords.map((kw, i) => (
          <span key={i} className="badge bg-brand-accentDim text-brand-accent">
            {kw}
            <button
              className="ml-1.5 hover:text-white"
              onClick={() => onChange(keywords.filter((_, idx) => idx !== i))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1 !py-1.5 text-sm"
          placeholder="输入关键词后回车添加..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const parts = val.split(/[\s,，]+/).filter(Boolean);
              if (parts.length) {
                onChange([...new Set([...keywords, ...parts])]);
                setVal('');
              }
            }
          }}
        />
        <button
          className="btn-secondary !py-1.5 text-sm"
          onClick={() => {
            const parts = val.split(/[\s,，]+/).filter(Boolean);
            if (parts.length) {
              onChange([...new Set([...keywords, ...parts])]);
              setVal('');
            }
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
