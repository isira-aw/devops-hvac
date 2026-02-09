import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart HVAC - Admin Panel',
  description: 'Manage HVAC chatbot knowledge base',
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
      <body className="font-sans">{children}</body>
    </html>
  );
}
