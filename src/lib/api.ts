import axios from 'axios';
import type {
  User,
  Issue,
  Reply,
  AdminStats,
  StatusFilter,
  BackendUser,
  BackendIssue,
  BackendMessage,
  BackendTokenResponse,
  BackendPaginatedResponse,
  UserRole,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://helpdesk-api-92j8.onrender.com/api';

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
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// ============ Transformation Functions ============

function transformBackendUser(backendUser: BackendUser): User {
  return {
    id: String(backendUser.id),
    email: backendUser.email,
    name: `${backendUser.first_name} ${backendUser.last_name}`.trim(),
    role: backendUser.role === 'staff' ? 'employee' : 'admin',
    department: backendUser.department,
    floor: backendUser.floor,
  };
}

function transformBackendIssue(
  backendIssue: BackendIssue,
  messages: BackendMessage[] = [],
  reporter?: BackendUser
): Issue {
  const reporterUser = backendIssue.reported_by_details || reporter;

  return {
    id: String(backendIssue.id),
    title: backendIssue.title,
    description: backendIssue.description,
    status: backendIssue.status,
    createdAt: backendIssue.created_at,
    updatedAt: backendIssue.created_at,
    resolvedAt: backendIssue.resolved_on || undefined,
    employeeId: String(backendIssue.reported_by),
    employeeName: reporterUser
      ? `${reporterUser.first_name} ${reporterUser.last_name}`.trim()
      : 'Unknown',
    employeeEmail: reporterUser?.email || '',
    replies: messages.map(transformBackendMessage),
  };
}

function transformBackendMessage(message: BackendMessage): Reply {
  const sender = message.sender_details;
  const role: UserRole = sender?.role === 'admin' ? 'admin' : 'employee';

  return {
    id: String(message.id),
    issueId: String(message.issue),
    message: message.message,
    authorRole: role,
    authorName: sender
      ? `${sender.first_name} ${sender.last_name}`.trim()
      : 'Unknown',
    createdAt: message.timestamp,
  };
}

// Helper to fetch messages with sender details
async function fetchMessagesWithSenders(issueId: number): Promise<BackendMessage[]> {
  const messagesResponse = await apiClient.get<BackendPaginatedResponse<BackendMessage>>('/messages/', {
    params: { issue: issueId },
  });

  // Fetch sender details for each message in parallel
  const messagesWithSenders = await Promise.all(
    messagesResponse.data.results.map(async (msg) => {
      const senderResponse = await apiClient.get<BackendUser>(`/users/${msg.sender}/`);
      return { ...msg, sender_details: senderResponse.data };
    })
  );

  return messagesWithSenders;
}

// ============ Auth API ============

export const authAPI = {
  signIn: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    // Get JWT token
    const tokenResponse = await apiClient.post<BackendTokenResponse>('/token/', {
      email,
      password,
    });

    const { access, refresh } = tokenResponse.data;

    // Store tokens
    localStorage.setItem('token', access);
    localStorage.setItem('refresh_token', refresh);

    // Set token for subsequent requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    // Fetch current user info
    const usersResponse = await apiClient.get<BackendPaginatedResponse<BackendUser>>('/users/', {
      params: { email },
    });

    // Handle both paginated response (results array) and direct array response
    const usersData = usersResponse.data.results || usersResponse.data;
    const usersArray = Array.isArray(usersData) ? usersData : [];
    const backendUser = usersArray.find((u: BackendUser) => u.email === email);

    if (!backendUser) {
      throw new Error('User not found');
    }

    const user = transformBackendUser(backendUser);

    return { user, token: access };
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await apiClient.post<{ access: string }>('/token/refresh/', {
      refresh: refreshToken,
    });

    const { access } = response.data;
    localStorage.setItem('token', access);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    return access;
  },
};

// ============ Issues API ============

export const issuesAPI = {
  // Get issues for current employee
  getMyIssues: async (userId: string, status?: StatusFilter): Promise<Issue[]> => {
    const params: Record<string, string> = { reported_by: userId };
    if (status && status !== 'all') {
      params.status = status;
    }

    // Fetch issues and user details in parallel
    const [issuesResponse, userResponse] = await Promise.all([
      apiClient.get<BackendPaginatedResponse<BackendIssue>>('/issues/', { params }),
      apiClient.get<BackendUser>(`/users/${userId}/`),
    ]);

    // Fetch messages with sender details for each issue
    const issues = await Promise.all(
      issuesResponse.data.results.map(async (issue) => {
        const messagesWithSenders = await fetchMessagesWithSenders(issue.id);
        return transformBackendIssue(issue, messagesWithSenders, userResponse.data);
      })
    );

    return issues;
  },

  // Get all issues (admin)
  getAllIssues: async (status?: StatusFilter): Promise<Issue[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'all') {
      params.status = status;
    }

    const response = await apiClient.get<BackendPaginatedResponse<BackendIssue>>('/issues/', {
      params,
    });

    // Fetch messages with sender details and reporter details for each issue
    const issues = await Promise.all(
      response.data.results.map(async (issue) => {
        const [messagesWithSenders, userResponse] = await Promise.all([
          fetchMessagesWithSenders(issue.id),
          apiClient.get<BackendUser>(`/users/${issue.reported_by}/`),
        ]);
        return transformBackendIssue(issue, messagesWithSenders, userResponse.data);
      })
    );

    return issues;
  },

  // Get single issue with details
  getIssue: async (issueId: string): Promise<Issue> => {
    const issueResponse = await apiClient.get<BackendIssue>(`/issues/${issueId}/`);
    const issue = issueResponse.data;

    // Fetch messages with sender details and reporter details in parallel
    const [messagesWithSenders, userResponse] = await Promise.all([
      fetchMessagesWithSenders(issue.id),
      apiClient.get<BackendUser>(`/users/${issue.reported_by}/`),
    ]);

    return transformBackendIssue(issue, messagesWithSenders, userResponse.data);
  },

  // Create new issue
  createIssue: async (title: string, description: string, userId: string): Promise<Issue> => {
    const response = await apiClient.post<BackendIssue>('/issues/', {
      title,
      description,
      reported_by: parseInt(userId),
    });

    // Fetch user details for the created issue
    const userResponse = await apiClient.get<BackendUser>(`/users/${userId}/`);

    return transformBackendIssue(response.data, [], userResponse.data);
  },

  // Resolve issue (admin)
  resolveIssue: async (issueId: string): Promise<Issue> => {
    const response = await apiClient.patch<BackendIssue>(`/issues/${issueId}/`, {
      status: 'completed',
      resolved_on: new Date().toISOString(),
    });

    // Fetch reporter details and messages
    const [messagesWithSenders, userResponse] = await Promise.all([
      fetchMessagesWithSenders(response.data.id),
      apiClient.get<BackendUser>(`/users/${response.data.reported_by}/`),
    ]);

    return transformBackendIssue(response.data, messagesWithSenders, userResponse.data);
  },

  // Reopen issue (admin)
  reopenIssue: async (issueId: string): Promise<Issue> => {
    const response = await apiClient.patch<BackendIssue>(`/issues/${issueId}/`, {
      status: 'pending',
      resolved_on: null,
    });

    // Fetch reporter details and messages
    const [messagesWithSenders, userResponse] = await Promise.all([
      fetchMessagesWithSenders(response.data.id),
      apiClient.get<BackendUser>(`/users/${response.data.reported_by}/`),
    ]);

    return transformBackendIssue(response.data, messagesWithSenders, userResponse.data);
  },
};

// ============ Messages API ============

export const messagesAPI = {
  // Send a reply/message - accepts sender info to avoid extra API call
  sendMessage: async (
    issueId: string,
    message: string,
    sender: { id: string; name: string; role: 'employee' | 'admin' }
  ): Promise<Reply> => {
    const response = await apiClient.post<BackendMessage>('/messages/', {
      issue: parseInt(issueId),
      message,
      sender: parseInt(sender.id),
    });

    // Build reply directly from response and provided sender info (no extra API call)
    return {
      id: String(response.data.id),
      issueId: String(response.data.issue),
      message: response.data.message,
      authorRole: sender.role,
      authorName: sender.name,
      createdAt: response.data.timestamp,
    };
  },

  // Get messages for an issue
  getMessages: async (issueId: string): Promise<Reply[]> => {
    const response = await apiClient.get<BackendPaginatedResponse<BackendMessage>>('/messages/', {
      params: { issue: issueId },
    });

    return response.data.results.map(transformBackendMessage);
  },
};

// ============ Stats API ============

export const statsAPI = {
  // Calculate stats from issues (no dedicated endpoint)
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<BackendPaginatedResponse<BackendIssue>>('/issues/');

    const issues = response.data.results;
    const total = issues.length;
    const pending = issues.filter(i => i.status === 'pending').length;
    const completed = issues.filter(i => i.status === 'completed').length;

    return { total, pending, completed };
  },
};

// ============ Users API ============

export const usersAPI = {
  // Get user by ID
  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get<BackendUser>(`/users/${userId}/`);
    return transformBackendUser(response.data);
  },

  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<BackendPaginatedResponse<BackendUser>>('/users/');
    return response.data.results.map(transformBackendUser);
  },
};

// ============ Password Reset API ============

export const verifyAPI = {
  // Request password reset code (sends email with code)
  requestCode: async (email: string): Promise<void> => {
    // First find user by email
    const usersResponse = await apiClient.get<BackendPaginatedResponse<BackendUser>>('/users/', {
      params: { email },
    });

    const user = usersResponse.data.results.find(u => u.email === email);
    if (!user) {
      throw new Error('No account found with this email address');
    }

    // Create verification code (backend will send email)
    await apiClient.post('/verify/', {
      user: user.id,
    });
  },

  // Verify code and get user ID
  verifyCode: async (code: string): Promise<{ userId: string; verificationId: number }> => {
    const response = await apiClient.get<BackendPaginatedResponse<{ id: number; user: number; code: string; used: boolean }>>('/verify/', {
      params: { code },
    });

    const verification = response.data.results.find(v => v.code === code && !v.used);
    if (!verification) {
      throw new Error('Invalid or expired verification code');
    }

    return { userId: String(verification.user), verificationId: verification.id };
  },

  // Reset password with verification code
  resetPassword: async (code: string, newPassword: string): Promise<void> => {
    // First verify the code
    const { userId, verificationId } = await verifyAPI.verifyCode(code);

    // Update user password
    await apiClient.patch(`/users/${userId}/`, {
      password: newPassword,
    });

    // Mark verification code as used
    await apiClient.patch(`/verify/${verificationId}/`, {
      used: true,
    });
  },
};

export default apiClient;