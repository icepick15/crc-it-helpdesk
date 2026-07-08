'use client';

import { memo } from 'react';
import { Loader2, Inbox, MessageSquare, UserCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { SLABadge } from '@/components/shared/SLABadge';
import { formatDate } from '@/lib/utils';
import type { Issue } from '@/lib/types';

interface AllIssuesTableProps {
  issues: Issue[];
  loading: boolean;
  onIssueClick: (issue: Issue) => void;
  onClaim?: (issueId: string) => Promise<void>;
}

function AssigneeBadge({ issue }: { issue: Issue }) {
  if (issue.assignedToName) {
    return <span className="text-xs font-medium text-foreground truncate">{issue.assignedToName}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
      Unassigned
    </span>
  );
}

interface IssueRowProps {
  issue: Issue;
  onIssueClick: (issue: Issue) => void;
  onClaim?: (issueId: string) => Promise<void>;
}

const IssueRow = memo(function IssueRow({ issue, onIssueClick, onClaim }: IssueRowProps) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onIssueClick(issue)}
    >
      <TableCell className="py-2 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
        #{issue.id}
      </TableCell>
      <TableCell className="py-2 px-3">
        <span className="text-xs font-medium truncate block max-w-[240px] lg:max-w-[320px]">
          {issue.title}
        </span>
      </TableCell>
      <TableCell className="py-2 px-3">
        <span className="text-xs font-medium truncate block max-w-[120px]">
          {issue.employeeName}
        </span>
      </TableCell>
      <TableCell className="py-2 px-3">
        <SeverityBadge severity={issue.severity} />
      </TableCell>
      <TableCell className="py-2 px-3">
        <StatusBadge status={issue.status} />
      </TableCell>
      <TableCell className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
        {!issue.assignedToName && onClaim ? (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[11px] px-2 border-amber-400/50 text-amber-700 hover:bg-amber-50 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onClaim(issue.id);
            }}
          >
            <UserCheck className="h-3 w-3" />
            Claim
          </Button>
        ) : (
          <AssigneeBadge issue={issue} />
        )}
      </TableCell>
      <TableCell className="py-2 px-3">
        {issue.status === 'pending' && (
          <SLABadge
            slaStatus={issue.slaStatus}
            createdAt={issue.createdAt}
            slaResolveBy={issue.slaResolveBy}
          />
        )}
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-1 text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span className="text-xs">{issue.replyCount}</span>
        </div>
      </TableCell>
      <TableCell className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(issue.createdAt)}
      </TableCell>
    </TableRow>
  );
});

const MobileIssueCard = memo(function MobileIssueCard({ issue, onIssueClick, onClaim }: IssueRowProps) {
  return (
    <div
      className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted"
      onClick={() => onIssueClick(issue)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">#{issue.id}</span>
          <StatusBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MessageSquare className="h-3 w-3" />
          <span>{issue.replyCount}</span>
        </div>
      </div>
      <h3 className="text-xs font-medium mb-1 line-clamp-1">{issue.title}</h3>
      {issue.status === 'pending' && (
        <div className="mb-1.5">
          <SLABadge slaStatus={issue.slaStatus} createdAt={issue.createdAt} slaResolveBy={issue.slaResolveBy} />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium">{issue.employeeName}</span>
        <div className="flex items-center gap-2">
          {!issue.assignedToName && onClaim ? (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[11px] px-2 border-amber-400/50 text-amber-700 hover:bg-amber-50 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onClaim(issue.id);
              }}
            >
              <UserCheck className="h-3 w-3" />
              Claim
            </Button>
          ) : (
            <AssigneeBadge issue={issue} />
          )}
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5">{formatDate(issue.createdAt)}</div>
    </div>
  );
});

export const AllIssuesTable = memo(function AllIssuesTable({
  issues,
  loading,
  onIssueClick,
  onClaim,
}: AllIssuesTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
        <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="font-semibold mb-1">No issues found</h3>
        <p className="text-sm text-muted-foreground">No issues match the current filters</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="py-2 px-3 text-xs w-[60px]">ID</TableHead>
              <TableHead className="py-2 px-3 text-xs">Title</TableHead>
              <TableHead className="py-2 px-3 text-xs w-[130px]">Employee</TableHead>
              <TableHead className="py-2 px-3 text-xs w-[80px]">Priority</TableHead>
              <TableHead className="py-2 px-3 text-xs w-[90px]">Status</TableHead>
              <TableHead className="py-2 px-3 text-xs w-[140px]">Assigned To</TableHead>
              <TableHead className="py-2 px-3 text-xs w-[110px]">SLA</TableHead>
              <TableHead className="py-2 px-3 text-xs w-[60px] text-center">💬</TableHead>
              <TableHead className="py-2 px-3 text-xs w-[90px]">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                onIssueClick={onIssueClick}
                onClaim={onClaim}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {issues.map((issue) => (
          <MobileIssueCard
            key={issue.id}
            issue={issue}
            onIssueClick={onIssueClick}
            onClaim={onClaim}
          />
        ))}
      </div>
    </>
  );
});
