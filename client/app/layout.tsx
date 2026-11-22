import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/lib/toast-context';
import { AuthProvider } from '@/lib/auth-context';
import { NotificationsProvider } from '@/lib/notifications-context';
import { AppShell } from '@/components/layout/AppShell';
import { PwaRegister } from '@/components/pwa/PwaRegister';

export const metadata: Metadata = {
  title: 'SaferStreets — Safer Streets. Smarter Journeys.',
  description:
    'SaferStreets is a community-driven personal-safety and mobility web app providing SafeRoute, AutoMate, JourneyGuard, and SafeAlert for safer, smarter travel.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SaferStreets',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0F19',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-[#0284C7] selection:text-white bg-[#F8FAFC] text-[#0F172A] dark:bg-[#0B0F19] dark:text-[#F1F5F9]">
        <PwaRegister />
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationsProvider>
                <AppShell>{children}</AppShell>
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
