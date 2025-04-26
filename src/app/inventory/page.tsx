
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
import {PlusCircle, MinusCircle} from 'lucide-react'; // Import MinusCircle
import {useToast} from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface InventoryItem {
  id: number;
  name: string;
  stock: number;
}

// Predefined items for initial inventory state (name only)
const predefinedItemNames: string[] = [
  'Pan especial grande',
  'Pan especial chico',
  'Pan de marraqueta',
  'Pan de hamburguesa chico',
  'Pan de hamburguesa grande',
  'Carne de Res',
  'Masa de Pizza',
  'Salsa de Tomate',
  'Queso',
  'Lechuga',
  'Patatas',
  'Jarabe de Refresco',
  'Granos de Café',
];

// Initialize inventory state with predefined items having 0 stock
const initialInventory: InventoryItem[] = predefinedItemNames.map((name, index) => ({
  id: index + 1, // Assign unique IDs
  name: name,
  stock: 0, // Initialize stock to 0
}));


export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  // State for the new product form (manual entry)
  const [newManualProduct, setNewManualProduct] = useState<{ name: string; stock: string }>({ name: '', stock: '' });
  // State for adding stock to predefined items
  const [selectedPredefinedItem, setSelectedPredefinedItem] = useState<string | null>(null);
  const [predefinedItemStock, setPredefinedItemStock] = useState<string>('');
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [addProductMode, setAddProductMode] = useState<'predefined' | 'manual'>('predefined'); // Control dialog mode
  const {toast} = useToast();

  // Handles input change for the "Add New Manual Product" section
   const handleManualProductInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof newManualProduct
  ) => {
    setNewManualProduct((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // Handles stock input change for predefined items
  const handlePredefinedStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPredefinedItemStock(e.target.value);
  }

  // Handles radio button selection for predefined items
  const handlePredefinedItemSelect = (value: string) => {
      setSelectedPredefinedItem(value);
  }

  // Function to add a new product or update stock based on the dialog mode
  const handleAddOrUpdateStock = () => {
     if (addProductMode === 'manual') {
          // Add new manual product logic
          if (!newManualProduct.name || !newManualProduct.stock) {
             toast({ title: "Error", description: "Por favor, complete todos los campos del producto.", variant: "destructive" }); // Please fill all product fields.
             return;
          }
          const stockValue = parseInt(newManualProduct.stock, 10);
          if (isNaN(stockValue) || stockValue < 0) {
              toast({ title: "Error", description: "Las existencias deben ser un número válido y no negativo.", variant: "destructive" }); // Stock must be a valid non-negative number.
              return;
          }
          // Check if product already exists
          if (inventory.some(item => item.name.toLowerCase() === newManualProduct.name.toLowerCase())) {
              toast({ title: "Error", description: "Este producto ya existe en el inventario.", variant: "destructive" }); // Product already exists.
              return;
          }

          const newId = inventory.length > 0 ? Math.max(...inventory.map(item => item.id)) + 1 : 1;
          const addedProduct: InventoryItem = {
              id: newId,
              name: newManualProduct.name,
              stock: stockValue,
          };

          setInventory([...inventory, addedProduct].sort((a, b) => a.name.localeCompare(b.name))); // Sort alphabetically
          toast({ title: "Producto Añadido", description: `${addedProduct.name} añadido al inventario.` }); // Product added to inventory.
          setNewManualProduct({ name: '', stock: '' }); // Reset manual form
          setIsAddProductDialogOpen(false); // Close dialog

     } else {
         // Add stock to predefined item logic
         if (!selectedPredefinedItem || !predefinedItemStock) {
             toast({ title: "Error", description: "Seleccione un producto y especifique la cantidad.", variant: "destructive" }); // Select a product and specify quantity.
             return;
         }
          const stockToAdd = parseInt(predefinedItemStock, 10);
          if (isNaN(stockToAdd) || stockToAdd <= 0) {
             toast({ title: "Error", description: "La cantidad debe ser un número positivo válido.", variant: "destructive" }); // Quantity must be a valid positive number.
             return;
         }

         setInventory(inventory.map(item => {
             if (item.name === selectedPredefinedItem) {
                 return { ...item, stock: item.stock + stockToAdd };
             }
             return item;
         }).sort((a, b) => a.name.localeCompare(b.name))); // Keep sorted alphabetically
         toast({ title: "Stock Actualizado", description: `Se añadieron ${stockToAdd} unidades de ${selectedPredefinedItem}.` }); // Stock updated.
         setSelectedPredefinedItem(null); // Reset selection
         setPredefinedItemStock(''); // Reset stock input
         setIsAddProductDialogOpen(false); // Close dialog
     }
  };

  // Function to increase stock by 1
  const handleIncreaseStock = (id: number) => {
    setInventory(inventory.map(item =>
      item.id === id ? { ...item, stock: item.stock + 1 } : item
    ));
    const itemName = inventory.find(item => item.id === id)?.name;
    toast({ title: "Stock Incrementado", description: `+1 unidad de ${itemName}.` });
  };

  // Function to decrease stock by 1
  const handleDecreaseStock = (id: number) => {
    let itemName = '';
    setInventory(inventory.map(item => {
      if (item.id === id) {
        itemName = item.name;
        // Prevent stock from going below zero
        if (item.stock > 0) {
          return { ...item, stock: item.stock - 1 };
        }
      }
      return item;
    }));

    // Only show toast if stock was actually decreased
     const updatedItem = inventory.find(item => item.id === id);
    if (updatedItem && updatedItem.stock >= 0) { // Check if item exists and stock non-negative (it might be 0 now)
         const originalItem = inventory.find(item => item.id === id); // Find the item again to check original stock
         if (originalItem && originalItem.stock > 0) { // Only toast if original stock was > 0
            toast({ title: "Stock Reducido", description: `-1 unidad de ${itemName}.`, variant: "destructive" });
         } else {
             toast({ title: "Sin Stock", description: `${itemName} ya no tiene existencias.`, variant: "destructive" });
         }
    }

  };


  // Reset dialog state when closing
   const handleDialogClose = () => {
       setIsAddProductDialogOpen(false);
       setAddProductMode('predefined'); // Reset to default mode
       setSelectedPredefinedItem(null);
       setPredefinedItemStock('');
       setNewManualProduct({ name: '', stock: '' });
   };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión del Inventario</h1> {/* Inventory Management */}
        {/* "Add Product" button opens the "Add/Update Stock" dialog */}
        <Dialog open={isAddProductDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddProductDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg"> {/* Adjusted width */}
            <DialogHeader>
              <DialogTitle>Añadir Producto</DialogTitle>
              <DialogDescription>
                 Seleccione un producto predefinido para añadir stock o agregue un nuevo producto manualmente. {/* Select predefined or add manually */}
              </DialogDescription>
            </DialogHeader>
            {/* Radio buttons to switch mode */}
             <RadioGroup defaultValue="predefined" value={addProductMode} onValueChange={(value: 'predefined' | 'manual') => setAddProductMode(value)} className="flex space-x-4 py-2">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="predefined" id="r-predefined" />
                    <Label htmlFor="r-predefined">Usar Producto Predefinido</Label> {/* Use Predefined Product */}
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="manual" id="r-manual" />
                    <Label htmlFor="r-manual">Añadir Producto Manualmente</Label> {/* Add Product Manually */}
                </div>
            </RadioGroup>

            {/* Conditional rendering based on mode */}
            {addProductMode === 'predefined' ? (
                 <div className="grid gap-4 py-4">
                     <Label>Seleccione Producto Predefinido</Label> {/* Select Predefined Product */}
                     <RadioGroup value={selectedPredefinedItem ?? ''} onValueChange={handlePredefinedItemSelect} className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                        {predefinedItemNames.map((name) => (
                            <div key={name} className="flex items-center space-x-2">
                                <RadioGroupItem value={name} id={`radio-${name.replace(/\s+/g, '-')}`} />
                                <Label htmlFor={`radio-${name.replace(/\s+/g, '-')}`}>{name}</Label>
                            </div>
                        ))}
                     </RadioGroup>
                     <div className="grid grid-cols-4 items-center gap-4 mt-4">
                        <Label htmlFor="predefined-stock" className="text-right col-span-1">
                            Cantidad a Añadir {/* Quantity to Add */}
                        </Label>
                        <Input
                            id="predefined-stock"
                            type="number"
                            min="1"
                            step="1"
                            value={predefinedItemStock}
                            onChange={handlePredefinedStockChange}
                            className="col-span-3"
                            placeholder="0"
                            required
                        />
                    </div>
                 </div>
            ) : (
                // Form fields for adding a new manual product
                 <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="manual-product-name" className="text-right">
                        Nombre {/* Name */}
                        </Label>
                        <Input
                        id="manual-product-name"
                        value={newManualProduct.name}
                        onChange={(e) => handleManualProductInputChange(e, 'name')}
                        className="col-span-3"
                        placeholder="Nombre del producto" /* Product name */
                        required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="manual-product-stock" className="text-right">
                        Existencias Iniciales {/* Initial Stock */}
                        </Label>
                        <Input
                        id="manual-product-stock"
                        type="number"
                        min="0"
                        step="1"
                        value={newManualProduct.stock}
                        onChange={(e) => handleManualProductInputChange(e, 'stock')}
                        className="col-span-3"
                        placeholder="0"
                        required
                        />
                    </div>
                 </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancelar</Button> {/* Cancel */}
              </DialogClose>
              {/* Button text changes based on mode */}
              <Button type="submit" onClick={handleAddOrUpdateStock}>
                 {addProductMode === 'predefined' ? 'Añadir Stock' : 'Añadir Producto'} {/* Add Stock / Add Product */}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead> {/* Product */}
              <TableHead className="text-center">Existencias</TableHead> {/* Stock - Centered */}
              <TableHead className="text-center">Acciones</TableHead> {/* Actions - Centered */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-center w-24">{item.stock}</TableCell> {/* Centered and fixed width */}
                <TableCell className="text-center w-32"> {/* Centered and fixed width */}
                  <div className="flex justify-center items-center gap-1">
                    {/* Decrease Stock Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDecreaseStock(item.id)}
                        disabled={item.stock <= 0} // Disable if stock is 0
                    >
                        <MinusCircle className="h-4 w-4" />
                    </Button>

                    {/* Increase Stock Button */}
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
                    {/* Updated colspan */}
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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
