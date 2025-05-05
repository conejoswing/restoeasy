
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Keep for navigation
import { useToast } from '@/hooks/use-toast';
import type { StaffMember } from '@/app/users/page'; // Import StaffMember type

// Storage keys
const USERS_STORAGE_KEY = 'restaurantUsers'; // Key for storing user data (including password hashes/placeholders)
const AUTH_STATE_KEY = 'authState';

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

    const storedUsers = sessionStorage.getItem(USERS_STORAGE_KEY);
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
                 console.warn("AuthContext: Invalid format for users in sessionStorage. Resetting.");
                 users = []; // Reset if format is wrong
            }
        } catch (e) {
            console.error("AuthContext: Failed to parse users from sessionStorage:", e);
             users = []; // Reset on error
        }
    }

    // Ensure admin1 always exists and has the correct (hashed) password and role
    const adminIndex = users.findIndex(u => u.username.toLowerCase() === 'admin1');
    if (adminIndex === -1) {
        users.push(defaultAdmin);
        console.log("AuthContext: Added default admin user.");
    } else {
        let adminUpdated = false;
        // Ensure the stored admin1 password hash is correct
        if (users[adminIndex].passwordHash !== defaultAdmin.passwordHash) {
            users[adminIndex].passwordHash = defaultAdmin.passwordHash;
            adminUpdated = true;
            console.log("AuthContext: Corrected default admin user's password hash.");
        }
        // Ensure role is admin
        if (users[adminIndex].role !== 'admin') {
             users[adminIndex].role = 'admin';
             adminUpdated = true;
             console.log("AuthContext: Corrected default admin user's role.");
        }
         // Ensure name is consistent
        if (users[adminIndex].name !== 'Admin Principal') {
             users[adminIndex].name = 'Admin Principal';
              adminUpdated = true;
             console.log("AuthContext: Corrected default admin user's name.");
        }
        // Ensure id is consistent (though less critical)
         if (users[adminIndex].id !== defaultAdmin.id && !users[adminIndex].id.startsWith('admin1-')) {
             // Only update ID if it's clearly not the default or a previously generated one
             users[adminIndex].id = defaultAdmin.id;
             adminUpdated = true;
             console.log("AuthContext: Corrected default admin user's ID.");
         }
    }

    // If users array was reset or admin was added/updated, save back immediately
    // This avoids issues where initial state might be empty before saveUsersToStorage is called later
    // if (users.length === 0 || adminIndex === -1 || adminUpdated) {
    //     saveUsersToStorage(users); // Save immediately if defaults were applied or corrections made
    // }

    return users;
};

const saveUsersToStorage = (users: StoredUser[]) => {
     // Guard against SSR window access
     if (typeof window === 'undefined') return;
     try {
        // Ensure admin1 is always present before saving
        const adminExists = users.some(u => u.username.toLowerCase() === 'admin1');
        if (!adminExists) {
             const defaultAdmin: StoredUser = {
                id: 'admin1-default', name: 'Admin Principal', username: 'admin1',
                role: 'admin', passwordHash: simpleHash('admin1')
             };
            users.push(defaultAdmin);
             console.log("AuthContext: Ensuring default admin exists before saving.");
        }
        sessionStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log("AuthContext: Saved users to sessionStorage:", users.map(u => u.username));
     } catch (e) {
        console.error("AuthContext: Failed to save users to sessionStorage:", e);
     }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as loading
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]); // State to hold all user data internally

   // Load auth state and users from sessionStorage on mount
   useEffect(() => {
       console.log("AuthContext: Initializing...");
       setIsLoading(true);

        // Load users first
        const loadedUsers = getUsersFromStorage();
        setStoredUsers(loadedUsers);
        // Ensure storage is consistent immediately after loading, especially if defaults were applied
        saveUsersToStorage(loadedUsers);
        console.log("AuthContext: Loaded and potentially corrected users from storage:", loadedUsers.map(u => u.username));


       // Load login state
       const storedAuth = sessionStorage.getItem(AUTH_STATE_KEY);
       if (storedAuth) {
           try {
               const { authenticated, username } = JSON.parse(storedAuth);
               // Find user in the *just loaded* user list
               const loggedInUser = loadedUsers.find(u => u.username.toLowerCase() === username?.toLowerCase());
               if (authenticated && loggedInUser) {
                   setIsAuthenticated(true);
                   setUserRole(loggedInUser.role);
                   console.log(`AuthContext: Restored session - User: ${loggedInUser.username}, Role: ${loggedInUser.role}, Authenticated: true`);
               } else {
                    console.log("AuthContext: Invalid or expired session data found. Clearing session.");
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
        // Prevent login attempts before initialization is complete
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
            // Store username in session to retrieve role on reload
            sessionStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ authenticated: true, username: userToLogin.username }));
            console.log(`AuthContext: Login successful for user: ${userToLogin.username}, Role: ${userToLogin.role}`);
            toast({ title: "Inicio de Sesión Exitoso", description: `Bienvenido, ${userToLogin.name}.`, variant: "default" });
            // router.push('/tables'); // Redirection handled by AuthGuard
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
        sessionStorage.removeItem(AUTH_STATE_KEY);
        toast({ title: "Sesión Cerrada", description: "Ha cerrado sesión exitosamente.", variant: "default" });
        // router.push('/users'); // Redirect handled by AuthGuard
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

        // Use functional update to avoid race conditions if multiple adds happen quickly
        setStoredUsers(prevUsers => {
             const updated = [...prevUsers, userToAdd];
             saveUsersToStorage(updated); // Save updated list
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
                 // Throw error only if user wasn't found, prevents unnecessary saves
                 throw new Error(`Usuario "${username}" no encontrado.`);
             }
             saveUsersToStorage(updatedUsers); // Save updated list
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
           saveUsersToStorage(updatedUsers); // Save updated list
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

  // AuthProvider now simply provides the context value
  return (
      <AuthContext.Provider value={value}>
         {/* AuthGuard now handles redirection logic */}
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
    // Don't redirect until loading is complete
    if (isLoading) return;

    console.log(`AuthGuard: Pathname: ${pathname}, IsAuthenticated: ${isAuthenticated}, UserRole: ${userRole}`);

    const isUsersPage = pathname === '/users'; // Users management page
    const isLoginPage = pathname === '/login'; // The actual login page

    const adminOnlyPages = ['/inventory', '/expenses', '/products', '/users']; // Define admin-only areas
    const workerAllowedPages = ['/tables', '/tables/delivery', '/tables/mesón']; // Core worker areas
     // Check if the current path is a dynamic table route like /tables/[tableId]
     const isTableDetailPage = /^\/tables\/\d+$/.test(pathname);


    if (!isAuthenticated && !isLoginPage) {
        // If not authenticated AND not already on the login page, redirect to login
        console.log("AuthGuard: User not authenticated, redirecting to /login");
        router.push('/login');
    } else if (isAuthenticated && isLoginPage) {
        // If authenticated AND on the login page, redirect to the main tables view
        console.log("AuthGuard: User already authenticated, redirecting from /login to /tables");
        router.push('/tables');
    }
    else if (isAuthenticated && userRole === 'worker') {
      // If worker, check if they are trying to access admin pages
      const isTryingAdminPage = adminOnlyPages.some(adminPath => pathname.startsWith(adminPath));
      if (isTryingAdminPage) {
        console.log(`AuthGuard: Worker trying to access restricted admin page ${pathname}, redirecting to /tables`);
        toast({ title: "Acceso Denegado", description: "No tiene permisos para acceder a esta página.", variant: "destructive" });
        router.push('/tables');
      }
      // No need for explicit allow list, just block admin pages
    } else if (isAuthenticated && userRole === 'admin') {
         // Admin can access everything, no redirection needed based on role.
         // Redirection from /login if already authenticated is handled above.
    }

  }, [pathname, router, isLoading, isAuthenticated, userRole, toast]);

  // Render loading indicator while checking auth state
  if (isLoading && !isAuthenticated && pathname !== '/login') {
      // Show loading only if not authenticated and not on login page,
      // otherwise, login page might flash loading unnecessarily.
      return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  // If loading is finished OR we are on the login page, render children.
  // AuthGuard's useEffect handles the redirection logic.
  // This prevents rendering protected content before redirection happens.
  if (!isLoading || pathname === '/login') {
     return <>{children}</>;
  }

  // Default case: If still loading but conditions above aren't met, show loading
  // This might happen briefly during initial load on a protected route.
  return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;

};
