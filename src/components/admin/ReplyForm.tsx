'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { replySchema, type ReplyFormData } from '@/lib/validations';
import { formatDateTime } from '@/lib/utils';

interface ReplyFormProps {
  onReply: (message: string) => Promise<void>;
  onResolve: () => Promise<void>;
  onReopen?: () => Promise<void>;
  isResolved: boolean;
  resolvedAt?: string;
}

export function ReplyForm({ onReply, onResolve, onReopen, isResolved, resolvedAt }: ReplyFormProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isReopening, setIsReopening] = useState(false);

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      message: '',
    },
  });

  async function handleReply(data: ReplyFormData) {
    setIsReplying(true);
    try {
      await onReply(data.message);
      form.reset();
    } finally {
      setIsReplying(false);
    }
  }

  async function handleResolve() {
    setIsResolving(true);
    try {
      await onResolve();
    } finally {
      setIsResolving(false);
    }
  }

  async function handleReopen() {
    if (!onReopen) return;
    setIsReopening(true);
    try {
      await onReopen();
    } finally {
      setIsReopening(false);
    }
  }

  if (isResolved) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground bg-success/10 rounded-lg space-y-3">
        <div>
          <CheckCircle className="h-5 w-5 text-success mx-auto mb-2" />
          This issue has been resolved
          {resolvedAt && (
            <div className="text-xs mt-1">
              on {formatDateTime(resolvedAt)}
            </div>
          )}
        </div>
        {onReopen && (
          <Button
            variant="outline"
            onClick={handleReopen}
            disabled={isReopening}
            className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          >
            {isReopening ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reopening...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reopen Ticket
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleReply)} className="space-y-3">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Type your reply to the employee..."
                    className="min-h-[100px] resize-none"
                    disabled={isReplying || isResolving}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isReplying || isResolving}
              className="flex-1"
            >
              {isReplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResolve}
              disabled={isReplying || isResolving}
              className="bg-success/10 hover:bg-success/20 text-success border-success/30"
            >
              {isResolving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Resolved
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
