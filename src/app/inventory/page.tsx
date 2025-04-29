
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react'; // Import useEffect
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/context/AuthContext'; // Import useAuth
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
} from '@/components/ui/dialog'; // Import Dialog components
import { Label } from '@/components/ui/label'; // Import Label
import { PlusCircle, MinusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

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


export default function InventoryPage() {
  // Role checks and redirection are now handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [newProductData, setNewProductData] = useState<{ name: string; stock: string }>({ name: '', stock: '' });
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const { toast } = useToast();

  // Loading state is handled by AuthProvider wrapper in layout.tsx
   if (isLoading) {
     return null; // Or a minimal loading indicator if preferred
   }
   // If not authenticated or not admin, AuthProvider will redirect
   if (!isAuthenticated || userRole !== 'admin') {
     return null; // Prevent rendering content before redirect
   }


  const handleIncreaseStock = (id: number) => {
    setInventory(inventory.map(item =>
      item.id === id ? { ...item, stock: item.stock + 1 } : item
    ));
    const itemName = inventory.find(item => item.id === id)?.name;
    toast({ title: "Stock Incrementado", description: `+1 unidad de ${itemName}.` });
  };

  const handleDecreaseStock = (id: number) => {
    let itemName = '';
    setInventory(inventory.map(item => {
      if (item.id === id) {
        itemName = item.name;
        if (item.stock > 0) {
          return { ...item, stock: item.stock - 1 };
        }
      }
      return item;
    }));
    const updatedItem = inventory.find(item => item.id === id);
    if (updatedItem && updatedItem.stock >= 0) {
      const originalItem = inventory.find(item => item.id === id);
      if (originalItem && originalItem.stock > 0) {
        toast({ title: "Stock Reducido", description: `-1 unidad de ${itemName}.`, variant: "destructive" });
      } else {
        toast({ title: "Sin Stock", description: `${itemName} ya no tiene existencias.`, variant: "destructive" });
      }
    }
  };

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

     setInventory(prevInventory => [...prevInventory, newProduct].sort((a, b) => a.name.localeCompare(b.name))); // Sort alphabetically
     setNewProductData({ name: '', stock: '' }); // Reset form
     setIsAddProductDialogOpen(false); // Close dialog
     toast({ title: "Éxito", description: `Producto "${newProduct.name}" añadido con ${newProduct.stock} unidades.` });
   };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1>
         {/* Add Product Button and Dialog */}
        <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Productos
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
              {/* Removed Acciones column */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-center w-24">{item.stock}</TableCell>
                {/* Removed Acciones cell */}
              </TableRow>
            ))}
            {inventory.length === 0 && (
              <TableRow>
                 {/* Adjusted colSpan to 2 */}
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                  No hay productos en el inventario.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
