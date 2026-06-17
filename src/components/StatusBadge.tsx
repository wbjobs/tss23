import { cn } from '@/lib/utils';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  success: { bg: 'bg-success-dim', text: 'text-success', label: '成功' },
  error: { bg: 'bg-danger-dim', text: 'text-danger', label: '失败' },
  rate_limited: { bg: 'bg-warning-dim', text: 'text-warning', label: '限流' },
  healthy: { bg: 'bg-success-dim', text: 'text-success', label: '正常' },
  degraded: { bg: 'bg-warning-dim', text: 'text-warning', label: '降级' },
  unhealthy: { bg: 'bg-danger-dim', text: 'text-danger', label: '异常' },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export default function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const cfg = statusConfig[status] || statusConfig.success;
  return (
    <span className={cn('badge', cfg.bg, cfg.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', cfg.text.replace('text-', 'bg-'))} />
      {customLabel || cfg.label}
    </span>
  );
}
