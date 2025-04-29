
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
  { id: 4, name: 'Carlos López', username: 'carlos', role: 'Ayudante de Cocina', avatarUrl: 'https://picsum.photos/id/240/50', accessLevel: 'none' }, // Example with no login access
];

// Demo passwords (replace with secure backend logic in production)
// We store passwords in session storage for demo persistence within a session.
const DEMO_PASSWORDS_KEY = 'demoPasswords'; // Session storage key

// Function to get passwords, preferring session storage, then defaults
const getDemoPasswords = (): Record<string, string> => {
    console.log("AuthContext: Getting demo passwords...");
    let passwords: Record<string, string> = {
        admin: 'admin', // Default admin password
        // Default worker password is not used anymore, specific user passwords take precedence
    };
     // Try loading from session storage
    const storedPasswords = sessionStorage.getItem(DEMO_PASSWORDS_KEY);
    if (storedPasswords) {
        try {
            const parsed = JSON.parse(storedPasswords);
            if (typeof parsed === 'object' && parsed !== null) {
                passwords = { ...passwords, ...parsed }; // Merge stored over defaults
                 console.log("AuthContext: Loaded passwords from session storage:", passwords);
            } else {
                console.warn("AuthContext: Invalid password data in session storage, using defaults.");
            }
        } catch (e) {
            console.error("AuthContext: Failed to parse stored passwords from session storage:", e);
            // Keep default passwords if parsing fails
        }
    } else {
        console.log("AuthContext: No passwords found in session storage, initializing defaults.");
        // If nothing in session storage, save the defaults
        try {
            sessionStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(passwords));
            console.log("AuthContext: Saved default passwords to session storage.");
        } catch (e) {
            console.error("AuthContext: Failed to save default passwords to session storage:", e);
        }
    }
    return passwords;
};

// Function to update/add a password for a specific user
const updateDemoPassword = (username: string, pass: string) => {
    const currentPasswords = getDemoPasswords();
    // Store username in lowercase for consistency in password lookup
    const usernameLower = username.toLowerCase();
    currentPasswords[usernameLower] = pass;
    try {
        sessionStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(currentPasswords));
        console.log(`AuthContext: Password for ${usernameLower} updated in session storage (DEMO ONLY).`);
    } catch (e) {
         console.error("AuthContext: Failed to save updated passwords to session storage:", e);
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
     let shouldInitializePasswords = false;

     if (storedStaff) {
       try {
         const parsed = JSON.parse(storedStaff);
         if (Array.isArray(parsed)) {
           loadedStaff = parsed; // Use stored data
           console.log("AuthContext: Staff loaded successfully from localStorage.");
         } else {
           console.warn("AuthContext: Invalid staff data found in localStorage, using fallback.");
           loadedStaff = initialStaffFallback; // Fallback
           shouldInitializePasswords = true; // Need to initialize passwords for fallback data
         }
       } catch (error) {
         console.error("AuthContext: Failed to parse stored staff from localStorage:", error);
         loadedStaff = initialStaffFallback; // Fallback on error
         shouldInitializePasswords = true; // Need to initialize passwords for fallback data
       }
     } else {
       console.log("AuthContext: No staff found in localStorage, using fallback and saving.");
       loadedStaff = initialStaffFallback; // Fallback if nothing stored
       shouldInitializePasswords = true; // Need to initialize passwords for fallback data
       // Attempt to save fallback data if nothing was found
       try {
           localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(loadedStaff));
            console.log("AuthContext: Saved fallback staff data to localStorage.");
       } catch (saveError) {
            console.error("AuthContext: Failed to save fallback staff data to localStorage:", saveError);
       }
     }
     setStaffList(loadedStaff); // Set state based on loaded/fallback data

     // Load/Initialize passwords after staff list is set/determined
     const currentPasswords = getDemoPasswords(); // Ensure passwords map is loaded/initialized
     if (shouldInitializePasswords) {
          console.log("AuthContext: Initializing passwords for fallback staff...");
          // Initialize passwords for fallback users if needed
          if (!currentPasswords['admin']) {
            updateDemoPassword('admin', 'admin');
          }
          if (!currentPasswords['worker']) {
            // Initialize worker password ONLY if it doesn't exist. If it was set, keep it.
            updateDemoPassword('worker', 'worker');
          }
          // Add other initializations if necessary
     }
     console.log("AuthContext: Staff list and passwords initialization complete.");
  }, []); // Run only once on mount


  // Check authentication status and perform redirects
  useEffect(() => {
     // Check if staff list is loaded (important for login logic and session validation)
     if (staffList.length === 0) {
         console.log("AuthContext: Waiting for staff list to initialize for session check...");
         // Still loading if staff list is empty (might not be loaded from storage yet)
         // Keep isLoading true until staff list is populated
         return;
     }

     // Ensure password map is initialized before checking session
     getDemoPasswords();

     console.log("AuthContext: Checking session storage for authentication...");
    // Check session storage for authentication state
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    const storedRole = sessionStorage.getItem('userRole') as UserRole;
    const storedUsername = sessionStorage.getItem('username'); // Get stored username
    let sessionValid = false;

    if (storedAuth === 'true' && storedRole && storedUsername) {
        console.log(`AuthContext: Found session data for user: ${storedUsername}, role: ${storedRole}`);
        // Check if the user stored in session still exists in the current staff list with the same role/privileges
        const userExists = staffList.some(s =>
            s.username.toLowerCase() === storedUsername.toLowerCase() &&
            s.accessLevel === storedRole &&
            s.accessLevel !== 'none' // Ensure they still have privileges
        );

        if (userExists) {
             console.log(`AuthContext: User ${storedUsername} validated from session.`);
             setIsAuthenticated(true);
             setUserRole(storedRole);
             sessionValid = true;
        } else {
             console.warn(`AuthContext: Stored user (${storedUsername}) not found or role/privileges mismatch. Invalidating session.`);
             setIsAuthenticated(false);
             setUserRole(null);
             sessionStorage.removeItem('isAuthenticated');
             sessionStorage.removeItem('userRole');
             sessionStorage.removeItem('username'); // Clear username too
        }

    } else {
        console.log("AuthContext: No valid session data found.");
        setIsAuthenticated(false);
        setUserRole(null);
    }
    setIsLoading(false); // Finished checking initial state

    // --- Role-based Redirection Logic ---
    // Only redirect *after* loading is complete and session state is determined
    if (!isLoading) {
      console.log(`AuthContext: Applying redirection logic. Path: ${pathname}, Auth: ${isAuthenticated}, Role: ${userRole}`);
      const adminRoutes = ['/inventory', '/expenses', '/staff', '/products'];
      const publicRoutes = ['/login'];
      // Allow access to /tables and specific table IDs (/tables/*)
      const allowedRoutesRegex = /^\/tables(\/[^/]+)?$/;

      // Redirect authenticated users away from login
      if (isAuthenticated && pathname === '/login') {
         console.log("AuthContext: Redirecting authenticated user from /login to /tables");
        router.push('/tables'); // Redirect logged-in users to tables page
        return;
      }

      // Redirect non-authenticated users to login if not on a public route
      if (!isAuthenticated && !publicRoutes.includes(pathname)) {
         console.log(`AuthContext: Redirecting non-authenticated user from ${pathname} to /login`);
        router.push('/login');
        return;
      }

      // Role-specific redirects for authenticated users
      if (isAuthenticated) {
        if (userRole === 'worker' && !allowedRoutesRegex.test(pathname)) {
           // If worker tries to access a non-allowed route
           console.log(`AuthContext: Worker attempting to access restricted route ${pathname}. Redirecting to /tables.`);
           toast({ title: 'Acceso Denegado', description: 'No tiene permiso para acceder a esta página.', variant: 'destructive' });
           router.push('/tables'); // Redirect worker to tables page
           return;
        } else if (userRole === 'admin') {
             // Admin can access admin routes and allowed routes
             if (!adminRoutes.includes(pathname) && !allowedRoutesRegex.test(pathname)) {
                 // If admin somehow ends up on an unknown route (e.g., typo), redirect to tables
                 console.log(`AuthContext: Admin on unknown route ${pathname}. Redirecting to /tables.`);
                 router.push('/tables');
                 return;
             }
        }
        console.log(`AuthContext: User is authenticated (${userRole}) and on an allowed route (${pathname}). No redirect needed.`);
      }
    }

  }, [pathname, router, isLoading, staffList]); // Rerun check if path, loading state, or staffList changes

  const login = (user: string, pass: string): boolean => {
    console.log(`AuthContext: Attempting login for user: ${user}`);
    // Ensure staff list is loaded before attempting login
    if (staffList.length === 0) {
        console.error("AuthContext: Login attempt failed - Staff list not loaded.");
        toast({ title: 'Error', description: 'Error al cargar datos de personal. Intente de nuevo.', variant: 'destructive' });
        return false; // Prevent login if staff list isn't ready
    }

    let foundUser: StaffMember | undefined = undefined;
    let success = false;
    let role: UserRole = null;

    // Find user by username (case-insensitive) from the loaded staff list
    const usernameLower = user.toLowerCase();
    console.log("AuthContext: Current staff list:", staffList);
    foundUser = staffList.find(member => member.username.toLowerCase() === usernameLower);
    console.log(`AuthContext: Lookup result for username '${usernameLower}':`, foundUser);

    // Check if user exists and has login privileges ('admin' or 'worker')
    if (foundUser && foundUser.accessLevel && foundUser.accessLevel !== 'none') {
        console.log(`AuthContext: User '${foundUser.username}' found with access level '${foundUser.accessLevel}'.`);
        // Use the getDemoPasswords function to retrieve current passwords
        const DEMO_PASSWORDS = getDemoPasswords();
        console.log("AuthContext: Current passwords being checked against:", DEMO_PASSWORDS);
        // Look up password based on the found user's username (lowercase)
        const expectedPassword = DEMO_PASSWORDS[foundUser.username.toLowerCase()];
        console.log(`AuthContext: Expected password for '${foundUser.username.toLowerCase()}': '${expectedPassword}'`);
        console.log(`AuthContext: Password provided: '${pass}'`);

        // Simple password check (replace with secure hashing in production)
        if (expectedPassword && pass === expectedPassword) {
            console.log("AuthContext: Password matches.");
            success = true;
            role = foundUser.accessLevel; // Assign role based on found user's level
        } else {
             console.log("AuthContext: Password does not match.");
        }
    } else {
        if (!foundUser) {
            console.log(`AuthContext: User '${usernameLower}' not found in staff list.`);
        } else {
            console.log(`AuthContext: User '${foundUser.username}' found but has access level '${foundUser.accessLevel}'. Login denied.`);
        }
    }

    // Handle login success or failure
    if (success && role && foundUser) { // Ensure foundUser is defined
      console.log(`AuthContext: Login successful for ${foundUser.username} with role ${role}. Setting session.`);
      setIsAuthenticated(true);
      setUserRole(role);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('userRole', role);
      sessionStorage.setItem('username', foundUser.username); // Store the actual username
      toast({ title: 'Éxito', description: `Inicio de sesión exitoso como ${foundUser.name} (${role}).` }); // More specific success message
      router.push('/tables'); // Redirect to tables after successful login
      return true;
    } else {
      console.log("AuthContext: Login failed.");
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
    console.log("AuthContext: Logging out.");
    setIsAuthenticated(false);
    setUserRole(null);
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('username'); // Clear username on logout
    router.push('/login');
    toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión exitosamente.' });
  };

  // Function to update password in session storage (for demo)
  const updatePasswordForUser = (username: string, pass: string) => {
     console.log(`AuthContext: Updating password for user: ${username}`);
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

  // Render children only after loading is complete and staff is potentially loaded
  // We rely on the useEffect hook above to handle redirects based on auth state
  return (
      <AuthContext.Provider value={value}>
        {isLoading ? <div className="flex items-center justify-center min-h-screen">Cargando...</div> : children}
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
