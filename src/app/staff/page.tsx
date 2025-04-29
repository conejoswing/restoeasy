
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

interface StaffMember {
  id: number;
  name: string;
  role: string; // Job title (e.g., 'Mesera')
  avatarUrl?: string; // Optional avatar URL
  accessLevel?: AccessLevel; // Optional: 'admin', 'worker', or 'none' for login privileges
}

// Mock data for staff members - Added accessLevel
const initialStaff: StaffMember[] = [
  { id: 1, name: 'Camila Pérez', role: 'Dueña / Gerente', avatarUrl: 'https://picsum.photos/id/237/50', accessLevel: 'admin' },
  { id: 2, name: 'Juan García', role: 'Cocinero Principal', avatarUrl: 'https://picsum.photos/id/238/50', accessLevel: 'worker' },
  { id: 3, name: 'María Rodríguez', role: 'Mesera', avatarUrl: 'https://picsum.photos/id/239/50', accessLevel: 'worker' },
  { id: 4, name: 'Carlos López', role: 'Ayudante de Cocina', avatarUrl: 'https://picsum.photos/id/240/50', accessLevel: 'none' }, // Example with no login access
];

export default function StaffPage() {
  // Role checks and redirection are now handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaffMember, setCurrentStaffMember] = useState<StaffMember | null>(null);
  // Updated state to include accessLevel
  const [newStaffData, setNewStaffData] = useState<{ name: string; role: string; accessLevel: AccessLevel }>({ name: '', role: '', accessLevel: 'none' });
  const { toast } = useToast();

  // No need for explicit redirect here, AuthProvider handles it

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof Omit<typeof newStaffData, 'accessLevel'>) => {
    setNewStaffData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Handler for access level Select component
  const handleAccessLevelChange = (value: AccessLevel) => {
      setNewStaffData((prev) => ({ ...prev, accessLevel: value }));
  };

  const handleAddOrEditStaff = () => {
    if (!newStaffData.name || !newStaffData.role) {
      toast({ title: "Error", description: "Por favor, complete nombre y cargo.", variant: "destructive" });
      return;
    }
    // Access level is optional to force setting, default is 'none'

    if (isEditing && currentStaffMember) {
      // Edit existing staff member - include accessLevel
      setStaff(staff.map(member =>
        member.id === currentStaffMember.id
          ? { ...member, name: newStaffData.name, role: newStaffData.role, accessLevel: newStaffData.accessLevel }
          : member
      ));
      toast({ title: "Éxito", description: "Miembro del personal actualizado." });
    } else {
      // Add new staff member - include accessLevel
      const newId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
      const newMember: StaffMember = {
        id: newId,
        name: newStaffData.name,
        role: newStaffData.role,
        accessLevel: newStaffData.accessLevel, // Save the selected access level
        // Optionally add a default or random avatar
        avatarUrl: `https://picsum.photos/seed/${newId}/50` // Use ID for consistent random image
      };
      setStaff([...staff, newMember]);
      toast({ title: "Éxito", description: "Nuevo miembro del personal añadido." });
    }

    closeDialog();
  };

  const openEditDialog = (member: StaffMember) => {
    setIsEditing(true);
    setCurrentStaffMember(member);
    // Pre-fill with existing data, including accessLevel or default to 'none'
    setNewStaffData({ name: member.name, role: member.role, accessLevel: member.accessLevel ?? 'none' });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setIsEditing(false);
    setCurrentStaffMember(null);
    // Reset state including accessLevel
    setNewStaffData({ name: '', role: '', accessLevel: 'none' });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentStaffMember(null);
    // Reset state including accessLevel
    setNewStaffData({ name: '', role: '', accessLevel: 'none' });
  };

  const handleDeleteStaff = (id: number) => {
     const memberToDelete = staff.find(m => m.id === id);
     // Use browser confirm for simplicity, consider a confirmation dialog for better UX
     if (confirm(`¿Está seguro de que desea eliminar a ${memberToDelete?.name}?`)) {
        setStaff(staff.filter(member => member.id !== id));
        toast({ title: "Eliminado", description: `${memberToDelete?.name} eliminado del personal.`, variant: "destructive" });
     }
  };

   // Loading state is handled by AuthProvider wrapper in layout.tsx
   if (isLoading) {
     return null; // Or a minimal loading indicator if preferred
   }
   // If not authenticated or not admin, AuthProvider will redirect
   if (!isAuthenticated || userRole !== 'admin') {
     return null; // Prevent rendering content before redirect
   }

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
              {/* Add Avatar URL input if needed */}
            </div>
            <DialogFooter>
              {/* Use DialogClose for the Cancel button */}
              <DialogClose asChild>
                 <Button type="button" variant="secondary" onClick={closeDialog}>Cancelar</Button> {/* Added onClick to ensure state reset */}
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
              <CardTitle className="text-sm font-medium">{member.name}</CardTitle>
              <div className="flex items-center space-x-1">
                 {/* Edit Button now opens the same dialog but in edit mode */}
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditDialog(member)}>
                   <Edit className="h-4 w-4" />
                   <span className="sr-only">Editar</span>
                 </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" onClick={() => handleDeleteStaff(member.id)}>
                    <Trash2 className="h-4 w-4" />
                   <span className="sr-only">Eliminar</span>
                 </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 mb-2">
                <AvatarImage src={member.avatarUrl || '/placeholder-avatar.png'} alt={member.name} />
                <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback> {/* Initials */}
              </Avatar>
              <p className="text-xs text-muted-foreground">{member.role}</p>
               {/* Optionally display access level visually */}
               {member.accessLevel && member.accessLevel !== 'none' && (
                   <span className={`mt-1 text-xs px-1.5 py-0.5 rounded ${member.accessLevel === 'admin' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                       {member.accessLevel === 'admin' ? 'Admin' : 'Trabajador'}
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

