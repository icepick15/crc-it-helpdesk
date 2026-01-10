'use client';

import { Button } from '@/components/ui/button';
import type { StatusFilter } from '@/lib/types';

interface FilterButtonsProps {
  currentFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
}

const filters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

export function FilterButtons({ currentFilter, onFilterChange }: FilterButtonsProps) {
  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={currentFilter === filter.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
