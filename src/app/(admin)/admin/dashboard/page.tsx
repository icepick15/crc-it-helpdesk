'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileDown } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsCards } from '@/components/admin/StatsCards';
import { AllIssuesTable } from '@/components/admin/AllIssuesTable';
import { IssueFilters } from '@/components/admin/IssueFilters';
import { GenerateReportModal } from '@/components/admin/GenerateReportModal';
import { Button } from '@/components/ui/button';
import { useAdminIssues } from '@/hooks/useAdminIssues';
import type { Issue } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const {
    issues,
    stats,
    loading,
    statsLoading,
    filter,
    setFilter,
    claimIssue,
  } = useAdminIssues();

  // Filter issues based on search query
  const filteredIssues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? issues.filter(
          (issue) =>
            issue.employeeName.toLowerCase().includes(query) ||
            issue.employeeEmail.toLowerCase().includes(query) ||
            issue.title.toLowerCase().includes(query) ||
            issue.id.includes(query)
        )
      : issues;

    // Newest tickets always at the top
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [issues, searchQuery]);

  const handleIssueClick = (issue: Issue) => {
    router.push(`/admin/issues/${issue.id}`);
  };

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and respond to IT support requests
            </p>
          </div>
          <Button onClick={() => setShowReportModal(true)} className="gap-2">
            <FileDown className="h-4 w-4" />
            Generate Report
          </Button>
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
          onClaim={(id) => claimIssue(id).then(() => undefined)}
        />
      </div>

      {/* Generate Report Modal */}
      <GenerateReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        issues={issues}
      />
    </DashboardLayout>
  );
}
