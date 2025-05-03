
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Keep useRouter for logout redirect
import { useToast } from '@/hooks/use-toast';

// Storage keys
const DEMO_PASSWORDS_KEY = 'demoPasswords';
const AUTH_STATE_KEY = 'authState';

// UserRole type definition
type UserRole = 'admin' | 'worker' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
  updatePasswordForUser: (username: string, pass: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper Functions for password management (simplified)
const getDemoPasswords = (): Record<string, string> => {
    if (typeof window === 'undefined') return { admin1: 'admin1' }; // Default during SSR
    const storedPasswords = sessionStorage.getItem(DEMO_PASSWORDS_KEY);
    let passwords: Record<string, string> = { admin1: 'admin1' }; // Default includes admin1

    if (storedPasswords) {
        try {
            const parsed = JSON.parse(storedPasswords);
            if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).every(k => typeof parsed[k] === 'string')) {
                 passwords = { ...passwords, ...parsed }; // Merge stored with default, ensuring admin1 exists
            }
        } catch (e) {
            console.error("Failed to parse demo passwords from sessionStorage:", e);
        }
    }
    // Ensure admin1 always exists
    if (!passwords['admin1']) {
        passwords['admin1'] = 'admin1';
    }
    return passwords;
};

const updateDemoPassword = (username: string, pass: string) => {
     if (typeof window === 'undefined') return;
     const currentPasswords = getDemoPasswords();
     currentPasswords[username.toLowerCase()] = pass; // Store username lowercase
     try {
        sessionStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(currentPasswords));
        console.log(`AuthContext: Updated password for user ${username}`);
     } catch (e) {
        console.error("Failed to save demo passwords to sessionStorage:", e);
     }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as loading
  const router = useRouter(); // Needed for logout redirect
  const { toast } = useToast();

   // Load auth state from sessionStorage on mount
   useEffect(() => {
       console.log("AuthContext: Checking session storage for auth state...");
       const storedAuth = sessionStorage.getItem(AUTH_STATE_KEY);
       if (storedAuth) {
           try {
               const { authenticated, role } = JSON.parse(storedAuth);
               if (authenticated && (role === 'admin' || role === 'worker')) {
                   setIsAuthenticated(true);
                   setUserRole(role);
                   console.log(`AuthContext: Restored session - User: ${role}, Authenticated: true`);
               } else {
                    console.log("AuthContext: Invalid or expired session data found.");
                    setIsAuthenticated(false);
                    setUserRole(null);
                    sessionStorage.removeItem(AUTH_STATE_KEY);
               }
           } catch (error) {
               console.error("AuthContext: Failed to parse auth state from session storage:", error);
               setIsAuthenticated(false);
               setUserRole(null);
               sessionStorage.removeItem(AUTH_STATE_KEY);
           }
       } else {
           console.log("AuthContext: No active session found.");
           setIsAuthenticated(false);
           setUserRole(null);
       }

       // Initialize/ensure default passwords exist in storage
       const currentPasswords = getDemoPasswords();
       try {
           sessionStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(currentPasswords));
           console.log("AuthContext: Ensured default passwords exist.");
       } catch (e) {
           console.error("AuthContext: Failed to save ensure default passwords:", e);
       }

       setIsLoading(false); // Finished loading state
   }, []);

   // Removed redirection useEffect - moved to AuthGuard

   const login = (user: string, pass: string): boolean => {
        console.log(`AuthContext: Attempting login for user: ${user}`);
        const passwords = getDemoPasswords();
        const storedPass = passwords[user.toLowerCase()];

        if (storedPass && storedPass === pass) {
            // Determine role: 'admin1' is admin, others are worker.
             const role: UserRole = user.toLowerCase() === 'admin1' ? 'admin' : 'worker';

            setIsAuthenticated(true);
            setUserRole(role);
            sessionStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ authenticated: true, role: role }));
            console.log(`AuthContext: Login successful for user: ${user}, Role: ${role}`);
            toast({ title: "Inicio de Sesión Exitoso", description: `Bienvenido, ${user}.`, variant: "default" });
            // No automatic redirect here, handled by AuthGuard
            return true;
        } else {
            console.log(`AuthContext: Login failed for user: ${user}`);
            toast({ title: "Error de Inicio de Sesión", description: "Usuario o contraseña incorrectos.", variant: "destructive" });
            return false;
        }
   };

   const logout = () => {
        console.log("AuthContext: Logging out user.");
        setIsAuthenticated(false);
        setUserRole(null);
        sessionStorage.removeItem(AUTH_STATE_KEY);
        toast({ title: "Sesión Cerrada", description: "Ha cerrado sesión exitosamente.", variant: "default" });
        router.push('/login'); // Explicit redirect on logout
   };

   const updatePasswordForUser = (username: string, pass: string) => {
        updateDemoPassword(username, pass);
   };


  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    login,
    logout,
    isLoading,
    updatePasswordForUser,
  };

  // AuthProvider now simply provides the context value
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
