
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
} from '@/components/ui/sheet';
import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard } from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page'; // Import CashMovement type

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
      name: 'Italiano Normal', // Changed from 'Completo Vienesa Italiana'
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
      name: 'Italiano chico', // Changed from 'Hamburguesa'
      price: 8990,
      category: 'Fajitas',
      modifications: ['Con Queso', 'Sin Cebolla', 'Extra Carne', 'Ají Verde', 'Agregado Queso'], // Simpler modifications + Ají Verde + Agregado Queso
      modificationPrices: { 'Con Queso': 500, 'Extra Carne': 1000, 'Agregado Queso': 1000 }, // Example prices + Cheese
    },
    {
      id: 2,
      name: 'Italiano grande', // Changed from 'Pizza'
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
    // --- Hamburguesas --- (New Category)
    {
        id: 17,
        name: 'Hamburguesa Clásica',
        price: 7000,
        category: 'Hamburguesas',
        modifications: ['Doble Carne', 'Queso Cheddar', 'Bacon', 'Sin Pepinillos', 'Agregado Queso'],
        modificationPrices: { 'Doble Carne': 2000, 'Queso Cheddar': 800, 'Bacon': 1000, 'Agregado Queso': 1000 },
    },
    {
        id: 18,
        name: 'Hamburguesa Especial Cami',
        price: 8500,
        category: 'Hamburguesas',
        modifications: ['Queso Azul', 'Cebolla Caramelizada', 'Rúcula', 'Agregado Queso'],
        modificationPrices: { 'Queso Azul': 1200, 'Agregado Queso': 1000 },
    },
    // --- Churrascos --- (New Category)
    {
        id: 19,
        name: 'Churrasco Italiano',
        price: 7500,
        category: 'Churrascos',
        modifications: ['Palta', 'Tomate', 'Mayonesa Casera', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 20,
        name: 'Churrasco Luco',
        price: 7200,
        category: 'Churrascos',
        modifications: ['Queso Fundido', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    // --- Papas Fritas --- (New Category)
    {
        id: 21,
        name: 'Papas Fritas Normales',
        price: 3500,
        category: 'Papas Fritas',
        modifications: ['Agregar Queso Fundido', 'Agregar Salsa Cheddar'],
        modificationPrices: { 'Agregar Queso Fundido': 1500, 'Agregar Salsa Cheddar': 1200 },
    },
    {
        id: 22,
        name: 'Papas Fritas Cami Style',
        price: 5000,
        category: 'Papas Fritas',
        modifications: ['Queso Cheddar', 'Bacon', 'Cebolla Crispy', 'Salsa BBQ'],
        modificationPrices: { 'Queso Cheddar': 1200, 'Bacon': 1000 },
    },
    // --- Café ---
    {
      id: 3,
      name: 'Dinamico chico', // Changed from 'Ensalada'
      price: 6500,
      category: 'Café',
    },
    {
      id: 7,
      name: 'Alitas de Pollo',
      price: 9500,
      category: 'Café',
    },
    // --- Colaciones ---
    {
      id: 4,
      name: 'Dinamico grande', // Changed from 'Papas Fritas'
      price: 3000,
      category: 'Colaciones',
    },
    // --- Promociones ---
    {
      id: 6,
      name: 'Completo grande', // Changed from 'Helado'
      price: 4500,
      category: 'Promociones',
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Agregado Queso': 1000 }, // + Cheese
    },
     {
      id: 5,
      name: 'Completo chico', // Changed from 'Refresco'
      price: 2000,
      category: 'Promociones',
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Agregado Queso': 1000 }, // + Cheese
    },
    {
      id: 23, // New Promo Churrasco
      name: 'Promo Churrasco',
      price: 6000, // Example price
      category: 'Promociones',
      // No modifications by default for promos, unless specified
    },
    {
      id: 24, // New Promo Mechada
      name: 'Promo Mechada',
      price: 7000, // Example price
      category: 'Promociones',
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
  'Hamburguesas', // Added
  'Churrascos',   // Added
  'Papas Fritas', // Added
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

// Storage key for cash movements
const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';

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
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization

  // --- Load orders and status from sessionStorage on mount ---
  useEffect(() => {
    if (!tableIdParam || isInitialized) return; // Avoid running multiple times or without ID

    console.log(`Initializing state for table ${tableIdParam}...`);

    const storedCurrentOrder = sessionStorage.getItem(`table-${tableIdParam}-order`);
    const storedPendingOrder = sessionStorage.getItem(`table-${tableIdParam}-pending-order`);
    const storedStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);

    let parsedCurrentOrder: OrderItem[] = [];
    let parsedPendingOrder: OrderItem[] = [];

    if (storedCurrentOrder) {
      try {
        const parsed = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsed)) {
           parsedCurrentOrder = parsed;
           console.log(`Loaded current order for table ${tableIdParam}:`, parsedCurrentOrder);
        } else {
           console.warn(`Invalid current order data found for table ${tableIdParam}, clearing.`);
           sessionStorage.removeItem(`table-${tableIdParam}-order`);
        }
      } catch (error) {
        console.error(`Failed to parse stored current order for table ${tableIdParam}:`, error);
        sessionStorage.removeItem(`table-${tableIdParam}-order`); // Clear invalid data
      }
    }

    if (storedPendingOrder) {
       try {
         const parsed = JSON.parse(storedPendingOrder);
         if (Array.isArray(parsed)) {
            parsedPendingOrder = parsed;
            console.log(`Loaded pending order for table ${tableIdParam}:`, parsedPendingOrder);
         } else {
            console.warn(`Invalid pending order data found for table ${tableIdParam}, clearing.`);
            sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);
         }
       } catch (error) {
         console.error(`Failed to parse stored pending order for table ${tableIdParam}:`, error);
         sessionStorage.removeItem(`table-${tableIdParam}-pending-order`); // Clear invalid data
       }
     }

     // Set state *after* parsing
     setOrder(parsedCurrentOrder);
     setPendingPaymentOrder(parsedPendingOrder);

    // --- Determine and Update Table Status ---
    const hasCurrentItems = parsedCurrentOrder.length > 0;
    const hasPendingItems = parsedPendingOrder.length > 0;
    let newStatus: 'available' | 'occupied' = 'available';

    if (hasCurrentItems || hasPendingItems) {
      newStatus = 'occupied';
    }

    // Update status in sessionStorage if it doesn't match the derived status
    const currentStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);
    if (currentStatus !== newStatus) {
       console.log(`Updating status for table ${tableIdParam} from ${currentStatus || 'none'} to ${newStatus}`);
       sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
    } else {
       console.log(`Status for table ${tableIdParam} is already ${currentStatus}`);
    }

    setIsInitialized(true); // Mark initialization as complete
    console.log(`Initialization complete for table ${tableIdParam}.`);

  }, [tableIdParam, isInitialized]); // Dependencies ensure this runs once per table ID


  // --- Save orders and update status to sessionStorage whenever they change ---
   useEffect(() => {
     // Only run this effect *after* initial state is loaded
     if (!isInitialized || !tableIdParam) return;

     console.log(`Saving state for table ${tableIdParam}...`);

     const hasCurrentItems = order.length > 0;
     const hasPendingItems = pendingPaymentOrder.length > 0;

     // Save current order
     if (hasCurrentItems) {
        sessionStorage.setItem(`table-${tableIdParam}-order`, JSON.stringify(order));
        console.log(`Saved current order for table ${tableIdParam}.`);
     } else {
        sessionStorage.removeItem(`table-${tableIdParam}-order`);
        console.log(`Removed current order for table ${tableIdParam}.`);
     }

      // Save pending order
     if (hasPendingItems) {
        sessionStorage.setItem(`table-${tableIdParam}-pending-order`, JSON.stringify(pendingPaymentOrder));
         console.log(`Saved pending order for table ${tableIdParam}.`);
     } else {
        sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);
         console.log(`Removed pending order for table ${tableIdParam}.`);
     }

     // Update table status based on whether items exist in either order
     const newStatus = (hasCurrentItems || hasPendingItems) ? 'occupied' : 'available';
     const currentStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);

     if (currentStatus !== newStatus) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
        console.log(`Updated status for table ${tableIdParam} to ${newStatus}.`);
     }

   }, [order, pendingPaymentOrder, tableIdParam, isInitialized]);


  // Helper to format currency
  const formatCurrency = (amount: number) => {
    // Format as CLP with no decimals
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
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
      // Close the sheet after adding an item without mods (like beverages)
      // Keep sheet open for non-modification items for faster multi-add
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

    // Format modifications string for toast
    const modificationsString = modifications && modifications.length > 0
        ? ` (${modifications.join(', ')})`
        : '';

    const toastTitle = `${item.name}${modificationsString} añadido`;

    toast({
        title: toastTitle,
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
  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce(
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

     // --- Merge current order into pending payment order ---
     // Create deep copies to avoid state mutation issues
     const currentPendingCopy = JSON.parse(JSON.stringify(pendingPaymentOrder));
     const currentOrderToMove = JSON.parse(JSON.stringify(order));

     currentOrderToMove.forEach((currentItem: OrderItem) => {
         const existingIndex = currentPendingCopy.findIndex((pendingItem: OrderItem) =>
             pendingItem.id === currentItem.id &&
             compareModifications(pendingItem.selectedModifications, currentItem.selectedModifications)
         );
         if (existingIndex > -1) {
             // Item exists, increase quantity
             currentPendingCopy[existingIndex].quantity += currentItem.quantity;
             console.log(`Increased quantity for existing pending item: ${currentItem.name}`);
         } else {
             // New item, add it
             currentPendingCopy.push(currentItem);
              console.log(`Added new item to pending: ${currentItem.name}`);
         }
     });

     // --- Update state ---
     setPendingPaymentOrder(currentPendingCopy); // Update pending order state
     setOrder([]); // Clear the current order state

     // Status update is handled by the save useEffect hook

     // Calculate total of *new combined pending order*
     const newPendingTotal = calculateTotal(currentPendingCopy);

     toast({
       title: "¡Comanda Enviada!",
       description: `Total Pendiente Actualizado: ${formatCurrency(newPendingTotal)}.`, // Show the new total for pending order
       variant: "default",
       className: "bg-green-200 text-green-800 border-green-400" // Using direct colors temporarily for success
     });
  };

   // Helper to get the next available cash movement ID
   const getNextMovementId = (currentMovements: CashMovement[]): number => {
      return currentMovements.length > 0 ? Math.max(...currentMovements.map((m) => m.id)) + 1 : 1;
  };

    const handlePrintPayment = () => {
       if (pendingPaymentOrder.length === 0) {
         toast({ title: "Error", description: "No hay artículos pendientes para imprimir el pago.", variant: "destructive" });
         return;
       }

       const finalTotalToPay = calculateTotal(pendingPaymentOrder); // Calculate final total here

       console.log('Imprimiendo Boleta/Factura (Pedido Pendiente):', pendingPaymentOrder);
       console.log('Total a Pagar:', formatCurrency(finalTotalToPay));

       // --- Add sale to cash movements in sessionStorage ---
       try {
            const storedMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
            let currentMovements: CashMovement[] = [];
            if (storedMovements) {
                const parsed = JSON.parse(storedMovements);
                if (Array.isArray(parsed)) {
                    // Parse dates back to Date objects
                     currentMovements = parsed.map((m: any) => ({ ...m, date: new Date(m.date) }));
                }
            }

            const newMovementId = getNextMovementId(currentMovements);
            const saleMovement: CashMovement = {
                id: newMovementId,
                date: new Date(), // Use current date/time for the sale
                category: 'Ingreso Venta',
                description: `Venta ${getPageTitle()}`, // Description includes table/source
                amount: finalTotalToPay, // Positive amount for income
            };

            // Add the new sale and sort (most recent first)
            const updatedMovements = [...currentMovements, saleMovement].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Save back to sessionStorage (store dates as ISO strings)
            sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(
                 updatedMovements.map(m => ({...m, date: m.date instanceof Date ? m.date.toISOString() : m.date }))
             ));
            console.log(`Sale of ${formatCurrency(finalTotalToPay)} registered in cash movements.`);

       } catch (error) {
            console.error("Error registering sale in cash movements:", error);
            toast({title: "Error Interno", description: "No se pudo registrar la venta en la caja.", variant: "destructive"});
            // Decide if you want to proceed with clearing the pending order even if saving fails
            // return; // Option: Stop here if saving fails
       }


       // --- Clear pending order and update status ---
       setPendingPaymentOrder([]); // Clear the pending order state immediately

       // Status update is handled by the save useEffect hook

       toast({
         title: "¡Pago Impreso!",
         description: `Boleta/Factura por ${formatCurrency(finalTotalToPay)} impresa. Venta registrada en caja. Mesa disponible si no hay pedido actual.`,
         variant: "default",
         className: "bg-blue-200 text-blue-800 border-blue-400" // Using direct colors for payment success
       });
     };

  // Filter menu items based on the selected category (used in Sheet now)
  const filteredMenu = mockMenu.filter(
    (item) => item.category === selectedCategory
  );

  const currentOrderTotal = calculateTotal(order); // Calculate current order total (though not displayed directly)
  const pendingOrderTotal = calculateTotal(pendingPaymentOrder); // Calculate pending total

  const getPageTitle = () => {
      if (!tableIdParam) return 'Cargando...'; // Handle case where param might be missing initially
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
          <ScrollArea className="h-[calc(100vh-250px)]"> {/* Adjusted height */}
            <ul className="space-y-2">
              {filteredMenu.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleItemClick(item)} // Use handleItemClick
                >
                  <span className="font-medium">{item.name}</span>
                   {/* Display base price in menu */}
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
                    {/* Show final price only in pending section */}
                    {isPendingSection && (
                        <p className='text-xs text-muted-foreground font-mono'>{formatCurrency(item.finalPrice)}</p>
                    )}
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
                    // For pending section, just show quantity x price
                    <span className="font-medium w-auto text-right text-sm">{item.quantity} x {formatCurrency(item.finalPrice)}</span>
                 )}
               </div>
             </li>
           ))}
         </ul>
       );
     };

  // Show loading indicator until initialization is complete
  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando datos de la mesa...</div>;
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-theme(spacing.16))] flex flex-col">
       <div className="flex items-center mb-4"> {/* Reduced margin bottom */}
         <Button variant="secondary" size="icon" onClick={() => router.push('/tables')} className="mr-2 h-10 w-10 rounded-md bg-card hover:bg-accent">
           <ArrowLeft className="h-6 w-6" />
         </Button>
         <h1 className="text-3xl font-bold">{getPageTitle()} - Pedido</h1>
       </div>

        {/* Menu Button Centered Above */}
        <div className="flex justify-center mb-4">
            <Button
                onClick={() => setIsMenuSheetOpen(true)}
                className="h-12 text-md bg-primary hover:bg-primary/90" // Adjusted size/text
            >
                <Utensils className="mr-2 h-5 w-5" /> Ver Menú
            </Button>
        </div>

        {/* Order Summaries Side-by-Side */}
      <div className="flex flex-grow gap-4 overflow-hidden">
        {/* Current Order Section */}
        <Card className="w-1/2 flex flex-col shadow-lg"> {/* Use w-1/2 */}
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
          <CardFooter className="p-4 flex flex-col items-stretch gap-2">
             {/* No total shown in current order footer */}
            <Button size="sm" onClick={handlePrintOrder} disabled={order.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>

        {/* Pending Payment Order Section */}
        <Card className="w-1/2 flex flex-col shadow-lg"> {/* Use w-1/2 */}
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
          <CardFooter className="p-4 flex flex-col items-stretch gap-2">
            <div className="flex justify-between items-center text-md font-semibold">
              <span>Total Pendiente:</span>
              <span className='font-mono'>{formatCurrency(pendingOrderTotal)}</span>
            </div>
            <Button size="sm" variant="default" onClick={handlePrintPayment} disabled={pendingPaymentOrder.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
              <CreditCard className="mr-2 h-4 w-4" /> Imprimir Pago
            </Button>
          </CardFooter>
        </Card>
      </div>

        {/* Menu Sheet Component */}
        <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
            <SheetContent className="w-full sm:max-w-md" side="left"> {/* Adjust width and side as needed */}
                <SheetHeader>
                  <SheetTitle className="text-center text-lg font-semibold py-2 rounded-md bg-muted text-muted-foreground">Menú</SheetTitle>
                  {/* <SheetDescription>Selecciona una categoría y añade artículos.</SheetDescription> */}
                </SheetHeader>
                 {renderMenuItemsInSheet()}
                 <SheetFooter className="mt-4 p-4 border-t">
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

