
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
// We store passwords in session storage for demo persistence within a session.
const DEMO_PASSWORDS_KEY = 'demoPasswords'; // Session storage key

// Function to get passwords, preferring session storage, then defaults
const getDemoPasswords = (): Record<string, string> => {
    let passwords: Record<string, string> = {
        admin: 'admin',
        worker: 'worker',
    };
     // Try loading from session storage
    const storedPasswords = sessionStorage.getItem(DEMO_PASSWORDS_KEY);
    if (storedPasswords) {
        try {
            const parsed = JSON.parse(storedPasswords);
            if (typeof parsed === 'object' && parsed !== null) {
                passwords = { ...passwords, ...parsed }; // Merge stored over defaults
            }
        } catch (e) {
            console.error("Failed to parse stored passwords from session storage:", e);
        }
    } else {
        // If nothing in session storage, save the defaults
        try {
            sessionStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(passwords));
        } catch (e) {
            console.error("Failed to save default passwords to session storage:", e);
        }
    }
    return passwords;
};

// Function to update/add a password
const updateDemoPassword = (username: string, pass: string) => {
    const currentPasswords = getDemoPasswords();
    currentPasswords[username.toLowerCase()] = pass;
    try {
        sessionStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(currentPasswords));
        console.log(`Password for ${username} updated in session storage (DEMO ONLY).`);
    } catch (e) {
         console.error("Failed to save updated passwords to session storage:", e);
    }
};


type UserRole = 'admin' | 'worker' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
  updatePasswordForUser: (username: string, pass: string) => void; // Expose function to update password
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
     const storedStaff = localStorage.getItem(STAFF_STORAGE_KEY); // Read from localStorage
     let loadedStaff: StaffMember[] = [];
     if (storedStaff) {
       try {
         const parsed = JSON.parse(storedStaff);
         if (Array.isArray(parsed)) {
           loadedStaff = parsed; // Use stored data
           console.log("AuthContext: Staff loaded successfully.");
         } else {
           console.warn("AuthContext: Invalid staff data found, using fallback.");
           loadedStaff = initialStaffFallback; // Fallback
         }
       } catch (error) {
         console.error("AuthContext: Failed to parse stored staff:", error);
         loadedStaff = initialStaffFallback; // Fallback on error
       }
     } else {
       console.log("AuthContext: No staff found, using fallback and saving.");
       loadedStaff = initialStaffFallback; // Fallback if nothing stored
       // Attempt to save fallback data if nothing was found
       try {
           localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(loadedStaff));
            console.log("AuthContext: Saved fallback staff data to localStorage.");
       } catch (saveError) {
            console.error("AuthContext: Failed to save fallback staff data:", saveError);
       }
     }
     setStaffList(loadedStaff); // Set state based on loaded/fallback data
     // Load passwords after staff list is set
     getDemoPasswords(); // Ensure passwords are loaded/initialized in session storage
  }, []); // Run only once on mount


  // Check authentication status and perform redirects
  useEffect(() => {
     // Check if staff list is loaded (important for login logic)
     if (staffList.length === 0 && !localStorage.getItem(STAFF_STORAGE_KEY)) {
         console.log("AuthContext: Waiting for staff list to initialize...");
         // Return early if staff data hasn't been loaded yet (prevents premature redirects)
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
        // Check if the role still exists in the current staff list for validation
        const userExists = staffList.some(s => s.username.toLowerCase() === sessionStorage.getItem('username')?.toLowerCase() && s.accessLevel === storedRole);
        if (userExists) {
             setIsAuthenticated(true);
             setUserRole(storedRole);
        } else {
             console.warn(`AuthContext: Stored user role (${storedRole}) not found or doesn't match staff list. Logging out.`);
             setIsAuthenticated(false);
             setUserRole(null);
             sessionStorage.removeItem('isAuthenticated');
             sessionStorage.removeItem('userRole');
             sessionStorage.removeItem('username'); // Clear username too
        }

    } else {
        setIsAuthenticated(false);
        setUserRole(null);
    }
    setIsLoading(false); // Finished checking initial state

    // --- Role-based Redirection Logic ---
    if (!isLoading) { // Ensure state is loaded before redirecting
      const adminRoutes = ['/inventory', '/expenses', '/staff', '/products'];
      const publicRoutes = ['/login'];
      // Allow access to /tables and specific table IDs (/tables/*)
      const allowedRoutesRegex = /^\/tables(\/[^/]+)?$/;

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
        if (currentRole === 'worker' && !allowedRoutesRegex.test(pathname)) {
           // If worker tries to access a non-allowed route
           toast({ title: 'Acceso Denegado', description: 'No tiene permiso para acceder a esta página.', variant: 'destructive' });
           router.push('/tables'); // Redirect worker to tables page
           return;
        } else if (currentRole === 'admin' && (adminRoutes.includes(pathname) || allowedRoutesRegex.test(pathname))) {
           // Admin is allowed on admin routes AND tables routes
           // Do nothing specific
        } else if (currentRole === 'admin' && !adminRoutes.includes(pathname) && !allowedRoutesRegex.test(pathname)) {
             // If admin somehow ends up on an unknown route (e.g., typo), redirect to tables
             router.push('/tables');
             return;
        }
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
        // Use the getDemoPasswords function to retrieve current passwords
        const DEMO_PASSWORDS = getDemoPasswords();
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
      sessionStorage.setItem('username', foundUser!.username); // Store username for validation later
      toast({ title: 'Éxito', description: 'Inicio de sesión exitoso.' });
      router.push('/tables'); // Redirect to tables after successful login
      return true;
    } else {
      toast({ title: 'Error', description: 'Usuario o contraseña incorrectos.', variant: 'destructive' });
      setIsAuthenticated(false);
      setUserRole(null);
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('username');
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('username'); // Clear username
    router.push('/login');
    toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión exitosamente.' });
  };

  const updatePasswordForUser = (username: string, pass: string) => {
     updateDemoPassword(username, pass); // Use the helper function
  };


  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    login,
    logout,
    isLoading,
    updatePasswordForUser, // Expose the update function
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
