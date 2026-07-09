'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2, Send, Paperclip, X, FileText, Image, File, Video,
} from 'lucide-react';
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
import { formatDateTime, formatIssueId } from '@/lib/utils';
import { replySchema, type ReplyFormData } from '@/lib/validations';
import type { Issue } from '@/lib/types';

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.mp4';
const MAX_SIZE_MB = 10;
const MAX_VIDEO_MB = 25;
const SUPPORTED_LABEL = 'JPG · PNG · GIF · WEBP · PDF · DOC · DOCX · XLS · XLSX · TXT · CSV · ZIP · MP4';

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'mp4') return <Video className="h-3.5 w-3.5 text-purple-500 shrink-0" />;
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext))
    return <Image className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext))
    return <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  return <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
}

interface IssueDetailsModalProps {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply: (issueId: string, message: string, files: File[]) => Promise<void>;
}

export function IssueDetailsModal({
  issue,
  open,
  onOpenChange,
  onReply,
}: IssueDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: '' },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFileError('');
    const oversized = picked.find((f) => {
      const isVideo = f.name.split('.').pop()?.toLowerCase() === 'mp4';
      return f.size > (isVideo ? MAX_VIDEO_MB : MAX_SIZE_MB) * 1024 * 1024;
    });
    if (oversized) {
      const isVideo = oversized.name.split('.').pop()?.toLowerCase() === 'mp4';
      setFileError(`"${oversized.name}" exceeds ${isVideo ? MAX_VIDEO_MB : MAX_SIZE_MB} MB`);
      return;
    }
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...picked.filter((f) => !existing.has(f.name))];
    });
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleReply(data: ReplyFormData) {
    if (!issue) return;
    setIsLoading(true);
    try {
      await onReply(issue.id, data.message, files);
      form.reset();
      setFiles([]);
      setFileError('');
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
            <span className="text-sm text-muted-foreground">{formatIssueId(issue)}</span>
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

        {/* Reply Form — only when pending */}
        {issue.status === 'pending' && (
          <>
            <Separator />
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleReply)} className="space-y-2 pt-2">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
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

                {/* File picker */}
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED}
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <div className="space-y-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => inputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Attach files
                  </Button>
                  <p className="text-[10px] text-muted-foreground pl-1 leading-relaxed">
                    {SUPPORTED_LABEL}
                  </p>
                  <p className="text-[10px] text-muted-foreground pl-1">
                    Images / docs: {MAX_SIZE_MB} MB &nbsp;&middot;&nbsp; MP4: {MAX_VIDEO_MB} MB
                  </p>

                  {fileError && <p className="text-xs text-destructive pl-1">{fileError}</p>}

                  {files.length > 0 && (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {files.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/60"
                        >
                          <FileIcon name={f.name} />
                          <span className="flex-1 truncate text-xs">{f.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatFileSize(f.size)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(f.name)}
                            disabled={isLoading}
                            className="text-muted-foreground hover:text-destructive transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
