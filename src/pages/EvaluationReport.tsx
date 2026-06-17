import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ListChecks,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import type { EvaluationReport } from '@shared/types';

const SCORE_COLORS = ['#ef4444', '#f59e0b', '#0ea5e9', '#10b981', '#22c55e'];

export default function EvaluationReport() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { fetchReport, reports, templates, fetchTemplates } = useAppStore();
  const [report, setReport] = useState<EvaluationReport | null>(null);

  useEffect(() => {
    fetchTemplates();
    if (templateId) {
      fetchReport(templateId).then(setReport);
    }
  }, [templateId, fetchReport, reports, fetchTemplates]);

  const tpl = templates.find((t) => t.id === templateId);

  if (!report) {
    return <div className="text-text-muted p-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`评估报告: ${tpl?.name || report.templateName}`}
        description="模板质量评估分析 - 通过率、得分分布、失败原因与历史趋势"
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => navigate('/evaluations')}
            >
              <ArrowLeft className="w-4 h-4" /> 返回列表
            </button>
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => navigate(`/evaluations/${templateId}`)}
            >
              <ListChecks className="w-4 h-4" /> 编辑规则
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-secondary">总评估次数</p>
            <BarChart3 className="w-6 h-6 text-brand-accent" />
          </div>
          <h3 className="text-3xl font-display font-bold text-text-primary">
            {report.totalRuns.toLocaleString()}
          </h3>
          <p className="text-sm text-text-muted mt-1">累计运行</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-secondary">评估通过率</p>
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <h3
            className={cn(
              'text-3xl font-display font-bold',
              report.passRate >= 80 ? 'text-success' : report.passRate >= 60 ? 'text-warning' : 'text-danger'
            )}
          >
            {report.passRate}%
          </h3>
          <div className="w-full h-2 rounded-full bg-bg-tertiary mt-3 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                report.passRate >= 80 ? 'bg-success' : report.passRate >= 60 ? 'bg-warning' : 'bg-danger'
              )}
              style={{ width: `${report.passRate}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-secondary">平均得分</p>
            <TrendingUp className="w-6 h-6 text-warning" />
          </div>
          <h3
            className={cn(
              'text-3xl font-display font-bold',
              report.avgScore >= 80 ? 'text-success' : report.avgScore >= 60 ? 'text-warning' : 'text-danger'
            )}
          >
            {report.avgScore}
            <span className="text-lg text-text-muted">/100</span>
          </h3>
          <p className="text-sm text-text-muted mt-1">质量评分</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-text-secondary">失败断言</p>
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <h3 className="text-3xl font-display font-bold text-danger">
            {report.failureReasons.reduce((s, r) => s + r.count, 0)}
          </h3>
          <p className="text-sm text-text-muted mt-1">项规则未通过</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-display font-semibold text-text-primary mb-4">历史趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.history} margin={{ top: 10, right: 20 }}>
                <defs>
                  <linearGradient id="passRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Line
                  type="monotone"
                  dataKey="passRate"
                  name="通过率(%)"
                  stroke="#00d4ff"
                  strokeWidth={2.5}
                  dot={{ fill: '#00d4ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  name="平均得分"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-display font-semibold text-text-primary mb-4">得分分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.scoreDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="range"
                >
                  {report.scoreDistribution.map((_, i) => (
                    <Cell key={`c-${i}`} fill={SCORE_COLORS[i % SCORE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-display font-semibold text-text-primary mb-4">失败原因统计</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.failureReasons} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="ruleName"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} name="失败次数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-display font-semibold text-text-primary mb-4">各分数段详情</h3>
          <div className="space-y-3">
            {report.scoreDistribution.map((s, i) => (
              <div key={s.range}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-secondary">{s.range} 分</span>
                  <span className="text-sm font-mono text-text-primary">{s.count} 次</span>
                </div>
                <div className="h-2.5 rounded-full bg-bg-tertiary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${report.totalRuns > 0 ? (s.count / report.totalRuns) * 100 : 0}%`,
                      backgroundColor: SCORE_COLORS[i % SCORE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
