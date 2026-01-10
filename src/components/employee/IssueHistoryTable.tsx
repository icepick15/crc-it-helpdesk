'use client';

import { Loader2, Inbox } from 'lucide-react';
import { MonthlyIssueGroup } from './MonthlyIssueGroup';
import { groupIssuesByMonth } from '@/lib/utils';
import type { Issue } from '@/lib/types';

interface IssueHistoryTableProps {
  issues: Issue[];
  loading: boolean;
  onIssueClick: (issue: Issue) => void;
}

export function IssueHistoryTable({
  issues,
  loading,
  onIssueClick,
}: IssueHistoryTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-1">No issues found</h3>
        <p className="text-muted-foreground">
          Create your first issue to get started
        </p>
      </div>
    );
  }

  const groupedIssues = groupIssuesByMonth(issues);

  return (
    <div className="space-y-4">
      {groupedIssues.map((group) => (
        <MonthlyIssueGroup
          key={`${group.year}-${group.monthNum}`}
          group={group}
          onIssueClick={onIssueClick}
        />
      ))}
    </div>
  );
}
