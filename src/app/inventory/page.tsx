
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
import { PlusCircle, Trash2, MinusCircle } from 'lucide-react'; // Added MinusCircle
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export interface InventoryItem { // Export interface
  id: number;
  name: string;
  stock: number;
}

// Predefined items for initial inventory state (name only)
const predefinedItemNames: string[] = [
  'Pan especial grande',
  'Pan especial normal', // Changed from 'Pan especial chico'
  'Pan de marraqueta',
  'Pan de hamburguesa normal', // Changed from 'Pan de hamburguesa chico'
  'Pan de hamburguesa grande',
  'Bebida 1.5Lt', // Added from menu
  'Lata', // Added from menu
  'Cafe Chico', // Added from menu
  'Cafe Grande', // Added from menu
  'Vienesas', // Added for deduction
  'Fajita', // Added for Promo Fajitas deduction
];

// Initialize inventory state with predefined items having 0 stock
const initialInventory: InventoryItem[] = predefinedItemNames.map((name, index) => ({
  id: index + 1,
  name: name,
  stock: 0,
}));

// Storage key for localStorage
const INVENTORY_STORAGE_KEY = 'restaurantInventory';


export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isInventoryInitialized, setIsInventoryInitialized] = useState(false);
  const [newProductData, setNewProductData] = useState<{ name: string; stock: string }>({ name: '', stock: '' });
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load inventory from localStorage on mount
  useEffect(() => {
    if (isInventoryInitialized) return;

    console.log("Initializing inventory from localStorage...");
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    let loadedInventory: InventoryItem[] = [];

    if (storedInventory) {
      try {
        const parsed = JSON.parse(storedInventory);
        if (Array.isArray(parsed)) {
          loadedInventory = parsed;
           // Add any predefined items that are missing from storage
           const storedNames = new Set(loadedInventory.map(item => item.name.toLowerCase()));
           predefinedItemNames.forEach((name) => { // Removed index from forEach as it's not needed
               if (!storedNames.has(name.toLowerCase())) {
                    // Ensure unique ID generation even if initialInventory wasn't used
                    const maxId = loadedInventory.reduce((max, item) => Math.max(max, typeof item.id === 'number' ? item.id : 0), 0);
                    const newId = maxId + 1;
                   loadedInventory.push({ id: newId, name: name, stock: 0 });
                   console.log(`Added missing predefined item: ${name}`);
               }
           });
          console.log("Loaded and merged inventory:", loadedInventory);
        } else {
          console.warn("Invalid inventory data found in localStorage, using initial data.");
          loadedInventory = [...initialInventory]; // Use a copy of initialInventory
        }
      } catch (error) {
        console.error("Failed to parse stored inventory:", error);
        loadedInventory = [...initialInventory]; // Use a copy of initialInventory
      }
    } else {
      console.log("No inventory found in localStorage, using initial data.");
      loadedInventory = [...initialInventory]; // Use a copy of initialInventory
    }

    // Ensure all IDs are numbers and unique (important for robustness)
    const finalInventory = loadedInventory.map((item, index) => ({
      ...item,
      id: typeof item.id === 'number' && item.id > 0 ? item.id : Date.now() + index // Ensure valid, unique IDs
    }));

    // Sort the final processed inventory
    finalInventory.sort((a, b) => a.name.localeCompare(b.name));
    setInventory(finalInventory);
    setIsInventoryInitialized(true);
    console.log("Inventory initialization complete.");

  }, [isInventoryInitialized]); // isInventoryInitialized ensures this runs only once

  // Save inventory to localStorage whenever it changes AFTER initialization
  useEffect(() => {
    // Only save after the initial load is complete
    if (!isInventoryInitialized) return;

    console.log("Saving inventory to localStorage...");
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
      console.log("Inventory saved:", inventory);
    } catch (error) {
      console.error("Failed to save inventory to localStorage:", error);
      toast({ title: "Error", description: "No se pudo guardar el inventario.", variant: "destructive" });
    }
  // Depend only on 'inventory' and 'isInventoryInitialized' for saving
  }, [inventory, isInventoryInitialized, toast]);

   // Loading state while inventory is being initialized from localStorage
   if (!isInventoryInitialized) {
     return <div className="flex items-center justify-center min-h-screen">Cargando Inventario...</div>;
   }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof newProductData) => {
    setNewProductData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleAddProduct = () => {
     if (!newProductData.name || !newProductData.stock) {
       toast({ title: "Error", description: "Por favor, complete nombre y cantidad.", variant: "destructive" });
       return;
     }

     const stockValue = parseInt(newProductData.stock, 10);
     if (isNaN(stockValue) || stockValue < 0) {
       toast({ title: "Error", description: "La cantidad debe ser un número válido y no negativo.", variant: "destructive" });
       return;
     }

     // Check if item name already exists (case-insensitive)
     const existingItem = inventory.find(item => item.name.trim().toLowerCase() === newProductData.name.trim().toLowerCase());
     if (existingItem) {
         toast({ title: "Error", description: `El producto "${newProductData.name.trim()}" ya existe.`, variant: "destructive" });
         return;
     }

     // Ensure unique ID generation
     const maxId = inventory.reduce((max, item) => Math.max(max, typeof item.id === 'number' ? item.id : 0), 0);
     const newId = maxId + 1;

     const newProduct: InventoryItem = {
       id: newId,
       name: newProductData.name.trim(), // Trim whitespace
       stock: stockValue,
     };

     // Update state, which triggers the save useEffect
     setInventory(prevInventory => [...prevInventory, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
     setNewProductData({ name: '', stock: '' }); // Clear form
     setIsAddProductDialogOpen(false); // Close dialog
     toast({ title: "Éxito", description: `Producto "${newProduct.name}" añadido con ${newProduct.stock} unidades.` });
   };

   const handleDeleteProduct = (idToDelete: number) => {
        const productToDelete = inventory.find(item => item.id === idToDelete);
        if (productToDelete) {
             // Update state, which triggers the save useEffect
            setInventory(prevInventory => prevInventory.filter(item => item.id !== idToDelete));
            toast({ title: "Eliminado", description: `Producto "${productToDelete.name}" eliminado.`, variant: "destructive" });
        } else {
            toast({ title: "Error", description: `No se encontró el producto para eliminar.`, variant: "destructive" });
        }
   };

   const handleAdjustStock = (id: number, amount: number) => {
        // Update state, which triggers the save useEffect
        setInventory(prevInventory =>
            prevInventory.map(item =>
                item.id === id
                    ? { ...item, stock: Math.max(0, item.stock + amount) } // Ensure stock doesn't go below 0
                    : item
            ).sort((a, b) => a.name.localeCompare(b.name)) // Keep sorted after adjustment
        );
        // Removed toast message for stock adjustment
   };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1>
        {/* Dialog for adding new products */}
        <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Producto</DialogTitle>
                    <DialogDescription>
                        Ingrese el nombre y la cantidad inicial del nuevo producto.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product-name" className="text-right">
                            Nombre
                        </Label>
                        <Input
                            id="product-name"
                            value={newProductData.name}
                            onChange={(e) => handleInputChange(e, 'name')}
                            className="col-span-3"
                            required
                            placeholder="Nombre del producto"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product-stock" className="text-right">
                            Cantidad
                        </Label>
                        <Input
                            id="product-stock"
                            type="number"
                            value={newProductData.stock}
                            onChange={(e) => handleInputChange(e, 'stock')}
                            className="col-span-3"
                            required
                            min="0"
                            step="1" // Allow only whole numbers for stock
                            placeholder="0"
                        />
                    </div>
                </div>
                <DialogFooter>
                     <DialogClose asChild>
                       <Button type="button" variant="secondary">Cancelar</Button>
                     </DialogClose>
                    <Button type="button" onClick={handleAddProduct}>Añadir Producto</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
             {/* Adjusted table headers */}
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-center w-48">Cantidad / Ajustar</TableHead>
              <TableHead className="text-right w-20">Eliminar</TableHead>
            </TableRow>
          </TableHeader>
          {/* Render TableBody only after initialization */}
          {isInventoryInitialized && (
            <TableBody>
                {inventory.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    {/* Cell for Quantity and Adjustment Buttons */}
                    <TableCell className="text-center w-48">
                       <div className="flex items-center justify-center gap-2">
                            {/* Decrease Button */}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleAdjustStock(item.id, -1)} disabled={item.stock <= 0}>
                                <MinusCircle className="h-4 w-4" />
                                <span className="sr-only">Disminuir</span>
                            </Button>
                            {/* Quantity Display */}
                            <span className="font-medium w-10 text-center">{item.stock}</span>
                            {/* Increase Button */}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => handleAdjustStock(item.id, 1)}>
                                <PlusCircle className="h-4 w-4" />
                                <span className="sr-only">Aumentar</span>
                            </Button>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                         {/* Delete Confirmation Dialog */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/90" title="Eliminar Producto">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                            </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{item.name}" del inventario.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDeleteProduct(item.id)}
                                        className={cn(buttonVariants({ variant: "destructive" }))}
                                    >
                                        Eliminar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                </TableRow>
                ))}
                {/* Display message if inventory is empty */}
                {inventory.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No hay productos en el inventario. Añada algunos usando el botón "+ Añadir Producto".
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

