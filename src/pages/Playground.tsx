import { useEffect, useState } from 'react';
import {
  Play,
  RotateCcw,
  TerminalSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Coins,
  ChevronDown,
  Sparkles,
  Cpu,
  FileText,
  Zap,
  AlertCircle,
  RefreshCw,
  ImageOff,
  ServerCrash,
} from 'lucide-react';
import { useAppStore, GatewayClientError } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { GatewayChatResponse } from '@shared/types';
import { GatewayErrorCode } from '@shared/types';

interface ErrorDisplay {
  title: string;
  message: string;
  icon: any;
  color: string;
  bgClass: string;
  retryable: boolean;
  code: string;
}

function getErrorDisplay(err: GatewayClientError): ErrorDisplay {
  if (err.isPoolError()) {
    return {
      title: '连接池繁忙',
      message: err.message,
      icon: ServerCrash,
      color: 'text-warning',
      bgClass: 'bg-warning/10 border-warning/30',
      retryable: true,
      code: err.code,
    };
  }
  if (err.isImageError()) {
    return {
      title: '图片处理失败',
      message: err.message,
      icon: ImageOff,
      color: 'text-danger',
      bgClass: 'bg-danger/10 border-danger/30',
      retryable: false,
      code: err.code,
    };
  }
  switch (err.code) {
    case GatewayErrorCode.MODEL_NOT_FOUND:
      return {
        title: '模型未找到',
        message: err.message,
        icon: AlertCircle,
        color: 'text-danger',
        bgClass: 'bg-danger/10 border-danger/30',
        retryable: false,
        code: err.code,
      };
    case GatewayErrorCode.MODEL_DISABLED:
      return {
        title: '模型已禁用',
        message: err.message,
        icon: AlertCircle,
        color: 'text-warning',
        bgClass: 'bg-warning/10 border-warning/30',
        retryable: false,
        code: err.code,
      };
    case GatewayErrorCode.PAYLOAD_TOO_LARGE:
      return {
        title: '请求体过大',
        message: err.message,
        icon: ImageOff,
        color: 'text-danger',
        bgClass: 'bg-danger/10 border-danger/30',
        retryable: false,
        code: err.code,
      };
    case GatewayErrorCode.TEMPLATE_NOT_FOUND:
      return {
        title: '模板未找到',
        message: err.message,
        icon: AlertCircle,
        color: 'text-danger',
        bgClass: 'bg-danger/10 border-danger/30',
        retryable: false,
        code: err.code,
      };
    default:
      return {
        title: '内部错误',
        message: err.message,
        icon: AlertCircle,
        color: 'text-danger',
        bgClass: 'bg-danger/10 border-danger/30',
        retryable: true,
        code: err.code,
      };
  }
}

export default function Playground() {
  const { models, fetchModels, templates, fetchTemplates, gatewayChat } = useAppStore();

  const [templateId, setTemplateId] = useState('');
  const [modelId, setModelId] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [runEval, setRunEval] = useState(true);
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [manualPrompt, setManualPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GatewayChatResponse | null>(null);
  const [error, setError] = useState<ErrorDisplay | null>(null);
  const [history, setHistory] = useState<GatewayChatResponse[]>([]);

  useEffect(() => {
    fetchModels();
    fetchTemplates();
  }, [fetchModels, fetchTemplates]);

  useEffect(() => {
    if (models.length > 0 && !modelId) {
      setModelId(models[0].id);
    }
  }, [models, modelId]);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  useEffect(() => {
    if (selectedTemplate) {
      const vars: Record<string, any> = {};
      for (const v of selectedTemplate.variables) {
        vars[v.name] = v.defaultValue || '';
      }
      setVariables(vars);
      if (selectedTemplate.supportedModels.length > 0) {
        setModelId(selectedTemplate.supportedModels[0]);
      }
    }
  }, [selectedTemplate]);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await gatewayChat({
        templateId: templateId || undefined,
        modelId,
        variables: templateId ? variables : undefined,
        params: { temperature, maxTokens },
        runEvaluation: runEval && !!templateId,
      });
      setResult(res);
      setHistory([res, ...history].slice(0, 10));
    } catch (err: any) {
      if (err instanceof GatewayClientError) {
        setError(getErrorDisplay(err));
      } else {
        setError({
          title: '请求失败',
          message: err.message || '未知错误',
          icon: AlertCircle,
          color: 'text-danger',
          bgClass: 'bg-danger/10 border-danger/30',
          retryable: false,
          code: 'UNKNOWN',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setVariables({});
    setManualPrompt('');
  };

  const activeModels = selectedTemplate
    ? models.filter((m) => selectedTemplate.supportedModels.includes(m.id))
    : models.filter((m) => m.enabled);

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Playground"
        description="在线调试网关接口 - 选择模板/填写参数/实时查看模型响应与评估结果"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" /> 重置
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleRun}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" /> 调用中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> 执行调用
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
              <TerminalSquare className="w-5 h-5 text-brand-accent" /> 请求配置
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Prompt模板（可选）</label>
                <div className="relative">
                  <select
                    className="input pr-10 appearance-none"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    <option value="">不使用模板（手动输入）</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                {selectedTemplate && (
                  <p className="text-xs text-text-muted mt-1.5">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {selectedTemplate.description}
                  </p>
                )}
              </div>

              <div>
                <label className="label">模型</label>
                <div className="relative">
                  <select
                    className="input pr-10 appearance-none"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                  >
                    {activeModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                {models.find((m) => m.id === modelId) && (
                  <p className="text-xs text-text-muted mt-1.5">
                    <Cpu className="w-3 h-3 inline mr-1" />
                    {models.find((m) => m.id === modelId)?.provider.toUpperCase()} ·{' '}
                    {models.find((m) => m.id === modelId)?.modelId}
                  </p>
                )}
              </div>

              {!selectedTemplate && (
                <div>
                  <label className="label">Prompt 内容</label>
                  <textarea
                    className="input min-h-[140px] font-mono text-sm leading-relaxed"
                    placeholder="请输入要发送给模型的Prompt内容..."
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                  />
                </div>
              )}

              {selectedTemplate && selectedTemplate.variables.length > 0 && (
                <div>
                  <label className="label">模板变量</label>
                  <div className="space-y-2">
                    {selectedTemplate.variables.map((v) => (
                      <div key={v.name}>
                        <label className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                          <code className="text-brand-accent">{v.name}</code>
                          <span className="text-text-muted">({v.type})</span>
                          {v.required && <span className="text-danger">*</span>}
                        </label>
                        <input
                          className="input !py-1.5 text-sm font-mono"
                          placeholder={v.defaultValue ? `默认: ${v.defaultValue}` : '输入变量值...'}
                          value={variables[v.name] || ''}
                          onChange={(e) => setVariables({ ...variables, [v.name]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="divider" />

              <div>
                <label className="label flex justify-between">
                  <span>温度 Temperature</span>
                  <span className="font-mono text-brand-accent">{temperature.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-brand-accent"
                />
              </div>

              <div>
                <label className="label flex justify-between">
                  <span>最大输出 Tokens</span>
                  <span className="font-mono text-brand-accent">{maxTokens.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min={128}
                  max={8192}
                  step={128}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full accent-brand-accent"
                />
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={runEval}
                  onChange={(e) => setRunEval(e.target.checked)}
                  disabled={!templateId}
                  className="rounded border-border bg-bg-secondary text-brand-accent"
                />
                <span className={cn('text-sm', templateId ? 'text-text-secondary' : 'text-text-muted')}>
                  执行评估断言
                  {!templateId && <span className="text-xs ml-1">（需选择模板）</span>}
                </span>
              </label>
            </div>
          </div>

          {history.length > 0 && (
            <div className="card">
              <h3 className="font-display font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" /> 历史调用 ({history.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((h, i) => (
                  <button
                    key={h.id}
                    className="w-full text-left p-2 rounded-lg border border-border hover:border-border-hover hover:bg-white/5 transition-colors"
                    onClick={() => setResult(h)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-text-muted">#{i + 1} · {h.id.slice(0, 8)}</span>
                      <StatusBadge status="success" customLabel={`${h.latencyMs}ms`} />
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-1">{h.content}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card min-h-[600px] flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <h3 className="font-display font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-accent" /> 响应结果
            </h3>
            {result && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-accent" />
                  <span className="font-mono">{result.latencyMs}ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-warning" />
                  <span className="font-mono">{result.usage.totalTokens.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-brand-accent border-t-transparent animate-spin mx-auto mb-4" />
                <p className="text-text-secondary">正在调用模型API...</p>
                <p className="text-xs text-text-muted mt-1">请稍候，网关正在处理请求</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-md w-full">
                <div className={cn('p-6 rounded-xl border', error.bgClass)}>
                  <div className="flex items-start gap-4">
                    <error.icon className={cn('w-8 h-8 shrink-0', error.color)} />
                    <div className="flex-1 min-w-0">
                      <h4 className={cn('font-display font-semibold text-lg', error.color)}>{error.title}</h4>
                      <p className="text-sm text-text-secondary mt-2 leading-relaxed">{error.message}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <code className="text-xs px-2 py-1 rounded bg-bg-primary font-mono text-text-muted">{error.code}</code>
                      </div>
                      {error.retryable && (
                        <button
                          className="mt-4 btn-secondary flex items-center gap-2 text-sm"
                          onClick={handleRun}
                        >
                          <RefreshCw className="w-4 h-4" /> 重试请求
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="flex-1 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs text-text-muted mb-2">模型输出</p>
                <div className="code-block whitespace-pre-wrap text-sm leading-relaxed">
                  {result.content}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-muted mb-1">延迟</p>
                  <p className="font-mono font-bold text-lg text-brand-accent">{result.latencyMs}ms</p>
                </div>
                <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-muted mb-1">Prompt Tokens</p>
                  <p className="font-mono font-bold text-lg text-warning">
                    {result.usage.promptTokens.toLocaleString()}
                  </p>
                </div>
                <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-text-muted mb-1">Completion Tokens</p>
                  <p className="font-mono font-bold text-lg text-success">
                    {result.usage.completionTokens.toLocaleString()}
                  </p>
                </div>
              </div>

              {result.evaluation && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-brand-accent" /> 自动化评估结果
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'badge',
                          result.evaluation.passed ? 'bg-success-dim text-success' : 'bg-danger-dim text-danger'
                        )}
                      >
                        {result.evaluation.passed ? '评估通过' : '评估未通过'}
                      </span>
                      <span className="font-mono font-bold text-2xl text-brand-accent">
                        {result.evaluation.overallScore}
                        <span className="text-sm text-text-muted">/100</span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {result.evaluation.assertions.map((a) => (
                      <div
                        key={a.ruleId}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border',
                          a.passed ? 'border-success/30 bg-success-dim/20' : 'border-danger/30 bg-danger-dim/20'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {a.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-danger" />
                          )}
                          <span className="text-sm font-medium">{a.ruleName}</span>
                          {a.message && <span className="text-xs text-text-muted">— {a.message}</span>}
                        </div>
                        <span className="font-mono font-semibold text-sm">{a.score}分</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-text-muted">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium text-text-secondary">准备就绪</p>
                <p className="text-sm mt-1">配置左侧参数，点击「执行调用」开始测试</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
