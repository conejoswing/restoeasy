
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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
// Removed RadioGroup import as it's no longer needed

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
  // 'Carne de Res', // Removed
  // 'Masa de Pizza', // Removed
  // 'Salsa de Tomate', // Removed
  // 'Queso', // Removed
  // 'Lechuga', // Removed
  // 'Patatas', // Removed
  // 'Jarabe de Refresco', // Removed
  // 'Granos de Café', // Removed
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
  // Renamed state for clarity
  const [newProductData, setNewProductData] = useState<{ name: string; stock: string }>({ name: '', stock: '' });
  // Removed states related to predefined mode
  // const [selectedPredefinedItem, setSelectedPredefinedItem] = useState<string | null>(null);
  // const [predefinedItemStock, setPredefinedItemStock] = useState<string>('');
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  // Removed addProductMode state
  // const [addProductMode, setAddProductMode] = useState<'predefined' | 'manual'>('predefined');
  const { toast } = useToast();

  // No need for explicit redirect here, AuthProvider handles it

  // Renamed handler for clarity
  const handleNewProductInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof newProductData
  ) => {
    setNewProductData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Simplified function to only add new products
  const handleAddProduct = () => {
    if (!newProductData.name || !newProductData.stock) {
      toast({ title: "Error", description: "Por favor, complete el nombre y la cantidad del producto.", variant: "destructive" });
      return;
    }
    const stockValue = parseInt(newProductData.stock, 10);
    if (isNaN(stockValue) || stockValue < 0) {
      toast({ title: "Error", description: "La cantidad debe ser un número válido y no negativo.", variant: "destructive" });
      return;
    }
    if (inventory.some(item => item.name.toLowerCase() === newProductData.name.toLowerCase())) {
      toast({ title: "Error", description: "Este producto ya existe en el inventario.", variant: "destructive" });
      return;
    }
    const newId = inventory.length > 0 ? Math.max(...inventory.map(item => item.id)) + 1 : 1;
    const addedProduct: InventoryItem = {
      id: newId,
      name: newProductData.name,
      stock: stockValue,
    };
    setInventory([...inventory, addedProduct].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: "Producto Añadido", description: `${addedProduct.name} añadido al inventario con ${addedProduct.stock} unidades.` });
    setNewProductData({ name: '', stock: '' }); // Reset form
    setIsAddProductDialogOpen(false); // Close dialog
  };


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

  const handleDialogClose = () => {
    setIsAddProductDialogOpen(false);
    // Reset form on close
    setNewProductData({ name: '', stock: '' });
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
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1>
        <Dialog open={isAddProductDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddProductDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              {/* Updated Dialog Title and Description */}
              <DialogTitle>Añadir Nuevo Producto</DialogTitle>
              <DialogDescription>
                Ingrese el nombre y la cantidad inicial del nuevo producto.
              </DialogDescription>
            </DialogHeader>
            {/* Removed RadioGroup and conditional rendering */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="product-name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="product-name"
                  value={newProductData.name}
                  onChange={(e) => handleNewProductInputChange(e, 'name')}
                  className="col-span-3"
                  placeholder="Nombre del producto"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 {/* Updated Label */}
                <Label htmlFor="product-stock" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="product-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={newProductData.stock}
                  onChange={(e) => handleNewProductInputChange(e, 'stock')}
                  className="col-span-3"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancelar</Button>
              </DialogClose>
              {/* Updated submit button text */}
              <Button type="submit" onClick={handleAddProduct}>
                Añadir Producto
              </Button>
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
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-center w-24">{item.stock}</TableCell>
                <TableCell className="text-center w-32">
                  <div className="flex justify-center items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDecreaseStock(item.id)}
                      disabled={item.stock <= 0}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:bg-primary/10"
                      onClick={() => handleIncreaseStock(item.id)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {inventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No hay productos en el inventario. ¡Añada algunos!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

