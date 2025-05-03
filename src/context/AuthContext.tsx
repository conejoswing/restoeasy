
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
// StaffMember and AccessLevel types are no longer needed here

// Storage keys are no longer needed for auth context itself
const STAFF_STORAGE_KEY = 'restaurantStaff'; // Keep for potential future use or reference, but not used for auth
const DEMO_PASSWORDS_KEY = 'demoPasswords'; // Keep for potential future use or reference, but not used for auth

// UserRole type definition remains the same
type UserRole = 'admin' | 'worker' | null; // Keep for potential different user types in the future

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
  updatePasswordForUser: (username: string, pass: string) => void; // Keep signature but implementation will be simple
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper Functions (Keep password helpers as they might be used, even if login logic changes)
const getDemoPasswords = (): Record<string, string> => {
    if (typeof window === 'undefined') return { admin1: 'admin1' }; // Default during SSR
    const storedPasswords = sessionStorage.getItem(DEMO_PASSWORDS_KEY);
    if (storedPasswords) {
        try {
            const parsed = JSON.parse(storedPasswords);
            // Ensure it's an object with string keys and string values
            if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).every(k => typeof parsed[k] === 'string')) {
                 // Ensure default admin exists
                 if (!parsed['admin1']) {
                    parsed['admin1'] = 'admin1';
                 }
                 return parsed;
            }
        } catch (e) {
            console.error("Failed to parse demo passwords from sessionStorage:", e);
        }
    }
     // Default if not found or invalid
    return { admin1: 'admin1' };
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
  // Staff list is no longer needed in AuthContext
  // const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

   // Load auth state from sessionStorage on mount
   useEffect(() => {
       console.log("AuthContext: Checking session storage for auth state...");
       const storedAuth = sessionStorage.getItem('authState');
       if (storedAuth) {
           try {
               const { authenticated, role } = JSON.parse(storedAuth);
               if (authenticated && (role === 'admin' || role === 'worker')) {
                   setIsAuthenticated(true);
                   setUserRole(role);
                   console.log(`AuthContext: Restored session - User: ${role}, Authenticated: true`);
               } else {
                    console.log("AuthContext: Invalid or expired session data found.");
                    // Ensure defaults if data is invalid
                    setIsAuthenticated(false);
                    setUserRole(null);
                    sessionStorage.removeItem('authState'); // Clean up invalid data
               }
           } catch (error) {
               console.error("AuthContext: Failed to parse auth state from session storage:", error);
               setIsAuthenticated(false);
               setUserRole(null);
               sessionStorage.removeItem('authState'); // Clean up corrupted data
           }
       } else {
           console.log("AuthContext: No active session found.");
           // Ensure defaults if no data found
           setIsAuthenticated(false);
           setUserRole(null);
       }
       // Initialize default passwords if not present (only runs once on client)
       if (!sessionStorage.getItem(DEMO_PASSWORDS_KEY)) {
           updateDemoPassword('admin1', 'admin1'); // Ensure admin1:admin1 exists
       }
       setIsLoading(false); // Finished loading state
   }, []);

   // Redirect logic based on auth state
   useEffect(() => {
       if (isLoading) return; // Don't redirect while loading state

       console.log(`AuthContext: Pathname: ${pathname}, IsAuthenticated: ${isAuthenticated}, UserRole: ${userRole}`);

       const isLoginPage = pathname === '/login';

       if (!isAuthenticated && !isLoginPage) {
           console.log("AuthContext: User not authenticated, redirecting to /login");
           router.push('/login');
       } else if (isAuthenticated && isLoginPage) {
           console.log("AuthContext: User authenticated, redirecting from /login to /tables");
           router.push('/tables');
       } else if (isAuthenticated && userRole === 'worker') {
           // Redirect worker if they try to access admin-only pages
           const adminPages = ['/inventory', '/expenses', '/products']; // Removed '/staff'
           if (adminPages.some(adminPath => pathname.startsWith(adminPath))) {
                console.log(`AuthContext: Worker trying to access admin page ${pathname}, redirecting to /tables`);
                toast({ title: "Acceso Denegado", description: "No tiene permisos para acceder a esta página.", variant: "destructive" });
                router.push('/tables');
           }
       }

   }, [pathname, router, isLoading, isAuthenticated, userRole, toast]); // Added toast


   const login = (user: string, pass: string): boolean => {
        console.log(`AuthContext: Attempting login for user: ${user}`);
        const passwords = getDemoPasswords();
        const storedPass = passwords[user.toLowerCase()]; // Check against lowercase username

        if (storedPass && storedPass === pass) {
            // Determine role (simplified: 'admin1' is admin, others are worker)
            const role: UserRole = user.toLowerCase() === 'admin1' ? 'admin' : 'worker'; // Simplified role assignment

            setIsAuthenticated(true);
            setUserRole(role);
            // Store auth state in sessionStorage
            sessionStorage.setItem('authState', JSON.stringify({ authenticated: true, role: role }));
            console.log(`AuthContext: Login successful for user: ${user}, Role: ${role}`);
            toast({ title: "Inicio de Sesión Exitoso", description: `Bienvenido, ${user}.`, variant: "default" });
            router.push('/tables'); // Redirect to tables page after successful login
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
        // Clear auth state from sessionStorage
        sessionStorage.removeItem('authState');
        toast({ title: "Sesión Cerrada", description: "Ha cerrado sesión exitosamente.", variant: "default" });
        router.push('/login'); // Redirect to login page after logout
   };

   // updatePasswordForUser remains, simplified, might not be needed if staff page is gone
   const updatePasswordForUser = (username: string, pass: string) => {
        updateDemoPassword(username, pass);
        // Optionally re-authenticate or force logout if the current user's password changed
   };


  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    login,
    logout,
    isLoading,
    updatePasswordForUser,
  };

  // Render loading state or children based on isLoading
  // Render login page explicitly if not authenticated and not already on login page
  if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">Cargando...</div>; // Or a proper loading spinner
  }


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
