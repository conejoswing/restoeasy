
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
import { Button, buttonVariants } from '@/components/ui/button';
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
import { PlusCircle, Calendar as CalendarIcon, FileCheck, Banknote, CreditCard, Landmark, Truck, Gift, TrendingUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PaymentMethod } from '@/app/tables/[tableId]/page';
import { formatCashClosingReceipt, printHtml } from '@/lib/printUtils';
import type { InventoryItem } from '@/app/inventory/page'; // Import InventoryItem type

export interface CashMovement {
  id: number;
  date: Date | string;
  category: string;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  deliveryFee?: number;
}

const movementCategories = ['Ingreso Venta', 'Suministros', 'Mantenimiento', 'Servicios', 'Alquiler', 'Salarios', 'Marketing', 'Otros Egresos', 'Otros Ingresos'];

const initialMovements: CashMovement[] = [];
const initialInventory: InventoryItem[] = [];


const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';
const INVENTORY_STORAGE_KEY = 'restaurantInventory';


export default function CashRegisterPage() {
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]); // State for inventory
  const [isInitialized, setIsInitialized] = useState(false);
  const [newMovement, setNewMovement] = useState<{
    date: Date | undefined;
    category: string;
    description: string;
    amount: string;
    type: 'income' | 'expense';
  }>({ date: undefined, category: '', description: '', amount: '', type: 'expense' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isInitialized) return;

    console.log("Initializing cash movements and inventory from storage...");
    // Load cash movements
    const storedMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    let loadedMovements: CashMovement[] = [];

    if (storedMovements) {
      try {
        const parsed = JSON.parse(storedMovements);
        if (Array.isArray(parsed)) {
          loadedMovements = parsed.filter(
            (m: any): m is Partial<CashMovement> =>
              m &&
              typeof m === 'object' &&
              typeof m.id !== 'undefined' &&
              typeof m.date !== 'undefined' &&
              typeof m.category !== 'undefined' &&
              typeof m.description !== 'undefined' &&
              typeof m.amount !== 'undefined'
          ).map((mValidated: Partial<CashMovement>) => ({
            id: Number(mValidated.id),
            date: new Date(mValidated.date!),
            category: String(mValidated.category),
            description: String(mValidated.description),
            amount: Number(mValidated.amount),
            paymentMethod: mValidated.paymentMethod,
            deliveryFee: mValidated.deliveryFee ? Number(mValidated.deliveryFee) : undefined,
          })).filter(m => !isNaN(m.id) && m.date instanceof Date && !isNaN(m.date.getTime()) && typeof m.category === 'string' && typeof m.description === 'string' && typeof m.amount === 'number' && !isNaN(m.amount));
          console.log("Loaded cash movements:", loadedMovements);
        } else {
          console.warn("Invalid cash movements data found, using initial data.");
          loadedMovements = initialMovements;
        }
      } catch (error) {
        console.error("Failed to parse stored cash movements:", error);
        loadedMovements = initialMovements;
      }
    } else {
      console.log("No cash movements found in storage, using initial data.");
      loadedMovements = initialMovements;
    }
    loadedMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setCashMovements(loadedMovements);

    // Load inventory
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    let loadedInventory: InventoryItem[] = [];
    if (storedInventory) {
      try {
        const parsedInventory = JSON.parse(storedInventory);
        if (Array.isArray(parsedInventory)) {
          loadedInventory = parsedInventory.filter(
            (item: any): item is Partial<InventoryItem> =>
              item &&
              typeof item === 'object' &&
              typeof item.name === 'string' &&
              typeof item.stock === 'number'
          ).map((itemValidated: Partial<InventoryItem>) => ({
            id: typeof itemValidated.id === 'number' ? itemValidated.id : Date.now() + Math.random(), // Ensure ID exists
            name: itemValidated.name!,
            stock: itemValidated.stock!,
          })).sort((a,b) => a.name.localeCompare(b.name));
           console.log("Loaded inventory for closing receipt:", loadedInventory);
        } else {
          console.warn("Invalid inventory data found in localStorage for closing receipt, using empty inventory.");
          loadedInventory = initialInventory;
        }
      } catch (error) {
        console.error("Failed to parse stored inventory for closing receipt:", error);
        loadedInventory = initialInventory;
      }
    } else {
      console.log("No inventory found in localStorage for closing receipt, using empty inventory.");
      loadedInventory = initialInventory;
    }
    setInventory(loadedInventory);


    setIsInitialized(true);
    console.log("Cash movements and inventory initialization complete.");

  }, [isInitialized]);

   useEffect(() => {
     if (!isInitialized) return;

     console.log("Saving cash movements to storage...");
     try {
        const movementsToStore = cashMovements.map(m => ({
            ...m,
            date: m.date instanceof Date ? m.date.toISOString() : m.date
        }));
       sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(movementsToStore));
       console.log("Cash movements saved.");
     } catch (error) {
       console.error("Failed to save cash movements to storage:", error);
     }
   }, [cashMovements, isInitialized]);

   const {
       dailyCashIncome,
       dailyDebitCardIncome,
       dailyCreditCardIncome,
       dailyTransferIncome,
       dailyDeliveryFees,
       dailyTipsTotal,
       dailyTotalIncome,
       dailyExpenses,
       dailyNetTotal,
       dailyGrossTotal
    } = useMemo(() => {
        const today = startOfDay(new Date());
        let cash = 0;
        let debit = 0;
        let credit = 0;
        let transfer = 0;
        let deliveryFees = 0;
        let tips = 0;
        let expenses = 0;

        cashMovements.forEach(movement => {
            const movementDate = movement.date instanceof Date ? movement.date : new Date(movement.date);
            if (isToday(movementDate)) {
                if (movement.amount > 0 && movement.category === 'Ingreso Venta') {
                    switch(movement.paymentMethod) {
                        case 'Efectivo': cash += movement.amount; break;
                        case 'Tarjeta Débito': debit += movement.amount; break;
                        case 'Tarjeta Crédito': credit += movement.amount; break;
                        case 'Transferencia': transfer += movement.amount; break;
                        default: cash += movement.amount; // Default to cash if method is undefined
                    }
                    if (movement.deliveryFee && movement.deliveryFee > 0) {
                         deliveryFees += movement.deliveryFee;
                    }
                    // Extract tip from description if present
                    const tipMatch = movement.description.match(/Propina: (?:CLP)?\$?(\d{1,3}(?:\.\d{3})*)/);
                    if (tipMatch && tipMatch[1]) {
                        const tipString = tipMatch[1].replace(/\./g, ''); // Remove dots for parsing
                        const parsedTip = parseInt(tipString, 10);
                        if (!isNaN(parsedTip)) {
                            tips += parsedTip;
                        }
                    }

                } else if (movement.amount > 0 && movement.category === 'Otros Ingresos') {
                    cash += movement.amount; // Assuming "Otros Ingresos" are cash by default
                }
                 else if (movement.amount < 0) {
                    expenses += Math.abs(movement.amount);
                }
            }
        });

        const totalIncome = cash + debit + credit + transfer;
        const grossTotal = totalIncome + deliveryFees + tips; // Include delivery fees and tips in gross total

        return {
            dailyCashIncome: cash,
            dailyDebitCardIncome: debit,
            dailyCreditCardIncome: credit,
            dailyTransferIncome: transfer,
            dailyDeliveryFees: deliveryFees,
            dailyTipsTotal: tips,
            dailyTotalIncome: totalIncome,
            dailyExpenses: expenses,
            dailyNetTotal: totalIncome - expenses,
            dailyGrossTotal: grossTotal
        };
   }, [cashMovements]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof newMovement
  ) => {
    setNewMovement((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSelectChange = (value: string, key: keyof typeof newMovement) => {
    const isIncome = value === 'Ingreso Venta' || value === 'Otros Ingresos';
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

  const getNextMovementId = (currentMovements: CashMovement[]): number => {
      const maxId = currentMovements.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);
      return maxId + 1;
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

    const currentMovements = cashMovements;
    const newId = getNextMovementId(currentMovements);

    const addedMovement: CashMovement = {
      id: newId,
      date: newMovement.date,
      category: newMovement.category,
      description: newMovement.description,
      amount: finalAmount,
    }

    setCashMovements((prev) =>
        [...prev, addedMovement].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );

    setNewMovement({ date: undefined, category: '', description: '', amount: '', type: 'expense' });
    setIsAddDialogOpen(false);
    toast({ title: "Éxito", description: `Movimiento de ${formatCurrency(addedMovement.amount)} registrado.` });
  };

  const handleConfirmClosing = () => {
     const closingDateTime = new Date(); // Capture current date and time
     const totals = {
         dailyCashIncome, dailyDebitCardIncome, dailyCreditCardIncome, dailyTransferIncome,
         dailyDeliveryFees, dailyTipsTotal, dailyTotalIncome, dailyExpenses, dailyNetTotal, dailyGrossTotal
     };

     const dailyMovementsForReceipt = cashMovements.filter(movement => {
        const movementDate = movement.date instanceof Date ? movement.date : new Date(movement.date);
        return isToday(movementDate);
     });
     dailyMovementsForReceipt.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

     // Pass all daily movements and inventory to the formatting function
     const closingReceiptHtml = formatCashClosingReceipt(closingDateTime, totals, dailyMovementsForReceipt, inventory);

     printHtml(closingReceiptHtml);
     console.log("Imprimiendo resumen de cierre de caja...");

    setCashMovements([]);
    sessionStorage.removeItem(CASH_MOVEMENTS_STORAGE_KEY);

    setIsClosingDialogOpen(false);
    toast({ title: "Cierre de Caja Impreso y Realizado", description: "Se han borrado todos los movimientos registrados hoy.", variant: "default"});
  }

   if (!isInitialized) {
     return <div className="flex items-center justify-center min-h-screen">Cargando Caja...</div>;
   }


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gestión de Caja</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

         <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
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
              <Card className="text-center">
                   <CardHeader className="p-2 pb-0 flex flex-row items-center justify-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-xs font-medium">Costo Envío</CardTitle>
                   </CardHeader>
                   <CardContent className="p-2 pt-0">
                       <p className="text-lg font-bold text-orange-600">{formatCurrency(dailyDeliveryFees)}</p>
                   </CardContent>
              </Card>
              <Card className="text-center">
                   <CardHeader className="p-2 pb-0 flex flex-row items-center justify-center space-x-2">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-xs font-medium">Propina</CardTitle>
                   </CardHeader>
                   <CardContent className="p-2 pt-0">
                       <p className="text-lg font-bold text-pink-600">{formatCurrency(dailyTipsTotal)}</p>
                   </CardContent>
              </Card>
         </div>
      </div>

      <div className="flex justify-between items-center mb-6 gap-4">
          <AlertDialog open={isClosingDialogOpen} onOpenChange={setIsClosingDialogOpen}>
              <AlertDialogTrigger asChild>
                 <Button variant="default">
                      <FileCheck className="mr-2 h-4 w-4" /> Cierre de Caja
                 </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Resumen del Cierre de Caja - {format(new Date(), 'dd/MM/yyyy HH:mm')}</AlertDialogTitle>
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
                      <div className="flex justify-between">
                         <span>Total Costo Envío:</span>
                         <span className="font-medium text-orange-600">{formatCurrency(dailyDeliveryFees)}</span>
                     </div>
                      <div className="flex justify-between">
                         <span>Total Propinas:</span>
                         <span className="font-medium text-pink-600">{formatCurrency(dailyTipsTotal)}</span>
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
                       <div className="flex justify-between font-semibold">
                          <span>Total General (Bruto):</span>
                          <span className={cn(dailyGrossTotal >= 0 ? "text-green-600" : "text-red-600")}>
                              {formatCurrency(dailyGrossTotal)}
                          </span>
                      </div>
                  </div>
                  <AlertDialogFooter className="mt-6">
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmClosing} className={cn(buttonVariants({ variant: "default" }))}>Imprimir Cierre de Caja</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>

            <div className="flex gap-4">
                <Card className="text-center flex-grow max-w-xs">
                    <CardHeader className="p-2 pb-0 flex flex-row items-center justify-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">Total Hoy</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                        <p className="text-xl font-bold text-green-600">
                            {formatCurrency(dailyGrossTotal)}
                        </p>
                    </CardContent>
                </Card>

               <Card className="text-center flex-grow max-w-xs">
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
      </div>


      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Método</TableHead>
            </TableRow>
          </TableHeader>
          {isInitialized && (
            <TableBody>
              {cashMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{format(new Date(movement.date), 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell>{movement.category}</TableCell>
                  <TableCell className="font-medium">{movement.description}</TableCell>
                  <TableCell className={cn(
                    "text-right font-mono",
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
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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

