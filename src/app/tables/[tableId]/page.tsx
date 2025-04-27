
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'; // Import Sheet components
import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard } from 'lucide-react'; // Added Utensils
import {useToast} from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog'; // Import the new dialog
import { isEqual } from 'lodash'; // Import isEqual for comparing arrays
import { cn } from '@/lib/utils'; // Import cn

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
  selectedModifications?: string[]; // Array of selected mods
  basePrice: number; // Store the original base price
  finalPrice: number; // Store the calculated price (base + modifications)
}


// Mock data - replace with actual API calls - Updated prices to CLP
const mockMenu: MenuItem[] = [
    // --- Completos Vienesas ---
    {
      id: 13,
      name: 'Completo Vienesa Italiana',
      price: 4000,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 } // Add price for cheese
    },
    {
      id: 14,
      name: 'Completo Vienesa Dinámico',
      price: 4500,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 } // Example: Add price for cheese here too if applicable
    },
     {
      id: 15, // Example new item
      name: 'Completo Vienesa Completo',
      price: 4200,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Chucrut', 'Tomate', 'Americana', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 } // Add price for cheese
    },
    // --- Completos As ---
    {
      id: 10,
      name: 'Completo As Italiano',
      price: 5500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1200 } // Different price example
    },
    {
      id: 11,
      name: 'Completo As Dinámico',
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1200 }
    },
    {
      id: 12,
      name: 'Completo As Chacarero',
      price: 6500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1200 }
    },
    // --- Fajitas ---
    {
      id: 1,
      name: 'Italiano chico',
      price: 8990,
      category: 'Fajitas',
      modifications: ['Con Queso', 'Sin Cebolla', 'Extra Carne', 'Ají Verde', 'Agregado Queso'], // Simpler modifications + Ají Verde + Agregado Queso
      modificationPrices: { 'Con Queso': 500, 'Extra Carne': 1000, 'Agregado Queso': 1000 }, // Example prices + Cheese
    },
    {
      id: 2,
      name: 'Italiano grande',
      price: 12500,
      category: 'Fajitas',
      modifications: ['Con Queso', 'Sin Cebolla', 'Extra Carne', 'Ají', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Con Queso': 800, 'Extra Carne': 1500, 'Agregado Queso': 1000 }, // + Cheese
    },
     {
      id: 8,
      name: 'Filete',
      price: 18000,
      category: 'Fajitas',
      modifications: ['Ají Verde', 'Agregado Queso'], // Added modifications
      modificationPrices: { 'Agregado Queso': 1000 }, // Added cheese price
    },
    // --- Café ---
    {
      id: 3,
      name: 'Dinamico chico', // Assuming this was meant for Cafe? Or was it Colaciones? Adjust if needed.
      price: 6500,
      category: 'Café',
    },
    {
      id: 7,
      name: 'Alitas de Pollo', // Example item, potentially needs translation or replacement
      price: 9500,
      category: 'Café',
    },
    // --- Colaciones ---
    {
      id: 4,
      name: 'Dinamico grande', // Adjust category if needed
      price: 3000,
      category: 'Colaciones',
    },
    // --- Promociones ---
    {
      id: 6,
      name: 'Completo grande', // Adjust category/name if needed
      price: 4500,
      category: 'Promociones',
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Agregado Queso': 1000 }, // + Cheese
    },
     {
      id: 5,
      name: 'Completo chico', // Adjust category if needed
      price: 2000,
      category: 'Promociones', // Or maybe Bebidas? Adjust as needed
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Agregado Queso': 1000 }, // + Cheese
    },
    // --- Bebidas ---
    {
      id: 9,
      name: 'Agua',
      price: 1000,
      category: 'Bebidas',
    },
     {
      id: 16, // Example
      name: 'Coca-Cola',
      price: 1500,
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
  const [order, setOrder] = useState<OrderItem[]>([]); // Current items being added
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<OrderItem[]>([]); // Items sent to print
  const [selectedCategory, setSelectedCategory] = useState<string>(orderedCategories[0]);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [currentItemForModification, setCurrentItemForModification] = useState<MenuItem | null>(null);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false); // State for Menu Sheet

  // Load orders from sessionStorage on mount
  useEffect(() => {
    const storedCurrentOrder = sessionStorage.getItem(`table-${tableIdParam}-order`);
    const storedPendingOrder = sessionStorage.getItem(`table-${tableIdParam}-pending-order`);

    let parsedCurrentOrder: OrderItem[] = [];
    let parsedPendingOrder: OrderItem[] = [];

    if (storedCurrentOrder) {
      try {
        const parsed = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsed)) parsedCurrentOrder = parsed;
      } catch (error) {
        console.error("Failed to parse stored current order:", error);
        sessionStorage.removeItem(`table-${tableIdParam}-order`); // Clear invalid data
      }
    }

    if (storedPendingOrder) {
       try {
         const parsed = JSON.parse(storedPendingOrder);
         if (Array.isArray(parsed)) parsedPendingOrder = parsed;
       } catch (error) {
         console.error("Failed to parse stored pending order:", error);
         sessionStorage.removeItem(`table-${tableIdParam}-pending-order`); // Clear invalid data
       }
     }

     setOrder(parsedCurrentOrder);
     setPendingPaymentOrder(parsedPendingOrder);


    // Load table status from sessionStorage and determine initial status
    const storedStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);
    const hasCurrentItems = parsedCurrentOrder.length > 0;
    const hasPendingItems = parsedPendingOrder.length > 0;

    if (!storedStatus) { // If no status is stored, determine it now
         if (hasCurrentItems || hasPendingItems) {
             sessionStorage.setItem(`table-${tableIdParam}-status`, 'occupied');
         } else {
             sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
         }
     } else if (storedStatus === 'available' && (hasCurrentItems || hasPendingItems)) {
         // If status is available but items exist (e.g., after browser crash recovery)
         sessionStorage.setItem(`table-${tableIdParam}-status`, 'occupied');
     } else if (storedStatus === 'occupied' && !hasCurrentItems && !hasPendingItems) {
        // If status is occupied but no items exist (e.g., after clearing pending)
        sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
     }

  }, [tableIdParam]); // Only run on mount based on tableIdParam

  // Save orders to sessionStorage whenever they change
   useEffect(() => {
     const hasCurrentItems = order.length > 0;
     const hasPendingItems = pendingPaymentOrder.length > 0;

     // Save current order
     if (hasCurrentItems) {
        sessionStorage.setItem(`table-${tableIdParam}-order`, JSON.stringify(order));
     } else {
        sessionStorage.removeItem(`table-${tableIdParam}-order`);
     }

      // Save pending order
     if (hasPendingItems) {
        sessionStorage.setItem(`table-${tableIdParam}-pending-order`, JSON.stringify(pendingPaymentOrder));
     } else {
        sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);
     }

     // Update table status based on whether items exist in either order
     if (hasCurrentItems || hasPendingItems) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, 'occupied');
     } else {
        // Only set to available if both are empty
        sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
     }

   }, [order, pendingPaymentOrder, tableIdParam]);


  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return `CLP ${amount.toFixed(0)}`; // Format as CLP with no decimals
  };

  // Function to handle clicking a menu item (from Sheet)
  const handleItemClick = (item: MenuItem) => {
    if (item.modifications && item.modifications.length > 0) {
      setCurrentItemForModification(item);
      setIsModificationDialogOpen(true); // Open modification dialog
      setIsMenuSheetOpen(false); // Close menu sheet
    } else {
      // If no modifications, add directly to current order
      addToOrder(item);
      // Optionally close the sheet after adding an item without mods
      // setIsMenuSheetOpen(false);
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

    // Update the current order state
    setOrder((prevOrder) => {
       // Check if an identical item *with the exact same set of modifications* already exists in the *current* order
      const existingItemIndex = prevOrder.findIndex(
        (orderItem) => orderItem.id === item.id && compareModifications(orderItem.selectedModifications, modifications)
      );

      if (existingItemIndex > -1) {
        // Increment quantity of the existing item in the current order
        const updatedOrder = [...prevOrder];
        updatedOrder[existingItemIndex] = {
          ...updatedOrder[existingItemIndex],
          quantity: updatedOrder[existingItemIndex].quantity + 1,
        };
        return updatedOrder;
      } else {
         // Add as a new item to the current order
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

     // Simulate the state update for toast calculation
     let simulatedOrderForToast: OrderItem[];
     const existingIndex = order.findIndex(
        (oi) => oi.id === item.id && compareModifications(oi.selectedModifications, modifications)
     );
     if (existingIndex > -1) {
        simulatedOrderForToast = order.map((oi, index) =>
             index === existingIndex ? { ...oi, quantity: oi.quantity + 1 } : oi
         );
     } else {
        const { price, modificationPrices, modifications: itemMods, ...itemWithoutPricesAndMods } = item;
        simulatedOrderForToast = [...order, {
            ...itemWithoutPricesAndMods,
            orderItemId: 'temp-toast-id', // Temporary unique ID for simulation
            quantity: 1,
            selectedModifications: modifications,
            basePrice: item.price,
            finalPrice: finalItemPrice,
        }];
     }
     const updatedTotal = calculateTotal(simulatedOrderForToast);


    // Format modifications string for toast
    const modificationsString = modifications && modifications.length > 0
        ? ` (${modifications.join(', ')})`
        : '';

    const toastTitle = `${item.name}${modificationsString} añadido`;

    toast({
        title: toastTitle,
        description: `Nuevo Total Actual: ${formatCurrency(updatedTotal)}`, // Show the new total for current order
        variant: "default",
        className: "bg-secondary text-secondary-foreground"
      })
  };


  // Updated removeFromOrder to use orderItemId - Only removes from the *current* order
  const removeFromOrder = (orderItemId: string) => {
    setOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex((item) => item.orderItemId === orderItemId);
      if (existingItemIndex === -1) return prevOrder; // Item not found in current order

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
        toast({ title: `${itemToRemove.name}${modsString ? ` (${modsString})` : ''} eliminado del pedido actual`, variant: "destructive" });
        // Filter out the item
        const filteredOrder = updatedOrder.filter((item) => item.orderItemId !== orderItemId);
        return filteredOrder;
      }
    });
  };

  // Updated removeCompletely to use orderItemId - Only removes from the *current* order
   const removeCompletely = (orderItemId: string) => {
     const itemToRemove = order.find(item => item.orderItemId === orderItemId);
     const modsString = itemToRemove?.selectedModifications?.join(', ');
     setOrder((prevOrder) => {
        const filteredOrder = prevOrder.filter((orderItem) => orderItem.orderItemId !== orderItemId);
        return filteredOrder;
     });
      toast({
        title: `${itemToRemove?.name}${modsString ? ` (${modsString})` : ''} eliminado del pedido actual`, // Specify current order
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

  const handlePrintOrder = () => {
     if (order.length === 0) {
       toast({ title: "Error", description: "No hay artículos en el pedido actual para imprimir.", variant: "destructive" });
       return;
     }

     console.log('Imprimiendo Comanda (Pedido Actual):', order);

     // Merge current order into pending payment order
     // Create a deep copy of the pending order to avoid direct state mutation issues
     const currentPendingOrder = JSON.parse(JSON.stringify(pendingPaymentOrder));
     const currentOrderToMove = JSON.parse(JSON.stringify(order)); // Copy current order too

     currentOrderToMove.forEach((currentItem: OrderItem) => {
         const existingIndex = currentPendingOrder.findIndex((pendingItem: OrderItem) =>
             pendingItem.id === currentItem.id &&
             compareModifications(pendingItem.selectedModifications, currentItem.selectedModifications)
         );
         if (existingIndex > -1) {
             // Item exists, increase quantity
             currentPendingOrder[existingIndex].quantity += currentItem.quantity;
         } else {
             // New item, add it
             currentPendingOrder.push(currentItem);
         }
     });


     // Update state with the merged order
     setPendingPaymentOrder(currentPendingOrder);

     // Clear the current order after moving to pending
     setOrder([]);

     // Keep table occupied
     sessionStorage.setItem(`table-${tableIdParam}-status`, 'occupied');

     const printedTotal = calculateTotal(currentOrderToMove); // Calculate total of *what was just printed*
     const newPendingTotal = calculateTotal(currentPendingOrder); // Calculate total of *new combined pending order*


     toast({
       title: "¡Comanda Enviada!",
       description: `Se añadieron ${formatCurrency(printedTotal)} al pedido pendiente. Total Pendiente: ${formatCurrency(newPendingTotal)}.`,
       variant: "default",
       className: "bg-green-200 text-green-800 border-green-400" // Using direct colors temporarily for success
     });
  };

    const handlePrintPayment = () => {
       if (pendingPaymentOrder.length === 0) {
         toast({ title: "Error", description: "No hay artículos pendientes para imprimir el pago.", variant: "destructive" });
         return;
       }

       console.log('Imprimiendo Boleta/Factura (Pedido Pendiente):', pendingPaymentOrder);
       console.log('Total a Pagar:', formatCurrency(pendingOrderTotal));

       // Here you would typically integrate with a real printing service/API
       // For this example, we'll just clear the pending order and update status

       setPendingPaymentOrder([]); // Clear the pending order

        // Update table status only if current order is also empty
        if (order.length === 0) {
            sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
        }

       toast({
         title: "¡Pago Impreso!",
         description: `Boleta/Factura por ${formatCurrency(pendingOrderTotal)} impresa. Mesa disponible si no hay pedido actual.`,
         variant: "default",
         className: "bg-blue-200 text-blue-800 border-blue-400" // Using direct colors for payment success
       });
     };


   /*
   const handleClearPendingOrder = () => {
      if (pendingPaymentOrder.length === 0) {
        toast({ title: "Nada que limpiar", description: "No hay pedidos pendientes de pago.", variant: "default" });
        return;
      }
      if (confirm("¿Está seguro de que desea limpiar el pedido pendiente de pago? Esta acción no se puede deshacer.")) {
        setPendingPaymentOrder([]);
        // Update table status only if current order is also empty
        if (order.length === 0) {
            sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
        }
        toast({ title: "Pedido Pendiente Limpiado", description: "Todos los artículos pendientes de pago han sido eliminados.", variant: "destructive" });
      }
   };
   */

  // Filter menu items based on the selected category (used in Sheet now)
  const filteredMenu = mockMenu.filter(
    (item) => item.category === selectedCategory
  );

  const currentOrderTotal = calculateTotal(order);
  const pendingOrderTotal = calculateTotal(pendingPaymentOrder);

  const getPageTitle = () => {
      if (tableIdParam === 'mezon') {
          return 'Mezón';
      } else if (tableIdParam === 'delivery') {
          return 'Delivery';
      } else {
          return `Mesa ${tableIdParam}`;
      }
  }

  // Render Menu Items inside the Sheet
  const renderMenuItemsInSheet = () => {
    return (
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
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
          <ScrollArea className="h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
            <ul className="space-y-2">
              {filteredMenu.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleItemClick(item)} // Use handleItemClick
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{formatCurrency(item.price)}</span>
                </li>
              ))}
              {filteredMenu.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center pt-4">No hay artículos en esta categoría.</p>
              )}
            </ul>
          </ScrollArea>
        </div>
    );
  };


   // Render function for both current and pending order items
   const renderOrderItems = (items: OrderItem[], isPendingSection: boolean = false) => {
       if (items.length === 0) {
           return <p className="text-muted-foreground text-center">
               {isPendingSection ? "No hay artículos pendientes de pago." : "Aún no se han añadido artículos al pedido actual."}
           </p>;
       }

       return (
         <ul className="space-y-3">
           {items.map((item) => (
             <li key={item.orderItemId} className="flex items-center justify-between">
               <div className='flex items-center gap-2'>
                 <div>
                   <span className="font-medium text-sm">{item.name}</span>
                    {item.selectedModifications && item.selectedModifications.length > 0 && (
                      <p className="text-xs text-muted-foreground">({item.selectedModifications.join(', ')})</p>
                    )}
                   <p className='text-xs text-muted-foreground'>{formatCurrency(item.finalPrice)}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 {/* Conditionally render +/- buttons only for current order */}
                 {!isPendingSection ? (
                     <>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromOrder(item.orderItemId)}>
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => {
                            const originalItem = mockMenu.find(menuItem => menuItem.id === item.id);
                            if (originalItem) {
                                // Re-adding needs to consider modifications
                                addToOrder(originalItem, item.selectedModifications);
                            }
                        }}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                          {/* Button to remove completely - only for current order */}
                         <Button
                             variant="ghost"
                             size="icon"
                             className="h-6 w-6 text-destructive/70"
                             onClick={() => removeCompletely(item.orderItemId)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                     </>
                 ) : (
                    // For pending section, just show quantity
                    <span className="font-medium w-4 text-center">{item.quantity}</span>
                 )}
               </div>
             </li>
           ))}
         </ul>
       );
     };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-theme(spacing.16))] flex flex-col">
       <div className="flex items-center mb-6">
         <Button variant="secondary" size="icon" onClick={() => router.push('/tables')} className="mr-2 h-10 w-10 rounded-md bg-card hover:bg-accent">
           <ArrowLeft className="h-6 w-6" />
         </Button>
         <h1 className="text-3xl font-bold">{getPageTitle()} - Pedido</h1>
       </div>
      <div className="flex flex-grow gap-4 overflow-hidden">
        {/* Menu Button Section (Replaces Menu Card) */}
        <div className="w-1/3 flex flex-col justify-start items-stretch pt-4"> {/* Use less space */}
          <Button
            onClick={() => setIsMenuSheetOpen(true)}
            className="h-16 text-lg bg-primary hover:bg-primary/90" // Make button prominent
          >
            <Utensils className="mr-2 h-5 w-5" /> Ver Menú
          </Button>
        </div>

         {/* Order Summaries Section (Current + Pending) */}
        <div className="w-2/3 flex flex-col gap-4 overflow-hidden"> {/* Use more space */}
            {/* Current Order Section */}
            <Card className="flex flex-col shadow-lg h-1/2"> {/* Use flex-1 */}
              <CardHeader>
                <CardTitle>Pedido Actual</CardTitle>
                <CardDescription>Artículos para la próxima comanda.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {renderOrderItems(order, false)}
                </ScrollArea>
              </CardContent>
              <Separator />
              <CardFooter className="p-4 flex flex-col items-stretch gap-2"> {/* Reduced gap */}
                <div className="flex justify-between items-center text-md font-semibold"> {/* Smaller text */}
                  <span>Total Actual:</span>
                  <span>{formatCurrency(currentOrderTotal)}</span>
                </div>
                 <Button size="sm" onClick={handlePrintOrder} disabled={order.length === 0}> {/* Smaller button */}
                    <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
                  </Button>
              </CardFooter>
            </Card>

             {/* Pending Payment Order Section */}
            <Card className="flex flex-col shadow-lg h-1/2"> {/* Use flex-1 */}
              <CardHeader>
                <CardTitle>Pedido Pendiente de Pago</CardTitle>
                <CardDescription>Comandas impresas esperando pago.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                   {renderOrderItems(pendingPaymentOrder, true)}
                </ScrollArea>
              </CardContent>
              <Separator />
              <CardFooter className="p-4 flex flex-col items-stretch gap-2"> {/* Reduced gap */}
                <div className="flex justify-between items-center text-md font-semibold"> {/* Smaller text */}
                  <span>Total Pendiente:</span>
                  <span>{formatCurrency(pendingOrderTotal)}</span>
                </div>
                {/* Changed button text and action */}
                <Button size="sm" variant="default" onClick={handlePrintPayment} disabled={pendingPaymentOrder.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <CreditCard className="mr-2 h-4 w-4" /> Imprimir Pago
                </Button>
              </CardFooter>
            </Card>
         </div>

      </div>

        {/* Menu Sheet Component */}
        <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
            <SheetContent className="w-full sm:max-w-md" side="left"> {/* Adjust width and side as needed */}
                <SheetHeader>
                  <SheetTitle className="text-center text-lg font-semibold py-2 rounded-md bg-muted text-muted-foreground">Menú</SheetTitle>
                  {/* <SheetDescription>Selecciona una categoría y añade artículos.</SheetDescription> */}
                </SheetHeader>
                 {renderMenuItemsInSheet()}
                 <SheetFooter className="mt-4">
                     <Button variant="outline" onClick={() => setIsMenuSheetOpen(false)}>Cerrar Menú</Button>
                 </SheetFooter>
            </SheetContent>
        </Sheet>

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

