import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'RestoEasy',
  description: 'Restaurant Management App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          'antialiased'
        )}
      >
        <SidebarProvider defaultOpen={true}>
          <Sidebar collapsible="icon">
            <AppSidebar />
          </Sidebar>
          <SidebarInset>{children}</SidebarInset>
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}
