'use client';

import { Badge } from '@/components/ui/badge';
import type { IssueStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: IssueStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'completed') {
    return (
      <Badge className="bg-success text-success-foreground hover:bg-success/90">
        Completed
      </Badge>
    );
  }

  return (
    <Badge className="bg-warning text-warning-foreground hover:bg-warning/90">
      Pending
    </Badge>
  );
}
