import { useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  MessageSquare,
  Coins,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['#00d4ff', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Dashboard() {
  const {
    stats,
    trends,
    modelDistribution,
    callLogs,
    fetchStats,
    fetchTrends,
    fetchDistribution,
    fetchLogs,
  } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchTrends(7);
    fetchDistribution();
    fetchLogs({ limit: 10 });
  }, [fetchStats, fetchTrends, fetchDistribution, fetchLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="概览仪表盘"
        description="实时监控LLM网关运行状态、调用量、Token消耗与评估质量"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总调用次数"
          value={stats?.totalCalls || 0}
          suffix="次"
          change={stats?.callsChange}
          icon={<MessageSquare className="w-6 h-6 text-brand-accent" />}
        />
        <StatCard
          title="Token消耗总量"
          value={stats?.totalTokens || 0}
          suffix="tokens"
          change={stats?.tokensChange}
          icon={<Coins className="w-6 h-6 text-warning" />}
          iconBg="bg-warning-dim"
        />
        <StatCard
          title="平均响应延迟"
          value={stats?.avgLatencyMs || 0}
          suffix="ms"
          change={stats?.latencyChange}
          icon={<Clock className="w-6 h-6 text-success" />}
          iconBg="bg-success-dim"
        />
        <StatCard
          title="评估通过率"
          value={stats?.evalPassRate || 0}
          suffix="%"
          change={stats?.passRateChange}
          icon={<CheckCircle2 className="w-6 h-6 text-brand-accent" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-text-primary">调用趋势（7天）</h3>
              <p className="text-sm text-text-muted mt-0.5">调用量与Token消耗趋势</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="calls"
                  name="调用次数"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCalls)"
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  name="Token消耗"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTokens)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-text-primary">模型调用分布</h3>
            <p className="text-sm text-text-muted mt-0.5">各模型调用占比</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={modelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="modelName"
                >
                  {modelDistribution.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                  }}
                  formatter={(value: number, name: string) => [`${value} 次`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-text-primary">最近调用记录</h3>
              <p className="text-sm text-text-muted mt-0.5">最新10条调用日志</p>
            </div>
            <button
              onClick={() => navigate('/logs')}
              className="btn-ghost flex items-center gap-1 text-sm"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="table-header">时间</th>
                  <th className="table-header">模板</th>
                  <th className="table-header">模型</th>
                  <th className="table-header">延迟</th>
                  <th className="table-header">Tokens</th>
                  <th className="table-header">状态</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-white/5">
                    <td className="table-cell whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="table-cell max-w-[160px] truncate">
                      {log.templateName || '直接调用'}
                    </td>
                    <td className="table-cell">{log.modelName}</td>
                    <td className="table-cell">{log.latencyMs}ms</td>
                    <td className="table-cell">{log.response.usage.totalTokens.toLocaleString()}</td>
                    <td className="table-cell">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="mb-4">
            <h3 className="font-display font-semibold text-text-primary">模型评分排名</h3>
            <p className="text-sm text-text-muted mt-0.5">各模型平均评估得分</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelDistribution} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="modelName"
                  stroke="#64748b"
                  tick={{ fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                  }}
                  formatter={(value: number) => [`${value} 分`, '平均得分']}
                />
                <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                  {modelDistribution.map((_, i) => (
                    <Cell key={`bar-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
