
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
import { PlusCircle, Calendar as CalendarIcon, FileCheck } from 'lucide-react'; // Import FileCheck
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';


export interface CashMovement { // Export interface for use in table page
  id: number;
  date: Date | string; // Allow string for JSON parsing, convert back to Date
  category: string;
  description: string;
  amount: number;
}

const movementCategories = ['Ingreso Venta', 'Suministros', 'Mantenimiento', 'Servicios', 'Alquiler', 'Salarios', 'Marketing', 'Otros Egresos', 'Otros Ingresos'];

// Initial movements are now just a fallback if nothing is in storage
const initialMovements: CashMovement[] = [
  { id: 1, date: new Date(2024, 5, 1), category: 'Suministros', description: 'Entrega de verduras', amount: -150750 },
  { id: 2, date: new Date(2024, 5, 3), category: 'Mantenimiento', description: 'Reparación de fontanería', amount: -300000 },
  { id: 3, date: new Date(2024, 5, 5), category: 'Servicios', description: 'Factura de electricidad', amount: -450500 },
  { id: 4, date: new Date(2024, 5, 10), category: 'Alquiler', description: 'Alquiler mensual', amount: -2500000 },
  { id: 5, date: new Date(2024, 5, 12), category: 'Ingreso Venta', description: 'Ventas del día', amount: 850000 },
];

// Storage key
const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';

export default function CashRegisterPage() {
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization
  const [newMovement, setNewMovement] = useState<{
    date: Date | undefined;
    category: string;
    description: string;
    amount: string;
    type: 'income' | 'expense';
  }>({ date: undefined, category: '', description: '', amount: '', type: 'expense' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load movements from sessionStorage on mount
  useEffect(() => {
    if (isInitialized) return; // Prevent running multiple times

    console.log("Initializing cash movements from storage...");
    const storedMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    let loadedMovements: CashMovement[] = [];

    if (storedMovements) {
      try {
        const parsed = JSON.parse(storedMovements);
        if (Array.isArray(parsed)) {
          // Convert date strings back to Date objects
          loadedMovements = parsed.map((m: CashMovement) => ({
            ...m,
            date: new Date(m.date), // Ensure date is a Date object
          }));
           console.log("Loaded cash movements:", loadedMovements);
        } else {
          console.warn("Invalid cash movements data found, using initial data.");
          loadedMovements = initialMovements;
        }
      } catch (error) {
        console.error("Failed to parse stored cash movements:", error);
        loadedMovements = initialMovements; // Fallback to initial on error
      }
    } else {
      console.log("No cash movements found in storage, using initial data.");
      loadedMovements = initialMovements; // Use initial if nothing in storage
    }

    // Sort movements by date (most recent first)
    loadedMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setCashMovements(loadedMovements);
    setIsInitialized(true); // Mark as initialized
    console.log("Cash movements initialization complete.");

  }, [isInitialized]);

   // Save movements to sessionStorage whenever they change
   useEffect(() => {
     if (!isInitialized) return; // Only save after initial load

     console.log("Saving cash movements to storage...");
     try {
        // Store dates as ISO strings for reliable JSON serialization/parsing
        const movementsToStore = cashMovements.map(m => ({
            ...m,
            date: m.date instanceof Date ? m.date.toISOString() : m.date // Store as ISO string
        }));
       sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(movementsToStore));
       console.log("Cash movements saved.");
     } catch (error) {
       console.error("Failed to save cash movements to storage:", error);
     }
   }, [cashMovements, isInitialized]);


  const formatCurrency = (amount: number) => {
    // Format as CLP with no decimals
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
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

  // Helper to get the next available ID
  const getNextMovementId = (currentMovements: CashMovement[]): number => {
      return currentMovements.length > 0 ? Math.max(...currentMovements.map((m) => m.id)) + 1 : 1;
  };

  const handleAddMovement = () => {
    if (!newMovement.date || !newMovement.category || !newMovement.description || !newMovement.amount) {
      toast({ title: "Error", description: "Por favor, rellene todos los campos.", variant: "destructive" })
      return;
    }

    const amountValue = parseFloat(newMovement.amount);
    if (isNaN(amountValue)) {
         toast({ title: "Error", description: "El monto debe ser un número válido.", variant: "destructive" });
         return;
    }
    const finalAmount = newMovement.type === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue);

     // Read current movements from state (which should be synced with storage)
    const currentMovements = cashMovements;
    const newId = getNextMovementId(currentMovements);

    const addedMovement: CashMovement = {
      id: newId,
      date: newMovement.date, // Already a Date object
      category: newMovement.category,
      description: newMovement.description,
      amount: finalAmount,
    }

    // Update state, which will trigger the useEffect to save to storage
    setCashMovements((prev) =>
        [...prev, addedMovement].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );

    setNewMovement({ date: undefined, category: '', description: '', amount: '', type: 'expense' });
    setIsAddDialogOpen(false);
    toast({ title: "Éxito", description: `Movimiento de ${formatCurrency(addedMovement.amount)} registrado.` });
  };

  const handleCashClosing = () => {
    // Placeholder for cash closing logic
    toast({ title: "Cierre de Caja", description: "Funcionalidad de cierre de caja pendiente.", variant: "default"});
    // Implement dialog or calculation logic here
  }

   // Loading state is handled by AuthProvider wrapper in layout.tsx
   if (isLoading || !isInitialized) { // Wait for auth and local state init
     return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
   }
   // If not authenticated or not admin, AuthProvider will redirect
   if (!isAuthenticated || userRole !== 'admin') {
     return null; // Prevent rendering content before redirect
   }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Caja</h1>
        <div className="flex items-center gap-2"> {/* Added container for buttons */}
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
                        .filter(cat => cat !== 'Ingreso Venta') // Filter out 'Ingreso Venta'
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
            <Button variant="outline" onClick={handleCashClosing}> {/* Added Cierre de Caja button */}
                <FileCheck className="mr-2 h-4 w-4" /> Cierre de Caja
            </Button>
        </div>
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
                <TableCell>{format(new Date(movement.date), 'dd/MM/yyyy')}</TableCell> {/* Ensure date is Date object */}
                <TableCell>{movement.category}</TableCell>
                <TableCell className="font-medium">{movement.description}</TableCell>
                <TableCell className={cn(
                  "text-right font-mono", // Added font-mono for better number alignment
                  movement.amount >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(movement.amount)}
                </TableCell>
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
