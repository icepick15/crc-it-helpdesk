'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Paperclip, X, FileText, Image, File, Video, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createIssueSchema, type CreateIssueFormData } from '@/lib/validations';

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', description: 'Resolved within 6 hours' },
  { value: 'high',     label: 'High',     description: 'Resolved within 12 hours' },
  { value: 'low',      label: 'Low',      description: 'Resolved within 24 hours' },
  { value: 'minor',    label: 'Minor',    description: 'Resolved within 48 hours' },
] as const;

const PRIORITY_DETAILS = [
  {
    value: 'critical',
    label: 'Critical',
    sla: 'Within 6 hours',
    color: 'text-red-600',
    summary: 'Total business stoppage, data loss risks, or security emergencies affecting the entire organization.',
    examples: [
      'Core business applications inaccessible (SB2, DIVS, Helpdesk Portal, FilePortal)',
      'Whole-office internet outage',
      'Critical server or automation system unreachable',
      'Active ransomware, malware outbreak, or confirmed data breach',
      'Total failure or corruption of core business databases',
      'Entire company unable to send or receive emails',
    ],
  },
  {
    value: 'high',
    label: 'High',
    sla: 'Within 12 hours',
    color: 'text-orange-500',
    summary: 'Degrades operations for entire departments or halts work for executive-level users without an easy workaround.',
    examples: [
      'VPN service outage — remote staff unable to connect',
      'Main department printer down with no close alternative',
      'C-Suite executive laptop, phone, or account lockout',
      'Marketing, HR, or Finance unable to access shared drives',
      'Entire department unable to make external calls (VoIP)',
      'Sales team unable to update CRM records or pipeline data',
    ],
  },
  {
    value: 'low',
    label: 'Low',
    sla: 'Within 24 hours',
    color: 'text-yellow-600',
    summary: 'Standard break-fix issues or application bugs affecting individual users. Work can usually continue via a temporary workaround.',
    examples: [
      'Single user Active Directory account locked or password expired',
      'Microsoft Office errors on a single machine',
      'Broken mouse, keyboard, or secondary monitor failure',
      'Outlook failing to sync on one user\'s laptop',
      'Slow workstation due to memory leakage or background processes',
      'Antivirus showing outdated definitions on a single PC',
    ],
  },
  {
    value: 'minor',
    label: 'Minor',
    sla: 'Within 48 hours',
    color: 'text-blue-500',
    summary: 'Non-urgent service requests, cosmetic bugs, or proactive maintenance queries that do not impede day-to-day operations.',
    examples: [
      'Installation of non-essential software (Adobe Acrobat, VLC, etc.)',
      '"How-to" inquiries (archiving folders, configuring email signatures, etc.)',
    ],
  },
] as const;

function PriorityGuide() {
  return (
    <div className="relative group/guide inline-flex items-center">
      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      <div className="
        absolute left-5 top-0 z-50 hidden group-hover/guide:block
        w-[340px] rounded-lg border bg-popover shadow-lg text-popover-foreground
        p-4 space-y-4 text-left
      ">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Priority Guide
        </p>
        {PRIORITY_DETAILS.map((p) => (
          <div key={p.value} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${p.color}`}>{p.label}</span>
              <span className="text-xs text-muted-foreground">— SLA: {p.sla}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.summary}</p>
            <ul className="space-y-0.5 pl-3">
              {p.examples.map((ex) => (
                <li key={ex} className="text-xs text-foreground/80 list-disc list-inside leading-relaxed">
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.mp4';
const MAX_SIZE_MB = 10;
const MAX_VIDEO_MB = 25;

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

interface CreateIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, description: string, severity: string, files: File[]) => Promise<void>;
}

export function CreateIssueModal({ open, onOpenChange, onSubmit }: CreateIssueModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: { title: '', description: '', severity: 'low' },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setFileError('');

    const oversized = picked.find((f) => {
      const isVideo = f.name.split('.').pop()?.toLowerCase() === 'mp4';
      const limit = isVideo ? MAX_VIDEO_MB : MAX_SIZE_MB;
      return f.size > limit * 1024 * 1024;
    });
    if (oversized) {
      const isVideo = oversized.name.split('.').pop()?.toLowerCase() === 'mp4';
      setFileError(`"${oversized.name}" exceeds ${isVideo ? MAX_VIDEO_MB : MAX_SIZE_MB} MB`);
      return;
    }

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const added = picked.filter((f) => !existing.has(f.name));
      return [...prev, ...added];
    });

    if (inputRef.current) inputRef.current.value = '';
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(data: CreateIssueFormData) {
    setIsLoading(true);
    try {
      await onSubmit(data.title, data.description, data.severity, files);
      form.reset();
      setFiles([]);
      setFileError('');
      onOpenChange(false);
    } catch {
      // Error handled in parent
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    if (!isLoading) {
      form.reset();
      setFiles([]);
      setFileError('');
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Describe your IT issue and our team will get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of the issue"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide more details about the issue, including any error messages or steps to reproduce..."
                      className="min-h-[120px] resize-none"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-1.5">
                    <FormLabel>Priority</FormLabel>
                    <PriorityGuide />
                  </div>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground ml-1">— {opt.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attachments</span>
                <span className="text-xs text-muted-foreground">
                  Images/docs: {MAX_SIZE_MB} MB · MP4: {MAX_VIDEO_MB} MB
                </span>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed gap-2"
                onClick={() => inputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip className="h-4 w-4" />
                Attach files
              </Button>

              {fileError && (
                <p className="text-xs text-destructive">{fileError}</p>
              )}

              {files.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
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
                        disabled={isLoading}
                        className="text-muted-foreground hover:text-destructive transition shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {files.length > 0 ? 'Uploading...' : 'Creating...'}
                  </>
                ) : (
                  'Create Issue'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
