'use client';

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
import { formatDate } from '@/lib/utils';
import type { Issue } from '@/lib/types';

interface AllIssuesTableProps {
  issues: Issue[];
  loading: boolean;
  onIssueClick: (issue: Issue) => void;
  onClaim?: (issueId: string) => Promise<void>;
}

export function AllIssuesTable({
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

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[70px] min-w-[70px]">ID</TableHead>
              <TableHead className="min-w-[200px]">Title</TableHead>
              <TableHead className="w-[180px] min-w-[160px]">Employee</TableHead>
              <TableHead className="w-[110px] min-w-[100px]">Status</TableHead>
              <TableHead className="w-[160px] min-w-[140px]">Assigned To</TableHead>
              <TableHead className="w-[80px] min-w-[70px] text-center">Replies</TableHead>
              <TableHead className="w-[110px] min-w-[100px]">Created</TableHead>
              <TableHead className="w-[110px] min-w-[100px]">Resolved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow
                key={issue.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onIssueClick(issue)}
              >
                <TableCell className="font-mono text-sm text-muted-foreground">
                  #{issue.id}
                </TableCell>
                <TableCell>
                  <div className="font-medium truncate max-w-[320px] lg:max-w-[420px]">
                    {issue.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate max-w-[320px] lg:max-w-[420px]">
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {issues.map((issue) => (
          <div
            key={issue.id}
            className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted"
            onClick={() => onIssueClick(issue)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  #{issue.id}
                </span>
                <StatusBadge status={issue.status} />
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{issue.replyCount}</span>
              </div>
            </div>
            <h3 className="font-medium mb-1 line-clamp-1">{issue.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {issue.description}
            </p>
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
        ))}
      </div>
    </>
  );
}
