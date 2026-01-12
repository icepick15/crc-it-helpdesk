export type UserRole = 'employee' | 'admin';

export type IssueStatus = 'pending' | 'completed';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Reply {
  id: string;
  issueId: string;
  message: string;
  authorRole: UserRole;
  authorName: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  replies: Reply[];
}

export interface AdminStats {
  total: number;
  pending: number;
  completed: number;
}

// API Request Types
export interface SignInData {
  email: string;
  password: string;
}

export interface CreateIssueData {
  title: string;
  description: string;
}

export interface ReplyData {
  message: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  role: UserRole;
}

export interface IssuesResponse {
  issues: Issue[];
}

export interface IssueResponse {
  issue: Issue;
}

export interface ReplyResponse {
  reply: Reply;
}

export interface StatsResponse {
  stats: AdminStats;
}

// Filter Types
export type StatusFilter = 'all' | 'pending' | 'completed';

// Grouped Issues Type
export interface MonthlyIssueGroup {
  month: string; // e.g., "January 2024"
  year: number;
  monthNum: number;
  issues: Issue[];
}
