import { Clock } from 'lucide-react';
import type { SLAStatus } from '@/lib/types';

function formatDuration(ms: number): string {
  const totalMins = Math.abs(Math.round(ms / 60000));
  if (totalMins < 60) return `${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

interface SLABadgeProps {
  slaResolveBy: string | null;
  slaStatus: SLAStatus | null;
}

export function SLABadge({ slaResolveBy, slaStatus }: SLABadgeProps) {
  if (!slaResolveBy || slaStatus === 'resolved' || slaStatus === null) return null;

  const diffMs = new Date(slaResolveBy).getTime() - Date.now();

  let text: string;
  let className: string;

  if (slaStatus === 'breached') {
    text = `${formatDuration(diffMs)} overdue`;
    className = 'bg-red-100 text-red-700 border-red-300';
  } else if (slaStatus === 'warning') {
    text = `${formatDuration(diffMs)} left`;
    className = 'bg-yellow-100 text-yellow-700 border-yellow-300';
  } else {
    text = `${formatDuration(diffMs)} left`;
    className = 'bg-green-100 text-green-700 border-green-300';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Clock className="h-3 w-3" />
      {text}
    </span>
  );
}
