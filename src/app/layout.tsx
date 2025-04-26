'use client'; // Add 'use client' because usePathname is a client hook

import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import { usePathname } from 'next/navigation'; // Import usePathname
import './globals.css';
import {cn} from '@/lib/utils';
import {SidebarProvider, Sidebar, SidebarInset} from '@/components/ui/sidebar';
import AppSidebar from '@/components/app/app-sidebar';
import {Toaster} from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata can still be defined in client components, but it's often better practice
// to keep it in server components if possible. However, for this change,
// making the layout client-side is necessary for usePathname.
// export const metadata: Metadata = {
//   title: 'El Bajón de la Cami',
//   description: 'Aplicación de Gestión de Restaurantes',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showSidebar = !pathname.startsWith('/tables'); // Hide sidebar on /tables/** routes

  return (
    // The html and body tags should remain in the server component if possible,
    // but since we need usePathname, the entire component becomes client-side.
    // This structure is generally acceptable in Next.js App Router.
    <html lang="es">
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          'antialiased'
        )}
      >
        {/* Wrap with SidebarProvider regardless of whether the sidebar is shown,
            as other components might depend on the context. */}
        <SidebarProvider defaultOpen={showSidebar}>
           {/* Conditionally render the Sidebar */}
          {showSidebar && (
            <Sidebar collapsible="icon">
              <AppSidebar />
            </Sidebar>
          )}
          {/* SidebarInset will now take full width when Sidebar is not rendered */}
          <SidebarInset>{children}</SidebarInset>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
