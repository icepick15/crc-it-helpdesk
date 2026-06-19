export type UserRole = 'employee' | 'admin';

export type IssueStatus = 'pending' | 'completed';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  floor?: string;
}

// Backend API Types (Django REST Framework)
export interface BackendUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'staff' | 'admin';
  department: string;
  floor: string;
  created_at: string;
  is_superuser?: boolean;
}

export interface BackendIssue {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  created_at: string;
  resolved_on: string | null;
  reported_by: number;
  reported_by_details?: BackendUser;
  assigned_to: number | null;
  assigned_to_details?: BackendUser;
  resolved_by: number | null;
  resolved_by_details?: BackendUser;
  conversation_count?: number;
  conversations?: BackendMessage[];
}

export interface BackendMessage {
  id: number;
  issue: number;
  message: string;
  sender: number;
  sender_details?: BackendUser;
  timestamp: string;
}

export interface BackendTokenResponse {
  access: string;
  refresh: string;
}

export interface BackendPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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
  replyCount: number;
  assignedToId: string | null;
  assignedToName: string | null;
  resolvedById: string | null;
  resolvedByName: string | null;
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
