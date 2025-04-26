
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
  const { isAuthenticated, isLoading } = useAuth();

  // Determine if the sidebar should be shown
  // Hide on login page, and on specific table detail pages unless it's the main tables page
   const isLoginPage = pathname === '/login';
   const isTableDetailPage = pathname.startsWith('/tables/') && pathname !== '/tables';
   const showSidebar = !isLoginPage && !isTableDetailPage && isAuthenticated; // Only show if authenticated and not login/table detail

  // Handle loading state - show minimal layout or spinner
  if (isLoading && !isLoginPage) { // Don't show loader on login page itself
    return (
      <div className="flex items-center justify-center min-h-screen">
         {/* Optional: Add a loading spinner here */}
         Cargando... {/* Loading... */}
      </div>
    );
  }


  return (
    <SidebarProvider defaultOpen={showSidebar}>
        {/* Conditionally render the Sidebar */}
        {showSidebar && (
        <Sidebar collapsible="icon">
            <AppSidebar />
        </Sidebar>
        )}
        {/* SidebarInset will now take full width when Sidebar is not rendered */}
        {/* Render children only if authenticated or on the login page */}
        { (isAuthenticated || isLoginPage) ? <SidebarInset>{children}</SidebarInset> : null }
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
        <AuthProvider>
           <AppContent>{children}</AppContent>
        </AuthProvider>
      </body>
    </html>
  );
}
