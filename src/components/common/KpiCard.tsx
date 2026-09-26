import React from 'react';
import { Icon } from './Icon';

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: string;
  trend?: {
    text: string;
    isPositive?: boolean;
    isError?: boolean;
  };
  children?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  children,
}) => {
  return (
    <div className="bg-surface-container-lowest p-3.5 rounded-lg border border-outline-variant shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
          {label}
        </span>
        {icon && (
          <span className="p-1 rounded bg-surface-container text-primary flex items-center justify-center">
            <Icon name={icon} className="text-base text-primary" />
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-tabular-kpi text-tabular-kpi text-on-surface tracking-tight font-mono tabular-nums">
          {value}
        </span>
        {subtext && <span className="font-body-sm text-body-sm text-on-surface-variant">{subtext}</span>}
      </div>

      {trend && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span
            className={`font-label-sm text-label-sm font-semibold flex items-center gap-1 ${
              trend.isError
                ? 'text-error'
                : trend.isPositive
                ? 'text-tertiary'
                : 'text-on-surface-variant'
            }`}
          >
            {trend.text}
          </span>
        </div>
      )}

      {children && <div className="mt-2">{children}</div>}
    </div>
  );
};

export default KpiCard;
