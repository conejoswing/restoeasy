

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Trash2, Edit, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext'; // Import useAuth to interact with users

// Type definition for a Staff Member
export interface StaffMember {
  id: string;
  name: string;
  username: string; // Unique username for login
  role: 'admin' | 'worker'; // Role determines privileges
  // Password is not stored directly in this state but managed by AuthContext
}

// Storage key for staff members - No longer strictly needed here if AuthContext is source of truth
// const STAFF_STORAGE_KEY = 'staffMembers';

export default function UsersPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isStaffInitialized, setIsStaffInitialized] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [newStaffData, setNewStaffData] = useState<{
    name: string;
    username: string;
    role: 'admin' | 'worker';
    password?: string; // Optional password field for adding/editing
  }>({ name: '', username: '', role: 'worker', password: '' });
  const { toast } = useToast();
  // Get user data and functions directly from AuthContext
  const { users, updatePasswordForUser, deleteUser, addUser, isLoading, isAuthenticated, userRole } = useAuth();
  const router = useRouter();

  // Load staff from AuthContext on mount and when users array changes
  useEffect(() => {
    // Use the users array from AuthContext directly
    // Already includes admin1 by default and is managed by the context
    const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
    setStaffList(sortedUsers);
    setIsStaffInitialized(true); // Mark as initialized once users are loaded from context
    console.log("UsersPage: Staff list updated from AuthContext.", sortedUsers.map(u=>u.username));

  }, [users]); // Depend only on the users array from context

  // AuthGuard now handles redirection based on authentication and role.
  // No need for manual redirection logic here.
  // useEffect(() => {
  //    if (!isLoading && (!isAuthenticated || userRole !== 'admin')) {
  //       toast({ title: "Acceso Denegado", description: "Debe ser administrador para acceder.", variant: "destructive"});
  //       router.push('/login'); // Redirect to login if not an admin
  //    }
  // }, [isLoading, isAuthenticated, userRole, router, toast]);

  // Show loading state provided by AuthContext or if staff hasn't been initialized from context yet
  if (isLoading || !isStaffInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando Usuarios...</div>;
  }

  // If AuthGuard didn't redirect, but the role is somehow not admin, show restricted message.
  // This acts as a secondary safety check.
  if (userRole !== 'admin') {
     return (
         <div className="container mx-auto p-4 text-center">
             <h1 className="text-2xl font-bold text-destructive">Acceso Denegado</h1>
             <p className="text-muted-foreground">No tiene permisos para gestionar usuarios.</p>
             <Button onClick={() => router.push('/tables')} className="mt-4">Volver a Mesas</Button>
         </div>
     );
  }


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof newStaffData
  ) => {
    setNewStaffData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleRoleChange = (value: 'admin' | 'worker') => {
    setNewStaffData((prev) => ({ ...prev, role: value }));
  };

  const openAddDialog = () => {
    setEditingStaffMember(null);
    setNewStaffData({ name: '', username: '', role: 'worker', password: '' });
    setIsAddEditDialogOpen(true);
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaffMember(staffMember);
    setNewStaffData({
      name: staffMember.name,
      username: staffMember.username,
      role: staffMember.role,
      password: '', // Clear password field for editing
    });
    setIsAddEditDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddEditDialogOpen(false);
    setEditingStaffMember(null); // Reset editing state
    setNewStaffData({ name: '', username: '', role: 'worker', password: '' }); // Clear form
  };


  const handleAddOrEditStaff = () => {
    const { name, username, role, password } = newStaffData;

    if (!name || !username || !role) {
      toast({ title: "Error", description: "Nombre, Usuario y Rol son obligatorios.", variant: "destructive" });
      return;
    }

    // Username validation (simple example)
    if (username.includes(' ') || username.length < 3) {
         toast({ title: "Error", description: "El nombre de usuario no puede contener espacios y debe tener al menos 3 caracteres.", variant: "destructive" });
         return;
    }

    const usernameLower = username.toLowerCase();

    if (editingStaffMember) {
      // --- Editing existing staff member ---
      if (usernameLower !== editingStaffMember.username.toLowerCase()) {
         // Check if the new username already exists (excluding the current user being edited)
         const usernameExists = users.some(
           staff => staff.id !== editingStaffMember.id && staff.username.toLowerCase() === usernameLower
         );
         if (usernameExists) {
           toast({ title: "Error", description: `El nombre de usuario "${username}" ya está en uso.`, variant: "destructive" });
           return;
         }
      }

       // Prevent changing the role or username of the default admin 'admin1'
       if (editingStaffMember.username.toLowerCase() === 'admin1') {
           if(role !== 'admin'){
               toast({ title: "Error", description: "No se puede cambiar el rol del administrador principal.", variant: "destructive" });
               return;
           }
           if(usernameLower !== 'admin1'){
                toast({ title: "Error", description: "No se puede cambiar el nombre de usuario del administrador principal.", variant: "destructive" });
                return;
           }
       }


      // Update password in AuthContext if provided
      if (password) {
        if (password.length < 4) {
          toast({ title: "Error", description: "La contraseña debe tener al menos 4 caracteres.", variant: "destructive" });
          return;
        }
        try {
            // Use username to identify user for password update
            updatePasswordForUser(editingStaffMember.username, password);
             toast({ title: "Contraseña Actualizada", description: `Contraseña para ${editingStaffMember.username} actualizada.`, variant: "default" });
        } catch (error: any) {
             toast({ title: "Error Contraseña", description: error.message || "No se pudo actualizar la contraseña.", variant: "destructive" });
             return; // Stop if password update fails
        }
      }

      // Update other user details (name, username if changed, role)
      // Need an updateUser function in AuthContext ideally
      // For now, let's try updating password separately and assume other details might need manual sync or a dedicated function
       console.warn("User detail update (name, username, role) might require an 'updateUser' function in AuthContext for full persistence.");
      // Placeholder: Update local list for immediate UI feedback, but context is the source of truth
       setStaffList((prevList) =>
         prevList.map((staff) =>
           staff.id === editingStaffMember.id ? { ...staff, name, username, role } : staff
         ).sort((a, b) => a.name.localeCompare(b.name))
       );


      toast({ title: "Usuario Actualizado", description: `Datos de ${name} actualizados.` });

    } else {
      // --- Adding new staff member ---
      if (!password || password.length < 4) {
        toast({ title: "Error", description: "La contraseña es obligatoria y debe tener al menos 4 caracteres.", variant: "destructive" });
        return;
      }

      // Check if username already exists using AuthContext's users
       const usernameExists = users.some(staff => staff.username.toLowerCase() === usernameLower);
      if (usernameExists) {
        toast({ title: "Error", description: `El nombre de usuario "${username}" ya está en uso.`, variant: "destructive" });
        return;
      }

       // Prevent adding another user with username 'admin1' (case-insensitive)
       if (usernameLower === 'admin1') {
          toast({ title: "Error", description: `El nombre de usuario "admin1" está reservado.`, variant: "destructive" });
          return;
       }

       // Add user using AuthContext function
      try {
          const newStaffMember: Omit<StaffMember, 'id'> & {password: string} = {
            name,
            username: username, // Keep original case for display
            role,
            password
          };
           addUser(newStaffMember); // Use the addUser function from context
          // No need to update staffList state directly, it will update via useEffect dependency on `users`
          toast({ title: "Usuario Añadido", description: `${name} ha sido añadido como ${role}.` });

      } catch (error: any) {
         toast({ title: "Error Añadiendo", description: error.message || "No se pudo añadir el usuario.", variant: "destructive" });
         return; // Stop if adding fails
      }

    }
    closeDialog(); // Close dialog on success
  };


   const handleDeleteStaff = (staffMemberToDelete: StaffMember) => {
        // Prevent deleting the default admin 'admin1'
       if (staffMemberToDelete.username.toLowerCase() === 'admin1') {
           toast({ title: "Acción no permitida", description: "No se puede eliminar al administrador principal.", variant: "destructive" });
           return;
       }

       try {
           deleteUser(staffMemberToDelete.username); // Delete from AuthContext store
            // No need to update staffList state directly, it will update via useEffect dependency on `users`
           toast({ title: "Usuario Eliminado", description: `${staffMemberToDelete.name} ha sido eliminado.`, variant: "destructive" });
       } catch (error: any) {
           toast({ title: "Error Eliminando", description: error.message || "No se pudo eliminar el usuario.", variant: "destructive" });
       }
   };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        {/* Back Button */}
        <Button variant="outline" size="icon" onClick={() => router.push('/tables')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver</span>
        </Button>

        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>

        <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingStaffMember ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</DialogTitle>
              <DialogDescription>
                {editingStaffMember ? 'Modifique los detalles del usuario.' : 'Ingrese los detalles del nuevo usuario.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="staff-name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="staff-name"
                  value={newStaffData.name}
                  onChange={(e) => handleInputChange(e, 'name')}
                  className="col-span-3"
                  required
                  placeholder="Nombre completo"
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="staff-username" className="text-right">
                   Usuario
                 </Label>
                 <Input
                   id="staff-username"
                   value={newStaffData.username}
                   onChange={(e) => handleInputChange(e, 'username')}
                   className="col-span-3"
                   required
                   placeholder="Nombre de usuario (login)"
                   // Disable username editing for the default admin
                   disabled={editingStaffMember?.username.toLowerCase() === 'admin1'}
                 />
               </div>
               <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="staff-password" className="text-right">
                   Contraseña
                 </Label>
                 <Input
                   id="staff-password"
                   type="password"
                   value={newStaffData.password ?? ''} // Ensure value is not undefined
                   onChange={(e) => handleInputChange(e, 'password')}
                   className="col-span-3"
                   required={!editingStaffMember} // Required only when adding
                   placeholder={editingStaffMember ? 'Dejar vacío para no cambiar' : 'Mínimo 4 caracteres'}
                 />
               </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="staff-role" className="text-right">
                  Rol
                </Label>
                <Select
                  onValueChange={handleRoleChange}
                  value={newStaffData.role}
                  // Disable role change for the default admin
                  disabled={editingStaffMember?.username.toLowerCase() === 'admin1'}
                 >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Trabajador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild>
                 <Button type="button" variant="secondary" onClick={closeDialog}>Cancelar</Button>
               </DialogClose>
              <Button type="submit" onClick={handleAddOrEditStaff}>
                {editingStaffMember ? 'Guardar Cambios' : 'Añadir Usuario'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario (Login)</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.name}</TableCell>
                <TableCell>{staff.username}</TableCell>
                <TableCell>{staff.role === 'admin' ? 'Administrador' : 'Trabajador'}</TableCell>
                <TableCell className="text-right">
                   {/* Prevent editing/deleting the default admin 'admin1' */}
                  {staff.username.toLowerCase() !== 'admin1' ? (
                      <div className="flex justify-end gap-1">
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(staff)} title="Editar Usuario">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                         </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/90" title="Eliminar Usuario">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario "{staff.name}" ({staff.username}).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteStaff(staff)}
                                  className={cn(buttonVariants({ variant: "destructive" }))}
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      </div>
                  ) : (
                     <span className="text-xs text-muted-foreground italic">Predeterminado</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {staffList.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No hay usuarios registrados además del administrador principal.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
