import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import type { Issue, MonthlyIssueGroup } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function groupIssuesByMonth(issues: Issue[]): MonthlyIssueGroup[] {
  const groups: Record<string, MonthlyIssueGroup> = {};

  issues.forEach((issue) => {
    const date = parseISO(issue.createdAt);
    const monthKey = format(date, "yyyy-MM");
    const monthLabel = format(date, "MMMM yyyy");
    const year = date.getFullYear();
    const monthNum = date.getMonth();

    if (!groups[monthKey]) {
      groups[monthKey] = {
        month: monthLabel,
        year,
        monthNum,
        issues: [],
      };
    }

    groups[monthKey].issues.push(issue);
  });

  // Sort months descending, and issues within each month newest-first
  return Object.values(groups)
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.monthNum - a.monthNum;
    })
    .map((group) => ({
      ...group,
      issues: [...group.issues].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
}

// Ticket number in company format (e.g. CRC-0012); falls back to #id if the
// backend hasn't been redeployed with crc_id yet.
export function formatIssueId(issue: Pick<Issue, "id" | "crcId">): string {
  return issue.crcId ?? `#${issue.id}`;
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy");
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
}
