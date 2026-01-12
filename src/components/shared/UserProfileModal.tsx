'use client';

import { User, Mail, Briefcase, Building2, Layers } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  floor: string;
}

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userName: string;
}

// Mock user data - will be replaced with API call when backend is ready
function getMockUserProfile(email: string, name: string): UserProfile {
  // Mock data based on email domain or just return default mock
  const mockProfiles: Record<string, Partial<UserProfile>> = {
    'isaac@crc.com': {
      role: 'Cloud Engineer',
      department: 'Information Technology',
      floor: '3rd Floor',
    },
    'john@crc.com': {
      role: 'Data Analyst',
      department: 'Business Development',
      floor: '2nd Floor',
    },
    'admin@crc.com': {
      role: 'IT Administrator',
      department: 'IT Support',
      floor: '3rd Floor',
    },
  };

  const profile = mockProfiles[email.toLowerCase()] || {
    role: 'Employee',
    department: 'Operations',
    floor: '2nd Floor',
  };

  return {
    name,
    email,
    role: profile.role || 'Employee',
    department: profile.department || 'Operations',
    floor: profile.floor || '2nd Floor',
  };
}

export function UserProfileModal({
  open,
  onOpenChange,
  userEmail,
  userName,
}: UserProfileModalProps) {
  const profile = getMockUserProfile(userEmail, userName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span>User Profile</span>
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium">{profile.name}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Email Address</p>
              <p className="text-sm font-medium">{profile.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Role</p>
              <p className="text-sm font-medium">{profile.role}</p>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Department</p>
              <p className="text-sm font-medium">{profile.department}</p>
            </div>
          </div>

          {/* Floor */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Floor</p>
              <p className="text-sm font-medium">{profile.floor}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}