'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FilterButtons } from '@/components/shared/FilterButtons';
import type { StatusFilter } from '@/lib/types';

interface IssueFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

export function IssueFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: IssueFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <FilterButtons
        currentFilter={statusFilter}
        onFilterChange={onStatusFilterChange}
      />
    </div>
  );
}
