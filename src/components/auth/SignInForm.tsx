'use client';

import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginRequest } from '@/lib/msalConfig';

export function SignInForm() {
  const { instance } = useMsal();
  const { signInWithMicrosoft, isAuthenticated, role } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, role, router]);

  async function handleSignIn() {
    setIsLoading(true);
    try {
      const result = await instance.loginPopup(loginRequest);
      await signInWithMicrosoft(result.idToken);
      toast.success('Signed in successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('user_cancelled')) return;
      const message = error instanceof Error ? error.message : 'Sign in failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors duration-150 text-sm font-medium text-foreground shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M10 0H0V10H10V0Z" fill="#F25022" />
            <path d="M21 0H11V10H21V0Z" fill="#7FBA00" />
            <path d="M10 11H0V21H10V11Z" fill="#00A4EF" />
            <path d="M21 11H11V21H21V11Z" fill="#FFB900" />
          </svg>
          <span>Sign in with Microsoft</span>
        </>
      )}
    </button>
  );
}
