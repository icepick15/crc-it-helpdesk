'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FilterButtons } from '@/components/shared/FilterButtons';
import { IssueHistoryTable } from '@/components/employee/IssueHistoryTable';
import { CreateIssueModal } from '@/components/employee/CreateIssueModal';
import { IssueDetailsModal } from '@/components/employee/IssueDetailsModal';
import { Button } from '@/components/ui/button';
import { useIssues } from '@/hooks/useIssues';
import type { Issue } from '@/lib/types';

export default function EmployeeDashboard() {
  const { issues, loading, filter, setFilter, createIssue, replyToIssue, refreshIssue } = useIssues();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleIssueClick = async (issue: Issue) => {
    setSelectedIssue(issue); // Show immediately with basic info
    setDetailsModalOpen(true);

    // Fetch full details (including messages) — also updates the list
    setLoadingDetails(true);
    try {
      const fullIssue = await refreshIssue(issue.id);
      setSelectedIssue(fullIssue);
    } catch (error) {
      console.error('Failed to fetch issue details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateIssue = async (title: string, description: string, severity: string, files: File[]) => {
    await createIssue(title, description, severity, files);
  };

  const handleReply = async (issueId: string, message: string) => {
    const reply = await replyToIssue(issueId, message);
    // Update the selected issue to show the new reply
    if (selectedIssue && selectedIssue.id === issueId) {
      setSelectedIssue({
        ...selectedIssue,
        replies: [...selectedIssue.replies, reply],
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Issues</h1>
            <p className="text-muted-foreground">
              Track and manage your IT support requests
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Issue
          </Button>
        </div>

        {/* Filters */}
        <FilterButtons currentFilter={filter} onFilterChange={setFilter} />

        {/* Issue List */}
        <IssueHistoryTable
          issues={issues}
          loading={loading}
          onIssueClick={handleIssueClick}
        />
      </div>

      {/* Modals */}
      <CreateIssueModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateIssue}
      />

      <IssueDetailsModal
        issue={selectedIssue}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onReply={handleReply}
      />
    </DashboardLayout>
  );
}
