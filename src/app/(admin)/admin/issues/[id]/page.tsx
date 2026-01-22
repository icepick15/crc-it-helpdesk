'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IssueConversation } from '@/components/admin/IssueConversation';
import { ReplyForm } from '@/components/admin/ReplyForm';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
      setIssue({
        ...issue,
        replies: [...issue.replies, reply],
      });
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
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
                {issue.resolvedAt && (
                  <div className="text-sm text-green-600">
                    Resolved on {formatDateTime(issue.resolvedAt)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <IssueConversation issue={issue} />
          </CardContent>
        </Card>

        {/* Reply Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <ReplyForm
              onReply={handleReply}
              onResolve={handleResolve}
              onReopen={handleReopen}
              isResolved={issue.status === 'completed'}
              resolvedAt={issue.resolvedAt}
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
