
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
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

interface InventoryItem {
  id: number;
  name: string;
  price: number; // Cost price or placeholder
  stock: number;
}

// Predefined bread items instead of general inventory
const predefinedBreadItems: Omit<InventoryItem, 'id' | 'stock' | 'price'>[] = [
  { name: 'Pan especial grande' },
  { name: 'Pan especial chico' },
  { name: 'Pan de marraqueta' },
  { name: 'Pan de hamburguesa chico' },
  { name: 'Pan de hamburguesa grande' },
  // Add other non-bread items that need inventory tracking below
  { name: 'Carne de Res' },
  { name: 'Masa de Pizza' },
  { name: 'Salsa de Tomate' },
  { name: 'Queso' },
  { name: 'Lechuga' },
  { name: 'Patatas' },
  { name: 'Jarabe de Refresco' },
  { name: 'Granos de Café' },
];

// Initialize inventory state with predefined items and zero stock/price
const initialInventory: InventoryItem[] = predefinedBreadItems.map((item, index) => ({
  id: index + 1, // Assign unique IDs
  name: item.name,
  price: 0, // Set initial price/cost to 0 or fetch from somewhere
  stock: 0, // Start with 0 stock
}));


export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  // State to hold quantities to add in the dialog, keyed by item name
  const [addQuantities, setAddQuantities] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const {toast} = useToast();

  // Handles input change for the "Add Quantities" dialog
  const handleQuantityChange = (itemName: string, value: string) => {
    setAddQuantities((prev) => ({ ...prev, [itemName]: value }));
  };

  // Handles input change for the "Edit Item" dialog (only stock and price)
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: 'price' | 'stock'
  ) => {
    if (editingItem) {
      setEditingItem((prev) => (prev ? { ...prev, [key]: e.target.value } : null));
    }
  };


  // Function to update stock based on the quantities entered in the dialog
  const handleUpdateStock = () => {
    let updated = false;
    let updateMessages: string[] = [];

    const newInventory = inventory.map(item => {
      const quantityToAddStr = addQuantities[item.name];
      if (quantityToAddStr) {
        const quantityToAdd = parseInt(quantityToAddStr, 10);
        if (!isNaN(quantityToAdd) && quantityToAdd > 0) {
          updated = true;
          updateMessages.push(`${quantityToAdd} x ${item.name}`);
          return { ...item, stock: item.stock + quantityToAdd };
        }
      }
      return item;
    });

    if (updated) {
      setInventory(newInventory);
      toast({ title: "Inventario Actualizado", description: `Cantidades añadidas: ${updateMessages.join(', ')}.` });
    } else {
       toast({ title: "Sin Cambios", description: "No se ingresaron cantidades válidas.", variant: "default" });
    }

    setAddQuantities({}); // Reset quantities state
    setIsAddDialogOpen(false); // Close dialog
  };

  // Handle saving changes from the Edit dialog (only stock and price)
   const handleEditItem = () => {
      if (!editingItem || !editingItem.name || editingItem.price === undefined || editingItem.stock === undefined) {
           toast({ title: "Error", description: "Faltan datos para editar.", variant: "destructive"}) // Missing data to edit.
          return;
      }
     setInventory(
      inventory.map((item) => (item.id === editingItem.id ? {...editingItem, price: parseFloat(String(editingItem.price)), stock: parseInt(String(editingItem.stock), 10)} : item))
    );
    const originalItemName = inventory.find(i => i.id === editingItem.id)?.name; // Get name for toast
    toast({ title: "Éxito", description: `${originalItemName} actualizado.`}); // updated.
    setEditingItem(null); // Reset editing state
    setIsEditDialogOpen(false); // Close dialog
  };


  // Delete is less likely for predefined items, but kept for now.
  const handleDeleteItem = (id: number) => {
     const itemToDelete = inventory.find(item => item.id === id);
     // Consider preventing deletion of predefined items or adding confirmation
    setInventory(inventory.filter((item) => item.id !== id));
    toast({ title: "Eliminado", description: `${itemToDelete?.name} eliminado.`, variant: "destructive"}); // removed.
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem({...item}); // Copy item to avoid direct state mutation during edits
    setIsEditDialogOpen(true);
  };

   // Helper to format currency (maybe cost price)
  const formatCurrency = (amount: number) => {
    // If price is 0, maybe display '-' or 'N/A'
    return amount === 0 ? '-' : `CLP ${amount.toFixed(0)}`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1> {/* Inventory Management */}
        {/* "Add Product" button now opens the "Add Quantities" dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Cantidades {/* Add Quantities */}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md"> {/* Adjusted width */}
            <DialogHeader>
              <DialogTitle>Añadir Cantidades al Inventario</DialogTitle> {/* Changed Title */}
              <DialogDescription>
                Introduzca las cantidades a añadir para cada producto. {/* Enter quantities to add for each product. */}
              </DialogDescription>
            </DialogHeader>
             <ScrollArea className="max-h-[400px] p-1"> {/* Added ScrollArea */}
                <div className="grid gap-4 py-4 px-3">
                  {/* Map through inventory items to show inputs */}
                  {inventory.map((item) => (
                    <div key={item.id} className="grid grid-cols-5 items-center gap-2"> {/* Changed grid columns */}
                      <Label htmlFor={`quantity-${item.id}`} className="text-right col-span-3">
                        {item.name}
                      </Label>
                      <Input
                        id={`quantity-${item.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={addQuantities[item.name] || ''}
                        onChange={(e) => handleQuantityChange(item.name, e.target.value)}
                        className="col-span-2"
                        placeholder="Cantidad" /* Quantity */
                      />
                    </div>
                  ))}
                </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancelar</Button> {/* Cancel */}
              </DialogClose>
              {/* Button now updates stock */}
              <Button type="submit" onClick={handleUpdateStock}>Actualizar Inventario</Button> {/* Update Inventory */}
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
                           {/* Edit Name - Potentially disable editing for predefined items */}
                           {/* <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="edit-name" className="text-right">
                               Nombre
                             </Label>
                             <Input
                               id="edit-name"
                               value={editingItem?.name || ''}
                               onChange={(e) => handleEditInputChange(e, 'name')} // Need separate handler if name is editable
                               className="col-span-3"
                               required
                               disabled // Example: Disable editing name for predefined items
                             />
                           </div> */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-price" className="text-right">
                              Costo/Precio (CLP) {/* Price/Cost (CLP) */}
                            </Label>
                            <Input
                              id="edit-price"
                              type="number"
                              step="1"
                              min="0"
                              value={editingItem?.price ?? ''} // Use ?? to handle potential undefined
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
                               value={editingItem?.stock ?? ''} // Use ?? to handle potential undefined
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

                  {/* Delete Button - Consider disabling/hiding for predefined items */}
                   { !predefinedBreadItems.some(p => p.name === item.name) && ( // Only show delete for non-predefined items
                      <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => handleDeleteItem(item.id)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                </TableCell>
              </TableRow>
            ))}
             {inventory.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No se encontraron productos. Configure el inventario inicial. {/* No products found. Configure initial inventory. */}
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

