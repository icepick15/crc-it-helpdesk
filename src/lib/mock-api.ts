import type {
  User,
  Issue,
  Reply,
  AdminStats,
  StatusFilter,
  AuthResponse,
  IssuesResponse,
  IssueResponse,
  ReplyResponse,
  StatsResponse,
} from './types';
import {
  mockIssues,
  mockUsers,
  getMockStats,
  mockAuthenticate,
} from './mock-data';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory store (will reset on page refresh)
let issues = [...mockIssues];
let nextIssueId = 2000;
let nextReplyId = 100;

// Get current user from localStorage
function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Mock API functions
export const mockAPI = {
  // Auth
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    await delay(500);
    const user = mockAuthenticate(email, password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    return {
      user,
      token: `mock-token-${user.id}-${Date.now()}`,
      role: user.role,
    };
  },

  // Employee APIs
  getEmployeeIssues: async (status?: StatusFilter): Promise<IssuesResponse> => {
    await delay(300);
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    let filtered = issues.filter((i) => i.employeeId === user.id);

    if (status && status !== 'all') {
      filtered = filtered.filter((i) => i.status === status);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { issues: filtered };
  },

  createIssue: async (title: string, description: string): Promise<IssueResponse> => {
    await delay(400);
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const newIssue: Issue = {
      id: String(nextIssueId++),
      title,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      replies: [],
    };

    issues.unshift(newIssue);
    return { issue: newIssue };
  },

  getIssueDetails: async (id: string): Promise<IssueResponse> => {
    await delay(200);
    const issue = issues.find((i) => i.id === id);
    if (!issue) throw new Error('Issue not found');
    return { issue };
  },

  replyToIssue: async (issueId: string, message: string): Promise<ReplyResponse> => {
    await delay(300);
    const user = getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const issue = issues.find((i) => i.id === issueId);
    if (!issue) throw new Error('Issue not found');

    const reply: Reply = {
      id: `r${nextReplyId++}`,
      issueId,
      message,
      authorRole: user.role,
      authorName: user.name,
      createdAt: new Date().toISOString(),
    };

    issue.replies.push(reply);
    issue.updatedAt = new Date().toISOString();

    return { reply };
  },

  // Admin APIs
  getStats: async (): Promise<StatsResponse> => {
    await delay(200);
    const pending = issues.filter((i) => i.status === 'pending').length;
    const completed = issues.filter((i) => i.status === 'completed').length;
    return {
      stats: {
        total: issues.length,
        pending,
        completed,
      },
    };
  },

  getAllIssues: async (status?: StatusFilter, month?: string): Promise<IssuesResponse> => {
    await delay(300);
    let filtered = [...issues];

    if (status && status !== 'all') {
      filtered = filtered.filter((i) => i.status === status);
    }

    if (month) {
      filtered = filtered.filter((i) => i.createdAt.startsWith(month));
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { issues: filtered };
  },

  resolveIssue: async (id: string): Promise<IssueResponse> => {
    await delay(300);
    const issue = issues.find((i) => i.id === id);
    if (!issue) throw new Error('Issue not found');

    issue.status = 'completed';
    issue.updatedAt = new Date().toISOString();

    return { issue };
  },
};
