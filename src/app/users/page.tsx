

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { PlusCircle, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Type definition for a Staff Member
export interface StaffMember {
  id: string;
  name: string;
  username: string; // Unique username for login
  role: 'admin' | 'worker'; // Role determines privileges
  // Password is not stored directly in this state but managed by AuthContext
}


export default function UsersPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isStaffInitialized, setIsStaffInitialized] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [newStaffData, setNewStaffData] = useState<{
    name: string;
    username: string;
    role: 'admin' | 'worker';
    password?: string;
  }>({ name: '', username: '', role: 'worker', password: '' });
  const { toast } = useToast();
  const { users, updatePasswordForUser, deleteUser, addUser, isLoading, isAuthenticated, userRole } = useAuth();
  const router = useRouter();


  useEffect(() => {
    const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
    setStaffList(sortedUsers);
    setIsStaffInitialized(true);
    console.log("UsersPage: Staff list updated from AuthContext.", sortedUsers.map(u=>u.username));

  }, [users]);


  if (isLoading || !isStaffInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando Usuarios...</div>;
  }


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
      password: '',
    });
    setIsAddEditDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddEditDialogOpen(false);
    setEditingStaffMember(null);
    setNewStaffData({ name: '', username: '', role: 'worker', password: '' });
  };


  const handleAddOrEditStaff = () => {
    const { name, username, role, password } = newStaffData;

    if (!name || !username || !role) {
      toast({ title: "Error", description: "Nombre, Usuario y Rol son obligatorios.", variant: "destructive" });
      return;
    }

    if (username.includes(' ') || username.length < 3) {
         toast({ title: "Error", description: "El nombre de usuario no puede contener espacios y debe tener al menos 3 caracteres.", variant: "destructive" });
         return;
    }

    const usernameLower = username.toLowerCase();

    if (editingStaffMember) {
      if (usernameLower !== editingStaffMember.username.toLowerCase()) {
         const usernameExists = users.some(
           staff => staff.id !== editingStaffMember.id && staff.username.toLowerCase() === usernameLower
         );
         if (usernameExists) {
           toast({ title: "Error", description: `El nombre de usuario "${username}" ya está en uso.`, variant: "destructive" });
           return;
         }
      }

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


      if (password) {
        if (password.length < 4) {
          toast({ title: "Error", description: "La contraseña debe tener al menos 4 caracteres.", variant: "destructive" });
          return;
        }
        try {
            updatePasswordForUser(editingStaffMember.username, password);
             toast({ title: "Contraseña Actualizada", description: `Contraseña para ${editingStaffMember.username} actualizada.`, variant: "default" });
        } catch (error: any) {
             toast({ title: "Error Contraseña", description: error.message || "No se pudo actualizar la contraseña.", variant: "destructive" });
             return;
        }
      }

       console.warn("User detail update (name, username, role) might require an 'updateUser' function in AuthContext for full persistence.");
       setStaffList((prevList) =>
         prevList.map((staff) =>
           staff.id === editingStaffMember.id ? { ...staff, name, username, role } : staff
         ).sort((a, b) => a.name.localeCompare(b.name))
       );


      toast({ title: "Usuario Actualizado", description: `Datos de ${name} actualizados.` });

    } else {
      if (!password || password.length < 4) {
        toast({ title: "Error", description: "La contraseña es obligatoria y debe tener al menos 4 caracteres.", variant: "destructive" });
        return;
      }

       const usernameExists = users.some(staff => staff.username.toLowerCase() === usernameLower);
      if (usernameExists) {
        toast({ title: "Error", description: `El nombre de usuario "${username}" ya está en uso.`, variant: "destructive" });
        return;
      }

       if (usernameLower === 'admin1') {
          toast({ title: "Error", description: `El nombre de usuario "admin1" está reservado.`, variant: "destructive" });
          return;
       }

      try {
          const newStaffMember: Omit<StaffMember, 'id'> & {password: string} = {
            name,
            username: username,
            role,
            password
          };
           addUser(newStaffMember);
          toast({ title: "Usuario Añadido", description: `${name} ha sido añadido como ${role}.` });

      } catch (error: any) {
         toast({ title: "Error Añadiendo", description: error.message || "No se pudo añadir el usuario.", variant: "destructive" });
         return;
      }

    }
    closeDialog();
  };


   const handleDeleteStaff = (staffMemberToDelete: StaffMember) => {
       if (staffMemberToDelete.username.toLowerCase() === 'admin1') {
           toast({ title: "Acción no permitida", description: "No se puede eliminar al administrador principal.", variant: "destructive" });
           return;
       }

       try {
           deleteUser(staffMemberToDelete.username);
           toast({ title: "Usuario Eliminado", description: `${staffMemberToDelete.name} ha sido eliminado.`, variant: "destructive" });
       } catch (error: any) {
           toast({ title: "Error Eliminando", description: error.message || "No se pudo eliminar el usuario.", variant: "destructive" });
       }
   };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/tables')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
        </Button>

        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>

        <Dialog open={isAddEditDialogOpen} onOpenChange={(isOpen) => {
            setIsAddEditDialogOpen(isOpen);
            if (!isOpen) {
              closeDialog(); // Ensure form is reset when dialog is closed via 'x' or overlay click
            }
        }}>
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
                   value={newStaffData.password ?? ''}
                   onChange={(e) => handleInputChange(e, 'password')}
                   className="col-span-3"
                   required={!editingStaffMember}
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
               <Button type="button" variant="secondary" onClick={closeDialog}>Cancelar</Button>
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
