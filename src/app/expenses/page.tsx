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


interface Expense {
  id: number;
  date: Date;
  category: string;
  description: string;
  amount: number;
}

const expenseCategories = ['Suministros', 'Mantenimiento', 'Servicios', 'Alquiler', 'Salarios', 'Marketing', 'Otros']; // Translated categories

const initialExpenses: Expense[] = [
  { id: 1, date: new Date(2024, 5, 1), category: 'Suministros', description: 'Entrega de verduras', amount: 150.75 }, // Supplies, Vegetables delivery
  { id: 2, date: new Date(2024, 5, 3), category: 'Mantenimiento', description: 'Reparación de fontanería', amount: 300.00 }, // Maintenance, Plumbing repair
  { id: 3, date: new Date(2024, 5, 5), category: 'Servicios', description: 'Factura de electricidad', amount: 450.50 }, // Utilities, Electricity bill
  { id: 4, date: new Date(2024, 5, 10), category: 'Alquiler', description: 'Alquiler mensual', amount: 2500.00 }, // Rent, Monthly rent
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [newExpense, setNewExpense] = useState<{
    date: Date | undefined;
    category: string;
    description: string;
    amount: string;
  }>({ date: undefined, category: '', description: '', amount: '' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof newExpense
  ) => {
    setNewExpense((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSelectChange = (value: string, key: keyof typeof newExpense) => {
      setNewExpense((prev) => ({ ...prev, [key]: value }));
  }

   const handleDateChange = (date: Date | undefined, key: keyof typeof newExpense) => {
        setNewExpense((prev) => ({ ...prev, [key]: date }));
    }

  const handleAddExpense = () => {
    if (!newExpense.date || !newExpense.category || !newExpense.description || !newExpense.amount) {
       toast({ title: "Error", description: "Por favor, rellene todos los campos.", variant: "destructive"}) // Please fill all fields.
      return;
    }

    const newId = expenses.length > 0 ? Math.max(...expenses.map((exp) => exp.id)) + 1 : 1;
    const addedExpense: Expense = {
        id: newId,
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
    }

    setExpenses([...expenses, addedExpense].sort((a, b) => b.date.getTime() - a.date.getTime())); // Keep sorted by date descending
    setNewExpense({ date: undefined, category: '', description: '', amount: '' }); // Reset form
    setIsAddDialogOpen(false); // Close dialog
     toast({ title: "Éxito", description: `Gasto de $${addedExpense.amount.toFixed(2)} añadido.` }); // Expense of $... added.
  };

   const handleDeleteExpense = (id: number) => {
        const expenseToDelete = expenses.find(exp => exp.id === id);
        setExpenses(expenses.filter((exp) => exp.id !== id));
         toast({ title: "Eliminado", description: `Gasto por ${expenseToDelete?.description} eliminado.`, variant: "destructive"}); // Expense for ... removed.
    };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Seguimiento de Gastos</h1> {/* Expense Tracking */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nuevo Gasto {/* Add New Expense */}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Gasto</DialogTitle> {/* Add New Expense */}
              <DialogDescription>
                Introduzca los detalles del nuevo registro de gasto. {/* Enter the details for the new expense record. */}
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
                          !newExpense.date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newExpense.date ? format(newExpense.date, 'PPP', { locale: es }) : <span>Elige una fecha</span>} {/* Pick a date */}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newExpense.date}
                        onSelect={(date) => handleDateChange(date, 'date')}
                        initialFocus
                        locale={es} // Set calendar locale to Spanish
                      />
                    </PopoverContent>
                  </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="category" className="text-right">
                  Categoría {/* Category */}
                </Label>
                 <Select onValueChange={(value) => handleSelectChange(value, 'category')} value={newExpense.category}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una categoría" /> {/* Select category */}
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
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
                  value={newExpense.description}
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
                  value={newExpense.amount}
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
              <Button type="submit" onClick={handleAddExpense}>Añadir Gasto</Button> {/* Add Expense */}
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
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(expense.date, 'dd/MM/yyyy')}</TableCell> {/* Format date Spanish style */}
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                         <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {expenses.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aún no se han registrado gastos. ¡Añada algunos! {/* No expenses recorded yet. Add some! */}
                        </TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
        </Card>
    </div>
  );
}
