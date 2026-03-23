'use client';

import { useState, type ReactNode } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from '@/lib/msalConfig';

export function MsalProviderWrapper({ children }: { children: ReactNode }) {
  // useState lazy init ensures PublicClientApplication is only created on the client
  const [instance] = useState(() => new PublicClientApplication(msalConfig));

  return <MsalProvider instance={instance}>{children}</MsalProvider>;
}
