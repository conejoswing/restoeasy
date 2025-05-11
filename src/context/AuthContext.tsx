

'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Keep for navigation
import { useToast } from '@/hooks/use-toast'; // Import useToast
import type { StaffMember } from '@/app/users/page'; // Import StaffMember type

// Storage keys
const USERS_STORAGE_KEY = 'restaurantUsers'; // Key for storing user data (including password hashes/placeholders) - Using localStorage now
const AUTH_STATE_KEY = 'authState'; // Key for storing session state - Using sessionStorage

// UserRole type definition
type UserRole = 'admin' | 'worker' | null;

// Interface for stored user data (excluding sensitive info like plain text passwords if using hashing)
interface StoredUser extends StaffMember {
  passwordHash: string; // Store password hash or placeholder
}

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
  users: StaffMember[]; // Expose the list of users (without password hashes)
  addUser: (newUser: Omit<StaffMember, 'id'> & { password?: string }) => void;
  deleteUser: (username: string) => void;
  updatePasswordForUser: (username: string, newPass: string) => void;
  // Consider adding updateUser function for name, role changes if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Password Hashing Placeholder ---
// In a real app, use a strong hashing library like bcrypt or argon2
// For this demo, we'll use a very simple placeholder (NOT FOR PRODUCTION)
const simpleHash = (pass: string): string => `hashed_${pass}`;
const verifyPassword = (pass: string, hash: string): boolean => hash === simpleHash(pass);
// -------------------------------------

// --- User Management Functions ---
const getUsersFromStorage = (): StoredUser[] => {
    // Guard against SSR window access
    if (typeof window === 'undefined') return [];

    // Use localStorage instead of sessionStorage
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let users: StoredUser[] = [];

    // Default admin user
    const defaultAdmin: StoredUser = {
        id: 'admin1-default',
        name: 'Admin Principal',
        username: 'admin1',
        role: 'admin',
        passwordHash: simpleHash('admin1') // Hash the default password
    };

    if (storedUsers) {
        try {
            const parsed = JSON.parse(storedUsers);
            if (Array.isArray(parsed)) {
                // Basic validation
                users = parsed.filter(u => u.id && u.name && u.username && u.role && u.passwordHash);
            } else {
                 console.warn("AuthContext: Invalid format for users in localStorage. Resetting.");
                 users = []; // Reset if format is wrong
            }
        } catch (e) {
            console.error("AuthContext: Failed to parse users from localStorage:", e);
             users = []; // Reset on error
        }
    }

    // Ensure admin1 always exists and has the correct (hashed) password and role
    const adminIndex = users.findIndex(u => u.username.toLowerCase() === 'admin1');
    if (adminIndex === -1) {
        users.push(defaultAdmin);
        console.log("AuthContext: Added default admin user.");
    } else {
        // Ensure the stored admin1 password hash is correct
        if (users[adminIndex].passwordHash !== defaultAdmin.passwordHash) {
            users[adminIndex].passwordHash = defaultAdmin.passwordHash;
            console.log("AuthContext: Corrected default admin user's password hash.");
        }
        // Ensure role is admin
        if (users[adminIndex].role !== 'admin') {
             users[adminIndex].role = 'admin';
             console.log("AuthContext: Corrected default admin user's role.");
        }
         // Ensure name is consistent
        if (users[adminIndex].name !== 'Admin Principal') {
             users[adminIndex].name = 'Admin Principal';
              console.log("AuthContext: Corrected default admin user's name.");
        }
        // Ensure id is consistent (though less critical)
         if (users[adminIndex].id !== defaultAdmin.id && !users[adminIndex].id.startsWith('admin1-')) {
             // Only update ID if it's clearly not the default or a previously generated one
             users[adminIndex].id = defaultAdmin.id;
             console.log("AuthContext: Corrected default admin user's ID.");
         }
    }

    return users;
};

const saveUsersToStorage = (users: StoredUser[]) => {
     // Guard against SSR window access
     if (typeof window === 'undefined') return;
     try {
        // Ensure admin1 is always present before saving
        const adminExists = users.some(u => u.username.toLowerCase() === 'admin1');
        if (!adminExists && users.length > 0) { // Only add if users array is not empty (prevent adding during initial empty load)
             const defaultAdmin: StoredUser = {
                id: 'admin1-default', name: 'Admin Principal', username: 'admin1',
                role: 'admin', passwordHash: simpleHash('admin1')
             };
            users.push(defaultAdmin);
             console.log("AuthContext: Ensuring default admin exists before saving.");
        } else if (!adminExists && users.length === 0) {
             // If saving an empty array, don't add admin1 yet, it will be added on next load
             console.log("AuthContext: Saving empty user list.");
        }
        // Use localStorage instead of sessionStorage
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log("AuthContext: Saved users to localStorage:", users.map(u => u.username));
     } catch (e) {
        console.error("AuthContext: Failed to save users to localStorage:", e);
     }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as loading
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]); // State to hold all user data internally
  const { toast } = useToast();

   // Load auth state and users on mount
   useEffect(() => {
       console.log("AuthContext: Initializing...");
       setIsLoading(true);

        // Load users from localStorage first
        const loadedUsers = getUsersFromStorage();
        setStoredUsers(loadedUsers);
        // Ensure storage is consistent immediately after loading, especially if defaults were applied
        if(loadedUsers.length > 0 || localStorage.getItem(USERS_STORAGE_KEY) === null) { // Check localStorage
             saveUsersToStorage(loadedUsers);
        }
        console.log("AuthContext: Loaded and potentially corrected users from localStorage:", loadedUsers.map(u => u.username));


       // Load login state from sessionStorage (session-specific)
       const storedAuth = sessionStorage.getItem(AUTH_STATE_KEY);
       if (storedAuth) {
           try {
               const parsedAuth = JSON.parse(storedAuth); // Parse first
               if (parsedAuth && typeof parsedAuth === 'object') { // Check if it's a non-null object
                   const { authenticated, username } = parsedAuth as { authenticated?: boolean, username?: string }; // Destructure safely

                   // Further checks for authenticated and username being present and of correct type
                   if (typeof authenticated === 'boolean' && typeof username === 'string') {
                       const loggedInUser = loadedUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
                       if (authenticated && loggedInUser) {
                           setIsAuthenticated(true);
                           setUserRole(loggedInUser.role);
                           console.log(`AuthContext: Restored session - User: ${loggedInUser.username}, Role: ${loggedInUser.role}, Authenticated: true`);
                       } else {
                            console.log("AuthContext: Invalid or expired session data (user not found or auth flag false). Clearing session.");
                            setIsAuthenticated(false);
                            setUserRole(null);
                            sessionStorage.removeItem(AUTH_STATE_KEY);
                       }
                   } else {
                       console.log("AuthContext: Parsed session data is missing 'authenticated' or 'username', or they have incorrect types. Clearing session.");
                       setIsAuthenticated(false);
                       setUserRole(null);
                       sessionStorage.removeItem(AUTH_STATE_KEY);
                   }
               } else {
                   console.log("AuthContext: Parsed session data is not a valid object (e.g., null or not an object). Clearing session.");
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

       setIsLoading(false); // Finished loading state
       console.log("AuthContext: Initialization complete.");
   }, []); // Run only once on mount

   // --- Context Functions ---

   const login = (usernameInput: string, pass: string): boolean => {
       if (isLoading) {
           console.warn("AuthContext: Login attempt while still loading. Aborting.");
           toast({ title: "Cargando...", description: "Espere un momento y vuelva a intentarlo.", variant: "destructive" });
           return false;
       }
       console.log(`AuthContext: Attempting login for user: ${usernameInput}`);
        const userToLogin = storedUsers.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());

        if (userToLogin && verifyPassword(pass, userToLogin.passwordHash)) {
            setIsAuthenticated(true);
            setUserRole(userToLogin.role);
            // Store session state in sessionStorage
            sessionStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ authenticated: true, username: userToLogin.username }));
            console.log(`AuthContext: Login successful for user: ${userToLogin.username}, Role: ${userToLogin.role}`);
            toast({ title: "Inicio de Sesión Exitoso", description: `Bienvenido, ${userToLogin.name}.`, variant: "default" });
            return true;
        } else {
            console.log(`AuthContext: Login failed for user: ${usernameInput}`);
            toast({ title: "Error de Inicio de Sesión", description: "Usuario o contraseña incorrectos.", variant: "destructive" });
            return false;
        }
   };

   const logout = () => {
        console.log("AuthContext: Logging out user.");
        setIsAuthenticated(false);
        setUserRole(null);
        // Clear session state from sessionStorage
        sessionStorage.removeItem(AUTH_STATE_KEY);
        toast({ title: "Sesión Cerrada", description: "Ha cerrado sesión exitosamente.", variant: "default" });
   };

    const addUser = useCallback((newUser: Omit<StaffMember, 'id'> & { password?: string }) => {
        if (!newUser.password) {
            throw new Error("Password is required to add a new user.");
        }
        const usernameLower = newUser.username.toLowerCase();
        const usernameExists = storedUsers.some(u => u.username.toLowerCase() === usernameLower);
        if (usernameExists) {
            throw new Error(`El nombre de usuario "${newUser.username}" ya está en uso.`);
        }
        if (usernameLower === 'admin1') {
            throw new Error(`El nombre de usuario "admin1" está reservado.`);
        }

        const userToAdd: StoredUser = {
            id: `${usernameLower}-${Date.now()}`, // Simple unique ID
            name: newUser.name,
            username: newUser.username,
            role: newUser.role,
            passwordHash: simpleHash(newUser.password) // Hash the password
        };

        setStoredUsers(prevUsers => {
             const updated = [...prevUsers, userToAdd];
             saveUsersToStorage(updated); // Save updated list to localStorage
             return updated;
        });
        console.log(`AuthContext: Added user ${userToAdd.username}`);
    }, [storedUsers]); // Depend on storedUsers

    const deleteUser = useCallback((username: string) => {
         const usernameLower = username.toLowerCase();
         if (usernameLower === 'admin1') {
             throw new Error("No se puede eliminar al administrador principal.");
         }

         setStoredUsers(prevUsers => {
             const updatedUsers = prevUsers.filter(u => u.username.toLowerCase() !== usernameLower);
             if (updatedUsers.length === prevUsers.length) {
                 throw new Error(`Usuario "${username}" no encontrado.`);
             }
             saveUsersToStorage(updatedUsers); // Save updated list to localStorage
             return updatedUsers;
         });
         console.log(`AuthContext: Deleted user ${username}`);
    }, [storedUsers]);

   const updatePasswordForUser = useCallback((username: string, newPass: string) => {
       const usernameLower = username.toLowerCase();

       setStoredUsers(prevUsers => {
           const userIndex = prevUsers.findIndex(u => u.username.toLowerCase() === usernameLower);
           if (userIndex === -1) {
               throw new Error(`Usuario "${username}" no encontrado.`);
           }

           const updatedUsers = [...prevUsers];
           updatedUsers[userIndex] = {
               ...updatedUsers[userIndex],
               passwordHash: simpleHash(newPass) // Update with new hash
           };
           saveUsersToStorage(updatedUsers); // Save updated list to localStorage
           return updatedUsers;
       });
       console.log(`AuthContext: Updated password for user ${username}`);
   }, [storedUsers]);

   // Prepare the list of users to expose (without password hashes)
   const publicUsers: StaffMember[] = React.useMemo(() => {
        return storedUsers.map(({ passwordHash, ...rest }) => rest).sort((a, b) => a.name.localeCompare(b.name));
   }, [storedUsers]);


  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    login,
    logout,
    isLoading,
    users: publicUsers, // Provide the safe list
    addUser,
    deleteUser,
    updatePasswordForUser,
  };

  return (
      <AuthContext.Provider value={value}>
        <AuthGuard>
          {children}
        </AuthGuard>
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

// --- AuthGuard Component (handles redirection) ---
interface AuthGuardProps {
  children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, userRole, isLoading } = useContext(AuthContext)!; // Assume context is available
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) return;

    console.log(`AuthGuard: Pathname: ${pathname}, IsAuthenticated: ${isAuthenticated}, UserRole: ${userRole}`);

    const isLoginPage = pathname === '/login';
    const adminOnlyPages = ['/inventory', '/expenses', '/products', '/users'];

    if (!isAuthenticated && !isLoginPage) {
        console.log("AuthGuard: User not authenticated, redirecting to /login");
        router.push('/login');
    } else if (isAuthenticated && isLoginPage) {
        console.log("AuthGuard: User already authenticated, redirecting from /login to /tables");
        router.push('/tables');
    }
    else if (isAuthenticated && userRole === 'worker') {
      const isTryingAdminPage = adminOnlyPages.some(adminPath => pathname.startsWith(adminPath));
      if (isTryingAdminPage) {
        console.log(`AuthGuard: Worker trying to access restricted admin page ${pathname}, redirecting to /tables`);
        toast({ title: "Acceso Denegado", description: "No tiene permisos para acceder a esta página.", variant: "destructive" });
        router.push('/tables');
      }
    } else if (isAuthenticated && userRole === 'admin') {
         // Admin can access everything.
    }

  }, [pathname, router, isLoading, isAuthenticated, userRole, toast]);

  if (isLoading && !isAuthenticated && pathname !== '/login') {
      return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  // If not loading, or if it's the login page, render children.
  // This ensures login page is always renderable, and other pages render after auth check.
  if (!isLoading || pathname === '/login') {
     return <>{children}</>;
  }
  
  // Fallback loading screen if still loading and not on login page (should be brief)
  return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;

};

