
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
import { Card } from '@/components/ui/card';
// Removed ScrollArea as it's no longer needed in the simplified Add Product dialog

interface InventoryItem {
  id: number;
  name: string;
  price: number; // Cost price or selling price
  stock: number;
}

// Predefined items for initial inventory state
const predefinedItems: Omit<InventoryItem, 'id'>[] = [
  { name: 'Pan especial grande', price: 0, stock: 0 },
  { name: 'Pan especial chico', price: 0, stock: 0 },
  { name: 'Pan de marraqueta', price: 0, stock: 0 },
  { name: 'Pan de hamburguesa chico', price: 0, stock: 0 },
  { name: 'Pan de hamburguesa grande', price: 0, stock: 0 },
  { name: 'Carne de Res', price: 0, stock: 0 },
  { name: 'Masa de Pizza', price: 0, stock: 0 },
  { name: 'Salsa de Tomate', price: 0, stock: 0 },
  { name: 'Queso', price: 0, stock: 0 },
  { name: 'Lechuga', price: 0, stock: 0 },
  { name: 'Patatas', price: 0, stock: 0 },
  { name: 'Jarabe de Refresco', price: 0, stock: 0 },
  { name: 'Granos de Café', price: 0, stock: 0 },
];

// Initialize inventory state with predefined items
const initialInventory: InventoryItem[] = predefinedItems.map((item, index) => ({
  id: index + 1, // Assign unique IDs
  ...item,
}));


export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  // State for the new product form
  const [newProduct, setNewProduct] = useState<{ name: string; price: string; stock: string }>({ name: '', price: '', stock: '' });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false); // Renamed state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const {toast} = useToast();

  // Handles input change for the "Add New Product" dialog
   const handleNewProductInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof newProduct
  ) => {
    setNewProduct((prev) => ({ ...prev, [key]: e.target.value }));
  };


  // Handles input change for the "Edit Item" dialog (only stock and price)
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: 'price' | 'stock' // Only allow editing price and stock here
  ) => {
    if (editingItem) {
        // Directly update the number fields, handling potential empty input for typing
        const value = e.target.value;
         setEditingItem((prev) => (prev ? { ...prev, [key]: value === '' ? '' : Number(value) } : null));
    }
  };


  // Function to add a new product entered in the dialog
  const handleAddNewProduct = () => {
     if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      toast({ title: "Error", description: "Por favor, complete todos los campos del producto.", variant: "destructive" }); // Please fill all product fields.
      return;
    }

     const priceValue = parseFloat(newProduct.price);
     const stockValue = parseInt(newProduct.stock, 10);

     if (isNaN(priceValue) || isNaN(stockValue) || priceValue < 0 || stockValue < 0) {
        toast({ title: "Error", description: "El precio y las existencias deben ser números válidos y no negativos.", variant: "destructive" }); // Price and stock must be valid non-negative numbers.
        return;
     }

    const newId = inventory.length > 0 ? Math.max(...inventory.map(item => item.id)) + 1 : 1;
    const addedProduct: InventoryItem = {
      id: newId,
      name: newProduct.name,
      price: priceValue,
      stock: stockValue,
    };

    setInventory([...inventory, addedProduct]);
    toast({ title: "Producto Añadido", description: `${addedProduct.name} añadido al inventario.` }); // Product added to inventory.
    setNewProduct({ name: '', price: '', stock: '' }); // Reset form
    setIsAddProductDialogOpen(false); // Close dialog
  };


  // Handle saving changes from the Edit dialog (only stock and price)
   const handleEditItem = () => {
      if (!editingItem || !editingItem.name || editingItem.price === undefined || editingItem.stock === undefined || String(editingItem.price) === '' || String(editingItem.stock) === '') {
           toast({ title: "Error", description: "Faltan datos para editar o son inválidos.", variant: "destructive"}) // Missing or invalid data to edit.
          return;
      }

      const priceValue = parseFloat(String(editingItem.price));
      const stockValue = parseInt(String(editingItem.stock), 10);

       if (isNaN(priceValue) || isNaN(stockValue) || priceValue < 0 || stockValue < 0) {
        toast({ title: "Error", description: "El precio y las existencias deben ser números válidos y no negativos.", variant: "destructive" }); // Price and stock must be valid non-negative numbers.
        return;
     }


     setInventory(
      inventory.map((item) => (item.id === editingItem.id ? {...editingItem, price: priceValue, stock: stockValue } : item))
    );
    const originalItemName = inventory.find(i => i.id === editingItem.id)?.name; // Get name for toast
    toast({ title: "Éxito", description: `${originalItemName} actualizado.`}); // updated.
    setEditingItem(null); // Reset editing state
    setIsEditDialogOpen(false); // Close dialog
  };


  // Delete item function - Allows deleting any item now
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
    // If price is 0, maybe display '-' or 'N/A'
    return amount === 0 ? '-' : `CLP ${amount.toFixed(0)}`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1> {/* Inventory Management */}
        {/* "Add Product" button opens the "Add New Product" dialog */}
        <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto {/* Add Product */}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]"> {/* Adjusted width */}
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Producto</DialogTitle> {/* Changed Title */}
              <DialogDescription>
                Introduzca los detalles del nuevo producto a inventariar. {/* Enter details for the new product. */}
              </DialogDescription>
            </DialogHeader>
            {/* Form fields for adding a new product */}
             <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-product-name" className="text-right">
                    Nombre {/* Name */}
                    </Label>
                    <Input
                    id="new-product-name"
                    value={newProduct.name}
                    onChange={(e) => handleNewProductInputChange(e, 'name')}
                    className="col-span-3"
                    placeholder="Nombre del producto" /* Product name */
                    required
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-product-price" className="text-right">
                    Costo/Precio (CLP) {/* Price/Cost (CLP) */}
                    </Label>
                    <Input
                    id="new-product-price"
                    type="number"
                    step="1"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => handleNewProductInputChange(e, 'price')}
                    className="col-span-3"
                     placeholder="0"
                    required
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-product-stock" className="text-right">
                    Existencias Iniciales {/* Initial Stock */}
                    </Label>
                    <Input
                    id="new-product-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={newProduct.stock}
                    onChange={(e) => handleNewProductInputChange(e, 'stock')}
                    className="col-span-3"
                    placeholder="0"
                    required
                    />
                </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancelar</Button> {/* Cancel */}
              </DialogClose>
              {/* Button now adds the new product */}
              <Button type="submit" onClick={handleAddNewProduct}>Añadir Producto</Button> {/* Add Product */}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead> {/* Product */}
              <TableHead className="text-right">Costo/Precio (CLP)</TableHead> {/* Price/Cost (CLP) */}
              <TableHead className="text-right">Existencias</TableHead> {/* Stock */}
              <TableHead className="text-right">Acciones</TableHead> {/* Actions */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.price)}</TableCell> {/* Format price/cost */}
                <TableCell className="text-right">{item.stock}</TableCell>
                <TableCell className="text-right">
                  {/* Edit Dialog Trigger */}
                  <Dialog open={isEditDialogOpen && editingItem?.id === item.id} onOpenChange={(open) => { if (!open) setEditingItem(null); setIsEditDialogOpen(open);}}>
                     <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="mr-2">
                            <Edit className="h-4 w-4" />
                         </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Editar {editingItem?.name}</DialogTitle> {/* Edit Product Name */}
                          <DialogDescription>
                             Actualice el precio/costo y las existencias del producto. {/* Update price/cost and stock. */}
                          </DialogDescription>
                        </DialogHeader>
                         <div className="grid gap-4 py-4">
                           {/* Name editing is disabled */}
                           <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="edit-name" className="text-right">
                               Nombre {/* Name */}
                             </Label>
                             <Input
                               id="edit-name"
                               value={editingItem?.name || ''}
                               className="col-span-3"
                               disabled // Disable editing name
                             />
                           </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-price" className="text-right">
                              Costo/Precio (CLP) {/* Price/Cost (CLP) */}
                            </Label>
                            <Input
                              id="edit-price"
                              type="number"
                              step="1"
                              min="0"
                              value={editingItem?.price ?? ''} // Use ?? to handle potential undefined or null
                              onChange={(e) => handleEditInputChange(e, 'price')}
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
                               value={editingItem?.stock ?? ''} // Use ?? to handle potential undefined or null
                               onChange={(e) => handleEditInputChange(e, 'stock')}
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

                  {/* Delete Button - Enabled for all items now */}
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
                    No hay productos en el inventario. ¡Añada algunos! {/* No products in inventory. Add some! */}
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

