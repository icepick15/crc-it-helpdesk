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
    'ngrok-skip-browser-warning': 'true',
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
  // Backend fields: first_name, last_name, email, role, department, floor
  // Use nullish coalescing (??) to handle null values from database

  // Validate that we have a valid ID
  if (backendUser.id === undefined || backendUser.id === null) {
    console.error('Backend user missing ID:', backendUser);
    throw new Error('User data is invalid. Please try signing in again.');
  }

  const firstName = backendUser.first_name ?? '';
  const lastName = backendUser.last_name ?? '';
  const email = backendUser.email ?? '';
  const role = backendUser.role ?? 'staff';

  // Build full name - use email username as fallback
  const combinedName = `${firstName} ${lastName}`.trim();
  const emailUsername = email.split('@')[0] || '';
  const fullName = combinedName || emailUsername || 'User';

  // Map role: only 'admin' gets admin access, everything else is employee
  const mappedRole = role.toLowerCase() === 'admin' ? 'admin' : 'employee';

  return {
    id: String(backendUser.id),
    email,
    name: fullName,
    role: mappedRole,
    department: backendUser.department ?? '',
    floor: backendUser.floor ?? '',
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

// Helper to safely get array from paginated or direct response
function getResultsArray<T>(data: { results?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

// Simple user cache to avoid duplicate fetches
const userCache = new Map<number, BackendUser>();

// Helper to fetch user with caching
async function fetchUserCached(userId: number): Promise<BackendUser> {
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }
  const response = await apiClient.get<BackendUser>(`/users/${userId}/`);
  userCache.set(userId, response.data);
  return response.data;
}

// Helper to fetch messages with sender details
async function fetchMessagesWithSenders(issueId: number): Promise<BackendMessage[]> {
  const messagesResponse = await apiClient.get<BackendPaginatedResponse<BackendMessage>>('/messages/', {
    params: { issue: issueId },
  });

  const messages = getResultsArray(messagesResponse.data);

  // Get unique sender IDs
  const uniqueSenderIds = [...new Set(messages.map((msg) => msg.sender))];

  // Fetch unique senders with caching
  await Promise.all(uniqueSenderIds.map((senderId) => fetchUserCached(senderId)));

  // Map messages with cached sender details
  return messages.map((msg) => ({
    ...msg,
    sender_details: userCache.get(msg.sender),
  }));
}

// Helper to decode JWT token payload
function decodeJwtPayload(token: string): { user_id: number } {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
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

    // Decode JWT to get user ID
    const payload = decodeJwtPayload(access);
    const userId = payload.user_id;

    // Fetch user by ID and cache it
    const backendUser = await fetchUserCached(userId);
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
  // Get issues for current employee (list view - no messages for performance)
  getMyIssues: async (userId: string, status?: StatusFilter): Promise<Issue[]> => {
    const params: Record<string, string> = { reported_by: userId };
    if (status && status !== 'all') {
      params.status = status;
    }

    // Fetch issues and user details in parallel (user is cached)
    const [issuesResponse, userData] = await Promise.all([
      apiClient.get<BackendPaginatedResponse<BackendIssue>>('/issues/', { params }),
      fetchUserCached(parseInt(userId, 10)),
    ]);

    const issuesArray = getResultsArray(issuesResponse.data);

    // Transform without fetching messages (list view optimization)
    return issuesArray.map((issue) =>
      transformBackendIssue(issue, [], userData)
    );
  },

  // Get all issues (admin) - list view, no messages for performance
  getAllIssues: async (status?: StatusFilter): Promise<Issue[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'all') {
      params.status = status;
    }

    const response = await apiClient.get<BackendPaginatedResponse<BackendIssue>>('/issues/', {
      params,
    });

    const issuesArray = getResultsArray(response.data);

    // Get unique user IDs and fetch with caching
    const uniqueUserIds = [...new Set(issuesArray.map((issue) => issue.reported_by))];
    await Promise.all(uniqueUserIds.map((userId) => fetchUserCached(userId)));

    // Transform issues using cached user data
    return issuesArray.map((issue) =>
      transformBackendIssue(issue, [], userCache.get(issue.reported_by))
    );
  },

  // Get single issue with details
  getIssue: async (issueId: string): Promise<Issue> => {
    const issueResponse = await apiClient.get<BackendIssue>(`/issues/${issueId}/`);
    const issue = issueResponse.data;

    // Fetch messages with sender details and reporter details in parallel (cached)
    const [messagesWithSenders, userData] = await Promise.all([
      fetchMessagesWithSenders(issue.id),
      fetchUserCached(issue.reported_by),
    ]);

    return transformBackendIssue(issue, messagesWithSenders, userData);
  },

  // Create new issue
  createIssue: async (title: string, description: string, userId: string): Promise<Issue> => {
    // Validate userId is a valid number
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      console.error('Invalid userId:', userId);
      throw new Error('Invalid user ID. Please sign out and sign in again.');
    }

    // Only send required fields - status has default 'pending' in backend model
    const response = await apiClient.post<BackendIssue>('/issues/', {
      title,
      description,
      reported_by: userIdNum,
    });

    // Fetch user details for the created issue (cached)
    const userData = await fetchUserCached(userIdNum);

    return transformBackendIssue(response.data, [], userData);
  },

  // Resolve issue (admin)
  resolveIssue: async (issueId: string): Promise<Issue> => {
    const resolvedTimestamp = new Date().toISOString();
    const response = await apiClient.patch<BackendIssue>(`/issues/${issueId}/`, {
      status: 'completed',
      resolved_on: resolvedTimestamp,
    });

    // Ensure resolved_on is set (use our timestamp if backend doesn't return it)
    const issueData = {
      ...response.data,
      resolved_on: response.data.resolved_on || resolvedTimestamp,
    };

    // Fetch reporter details and messages (cached)
    const [messagesWithSenders, userData] = await Promise.all([
      fetchMessagesWithSenders(issueData.id),
      fetchUserCached(issueData.reported_by),
    ]);

    return transformBackendIssue(issueData, messagesWithSenders, userData);
  },

  // Reopen issue (admin)
  reopenIssue: async (issueId: string): Promise<Issue> => {
    const response = await apiClient.patch<BackendIssue>(`/issues/${issueId}/`, {
      status: 'pending',
      resolved_on: null,
    });

    // Fetch reporter details and messages (cached)
    const [messagesWithSenders, userData] = await Promise.all([
      fetchMessagesWithSenders(response.data.id),
      fetchUserCached(response.data.reported_by),
    ]);

    return transformBackendIssue(response.data, messagesWithSenders, userData);
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

    const messagesArray = getResultsArray(response.data);
    return messagesArray.map(transformBackendMessage);
  },
};

// ============ Stats API ============

export const statsAPI = {
  // Calculate stats from issues (no dedicated endpoint)
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<BackendPaginatedResponse<BackendIssue>>('/issues/');

    const issues = getResultsArray(response.data);
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
    const usersArray = getResultsArray(response.data);
    return usersArray.map(transformBackendUser);
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

    const usersArray = getResultsArray(usersResponse.data);
    const user = usersArray.find((u: BackendUser) => u.email === email);
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

    const verifyArray = getResultsArray(response.data);
    const verification = verifyArray.find((v: { code: string; used: boolean }) => v.code === code && !v.used);
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