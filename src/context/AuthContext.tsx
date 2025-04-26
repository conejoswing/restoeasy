
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'worker' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading until checked
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Check session storage on initial load
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    const storedRole = sessionStorage.getItem('userRole') as UserRole;
    let currentAuth = false;
    let currentRole: UserRole = null;

    if (storedAuth === 'true' && storedRole) {
        currentAuth = true;
        currentRole = storedRole;
        setIsAuthenticated(true);
        setUserRole(storedRole);
    } else {
        setIsAuthenticated(false);
        setUserRole(null);
    }
    setIsLoading(false); // Finished checking initial state

    // --- Role-based Redirection Logic ---
    if (!isLoading) { // Ensure state is loaded before redirecting
      const adminRoutes = ['/inventory', '/expenses', '/staff'];
      const workerAllowedPaths = ['/tables']; // Workers can only access /tables and its subpaths
      const publicRoutes = ['/login'];

      // Regex to match /tables and /tables/*
      const workerRouteRegex = /^\/tables(\/.*)?$/;

      // Redirect authenticated users away from login
      if (currentAuth && pathname === '/login') {
        router.push('/tables'); // Redirect logged-in users to tables page
        return; // Prevent further checks
      }

      // Redirect non-authenticated users
      if (!currentAuth && !publicRoutes.includes(pathname)) {
        router.push('/login');
        return; // Prevent further checks
      }

      // Role-specific redirects for authenticated users
      if (currentAuth) {
        if (currentRole === 'worker') {
          // If worker tries to access a non-worker route
          if (!workerRouteRegex.test(pathname)) {
             toast({ title: 'Acceso Denegado', description: 'No tiene permiso para acceder a esta página.', variant: 'destructive' });
             router.push('/tables');
          }
        }
        // Admins have access to all routes, no specific redirect needed here
        // unless they land on '/', which redirects to '/tables' anyway (handled by page.tsx)
      }
    }


  }, [pathname, router, isLoading]); // Rerun check if path or loading state changes

  const login = (user: string, pass: string): boolean => {
    let role: UserRole = null;
    let success = false;

    // Simple hardcoded check
    if (user === 'admin' && pass === 'admin') {
      role = 'admin';
      success = true;
    } else if (user === '12345' && pass === '12345') {
      role = 'worker';
      success = true;
    }

    if (success && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      sessionStorage.setItem('isAuthenticated', 'true'); // Persist state
      sessionStorage.setItem('userRole', role); // Persist role
      toast({ title: 'Éxito', description: 'Inicio de sesión exitoso.' });
       router.push('/tables'); // Redirect to tables after login for both roles
      return true;
    } else {
      toast({ title: 'Error', description: 'Usuario o contraseña incorrectos.', variant: 'destructive' });
      setIsAuthenticated(false); // Ensure state is false on failed login
      setUserRole(null);
      sessionStorage.removeItem('isAuthenticated'); // Clear state
      sessionStorage.removeItem('userRole'); // Clear role
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    sessionStorage.removeItem('isAuthenticated'); // Clear state
    sessionStorage.removeItem('userRole'); // Clear role
    router.push('/login'); // Redirect to login after logout
    toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión exitosamente.' });
  };

  const value = {
    isAuthenticated,
    userRole,
    login,
    logout,
    isLoading, // Provide loading state
  };

  // Render children only after loading is complete to prevent premature rendering/redirects
  return (
      <AuthContext.Provider value={value}>
        {!isLoading ? children : <div className="flex items-center justify-center min-h-screen">Cargando...</div>}
      </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider'); // useAuth must be used within an AuthProvider
  }
  return context;
};
