'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, UserCheck, ShieldAlert, Clock,
  CheckCircle2, XCircle, Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ReplyForm } from '@/components/admin/ReplyForm';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { SLABadge } from '@/components/shared/SLABadge';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { UserProfileModal } from '@/components/shared/UserProfileModal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { issuesAPI, messagesAPI, attachmentsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime, formatIssueId } from '@/lib/utils';
import type { Issue } from '@/lib/types';

const SLA_HOURS: Record<string, number> = {
  critical: 6,
  high: 12,
  low: 24,
  minor: 48,
};

function computeCanTransfer(issue: Issue): boolean {
  // Transfer only allowed while less than 50% of the SLA window has elapsed.
  // Once past 50% there's too little time left to hand off responsibly.
  if (!issue.slaResolveBy || !issue.assignedToId) return false;
  const totalMs = (SLA_HOURS[issue.severity] ?? 24) * 3_600_000;
  const claimTime = new Date(issue.slaResolveBy).getTime() - totalMs;
  const elapsedPct = ((Date.now() - claimTime) / totalMs) * 100;
  return elapsedPct < 50;
}

export default function AdminIssueDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const convoEndRef = useRef<HTMLDivElement>(null);

  const issueId = params.id as string;
  const isUnassigned = issue?.assignedToId == null;
  const isAssignee = !isUnassigned && issue?.assignedToId === user?.id;

  useEffect(() => {
    async function fetchIssue() {
      setLoading(true);
      try {
        const fetchedIssue = await issuesAPI.getIssue(issueId);
        setIssue(fetchedIssue);
      } catch {
        toast.error('Issue not found');
        router.push('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    }
    if (issueId) fetchIssue();
  }, [issueId, router]);

  // Scroll conversation to bottom when new messages arrive
  useEffect(() => {
    convoEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [issue?.replies?.length]);

  const handleReply = async (message: string, files: File[]) => {
    if (!issue || !user) return;
    try {
      const reply = await messagesAPI.sendMessage(issue.id, message, {
        id: user.id,
        name: user.name,
        role: user.role,
      });
      let updatedIssue = { ...issue, replies: [...issue.replies, reply] };
      if (files.length > 0) {
        const newAttachments = await attachmentsAPI.upload(issue.id, files);
        updatedIssue = { ...updatedIssue, attachments: [...issue.attachments, ...newAttachments] };
      }
      setIssue(updatedIssue);
      toast.success('Reply sent');
    } catch {
      toast.error('Failed to send reply');
      throw new Error('send failed');
    }
  };

  const handleClaim = async () => {
    if (!issue) return;
    try {
      setIssue(await issuesAPI.claimIssue(issue.id));
      toast.success('Issue claimed — you are now the assignee');
    } catch {
      toast.error('Failed to claim issue');
      throw new Error('claim failed');
    }
  };

  const handleTransfer = async (newUserId: string) => {
    if (!issue) return;
    try {
      setIssue(await issuesAPI.transferIssue(issue.id, newUserId));
      toast.success('Issue transferred');
    } catch {
      toast.error('Failed to transfer issue');
      throw new Error('transfer failed');
    }
  };

  const handleResolve = async () => {
    if (!issue) return;
    try {
      setIssue(await issuesAPI.resolveIssue(issue.id));
      toast.success('Issue marked as resolved');
    } catch {
      toast.error('Failed to resolve issue');
      throw new Error('resolve failed');
    }
  };

  const handleReopen = async () => {
    if (!issue) return;
    try {
      setIssue(await issuesAPI.reopenIssue(issue.id));
      toast.success('Issue reopened');
    } catch {
      toast.error('Failed to reopen issue');
      throw new Error('reopen failed');
    }
  };

  if (loading) {
    return (
      <DashboardLayout requireAdmin>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!issue) return null;

  const showSLA = issue.slaStatus && issue.slaStatus !== 'resolved';

  return (
    <DashboardLayout requireAdmin noPadding>
      {/* Full viewport below navbar */}
      <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">

        {/* ── Top bar ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 h-12 border-b bg-background shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/dashboard')}
            className="gap-1.5 h-8 px-2 text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-semibold truncate max-w-[320px]">{issue.title}</span>
          <span className="text-xs text-muted-foreground">{formatIssueId(issue)}</span>
          <div className="ml-auto flex items-center gap-2">
            <StatusBadge status={issue.status} />
            <SeverityBadge severity={issue.severity} />
          </div>
        </div>

        {/* ── Two-column grid ──────────────────────────────── */}
        <div className="grid grid-cols-[340px_1fr] flex-1 overflow-hidden">

          {/* ── LEFT PANEL — metadata ───────────────────────── */}
          <aside className="overflow-y-auto border-r bg-background flex flex-col divide-y">

            {/* Issue info */}
            <section className="p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Issue</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{formatIssueId(issue)}</span>
                </div>
                <h1 className="text-sm font-semibold leading-snug">{issue.title}</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  {issue.assignedToName ? (
                    <span>
                      Assigned to{' '}
                      <span className="font-medium text-foreground">
                        {issue.assignedToName}{isAssignee && ' (you)'}
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Unassigned</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Reported by{' '}
                  <button
                    type="button"
                    onClick={() => setShowUserProfile(true)}
                    className="font-medium text-primary hover:underline focus:outline-none"
                  >
                    {issue.employeeName}
                  </button>{' '}
                  · {formatDateTime(issue.createdAt)}
                </div>
                {issue.resolvedAt && (
                  <div className="text-xs text-green-600">
                    Resolved{issue.resolvedByName && <> by <span className="font-medium">{issue.resolvedByName}</span></>}
                    {' '}· {formatDateTime(issue.resolvedAt)}
                  </div>
                )}
              </div>
            </section>

            {/* Description */}
            <section className="p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Description</p>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{issue.description}</p>
            </section>

            {/* SLA */}
            {showSLA && (
              <section className="p-4 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  SLA Tracking
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Priority</p>
                    <SeverityBadge severity={issue.severity} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">SLA Status</p>
                    <SLABadge
                      slaStatus={issue.slaStatus}
                      createdAt={issue.createdAt}
                      slaResolveBy={issue.slaResolveBy}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                      {issue.assignedToId ? 'Resolve By' : 'Claim By'}
                    </p>
                    <p className="text-xs font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {issue.assignedToId
                        ? issue.slaResolveBy ? formatDateTime(issue.slaResolveBy) : '—'
                        : formatDateTime(new Date(new Date(issue.createdAt).getTime() + 3600000).toISOString())}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Claimed in 1h</p>
                    {issue.slaAcknowledged === null ? (
                      <span className="text-xs text-muted-foreground">Not yet</span>
                    ) : issue.slaAcknowledged ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 font-medium">
                        <XCircle className="h-3.5 w-3.5" />No
                      </span>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Attachments */}
            {issue.attachments.length > 0 && (
              <section className="p-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attachments ({issue.attachments.length})
                </p>
                <AttachmentList attachments={issue.attachments} />
              </section>
            )}
          </aside>

          {/* ── RIGHT PANEL — conversation + reply ─────────── */}
          <div className="flex flex-col overflow-hidden bg-muted/30">

            {/* Scrollable conversation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Conversation · {1 + (issue.replies?.length ?? 0)} message{(issue.replies?.length ?? 0) !== 0 ? 's' : ''}
              </p>

              {/* Original issue message */}
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] rounded-lg bg-background border px-3.5 py-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold">{issue.employeeName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Employee</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(issue.createdAt)}</span>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{issue.description}</p>
                </div>
              </div>

              {/* Replies */}
              {issue.replies?.map((reply) => {
                const isAdmin = reply.authorRole === 'admin';
                return (
                  <div key={reply.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3.5 py-2.5 ${
                      isAdmin
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-background border'
                    }`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold">{reply.authorName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isAdmin
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isAdmin ? 'IT Support' : 'Employee'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDateTime(reply.createdAt)}</span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  </div>
                );
              })}

              {/* Sentinel for auto-scroll */}
              <div ref={convoEndRef} />
            </div>

            {/* Reply form — pinned to bottom */}
            <div className="border-t bg-background shrink-0 p-4">
              <ReplyForm
                onReply={handleReply}
                onResolve={handleResolve}
                onReopen={handleReopen}
                onClaim={isUnassigned ? handleClaim : undefined}
                onTransfer={isAssignee ? handleTransfer : undefined}
                isResolved={issue.status === 'completed'}
                isAssignee={isAssignee}
                isUnassigned={isUnassigned}
                canTransfer={computeCanTransfer(issue)}
                currentAssigneeId={issue.assignedToId ?? undefined}
                resolvedAt={issue.resolvedAt}
                resolvedByName={issue.resolvedByName}
                assignedToName={issue.assignedToName}
              />
            </div>
          </div>
        </div>
      </div>

      <UserProfileModal
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
        userEmail={issue.employeeEmail}
        userName={issue.employeeName}
      />
    </DashboardLayout>
  );
}
