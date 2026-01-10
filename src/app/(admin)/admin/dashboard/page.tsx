'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCards } from '@/components/admin/StatsCards';
import { AllIssuesTable } from '@/components/admin/AllIssuesTable';
import { IssueFilters } from '@/components/admin/IssueFilters';
import { useAdminIssues } from '@/hooks/useAdminIssues';
import type { Issue } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const {
    issues,
    stats,
    loading,
    statsLoading,
    filter,
    setFilter,
  } = useAdminIssues();

  // Filter issues based on search query
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;

    const query = searchQuery.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.employeeName.toLowerCase().includes(query) ||
        issue.employeeEmail.toLowerCase().includes(query) ||
        issue.title.toLowerCase().includes(query) ||
        issue.id.includes(query)
    );
  }, [issues, searchQuery]);

  const handleIssueClick = (issue: Issue) => {
    router.push(`/admin/issues/${issue.id}`);
  };

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and respond to IT support requests
          </p>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} loading={statsLoading} />

        {/* Section Header & Filters */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">All Issues</h2>
          <IssueFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={filter}
            onStatusFilterChange={setFilter}
          />
        </div>

        {/* Issues Table */}
        <AllIssuesTable
          issues={filteredIssues}
          loading={loading}
          onIssueClick={handleIssueClick}
        />
      </div>
    </DashboardLayout>
  );
}
