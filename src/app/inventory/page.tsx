'use client';

import * as React from 'react';
import {useState} from 'react';
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
import {PlusCircle, Edit, Trash2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import { Card } from '@/components/ui/card'; // Added Card import

interface InventoryItem {
  id: number;
  name: string;
  price: number;
  stock: number;
}

const initialInventory: InventoryItem[] = [
  {id: 1, name: 'Pan de Hamburguesa', price: 500, stock: 100}, // Burger Buns - Updated price to CLP
  {id: 2, name: 'Carne de Res', price: 1500, stock: 80}, // Beef Patties - Updated price to CLP
  {id: 3, name: 'Masa de Pizza', price: 1000, stock: 50}, // Pizza Dough - Updated price to CLP
  {id: 4, name: 'Salsa de Tomate', price: 2000, stock: 40}, // Tomato Sauce - Updated price to CLP
  {id: 5, name: 'Queso', price: 3000, stock: 60}, // Cheese - Updated price to CLP
  {id: 6, name: 'Lechuga', price: 800, stock: 30}, // Lettuce - Updated price to CLP
  {id: 7, name: 'Patatas', price: 200, stock: 200}, // Potatoes - Updated price to CLP
  {id: 8, name: 'Jarabe de Refresco', price: 10000, stock: 10}, // Soda Syrup - Updated price to CLP
  {id: 9, name: 'Granos de Café', price: 15000, stock: 20}, // Coffee Beans - Updated price to CLP
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [newItem, setNewItem] = useState({name: '', price: '', stock: ''});
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const {toast} = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    stateSetter: React.Dispatch<React.SetStateAction<any>>,
    key: string
  ) => {
    stateSetter((prev: any) => ({...prev, [key]: e.target.value}));
  };

  const handleAddItem = () => {
    if (!newItem.name || !newItem.price || !newItem.stock) {
        toast({ title: "Error", description: "Por favor, rellene todos los campos.", variant: "destructive"}) // Please fill all fields.
        return;
    }
    const newId = inventory.length > 0 ? Math.max(...inventory.map((item) => item.id)) + 1 : 1;
    const addedItem: InventoryItem = {
        id: newId,
        name: newItem.name,
        price: parseFloat(newItem.price), // Keep parsing as float/int initially
        stock: parseInt(newItem.stock, 10)
    };
    setInventory([...inventory, addedItem]);
    setNewItem({name: '', price: '', stock: ''}); // Reset form
    setIsAddDialogOpen(false); // Close dialog
     toast({ title: "Éxito", description: `${addedItem.name} añadido.`}); // added.
  };

  const handleEditItem = () => {
      if (!editingItem || !editingItem.name || !editingItem.price || !editingItem.stock) {
           toast({ title: "Error", description: "Por favor, rellene todos los campos.", variant: "destructive"}) // Please fill all fields.
          return;
      }
     setInventory(
      inventory.map((item) => (item.id === editingItem.id ? {...editingItem, price: parseFloat(String(editingItem.price)), stock: parseInt(String(editingItem.stock), 10)} : item))
    );
    setEditingItem(null); // Reset editing state
    setIsEditDialogOpen(false); // Close dialog
     toast({ title: "Éxito", description: `${editingItem.name} actualizado.`}); // updated.
  };

  const handleDeleteItem = (id: number) => {
     const itemToDelete = inventory.find(item => item.id === id);
    setInventory(inventory.filter((item) => item.id !== id));
    toast({ title: "Eliminado", description: `${itemToDelete?.name} eliminado.`, variant: "destructive"}); // removed.
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem({...item}); // Copy item to avoid direct state mutation during edits
    setIsEditDialogOpen(true);
  };

   // Helper to format currency
  const formatCurrency = (amount: number) => {
    return `CLP ${amount.toFixed(0)}`; // Format as CLP with no decimals
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1> {/* Inventory Management */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto {/* Add Product */}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Añadir Producto</DialogTitle> {/* Add Product */}
              <DialogDescription>
                Introduzca los detalles del nuevo producto. {/* Enter the details for the new product. */}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre {/* Name */}
                </Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => handleInputChange(e, setNewItem, 'name')}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Precio (CLP) {/* Price (CLP) */}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="1" // Step by 1 for CLP
                  min="0" // Minimum price is 0
                  value={newItem.price}
                  onChange={(e) => handleInputChange(e, setNewItem, 'price')}
                  className="col-span-3"
                   required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  Existencias {/* Stock */}
                </Label>
                <Input
                  id="stock"
                  type="number"
                   min="0" // Minimum stock is 0
                   step="1" // Step by 1 for stock
                  value={newItem.stock}
                  onChange={(e) => handleInputChange(e, setNewItem, 'stock')}
                  className="col-span-3"
                   required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancelar</Button> {/* Cancel */}
              </DialogClose>
              <Button type="submit" onClick={handleAddItem}>Añadir Producto</Button> {/* Add Product */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead> {/* Name */}
              <TableHead className="text-right">Precio</TableHead> {/* Price */}
              <TableHead className="text-right">Nivel de Existencias</TableHead> {/* Stock Level */}
              <TableHead className="text-right">Acciones</TableHead> {/* Actions */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell> {/* Format price */}
                <TableCell className="text-right">{item.stock}</TableCell>
                <TableCell className="text-right">
                  <Dialog open={isEditDialogOpen && editingItem?.id === item.id} onOpenChange={(open) => { if (!open) setEditingItem(null); setIsEditDialogOpen(open);}}>
                     <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="mr-2">
                            <Edit className="h-4 w-4" />
                         </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Editar Producto</DialogTitle> {/* Edit Product */}
                          <DialogDescription>
                            Actualice los detalles del producto. {/* Update the details for the product. */}
                          </DialogDescription>
                        </DialogHeader>
                         <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                              Nombre {/* Name */}
                            </Label>
                            <Input
                              id="edit-name"
                              value={editingItem?.name || ''}
                               onChange={(e) => handleInputChange(e, setEditingItem, 'name')}
                              className="col-span-3"
                               required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-price" className="text-right">
                              Precio (CLP) {/* Price (CLP) */}
                            </Label>
                            <Input
                              id="edit-price"
                              type="number"
                              step="1" // Step by 1 for CLP
                              min="0"
                              value={editingItem?.price || ''}
                               onChange={(e) => handleInputChange(e, setEditingItem, 'price')}
                              className="col-span-3"
                               required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-stock" className="text-right">
                              Existencias {/* Stock */}
                            </Label>
                            <Input
                              id="edit-stock"
                              type="number"
                               min="0"
                               step="1"
                               value={editingItem?.stock || ''}
                               onChange={(e) => handleInputChange(e, setEditingItem, 'stock')}
                              className="col-span-3"
                               required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                           <DialogClose asChild>
                             <Button type="button" variant="secondary">Cancelar</Button> {/* Cancel */}
                           </DialogClose>
                           <Button type="submit" onClick={handleEditItem}>Guardar Cambios</Button> {/* Save Changes */}
                        </DialogFooter>
                      </DialogContent>
                   </Dialog>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive/90"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
             {inventory.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No se encontraron productos. ¡Añada algunos! {/* No products found. Add some! */}
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
