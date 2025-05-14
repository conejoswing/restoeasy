
'use client';

import * as React from 'react';
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useParams, useRouter }from 'next/navigation';
import {Button, buttonVariants} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {ScrollArea }from '@/components/ui/scroll-area';
import {Separator }from '@/components/ui/separator';
// import { Input } from '@/components/ui/input'; // No longer directly used here, moved to ProductsManagementPage
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog as ShadDialog,
  DialogClose as ShadDialogClose,
  DialogContent as ShadDialogContent,
  DialogDescription as ShadDialogDescription,
  DialogFooter as ShadDialogFooter, 
  DialogHeader as ShadDialogHeader,   
  DialogTitle as ShadDialogTitle,     
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


import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard, ChevronRight, Banknote, Landmark, Home, Phone, User, DollarSign, PackageSearch, Edit, Trash2, ListChecks, Tags, Pencil, Copy } from 'lucide-react';
import {useToast }from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import PaymentDialog from '@/components/app/payment-dialog';
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page';
import type { DeliveryInfo } from '@/components/app/delivery-dialog';
import DeliveryDialog from '@/components/app/delivery-dialog'; 
import { formatKitchenOrderReceipt, formatCustomerReceipt, printHtml, formatPendingOrderCopy, formatCurrency as printUtilsFormatCurrency } from '@/lib/printUtils';
import type { InventoryItem } from '@/app/inventory/page';
import type { MenuItem } from '@/types/menu';
import { loadMenuData, orderedCategories as predefinedOrderedCategories, sortMenu } from '@/lib/menuUtils';

// import { Label } from '@/components/ui/label'; // No longer directly used here
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


// OrderItem interface specific to this page
export interface OrderItem extends Omit<MenuItem, 'price' | 'modificationPrices' | 'modifications'> {
  orderItemId: string;
  quantity: number;
  selectedModifications?: string[];
  basePrice: number;
  finalPrice: number;
  // ingredients is inherited
  orderNumber?: number;
  category: string;
  observation?: string; // Added observation field
}


export type PaymentMethod = 'Efectivo' | 'Tarjeta Débito' | 'Tarjeta Crédito' | 'Transferencia';

interface PendingOrderGroup {
  orderNumber: number;
  items: OrderItem[];
  deliveryInfo?: DeliveryInfo | null;
  timestamp: number;
}

interface PendingOrderStorageData {
    groups: PendingOrderGroup[];
}

const INVENTORY_STORAGE_KEY = 'restaurantInventory';
const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';
const PENDING_ORDERS_STORAGE_KEY_PREFIX = 'table-';
const DELIVERY_INFO_STORAGE_KEY_PREFIX = 'deliveryInfo-';
const ORDER_NUMBER_STORAGE_KEY = 'lastOrderNumber';


// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};


export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tableIdParam = params.tableId as string;
  const { toast } = useToast();

  const [isInitialized, setIsInitialized] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrderGroups, setPendingOrderGroups] = useState<PendingOrderGroup[]>([]);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [itemToModify, setItemToModify] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [totalForPayment, setTotalForPayment] = useState(0); // This will be the FINAL amount for PaymentDialog
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState(0);
  const [orderToPay, setOrderToPay] = useState<PendingOrderGroup | null>(null);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);

  const [selectedCategoryForDialog, setSelectedCategoryForDialog] = useState<string | null>(null);
  const [isProductListDialogOpen, setIsProductListDialogOpen] = useState(false);

  // State for handling tip decision before final payment
  const [isConfirmTipDialogOpen, setIsConfirmTipDialogOpen] = useState(false);
  const [subtotalForPayment, setSubtotalForPayment] = useState<number | null>(null);
  const [tipForFinalPayment, setTipForFinalPayment] = useState<number | null>(null);
  
  // State for handling tip decision for customer copy
  const [isConfirmTipForCopyDialogOpen, setIsConfirmTipForCopyDialogOpen] = useState(false);
  const [orderGroupForCopy, setOrderGroupForCopy] = useState<PendingOrderGroup | null>(null);


  const isDelivery = useMemo(() => tableIdParam === 'delivery', [tableIdParam]);
  const isMeson = useMemo(() => tableIdParam.toLowerCase() === 'mesón', [tableIdParam]);

  const tableDisplayName = useMemo(() => {
    if (isDelivery) return 'Delivery';
    if (isMeson) return 'Mesón';
    if (!isNaN(Number(tableIdParam))) return `Mesa ${tableIdParam}`;
    return decodeURIComponent(tableIdParam).charAt(0).toUpperCase() + decodeURIComponent(tableIdParam).slice(1);
  }, [tableIdParam, isDelivery, isMeson]);


  // --- Initialization Effect ---
  useEffect(() => {
    if (!tableIdParam || isInitialized) return;

    console.log(`Initializing TableDetailPage for tableId: ${tableIdParam}`);

    setMenu(loadMenuData());

    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (storedInventory) {
      try {
        setInventory(JSON.parse(storedInventory));
      } catch (e) {
        console.error("Failed to parse inventory from localStorage:", e);
        setInventory([]);
      }
    } else {
        setInventory([]);
    }

    const storedCurrentOrder = sessionStorage.getItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-currentOrder`);
    if (storedCurrentOrder) {
      try {
        const parsedOrder = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsedOrder)) {
          setCurrentOrder(parsedOrder.map((item: any) => ({
            ...item,
            basePrice: Number(item.basePrice) || 0,
            finalPrice: Number(item.finalPrice) || 0,
            quantity: Number(item.quantity) || 1,
            observation: item.observation || undefined,
          })));
        }
      } catch (e) { console.error("Error loading current order:", e); }
    }

    const storedPendingOrdersData = sessionStorage.getItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-pendingOrders`);
    if (storedPendingOrdersData) {
        try {
            const parsedData = JSON.parse(storedPendingOrdersData);
             if (parsedData && Array.isArray(parsedData.groups)) {
                 setPendingOrderGroups(
                    parsedData.groups.map((group: PendingOrderGroup) => ({
                        ...group,
                        items: group.items.map((item: any) => ({
                            ...item,
                            observation: item.observation || undefined,
                        })),
                    })).sort((a: PendingOrderGroup, b: PendingOrderGroup) => a.timestamp - b.timestamp)
                 );
             } else if (Array.isArray(parsedData)) { // Fallback for old format
                 setPendingOrderGroups(
                    parsedData.map((group: PendingOrderGroup) => ({
                        ...group,
                        items: group.items.map((item: any) => ({
                            ...item,
                            observation: item.observation || undefined,
                        })),
                    })).sort((a: PendingOrderGroup, b: PendingOrderGroup) => a.timestamp - b.timestamp)
                 );
             }
        } catch (e) { console.error("Error loading pending orders:", e); }
    }

    if (isDelivery) {
      const storedDeliveryInfo = sessionStorage.getItem(`${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`);
      if (storedDeliveryInfo) {
        try {
          setDeliveryInfo(JSON.parse(storedDeliveryInfo));
        } catch (e) { console.error("Error loading delivery info:", e); }
      }
      if (!storedDeliveryInfo && currentOrder.length === 0 && pendingOrderGroups.length === 0) {
        setIsDeliveryDialogOpen(true);
      }
    }

     const storedOrderNumber = localStorage.getItem(ORDER_NUMBER_STORAGE_KEY);
     setLastOrderNumber(storedOrderNumber ? parseInt(storedOrderNumber, 10) : 0);

    setIsInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, isInitialized, isDelivery]); 

  useEffect(() => {
    const handleMenuUpdate = () => {
      console.log('TableDetailPage: Detected menu update. Reloading menu data.');
      setMenu(loadMenuData());
    };
    window.addEventListener('menuUpdated', handleMenuUpdate);
    return () => window.removeEventListener('menuUpdated', handleMenuUpdate);
  }, []);


  // --- Effect to save state changes to sessionStorage and update table status ---
 useEffect(() => {
    if (!isInitialized || !tableIdParam) return;

    console.log(`TableDetailPage: Saving state for table ${tableIdParam}`);
    sessionStorage.setItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-currentOrder`, JSON.stringify(currentOrder));
    sessionStorage.setItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-pendingOrders`, JSON.stringify({ groups: pendingOrderGroups }));

    if (isDelivery) {
        if (deliveryInfo) {
            sessionStorage.setItem(`${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`, JSON.stringify(deliveryInfo));
            console.log(`TableDetailPage: Saved deliveryInfo for ${tableIdParam}`);
        } else {
            // Check if there are any pending orders that still have delivery info for THIS tableId.
            // This is important if multiple delivery orders were taken, and only one is paid.
            const anyPendingGroupHasDeliveryInfo = pendingOrderGroups.some(group => group.deliveryInfo);
            if (!anyPendingGroupHasDeliveryInfo) {
                sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`);
                console.log(`TableDetailPage: Removed deliveryInfo for ${tableIdParam} as no pending orders have it.`);
            }
        }
    }

    const hasPending = pendingOrderGroups.length > 0;
    const hasCurrent = currentOrder.length > 0;

    // Determine if this specific delivery instance is effectively occupied
    // This considers if *any* pending order for *this* delivery still has delivery info
    // OR if there's current delivery info for the *current* order being built.
    let isDeliveryEffectivelyOccupied = false;
    if (isDelivery) {
        const currentDeliveryInfoProvided = deliveryInfo && (deliveryInfo.name || deliveryInfo.address || deliveryInfo.phone);
        const pendingDeliveryInfoProvidedForThisTable = pendingOrderGroups.some(pg => pg.deliveryInfo && (pg.deliveryInfo.name || pg.deliveryInfo.address || pg.deliveryInfo.phone));
        isDeliveryEffectivelyOccupied = !!(currentDeliveryInfoProvided || pendingDeliveryInfoProvidedForThisTable);
        console.log(`TableDetailPage (Delivery): currentOrder.length: ${currentOrder.length}, pendingOrderGroups.length: ${pendingOrderGroups.length}, deliveryInfo: ${!!deliveryInfo}, pendingDeliveryInfoForThisTable: ${pendingDeliveryInfoProvidedForThisTable}, isDeliveryEffectivelyOccupied: ${isDeliveryEffectivelyOccupied}`);
    }


    let newStatus: 'available' | 'occupied';
    if (hasPending || hasCurrent || (isDelivery && isDeliveryEffectivelyOccupied)) {
      newStatus = 'occupied';
    } else {
      newStatus = 'available';
      if (isDelivery) {
        // Only remove the specific deliveryInfo key if the table is now truly available
        // This was modified to ensure it doesn't get removed if other pending deliveries exist for the same generic 'delivery' table ID.
        // The logic above (anyPendingGroupHasDeliveryInfo) helps ensure this.
        if (!isDeliveryEffectivelyOccupied) {
            sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`);
            console.log(`TableDetailPage: Delivery table ${tableIdParam} is now available, removing its specific deliveryInfo.`);
        }
      }
    }

    const oldStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);
    if (oldStatus !== newStatus) {
      sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
      console.log(`TableDetailPage: Table ${tableIdParam} status changed from ${oldStatus || 'unset'} to ${newStatus}. Dispatching event.`);
      window.dispatchEvent(new CustomEvent('tableStatusUpdated'));
    } else {
      // Even if status hasn't changed, ensure it's set, especially on initial load if it was unset
      if (!oldStatus) sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
      console.log(`TableDetailPage: Table ${tableIdParam} status re-affirmed/set as ${newStatus}.`);
    }

  }, [currentOrder, pendingOrderGroups, deliveryInfo, tableIdParam, isInitialized, isDelivery]);


  // --- Item Handling ---
  const handleAddItemToOrder = (item: MenuItem, selectedModifications?: string[], observationText?: string) => {
      const orderItemId = `${item.id}-${selectedModifications ? selectedModifications.join('-') : 'no-mods'}-${observationText ? observationText.substring(0,10).replace(/\s/g,'') : 'no-obs'}-${Date.now()}`;

      let modificationCost = 0;
      if (selectedModifications && item.modificationPrices) {
          modificationCost = selectedModifications.reduce((acc, modName) => {
              return acc + (item.modificationPrices?.[modName] || 0);
          }, 0);
      }
      const finalPrice = item.price + modificationCost;

      const existingItemIndex = currentOrder.findIndex(
          (orderItem) =>
              orderItem.id === item.id &&
              isEqual(orderItem.selectedModifications?.sort(), selectedModifications?.sort()) &&
              (orderItem.observation === observationText || (!orderItem.observation && !observationText))
      );

      if (existingItemIndex > -1) {
          const updatedOrder = [...currentOrder];
          updatedOrder[existingItemIndex].quantity += 1;
          setCurrentOrder(updatedOrder);
      } else {
          setCurrentOrder((prevOrder) => [
              ...prevOrder,
              {
                  ...item,
                  orderItemId: orderItemId,
                  quantity: 1,
                  selectedModifications: selectedModifications,
                  basePrice: item.price,
                  finalPrice: finalPrice,
                  ingredients: item.ingredients || [],
                  category: item.category,
                  observation: observationText,
              },
          ]);
      }
      toast({ title: "Producto Añadido", description: `${item.name} se añadió al pedido actual.` });
      setIsProductListDialogOpen(false); 
  };

  const handleRemoveItemFromOrder = (orderItemId: string) => {
    setCurrentOrder((prevOrder) => prevOrder.filter((item) => item.orderItemId !== orderItemId));
    toast({ title: "Producto Eliminado", description: "El producto se eliminó del pedido actual.", variant: "destructive" });
  };

  const handleIncreaseQuantity = (orderItemId: string) => {
    setCurrentOrder((prevOrder) =>
      prevOrder.map((item) =>
        item.orderItemId === orderItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecreaseQuantity = (orderItemId: string) => {
    setCurrentOrder((prevOrder) =>
      prevOrder
        .map((item) =>
          item.orderItemId === orderItemId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
        )
    );
  };

  // --- Order Management ---
  const getNextOrderNumber = useCallback(() => {
    const nextNumber = (lastOrderNumber % 999) + 1;
    setLastOrderNumber(nextNumber);
    localStorage.setItem(ORDER_NUMBER_STORAGE_KEY, nextNumber.toString());
    return nextNumber;
  }, [lastOrderNumber]);


  const handlePrintKitchenOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Pedido Vacío", description: "Añada productos antes de imprimir la comanda.", variant: "destructive" });
      return;
    }
     if (isDelivery && !deliveryInfo) {
        toast({ title: "Faltan Datos de Envío", description: "Por favor, ingrese los datos de envío antes de imprimir la comanda.", variant: "destructive" });
        setIsDeliveryDialogOpen(true);
        return;
    }
    const orderNumber = getNextOrderNumber();
    const orderWithNumber = currentOrder.map(item => ({ ...item, orderNumber }));

    const kitchenReceipt = formatKitchenOrderReceipt(orderWithNumber, tableDisplayName, orderNumber, deliveryInfo);
    printHtml(kitchenReceipt);

    setPendingOrderGroups(prevGroups => [
        ...prevGroups,
        { orderNumber, items: orderWithNumber, deliveryInfo: isDelivery ? deliveryInfo : null, timestamp: Date.now() }
    ].sort((a,b) => a.timestamp - b.timestamp));

    setCurrentOrder([]);
    toast({ title: "Comanda Impresa", description: `Pedido #${String(orderNumber).padStart(3,'0')} enviado a cocina y movido a pendientes.` });

    if (isDelivery) {
      // Do not reset deliveryInfo here if other pending orders exist for this tableId with deliveryInfo
      const otherPendingDeliveryOrdersForThisTable = pendingOrderGroups.filter(
        group => group.orderNumber !== orderNumber && group.deliveryInfo
      ).length > 0;

      if (currentOrder.length === 0 && !otherPendingDeliveryOrdersForThisTable) {
        // Only reset deliveryInfo if no current items AND no other pending delivery orders for *this* tableId
        console.log(`TableDetailPage: Cleared deliveryInfo for ${tableIdParam} after kitchen print, as no other pending delivery orders for this tableId.`);
        setDeliveryInfo(null);
        // Consider re-opening delivery dialog only if all orders are cleared and it's a delivery table
        if(pendingOrderGroups.filter(g => g.orderNumber !== orderNumber).length === 0) {
            setIsDeliveryDialogOpen(true);
        }
      } else if (currentOrder.length === 0 && otherPendingDeliveryOrdersForThisTable) {
          console.log(`TableDetailPage: Did NOT clear deliveryInfo for ${tableIdParam} as other pending delivery orders exist for this tableId.`);
          // Potentially, you might want to set deliveryInfo to null to force re-entry for the *next* new order,
          // but retain it for existing pending ones. This part is tricky with a shared 'delivery' table.
          // For now, let's keep it. If a new order is started, deliveryInfo will be reused if present.
      }
    }
  };


  const handleOpenPrintCustomerCopyDialog = (groupToCopy: PendingOrderGroup) => {
    setOrderGroupForCopy(groupToCopy);
    setIsConfirmTipForCopyDialogOpen(true);
  };

  const handleConfirmPrintCustomerCopy = (includeTipOnCopy: boolean) => {
    if (!orderGroupForCopy) return;

    let tipForCopy = 0;
    const subtotalForCopy = orderGroupForCopy.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

    if (includeTipOnCopy) {
        tipForCopy = Math.round(subtotalForCopy * 0.10);
    }

    const customerCopyHtml = formatPendingOrderCopy(
        orderGroupForCopy.items,
        tableDisplayName,
        orderGroupForCopy.orderNumber,
        orderGroupForCopy.deliveryInfo,
        includeTipOnCopy,
        tipForCopy
    );
    printHtml(customerCopyHtml);
    toast({ title: "Copia Impresa", description: `Se imprimió una copia del pedido #${String(orderGroupForCopy.orderNumber).padStart(3, '0')}.` });
    setIsConfirmTipForCopyDialogOpen(false);
    setOrderGroupForCopy(null);
  };


  const handleFinalizeAndPaySelectedOrder = (groupToPay: PendingOrderGroup) => {
    if (!groupToPay || groupToPay.items.length === 0) {
        toast({ title: "Error", description: "No hay pedido pendiente seleccionado para pagar o está vacío.", variant: "destructive" });
        return;
    }
    setOrderToPay(groupToPay); // Store the group that's about to be paid
    
    // Calculate subtotal of items for the selected group
    const currentSubtotal = groupToPay.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    setSubtotalForPayment(currentSubtotal); // Store subtotal for later use in handlePaymentConfirm

    // Open dialog to confirm tip for final payment
    setIsConfirmTipDialogOpen(true);
  };

  const handleConfirmTipForPayment = (includeTip: boolean) => {
    if (!orderToPay || subtotalForPayment === null) { // subtotalForPayment should be set before this dialog
        toast({ title: "Error", description: "No se pudo determinar el subtotal para el pago.", variant: "destructive"});
        setIsConfirmTipDialogOpen(false);
        return;
    }

    const currentTip = includeTip ? Math.round(subtotalForPayment * 0.10) : 0;
    setTipForFinalPayment(currentTip); // Store tip for later use

    let deliveryFeeForThisOrder = 0;
    if (isDelivery && orderToPay.deliveryInfo && orderToPay.deliveryInfo.deliveryFee > 0) {
      deliveryFeeForThisOrder = orderToPay.deliveryInfo.deliveryFee;
    }
    
    const finalAmountForDialog = subtotalForPayment + currentTip + deliveryFeeForThisOrder;
    setTotalForPayment(finalAmountForDialog); // This is the final amount for PaymentDialog

    setIsConfirmTipDialogOpen(false); // Close tip confirmation dialog
    setIsPaymentDialogOpen(true);     // Open payment method selection dialog
  };


  const handlePaymentConfirm = (paymentMethod: PaymentMethod, paidAmount: number) => {
    if (!orderToPay || tipForFinalPayment === null) { // Ensure orderToPay and tipForFinalPayment are available
      toast({ title: "Error", description: "No hay un pedido o información de propina para procesar el pago.", variant: "destructive" });
      setIsPaymentDialogOpen(false);
      return;
    }

    const updatedInventory = [...inventory];
    let inventoryUpdateOccurred = false;

    orderToPay.items.forEach(orderItem => {
      const itemNameLower = orderItem.name.toLowerCase();
      let quantityToDeduct = orderItem.quantity;
      let inventoryItemName: string | null = null;

      if (orderItem.category === 'Vienesas') {
        if (['completo normal', 'dinamico normal', 'hot dog normal', 'italiano normal', 'palta normal', 'tomate normal'].includes(itemNameLower)) {
          inventoryItemName = 'Pan especial normal';
          const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
          if (vienaIndex !== -1) {
                const vienesasToDeduct = orderItem.quantity * 1;
                updatedInventory[vienaIndex].stock -= vienesasToDeduct;
                inventoryUpdateOccurred = true;
                if (updatedInventory[vienaIndex].stock < 0 && vienesasToDeduct > 0) {
                     toast({ title: "Advertencia de Stock", description: `El stock de "Vienesas" es ahora ${updatedInventory[vienaIndex].stock}.`, variant: "default"});
                }
          }
        } else if (['completo grande', 'dinamico grande', 'hot dog grande', 'italiano grande', 'palta grande', 'tomate grande'].includes(itemNameLower)) {
          inventoryItemName = 'Pan especial grande';
          const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
           if (vienaIndex !== -1) {
                const vienesasToDeduct = orderItem.quantity * 2;
                updatedInventory[vienaIndex].stock -= vienesasToDeduct;
                inventoryUpdateOccurred = true;
                 if (updatedInventory[vienaIndex].stock < 0 && vienesasToDeduct > 0) {
                     toast({ title: "Advertencia de Stock", description: `El stock de "Vienesas" es ahora ${updatedInventory[vienaIndex].stock}.`, variant: "default"});
                }
          }
        }
      }
      if (orderItem.category === 'As') {
         if (['completo normal', 'dinamico normal', 'chacarero normal', 'italiano normal', 'palta normal', 'tomate normal', 'napolitano normal', 'queso champiñon normal', 'queso normal', 'solo carne normal'].includes(itemNameLower)) {
            inventoryItemName = 'Pan especial normal';
         } else if (['completo grande', 'dinamico grande', 'chacarero grande', 'italiano grande', 'palta grande', 'tomate grande', 'napolitano grande', 'queso champiñon grande', 'queso grande', 'solo carne grande'].includes(itemNameLower)) {
            inventoryItemName = 'Pan especial grande';
         }
      }
       if (orderItem.category === 'Promo Fajitas') {
        if (['4 ingredientes', '6 ingredientes', 'americana', 'brasileño', 'chacarero', 'golosasa', 'italiana', 'primavera'].includes(itemNameLower)) {
            inventoryItemName = 'Fajita'; 
             const bebidaLataIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'lata');
             if (bebidaLataIndex !== -1) {
                 const latasToDeduct = orderItem.quantity; 
                 updatedInventory[bebidaLataIndex].stock -= latasToDeduct;
                 inventoryUpdateOccurred = true;
                 if (updatedInventory[bebidaLataIndex].stock < 0 && latasToDeduct > 0) {
                    toast({ title: "Advertencia de Stock", description: `El stock de "Lata" es ahora ${updatedInventory[bebidaLataIndex].stock}.`, variant: "default"});
                 }
             }
        }
      }
      if (orderItem.category === 'Churrascos') {
        if (['churrasco campestre', 'churrasco che milico', 'churrasco completo', 'churrasco dinamico', 'churrasco italiano', 'churrasco napolitano', 'churrasco palta', 'churrasco queso', 'churrasco queso champiñon', 'churrasco tomate'].includes(itemNameLower)) {
             inventoryItemName = 'Pan de marraqueta';
        }
      }
      if (orderItem.category === 'Promo Churrasco') {
        if (['brasileño', 'campestre', 'chacarero', 'che milico', 'completo', 'dinamico', 'italiano', 'queso', 'queso champiñon', 'tomate', 'palta'].includes(itemNameLower)) {
          inventoryItemName = 'Pan de marraqueta'; 
             const bebidaLataIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'lata');
             if (bebidaLataIndex !== -1) {
                 const latasToDeduct = orderItem.quantity; 
                 updatedInventory[bebidaLataIndex].stock -= latasToDeduct;
                 inventoryUpdateOccurred = true;
                  if (updatedInventory[bebidaLataIndex].stock < 0 && latasToDeduct > 0) {
                    toast({ title: "Advertencia de Stock", description: `El stock de "Lata" es ahora ${updatedInventory[bebidaLataIndex].stock}.`, variant: "default"});
                 }
             }
        }
      }
      if (orderItem.category === 'Promo Mechada') {
          if (['brasileño', 'campestre', 'chacarero', 'che milico', 'completo', 'dinamico', 'italiano', 'queso', 'queso champiñon', 'tomate', 'palta'].includes(itemNameLower)) {
             inventoryItemName = 'Pan de marraqueta'; 
                const bebidaLataIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'lata');
                if (bebidaLataIndex !== -1) {
                    const latasToDeduct = orderItem.quantity; 
                    updatedInventory[bebidaLataIndex].stock -= latasToDeduct;
                    inventoryUpdateOccurred = true;
                    if (updatedInventory[bebidaLataIndex].stock < 0 && latasToDeduct > 0) {
                        toast({ title: "Advertencia de Stock", description: `El stock de "Lata" es ahora ${updatedInventory[bebidaLataIndex].stock}.`, variant: "default"});
                    }
                }
          }
      }
      if (orderItem.category === 'Promo Hamburguesas') {
        if(['big cami', 'italiana', 'simple', 'tapa arteria'].includes(itemNameLower)) {
          inventoryItemName = 'Pan de hamburguesa normal';
           quantityToDeduct = orderItem.quantity * 1; 
        } else if (['doble', 'doble italiana', 'super big cami', 'super tapa arteria'].includes(itemNameLower)) {
           inventoryItemName = 'Pan de hamburguesa grande';
           quantityToDeduct = orderItem.quantity * 1; 
        }
         if (inventoryItemName) { 
            const bebidaLataIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'lata');
            if (bebidaLataIndex !== -1) {
                const latasToDeduct = orderItem.quantity; 
                updatedInventory[bebidaLataIndex].stock -= latasToDeduct;
                inventoryUpdateOccurred = true;
                if (updatedInventory[bebidaLataIndex].stock < 0 && latasToDeduct > 0) {
                    toast({ title: "Advertencia de Stock", description: `El stock de "Lata" es ahora ${updatedInventory[bebidaLataIndex].stock}.`, variant: "default"});
                }
            }
        }
      }
       if (orderItem.category === 'Bebidas') {
           if (itemNameLower === 'bebida 1.5lt') inventoryItemName = 'Bebida 1.5Lt';
           if (itemNameLower === 'lata') inventoryItemName = 'Lata';
           if (itemNameLower === 'cafe chico') inventoryItemName = 'Cafe Chico';
           if (itemNameLower === 'cafe grande') inventoryItemName = 'Cafe Grande';
       }
      if (orderItem.category === 'Promociones') {
          const promoNum = parseInt(itemNameLower.replace('promo ', ''), 10);
          if (promoNum === 1 || promoNum === 2) { inventoryItemName = 'Pan de hamburguesa grande'; quantityToDeduct = orderItem.quantity * 1; } 
          if (promoNum === 3) { inventoryItemName = 'Pan de marraqueta'; quantityToDeduct = orderItem.quantity * 4; } 
          if (promoNum === 4) { inventoryItemName = 'Pan de marraqueta'; quantityToDeduct = orderItem.quantity * 2; } 

          if (promoNum === 5) { inventoryItemName = 'Pan especial normal'; quantityToDeduct = orderItem.quantity * 2; } 
          if (promoNum === 6) { inventoryItemName = 'Pan especial grande'; quantityToDeduct = orderItem.quantity * 2; } 
          if (promoNum === 7) { inventoryItemName = 'Pan especial normal'; quantityToDeduct = orderItem.quantity * 2; } 
          if (promoNum === 8) { inventoryItemName = 'Pan especial grande'; quantityToDeduct = orderItem.quantity * 2; } 
          if (promoNum === 9) { inventoryItemName = 'Pan especial normal'; quantityToDeduct = orderItem.quantity * 4; } 
          if (promoNum === 10) { inventoryItemName = 'Pan especial grande'; quantityToDeduct = orderItem.quantity * 4; } 
          if (promoNum === 11) { inventoryItemName = 'Pan especial normal'; quantityToDeduct = orderItem.quantity * 4; } 
          if (promoNum === 12) { inventoryItemName = 'Pan especial grande'; quantityToDeduct = orderItem.quantity * 4; } 


          if ([1,2,3,9,10,11,12].includes(promoNum)) {
              const bebidaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'bebida 1.5lt');
              if (bebidaIndex !== -1) {
                  const bebidasToDeduct = orderItem.quantity; 
                  updatedInventory[bebidaIndex].stock -= bebidasToDeduct;
                  inventoryUpdateOccurred = true;
                  if (updatedInventory[bebidaIndex].stock < 0 && bebidasToDeduct > 0) {
                      toast({ title: "Advertencia de Stock", description: `El stock de "Bebida 1.5Lt" es ahora ${updatedInventory[bebidaIndex].stock}.`, variant: "default"});
                  }
              }
          }
          if ([5,6,7,8].includes(promoNum)) {
              const lataIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'lata');
              if (lataIndex !== -1) {
                  const latasToDeduct = orderItem.quantity * 2; 
                  updatedInventory[lataIndex].stock -= latasToDeduct;
                  inventoryUpdateOccurred = true;
                  if (updatedInventory[lataIndex].stock < 0 && latasToDeduct > 0) {
                       toast({ title: "Advertencia de Stock", description: `El stock de "Lata" es ahora ${updatedInventory[lataIndex].stock}.`, variant: "default"});
                  }
              }
          }
           if (promoNum === 5 || promoNum === 9) { 
              const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
               if (vienaIndex !== -1) {
                  const vienesasNeeded = promoNum === 5 ? orderItem.quantity * 2 : orderItem.quantity * 4; 
                  updatedInventory[vienaIndex].stock -= vienesasNeeded;
                  inventoryUpdateOccurred = true;
                   if (updatedInventory[vienaIndex].stock < 0 && vienesasNeeded > 0) {
                       toast({ title: "Advertencia de Stock", description: `El stock de "Vienesas" es ahora ${updatedInventory[vienaIndex].stock}.`, variant: "default"});
                   }
               }
          }
           if (promoNum === 6 || promoNum === 10) { 
               const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
               if (vienaIndex !== -1) {
                   const vienesasNeeded = promoNum === 6 ? orderItem.quantity * 4 : orderItem.quantity * 8; 
                   updatedInventory[vienaIndex].stock -= vienesasNeeded;
                   inventoryUpdateOccurred = true;
                    if (updatedInventory[vienaIndex].stock < 0 && vienesasNeeded > 0) {
                       toast({ title: "Advertencia de Stock", description: `El stock de "Vienesas" es ahora ${updatedInventory[vienaIndex].stock}.`, variant: "default"});
                   }
               }
           }
      }
       if (orderItem.category === 'Papas Fritas') {
            if (itemNameLower === 'box cami') {
                const empanadaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'empanada');
                if (empanadaIndex !== -1) {
                     const empanadasToDeduct = 8 * orderItem.quantity; 
                     updatedInventory[empanadaIndex].stock -= empanadasToDeduct;
                     inventoryUpdateOccurred = true;
                     if (updatedInventory[empanadaIndex].stock < 0 && empanadasToDeduct > 0) {
                        toast({ title: "Advertencia de Stock", description: `El stock de "Empanada" es ahora ${updatedInventory[empanadaIndex].stock}.`, variant: "default"});
                     }
                }
                const bebidaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'bebida 1.5lt');
                if (bebidaIndex !== -1) {
                    const bebidasToDeduct = orderItem.quantity; 
                    updatedInventory[bebidaIndex].stock -= bebidasToDeduct;
                    inventoryUpdateOccurred = true;
                     if (updatedInventory[bebidaIndex].stock < 0 && bebidasToDeduct > 0) {
                        toast({ title: "Advertencia de Stock", description: `El stock de "Bebida 1.5Lt" es ahora ${updatedInventory[bebidaIndex].stock}.`, variant: "default"});
                     }
                }
            } else if (itemNameLower === 'salchipapas') {
                const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
                if (vienaIndex !== -1) {
                    const vienesasNeeded = orderItem.quantity * 3; 
                    updatedInventory[vienaIndex].stock -= vienesasNeeded;
                    inventoryUpdateOccurred = true;
                     if (updatedInventory[vienaIndex].stock < 0 && vienesasNeeded > 0) {
                        toast({ title: "Advertencia de Stock", description: `El stock de "Vienesas" es ahora ${updatedInventory[vienaIndex].stock}.`, variant: "default"});
                     }
                }
            }
       }


      if (inventoryItemName) {
        const itemIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === inventoryItemName.toLowerCase());
        if (itemIndex !== -1) {
          updatedInventory[itemIndex].stock -= quantityToDeduct;
          inventoryUpdateOccurred = true;
          if (updatedInventory[itemIndex].stock < 0 && quantityToDeduct > 0) { 
               toast({
                   title: "Advertencia de Stock",
                   description: `El stock de "${inventoryItemName}" es ahora ${updatedInventory[itemIndex].stock}.`,
                   variant: "default", 
               });
          }
        }
      }
    });

    if (inventoryUpdateOccurred) {
      setInventory(updatedInventory);
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
    }

    const customerReceipt = formatCustomerReceipt(orderToPay.items, paidAmount, paymentMethod, tableDisplayName, orderToPay.orderNumber, orderToPay.deliveryInfo, tipForFinalPayment);
    printHtml(customerReceipt);

    const cashMovementDescription = isDelivery
      ? `Venta Delivery #${String(orderToPay.orderNumber).padStart(3,'0')} a ${orderToPay.deliveryInfo?.name || 'Cliente'}`
      : `${tableDisplayName} - Orden #${String(orderToPay.orderNumber).padStart(3,'0')}`;

    // Calculate saleAmount (paidAmount - tip - deliveryFee of this specific paid order)
    const deliveryFeeOfPaidOrder = isDelivery && orderToPay.deliveryInfo ? orderToPay.deliveryInfo.deliveryFee : 0;
    const saleAmountForMovement = paidAmount - tipForFinalPayment - deliveryFeeOfPaidOrder;


    const descriptionWithTip = tipForFinalPayment > 0
        ? `${cashMovementDescription} (Propina: ${formatCurrency(tipForFinalPayment)})`
        : cashMovementDescription;

    const newCashMovement: CashMovement = {
      id: Date.now(), 
      date: new Date(),
      category: 'Ingreso Venta',
      description: descriptionWithTip,
      amount: saleAmountForMovement, 
      paymentMethod: paymentMethod,
      deliveryFee: deliveryFeeOfPaidOrder 
    };

    const storedCashMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    let cashMovements: CashMovement[] = [];
    if (storedCashMovements) {
        try {
            const parsedMovements = JSON.parse(storedCashMovements);
            if(Array.isArray(parsedMovements)) cashMovements = parsedMovements;
        } catch {
            cashMovements = [];
        }
    }
    cashMovements.push(newCashMovement);
    sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(cashMovements));

    const updatedPendingOrderGroups = pendingOrderGroups.filter(group => group.orderNumber !== orderToPay!.orderNumber);
    setPendingOrderGroups(updatedPendingOrderGroups);

    setIsPaymentDialogOpen(false);
    const paidOrderInfo = orderToPay; 
    setOrderToPay(null);
    setSubtotalForPayment(null); // Reset temporary state
    setTipForFinalPayment(null); // Reset temporary state


    if (isDelivery && paidOrderInfo?.deliveryInfo) {
        const remainingDeliveryOrders = updatedPendingOrderGroups.filter(group => group.deliveryInfo);
        if (remainingDeliveryOrders.length === 0 && currentOrder.length === 0) {
            console.log("TableDetailPage: Last delivery order paid, and no current order. Clearing current deliveryInfo state.");
            setDeliveryInfo(null); 
        }
    }


    toast({ title: "Pago Realizado", description: `Pago de ${formatCurrency(paidAmount)} con ${paymentMethod} registrado.` });
  };

  const handleOpenModificationDialog = (item: MenuItem) => {
    setItemToModify(item);
    setIsModificationDialogOpen(true);
  };

  const handleConfirmModification = (modifications?: string[], observationText?: string) => {
    if (itemToModify) {
      handleAddItemToOrder(itemToModify, modifications, observationText);
    }
    setIsModificationDialogOpen(false);
    setItemToModify(null);
  };

  const currentOrderTotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  }, [currentOrder]);

  const groupedMenu = useMemo(() => {
    const filteredMenu = menu.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: { [key: string]: MenuItem[] } = {};
    const uniqueCategoriesInFilteredMenu = new Set<string>();

    filteredMenu.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
      uniqueCategoriesInFilteredMenu.add(item.category);
    });

    const finalCategoryOrder = Array.from(uniqueCategoriesInFilteredMenu).sort((a, b) => {
        const indexA = predefinedOrderedCategories.indexOf(a);
        const indexB = predefinedOrderedCategories.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB; 
        if (indexA !== -1) return -1; 
        if (indexB !== -1) return 1;  
        return a.localeCompare(b); 
    });


    return finalCategoryOrder.reduce((acc, categoryName) => {
        if (groups[categoryName]) {
            acc[categoryName] = groups[categoryName];
        }
        return acc;
    }, {} as { [key: string]: MenuItem[] });

  }, [menu, searchTerm]);


  const handleDeliveryInfoConfirm = (info: DeliveryInfo) => {
    setDeliveryInfo(info);
    setIsDeliveryDialogOpen(false);
    toast({ title: "Datos de Envío Guardados", description: `Enviando a ${info.name}.` });
    setIsMenuSheetOpen(true);
  };

  const handleDeliveryInfoCancel = () => {
    if (!deliveryInfo && pendingOrderGroups.length === 0 && currentOrder.length === 0) {
        router.push('/tables');
        toast({ title: "Envío Cancelado", description: "Se canceló el ingreso de datos de envío.", variant: "destructive" });
    } else {
        setIsDeliveryDialogOpen(false); 
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategoryForDialog(categoryName);
    setIsProductListDialogOpen(true); 
    setIsMenuSheetOpen(false); 
  };

  const handleOpenMenuOrDeliveryDialog = () => {
    if (isDelivery && !deliveryInfo && currentOrder.length === 0 && pendingOrderGroups.filter(pg => pg.deliveryInfo).length === 0) {
      setIsDeliveryDialogOpen(true);
    } else if (isDelivery && !deliveryInfo && currentOrder.length > 0) {
       setIsDeliveryDialogOpen(true);
    }
    else {
      setIsMenuSheetOpen(true); 
    }
  };


  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando datos de la mesa...</div>;
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push('/tables')} className="bg-secondary hover:bg-secondary/80">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mesas
        </Button>
        <h1 className="text-3xl font-bold">{tableDisplayName}</h1>
        <div></div> 
      </div>

        <div className="flex justify-center mb-6">
             <Button size="lg" className="px-8 py-6 text-lg" onClick={handleOpenMenuOrDeliveryDialog}>
                <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
            </Button>
        </div>

        <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
            <SheetContent side="left" className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl p-0"> 
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-2xl">Categorías del Menú</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-80px)]"> 
                <div className="p-4 space-y-2">
                  {Object.keys(groupedMenu).length === 0 && (
                    <p className="text-muted-foreground text-center">No se encontraron categorías.</p>
                  )}
                  {Object.keys(groupedMenu).map((category) => (
                      <Button
                        key={category}
                        variant="outline"
                        className="w-full justify-start text-lg py-6" 
                        onClick={() => handleCategoryClick(category)}
                      >
                        {category}
                      </Button>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
        </Sheet>

        <ShadDialog open={isProductListDialogOpen} onOpenChange={setIsProductListDialogOpen}>
            <ShadDialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-3xl xl:max-w-4xl h-[90vh]"> 
                <ShadDialogHeader>
                    <ShadDialogTitle className="text-2xl">
                        Productos en {selectedCategoryForDialog}
                    </ShadDialogTitle>
                </ShadDialogHeader>
                <ScrollArea className="h-[calc(90vh-150px)] pr-3"> 
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4"> 
                        {selectedCategoryForDialog &&
                            menu
                                .filter(item => item.category === selectedCategoryForDialog)
                                .map(item => (
                                    <Card
                                        key={item.id}
                                        className="cursor-pointer hover:shadow-lg transition-shadow flex flex-col" 
                                        onClick={() =>
                                            (item.modifications && item.modifications.length > 0)
                                                ? handleOpenModificationDialog(item)
                                                : handleAddItemToOrder(item)
                                        }
                                    >
                                        <CardHeader className="pb-2 pt-3 px-3">
                                            <CardTitle className="text-base leading-tight font-semibold">{item.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-xs text-muted-foreground px-3 pb-2 flex-grow"> 
                                            {item.ingredients && item.ingredients.length > 0 && (
                                                <p className="italic overflow-hidden text-ellipsis whitespace-nowrap">
                                                    ({item.ingredients.join(', ')})
                                                </p>
                                            )}
                                        </CardContent>
                                        <CardFooter className="px-3 pb-3 pt-1 mt-auto"> 
                                            <span className="text-sm font-bold text-primary">{formatCurrency(item.price)}</span>
                                        </CardFooter>
                                    </Card>
                                ))}
                         {selectedCategoryForDialog && menu.filter(item => item.category === selectedCategoryForDialog).length === 0 && (
                            <p className="col-span-full text-center text-muted-foreground">No hay productos en esta categoría.</p>
                         )}
                    </div>
                </ScrollArea>
                <ShadDialogFooter className="p-4 border-t"> 
                     <Button variant="outline" onClick={() => { setIsProductListDialogOpen(false); setIsMenuSheetOpen(true); }}>Volver a Categorías</Button>
                </ShadDialogFooter>
            </ShadDialogContent>
        </ShadDialog>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Pedido Actual</CardTitle>
            {isDelivery && deliveryInfo && ( 
                <CardDescription className="text-sm font-bold">
                    Para: {deliveryInfo.name} ({deliveryInfo.address}) - Envío: {formatCurrency(deliveryInfo.deliveryFee)}
                </CardDescription>
            )}
          </CardHeader>
          <ScrollArea className="flex-grow max-h-[calc(100vh-420px)] min-h-[200px] p-1"> 
            <CardContent className="p-4">
                {currentOrder.length === 0 ? (
                <p className="text-muted-foreground font-bold">No hay productos en el pedido actual.</p>
                ) : (
                currentOrder.map((item) => (
                    <div key={item.orderItemId} className="mb-3 pb-3 border-b last:border-b-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-sm leading-tight">{item.category.toUpperCase()}</p>
                                <p className="font-bold text-base leading-tight">{item.name}</p>
                                {item.selectedModifications && item.selectedModifications.length > 0 && (
                                <p className="text-xs text-primary font-bold">({item.selectedModifications.join(', ')})</p>
                                )}
                                {item.observation && (
                                  <p className="text-xs text-blue-600 font-bold">Obs: {item.observation}</p>
                                )}
                            </div>
                            <p className="font-bold text-base">{formatCurrency(item.finalPrice * item.quantity)}</p>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleDecreaseQuantity(item.orderItemId)}
                                disabled={item.quantity <= 1}
                            >
                                <MinusCircle className="h-4 w-4" />
                            </Button>
                            <span className="font-bold w-5 text-center">{item.quantity}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary"
                                onClick={() => handleIncreaseQuantity(item.orderItemId)}
                            >
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive/90"
                                onClick={() => handleRemoveItemFromOrder(item.orderItemId)}
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))
                )}
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-4 border-t flex-col items-stretch gap-3 mt-auto"> 
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="font-bold">Total Actual:</span>
              <span className="font-bold">{formatCurrency(currentOrderTotal)}</span>
            </div>
            <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Pedidos Pendientes de Pago</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow max-h-[calc(100vh-300px)] min-h-[200px] p-1"> 
             <CardContent className="p-4">
                {pendingOrderGroups.length === 0 ? (
                  <p className="text-muted-foreground font-bold">No hay pedidos pendientes de pago.</p>
                ) : (
                  pendingOrderGroups.map((group) => {
                    const groupTotal = group.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) +
                                       (isDelivery && group.deliveryInfo ? group.deliveryInfo.deliveryFee : 0);
                    return (
                      <Card key={group.orderNumber} className="mb-4 shadow-md">
                        <CardHeader className="pb-2 pt-3 px-3 bg-muted/30 rounded-t-lg">
                           <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-semibold">
                                    Orden #{String(group.orderNumber).padStart(3, '0')}
                                    {isDelivery && group.deliveryInfo && ( 
                                        <span className="text-xs font-normal text-muted-foreground ml-2 font-bold">
                                            ({group.deliveryInfo.name})
                                        </span>
                                    )}
                                </CardTitle>
                                <Badge variant="outline" className="text-sm font-bold">{formatCurrency(groupTotal)}</Badge>
                           </div>
                        </CardHeader>
                        <CardContent className="p-3 text-xs">
                          {group.items.map(item => (
                            <div key={item.orderItemId} className="mb-1 flex justify-between">
                              <span className="font-bold">
                                {item.quantity}x {item.name}
                                {item.selectedModifications && item.selectedModifications.length > 0 && (
                                  <span className="text-primary font-bold"> ({item.selectedModifications.join(', ')})</span>
                                )}
                                 {item.observation && (
                                  <p className="text-blue-600 font-bold text-xs">Obs: {item.observation}</p>
                                )}
                              </span>
                              <span className="font-bold">{formatCurrency(item.finalPrice * item.quantity)}</span>
                            </div>
                          ))}
                           {isDelivery && group.deliveryInfo && group.deliveryInfo.deliveryFee > 0 && ( 
                               <div className="mt-1 pt-1 border-t border-dashed flex justify-between">
                                   <span className="font-bold">Costo Envío:</span>
                                   <span className="font-bold">{formatCurrency(group.deliveryInfo.deliveryFee)}</span>
                               </div>
                           )}
                        </CardContent>
                        <CardFooter className="p-3 border-t flex-col gap-2">
                            <Button onClick={() => handleOpenPrintCustomerCopyDialog(group)} className="w-full" size="sm" variant="outline">
                                <Copy className="mr-2 h-4 w-4" /> Imprimir Copia Cliente
                            </Button>
                            <Button onClick={() => handleFinalizeAndPaySelectedOrder(group)} className="w-full" size="sm">
                                <CreditCard className="mr-2 h-4 w-4" /> Cobrar Pedido #{String(group.orderNumber).padStart(3, '0')}
                            </Button>
                        </CardFooter>
                      </Card>
                    );
                  })
                )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>

      <ModificationDialog
        isOpen={isModificationDialogOpen}
        onOpenChange={setIsModificationDialogOpen}
        item={itemToModify}
        onConfirm={handleConfirmModification}
        onCancel={() => setIsModificationDialogOpen(false)}
      />
      
      {/* Dialog to confirm tip for customer copy */}
      <AlertDialog open={isConfirmTipForCopyDialogOpen} onOpenChange={setIsConfirmTipForCopyDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Propina para Copia Cliente</AlertDialogTitle>
                <AlertDialogDescription>
                    ¿Desea incluir una propina sugerida del 10% en esta copia para el cliente?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => handleConfirmPrintCustomerCopy(false)}>No Incluir</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleConfirmPrintCustomerCopy(true)}>Sí, Incluir Propina</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog to confirm tip for FINAL payment */}
        <AlertDialog open={isConfirmTipDialogOpen} onOpenChange={setIsConfirmTipDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Propina para Pago Final</AlertDialogTitle>
                    <AlertDialogDescription>
                        ¿Desea incluir una propina del 10% en el pago final?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => handleConfirmTipForPayment(false)}>No, Sin Propina</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleConfirmTipForPayment(true)}>Sí, Añadir 10% Propina</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


      {orderToPay && ( 
          <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            totalAmount={totalForPayment} 
            onConfirm={handlePaymentConfirm}
          />
      )}

       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo} 
               onConfirm={handleDeliveryInfoConfirm}
               onCancel={handleDeliveryInfoCancel} 
           />
       )}
    </div>
  );
}

