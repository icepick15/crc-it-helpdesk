'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { mockAPI } from '@/lib/mock-api';
import type { Issue, AdminStats, StatusFilter } from '@/lib/types';

export function useAdminIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await mockAPI.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mockAPI.getAllIssues(filter, monthFilter || undefined);
      setIssues(response.issues);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [filter, monthFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

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

  const resolveIssue = async (issueId: string) => {
    try {
      const response = await mockAPI.resolveIssue(issueId);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? response.issue : issue
        )
      );
      // Update stats
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        completed: prev.completed + 1,
      }));
      toast.success('Issue marked as resolved');
      return response.issue;
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      toast.error('Failed to resolve issue');
      throw error;
    }
  };

  const getIssueById = (id: string) => {
    return issues.find((issue) => issue.id === id);
  };

  return {
    issues,
    stats,
    loading,
    statsLoading,
    filter,
    setFilter,
    monthFilter,
    setMonthFilter,
    replyToIssue,
    resolveIssue,
    getIssueById,
    refetch: fetchIssues,
    refetchStats: fetchStats,
  };
}
