import type { IssueSeverity } from '@/lib/types';

const config: Record<IssueSeverity, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-300' },
  high:     { label: 'High',     className: 'bg-orange-100 text-orange-700 border-orange-300' },
  low:      { label: 'Low',      className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  minor:    { label: 'Minor',    className: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  const { label, className } = config[severity] ?? config.low;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}
