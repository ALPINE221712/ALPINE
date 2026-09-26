import React from 'react';

export type StatusType =
  | 'Draft'
  | 'Waiting'
  | 'Ready'
  | 'Done'
  | 'Validated'
  | 'Completed'
  | 'Canceled'
  | 'Available'
  | 'Optimal'
  | 'Low Stock'
  | 'Near Limit'
  | 'Out of Stock'
  | 'Critical'
  | 'In-Transit'
  | 'In Picking'
  | 'Packing & Staged'
  | 'Ready to Pick'
  | 'Ready to Move'
  | 'Pending'
  | 'Pending Approval'
  | 'Dispatched'
  | 'On Hold'
  | 'Rejected'
  | 'Matched'
  | 'Shortage';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showDot = true }) => {
  const normalized = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (
    normalized.includes('done') ||
    normalized.includes('validated') ||
    normalized.includes('optimal') ||
    normalized.includes('available') ||
    normalized.includes('completed') ||
    normalized.includes('matched')
  ) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-600';
  } else if (
    normalized.includes('waiting') ||
    normalized.includes('low') ||
    normalized.includes('near limit') ||
    normalized.includes('hold') ||
    normalized.includes('reorder')
  ) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-600';
  } else if (
    normalized.includes('out of stock') ||
    normalized.includes('critical') ||
    normalized.includes('rejected') ||
    normalized.includes('error') ||
    normalized.includes('shortage') ||
    normalized.includes('depleted')
  ) {
    styles = 'bg-red-50 text-red-800 border-red-200';
    dotColor = 'bg-red-600';
  } else if (
    normalized.includes('ready') ||
    normalized.includes('transit') ||
    normalized.includes('picking') ||
    normalized.includes('packing') ||
    normalized.includes('dispatched') ||
    normalized.includes('pending')
  ) {
    styles = 'bg-blue-50 text-blue-800 border-blue-200';
    dotColor = 'bg-blue-600';
  } else if (normalized.includes('canceled')) {
    styles = 'bg-slate-100 text-slate-500 border-slate-200 line-through';
    dotColor = 'bg-slate-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${styles} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span className="truncate">{status}</span>
    </span>
  );
};

export default StatusBadge;
