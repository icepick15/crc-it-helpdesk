'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2, Send, CheckCircle, RotateCcw, ArrowRightLeft,
  UserCheck, Paperclip, X, FileText, Image, File, Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { TransferIssueModal } from '@/components/admin/TransferIssueModal';
import { replySchema, type ReplyFormData } from '@/lib/validations';
import { formatDateTime } from '@/lib/utils';

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

interface ReplyFormProps {
  onReply: (message: string, files: File[]) => Promise<void>;
  onResolve: () => Promise<void>;
  onReopen?: () => Promise<void>;
  onClaim?: () => Promise<void>;
  onTransfer?: (newUserId: string) => Promise<void>;
  isResolved: boolean;
  isAssignee: boolean;
  isUnassigned: boolean;
  currentAssigneeId?: string;
  resolvedAt?: string;
  resolvedByName?: string | null;
  assignedToName?: string | null;
}

export function ReplyForm({
  onReply,
  onResolve,
  onReopen,
  onClaim,
  onTransfer,
  isResolved,
  isAssignee,
  isUnassigned,
  currentAssigneeId,
  resolvedAt,
  resolvedByName,
  assignedToName,
}: ReplyFormProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
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
    setIsReplying(true);
    try {
      await onReply(data.message, files);
      form.reset();
      setFiles([]);
      setFileError('');
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

  async function handleClaim() {
    if (!onClaim) return;
    setIsClaiming(true);
    try {
      await onClaim();
    } finally {
      setIsClaiming(false);
    }
  }

  // --- RESOLVED STATE ---
  if (isResolved) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground bg-success/10 rounded-lg space-y-3">
        <div>
          <CheckCircle className="h-5 w-5 text-success mx-auto mb-2" />
          <div>This issue has been resolved</div>
          {resolvedByName && (
            <div className="font-medium text-foreground mt-1">by {resolvedByName}</div>
          )}
          {resolvedAt && (
            <div className="text-xs mt-1">on {formatDateTime(resolvedAt)}</div>
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
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reopening...</>
            ) : (
              <><RotateCcw className="mr-2 h-4 w-4" />Reopen Ticket</>
            )}
          </Button>
        )}
      </div>
    );
  }

  // --- UNASSIGNED STATE ---
  if (isUnassigned) {
    return (
      <div className="text-center py-6 space-y-3 border rounded-lg bg-amber-50 border-amber-200">
        <UserCheck className="h-6 w-6 text-amber-600 mx-auto" />
        <div>
          <p className="font-medium text-amber-800">This issue is unassigned</p>
          <p className="text-sm text-amber-700 mt-1">
            Claim it to start working on it. Only the assigned admin can reply and resolve.
          </p>
        </div>
        {onClaim && (
          <Button
            onClick={handleClaim}
            disabled={isClaiming}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            {isClaiming ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Claiming...</>
            ) : (
              <><UserCheck className="h-4 w-4" />Claim Issue</>
            )}
          </Button>
        )}
      </div>
    );
  }

  // --- ASSIGNED BUT NOT THE ASSIGNEE ---
  if (!isAssignee) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground bg-muted/20 rounded-lg space-y-1">
        <p className="font-medium text-foreground">
          Assigned to {assignedToName ?? 'another admin'}
        </p>
        <p>Only the assigned admin can reply to and resolve this issue.</p>
      </div>
    );
  }

  // --- ASSIGNEE VIEW ---
  return (
    <>
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

            {/* File Attachment Area */}
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isReplying || isResolving}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-dashed gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => inputRef.current?.click()}
                disabled={isReplying || isResolving}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attach files
              </Button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {SUPPORTED_LABEL}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Images / docs: {MAX_SIZE_MB} MB &nbsp;&middot;&nbsp; MP4: {MAX_VIDEO_MB} MB
              </p>

              {fileError && <p className="text-xs text-destructive">{fileError}</p>}

              {files.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {files.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/60 text-sm"
                    >
                      <FileIcon name={f.name} />
                      <span className="flex-1 truncate text-xs">{f.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatFileSize(f.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(f.name)}
                        disabled={isReplying}
                        className="text-muted-foreground hover:text-destructive transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={isReplying || isResolving}
                className="flex-1 min-w-[120px]"
              >
                {isReplying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {files.length > 0 ? 'Sending...' : 'Sending...'}</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" />Send Reply</>
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
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resolving...</>
                ) : (
                  <><CheckCircle className="mr-2 h-4 w-4" />Mark Resolved</>
                )}
              </Button>

              {onTransfer && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTransferModal(true)}
                  disabled={isReplying || isResolving}
                  className="border-blue-400/40 text-blue-600 hover:bg-blue-50"
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transfer
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

      {onTransfer && currentAssigneeId && (
        <TransferIssueModal
          open={showTransferModal}
          onOpenChange={setShowTransferModal}
          currentAssigneeId={currentAssigneeId}
          onTransfer={onTransfer}
        />
      )}
    </>
  );
}
