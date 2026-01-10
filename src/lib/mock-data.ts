import type { User, Issue, AdminStats } from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'isaac@crc.com',
    name: 'Isaac E',
    role: 'employee',
  },
  {
    id: '2',
    email: 'admin@crc.com',
    name: 'IT Admin',
    role: 'admin',
  },
  {
    id: '3',
    email: 'jane@company.com',
    name: 'Jane Smith',
    role: 'employee',
  },
];

// Mock Issues
export const mockIssues: Issue[] = [
  {
    id: '1001',
    title: 'Cannot access email',
    description: 'I am unable to log into my Outlook email. It keeps showing an authentication error. I have tried resetting my password but the issue persists.',
    status: 'pending',
    createdAt: '2026-01-08T09:30:00Z',
    updatedAt: '2026-01-08T14:00:00Z',
    employeeId: '1',
    employeeName: 'Isaac E',
    employeeEmail: 'isaac@crc.com',
    replies: [
      {
        id: 'r1',
        issueId: '1001',
        message: 'Hi Isaac, I will look into this right away. Can you confirm if you can access other Microsoft services?',
        authorRole: 'admin',
        authorName: 'IT Admin',
        createdAt: '2026-01-08T10:15:00Z',
      },
      {
        id: 'r2',
        issueId: '1001',
        message: 'Yes, I can access Teams and OneDrive. Only Outlook is giving me problems.',
        authorRole: 'employee',
        authorName: 'Isaac E',
        createdAt: '2026-01-08T10:30:00Z',
      },
    ],
  },
  {
    id: '1002',
    title: 'Printer not working on 3rd floor',
    description: 'The shared printer on the 3rd floor is not responding. Multiple people have reported the same issue. The printer shows as offline.',
    status: 'completed',
    createdAt: '2026-01-06T11:00:00Z',
    updatedAt: '2026-01-06T15:30:00Z',
    employeeId: '1',
    employeeName: 'Isaac E',
    employeeEmail: 'isaac@crc.com',
    replies: [
      {
        id: 'r3',
        issueId: '1002',
        message: 'The printer has been restarted and is now working. Please try again.',
        authorRole: 'admin',
        authorName: 'IT Admin',
        createdAt: '2026-01-06T14:00:00Z',
      },
      {
        id: 'r4',
        issueId: '1002',
        message: 'It works now. Thank you!',
        authorRole: 'employee',
        authorName: 'Isaac E',
        createdAt: '2026-01-06T15:00:00Z',
      },
    ],
  },
  {
    id: '1003',
    title: 'Request for new software installation',
    description: 'I need Adobe Photoshop installed on my workstation for design work. Please let me know what approvals are needed.',
    status: 'pending',
    createdAt: '2026-01-07T08:00:00Z',
    updatedAt: '2026-01-07T08:00:00Z',
    employeeId: '1',
    employeeName: 'Isaac E',
    employeeEmail: 'isaac@crc.com',
    replies: [],
  },
  {
    id: '1004',
    title: 'VPN connection issues',
    description: 'I cannot connect to the company VPN from home. Getting timeout errors.',
    status: 'completed',
    createdAt: '2025-12-20T10:00:00Z',
    updatedAt: '2025-12-20T16:00:00Z',
    employeeId: '1',
    employeeName: 'Isaac E',
    employeeEmail: 'isaac@crc.com',
    replies: [
      {
        id: 'r5',
        issueId: '1004',
        message: 'Please try reinstalling the VPN client. I have sent you the download link via email.',
        authorRole: 'admin',
        authorName: 'IT Admin',
        createdAt: '2025-12-20T12:00:00Z',
      },
      {
        id: 'r6',
        issueId: '1004',
        message: 'Reinstalled and it works now. Thanks!',
        authorRole: 'employee',
        authorName: 'Isaac E',
        createdAt: '2025-12-20T15:00:00Z',
      },
    ],
  },
  {
    id: '1005',
    title: 'Slow computer performance',
    description: 'My computer has been running very slowly for the past week. Applications take forever to open.',
    status: 'pending',
    createdAt: '2025-12-18T09:00:00Z',
    updatedAt: '2025-12-18T09:00:00Z',
    employeeId: '3',
    employeeName: 'Jane Smith',
    employeeEmail: 'jane@company.com',
    replies: [],
  },
  {
    id: '1006',
    title: 'New laptop setup',
    description: 'I received my new laptop but need help setting it up with my accounts and software.',
    status: 'completed',
    createdAt: '2025-12-15T14:00:00Z',
    updatedAt: '2025-12-16T10:00:00Z',
    employeeId: '3',
    employeeName: 'Jane Smith',
    employeeEmail: 'jane@company.com',
    replies: [
      {
        id: 'r7',
        issueId: '1006',
        message: 'I can help you with the setup. Please bring your laptop to IT office room 201.',
        authorRole: 'admin',
        authorName: 'IT Admin',
        createdAt: '2025-12-15T15:00:00Z',
      },
    ],
  },
];

// Helper to get stats
export function getMockStats(): AdminStats {
  const pending = mockIssues.filter((i) => i.status === 'pending').length;
  const completed = mockIssues.filter((i) => i.status === 'completed').length;
  return {
    total: mockIssues.length,
    pending,
    completed,
  };
}

// Helper to get issues for a specific employee
export function getMockEmployeeIssues(employeeId: string): Issue[] {
  return mockIssues
    .filter((i) => i.employeeId === employeeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Helper to authenticate
export function mockAuthenticate(email: string, password: string): User | null {
  // Simple mock auth - password is "password123" for all users
  if (password !== 'password123') return null;
  return mockUsers.find((u) => u.email === email) || null;
}
