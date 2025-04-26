
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';


interface CashMovement {
  id: number;
  date: Date;
  category: string;
  description: string;
  amount: number;
}

const movementCategories = ['Ingreso Venta', 'Suministros', 'Mantenimiento', 'Servicios', 'Alquiler', 'Salarios', 'Marketing', 'Otros Egresos', 'Otros Ingresos'];

const initialMovements: CashMovement[] = [
  { id: 1, date: new Date(2024, 5, 1), category: 'Suministros', description: 'Entrega de verduras', amount: -150750 },
  { id: 2, date: new Date(2024, 5, 3), category: 'Mantenimiento', description: 'Reparación de fontanería', amount: -300000 },
  { id: 3, date: new Date(2024, 5, 5), category: 'Servicios', description: 'Factura de electricidad', amount: -450500 },
  { id: 4, date: new Date(2024, 5, 10), category: 'Alquiler', description: 'Alquiler mensual', amount: -2500000 },
  { id: 5, date: new Date(2024, 5, 12), category: 'Ingreso Venta', description: 'Ventas del día', amount: 850000 },
];

export default function CashRegisterPage() {
  // Role checks and redirection are now handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(initialMovements);
  const [newMovement, setNewMovement] = useState<{
    date: Date | undefined;
    category: string;
    description: string;
    amount: string;
    type: 'income' | 'expense';
  }>({ date: undefined, category: '', description: '', amount: '', type: 'expense' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // No need for explicit redirect here, AuthProvider handles it

  const formatCurrency = (amount: number) => {
    return `CLP ${amount.toFixed(0)}`;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof newMovement
  ) => {
    setNewMovement((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSelectChange = (value: string, key: keyof typeof newMovement) => {
    const isIncome = value.toLowerCase().includes('ingreso');
    setNewMovement((prev) => ({
      ...prev,
      [key]: value,
      type: isIncome ? 'income' : 'expense'
    }));
  }

  const handleDateChange = (date: Date | undefined) => {
    setNewMovement((prev) => ({ ...prev, date: date }));
  }

  const handleTypeChange = (value: 'income' | 'expense') => {
    setNewMovement((prev) => ({ ...prev, type: value }));
  }


  const handleAddMovement = () => {
    if (!newMovement.date || !newMovement.category || !newMovement.description || !newMovement.amount) {
      toast({ title: "Error", description: "Por favor, rellene todos los campos.", variant: "destructive" })
      return;
    }

    const newId = cashMovements.length > 0 ? Math.max(...cashMovements.map((m) => m.id)) + 1 : 1;
    const amountValue = parseFloat(newMovement.amount);
    const finalAmount = newMovement.type === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue);

    const addedMovement: CashMovement = {
      id: newId,
      date: newMovement.date,
      category: newMovement.category,
      description: newMovement.description,
      amount: finalAmount,
    }

    setCashMovements([...cashMovements, addedMovement].sort((a, b) => b.date.getTime() - a.date.getTime()));
    setNewMovement({ date: undefined, category: '', description: '', amount: '', type: 'expense' });
    setIsAddDialogOpen(false);
    toast({ title: "Éxito", description: `Movimiento de ${formatCurrency(addedMovement.amount)} registrado.` });
  };

  const handleDeleteMovement = (id: number) => {
    const movementToDelete = cashMovements.find(m => m.id === id);
    setCashMovements(cashMovements.filter((m) => m.id !== id));
    toast({ title: "Eliminado", description: `Movimiento por ${movementToDelete?.description} eliminado.`, variant: "destructive" });
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
        <h1 className="text-3xl font-bold">Gestión de Caja</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Registrar Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Movimiento de Caja</DialogTitle>
              <DialogDescription>
                Introduzca los detalles del nuevo movimiento (ingreso o egreso).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'col-span-3 justify-start text-left font-normal',
                        !newMovement.date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newMovement.date ? format(newMovement.date, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newMovement.date}
                      onSelect={handleDateChange}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Tipo
                </Label>
                <Select onValueChange={(value: 'income' | 'expense') => handleTypeChange(value)} value={newMovement.type}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Egreso</SelectItem>
                    <SelectItem value="income">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categoría
                </Label>
                <Select onValueChange={(value) => handleSelectChange(value, 'category')} value={newMovement.category}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {movementCategories
                      .filter(cat => newMovement.type === 'income' ? cat.toLowerCase().includes('ingreso') : !cat.toLowerCase().includes('ingreso'))
                      .map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción
                </Label>
                <Input
                  id="description"
                  value={newMovement.description}
                  onChange={(e) => handleInputChange(e, 'description')}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Monto (CLP)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="0"
                  value={newMovement.amount}
                  onChange={(e) => handleInputChange(e, 'amount')}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              <Button type="submit" onClick={handleAddMovement}>Registrar Movimiento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              {/* <TableHead className="text-right">Acciones</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cashMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{format(movement.date, 'dd/MM/yyyy')}</TableCell>
                <TableCell>{movement.category}</TableCell>
                <TableCell className="font-medium">{movement.description}</TableCell>
                <TableCell className={cn(
                  "text-right",
                  movement.amount >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(movement.amount)}
                </TableCell>
                 {/*
                 <TableCell className="text-right">
                     <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => handleDeleteMovement(movement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                 </TableCell>
                 */}
              </TableRow>
            ))}
            {cashMovements.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Aún no se han registrado movimientos de caja. ¡Registre algunos!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
