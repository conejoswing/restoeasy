
'use client';

import * as React from 'react';
import {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {PlusCircle, MinusCircle, XCircle, CheckCircle, ArrowLeft} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog'; // Import the new dialog
import { isEqual } from 'lodash'; // Import isEqual for comparing arrays

interface MenuItem {
  id: number;
  name: string;
  price: number; // Base price
  category: string;
  modifications?: string[]; // Optional list of modifications
  modificationPrices?: { [key: string]: number }; // Optional map of modification name to additional price
}

// OrderItem now includes an array of selected modifications and the calculated price
interface OrderItem extends Omit<MenuItem, 'price' | 'modificationPrices' | 'modifications'> {
  orderItemId: string; // Unique ID for this specific item instance in the order
  quantity: number;
  selectedModifications?: string[]; // Array of selected modifications
  basePrice: number; // Store the original base price
  finalPrice: number; // Store the calculated price (base + modifications)
}


// Mock data - replace with actual API calls
const mockMenu: MenuItem[] = [
    // --- Completos Vienesas ---
    {
      id: 13,
      name: 'Completo Vienesa Italiana',
      price: 4.00,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'], // Updated: Mostaza -> Agregado Queso, Ketchup removed
      modificationPrices: { 'Agregado Queso': 1.00 } // Add price for cheese
    },
    {
      id: 14,
      name: 'Completo Vienesa Dinámico',
      price: 4.50,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana'],
      modificationPrices: { 'Agregado Queso': 1.00 } // Example: Add price for cheese here too if applicable
    },
     {
      id: 15, // Example new item
      name: 'Completo Vienesa Completo',
      price: 4.20,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Chucrut', 'Tomate', 'Americana', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1.00 } // Add price for cheese
    },
    // --- Completos As ---
    {
      id: 10,
      name: 'Completo As Italiano',
      price: 5.50,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1.20 } // Different price example
    },
    {
      id: 11,
      name: 'Completo As Dinámico',
      price: 6.00,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1.20 }
    },
    {
      id: 12,
      name: 'Completo As Chacarero',
      price: 6.50,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1.20 }
    },
    // --- Fajitas ---
    {
      id: 1,
      name: 'Italiano chico',
      price: 8.99,
      category: 'Fajitas',
      modifications: ['Con Queso', 'Sin Cebolla', 'Extra Carne'], // Simpler modifications
      modificationPrices: { 'Con Queso': 0.50, 'Extra Carne': 1.00 }, // Example prices
    },
    {
      id: 2,
      name: 'Italiano grande',
      price: 12.5,
      category: 'Fajitas',
      modifications: ['Con Queso', 'Sin Cebolla', 'Extra Carne', 'Ají'],
      modificationPrices: { 'Con Queso': 0.80, 'Extra Carne': 1.50 },
    },
     {
      id: 8,
      name: 'Filete',
      price: 18.0,
      category: 'Fajitas',
       // No modifications for this one example
    },
    // --- Café ---
    {
      id: 3,
      name: 'Dinamico chico', // Assuming this was meant for Cafe? Or was it Colaciones? Adjust if needed.
      price: 6.5,
      category: 'Café',
    },
    {
      id: 7,
      name: 'Alitas de Pollo', // Example item, potentially needs translation or replacement
      price: 9.5,
      category: 'Café',
    },
    // --- Colaciones ---
    {
      id: 4,
      name: 'Dinamico grande', // Adjust category if needed
      price: 3.0,
      category: 'Colaciones',
    },
    // --- Promociones ---
    {
      id: 6,
      name: 'Completo grande', // Adjust category/name if needed
      price: 4.5,
      category: 'Promociones',
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña'],
    },
     {
      id: 5,
      name: 'Completo chico', // Adjust category if needed
      price: 2.0,
      category: 'Promociones', // Or maybe Bebidas? Adjust as needed
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña'],
    },
    // --- Bebidas ---
    {
      id: 9,
      name: 'Agua',
      price: 1.0,
      category: 'Bebidas',
    },
     {
      id: 16, // Example
      name: 'Coca-Cola',
      price: 1.50,
      category: 'Bebidas',
    },
  ];

// Define the desired order for categories
const orderedCategories = [
  'Completos Vienesas',
  'Completos As',
  'Fajitas',
  'Café',
  'Colaciones',
  'Promociones',
  'Bebidas',
];


// Helper function to capitalize first letter
const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to compare modification arrays (order insensitive)
const compareModifications = (arr1?: string[], arr2?: string[]): boolean => {
    if (!arr1 && !arr2) return true; // Both undefined/null
    if (!arr1 || !arr2) return false; // One is undefined/null, the other isn't
    if (arr1.length !== arr2.length) return false;
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return isEqual(sortedArr1, sortedArr2); // Use lodash isEqual for deep comparison
};


export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tableIdParam = params.tableId as string;
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(orderedCategories[0]);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [currentItemForModification, setCurrentItemForModification] = useState<MenuItem | null>(null);

  // Simulate fetching existing order (if needed)
  useEffect(() => {
    // Your existing logic for fetching/mocking order
  }, [tableIdParam]);


  // Function to handle clicking a menu item
  const handleItemClick = (item: MenuItem) => {
    if (item.modifications && item.modifications.length > 0) {
      setCurrentItemForModification(item);
      setIsModificationDialogOpen(true);
    } else {
      // If no modifications, add directly to order
      addToOrder(item);
    }
  };

  // Function to handle confirming modification selection (now receives an array)
  const handleModificationConfirm = (modifications: string[] | undefined) => {
    if (currentItemForModification) {
      addToOrder(currentItemForModification, modifications);
      setCurrentItemForModification(null); // Reset after adding
    }
    setIsModificationDialogOpen(false);
  };

  // Updated addToOrder to handle an array of modifications and their prices
  const addToOrder = (item: MenuItem, modifications?: string[]) => {
    // Calculate total modification cost
    const totalModificationCost = modifications?.reduce((acc, mod) => {
      return acc + (item.modificationPrices?.[mod] ?? 0);
    }, 0) ?? 0;
    const finalItemPrice = item.price + totalModificationCost;

    setOrder((prevOrder) => {
       // Check if an identical item *with the exact same set of modifications* already exists
      const existingItemIndex = prevOrder.findIndex(
        (orderItem) => orderItem.id === item.id && compareModifications(orderItem.selectedModifications, modifications)
      );

      if (existingItemIndex > -1) {
        // Increment quantity of the existing item
        const updatedOrder = [...prevOrder];
        updatedOrder[existingItemIndex] = {
          ...updatedOrder[existingItemIndex],
          quantity: updatedOrder[existingItemIndex].quantity + 1,
        };
        return updatedOrder;
      } else {
         // Add as a new item
         // Omit original modifications list from OrderItem
        const { price, modificationPrices, modifications: itemMods, ...itemWithoutPricesAndMods } = item;
        const newOrderItem: OrderItem = {
          ...itemWithoutPricesAndMods, // Spread remaining item props (id, name, category)
          orderItemId: `${item.id}-${Date.now()}-${Math.random()}`, // Generate unique ID
          quantity: 1,
          selectedModifications: modifications, // Store array of selected mods
          basePrice: item.price, // Store original base price
          finalPrice: finalItemPrice, // Store calculated final price
        };
        return [...prevOrder, newOrderItem];
      }
    });

    // Calculate the total for the toast message correctly AFTER the state update logic runs
    const tempOrder = [...order]; // Create a temporary copy
    const existingItemIndex = tempOrder.findIndex(oi => oi.id === item.id && compareModifications(oi.selectedModifications, modifications));
    let newTotal;
    if (existingItemIndex > -1) {
        // If item exists, calculate total as if quantity increased by 1
        newTotal = calculateTotal(tempOrder) + tempOrder[existingItemIndex].finalPrice;
    } else {
        // If new item, calculate total as if this item was added
        newTotal = calculateTotal(tempOrder) + finalItemPrice;
    }

    // Format modifications string for toast
    const modificationsString = modifications && modifications.length > 0
        ? ` (${modifications.join(', ')})`
        : '';

      toast({
        title: `${item.name}${modificationsString} añadido`,
        description: `Total: $${newTotal.toFixed(2)}`, // Use the correctly calculated new total
        variant: "default",
        className: "bg-secondary text-secondary-foreground"
      })
  };

  // Updated removeFromOrder to use orderItemId
  const removeFromOrder = (orderItemId: string) => {
    setOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex((item) => item.orderItemId === orderItemId);
      if (existingItemIndex === -1) return prevOrder; // Item not found

      const updatedOrder = [...prevOrder];
      if (updatedOrder[existingItemIndex].quantity > 1) {
        updatedOrder[existingItemIndex] = {
          ...updatedOrder[existingItemIndex],
          quantity: updatedOrder[existingItemIndex].quantity - 1,
        };
         toast({ title: `Cantidad reducida`, variant: "default" });
        return updatedOrder;
      } else {
        // Remove the item completely if quantity is 1
        const itemToRemove = updatedOrder[existingItemIndex];
        const modsString = itemToRemove.selectedModifications?.join(', ');
        toast({ title: `${itemToRemove.name}${modsString ? ` (${modsString})` : ''} eliminado`, variant: "destructive" });
        return updatedOrder.filter((item) => item.orderItemId !== orderItemId);
      }
    });
  };

  // Updated removeCompletely to use orderItemId
   const removeCompletely = (orderItemId: string) => {
     const itemToRemove = order.find(item => item.orderItemId === orderItemId);
     const modsString = itemToRemove?.selectedModifications?.join(', ');
     setOrder((prevOrder) => prevOrder.filter((orderItem) => orderItem.orderItemId !== orderItemId));
      toast({
        title: `${itemToRemove?.name}${modsString ? ` (${modsString})` : ''} eliminado del pedido`, // Show item name and mods in toast
        variant: "destructive",
      })
   }

  // Calculate total based on finalPrice of each OrderItem
  const calculateTotal = (currentOrder: OrderItem[]) => {
    return currentOrder.reduce(
      (total, item) => total + item.finalPrice * item.quantity,
      0
    );
  };

  const handleFinalizeOrder = () => {
    console.log('Finalizando pedido:', order);
    toast({
      title: "¡Pedido Realizado!",
      description: `Total: $${calculateTotal(order).toFixed(2)} para ${getPageTitle()}`,
      variant: "default",
      className: "bg-green-200 text-green-800 border-green-400" // Using direct colors temporarily for success
    });
     setOrder([]); // Clear order
  };

  // Filter menu items based on the selected category
  const filteredMenu = mockMenu.filter(
    (item) => item.category === selectedCategory
  );


  const total = calculateTotal(order);

  const getPageTitle = () => {
      if (tableIdParam === 'mezon') {
          return 'Mezón';
      } else if (tableIdParam === 'delivery') {
          return 'Delivery';
      } else {
          return `Mesa ${tableIdParam}`;
      }
  }

  const renderMenuItems = () => {
    return (
      <ul className="space-y-2">
        {filteredMenu.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => handleItemClick(item)} // Use handleItemClick
          >
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">${item.price.toFixed(2)}</span>
          </li>
        ))}
        {filteredMenu.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center pt-4">No hay artículos en esta categoría.</p>
        )}
      </ul>
    );
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-theme(spacing.16))] flex flex-col">
       <div className="flex items-center mb-6">
         <Button variant="ghost" size="icon" onClick={() => router.push('/tables')} className="mr-2">
           <ArrowLeft className="h-6 w-6" />
         </Button>
         <h1 className="text-3xl font-bold">{getPageTitle()} - Pedido</h1>
       </div>
      <div className="flex flex-grow gap-4 overflow-hidden">
        {/* Menu Section */}
        <Card className="w-3/5 flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle>Menú</CardTitle>
            <div className="flex space-x-2 pt-2 overflow-x-auto pb-2">
              {orderedCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'secondary'}
                  onClick={() => setSelectedCategory(category)}
                  className="shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {renderMenuItems()}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Order Summary Section */}
        <Card className="w-2/5 flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle>Pedido Actual</CardTitle>
            <CardDescription>Artículos añadidos.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {order.length === 0 ? (
                <p className="text-muted-foreground text-center">Aún no se han añadido artículos.</p>
              ) : (
                <ul className="space-y-3">
                  {order.map((item) => (
                    <li key={item.orderItemId} className="flex items-center justify-between"> {/* Use unique orderItemId */}
                     <div className='flex items-center gap-2'>
                        <div>
                          <span className="font-medium text-sm">{item.name}</span>
                          {/* Display selected modifications */}
                           {item.selectedModifications && item.selectedModifications.length > 0 && (
                             <p className="text-xs text-muted-foreground">({item.selectedModifications.join(', ')})</p>
                           )}
                           {/* Show the final calculated price per item */}
                          <p className='text-xs text-muted-foreground'>${item.finalPrice.toFixed(2)}</p>
                        </div>
                     </div>

                      <div className="flex items-center gap-2">
                         {/* Use orderItemId for actions */}
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromOrder(item.orderItemId)}>
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                         {/* Add to order requires the base item info and modifications */}
                         <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => {
                            // Find the original MenuItem to pass to addToOrder
                             const originalItem = mockMenu.find(menuItem => menuItem.id === item.id);
                             if (originalItem) {
                                 addToOrder(originalItem, item.selectedModifications); // Pass the array of mods
                             }
                         }}>
                           <PlusCircle className="h-4 w-4" />
                         </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70" onClick={() => removeCompletely(item.orderItemId)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
          <Separator />
          <CardFooter className="p-4 flex flex-col items-stretch gap-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button size="lg" onClick={handleFinalizeOrder} disabled={order.length === 0}>
              <CheckCircle className="mr-2 h-5 w-5" /> Finalizar Pedido
            </Button>
          </CardFooter>
        </Card>
      </div>

       {/* Modification Dialog */}
        {currentItemForModification && (
        <ModificationDialog
          isOpen={isModificationDialogOpen}
          onOpenChange={setIsModificationDialogOpen}
          item={currentItemForModification}
          onConfirm={handleModificationConfirm} // Expects array of modifications
          onCancel={() => setCurrentItemForModification(null)} // Reset item on cancel
        />
      )}
    </div>
  );
}
