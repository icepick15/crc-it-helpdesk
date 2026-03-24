import Image from 'next/image';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[oklch(0.20_0.06_255)]">

      {/* Background subtle pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[oklch(0.35_0.08_255)] opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[oklch(0.28_0.07_265)] opacity-30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[oklch(0.25_0.05_255)] opacity-20 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="bg-card rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[oklch(0.40_0.10_255)] via-[oklch(0.55_0.12_255)] to-[oklch(0.40_0.10_255)]" />

          <div className="px-8 py-10 flex flex-col items-center gap-6">

            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <Image
                  src="/crc-icon.png"
                  alt="CRC Logo"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  CRC IT Helpdesk
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  CRC Credit Bureau Limited
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-border" />

            {/* Sign in section */}
            <div className="w-full flex flex-col items-center gap-3">
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Welcome back</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use your CRC Microsoft account to continue
                </p>
              </div>
              <div className="w-full">
                <SignInForm />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-muted/50 border-t border-border flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
              IT Support &bull; <span className="font-medium text-foreground/60">helpdesk@creditreferencenigeria.net</span>
            </p>
          </div>

        </div>

        {/* Below card */}
        <p className="text-center text-xs text-white/30 mt-6">
          &copy; {new Date().getFullYear()} CRC Credit Bureau Limited. All rights reserved.
        </p>
      </div>

    </div>
  );
}
