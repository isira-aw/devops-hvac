'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { ReactNode } from 'react';

interface GoogleAuthProviderWrapperProps {
  children: ReactNode;
}

export function GoogleAuthProviderWrapper({ children }: GoogleAuthProviderWrapperProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // If no client ID is configured, just render children without the provider
  if (!clientId) {
    console.warn('Google OAuth: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured');
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
