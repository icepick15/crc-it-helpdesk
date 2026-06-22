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

// Defined outside the component so it is never re-created on renders
function AssigneeBadge({ issue }: { issue: Issue }) {
  if (issue.assignedToName) {
    return (
      <span className="text-sm font-medium text-foreground">{issue.assignedToName}</span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
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
      <TableCell className="font-mono text-sm text-muted-foreground">
        #{issue.id}
      </TableCell>
      <TableCell>
        <div className="font-medium truncate max-w-[280px] lg:max-w-[360px]">
          {issue.title}
        </div>
        <div className="text-sm text-muted-foreground truncate max-w-[280px] lg:max-w-[360px]">
          {issue.description}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium truncate">{issue.employeeName}</div>
        <div className="text-sm text-muted-foreground truncate">
          {issue.employeeEmail}
        </div>
      </TableCell>
      <TableCell>
        <SeverityBadge severity={issue.severity} />
      </TableCell>
      <TableCell>
        <StatusBadge status={issue.status} />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        {!issue.assignedToName && onClaim ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-400/50 text-amber-700 hover:bg-amber-50 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onClaim(issue.id);
            }}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Claim
          </Button>
        ) : (
          <AssigneeBadge issue={issue} />
        )}
      </TableCell>
      <TableCell>
        {issue.status === 'pending' && (
          <SLABadge slaResolveBy={issue.slaResolveBy} slaStatus={issue.slaStatus} />
        )}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1 text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>{issue.replyCount}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(issue.createdAt)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {issue.resolvedAt ? formatDate(issue.resolvedAt) : '-'}
      </TableCell>
    </TableRow>
  );
});

const MobileIssueCard = memo(function MobileIssueCard({ issue, onIssueClick, onClaim }: IssueRowProps) {
  return (
    <div
      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted"
      onClick={() => onIssueClick(issue)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">
            #{issue.id}
          </span>
          <StatusBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{issue.replyCount}</span>
        </div>
      </div>
      <h3 className="font-medium mb-1 line-clamp-1">{issue.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
        {issue.description}
      </p>
      {issue.status === 'pending' && issue.slaResolveBy && (
        <div className="mb-2">
          <SLABadge slaResolveBy={issue.slaResolveBy} slaStatus={issue.slaStatus} />
        </div>
      )}
      <div className="flex items-center justify-between text-sm gap-2">
        <div>
          <span className="font-medium">{issue.employeeName}</span>
        </div>
        <div className="flex items-center gap-2">
          {!issue.assignedToName && onClaim ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-amber-400/50 text-amber-700 hover:bg-amber-50 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onClaim(issue.id);
              }}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Claim
            </Button>
          ) : (
            <AssigneeBadge issue={issue} />
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        {formatDate(issue.createdAt)}
        {issue.resolvedAt && (
          <span className="text-green-600 ml-2">
            Resolved: {formatDate(issue.resolvedAt)}
          </span>
        )}
      </div>
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
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg mb-1">No issues found</h3>
        <p className="text-muted-foreground">
          No issues match the current filters
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[70px] min-w-[70px]">ID</TableHead>
              <TableHead className="min-w-[200px]">Title</TableHead>
              <TableHead className="w-[160px] min-w-[140px]">Employee</TableHead>
              <TableHead className="w-[90px] min-w-[80px]">Priority</TableHead>
              <TableHead className="w-[100px] min-w-[90px]">Status</TableHead>
              <TableHead className="w-[150px] min-w-[130px]">Assigned To</TableHead>
              <TableHead className="w-[130px] min-w-[110px]">SLA</TableHead>
              <TableHead className="w-[70px] min-w-[60px] text-center">Replies</TableHead>
              <TableHead className="w-[100px] min-w-[90px]">Created</TableHead>
              <TableHead className="w-[100px] min-w-[90px]">Resolved</TableHead>
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
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
