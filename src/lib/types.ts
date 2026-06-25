export type UserRole = 'employee' | 'admin';

export type IssueStatus = 'pending' | 'completed';

export type IssueSeverity = 'critical' | 'high' | 'low' | 'minor';

export type SLAStatus = 'unclaimed' | 'unclaimed_breach' | 'on_track' | 'warning' | 'breached' | 'resolved';

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

export interface BackendAttachment {
  id: number;
  original_name: string;
  file_size: number;
  url: string;
  uploaded_at: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface BackendIssue {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  severity: IssueSeverity;
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
  sla_resolve_by: string | null;
  sla_acknowledged: boolean | null;
  sla_status: SLAStatus | null;
  attachments?: BackendAttachment[];
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
  severity: IssueSeverity;
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
  slaResolveBy: string | null;
  slaAcknowledged: boolean | null;
  slaStatus: SLAStatus | null;
  attachments: Attachment[];
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
  severity: IssueSeverity;
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
