import { useEffect, useState } from 'react';
import { Search, ChevronDown, X, CheckCircle2, AlertTriangle, Clock, Coins, Cpu, FileText } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import type { CallLog } from '@shared/types';

export default function Logs() {
  const { callLogs, fetchLogs, models, fetchModels, templates, fetchTemplates, selectedLog, fetchLogDetail } =
    useAppStore();

  const [keyword, setKeyword] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
    fetchTemplates();
    handleSearch();
  }, [fetchModels, fetchTemplates]);

  const handleSearch = () => {
    const params: Record<string, any> = { limit: 100 };
    if (keyword) params.keyword = keyword;
    if (modelFilter) params.modelId = modelFilter;
    if (statusFilter) params.status = statusFilter;
    fetchLogs(params);
  };

  const getDetail = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    await fetchLogDetail(id);
    setExpandedId(id);
  };

  const clearFilters = () => {
    setKeyword('');
    setModelFilter('');
    setStatusFilter('');
    fetchLogs({ limit: 100 });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="调用日志"
        description="基于Elasticsearch的全量调用日志检索，支持多条件过滤与详情查看"
      />

      <div className="card">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="input pl-10"
              placeholder="搜索请求内容、响应内容、模板名称..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="relative">
            <select
              className="input pr-10 appearance-none min-w-[180px]"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            >
              <option value="">全部模型</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="input pr-10 appearance-none min-w-[140px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="success">成功</option>
              <option value="error">失败</option>
              <option value="rate_limited">限流</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <button className="btn-primary" onClick={handleSearch}>
            检索
          </button>
          {(keyword || modelFilter || statusFilter) && (
            <button className="btn-ghost flex items-center gap-1" onClick={clearFilters}>
              <X className="w-4 h-4" /> 清除
            </button>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="table-header w-10"></th>
                <th className="table-header">时间</th>
                <th className="table-header">模板/调用方</th>
                <th className="table-header">模型</th>
                <th className="table-header">延迟</th>
                <th className="table-header">Tokens</th>
                <th className="table-header">评估</th>
                <th className="table-header">状态</th>
              </tr>
            </thead>
            <tbody>
              {callLogs.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  expanded={expandedId === log.id}
                  detail={expandedId === log.id ? selectedLog : null}
                  onToggle={() => getDetail(log.id)}
                />
              ))}
              {callLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-text-muted">
                    暂无调用日志
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LogRow({
  log,
  expanded,
  detail,
  onToggle,
}: {
  log: CallLog;
  expanded: boolean;
  detail: CallLog | null;
  onToggle: () => void;
}) {
  const showDetail = detail || log;
  return (
    <>
      <tr
        className={cn('border-b border-border/50 hover:bg-white/5 cursor-pointer', expanded && 'bg-white/5')}
        onClick={onToggle}
      >
        <td className="table-cell">
          <ChevronDown
            className={cn('w-4 h-4 text-text-muted transition-transform', expanded && 'rotate-180')}
          />
        </td>
        <td className="table-cell whitespace-nowrap text-text-secondary">
          {new Date(log.timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </td>
        <td className="table-cell">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-accent" />
            <div>
              <p className="text-sm font-medium text-text-primary">{log.templateName || '直接调用'}</p>
              <p className="text-xs text-text-muted">by {log.calledBy}</p>
            </div>
          </div>
        </td>
        <td className="table-cell">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-text-muted" />
            <span className="text-sm">{log.modelName || log.modelId}</span>
          </div>
        </td>
        <td className="table-cell">
          <span className="font-mono text-sm">{log.latencyMs}ms</span>
        </td>
        <td className="table-cell">
          <div className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-warning" />
            <span className="font-mono text-sm">{log.response.usage.totalTokens.toLocaleString()}</span>
          </div>
        </td>
        <td className="table-cell">
          {log.evaluation ? (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'font-mono font-bold text-sm',
                  log.evaluation.overallScore >= 80
                    ? 'text-success'
                    : log.evaluation.overallScore >= 60
                      ? 'text-warning'
                      : 'text-danger'
                )}
              >
                {log.evaluation.overallScore}
              </span>
              {log.evaluation.passed ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-danger" />
              )}
            </div>
          ) : (
            <span className="text-text-muted text-xs">未评估</span>
          )}
        </td>
        <td className="table-cell">
          <StatusBadge status={log.status} />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-bg-secondary/30 border-b border-border">
          <td colSpan={8} className="p-4" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-accent" /> 请求信息
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-text-muted w-20 flex-shrink-0">请求ID:</span>
                    <code className="text-text-secondary font-mono text-xs">{showDetail.id}</code>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-text-muted w-20 flex-shrink-0">模态:</span>
                    <div className="flex flex-wrap gap-1">
                      {showDetail.request.modalities.map((m) => (
                        <span key={m} className="badge bg-bg-tertiary/50 text-text-secondary text-xs">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-text-muted mb-1">Prompt内容:</p>
                    <div className="code-block text-xs max-h-32">{showDetail.request.prompt}</div>
                  </div>
                  {Object.keys(showDetail.request.variables).length > 0 && (
                    <div>
                      <p className="text-text-muted mb-1">模板变量:</p>
                      <div className="code-block text-xs">
                        {JSON.stringify(showDetail.request.variables, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-success" /> 响应信息
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-bg-tertiary/30 rounded-lg p-2 text-center">
                      <Clock className="w-4 h-4 mx-auto text-brand-accent mb-0.5" />
                      <p className="text-xs text-text-muted">延迟</p>
                      <p className="font-mono font-semibold">{showDetail.latencyMs}ms</p>
                    </div>
                    <div className="bg-bg-tertiary/30 rounded-lg p-2 text-center">
                      <Coins className="w-4 h-4 mx-auto text-warning mb-0.5" />
                      <p className="text-xs text-text-muted">Prompt</p>
                      <p className="font-mono font-semibold">
                        {showDetail.response.usage.promptTokens.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-bg-tertiary/30 rounded-lg p-2 text-center">
                      <Coins className="w-4 h-4 mx-auto text-success mb-0.5" />
                      <p className="text-xs text-text-muted">Completion</p>
                      <p className="font-mono font-semibold">
                        {showDetail.response.usage.completionTokens.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-text-muted mb-1">模型输出:</p>
                    <div className="code-block text-xs max-h-40 whitespace-pre-wrap">
                      {showDetail.status === 'error' ? showDetail.errorMessage : showDetail.response.content}
                    </div>
                  </div>
                </div>
              </div>

              {showDetail.evaluation && (
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent" /> 评估结果
                    <span
                      className={cn(
                        'ml-2 badge',
                        showDetail.evaluation.passed ? 'bg-success-dim text-success' : 'bg-danger-dim text-danger'
                      )}
                    >
                      {showDetail.evaluation.passed ? '通过' : '未通过'}
                    </span>
                    <span className="ml-auto font-mono font-bold text-lg text-brand-accent">
                      {showDetail.evaluation.overallScore}/100
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {showDetail.evaluation.assertions.map((a) => (
                      <div
                        key={a.ruleId}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border',
                          a.passed ? 'border-success/30 bg-success-dim/30' : 'border-danger/30 bg-danger-dim/30'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {a.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-danger" />
                          )}
                          <span className="text-sm text-text-primary">{a.ruleName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {a.message && <span className="text-xs text-text-muted max-w-[200px] truncate">{a.message}</span>}
                          <span className="font-mono text-sm font-semibold">
                            {a.score}分
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
