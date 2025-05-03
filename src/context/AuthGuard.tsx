
'use client';

import type { ReactNode } from 'react';
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Don't redirect until loading is complete
    if (isLoading) return;

    console.log(`AuthGuard: Pathname: ${pathname}, IsAuthenticated: ${isAuthenticated}, UserRole: ${userRole}`);

    const isLoginPage = pathname === '/login';
    const adminPages = ['/inventory', '/expenses', '/products']; // List of admin-only pages

    if (!isAuthenticated && !isLoginPage) {
      console.log("AuthGuard: User not authenticated, redirecting to /login");
      router.push('/login');
    } else if (isAuthenticated && isLoginPage) {
      console.log("AuthGuard: User authenticated, redirecting from /login to /tables");
      router.push('/tables');
    } else if (isAuthenticated && userRole === 'worker') {
      // Redirect worker if they try to access admin-only pages
      if (adminPages.some(adminPath => pathname.startsWith(adminPath))) {
        console.log(`AuthGuard: Worker trying to access admin page ${pathname}, redirecting to /tables`);
        toast({ title: "Acceso Denegado", description: "No tiene permisos para acceder a esta página.", variant: "destructive" });
        router.push('/tables');
      }
    }
  }, [pathname, router, isLoading, isAuthenticated, userRole, toast]);

  // Render loading indicator while checking auth state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  // If authenticated or on the login page, render the children
  if (isAuthenticated || pathname === '/login') {
    return <>{children}</>;
  }

  // Otherwise, render null (or a loading indicator) while redirecting
  return null;
};
