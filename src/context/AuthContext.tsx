
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { StaffMember, AccessLevel } from '@/app/staff/page'; // Import StaffMember type

// Storage key for staff data
const STAFF_STORAGE_KEY = 'restaurantStaff';

// Initial staff data ONLY used if localStorage is empty or invalid
const initialStaffFallback: StaffMember[] = [
  { id: 1, name: 'Camila Pérez', username: 'admin', role: 'Dueña / Gerente', avatarUrl: 'https://picsum.photos/id/237/50', accessLevel: 'admin' },
  { id: 2, name: 'Juan García', username: 'worker', role: 'Cocinero Principal', avatarUrl: 'https://picsum.photos/id/238/50', accessLevel: 'worker' },
  { id: 4, name: 'Carlos López', username: 'carlos', role: 'Ayudante de Cocina', avatarUrl: 'https://picsum.photos/id/240/50', accessLevel: 'none' },
];

// Demo passwords (replace with secure backend logic in production)
// These should ideally be set per user, not just per role, but using this for demo simplicity.
const DEMO_PASSWORDS: Record<string, string> = {
    admin: 'admin',
    worker: 'worker',
    // Add other usernames and their specific passwords here if needed
};

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
  const [staffList, setStaffList] = useState<StaffMember[]>([]); // State to hold staff data
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Load staff data from localStorage on initial mount
  useEffect(() => {
     console.log("AuthContext: Loading staff from localStorage...");
     const storedStaff = localStorage.getItem(STAFF_STORAGE_KEY);
     let loadedStaff: StaffMember[] = [];
     if (storedStaff) {
       try {
         const parsed = JSON.parse(storedStaff);
         if (Array.isArray(parsed)) {
           loadedStaff = parsed;
           console.log("AuthContext: Staff loaded successfully.");
         } else {
           console.warn("AuthContext: Invalid staff data found, using fallback.");
           loadedStaff = initialStaffFallback;
         }
       } catch (error) {
         console.error("AuthContext: Failed to parse stored staff:", error);
         loadedStaff = initialStaffFallback;
       }
     } else {
       console.log("AuthContext: No staff found, using fallback and saving.");
       loadedStaff = initialStaffFallback;
       // Save the fallback data if nothing was found
       try {
           localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(loadedStaff));
       } catch (saveError) {
            console.error("AuthContext: Failed to save fallback staff data:", saveError);
       }
     }
     setStaffList(loadedStaff);
  }, []); // Run only once on mount


  // Check authentication status and perform redirects
  useEffect(() => {
    if (staffList.length === 0 && !localStorage.getItem(STAFF_STORAGE_KEY)) {
         // Wait until staff list is potentially populated from storage or fallback
         console.log("AuthContext: Waiting for staff list to initialize...");
         return;
    }

    // Check session storage for authentication state
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
      const adminRoutes = ['/inventory', '/expenses', '/staff', '/products'];
      const publicRoutes = ['/login'];
      const workerRouteRegex = /^\/tables(\/.*)?$/; // Workers can only access /tables and its subpaths

      // Redirect authenticated users away from login
      if (currentAuth && pathname === '/login') {
        router.push('/tables'); // Redirect logged-in users to tables page
        return;
      }

      // Redirect non-authenticated users to login if not on a public route
      if (!currentAuth && !publicRoutes.includes(pathname)) {
        router.push('/login');
        return;
      }

      // Role-specific redirects for authenticated users
      if (currentAuth) {
        if (currentRole === 'worker' && !workerRouteRegex.test(pathname)) {
           // If worker tries to access a non-allowed route
           toast({ title: 'Acceso Denegado', description: 'No tiene permiso para acceder a esta página.', variant: 'destructive' });
           router.push('/tables');
           return;
        } else if (currentRole === 'admin' && adminRoutes.includes(pathname)) {
           // Admin is allowed, do nothing specific
        }
        // Admins are implicitly allowed on /tables as well
      }
    }

  }, [pathname, router, isLoading, staffList]); // Rerun check if path, loading state, or staffList changes

  const login = (user: string, pass: string): boolean => {
    let foundUser: StaffMember | undefined = undefined;
    let success = false;
    let role: UserRole = null;

    // Find user by username (case-insensitive) from the loaded staff list
    foundUser = staffList.find(member => member.username.toLowerCase() === user.toLowerCase());

    if (foundUser && foundUser.accessLevel && foundUser.accessLevel !== 'none') {
        // Use the DEMO_PASSWORDS map for password checking
        const expectedPassword = DEMO_PASSWORDS[foundUser.username.toLowerCase()]; // Check password based on username

        // Simple password check (replace with secure hashing in production)
        if (expectedPassword && pass === expectedPassword) {
            success = true;
            role = foundUser.accessLevel; // Assign role based on found user's level
        }
    }

    // Handle login success or failure
    if (success && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('userRole', role);
      toast({ title: 'Éxito', description: 'Inicio de sesión exitoso.' });
      router.push('/tables'); // Redirect to tables after successful login
      return true;
    } else {
      toast({ title: 'Error', description: 'Usuario o contraseña incorrectos.', variant: 'destructive' });
      setIsAuthenticated(false);
      setUserRole(null);
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('userRole');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userRole');
    router.push('/login');
    toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión exitosamente.' });
  };

  const value = {
    isAuthenticated,
    userRole,
    login,
    logout,
    isLoading,
  };

  // Render children only after loading is complete
  return (
      <AuthContext.Provider value={value}>
        {!isLoading ? children : <div className="flex items-center justify-center min-h-screen">Cargando...</div>}
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
