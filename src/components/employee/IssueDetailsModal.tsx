'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { formatDateTime } from '@/lib/utils';
import { replySchema, type ReplyFormData } from '@/lib/validations';
import type { Issue } from '@/lib/types';

interface IssueDetailsModalProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply: (issueId: string, message: string) => Promise<void>;
}

export function IssueDetailsModal({
  issue,
  open,
  onOpenChange,
  onReply,
}: IssueDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      message: '',
    },
  });

  async function handleReply(data: ReplyFormData) {
    if (!issue) return;
    setIsLoading(true);
    try {
      await onReply(issue.id, data.message);
      form.reset();
    } catch {
      // Error handled in parent
    } finally {
      setIsLoading(false);
    }
  }

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">#{issue.id}</span>
            <StatusBadge status={issue.status} />
          </div>
          <DialogTitle className="text-xl">{issue.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Created on {formatDateTime(issue.createdAt)}
          </p>
          {issue.resolvedAt && (
            <p className="text-sm text-green-600">
              Resolved on {formatDateTime(issue.resolvedAt)}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Original Issue */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{issue.employeeName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(issue.createdAt)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
            {issue.attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <AttachmentList attachments={issue.attachments} />
              </div>
            )}
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

        {/* Reply Form - Only show if issue is pending */}
        {issue.status === 'pending' && (
          <>
            <Separator />
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleReply)}
                className="flex gap-2 pt-2"
              >
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Textarea
                          placeholder="Type your reply..."
                          className="min-h-[60px] resize-none"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="icon" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}

        {issue.status === 'completed' && (
          <div className="text-center py-2 text-sm text-muted-foreground bg-success/10 rounded-lg">
            This issue has been resolved
            {issue.resolvedAt && (
              <span className="block text-xs mt-1">
                on {formatDateTime(issue.resolvedAt)}
              </span>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
