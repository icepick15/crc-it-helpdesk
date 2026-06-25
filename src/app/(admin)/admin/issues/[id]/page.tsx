'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, UserCheck, ShieldAlert, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IssueConversation } from '@/components/admin/IssueConversation';
import { ReplyForm } from '@/components/admin/ReplyForm';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { SLABadge } from '@/components/shared/SLABadge';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { UserProfileModal } from '@/components/shared/UserProfileModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { issuesAPI, messagesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime } from '@/lib/utils';
import type { Issue } from '@/lib/types';

export default function AdminIssueDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const issueId = params.id as string;

  const isUnassigned = issue?.assignedToId == null;
  const isAssignee = !isUnassigned && issue?.assignedToId === user?.id;

  useEffect(() => {
    async function fetchIssue() {
      setLoading(true);
      try {
        const fetchedIssue = await issuesAPI.getIssue(issueId);
        setIssue(fetchedIssue);
      } catch (error) {
        console.error('Failed to fetch issue:', error);
        toast.error('Issue not found');
        router.push('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (issueId) {
      fetchIssue();
    }
  }, [issueId, router]);

  const handleReply = async (message: string) => {
    if (!issue || !user) return;
    try {
      const reply = await messagesAPI.sendMessage(issue.id, message, {
        id: user.id,
        name: user.name,
        role: user.role,
      });
      setIssue({ ...issue, replies: [...issue.replies, reply] });
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
      throw error;
    }
  };

  const handleClaim = async () => {
    if (!issue) return;
    try {
      const updated = await issuesAPI.claimIssue(issue.id);
      setIssue(updated);
      toast.success('Issue claimed — you are now the assignee');
    } catch (error) {
      toast.error('Failed to claim issue');
      throw error;
    }
  };

  const handleTransfer = async (newUserId: string) => {
    if (!issue) return;
    try {
      const updated = await issuesAPI.transferIssue(issue.id, newUserId);
      setIssue(updated);
      toast.success('Issue transferred successfully');
    } catch (error) {
      toast.error('Failed to transfer issue');
      throw error;
    }
  };

  const handleResolve = async () => {
    if (!issue) return;
    try {
      const resolvedIssue = await issuesAPI.resolveIssue(issue.id);
      setIssue(resolvedIssue);
      toast.success('Issue marked as resolved');
    } catch (error) {
      toast.error('Failed to resolve issue');
      throw error;
    }
  };

  const handleReopen = async () => {
    if (!issue) return;
    try {
      const reopenedIssue = await issuesAPI.reopenIssue(issue.id);
      setIssue(reopenedIssue);
      toast.success('Issue reopened');
    } catch (error) {
      toast.error('Failed to reopen issue');
      throw error;
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

  if (!issue) {
    return null;
  }

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Issue Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">#{issue.id}</span>
                  <StatusBadge status={issue.status} />
                </div>
                <CardTitle className="text-xl">{issue.title}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Created by{' '}
                  <button
                    type="button"
                    onClick={() => setShowUserProfile(true)}
                    className="font-medium text-primary hover:underline focus:outline-none focus:underline"
                  >
                    {issue.employeeName} ({issue.employeeEmail})
                  </button>{' '}
                  on {formatDateTime(issue.createdAt)}
                </div>

                {/* Assignee row */}
                <div className="flex items-center gap-1.5 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  {issue.assignedToName ? (
                    <span>
                      Assigned to{' '}
                      <span className="font-medium text-foreground">
                        {issue.assignedToName}
                        {isAssignee && ' (you)'}
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">Unassigned</span>
                  )}
                </div>

                {/* Resolved row */}
                {issue.resolvedAt && (
                  <div className="text-sm text-green-600">
                    Resolved
                    {issue.resolvedByName && (
                      <span> by <span className="font-medium">{issue.resolvedByName}</span></span>
                    )}
                    {' '}on {formatDateTime(issue.resolvedAt)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* SLA Info */}
        {issue.slaStatus && issue.slaStatus !== 'resolved' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                SLA Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Priority</p>
                  <SeverityBadge severity={issue.severity} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">SLA Status</p>
                  <SLABadge
                    slaStatus={issue.slaStatus}
                    createdAt={issue.createdAt}
                    slaResolveBy={issue.slaResolveBy}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {issue.assignedToId ? 'Resolve By' : 'Claim By'}
                  </p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {issue.assignedToId
                      ? issue.slaResolveBy ? formatDateTime(issue.slaResolveBy) : '—'
                      : formatDateTime(new Date(new Date(issue.createdAt).getTime() + 3600000).toISOString())}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Claimed Within 1h</p>
                  {issue.slaAcknowledged === null ? (
                    <span className="text-sm text-muted-foreground">Not yet claimed</span>
                  ) : issue.slaAcknowledged ? (
                    <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-red-700 font-medium">
                      <XCircle className="h-4 w-4" />
                      No
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {issue.attachments.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Attachments ({issue.attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentList attachments={issue.attachments} />
            </CardContent>
          </Card>
        )}

        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <IssueConversation issue={issue} />
          </CardContent>
        </Card>

        {/* Reply / Action Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isUnassigned ? 'Claim Issue' : isAssignee ? 'Reply' : 'Issue Status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReplyForm
              onReply={handleReply}
              onResolve={handleResolve}
              onReopen={handleReopen}
              onClaim={isUnassigned ? handleClaim : undefined}
              onTransfer={isAssignee ? handleTransfer : undefined}
              isResolved={issue.status === 'completed'}
              isAssignee={isAssignee}
              isUnassigned={isUnassigned}
              currentAssigneeId={issue.assignedToId ?? undefined}
              resolvedAt={issue.resolvedAt}
              resolvedByName={issue.resolvedByName}
              assignedToName={issue.assignedToName}
            />
          </CardContent>
        </Card>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
        userEmail={issue.employeeEmail}
        userName={issue.employeeName}
      />
    </DashboardLayout>
  );
}
