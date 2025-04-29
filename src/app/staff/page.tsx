
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react'; // Added Edit, Trash2
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { cn } from '@/lib/utils'; // Import cn
import { buttonVariants } from '@/components/ui/button'; // Import buttonVariants

// Define possible access levels explicitly
export type AccessLevel = 'admin' | 'worker' | 'none'; // Export for use in AuthContext

// Update StaffMember interface to include username
export interface StaffMember { // Export for potential use in AuthContext
  id: number;
  name: string; // Full name for display
  username: string; // Username for login
  role: string; // Job title (e.g., 'Mesera')
  avatarUrl?: string; // Optional avatar URL
  accessLevel?: AccessLevel; // Optional: 'admin', 'worker', or 'none' for login privileges
  // Password should NOT be stored directly in the main state for security.
  // It will only be handled temporarily in the dialog state.
}

// Mock data for initial staff members - Used only if localStorage is empty
const initialStaff: StaffMember[] = [
  { id: 1, name: 'Camila Pérez', username: 'admin', role: 'Dueña / Gerente', avatarUrl: 'https://picsum.photos/id/237/50', accessLevel: 'admin' },
  { id: 2, name: 'Juan García', username: 'worker', role: 'Cocinero Principal', avatarUrl: 'https://picsum.photos/id/238/50', accessLevel: 'worker' },
  // { id: 3, name: 'María Rodríguez', username: 'maria', role: 'Mesera', avatarUrl: 'https://picsum.photos/id/239/50', accessLevel: 'worker' },
  { id: 4, name: 'Carlos López', username: 'carlos', role: 'Ayudante de Cocina', avatarUrl: 'https://picsum.photos/id/240/50', accessLevel: 'none' }, // Example with no login access
];

// Storage key for localStorage
const STAFF_STORAGE_KEY = 'restaurantStaff';

export default function StaffPage() {
  // Role checks and redirection are now handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isStaffInitialized, setIsStaffInitialized] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaffMember, setCurrentStaffMember] = useState<StaffMember | null>(null);
  // Updated state to include username, accessLevel, and password
  const [newStaffData, setNewStaffData] = useState<{ name: string; role: string; username: string; accessLevel: AccessLevel; password?: string }>({ name: '', role: '', username: '', accessLevel: 'none', password: '' });
  const { toast } = useToast();


  // Load staff from localStorage on mount
   useEffect(() => {
     if (isStaffInitialized) return; // Prevent re-running

     console.log("Initializing staff from localStorage...");
     const storedStaff = localStorage.getItem(STAFF_STORAGE_KEY); // Read from localStorage
     let loadedStaff: StaffMember[] = [];

     if (storedStaff) {
       try {
         const parsed = JSON.parse(storedStaff);
         if (Array.isArray(parsed)) {
           loadedStaff = parsed; // Use stored data
           console.log("Loaded staff:", loadedStaff);
         } else {
           console.warn("Invalid staff data found in localStorage, using initial data.");
           loadedStaff = initialStaff; // Fallback
         }
       } catch (error) {
         console.error("Failed to parse stored staff:", error);
         loadedStaff = initialStaff; // Fallback on error
       }
     } else {
       console.log("No staff found in localStorage, using initial data.");
       loadedStaff = initialStaff; // Fallback if nothing stored
       // Attempt to save initial data if nothing was found
       try {
            localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(loadedStaff));
            console.log("Saved initial staff data to localStorage.");
       } catch (saveError) {
            console.error("Failed to save initial staff data:", saveError);
       }
     }

     setStaff(loadedStaff.sort((a, b) => a.name.localeCompare(b.name))); // Set state
     setIsStaffInitialized(true); // Mark as initialized
     console.log("Staff initialization complete.");

   }, [isStaffInitialized]); // Dependency array ensures it runs once

   // Save staff to localStorage whenever it changes
   useEffect(() => {
     if (!isStaffInitialized) return; // Only save after initial load

     console.log("Saving staff to localStorage...");
     try {
       localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staff)); // Save current state
       console.log("Staff saved.");
     } catch (error) {
       console.error("Failed to save staff to localStorage:", error);
       toast({ title: "Error", description: "No se pudo guardar la lista de personal.", variant: "destructive" });
     }
   }, [staff, isStaffInitialized]); // Save when staff state changes


  // Loading state is handled by AuthProvider wrapper in layout.tsx
  if (isLoading || !isStaffInitialized) {
      return <div className="flex items-center justify-center min-h-screen">Cargando...</div>; // Added loading indicator
  }
  // If not authenticated or not admin, AuthProvider will redirect
  if (!isAuthenticated || userRole !== 'admin') {
    // Redirect logic is now within AuthProvider useEffect
    // Return null or a placeholder if needed while redirecting
    return null;
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof Omit<typeof newStaffData, 'accessLevel'>) => {
    setNewStaffData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Handler for access level Select component
  const handleAccessLevelChange = (value: AccessLevel) => {
      setNewStaffData((prev) => ({ ...prev, accessLevel: value }));
  };

  const handleAddOrEditStaff = () => {
    // Check required fields based on access level
    let requiredFieldsMissing = false;
    if (!newStaffData.name || !newStaffData.role) {
        requiredFieldsMissing = true;
    }
    // Username required if access is not 'none'
    if (newStaffData.accessLevel !== 'none' && !newStaffData.username) {
        requiredFieldsMissing = true;
    }

    if (requiredFieldsMissing) {
      toast({ title: "Error", description: "Por favor, complete nombre y cargo. Si tiene privilegios, también el usuario.", variant: "destructive" });
      return;
    }

    // Password validation (required when adding a user with privileges)
    if (!isEditing && newStaffData.accessLevel !== 'none' && !newStaffData.password) {
        toast({ title: "Error", description: "Se requiere contraseña para usuarios nuevos con privilegios.", variant: "destructive" });
        return;
    }
    // Add more robust password validation if needed (length, complexity)

    // Check for duplicate username (only when adding or changing username)
    const isUsernameChanging = isEditing && currentStaffMember && currentStaffMember.username !== newStaffData.username;
    if ((!isEditing || isUsernameChanging) && newStaffData.accessLevel !== 'none') { // Only check if user will have login
        const existingUser = staff.find(member => member.username.toLowerCase() === newStaffData.username.toLowerCase() && member.id !== currentStaffMember?.id);
        if (existingUser) {
            toast({ title: "Error", description: `El nombre de usuario "${newStaffData.username}" ya existe.`, variant: "destructive" });
            return;
        }
    }

    // Security Warning: In a real application, HASH the password here before saving!
    // Never store plaintext passwords. This demo uses fixed passwords checked during login.

    if (isEditing && currentStaffMember) {
      // Edit existing staff member - include username and accessLevel
      setStaff(prevStaff =>
         prevStaff.map(member =>
           member.id === currentStaffMember.id
             ? { ...member, name: newStaffData.name, role: newStaffData.role, username: newStaffData.username, accessLevel: newStaffData.accessLevel }
             : member
         ).sort((a, b) => a.name.localeCompare(b.name)) // Re-sort after update
      );
       // If password was entered during edit, show a generic success message.
       // Actual password update logic would happen server-side/in AuthContext for this demo.
      if (newStaffData.password) {
           toast({ title: "Éxito", description: "Miembro del personal actualizado. Contraseña actualizada (simulado)." });
            // Note: AuthContext needs to handle the actual password logic check during login.
       } else {
           toast({ title: "Éxito", description: "Miembro del personal actualizado." });
       }

    } else {
      // Add new staff member - include username and accessLevel
      const newId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
      const newMember: StaffMember = {
        id: newId,
        name: newStaffData.name,
         // Store username only if accessLevel is not 'none'
        username: newStaffData.accessLevel !== 'none' ? newStaffData.username : '',
        role: newStaffData.role,
        accessLevel: newStaffData.accessLevel, // Save the selected access level
        // DO NOT store the plaintext password in the main staff state.
        avatarUrl: `https://picsum.photos/seed/${newStaffData.name}/50` // Use name for consistent random image based on name
      };
      setStaff(prevStaff => [...prevStaff, newMember].sort((a, b) => a.name.localeCompare(b.name))); // Add and sort
      // Log the password temporarily for demo purposes - REMOVE IN PRODUCTION
      if (newStaffData.password && newStaffData.accessLevel !== 'none') {
         console.log(`Adding/Updating user: ${newStaffData.username}, Access Level: ${newStaffData.accessLevel}, Password (plaintext - DEMO ONLY): ${newStaffData.password}`);
      }
      toast({ title: "Éxito", description: "Nuevo miembro del personal añadido." });
    }

    closeDialog();
  };

  const openEditDialog = (member: StaffMember) => {
    setIsEditing(true);
    setCurrentStaffMember(member);
    // Pre-fill with existing data, including username, leave password blank for editing for security.
    setNewStaffData({ name: member.name, role: member.role, username: member.username, accessLevel: member.accessLevel ?? 'none', password: '' });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setIsEditing(false);
    setCurrentStaffMember(null);
    // Reset state including username, accessLevel, and password
    setNewStaffData({ name: '', role: '', username: '', accessLevel: 'none', password: '' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentStaffMember(null);
    // Reset state including username, accessLevel, and password
    setNewStaffData({ name: '', role: '', username: '', accessLevel: 'none', password: '' });
  };

  const handleDeleteStaff = (idToDelete: number) => {
        const memberToDelete = staff.find(item => item.id === idToDelete);
        setStaff(prevStaff => prevStaff.filter(item => item.id !== idToDelete)); // Update state which triggers save
        toast({ title: "Eliminado", description: `${memberToDelete?.name} eliminado del personal.`, variant: "destructive" });
   };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Personal</h1> {/* Staff Management */}
        {/* Wrap the Add button with DialogTrigger */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Personal {/* Add Staff */}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Editar Personal' : 'Añadir Nuevo Personal'}</DialogTitle> {/* Edit Staff / Add New Staff */}
              <DialogDescription>
                {isEditing ? 'Actualice los detalles del miembro del personal.' : 'Ingrese los detalles del nuevo miembro del personal.'} {/* Update / Enter details */}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre {/* Name */}
                </Label>
                <Input
                  id="name"
                  value={newStaffData.name}
                  onChange={(e) => handleInputChange(e, 'name')}
                  className="col-span-3"
                  required
                  autoComplete="off"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Cargo {/* Role */}
                </Label>
                <Input
                  id="role"
                  value={newStaffData.role}
                  onChange={(e) => handleInputChange(e, 'role')}
                  className="col-span-3"
                  required
                  autoComplete="off"
                  placeholder="Ej: Mesera, Cocinero"
                />
              </div>
              {/* Add Access Level Selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="accessLevel" className="text-right">
                   Privilegios {/* Privileges */}
                 </Label>
                 <Select
                   value={newStaffData.accessLevel}
                   onValueChange={handleAccessLevelChange} // Use the specific handler
                 >
                   <SelectTrigger className="col-span-3">
                     <SelectValue placeholder="Seleccionar Nivel de Acceso" /> {/* Select Access Level */}
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="admin">Administrador</SelectItem> {/* Administrator */}
                     <SelectItem value="worker">Trabajador</SelectItem> {/* Worker */}
                     <SelectItem value="none">Ninguno</SelectItem> {/* None */}
                   </SelectContent>
                 </Select>
              </div>
               {/* Add Username Input - Conditionally shown if accessLevel is not 'none' */}
               {(newStaffData.accessLevel !== 'none') && ( // Show if has privileges
                 <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="username" className="text-right">
                         Usuario {/* Username */}
                     </Label>
                     <Input
                         id="username"
                         type="text"
                         value={newStaffData.username}
                         onChange={(e) => handleInputChange(e, 'username')}
                         className="col-span-3"
                         placeholder="Usuario para inicio de sesión"
                         required={newStaffData.accessLevel !== 'none'} // Required only when adding/editing a privileged user
                         autoComplete="off"
                     />
                 </div>
               )}
               {/* Add Password Input - Conditionally shown if accessLevel is not 'none' */}
               {(newStaffData.accessLevel !== 'none') && ( // Show if has privileges
                 <div className="grid grid-cols-4 items-center gap-4">
                     <Label htmlFor="password" className="text-right">
                         Contraseña {/* Password */}
                     </Label>
                     <Input
                         id="password"
                         type="password"
                         value={newStaffData.password ?? ''}
                         onChange={(e) => handleInputChange(e, 'password')}
                         className="col-span-3"
                         placeholder={isEditing ? "Dejar en blanco para no cambiar" : "Requerida si tiene privilegios"}
                         // Required only when *adding* a privileged user
                         required={!isEditing && newStaffData.accessLevel !== 'none'}
                         autoComplete="new-password" // Help browser password managers
                     />
                 </div>
               )}
              {/* Add Avatar URL input if needed */}
            </div>
            <DialogFooter>
              {/* Use DialogClose for the Cancel button */}
                 <Button type="button" variant="secondary" onClick={closeDialog}>Cancelar</Button> {/* Removed DialogClose wrapper, use onClick */}
              <Button type="submit" onClick={handleAddOrEditStaff}>
                {isEditing ? 'Guardar Cambios' : 'Añadir Personal'} {/* Save Changes / Add Staff */}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {staff.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {/* Display Name */}
              <CardTitle className="text-sm font-medium">{member.name}</CardTitle>
              <div className="flex items-center space-x-1">
                 {/* Edit Button */}
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(member)}>
                   <Edit className="h-4 w-4" />
                   <span className="sr-only">Editar</span>
                 </Button>
                 {/* Delete Button with Confirmation Dialog */}
                  <AlertDialog>
                       <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" title="Eliminar Personal">
                               <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Eliminar</span>
                            </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                           <AlertDialogHeader>
                               <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                               <AlertDialogDescription>
                                   Esta acción no se puede deshacer. Esto eliminará permanentemente a {member.name} de la lista de personal.
                               </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction
                                   onClick={() => handleDeleteStaff(member.id)}
                                   className={cn(buttonVariants({ variant: "destructive" }))}
                               >
                                   Eliminar
                               </AlertDialogAction>
                           </AlertDialogFooter>
                       </AlertDialogContent>
                  </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center pt-2"> {/* Adjusted padding top */}
              <Avatar className="h-16 w-16 mb-2">
                 {/* Use name as seed for picsum for consistency */}
                 <AvatarImage src={member.avatarUrl || `https://picsum.photos/seed/${member.name}/50`} alt={member.name} />
                <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback> {/* Initials */}
              </Avatar>
              <p className="text-xs text-muted-foreground mb-1">{member.role}</p> {/* Role */}
               {/* Display Username and Access Level */}
               {(member.accessLevel && member.accessLevel !== 'none') && (
                   <div className="flex items-center justify-center space-x-2 mt-1">
                       <span className="text-xs text-muted-foreground">({member.username})</span>
                       <span className={`text-xs px-1.5 py-0.5 rounded ${member.accessLevel === 'admin' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                           {member.accessLevel === 'admin' ? 'Admin' : 'Trabajador'}
                       </span>
                   </div>
               )}
                 {/* Display if user has no access */}
                {(!member.accessLevel || member.accessLevel === 'none') && (
                    <span className="mt-1 text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                        Sin Acceso
                    </span>
                )}
            </CardContent>
          </Card>
        ))}
         {staff.length === 0 && (
             <p className="text-muted-foreground col-span-full text-center pt-4">No hay personal registrado.</p> /* No staff registered */
         )}
      </div>
    </div>
  );
}
