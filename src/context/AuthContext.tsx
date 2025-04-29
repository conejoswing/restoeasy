
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { StaffMember, AccessLevel } from '@/app/staff/page'; // Import StaffMember type

// Storage keys are no longer needed for auth context itself
// const STAFF_STORAGE_KEY = 'restaurantStaff';
// const DEMO_PASSWORDS_KEY = 'demoPasswords';

// Initial staff data is no longer relevant for auth logic
// const initialStaffFallback: StaffMember[] = [...]

// Password handling functions are no longer needed
// const getDemoPasswords = (): Record<string, string> => {...}
// const updateDemoPassword = (username: string, pass: string) => {...}

// UserRole is now always 'admin'
type UserRole = 'admin' | null; // Keep null initially until set

interface AuthContextType {
  isAuthenticated: boolean; // Always true
  userRole: UserRole; // Always 'admin'
  // login: (user: string, pass: string) => boolean; // Remove login
  // logout: () => void; // Remove logout
  isLoading: boolean; // Keep isLoading for consistency, but always false after init
  // updatePasswordForUser: (username: string, pass: string) => void; // Remove password update
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Assume always authenticated as admin
  const isAuthenticated = true;
  const userRole: UserRole = 'admin';
  const [isLoading, setIsLoading] = useState<boolean>(false); // No async loading needed anymore for auth state
  // const [staffList, setStaffList] = useState<StaffMember[]>([]); // Remove staff list state from auth context
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Remove useEffect for loading staff data for auth purposes
  // useEffect(() => { ... }, []);

  // Remove useEffect for checking session and redirection based on auth
  // useEffect(() => { ... }, [pathname, router, isLoading, isAuthenticated, userRole, staffList]);

  // Remove login function
  // const login = (user: string, pass: string): boolean => { ... };

  // Remove logout function
  // const logout = () => { ... };

  // Remove updatePasswordForUser function
  // const updatePasswordForUser = (username: string, pass: string) => { ... };


  const value: AuthContextType = {
    isAuthenticated: true, // Always true
    userRole: 'admin', // Always admin
    // login, // Removed
    // logout, // Removed
    isLoading: false, // Always false now
    // updatePasswordForUser, // Removed
  };

  // Render children directly, no loading check needed for auth state
  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
