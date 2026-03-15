import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/ToastProvider';
import IntelligenceChat from '@/components/IntelligenceChat';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Med Leads GenX | Strategic Revenue Engine',
  description: 'Advanced Healthcare Lead Intelligence Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${outfit.className} bg-[#f8fafc]`} suppressHydrationWarning={true}>
        <div className="aurora-bg">
          <div className="aurora-blob bg-blue-400/20 -top-48 -left-48" />
          <div className="aurora-blob bg-sky-400/20 top-1/2 -right-48" />
          <div className="aurora-blob bg-blue-300/10 -bottom-48 left-1/4" />
        </div>
        
        <AuthProvider>
          <ToastProvider>
            {children}
            <IntelligenceChat />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

