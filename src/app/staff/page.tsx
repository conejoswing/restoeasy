
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components

// Define possible access levels explicitly
type AccessLevel = 'admin' | 'worker' | 'none';

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

// Mock data for staff members - Added username and accessLevel
// DO NOT add passwords here. Use simple username logic for demo.
const initialStaff: StaffMember[] = [
  { id: 1, name: 'Camila Pérez', username: 'cami', role: 'Dueña / Gerente', avatarUrl: 'https://picsum.photos/id/237/50', accessLevel: 'admin' },
  { id: 2, name: 'Juan García', username: 'juan', role: 'Cocinero Principal', avatarUrl: 'https://picsum.photos/id/238/50', accessLevel: 'worker' },
  { id: 3, name: 'María Rodríguez', username: 'maria', role: 'Mesera', avatarUrl: 'https://picsum.photos/id/239/50', accessLevel: 'worker' },
  { id: 4, name: 'Carlos López', username: 'carlos', role: 'Ayudante de Cocina', avatarUrl: 'https://picsum.photos/id/240/50', accessLevel: 'none' }, // Example with no login access
];


export default function StaffPage() {
  // Role checks and redirection are now handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaffMember, setCurrentStaffMember] = useState<StaffMember | null>(null);
  // Updated state to include username, accessLevel, and password
  const [newStaffData, setNewStaffData] = useState<{ name: string; role: string; username: string; accessLevel: AccessLevel; password?: string }>({ name: '', role: '', username: '', accessLevel: 'none', password: '' });
  const { toast } = useToast();

  // Loading state is handled by AuthProvider wrapper in layout.tsx
  if (isLoading) {
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
    // Check required fields
    if (!newStaffData.name || !newStaffData.role || !newStaffData.username) {
      toast({ title: "Error", description: "Por favor, complete nombre, cargo y usuario.", variant: "destructive" });
      return;
    }
    // Password validation (required when adding a user with privileges)
    if (!isEditing && newStaffData.accessLevel !== 'none' && !newStaffData.password) {
        toast({ title: "Error", description: "Se requiere contraseña para usuarios con privilegios.", variant: "destructive" });
        return;
    }
    // Add more robust password validation if needed (length, complexity)

    // Check for duplicate username (only when adding or changing username)
    const isUsernameChanging = isEditing && currentStaffMember && currentStaffMember.username !== newStaffData.username;
    if (!isEditing || isUsernameChanging) {
        const existingUser = staff.find(member => member.username.toLowerCase() === newStaffData.username.toLowerCase() && member.id !== currentStaffMember?.id);
        if (existingUser) {
            toast({ title: "Error", description: `El nombre de usuario "${newStaffData.username}" ya existe.`, variant: "destructive" });
            return;
        }
    }


    // Security Warning: In a real application, HASH the password here before saving!
    // const hashedPassword = await hashPassword(newStaffData.password); // Example

    if (isEditing && currentStaffMember) {
      // Edit existing staff member - include username and accessLevel
      // We don't update the password in the main staff state for display/security reasons.
      // Password changes would typically involve a separate secure process.
      setStaff(staff.map(member =>
        member.id === currentStaffMember.id
          ? { ...member, name: newStaffData.name, role: newStaffData.role, username: newStaffData.username, accessLevel: newStaffData.accessLevel }
          : member
      ));
       // If password was entered during edit, show a generic success message.
       // Actual password update logic would happen server-side.
      if (newStaffData.password) {
           toast({ title: "Éxito", description: "Miembro del personal actualizado. La contraseña se actualizó (simulado)." });
       } else {
           toast({ title: "Éxito", description: "Miembro del personal actualizado." });
       }

    } else {
      // Add new staff member - include username and accessLevel
      const newId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
      const newMember: StaffMember = {
        id: newId,
        name: newStaffData.name,
        username: newStaffData.username, // Save username
        role: newStaffData.role,
        accessLevel: newStaffData.accessLevel, // Save the selected access level
        // DO NOT store the plaintext password in the main staff state.
        // avatarUrl: `https://picsum.photos/seed/${newId}/50` // Use ID for consistent random image
        // Use a placeholder or leave empty
        avatarUrl: `https://picsum.photos/seed/${newStaffData.name}/50` // Use name for consistent random image based on name
      };
      setStaff([...staff, newMember]);
      // Log the password temporarily for demo purposes - DO NOT DO THIS IN PRODUCTION
      console.log(`Adding user: ${newStaffData.username}, Password (plaintext): ${newStaffData.password}`);
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

  const handleDeleteStaff = (id: number) => {
     const memberToDelete = staff.find(m => m.id === id);
     // Use browser confirm for simplicity, consider a confirmation dialog for better UX
     if (confirm(`¿Está seguro de que desea eliminar a ${memberToDelete?.name}?`)) {
        setStaff(staff.filter(member => member.id !== id));
        toast({ title: "Eliminado", description: `${memberToDelete?.name} eliminado del personal.`, variant: "destructive" });
     }
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
               {/* Add Username Input - Conditionally required if accessLevel is not 'none' */}
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
                         placeholder="Nombre de usuario para login"
                         required={newStaffData.accessLevel !== 'none'} // Required only when adding/editing a privileged user
                         autoComplete="off"
                     />
                 </div>
               )}
               {/* Add Password Input - Conditionally required if accessLevel is not 'none' */}
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
                         required={!isEditing && newStaffData.accessLevel !== 'none'} // Required only when adding a privileged user
                         autoComplete="new-password" // Help browser password managers
                     />
                 </div>
               )}
              {/* Add Avatar URL input if needed */}
            </div>
            <DialogFooter>
              {/* Use DialogClose for the Cancel button */}
              <DialogClose asChild>
                 <Button type="button" variant="secondary" onClick={closeDialog}>Cancelar</Button>
              </DialogClose>
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
                 {/* Delete Button */}
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => handleDeleteStaff(member.id)}>
                    <Trash2 className="h-4 w-4" />
                   <span className="sr-only">Eliminar</span>
                 </Button>
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
