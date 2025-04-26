
'use client'; // Add 'use client' because usePathname is a client hook

import { usePathname } from 'next/navigation'; // Import usePathname
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/context/AuthContext'; // Import AuthProvider and useAuth
import { Geist, Geist_Mono } from 'next/font/google';
import * as React from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Inner component to access auth context after provider is set up
function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, userRole } = useAuth();

  // Determine if the sidebar should be shown
  // Hide on login page, non-admin users, and specific table detail pages unless it's the main tables page
   const isLoginPage = pathname === '/login';
   // Sidebar should only show for admin users on non-login pages
   const showSidebar = isAuthenticated && userRole === 'admin' && !isLoginPage;

  // Handle loading state within AuthProvider now

  // Hide sidebar on table detail page for all users
  const isTableDetailPage = pathname.startsWith('/tables/') && pathname !== '/tables';
  const displaySidebar = showSidebar && !isTableDetailPage;


  return (
    <SidebarProvider defaultOpen={displaySidebar}>
        {/* Conditionally render the Sidebar only for admins and not on table detail */}
        {displaySidebar && (
        <Sidebar collapsible="icon">
            <AppSidebar />
        </Sidebar>
        )}
        {/* SidebarInset will take full width when Sidebar is not rendered */}
        {/* Content is rendered by AuthProvider after loading check */}
        <SidebarInset>{children}</SidebarInset>
        <Toaster />
    </SidebarProvider>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="es">
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          'antialiased'
        )}
      >
        {/* AuthProvider now wraps AppContent and handles initial loading/redirects */}
        <AuthProvider>
           <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
