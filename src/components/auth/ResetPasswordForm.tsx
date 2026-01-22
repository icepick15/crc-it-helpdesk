'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { verifyAPI } from '@/lib/api';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem('resetEmail');
    setEmail(storedEmail);
  }, []);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: ResetPasswordFormData) {
    setIsLoading(true);
    try {
      await verifyAPI.resetPassword(data.code, data.password);
      toast.success('Password reset successfully! Please sign in with your new password.');
      // Clear the stored email
      sessionStorage.removeItem('resetEmail');
      router.push('/signin');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to reset password. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {email && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            Code sent to: <span className="font-medium">{email}</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Code</FormLabel>
              <FormControl>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter 5-digit code"
                    autoComplete="one-time-code"
                    disabled={isLoading}
                    maxLength={5}
                    className="pl-10 text-center tracking-widest font-mono text-lg"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pl-10 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pl-10 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting Password...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>
    </Form>
  );
}