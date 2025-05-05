
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { PlusCircle, Trash2, Edit } from 'lucide-react';
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

// Storage key for staff members
const STAFF_STORAGE_KEY = 'staffMembers';

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
  const { updatePasswordForUser, getAllUsers, deleteUser } = useAuth(); // Get functions from AuthContext

  // Load staff from sessionStorage on mount
  useEffect(() => {
    if (isStaffInitialized) return;

    console.log("Initializing staff list from storage...");
    const storedStaff = sessionStorage.getItem(STAFF_STORAGE_KEY);
    let loadedStaff: StaffMember[] = [];

    if (storedStaff) {
      try {
        const parsed = JSON.parse(storedStaff);
        if (Array.isArray(parsed)) {
          // Basic validation: check if items have required fields
          loadedStaff = parsed.filter(item => item.id && item.name && item.username && (item.role === 'admin' || item.role === 'worker'));
          console.log("Loaded staff:", loadedStaff);
        } else {
          console.warn("Invalid staff data found in storage, starting fresh.");
        }
      } catch (error) {
        console.error("Failed to parse stored staff:", error);
      }
    } else {
      console.log("No staff data found in storage.");
       // Ensure admin1 user exists if storage is empty or invalid
       const adminUser: StaffMember = { id: 'admin1-default', name: 'Admin Principal', username: 'admin1', role: 'admin' };
       loadedStaff = [adminUser];
       // Optionally update AuthContext password store if needed, though AuthContext handles its own default
    }

    // Ensure the default admin 'admin1' is always present and cannot be deleted (implicitly via filtering logic later)
    const adminExists = loadedStaff.some(s => s.username.toLowerCase() === 'admin1');
    if (!adminExists) {
        loadedStaff.push({ id: 'admin1-default', name: 'Admin Principal', username: 'admin1', role: 'admin' });
        console.log("Ensured default admin 'admin1' exists.");
    }


    loadedStaff.sort((a, b) => a.name.localeCompare(b.name));
    setStaffList(loadedStaff);
    setIsStaffInitialized(true);
    console.log("Staff list initialization complete.");

  }, [isStaffInitialized]);

  // Save staff list to sessionStorage whenever it changes
  useEffect(() => {
    if (!isStaffInitialized) return;

    console.log("Saving staff list to storage...");
    try {
      // Filter out the default admin before saving, it's managed internally by AuthContext primarily
      // const staffToSave = staffList.filter(s => s.username.toLowerCase() !== 'admin1');
      sessionStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList)); // Save the full list including admin1 for display purposes
      console.log("Staff list saved.");
    } catch (error) {
      console.error("Failed to save staff list to storage:", error);
      toast({ title: "Error", description: "No se pudo guardar la lista de personal.", variant: "destructive" });
    }
  }, [staffList, isStaffInitialized, toast]);

  if (!isStaffInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando Usuarios...</div>;
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
         const usernameExists = staffList.some(
           staff => staff.id !== editingStaffMember.id && staff.username.toLowerCase() === usernameLower
         );
         if (usernameExists) {
           toast({ title: "Error", description: `El nombre de usuario "${username}" ya está en uso.`, variant: "destructive" });
           return;
         }
      }

       // Prevent changing the role of the default admin 'admin1'
       if (editingStaffMember.username.toLowerCase() === 'admin1' && role !== 'admin') {
            toast({ title: "Error", description: "No se puede cambiar el rol del administrador principal.", variant: "destructive" });
            return;
       }


      // Update password in AuthContext if provided
      if (password) {
        if (password.length < 4) {
          toast({ title: "Error", description: "La contraseña debe tener al menos 4 caracteres.", variant: "destructive" });
          return;
        }
        try {
            updatePasswordForUser(usernameLower, password); // Use AuthContext function
             toast({ title: "Contraseña Actualizada", description: `Contraseña para ${username} actualizada.`, variant: "default" });
        } catch (error: any) {
             toast({ title: "Error Contraseña", description: error.message || "No se pudo actualizar la contraseña.", variant: "destructive" });
             return; // Stop if password update fails
        }
      }

      // Update staff list state
      setStaffList((prevList) =>
        prevList.map((staff) =>
          staff.id === editingStaffMember.id
            ? { ...staff, name, username: username, role } // Update username case if needed
            : staff
        ).sort((a, b) => a.name.localeCompare(b.name))
      );

      toast({ title: "Personal Actualizado", description: `Datos de ${name} actualizados.` });

    } else {
      // --- Adding new staff member ---
      if (!password || password.length < 4) {
        toast({ title: "Error", description: "La contraseña es obligatoria y debe tener al menos 4 caracteres.", variant: "destructive" });
        return;
      }

      // Check if username already exists
       const usernameExists = staffList.some(staff => staff.username.toLowerCase() === usernameLower);
      if (usernameExists) {
        toast({ title: "Error", description: `El nombre de usuario "${username}" ya está en uso.`, variant: "destructive" });
        return;
      }

       // Prevent adding another user with username 'admin1' (case-insensitive)
       if (usernameLower === 'admin1') {
          toast({ title: "Error", description: `El nombre de usuario "admin1" está reservado.`, variant: "destructive" });
          return;
       }

       // Add user and password using AuthContext function
      try {
           updatePasswordForUser(usernameLower, password); // This implicitly adds the user if they don't exist in AuthContext's store

          const newStaffMember: StaffMember = {
            id: `${usernameLower}-${Date.now()}`, // Simple unique ID
            name,
            username: username, // Keep original case for display
            role,
          };

          setStaffList((prevList) => [...prevList, newStaffMember].sort((a, b) => a.name.localeCompare(b.name)));
          toast({ title: "Personal Añadido", description: `${name} ha sido añadido como ${role}.` });

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
           deleteUser(staffMemberToDelete.username.toLowerCase()); // Delete from AuthContext store
           setStaffList(prevList => prevList.filter(staff => staff.id !== staffMemberToDelete.id));
           toast({ title: "Personal Eliminado", description: `${staffMemberToDelete.name} ha sido eliminado.`, variant: "destructive" });
       } catch (error: any) {
           toast({ title: "Error Eliminando", description: error.message || "No se pudo eliminar el usuario.", variant: "destructive" });
       }
   };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
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
                   value={newStaffData.password}
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
               {/* Use DialogClose for the Cancel button */}
               <DialogClose>
                 <Button type="button" variant="secondary" onClick={closeDialog}>Cancelar</Button> {/* Added onClick to ensure state reset */}
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
                  No hay personal registrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
