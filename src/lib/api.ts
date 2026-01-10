import axios from 'axios';
import type {
  SignInData,
  CreateIssueData,
  AuthResponse,
  IssuesResponse,
  IssueResponse,
  ReplyResponse,
  StatsResponse,
  StatusFilter,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signIn: (data: SignInData) =>
    apiClient.post<AuthResponse>('/auth/signin', data),
  signOut: () => apiClient.post('/auth/signout'),
};

// Employee APIs
export const employeeAPI = {
  getIssues: (status?: StatusFilter) =>
    apiClient.get<IssuesResponse>('/issues/employee', {
      params: status && status !== 'all' ? { status } : undefined,
    }),
  createIssue: (data: CreateIssueData) =>
    apiClient.post<IssueResponse>('/issues', data),
  getIssueDetails: (id: string) =>
    apiClient.get<IssueResponse>(`/issues/${id}`),
  replyToIssue: (id: string, message: string) =>
    apiClient.post<ReplyResponse>(`/issues/${id}/reply`, { message }),
};

// Admin APIs
export const adminAPI = {
  getStats: () => apiClient.get<StatsResponse>('/admin/stats'),
  getAllIssues: (status?: StatusFilter, month?: string) =>
    apiClient.get<IssuesResponse>('/admin/issues', {
      params: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(month ? { month } : {}),
      },
    }),
  resolveIssue: (id: string) =>
    apiClient.patch<IssueResponse>(`/issues/${id}/resolve`),
  replyToIssue: (id: string, message: string) =>
    apiClient.post<ReplyResponse>(`/issues/${id}/reply`, { message }),
};

export default apiClient;
