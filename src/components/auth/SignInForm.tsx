'use client';

import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginRequest } from '@/lib/msalConfig';
import { Button } from '@/components/ui/button';

export function SignInForm() {
  const { instance } = useMsal();
  const { signInWithMicrosoft } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn() {
    setIsLoading(true);
    try {
      const result = await instance.loginPopup(loginRequest);
      await signInWithMicrosoft(result.idToken);
      toast.success('Signed in successfully');
    } catch (error) {
      // User cancelled the popup — don't show an error
      if (error instanceof Error && error.message.includes('user_cancelled')) {
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Sign in failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSignIn}
        disabled={isLoading}
        variant="outline"
        className="w-full gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            {/* Microsoft logo */}
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0H0V10H10V0Z" fill="#F25022" />
              <path d="M21 0H11V10H21V0Z" fill="#7FBA00" />
              <path d="M10 11H0V21H10V11Z" fill="#00A4EF" />
              <path d="M21 11H11V21H21V11Z" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Use your CRC corporate account to sign in
      </p>
    </div>
  );
}
