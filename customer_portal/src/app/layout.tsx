import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { GoogleAuthProviderWrapper } from '@/lib/google-oauth';
import ChatbotWidget from '@/components/ChatbotWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart HVAC - Customer Portal',
  description: 'Monitor and control your HVAC units',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdn.lineicons.com/4.0/lineicons.css" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <GoogleAuthProviderWrapper>
          <AuthProvider>
            {children}
            <ChatbotWidget />
          </AuthProvider>
        </GoogleAuthProviderWrapper>
      </body>
    </html>
  );
}
