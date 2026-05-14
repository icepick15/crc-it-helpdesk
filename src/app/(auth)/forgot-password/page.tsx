import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
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
            <span className="text-2xl font-bold">IT Service Desk</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Forgot Your Password?
          </h1>
          <p className="text-lg text-primary-foreground/80 mb-8">
            No worries! Enter your email address and we&apos;ll send you a verification code to reset your password.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold">Enter Your Email</h3>
                <p className="text-sm text-primary-foreground/70">Provide the email associated with your account</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold">Check Your Inbox</h3>
                <p className="text-sm text-primary-foreground/70">We&apos;ll send you a 5-digit verification code</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold">Reset Your Password</h3>
                <p className="text-sm text-primary-foreground/70">Enter the code and create a new password</p>
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
            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email to receive a verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
            <div className="mt-6 text-center text-sm">
              <Link href="/signin" className="text-primary hover:underline">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}