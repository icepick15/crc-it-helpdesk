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

  // Sort by year and month descending (newest first)
  return Object.values(groups).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.monthNum - a.monthNum;
  });
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy");
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
}
