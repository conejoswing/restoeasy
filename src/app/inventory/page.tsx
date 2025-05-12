
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
import { PlusCircle, Trash2, MinusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export interface InventoryItem {
  id: number;
  name: string;
  stock: number;
}

const predefinedItemNames: string[] = [
  'Pan especial grande',
  'Pan especial normal',
  'Pan de marraqueta',
  'Pan de hamburguesa normal',
  'Pan de hamburguesa grande',
  'Bebida 1.5Lt',
  'Lata',
  'Cafe Chico',
  'Cafe Grande',
  'Vienesas',
  'Fajita',
  'Empanada', // Added Empanada for Box Cami
];

const initialInventory: InventoryItem[] = predefinedItemNames.map((name, index) => ({
  id: index + 1, // Initial IDs, will be re-evaluated if loading from storage
  name: name,
  stock: 0,
}));

const INVENTORY_STORAGE_KEY = 'restaurantInventory';


export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isInventoryInitialized, setIsInventoryInitialized] = useState(false);
  const [newProductData, setNewProductData] = useState<{ name: string; stock: string }>({ name: '', stock: '' });
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isInventoryInitialized) return;

    console.log("Initializing inventory from localStorage...");
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    let loadedInventory: InventoryItem[] = [];

    if (storedInventory) {
      try {
        const parsed = JSON.parse(storedInventory);
        if (Array.isArray(parsed)) {
          loadedInventory = parsed.filter(
            (item: any): item is Partial<InventoryItem> =>
              item &&
              typeof item === 'object' &&
              typeof item.name === 'string' &&
              typeof item.stock === 'number'
          ).map((itemValidated: Partial<InventoryItem>) => ({
            id: typeof itemValidated.id === 'number' ? itemValidated.id : 0,
            name: itemValidated.name!,
            stock: itemValidated.stock!,
          }));

           const storedNames = new Set(loadedInventory.map(item => item.name.toLowerCase()));
           predefinedItemNames.forEach((name) => {
               if (!storedNames.has(name.toLowerCase())) {
                    const maxId = loadedInventory.reduce((max, item) => Math.max(max, item.id || 0), 0);
                    const newId = maxId + 1;
                   loadedInventory.push({ id: newId, name: name, stock: 0 });
                   console.log(`Added missing predefined item: ${name}`);
               }
           });
          console.log("Loaded and merged inventory:", loadedInventory);
        } else {
          console.warn("Invalid inventory data found in localStorage, using initial data.");
          loadedInventory = [...initialInventory];
        }
      } catch (error) {
        console.error("Failed to parse stored inventory:", error);
        loadedInventory = [...initialInventory];
      }
    } else {
      console.log("No inventory found in localStorage, using initial data.");
      loadedInventory = [...initialInventory];
    }

    const finalInventory = loadedInventory.map((item, index) => ({
      ...item,
      id: typeof item.id === 'number' && item.id > 0 ? item.id : Date.now() + index + 1
    }));

    finalInventory.sort((a, b) => a.name.localeCompare(b.name));
    setInventory(finalInventory);
    setIsInventoryInitialized(true);
    console.log("Inventory initialization complete.");

  }, [isInventoryInitialized]);

  useEffect(() => {
    if (!isInventoryInitialized) return;

    console.log("Saving inventory to localStorage...");
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
      console.log("Inventory saved:", inventory);
    } catch (error) {
      console.error("Failed to save inventory to localStorage:", error);
      toast({ title: "Error", description: "No se pudo guardar el inventario.", variant: "destructive" });
    }
  }, [inventory, isInventoryInitialized, toast]);

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
     if (isNaN(stockValue)) { // Allow negative initial stock if needed, though typically starts at 0 or positive
       toast({ title: "Error", description: "La cantidad debe ser un número válido.", variant: "destructive" });
       return;
     }

     const existingItem = inventory.find(item => item.name.trim().toLowerCase() === newProductData.name.trim().toLowerCase());
     if (existingItem) {
         toast({ title: "Error", description: `El producto "${newProductData.name.trim()}" ya existe.`, variant: "destructive" });
         return;
     }

     const maxId = inventory.reduce((max, item) => Math.max(max, item.id || 0), 0);
     const newId = maxId + 1;

     const newProduct: InventoryItem = {
       id: newId,
       name: newProductData.name.trim(),
       stock: stockValue,
     };

     setInventory(prevInventory => [...prevInventory, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
     setNewProductData({ name: '', stock: '' });
     setIsAddProductDialogOpen(false);
     toast({ title: "Éxito", description: `Producto "${newProduct.name}" añadido con ${newProduct.stock} unidades.` });
   };

   const handleDeleteProduct = (idToDelete: number) => {
        const productToDelete = inventory.find(item => item.id === idToDelete);
        if (productToDelete) {
            setInventory(prevInventory => prevInventory.filter(item => item.id !== idToDelete));
            toast({ title: "Eliminado", description: `Producto "${productToDelete.name}" eliminado.`, variant: "destructive" });
        } else {
            toast({ title: "Error", description: `No se encontró el producto para eliminar.`, variant: "destructive" });
        }
   };

   const handleAdjustStock = (id: number, amount: number) => {
        setInventory(prevInventory =>
            prevInventory.map(item =>
                item.id === id
                    ? { ...item, stock: item.stock + amount } // Removed Math.max(0, ...)
                    : item
            ).sort((a, b) => a.name.localeCompare(b.name))
        );
   };


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1>
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
                            step="1"
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
              <TableHead className="text-center w-48">Cantidad / Ajustar</TableHead>
              <TableHead className="text-right w-20">Eliminar</TableHead>
            </TableRow>
          </TableHeader>
          {isInventoryInitialized && (
            <TableBody>
                {inventory.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center w-48">
                       <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleAdjustStock(item.id, -1)} >
                                <MinusCircle className="h-4 w-4" />
                                <span className="sr-only">Disminuir</span>
                            </Button>
                            <span className={cn("font-medium w-10 text-center", item.stock < 0 ? "text-destructive" : "")}>{item.stock}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => handleAdjustStock(item.id, 1)}>
                                <PlusCircle className="h-4 w-4" />
                                <span className="sr-only">Aumentar</span>
                            </Button>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
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
