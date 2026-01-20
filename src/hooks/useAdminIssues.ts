'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { issuesAPI, messagesAPI, statsAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Issue, AdminStats, StatusFilter } from '@/lib/types';

export function useAdminIssues() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [monthFilter, setMonthFilter] = useState<string>('');

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const fetchedStats = await statsAPI.getStats();
      setStats(fetchedStats);
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
      let fetchedIssues = await issuesAPI.getAllIssues(filter);

      // Apply month filter on client side if specified
      if (monthFilter) {
        fetchedIssues = fetchedIssues.filter((issue) => {
          const issueDate = new Date(issue.createdAt);
          const issueMonth = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}`;
          return issueMonth === monthFilter;
        });
      }

      setIssues(fetchedIssues);
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

  const resolveIssue = async (issueId: string) => {
    try {
      const updatedIssue = await issuesAPI.resolveIssue(issueId);
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? updatedIssue : issue
        )
      );
      // Update stats
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        completed: prev.completed + 1,
      }));
      toast.success('Issue marked as resolved');
      return updatedIssue;
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