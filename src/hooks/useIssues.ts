'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { mockAPI } from '@/lib/mock-api';
import type { Issue, StatusFilter } from '@/lib/types';

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mockAPI.getEmployeeIssues(filter);
      setIssues(response.issues);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const createIssue = async (title: string, description: string) => {
    try {
      const response = await mockAPI.createIssue(title, description);
      setIssues((prev) => [response.issue, ...prev]);
      toast.success('Issue created successfully');
      return response.issue;
    } catch (error) {
      console.error('Failed to create issue:', error);
      toast.error('Failed to create issue');
      throw error;
    }
  };

  const replyToIssue = async (issueId: string, message: string) => {
    try {
      const response = await mockAPI.replyToIssue(issueId, message);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId
            ? { ...issue, replies: [...issue.replies, response.reply] }
            : issue
        )
      );
      toast.success('Reply sent successfully');
      return response.reply;
    } catch (error) {
      console.error('Failed to reply to issue:', error);
      toast.error('Failed to send reply');
      throw error;
    }
  };

  const refreshIssue = async (issueId: string) => {
    try {
      const response = await mockAPI.getIssueDetails(issueId);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? response.issue : issue
        )
      );
      return response.issue;
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
