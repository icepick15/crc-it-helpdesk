import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            404
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/signin">Go to sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="javascript:history.back()">Go back</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
