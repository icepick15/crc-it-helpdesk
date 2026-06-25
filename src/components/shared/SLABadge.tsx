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
  slaStatus: SLAStatus | null;
  createdAt: string;       // always needed — used for the claim countdown
  slaResolveBy?: string | null; // only set after claiming
}

export function SLABadge({ slaStatus, createdAt, slaResolveBy }: SLABadgeProps) {
  if (!slaStatus || slaStatus === 'resolved') return null;

  // ── Phase 1: claim window ─────────────────────────────────────────────────
  if (slaStatus === 'unclaimed' || slaStatus === 'unclaimed_breach') {
    const claimDeadline = new Date(createdAt).getTime() + 60 * 60 * 1000; // +1 hr
    const diffMs = claimDeadline - Date.now();

    if (slaStatus === 'unclaimed_breach') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-300">
          <Clock className="h-3 w-3" />
          Unclaimed — {formatDuration(diffMs)} overdue
        </span>
      );
    }

    const isUrgent = diffMs < 30 * 60 * 1000; // < 30 min left
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${isUrgent ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
        <Clock className="h-3 w-3" />
        Claim: {formatDuration(diffMs)} left
      </span>
    );
  }

  // ── Phase 2: resolution window ────────────────────────────────────────────
  if (!slaResolveBy) return null;

  const diffMs = new Date(slaResolveBy).getTime() - Date.now();

  if (slaStatus === 'breached') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-300">
        <Clock className="h-3 w-3" />
        {formatDuration(diffMs)} overdue
      </span>
    );
  }

  if (slaStatus === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-yellow-100 text-yellow-700 border-yellow-300">
        <Clock className="h-3 w-3" />
        {formatDuration(diffMs)} left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-300">
      <Clock className="h-3 w-3" />
      {formatDuration(diffMs)} left
    </span>
  );
}
