
'use client'; // Add 'use client' because usePathname is a client hook

import { usePathname } from 'next/navigation'; // Import usePathname
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider
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

// Inner component to conditionally render Sidebar and use usePathname
function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine if the sidebar should be shown
  // Show sidebar everywhere except table detail pages
  const isTableDetailPage = pathname.startsWith('/tables/') && pathname !== '/tables';
  // No need to check for login page anymore as it's removed
  const displaySidebar = !isTableDetailPage;

  // Default to collapsed state (icons only) when displayed
  const defaultSidebarOpen = false; // Set default state to collapsed

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
        {/* Conditionally render the Sidebar */}
        {displaySidebar && (
        <Sidebar collapsible="icon">
            <AppSidebar />
        </Sidebar>
        )}
        {/* SidebarInset will take full width when Sidebar is not rendered */}
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
         {/* Wrap AppContent with AuthProvider */}
         <AuthProvider>
            <AppContent>{children}</AppContent>
         </AuthProvider>
      </body>
    </html>
  );
}
