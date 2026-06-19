'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { issuesAPI, messagesAPI, statsAPI, usersAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Issue, AdminStats, StatusFilter, User } from '@/lib/types';

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
      const fetchedIssues = await issuesAPI.getAllIssues(filter, monthFilter || undefined);
      setIssues(fetchedIssues);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [filter, monthFilter]);

  // fetchStats has stable identity (no deps) — runs only on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Re-fetch whenever filter or monthFilter changes (fetchIssues identity captures both)
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const replyToIssue = async (issueId: string, message: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to reply');
      throw new Error('Not authenticated');
    }

    try {
      const reply = await messagesAPI.sendMessage(issueId, message, {
        id: user.id,
        name: user.name,
        role: user.role,
      });
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

  const claimIssue = async (issueId: string) => {
    try {
      const updatedIssue = await issuesAPI.claimIssue(issueId);
      setIssues((prev) =>
        prev.map((issue) => (issue.id === issueId ? updatedIssue : issue))
      );
      toast.success('Issue claimed successfully');
      return updatedIssue;
    } catch (error) {
      console.error('Failed to claim issue:', error);
      toast.error('Failed to claim issue');
      throw error;
    }
  };

  const transferIssue = async (issueId: string, newUserId: string) => {
    try {
      const updatedIssue = await issuesAPI.transferIssue(issueId, newUserId);
      setIssues((prev) =>
        prev.map((issue) => (issue.id === issueId ? updatedIssue : issue))
      );
      toast.success('Issue transferred successfully');
      return updatedIssue;
    } catch (error) {
      console.error('Failed to transfer issue:', error);
      toast.error('Failed to transfer issue');
      throw error;
    }
  };

  const getAdminUsers = async (): Promise<User[]> => {
    return usersAPI.getAdminUsers();
  };

  const getIssueById = (id: string) => {
    return issues.find((issue) => issue.id === id);
  };

  const refetch = useCallback(() => {
    fetchIssues();
  }, [fetchIssues]);

  const refetchStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

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
    claimIssue,
    transferIssue,
    getAdminUsers,
    getIssueById,
    refetch,
    refetchStats,
  };
}