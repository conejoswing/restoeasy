
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
import { Input } from '@/components/ui/input'; // Keep Input for potential future use or other features
// Removed Dialog imports as they are no longer needed
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogClose,
// } from '@/components/ui/dialog';
// import { Label } from '@/components/ui/label'; // Removed Label import
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
  // Removed state related to adding new products
  // const [newProductData, setNewProductData] = useState<{ name: string; stock: string }>({ name: '', stock: '' });
  // const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1>
        {/* Removed Add Product Button and Dialog */}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-center">Cantidad</TableHead> {/* Changed from 'Existencia' */}
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

