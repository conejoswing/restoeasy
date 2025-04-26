
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading until checked
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Check session storage on initial load
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    } else {
       setIsAuthenticated(false);
       // Redirect to login if not authenticated and trying to access a protected route
        const protectedRoutes = ['/inventory', '/expenses', '/staff'];
        if (protectedRoutes.includes(pathname)) {
           router.push('/login');
        }
    }
    setIsLoading(false); // Finished checking
  }, [pathname, router]); // Rerun check if path changes

  const login = (user: string, pass: string): boolean => {
    // Simple hardcoded check
    if (user === 'admin' && pass === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuthenticated', 'true'); // Persist state
      toast({ title: 'Éxito', description: 'Inicio de sesión exitoso.' });
      return true;
    } else {
      toast({ title: 'Error', description: 'Usuario o contraseña incorrectos.', variant: 'destructive' });
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuthenticated'); // Clear state
    router.push('/login'); // Redirect to login after logout
    toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión exitosamente.' });
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    isLoading, // Provide loading state
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider'); // useAuth must be used within an AuthProvider
  }
  return context;
};
