import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
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
            Get IT Support, Fast
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-8">
            Report technical issues, track progress, and communicate directly with our IT team. We&apos;re here to help you stay productive.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Quick Issue Submission</h3>
                <p className="text-sm text-primary-foreground/70">Create tickets in seconds with our simple form</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Real-time Updates</h3>
                <p className="text-sm text-primary-foreground/70">Track your ticket status and communicate with IT staff</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Issue History</h3>
                <p className="text-sm text-primary-foreground/70">Access your complete support history anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
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
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm />
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Demo credentials:</p>
              <p className="font-mono text-xs mt-1">
                employee: isaac@crc.com / password123
              </p>
              <p className="font-mono text-xs">
                admin: admin@crc.com / password123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
