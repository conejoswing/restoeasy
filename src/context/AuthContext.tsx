
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

// Define possible access levels explicitly (copied from StaffPage)
type AccessLevel = 'admin' | 'worker' | 'none';

// Define StaffMember interface (copied from StaffPage)
interface StaffMember {
  id: number;
  name: string;
  role: string; // Job title (e.g., 'Mesera')
  avatarUrl?: string; // Optional avatar URL
  accessLevel?: AccessLevel; // Optional: 'admin', 'worker', or 'none' for login privileges
}

// Use the same initial staff data as StaffPage for login checks
// In a real app, this would likely come from a shared data source or API
const initialStaff: StaffMember[] = [
  { id: 1, name: 'Camila Pérez', role: 'Dueña / Gerente', avatarUrl: 'https://picsum.photos/id/237/50', accessLevel: 'admin' },
  { id: 2, name: 'Juan García', role: 'Cocinero Principal', avatarUrl: 'https://picsum.photos/id/238/50', accessLevel: 'worker' },
  { id: 3, name: 'María Rodríguez', role: 'Mesera', avatarUrl: 'https://picsum.photos/id/239/50', accessLevel: 'worker' },
  { id: 4, name: 'Carlos López', role: 'Ayudante de Cocina', avatarUrl: 'https://picsum.photos/id/240/50', accessLevel: 'none' }, // Example with no login access
];


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
      const adminRoutes = ['/inventory', '/expenses', '/staff', '/products']; // Added /products
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
    let foundUser: StaffMember | undefined = undefined;
    let success = false;
    let role: UserRole = null;

    // Find the user by name in the staff list
    foundUser = initialStaff.find(member => member.name === user);

    if (foundUser) {
      // Check password based on accessLevel
      if (foundUser.accessLevel === 'admin' && pass === 'admin') {
        success = true;
        role = 'admin';
      } else if (foundUser.accessLevel === 'worker' && pass === 'worker') { // Changed password check for worker
        success = true;
        role = 'worker';
      }
      // Users with 'none' access level or incorrect password will fail
    }

    // Handle login success or failure
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

