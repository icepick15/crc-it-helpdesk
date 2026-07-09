import axios from 'axios';
import type {
  User,
  Issue,
  Reply,
  Attachment,
  AdminStats,
  StatusFilter,
  BackendUser,
  BackendIssue,
  BackendAttachment,
  BackendMessage,
  BackendTokenResponse,
  BackendPaginatedResponse,
  UserRole,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://helpdesk-api-92j8.onrender.com/api';

const isNgrok = API_BASE_URL.includes('ngrok');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(isNgrok && { 'ngrok-skip-browser-warning': 'true' }),
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

function clearAuthAndRedirect() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/signin';
  }
}

// Queue of requests waiting for a token refresh to complete
let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let refreshQueue: QueueEntry[] = [];

function drainQueue(err: unknown, token: string | null) {
  refreshQueue.forEach((entry) => (err ? entry.reject(err) : entry.resolve(token!)));
  refreshQueue = [];
}

// Handle 401s — attempt silent token refresh before logging out
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    // Don't retry token or refresh endpoints — logout immediately
    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/token/')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Hang this request until the in-flight refresh resolves
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = typeof window !== 'undefined'
      ? localStorage.getItem('refresh_token')
      : null;

    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    try {
      const { data } = await apiClient.post<{ access: string }>('/token/refresh/', {
        refresh: refreshToken,
      });
      localStorage.setItem('token', data.access);
      drainQueue(null, data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return apiClient(original);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      clearAuthAndRedirect();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
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
    crcId: backendUser.crc_id,
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
  const assignee = backendIssue.assigned_to_details;
  const resolver = backendIssue.resolved_by_details;

  return {
    id: String(backendIssue.id),
    title: backendIssue.title,
    description: backendIssue.description,
    status: backendIssue.status,
    severity: backendIssue.severity ?? 'low',
    createdAt: backendIssue.created_at,
    updatedAt: backendIssue.created_at,
    resolvedAt: backendIssue.resolved_on || undefined,
    employeeId: String(backendIssue.reported_by),
    employeeName: reporterUser
      ? `${reporterUser.first_name} ${reporterUser.last_name}`.trim()
      : 'Unknown',
    employeeEmail: reporterUser?.email || '',
    replies: messages.map(transformBackendMessage),
    replyCount: backendIssue.conversation_count ?? backendIssue.conversations?.length ?? messages.length,
    assignedToId: backendIssue.assigned_to != null ? String(backendIssue.assigned_to) : null,
    assignedToName: assignee
      ? `${assignee.first_name} ${assignee.last_name}`.trim() || assignee.email
      : null,
    resolvedById: backendIssue.resolved_by != null ? String(backendIssue.resolved_by) : null,
    resolvedByName: resolver
      ? `${resolver.first_name} ${resolver.last_name}`.trim() || resolver.email
      : null,
    slaResolveBy: backendIssue.sla_resolve_by ?? null,
    slaAcknowledged: backendIssue.sla_acknowledged ?? null,
    slaStatus: backendIssue.sla_status ?? null,
    attachments: (backendIssue.attachments ?? []).map(transformBackendAttachment),
  };
}

function transformBackendAttachment(a: BackendAttachment): Attachment {
  return {
    id: String(a.id),
    name: a.original_name,
    size: a.file_size,
    url: a.url,
    uploadedAt: a.uploaded_at,
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

// Admin list rarely changes within a session — cache for the lifetime of the page
let adminUsersCache: User[] | null = null;

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

  // Exchange a Microsoft ID token for a Django JWT then pull the user from the backend.
  microsoftSignIn: async (idToken: string): Promise<{ user: User; token: string }> => {
    const tokenResponse = await apiClient.post<BackendTokenResponse>('/auth/microsoft/', {
      id_token: idToken,
      subdomain: 'crccreditbureau',
    });

    const { access, refresh } = tokenResponse.data;

    localStorage.setItem('token', access);
    localStorage.setItem('refresh_token', refresh);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;

    // Decode the Django JWT to get user_id, then pull the full user record from backend
    const payload = decodeJwtPayload(access);
    const backendUser = await fetchUserCached(payload.user_id);
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
    if (status && status !== 'all') params.status = status;

    const response = await apiClient.get<BackendPaginatedResponse<BackendIssue>>('/issues/', { params });
    const issuesArray = getResultsArray(response.data);
    // reported_by_details is embedded in list response — no extra user fetches needed
    return issuesArray.map((issue) => transformBackendIssue(issue, []));
  },

  // Get all issues (admin) - list view, no messages for performance
  getAllIssues: async (status?: StatusFilter, month?: string): Promise<Issue[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'all') params.status = status;
    if (month) params.month = month;

    const response = await apiClient.get<BackendPaginatedResponse<BackendIssue>>('/issues/', { params });
    const issuesArray = getResultsArray(response.data);
    // reported_by_details and conversation_count are embedded — no extra fetches needed
    return issuesArray.map((issue) => transformBackendIssue(issue, []));
  },

  // Get single issue with details
  getIssue: async (issueId: string): Promise<Issue> => {
    const issueResponse = await apiClient.get<BackendIssue>(`/issues/${issueId}/`);
    const issue = issueResponse.data;
    // reported_by_details is embedded — only need to fetch messages separately
    const messagesWithSenders = await fetchMessagesWithSenders(issue.id);
    return transformBackendIssue(issue, messagesWithSenders);
  },

  // Create new issue
  createIssue: async (title: string, description: string, userId: string, severity: string = 'low'): Promise<Issue> => {
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
      severity,
    });

    // Fetch user details for the created issue (cached)
    const userData = await fetchUserCached(userIdNum);

    return transformBackendIssue(response.data, [], userData);
  },

  // Claim an unassigned issue (admin)
  claimIssue: async (issueId: string): Promise<Issue> => {
    const response = await apiClient.patch<BackendIssue>(`/issues/${issueId}/`, {
      action: 'claim',
    });
    const [messagesWithSenders, userData] = await Promise.all([
      fetchMessagesWithSenders(response.data.id),
      fetchUserCached(response.data.reported_by),
    ]);
    return transformBackendIssue(response.data, messagesWithSenders, userData);
  },

  // Transfer issue to another IT admin (current assignee only)
  transferIssue: async (issueId: string, newUserId: string): Promise<Issue> => {
    const response = await apiClient.patch<BackendIssue>(`/issues/${issueId}/`, {
      action: 'transfer',
      assigned_to: parseInt(newUserId, 10),
    });
    const [messagesWithSenders, userData] = await Promise.all([
      fetchMessagesWithSenders(response.data.id),
      fetchUserCached(response.data.reported_by),
    ]);
    return transformBackendIssue(response.data, messagesWithSenders, userData);
  },

  // Resolve issue — only the assignee may call this
  resolveIssue: async (issueId: string): Promise<Issue> => {
    const response = await apiClient.patch<BackendIssue>(`/issues/${issueId}/`, {
      action: 'resolve',
    });
    const [messagesWithSenders, userData] = await Promise.all([
      fetchMessagesWithSenders(response.data.id),
      fetchUserCached(response.data.reported_by),
    ]);
    return transformBackendIssue(response.data, messagesWithSenders, userData);
  },

  // Reopen issue (admin)
  reopenIssue: async (issueId: string): Promise<Issue> => {
    const response = await apiClient.patch<BackendIssue>(`/issues/${issueId}/`, {
      status: 'pending',
    });
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
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>('/stats/');
    return response.data;
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

  // Get all active admin/IT users for the transfer dropdown (excludes superusers)
  getAdminUsers: async (): Promise<User[]> => {
    if (adminUsersCache) return adminUsersCache;
    const response = await apiClient.get<BackendPaginatedResponse<BackendUser>>('/users/', {
      params: { role: 'admin', is_active: 'true' },
    });
    const usersArray = getResultsArray(response.data);
    adminUsersCache = usersArray
      .filter((u) => (u.role ?? '').toLowerCase() === 'admin' && !u.is_superuser)
      .map(transformBackendUser);
    return adminUsersCache;
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

// ============ Attachments API ============

export const attachmentsAPI = {
  upload: async (issueId: string, files: File[]): Promise<Attachment[]> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const response = await apiClient.post<BackendAttachment[]>(
      `/issues/${issueId}/attachments/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.map(transformBackendAttachment);
  },
};

export default apiClient;