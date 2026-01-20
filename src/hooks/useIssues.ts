'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { issuesAPI, messagesAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Issue, StatusFilter } from '@/lib/types';

export function useIssues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchIssues = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const fetchedIssues = await issuesAPI.getMyIssues(user.id, filter);
      setIssues(fetchedIssues);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [filter, user?.id]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const createIssue = async (title: string, description: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to create an issue');
      throw new Error('Not authenticated');
    }

    try {
      const issue = await issuesAPI.createIssue(title, description, user.id);
      setIssues((prev) => [issue, ...prev]);
      toast.success('Issue created successfully');
      return issue;
    } catch (error) {
      console.error('Failed to create issue:', error);
      toast.error('Failed to create issue');
      throw error;
    }
  };

  const replyToIssue = async (issueId: string, message: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to reply');
      throw new Error('Not authenticated');
    }

    try {
      const reply = await messagesAPI.sendMessage(issueId, message, user.id);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, replies: [...issue.replies, reply] }
            : issue
        )
      );
      toast.success('Reply sent successfully');
      return reply;
    } catch (error) {
      console.error('Failed to reply to issue:', error);
      toast.error('Failed to send reply');
      throw error;
    }
  };

  const refreshIssue = async (issueId: string) => {
    try {
      const issue = await issuesAPI.getIssue(issueId);
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? issue : i))
      );
      return issue;
    } catch (error) {
      console.error('Failed to refresh issue:', error);
      throw error;
    }
  };

  return {
    issues,
    loading,
    filter,
    setFilter,
    createIssue,
    replyToIssue,
    refreshIssue,
    refetch: fetchIssues,
  };
}