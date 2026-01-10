'use client';

import { formatDateTime } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { Issue } from '@/lib/types';

interface IssueConversationProps {
  issue: Issue;
}

export function IssueConversation({ issue }: IssueConversationProps) {
  return (
    <div className="space-y-4">
      {/* Original Issue */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">{issue.employeeName}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
            Employee
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(issue.createdAt)}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
      </div>

      {/* Replies */}
      {issue.replies.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            {issue.replies.map((reply) => (
              <div
                key={reply.id}
                className={`rounded-lg p-4 ${
                  reply.authorRole === 'admin'
                    ? 'bg-primary/10 ml-4'
                    : 'bg-muted/50 mr-4'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{reply.authorName}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      reply.authorRole === 'admin'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {reply.authorRole === 'admin' ? 'IT Support' : 'Employee'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(reply.createdAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
