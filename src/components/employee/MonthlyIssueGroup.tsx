'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/utils';
import type { MonthlyIssueGroup as MonthlyIssueGroupType, Issue } from '@/lib/types';

interface MonthlyIssueGroupProps {
  group: MonthlyIssueGroupType;
  onIssueClick: (issue: Issue) => void;
}

export function MonthlyIssueGroup({ group, onIssueClick }: MonthlyIssueGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-semibold">{group.month}</span>
          <span className="text-muted-foreground text-sm">
            ({group.issues.length} {group.issues.length === 1 ? 'issue' : 'issues'})
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="divide-y">
          {group.issues.map((issue) => (
            <button
              key={issue.id}
              onClick={() => onIssueClick(issue)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-muted-foreground">#{issue.id}</span>
                  <StatusBadge status={issue.status} />
                </div>
                <h3 className="font-medium truncate">{issue.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {issue.description}
                </p>
              </div>
              <div className="text-sm text-muted-foreground ml-4 shrink-0">
                {formatDate(issue.createdAt)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
