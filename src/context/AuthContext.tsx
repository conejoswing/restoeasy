
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { StaffMember, AccessLevel } from '@/app/staff/page'; // Import StaffMember type

// Storage key for staff data
const STAFF_STORAGE_KEY = 'restaurantStaff';
// Storage key for passwords (session storage)
const DEMO_PASSWORDS_KEY = 'demoPasswords';

// Initial staff data ONLY used if localStorage is empty or invalid
const initialStaffFallback: StaffMember[] = [
  { id: 1, name: 'Camila Pérez', username: 'admin1', role: 'Dueña / Gerente', avatarUrl: 'https://picsum.photos/id/237/50', accessLevel: 'admin' },
  { id: 2, name: 'Juan García', username: 'worker', role: 'Cocinero Principal', avatarUrl: 'https://picsum.photos/id/238/50', accessLevel: 'worker' },
  { id: 4, name: 'Carlos López', username: 'carlos', role: 'Ayudante de Cocina', avatarUrl: 'https://picsum.photos/id/240/50', accessLevel: 'none' }, // Example with no login access
];


// Function to get passwords, preferring session storage, then defaults
const getDemoPasswords = (): Record<string, string> => {
    // Default admin password mapping: admin1: admin1
    let passwords: Record<string, string> = {
        admin1: 'admin1', // Default admin password
        worker: 'worker', // Default worker password
    };

    // Try loading from session storage
    const storedPasswords = sessionStorage.getItem(DEMO_PASSWORDS_KEY);
    if (storedPasswords) {
        try {
            const parsed = JSON.parse(storedPasswords);
            if (typeof parsed === 'object' && parsed !== null) {
                // Ensure defaults exist if they were somehow removed from storage
                passwords = { ...passwords, ...parsed }; // Merge stored over defaults
            } else {
                console.warn("AuthContext: Invalid password data in session storage, using defaults.");
            }
        } catch (e) {
            console.error("AuthContext: Failed to parse stored passwords from session storage:", e);
            // Keep default passwords if parsing fails
        }
    } else { // Line 46 where the error was reported
        console.log("AuthContext: No passwords found in session storage, initializing defaults.");
        // If nothing in session storage, save the defaults
        try {
            sessionStorage.setItem(DEMO_PASSWORDS_KEY, JSON.stringify(passwords));
            console.log("AuthContext: Saved default passwords to session storage.");
        } catch (saveError) {
            console.error("AuthContext: Failed to save default passwords to session storage:", saveError);
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
        console.log(`AuthContext: Password updated for ${usernameLower} in session storage.`);
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
     const storedStaff = localStorage.getItem(STAFF_STORAGE_KEY); // Read from localStorage
     let loadedStaff: StaffMember[] = [];
     let shouldInitializePasswords = false;

     if (storedStaff) {
       try {
         const parsed = JSON.parse(storedStaff);
         if (Array.isArray(parsed)) {
           loadedStaff = parsed; // Use stored data
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
          // Initialize passwords for fallback users if needed
          // Ensure 'admin1' has a password
          if (!currentPasswords['admin1']) {
            updateDemoPassword('admin1', 'admin1');
          }
          // Ensure 'worker' has a password
          if (!currentPasswords['worker']) {
            updateDemoPassword('worker', 'worker');
          }
          // Add other initializations if necessary
     }
     console.log("AuthContext: Staff list and passwords initialization complete.");
     setIsLoading(false); // Staff loaded, passwords initialized, set loading to false
  }, []); // Run only once on mount


  // Check authentication status and perform redirects
  useEffect(() => {
     // Don't run redirection logic until staff list is loaded AND initial loading is false
     if (isLoading) {
         return;
     }

    // Check session storage for authentication state
    const storedAuth = sessionStorage.getItem('isAuthenticated');
    // Cast to UserRole is safe here as we validate against StaffMember type below
    const storedRole = sessionStorage.getItem('userRole') as UserRole;
    const storedUsername = sessionStorage.getItem('username'); // Get stored username
    let sessionValid = false;

    if (storedAuth === 'true' && storedRole && storedUsername) {
        console.log(`AuthContext: Found session data for user: ${storedUsername}, role: ${storedRole}`);
        // Check if the user stored in session still exists in the current staff list with the same role/privileges
        // Username check is case insensitive
        const userExists = staffList.some(s =>
            s.username.toLowerCase() === storedUsername.toLowerCase() &&
            // Ensure the access level is one of the allowed login roles and matches the stored role
            (s.accessLevel === 'admin' || s.accessLevel === 'worker') && // Check allowed access levels
            s.accessLevel === storedRole && // Check if the *stored* role matches the current staff member's allowed access level
            s.accessLevel !== 'none' // Ensure they still have privileges
        );

        if (userExists) {
             console.log(`AuthContext: User ${storedUsername} validated from session.`);
             // Only set state if it's different from current state to avoid loops
             if (!isAuthenticated) setIsAuthenticated(true);
             if (userRole !== storedRole) setUserRole(storedRole);
             sessionValid = true;
        } else {
             console.warn(`AuthContext: Stored user (${storedUsername}) not found or role/privileges mismatch. Invalidating session.`);
             if (isAuthenticated) setIsAuthenticated(false); // Only update if needed
             if (userRole !== null) setUserRole(null); // Only update if needed
             sessionStorage.removeItem('isAuthenticated');
             sessionStorage.removeItem('userRole');
             sessionStorage.removeItem('username'); // Clear username too
        }

    } else {
        console.log("AuthContext: No valid session data found.");
        if (isAuthenticated) setIsAuthenticated(false); // Only update if needed
        if (userRole !== null) setUserRole(null); // Only update if needed
    }

    // --- Role-based Redirection Logic ---
    console.log(`AuthContext: Applying redirection logic. Path: ${pathname}, Auth: ${isAuthenticated}, Role: ${userRole}`);
    const adminRoutes = ['/inventory', '/expenses', '/staff', '/products'];
    const publicRoutes = ['/login'];
    // Allow access to /tables and specific table IDs (/tables/*)
    const allowedRoutesRegex = /^\/tables(\/[^/]+)?$/;

    // Redirect authenticated users away from login
    if (isAuthenticated && pathname === '/login') {
        console.log("AuthContext: Redirecting authenticated user from /login to /tables");
        router.push('/tables');
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
          router.push('/tables');
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

  }, [pathname, router, isLoading, isAuthenticated, userRole, staffList]); // Rerun check if path, loading state, auth state, or staffList changes

  const login = (user: string, pass: string): boolean => {
    console.log(`AuthContext: Attempting login for user: ${user}`);
    // Ensure staff list is loaded before attempting login
    if (isLoading || staffList.length === 0) {
        console.error("AuthContext: Login attempt failed - Staff list not loaded or still loading.");
        toast({ title: 'Error', description: 'Error al cargar datos de personal. Intente de nuevo.', variant: 'destructive' });
        return false; // Prevent login if staff list isn't ready
    }

    let foundUser: StaffMember | undefined = undefined;
    let success = false;
    let role: UserRole = null;

    // Find user by username (case-insensitive) from the loaded staff list
    const usernameLower = user.toLowerCase();
    foundUser = staffList.find(member => member.username.toLowerCase() === usernameLower);

    // Check if user exists and has login privileges ('admin' or 'worker')
    if (foundUser && foundUser.accessLevel && (foundUser.accessLevel === 'admin' || foundUser.accessLevel === 'worker')) {
        role = foundUser.accessLevel; // Assign the role
        // Use the getDemoPasswords function to retrieve current passwords
        const DEMO_PASSWORDS = getDemoPasswords();
        // Look up password based on the found user's username (lowercase)
        const expectedPassword = DEMO_PASSWORDS[usernameLower]; // Case-insensitive lookup
        console.log(`AuthContext: Found user '${foundUser.username}' with role '${role}'.`);
        console.log(`AuthContext: Expected password for '${usernameLower}': '${expectedPassword}'`);
        console.log(`AuthContext: Password provided: '${pass}'`);

        // Simple password check (replace with secure hashing in production)
        if (expectedPassword && pass === expectedPassword) {
            console.log("AuthContext: Password matches.");
            success = true;
        } else {
             console.log("AuthContext: Password does not match.");
        }
    } else {
        if (!foundUser) {
            console.log(`AuthContext: User '${usernameLower}' not found in staff list.`);
        } else {
            console.log(`AuthContext: User '${foundUser.username}' found but has access level '${foundUser.accessLevel || 'none'}', which is not allowed for login.`);
        }
    }

    // Handle login success or failure
    if (success && role && foundUser) { // Ensure foundUser and role are defined
      console.log(`AuthContext: Login successful for ${foundUser.username} with role ${role}. Setting session.`);
      setIsAuthenticated(true);
      setUserRole(role);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('userRole', role);
      sessionStorage.setItem('username', foundUser.username); // Store the actual username
      toast({ title: 'Éxito', description: `Inicio de sesión exitoso como ${foundUser.name} (${role}).` }); // More specific success message
      // Do not redirect here, let the useEffect handle redirection based on state change
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
    // Redirect is handled by useEffect when isAuthenticated changes
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
