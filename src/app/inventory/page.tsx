
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
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
import { PlusCircle, Trash2 } from 'lucide-react'; // Added Trash2 icon
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button'; // Import buttonVariants

interface InventoryItem {
  id: number;
  name: string;
  stock: number;
}

// Predefined items for initial inventory state (name only) - Removed specified items
const predefinedItemNames: string[] = [
  'Pan especial grande',
  'Pan especial chico',
  'Pan de marraqueta',
  'Pan de hamburguesa chico',
  'Pan de hamburguesa grande',
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
  // Role checks and redirection are now handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  // Initialize state with empty array, will be populated from localStorage or initialInventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isInventoryInitialized, setIsInventoryInitialized] = useState(false); // Track initialization
  const [newProductData, setNewProductData] = useState<{ name: string; stock: string }>({ name: '', stock: '' });
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load inventory from localStorage on mount
  useEffect(() => {
    if (isInventoryInitialized) return; // Prevent re-running

    console.log("Initializing inventory from localStorage...");
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    let loadedInventory: InventoryItem[] = [];

    if (storedInventory) {
      try {
        const parsed = JSON.parse(storedInventory);
        if (Array.isArray(parsed)) {
          // Basic validation for item structure could be added here
          loadedInventory = parsed;
          console.log("Loaded inventory:", loadedInventory);
        } else {
          console.warn("Invalid inventory data found in localStorage, using initial data.");
          loadedInventory = initialInventory;
        }
      } catch (error) {
        console.error("Failed to parse stored inventory:", error);
        loadedInventory = initialInventory; // Fallback to initial on error
      }
    } else {
      console.log("No inventory found in localStorage, using initial data.");
      loadedInventory = initialInventory; // Use initial if nothing in storage
    }

    // Sort loaded or initial inventory alphabetically by name
    loadedInventory.sort((a, b) => a.name.localeCompare(b.name));
    setInventory(loadedInventory);
    setIsInventoryInitialized(true); // Mark as initialized
    console.log("Inventory initialization complete.");

  }, [isInventoryInitialized]); // Run only once

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    if (!isInventoryInitialized) return; // Only save after initial load

    console.log("Saving inventory to localStorage...");
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
      console.log("Inventory saved.");
    } catch (error) {
      console.error("Failed to save inventory to localStorage:", error);
      toast({ title: "Error", description: "No se pudo guardar el inventario.", variant: "destructive" });
    }
  }, [inventory, isInventoryInitialized]); // Run when inventory or initialization state changes

   // Loading state is handled by AuthProvider wrapper in layout.tsx
   if (isLoading || !isInventoryInitialized) { // Wait for auth and local state init
     return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
   }
   // If not authenticated or not admin, AuthProvider will redirect
   if (!isAuthenticated || userRole !== 'admin') {
     return null; // Prevent rendering content before redirect
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

      // Check if product name already exists (case-insensitive)
     const existingItem = inventory.find(item => item.name.toLowerCase() === newProductData.name.toLowerCase());
     if (existingItem) {
         toast({ title: "Error", description: `El producto "${newProductData.name}" ya existe.`, variant: "destructive" });
         return;
     }


     const newId = inventory.length > 0 ? Math.max(...inventory.map(item => item.id)) + 1 : 1;
     const newProduct: InventoryItem = {
       id: newId,
       name: newProductData.name,
       stock: stockValue,
     };

     // Update state, which will trigger the useEffect to save to localStorage
     setInventory(prevInventory => [...prevInventory, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
     setNewProductData({ name: '', stock: '' }); // Reset form
     setIsAddProductDialogOpen(false); // Close dialog
     toast({ title: "Éxito", description: `Producto "${newProduct.name}" añadido con ${newProduct.stock} unidades.` });
   };

   const handleDeleteProduct = (idToDelete: number) => {
        const productToDelete = inventory.find(item => item.id === idToDelete);
        // Update state, which will trigger the useEffect to save to localStorage
        setInventory(prevInventory => prevInventory.filter(item => item.id !== idToDelete));
        toast({ title: "Eliminado", description: `Producto "${productToDelete?.name}" eliminado.`, variant: "destructive" });
   };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1>
         {/* Add Product Button and Dialog */}
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
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right w-20">Eliminar</TableHead>{/* Added Delete Header */}
            </TableRow>
          </TableHeader>
          {/* Render TableBody only on the client after initialization */}
          {isInventoryInitialized && (
            <TableBody>
                {inventory.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center w-24">{item.stock}</TableCell>
                    <TableCell className="text-right">
                        {/* Delete Button with Confirmation Dialog */}
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
                {inventory.length === 0 && (
                <TableRow>
                    {/* Adjusted colSpan to 3 */}
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    No hay productos en el inventario.
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
