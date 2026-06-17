import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  change?: number;
  icon: ReactNode;
  iconBg?: string;
}

export default function StatCard({
  title,
  value,
  suffix,
  change,
  icon,
  iconBg = 'bg-brand-accentDim',
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-secondary mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-display font-bold text-text-primary">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
            {suffix && <span className="text-sm text-text-muted">{suffix}</span>}
          </div>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-danger" />
          )}
          <span className={cn('text-sm font-medium', isPositive ? 'text-success' : 'text-danger')}>
            {isPositive ? '+' : ''}
            {change}%
          </span>
          <span className="text-sm text-text-muted">较上周</span>
        </div>
      )}
    </div>
  );
}
