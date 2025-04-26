'use client';

import * as React from 'react';
import {useState} from 'react';
import {format} from 'date-fns';
import { es } from 'date-fns/locale'; // Import Spanish locale for date-fns
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
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
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {PlusCircle, Calendar as CalendarIcon, Trash2} from 'lucide-react';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Calendar} from '@/components/ui/calendar';
import {cn} from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';


interface CashMovement { // Renamed from Expense
  id: number;
  date: Date;
  category: string;
  description: string;
  amount: number; // Positive for income, negative for expense
}

// Categories can include income types as well
const movementCategories = ['Ingreso Venta', 'Suministros', 'Mantenimiento', 'Servicios', 'Alquiler', 'Salarios', 'Marketing', 'Otros Egresos', 'Otros Ingresos']; // Added income/expense distinction

const initialMovements: CashMovement[] = [ // Renamed from initialExpenses
  { id: 1, date: new Date(2024, 5, 1), category: 'Suministros', description: 'Entrega de verduras', amount: -150.75 }, // Negative for expense
  { id: 2, date: new Date(2024, 5, 3), category: 'Mantenimiento', description: 'Reparación de fontanería', amount: -300.00 }, // Negative for expense
  { id: 3, date: new Date(2024, 5, 5), category: 'Servicios', description: 'Factura de electricidad', amount: -450.50 }, // Negative for expense
  { id: 4, date: new Date(2024, 5, 10), category: 'Alquiler', description: 'Alquiler mensual', amount: -2500.00 }, // Negative for expense
  { id: 5, date: new Date(2024, 5, 12), category: 'Ingreso Venta', description: 'Ventas del día', amount: 850.00 }, // Positive for income
];

export default function CashRegisterPage() { // Renamed component
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(initialMovements); // Renamed state
  const [newMovement, setNewMovement] = useState<{ // Renamed state
    date: Date | undefined;
    category: string;
    description: string;
    amount: string;
    type: 'income' | 'expense'; // Added type for income/expense
  }>({ date: undefined, category: '', description: '', amount: '', type: 'expense' }); // Default to expense
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof newMovement
  ) => {
    setNewMovement((prev) => ({ ...prev, [key]: e.target.value }));
  };

   const handleSelectChange = (value: string, key: keyof typeof newMovement) => {
      // Automatically set type based on category prefix if desired, or handle explicitly
      const isIncome = value.toLowerCase().includes('ingreso');
      setNewMovement((prev) => ({
          ...prev,
          [key]: value,
          type: isIncome ? 'income' : 'expense' // Set type based on category selected
      }));
  }

   const handleDateChange = (date: Date | undefined) => { // Simplified key
        setNewMovement((prev) => ({ ...prev, date: date }));
    }

    const handleTypeChange = (value: 'income' | 'expense') => {
        setNewMovement((prev) => ({ ...prev, type: value }));
    }


  const handleAddMovement = () => { // Renamed function
    if (!newMovement.date || !newMovement.category || !newMovement.description || !newMovement.amount) {
       toast({ title: "Error", description: "Por favor, rellene todos los campos.", variant: "destructive"}) // Please fill all fields.
      return;
    }

    const newId = cashMovements.length > 0 ? Math.max(...cashMovements.map((m) => m.id)) + 1 : 1;
    const amountValue = parseFloat(newMovement.amount);
    // Ensure amount is negative for expenses and positive for income
    const finalAmount = newMovement.type === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue);

    const addedMovement: CashMovement = { // Renamed type
        id: newId,
        date: newMovement.date,
        category: newMovement.category,
        description: newMovement.description,
        amount: finalAmount, // Use adjusted amount
    }

    setCashMovements([...cashMovements, addedMovement].sort((a, b) => b.date.getTime() - a.date.getTime())); // Keep sorted by date descending
    setNewMovement({ date: undefined, category: '', description: '', amount: '', type: 'expense' }); // Reset form
    setIsAddDialogOpen(false); // Close dialog
     toast({ title: "Éxito", description: `Movimiento de $${addedMovement.amount.toFixed(2)} registrado.` }); // Movement of $... added.
  };

   const handleDeleteMovement = (id: number) => { // Renamed function
        const movementToDelete = cashMovements.find(m => m.id === id);
        setCashMovements(cashMovements.filter((m) => m.id !== id));
         toast({ title: "Eliminado", description: `Movimiento por ${movementToDelete?.description} eliminado.`, variant: "destructive"}); // Movement for ... removed.
    };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Caja</h1> {/* Changed Title */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Registrar Movimiento {/* Changed Button Text */}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Movimiento de Caja</DialogTitle> {/* Changed Dialog Title */}
              <DialogDescription>
                Introduzca los detalles del nuevo movimiento (ingreso o egreso). {/* Changed Dialog Description */}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha {/* Date */}
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
                        {newMovement.date ? format(newMovement.date, 'PPP', { locale: es }) : <span>Elige una fecha</span>} {/* Pick a date */}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newMovement.date}
                        onSelect={handleDateChange} // Updated handler call
                        initialFocus
                        locale={es} // Set calendar locale to Spanish
                      />
                    </PopoverContent>
                  </Popover>
              </div>
                {/* Type Selector (Income/Expense) */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                        Tipo {/* Type */}
                    </Label>
                     <Select onValueChange={(value: 'income' | 'expense') => handleTypeChange(value)} value={newMovement.type}>
                        <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona tipo" /> {/* Select type */}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="expense">Egreso</SelectItem> {/* Expense */}
                            <SelectItem value="income">Ingreso</SelectItem> {/* Income */}
                        </SelectContent>
                    </Select>
                </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="category" className="text-right">
                  Categoría {/* Category */}
                </Label>
                 <Select onValueChange={(value) => handleSelectChange(value, 'category')} value={newMovement.category}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una categoría" /> {/* Select category */}
                    </SelectTrigger>
                    <SelectContent>
                      {movementCategories
                        .filter(cat => newMovement.type === 'income' ? cat.toLowerCase().includes('ingreso') : !cat.toLowerCase().includes('ingreso')) // Filter categories based on type
                        .map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción {/* Description */}
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
                  Monto ($) {/* Amount ($) */}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0" // Amount should be positive, type determines sign
                  value={newMovement.amount}
                  onChange={(e) => handleInputChange(e, 'amount')}
                  className="col-span-3"
                   required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancelar</Button> {/* Cancel */}
               </DialogClose>
              <Button type="submit" onClick={handleAddMovement}>Registrar Movimiento</Button> {/* Changed Button Text */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead> {/* Date */}
                  <TableHead>Categoría</TableHead> {/* Category */}
                  <TableHead>Descripción</TableHead> {/* Description */}
                  <TableHead className="text-right">Monto</TableHead> {/* Amount */}
                  <TableHead className="text-right">Acciones</TableHead> {/* Actions */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashMovements.map((movement) => ( // Use renamed state variable
                  <TableRow key={movement.id}>
                    <TableCell>{format(movement.date, 'dd/MM/yyyy')}</TableCell> {/* Format date Spanish style */}
                    <TableCell>{movement.category}</TableCell>
                    <TableCell className="font-medium">{movement.description}</TableCell>
                    {/* Apply color based on amount */}
                    <TableCell className={cn(
                        "text-right",
                        movement.amount >= 0 ? "text-green-600" : "text-red-600" // Direct color use for +/- indication
                    )}>
                        ${movement.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                         <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDeleteMovement(movement.id)} // Use renamed handler
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {cashMovements.length === 0 && ( // Use renamed state variable
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aún no se han registrado movimientos de caja. ¡Registre algunos! {/* Updated text */}
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
        </Card>
    </div>
  );
}
