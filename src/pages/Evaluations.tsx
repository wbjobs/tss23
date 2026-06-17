import { useEffect, useState } from 'react';
import { ClipboardCheck, BarChart3, ArrowRight, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import { cn } from '@/lib/utils';

interface TplEval {
  templateId: string;
  templateName: string;
  totalRuns: number;
  passRate: number;
  avgScore: number;
}

export default function Evaluations() {
  const navigate = useNavigate();
  const { templates, fetchTemplates, fetchReport, reports } = useAppStore();
  const [list, setList] = useState<TplEval[]>([]);

  useEffect(() => {
    fetchTemplates().then(async () => {
      const result: TplEval[] = [];
      for (const tpl of templates) {
        try {
          const report = reports[tpl.id] || (await fetchReport(tpl.id));
          result.push({
            templateId: tpl.id,
            templateName: tpl.name,
            totalRuns: report.totalRuns,
            passRate: report.passRate,
            avgScore: report.avgScore,
          });
        } catch {
          result.push({
            templateId: tpl.id,
            templateName: tpl.name,
            totalRuns: 0,
            passRate: 0,
            avgScore: 0,
          });
        }
      }
      setList(result);
    });
  }, [fetchTemplates, templates, fetchReport, reports]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="评估管道"
        description="配置断言规则，自动化评估模型输出质量，查看质量报告与趋势分析"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-secondary">已配置评估</p>
            <ClipboardCheck className="w-6 h-6 text-brand-accent" />
          </div>
          <h3 className="text-3xl font-display font-bold text-text-primary">{list.length}</h3>
          <p className="text-sm text-text-muted mt-1">个模板已关联断言规则</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-secondary">总评估执行</p>
            <BarChart3 className="w-6 h-6 text-success" />
          </div>
          <h3 className="text-3xl font-display font-bold text-text-primary">
            {list.reduce((s, x) => s + x.totalRuns, 0).toLocaleString()}
          </h3>
          <p className="text-sm text-text-muted mt-1">次累计评估运行</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-secondary">平均通过率</p>
            <CheckCircle2 className="w-6 h-6 text-warning" />
          </div>
          <h3 className="text-3xl font-display font-bold text-text-primary">
            {list.length > 0 ? Math.round(list.reduce((s, x) => s + x.passRate, 0) / list.length) : 0}%
          </h3>
          <p className="text-sm text-text-muted mt-1">整体评估通过率</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary/50">
              <th className="table-header text-left">模板名称</th>
              <th className="table-header text-left">执行次数</th>
              <th className="table-header text-left">通过率</th>
              <th className="table-header text-left">平均得分</th>
              <th className="table-header text-left">质量状态</th>
              <th className="table-header text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.templateId} className="border-b border-border/50 hover:bg-white/5">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-accent" />
                    <span className="font-medium text-text-primary">{item.templateName}</span>
                  </div>
                </td>
                <td className="table-cell">{item.totalRuns.toLocaleString()}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-bg-tertiary overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          item.passRate >= 80
                            ? 'bg-success'
                            : item.passRate >= 60
                              ? 'bg-warning'
                              : 'bg-danger'
                        )}
                        style={{ width: `${item.passRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.passRate}%</span>
                  </div>
                </td>
                <td className="table-cell">
                  <span
                    className={cn(
                      'font-mono font-bold',
                      item.avgScore >= 80
                        ? 'text-success'
                        : item.avgScore >= 60
                          ? 'text-warning'
                          : 'text-danger'
                    )}
                  >
                    {item.avgScore}
                  </span>
                  <span className="text-text-muted">/100</span>
                </td>
                <td className="table-cell">
                  {item.passRate >= 80 ? (
                    <span className="badge bg-success-dim text-success">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> 优秀
                    </span>
                  ) : item.passRate >= 60 ? (
                    <span className="badge bg-warning-dim text-warning">
                      <AlertTriangle className="w-3 h-3 mr-1" /> 待优化
                    </span>
                  ) : (
                    <span className="badge bg-danger-dim text-danger">
                      <AlertTriangle className="w-3 h-3 mr-1" /> 需修复
                    </span>
                  )}
                </td>
                <td className="table-cell text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="btn-ghost !py-1 !px-3 text-xs"
                      onClick={() => navigate(`/evaluations/${item.templateId}`)}
                    >
                      规则配置
                    </button>
                    <button
                      className="btn-secondary !py-1 !px-3 text-xs flex items-center gap-1"
                      onClick={() => navigate(`/evaluations/${item.templateId}/report`)}
                    >
                      查看报告 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
