'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Paperclip, X, FileText, Image, File, Video, Info, ChevronDown, Check } from 'lucide-react';
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
import { createIssueSchema, type CreateIssueFormData } from '@/lib/validations';

// ── Priority data ──────────────────────────────────────────────────────────────

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
      "Outlook failing to sync on one user's laptop",
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

type PriorityValue = typeof PRIORITY_DETAILS[number]['value'];

// ── Tooltip (absolute-positioned relative to the selector container) ───────────

interface TooltipPos {
  priority: PriorityValue;
  top: number;   // px from container top
  left: number;  // px from container left (can be negative to go left)
  maxH: number;  // max-height so it never overflows the screen
}

function PriorityTooltip({ pos }: { pos: TooltipPos }) {
  const detail = PRIORITY_DETAILS.find((p) => p.value === pos.priority);
  if (!detail) return null;
  return (
    <div
      className="absolute z-[200] w-72 rounded-lg border bg-popover text-popover-foreground shadow-lg p-4 space-y-2 pointer-events-none overflow-y-auto"
      style={{ top: pos.top, left: pos.left, maxHeight: pos.maxH }}
    >
      <div className="flex items-baseline gap-2">
        <span className={`text-sm font-semibold ${detail.color}`}>{detail.label}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{detail.summary}</p>
      <ul className="space-y-1">
        {detail.examples.map((ex) => (
          <li key={ex} className="text-xs flex gap-1.5 leading-relaxed">
            <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
            <span>{ex}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Custom priority dropdown ───────────────────────────────────────────────────

interface PrioritySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OPTION_H = 44;
const DROPDOWN_H = PRIORITY_DETAILS.length * OPTION_H + 4;
const TOOLTIP_W = 288;

function PrioritySelector({ value, onChange, disabled }: PrioritySelectorProps) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close when clicking outside the whole component
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setTooltip(null);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  function handleTriggerClick() {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      setOpenUp(spaceBelow < DROPDOWN_H);
    }
    setOpen((o) => !o);
    setTooltip(null);
  }

  function handleInfoEnter(e: React.MouseEvent<HTMLButtonElement>, priority: PriorityValue) {
    e.stopPropagation();
    if (!containerRef.current) return;

    const iconRect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const MARGIN = 12;

    // ── Horizontal: prefer right of icon, flip left if it overflows ──
    const rightOf = iconRect.right - containerRect.left + 8;
    const leftOf  = iconRect.left  - containerRect.left - TOOLTIP_W - 8;
    const relLeft  = iconRect.right + 8 + TOOLTIP_W > window.innerWidth - MARGIN
      ? leftOf
      : rightOf;

    // ── Vertical: try opening downward from icon top; flip up if overflow ──
    const detail = PRIORITY_DETAILS.find((p) => p.value === priority)!;
    // rough height: header + summary + each example row + padding
    const estimatedH = 64 + 48 + detail.examples.length * 40;
    const spaceBelow = window.innerHeight - iconRect.top - MARGIN;
    const spaceAbove = iconRect.bottom - MARGIN;
    const maxH = Math.min(estimatedH, window.innerHeight - MARGIN * 2);

    let relTop: number;
    if (spaceBelow >= estimatedH) {
      // fits below — align tooltip top to icon top
      relTop = iconRect.top - containerRect.top;
    } else if (spaceAbove >= estimatedH) {
      // fits above — align tooltip bottom to icon bottom
      relTop = iconRect.bottom - containerRect.top - estimatedH;
    } else {
      // neither fits fully — anchor to whichever side has more room, let maxH clip
      if (spaceBelow >= spaceAbove) {
        relTop = iconRect.top - containerRect.top;
      } else {
        relTop = iconRect.bottom - containerRect.top - Math.min(estimatedH, spaceAbove);
      }
    }

    setTooltip({ priority, top: relTop, left: relLeft, maxH });
  }

  const selected = PRIORITY_DETAILS.find((p) => p.value === value);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleTriggerClick}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selected ? (
          <span className="font-medium">{selected.label}</span>
        ) : (
          <span className="text-muted-foreground">Select priority level</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Dropdown — absolute so it stays inside Radix's focus scope (no pointer-event blocking) */}
      {open && (
        <div
          className={`absolute left-0 right-0 z-[100] rounded-md border bg-popover text-popover-foreground shadow-lg overflow-hidden ${
            openUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {PRIORITY_DETAILS.map((p) => (
            <div
              key={p.value}
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent text-sm select-none"
              onClick={() => {
                onChange(p.value);
                setOpen(false);
                setTooltip(null);
              }}
            >
              <Check
                className={`h-4 w-4 shrink-0 ${value === p.value ? 'opacity-100' : 'opacity-0'}`}
              />
              <span className="flex-1 min-w-0 font-medium">{p.label}</span>
              <button
                type="button"
                className="shrink-0 p-1 rounded hover:bg-accent-foreground/10 transition-colors"
                onMouseEnter={(e) => handleInfoEnter(e, p.value)}
                onMouseLeave={() => setTooltip(null)}
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
              >
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip — absolute relative to this container, escapes overflow because dialog has no overflow:hidden */}
      {tooltip && <PriorityTooltip pos={tooltip} />}
    </div>
  );
}

// ── File helpers ───────────────────────────────────────────────────────────────

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

// ── Modal ──────────────────────────────────────────────────────────────────────

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

  async function handleSubmit(data: CreateIssueFormData) {
    setIsLoading(true);
    try {
      await onSubmit(data.title, data.description, data.severity, files);
      form.reset();
      setFiles([]);
      setFileError('');
      onOpenChange(false);
    } catch {
      // error handled in parent
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
      {/* overflow-visible lets the priority dropdown extend below the dialog boundary */}
      <DialogContent className="sm:max-w-[500px] overflow-visible">
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
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <PrioritySelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
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

              {fileError && <p className="text-xs text-destructive">{fileError}</p>}

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
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
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
