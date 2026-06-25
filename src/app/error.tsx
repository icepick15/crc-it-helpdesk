'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Error
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again or contact IT support if the
            problem persists.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono pt-1">
              Reference: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/signin')}>
            Go to sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
