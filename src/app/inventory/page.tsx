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

interface InventoryItem {
  id: number;
  name: string;
  price: number;
  stock: number;
}

const initialInventory: InventoryItem[] = [
  {id: 1, name: 'Burger Buns', price: 0.5, stock: 100},
  {id: 2, name: 'Beef Patties', price: 1.5, stock: 80},
  {id: 3, name: 'Pizza Dough', price: 1.0, stock: 50},
  {id: 4, name: 'Tomato Sauce', price: 2.0, stock: 40},
  {id: 5, name: 'Cheese', price: 3.0, stock: 60},
  {id: 6, name: 'Lettuce', price: 0.8, stock: 30},
  {id: 7, name: 'Potatoes', price: 0.2, stock: 200},
  {id: 8, name: 'Soda Syrup', price: 10.0, stock: 10},
  {id: 9, name: 'Coffee Beans', price: 15.0, stock: 20},
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
        toast({ title: "Error", description: "Please fill all fields.", variant: "destructive"})
        return;
    }
    const newId = inventory.length > 0 ? Math.max(...inventory.map((item) => item.id)) + 1 : 1;
    const addedItem: InventoryItem = {
        id: newId,
        name: newItem.name,
        price: parseFloat(newItem.price),
        stock: parseInt(newItem.stock, 10)
    };
    setInventory([...inventory, addedItem]);
    setNewItem({name: '', price: '', stock: ''}); // Reset form
    setIsAddDialogOpen(false); // Close dialog
     toast({ title: "Success", description: `${addedItem.name} added to inventory.`});
  };

  const handleEditItem = () => {
      if (!editingItem || !editingItem.name || !editingItem.price || !editingItem.stock) {
           toast({ title: "Error", description: "Please fill all fields.", variant: "destructive"})
          return;
      }
     setInventory(
      inventory.map((item) => (item.id === editingItem.id ? {...editingItem, price: parseFloat(String(editingItem.price)), stock: parseInt(String(editingItem.stock), 10)} : item))
    );
    setEditingItem(null); // Reset editing state
    setIsEditDialogOpen(false); // Close dialog
     toast({ title: "Success", description: `${editingItem.name} updated.`});
  };

  const handleDeleteItem = (id: number) => {
     const itemToDelete = inventory.find(item => item.id === id);
    setInventory(inventory.filter((item) => item.id !== id));
    toast({ title: "Deleted", description: `${itemToDelete?.name} removed from inventory.`, variant: "destructive"});
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem({...item}); // Copy item to avoid direct state mutation during edits
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Enter the details for the new inventory item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
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
                  Price ($)
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => handleInputChange(e, setNewItem, 'price')}
                  className="col-span-3"
                   required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">
                  Stock
                </Label>
                <Input
                  id="stock"
                  type="number"
                  value={newItem.stock}
                  onChange={(e) => handleInputChange(e, setNewItem, 'stock')}
                  className="col-span-3"
                   required
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleAddItem}>Add Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock Level</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
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
                          <DialogTitle>Edit Inventory Item</DialogTitle>
                          <DialogDescription>
                            Update the details for {editingItem?.name}.
                          </DialogDescription>
                        </DialogHeader>
                         <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                              Name
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
                              Price ($)
                            </Label>
                            <Input
                              id="edit-price"
                              type="number"
                              step="0.01"
                              value={editingItem?.price || ''}
                               onChange={(e) => handleInputChange(e, setEditingItem, 'price')}
                              className="col-span-3"
                               required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-stock" className="text-right">
                              Stock
                            </Label>
                            <Input
                              id="edit-stock"
                              type="number"
                               value={editingItem?.stock || ''}
                               onChange={(e) => handleInputChange(e, setEditingItem, 'stock')}
                              className="col-span-3"
                               required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                           <DialogClose asChild>
                             <Button type="button" variant="secondary">Cancel</Button>
                           </DialogClose>
                           <Button type="submit" onClick={handleEditItem}>Save Changes</Button>
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
                    No inventory items found. Add some!
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
