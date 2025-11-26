
'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppHeader } from '@/components/layout/app-header';
import { PageTransition } from '@/components/layout/page-transition';
import { ReservationsProvider } from '@/context/reservations-context';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { FirebaseClientProvider } from '@/firebase';
import Loading from './loading';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  const isAuthPage = useMemo(() => ['/login', '/signup'].includes(pathname), [pathname]);
  const isOwnerPage = useMemo(() => pathname.startsWith('/owner'), [pathname]);
  const isCameraPage = useMemo(() => pathname === '/violations/camera', [pathname]);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role');
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setRole(storedRole);
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [pathname]); // Rerun on path change to reflect login/logout

  const showHeader = useMemo(() => {
    if (!isClient || isCameraPage) return false;
    if (role === 'owner' && isOwnerPage) return true;
    if (role !== 'owner' && user && !isAuthPage) return true;
    return false;
  }, [role, isOwnerPage, user, isAuthPage, isClient, isCameraPage]);

  useEffect(() => {
    if (isLoading || !isClient) return;

    if (role === 'owner') {
      if (!isOwnerPage) {
        router.replace('/owner');
      }
      return;
    }
    
    if (user) { // Logged-in user
      if (isAuthPage) {
          router.replace('/home');
      }
    } else { // Logged-out user
      if (!isAuthPage && !isCameraPage) {
        router.replace('/login');
      }
    }
  }, [user, isLoading, isAuthPage, isOwnerPage, router, isClient, pathname, isCameraPage, role]);

  if (isLoading || !isClient) {
    return <Loading />;
  }
  
  // Prevent flicker during redirects
  if (role === 'owner' && !isOwnerPage) return <Loading />;
  if (user && isAuthPage) return <Loading />;
  if (!user && !isAuthPage && !isCameraPage && role !== 'owner') return <Loading />;
  
  const content = (
    <>
      {showHeader && <AppHeader />}
      <main className="flex flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
  
  return showHeader ? <ReservationsProvider>{content}</ReservationsProvider> : content;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ParkEasy</title>
        <meta name="description" content="Your one-stop solution for hassle-free parking." />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <FirebaseClientProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted">
              <AppContent>{children}</AppContent>
            </div>
            <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
