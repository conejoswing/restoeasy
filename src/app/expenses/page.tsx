
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Calendar as CalendarIcon, FileCheck, Banknote, CreditCard, Landmark } from 'lucide-react'; // Added Banknote, CreditCard, Landmark
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaymentMethod } from '@/app/tables/[tableId]/page'; // Import PaymentMethod type


export interface CashMovement { // Export interface for use in table page
  id: number;
  date: Date | string; // Allow string for JSON parsing, convert back to Date
  category: string;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod; // Optional: Track payment method for sales
}

const movementCategories = ['Ingreso Venta', 'Suministros', 'Mantenimiento', 'Servicios', 'Alquiler', 'Salarios', 'Marketing', 'Otros Egresos', 'Otros Ingresos'];

// Initial movements are now just a fallback if nothing is in storage
const initialMovements: CashMovement[] = []; // Start with empty initial movements

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
  const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false); // State for closing dialog
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
          loadedMovements = parsed.map((m: any) => ({ // Use any temporarily for parsing flexibility
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

   // Calculate daily totals per payment method
   const {
       dailyCashIncome,
       dailyDebitCardIncome,
       dailyCreditCardIncome,
       dailyTransferIncome,
       dailyTotalIncome,
       dailyExpenses,
       dailyNetTotal
    } = useMemo(() => {
        const today = startOfDay(new Date());
        let cash = 0;
        let debit = 0;
        let credit = 0;
        let transfer = 0;
        let expenses = 0;

        cashMovements.forEach(movement => {
            // Ensure movement.date is a Date object before comparison
            const movementDate = movement.date instanceof Date ? movement.date : new Date(movement.date);
            if (isToday(movementDate)) {
                if (movement.amount > 0 && movement.category === 'Ingreso Venta') {
                    // Sum income based on payment method
                    switch(movement.paymentMethod) {
                        case 'Efectivo': cash += movement.amount; break;
                        case 'Tarjeta Débito': debit += movement.amount; break;
                        case 'Tarjeta Crédito': credit += movement.amount; break;
                        case 'Transferencia': transfer += movement.amount; break;
                        default: cash += movement.amount; // Default to cash if method is missing
                    }
                } else if (movement.amount > 0 && movement.category === 'Otros Ingresos') {
                    // Assume 'Otros Ingresos' are cash for simplicity, or adjust if needed
                    cash += movement.amount;
                }
                 else if (movement.amount < 0) {
                    expenses += Math.abs(movement.amount); // Sum all expenses
                }
            }
        });

        const totalIncome = cash + debit + credit + transfer;

        return {
            dailyCashIncome: cash,
            dailyDebitCardIncome: debit,
            dailyCreditCardIncome: credit,
            dailyTransferIncome: transfer,
            dailyTotalIncome: totalIncome,
            dailyExpenses: expenses,
            dailyNetTotal: totalIncome - expenses,
        };
   }, [cashMovements]);


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
    const isIncome = value === 'Ingreso Venta' || value === 'Otros Ingresos'; // Specific check for income categories
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
      // Payment method is only added for sales from table detail page
    }

    // Update state, which will trigger the useEffect to save to storage
    setCashMovements((prev) =>
        [...prev, addedMovement].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );

    setNewMovement({ date: undefined, category: '', description: '', amount: '', type: 'expense' });
    setIsAddDialogOpen(false);
    toast({ title: "Éxito", description: `Movimiento de ${formatCurrency(addedMovement.amount)} registrado.` });
  };

  const handleConfirmClosing = () => {
    // Here you would normally trigger a print action
    console.log("Imprimiendo resumen de cierre de caja:");
    console.log(`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`);
    console.log(`Total Ingresos (Efectivo): ${formatCurrency(dailyCashIncome)}`);
    console.log(`Total Ingresos (T. Débito): ${formatCurrency(dailyDebitCardIncome)}`);
    console.log(`Total Ingresos (T. Crédito): ${formatCurrency(dailyCreditCardIncome)}`);
    console.log(`Total Ingresos (Transferencia): ${formatCurrency(dailyTransferIncome)}`);
    console.log(`Total Ingresos (General): ${formatCurrency(dailyTotalIncome)}`);
    console.log(`Total Egresos: ${formatCurrency(dailyExpenses)}`);
    console.log(`Total Neto: ${formatCurrency(dailyNetTotal)}`);

    // Clear the movements in state
    setCashMovements([]);
    // Clear the movements in sessionStorage
    sessionStorage.removeItem(CASH_MOVEMENTS_STORAGE_KEY);

    setIsClosingDialogOpen(false); // Close the dialog
    toast({ title: "Cierre de Caja Impreso y Realizado", description: "Se han borrado todos los movimientos registrados.", variant: "default"});
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
      {/* Title first */}
      <h1 className="text-3xl font-bold mb-6">Gestión de Caja</h1>

      {/* Buttons and Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Register Movement Button */}
        <div className="md:col-span-1 flex items-start">
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
                                    // Filter based on the selected type (income/expense)
                                    .filter(cat => {
                                        const isIncomeCat = cat === 'Ingreso Venta' || cat === 'Otros Ingresos';
                                        return newMovement.type === 'income' ? isIncomeCat : !isIncomeCat;
                                    })
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

         {/* Daily Summary Cards */}
         <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2"> {/* Adjusted grid for 4 cards */}
             <Card className="text-center">
                 <CardHeader className="p-2 pb-0 flex flex-row items-center justify-center space-x-2">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-xs font-medium">Efectivo</CardTitle>
                 </CardHeader>
                 <CardContent className="p-2 pt-0">
                     <p className="text-lg font-bold text-green-600">{formatCurrency(dailyCashIncome)}</p>
                 </CardContent>
             </Card>
             <Card className="text-center">
                 <CardHeader className="p-2 pb-0 flex flex-row items-center justify-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-xs font-medium">T. Débito</CardTitle>
                 </CardHeader>
                 <CardContent className="p-2 pt-0">
                     <p className="text-lg font-bold text-blue-600">{formatCurrency(dailyDebitCardIncome)}</p>
                 </CardContent>
             </Card>
             <Card className="text-center">
                 <CardHeader className="p-2 pb-0 flex flex-row items-center justify-center space-x-2">
                     <CreditCard className="h-4 w-4 text-muted-foreground" />
                     <CardTitle className="text-xs font-medium">T. Crédito</CardTitle>
                 </CardHeader>
                 <CardContent className="p-2 pt-0">
                     <p className="text-lg font-bold text-purple-600">{formatCurrency(dailyCreditCardIncome)}</p>
                 </CardContent>
             </Card>
             <Card className="text-center">
                  <CardHeader className="p-2 pb-0 flex flex-row items-center justify-center space-x-2">
                     <Landmark className="h-4 w-4 text-muted-foreground" />
                     <CardTitle className="text-xs font-medium">Transfer.</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                      <p className="text-lg font-bold text-indigo-600">{formatCurrency(dailyTransferIncome)}</p>
                  </CardContent>
             </Card>
         </div>
      </div>

      {/* Cash Closing Button & Net Total Summary (Swapped positions) */}
      <div className="flex justify-between items-center mb-6 gap-4">
           {/* Cash Closing Button */}
          <AlertDialog open={isClosingDialogOpen} onOpenChange={setIsClosingDialogOpen}>
              <AlertDialogTrigger asChild>
                 <Button variant="default">
                      <FileCheck className="mr-2 h-4 w-4" /> Cierre de Caja
                 </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Resumen del Cierre de Caja - {format(new Date(), 'dd/MM/yyyy')}</AlertDialogTitle>
                      <AlertDialogDescription>
                          Revisa los totales del día antes de confirmar el cierre. Al confirmar, se imprimirán los totales y se borrarán todos los movimientos registrados hoy.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-2 text-sm mt-4">
                     <div className="flex justify-between">
                         <span>Total Ingresos (Efectivo):</span>
                         <span className="font-medium text-green-600">{formatCurrency(dailyCashIncome)}</span>
                     </div>
                      <div className="flex justify-between">
                         <span>Total Ingresos (T. Débito):</span>
                         <span className="font-medium text-blue-600">{formatCurrency(dailyDebitCardIncome)}</span>
                     </div>
                      <div className="flex justify-between">
                         <span>Total Ingresos (T. Crédito):</span>
                         <span className="font-medium text-purple-600">{formatCurrency(dailyCreditCardIncome)}</span>
                     </div>
                      <div className="flex justify-between">
                         <span>Total Ingresos (Transferencia):</span>
                         <span className="font-medium text-indigo-600">{formatCurrency(dailyTransferIncome)}</span>
                     </div>
                     <div className="flex justify-between font-semibold">
                         <span>Total Ingresos (General):</span>
                         <span className="font-medium text-green-600">{formatCurrency(dailyTotalIncome)}</span>
                     </div>
                     <div className="flex justify-between">
                         <span>Total Egresos:</span>
                         <span className="font-medium text-red-600">{formatCurrency(dailyExpenses)}</span>
                     </div>
                      <hr className="my-2"/>
                      <div className="flex justify-between font-semibold">
                          <span>Total Neto:</span>
                          <span className={cn(dailyNetTotal >= 0 ? "text-green-600" : "text-red-600")}>
                              {formatCurrency(dailyNetTotal)}
                          </span>
                      </div>
                  </div>
                  <AlertDialogFooter className="mt-6">
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      {/* Changed button text */}
                      <AlertDialogAction onClick={handleConfirmClosing} className={cn(buttonVariants({ variant: "default" }))}>Imprimir Cierre de Caja</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>

            {/* Net Total Summary Card */}
           <Card className="text-center flex-grow max-w-xs"> {/* Added flex-grow and max-w-xs */}
                 <CardHeader className="p-2 pb-0">
                     <CardTitle className="text-sm font-medium">Total Neto Hoy</CardTitle>
                 </CardHeader>
                 <CardContent className="p-2 pt-0">
                     <p className={cn(
                        "text-xl font-bold",
                         dailyNetTotal >= 0 ? "text-green-600" : "text-red-600"
                     )}>
                         {formatCurrency(dailyNetTotal)}
                     </p>
                 </CardContent>
           </Card>
      </div>


      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Método</TableHead> {/* Added Payment Method Column */}
              {/* <TableHead className="text-right">Acciones</TableHead> */}
            </TableRow>
          </TableHeader>
          {/* Render TableBody only on the client after initialization */}
          {isInitialized && (
            <TableBody>
              {cashMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{format(new Date(movement.date), 'dd/MM/yyyy HH:mm')}</TableCell>{/* Ensure date is Date object, added time */}
                  <TableCell>{movement.category}</TableCell>
                  <TableCell className="font-medium">{movement.description}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono", // Added font-mono for better number alignment
                    movement.amount >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(movement.amount)}
                  </TableCell>
                   <TableCell className="text-right text-xs text-muted-foreground">
                       {movement.category === 'Ingreso Venta' ? (movement.paymentMethod ?? 'Efectivo') : '-'}
                   </TableCell>
                </TableRow>
              ))}
              {cashMovements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground"> {/* Increased colSpan to 5 */}
                    Aún no se han registrado movimientos de caja hoy. ¡Registre algunos!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </Card>
    </div>
  );
}

