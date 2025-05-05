
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
    if (typeof window === 'undefined') return []; // Default during SSR
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
            }
        } catch (e) {
            console.error("AuthContext: Failed to parse users from sessionStorage:", e);
        }
    }

    // Ensure admin1 always exists and has the correct (hashed) password
    const adminIndex = users.findIndex(u => u.username.toLowerCase() === 'admin1');
    if (adminIndex === -1) {
        users.push(defaultAdmin);
        console.log("AuthContext: Added default admin user.");
    } else {
        // Ensure the stored admin1 password hash is correct according to the current hash function
        // This handles cases where the hashing might change or was initially wrong
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
    }

    return users;
};

const saveUsersToStorage = (users: StoredUser[]) => {
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
        }
        sessionStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        console.log("AuthContext: Saved users to sessionStorage.");
     } catch (e) {
        console.error("AuthContext: Failed to save users to sessionStorage:", e);
     }
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as loading
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>([]); // State to hold all user data internally
  const router = useRouter(); // Needed for navigation
  const pathname = usePathname();
  const { toast } = useToast();

   // Load auth state and users from sessionStorage on mount
   useEffect(() => {
       console.log("AuthContext: Initializing...");
       setIsLoading(true);

        // Load users first
        const loadedUsers = getUsersFromStorage();
        setStoredUsers(loadedUsers);
        saveUsersToStorage(loadedUsers); // Ensure storage is consistent with defaults/corrections
        console.log("AuthContext: Loaded users from storage:", loadedUsers.map(u => u.username));


       // Load login state
       const storedAuth = sessionStorage.getItem(AUTH_STATE_KEY);
       if (storedAuth) {
           try {
               const { authenticated, username } = JSON.parse(storedAuth);
               const loggedInUser = loadedUsers.find(u => u.username.toLowerCase() === username?.toLowerCase());
               if (authenticated && loggedInUser) {
                   setIsAuthenticated(true);
                   setUserRole(loggedInUser.role);
                   console.log(`AuthContext: Restored session - User: ${loggedInUser.username}, Role: ${loggedInUser.role}, Authenticated: true`);
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

       setIsLoading(false); // Finished loading state
       console.log("AuthContext: Initialization complete.");
   }, []); // Run only once on mount

   // --- Context Functions ---

   const login = (usernameInput: string, pass: string): boolean => {
        console.log(`AuthContext: Attempting login for user: ${usernameInput}`);
        const userToLogin = storedUsers.find(u => u.username.toLowerCase() === usernameInput.toLowerCase());

        if (userToLogin && verifyPassword(pass, userToLogin.passwordHash)) {
            setIsAuthenticated(true);
            setUserRole(userToLogin.role);
            // Store username in session to retrieve role on reload
            sessionStorage.setItem(AUTH_STATE_KEY, JSON.stringify({ authenticated: true, username: userToLogin.username }));
            console.log(`AuthContext: Login successful for user: ${userToLogin.username}, Role: ${userToLogin.role}`);
            toast({ title: "Inicio de Sesión Exitoso", description: `Bienvenido, ${userToLogin.name}.`, variant: "default" });
            router.push('/tables'); // Redirect after successful login
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
        router.push('/users'); // Redirect to users (which should redirect to login if needed)
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

        const updatedUsers = [...storedUsers, userToAdd];
        setStoredUsers(updatedUsers);
        saveUsersToStorage(updatedUsers);
        console.log(`AuthContext: Added user ${userToAdd.username}`);
    }, [storedUsers]); // Depend on storedUsers

    const deleteUser = useCallback((username: string) => {
         const usernameLower = username.toLowerCase();
         if (usernameLower === 'admin1') {
             throw new Error("No se puede eliminar al administrador principal.");
         }
         const updatedUsers = storedUsers.filter(u => u.username.toLowerCase() !== usernameLower);
         if (updatedUsers.length === storedUsers.length) {
             throw new Error(`Usuario "${username}" no encontrado.`);
         }
         setStoredUsers(updatedUsers);
         saveUsersToStorage(updatedUsers);
         console.log(`AuthContext: Deleted user ${username}`);
    }, [storedUsers]);

   const updatePasswordForUser = useCallback((username: string, newPass: string) => {
       const usernameLower = username.toLowerCase();
       const userIndex = storedUsers.findIndex(u => u.username.toLowerCase() === usernameLower);
       if (userIndex === -1) {
           throw new Error(`Usuario "${username}" no encontrado.`);
       }

       const updatedUsers = [...storedUsers];
       updatedUsers[userIndex] = {
           ...updatedUsers[userIndex],
           passwordHash: simpleHash(newPass) // Update with new hash
       };

       setStoredUsers(updatedUsers);
       saveUsersToStorage(updatedUsers);
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

    const isUsersPage = pathname === '/users'; // Use '/users' as the new "login" page
    const adminOnlyPages = ['/inventory', '/expenses', '/products', '/users']; // Users page is now admin only
    const workerAllowedPages = ['/tables', '/tables/delivery', '/tables/mesón']; // Add specific allowed pages if needed
     // Check if the current path is a dynamic table route like /tables/[tableId]
     const isTableDetailPage = /^\/tables\/\d+$/.test(pathname);


    if (!isAuthenticated && !isUsersPage) {
      console.log("AuthGuard: User not authenticated, redirecting to /users (login)");
      router.push('/users');
    } else if (isAuthenticated && isUsersPage && userRole === 'worker') {
       // If a worker is logged in and tries to access /users, redirect them away
       console.log("AuthGuard: Worker authenticated but on users page, redirecting to /tables");
       router.push('/tables');
    }
    else if (isAuthenticated && userRole === 'worker') {
      // Redirect worker if they try to access admin-only pages
      // Allow access only to /tables and specific dynamic table routes
      const allowedPath = pathname === '/tables' || isTableDetailPage || pathname === '/tables/delivery' || pathname === '/tables/mesón';
      if (!allowedPath) {
        console.log(`AuthGuard: Worker trying to access restricted page ${pathname}, redirecting to /tables`);
        toast({ title: "Acceso Denegado", description: "No tiene permisos para acceder a esta página.", variant: "destructive" });
        router.push('/tables');
      }
    }
    // Admin can access everything, no explicit redirect needed unless they land on '/users' while logged in (handled implicitly)

  }, [pathname, router, isLoading, isAuthenticated, userRole, toast]);

  // Render loading indicator while checking auth state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

   // If authenticated and allowed, or on the users page (acting as login), render children
   // Admins can always see the users page. Workers are redirected away by the useEffect.
   // Unauthenticated users only see the users page.
   const canRender = isAuthenticated || isUsersPage;

  if (canRender) {
     return <>{children}</>;
  }


  // Otherwise, render null (or a loading indicator) while redirecting
  return null;
};
