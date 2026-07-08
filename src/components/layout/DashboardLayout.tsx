'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/shared/Navbar';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  noPadding?: boolean;
}

export function DashboardLayout({ children, requireAdmin = false, noPadding = false }: DashboardLayoutProps) {
  const { isAuthenticated, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/signin');
      } else if (requireAdmin && role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, role, requireAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className={noPadding ? 'overflow-hidden' : 'container py-6'}>{children}</main>
    </div>
  );
}
