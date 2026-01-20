import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-2">
              <Image
                src="/crclogo.svg"
                alt="CRC Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold">IT Helpdesk</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Reset Your Password
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Enter the 6-digit verification code we sent to your email, then create a new secure password.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Check Your Email</h3>
                <p className="text-sm text-primary-foreground/70">Find the 6-digit code we sent you</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Create Strong Password</h3>
                <p className="text-sm text-primary-foreground/70">Use at least 6 characters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Keep It Safe</h3>
                <p className="text-sm text-primary-foreground/70">Don&apos;t share your password with anyone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background">
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center p-2 border">
                <Image
                  src="/crclogo.svg"
                  alt="CRC Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your verification code and new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm />
            <div className="mt-6 text-center text-sm space-y-2">
              <p>
                <Link href="/forgot-password" className="text-primary hover:underline">
                  Didn&apos;t receive the code? Send again
                </Link>
              </p>
              <p>
                <Link href="/signin" className="text-muted-foreground hover:underline">
                  Back to Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}