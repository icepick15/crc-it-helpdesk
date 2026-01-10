'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IssueConversation } from '@/components/admin/IssueConversation';
import { ReplyForm } from '@/components/admin/ReplyForm';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { mockAPI } from '@/lib/mock-api';
import { formatDateTime } from '@/lib/utils';
import type { Issue } from '@/lib/types';

export default function AdminIssueDetails() {
  const params = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  const issueId = params.id as string;

  useEffect(() => {
    async function fetchIssue() {
      setLoading(true);
      try {
        const response = await mockAPI.getIssueDetails(issueId);
        setIssue(response.issue);
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
    if (!issue) return;
    try {
      const response = await mockAPI.replyToIssue(issue.id, message);
      setIssue({
        ...issue,
        replies: [...issue.replies, response.reply],
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
      const response = await mockAPI.resolveIssue(issue.id);
      setIssue(response.issue);
      toast.success('Issue marked as resolved');
    } catch (error) {
      toast.error('Failed to resolve issue');
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
                  Created by <span className="font-medium">{issue.employeeName}</span>{' '}
                  ({issue.employeeEmail}) on {formatDateTime(issue.createdAt)}
                </div>
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
              isResolved={issue.status === 'completed'}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
