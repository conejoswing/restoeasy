
'use client';

import * as React from 'react';
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useRouter }from 'next/navigation';
import {Button, buttonVariants }from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {ScrollArea }from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';


import { PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard, PackageSearch, Copy, Utensils } from 'lucide-react';
import {useToast }from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import PaymentDialog from '@/components/app/payment-dialog';
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page';
import type { DeliveryInfo } from '@/components/app/delivery-dialog';
import DeliveryDialog from '@/components/app/delivery-dialog';
import { formatKitchenOrderReceipt, formatCustomerReceipt, printHtml, formatPendingOrderCopy } from '@/lib/printUtils';
import type { InventoryItem } from '@/app/inventory/page';
import type { MenuItem } from '@/types/menu';
import { loadMenuData, orderedCategories as predefinedOrderedCategories, sortMenu } from '@/lib/menuUtils';
import {
  Dialog as ShadDialog,
  // DialogClose as ShadDialogClose, // Not used in this version
  DialogContent as ShadDialogContent,
  DialogDescription as ShadDialogDescription,
  DialogFooter as ShadDialogFooter,
  DialogHeader as ShadDialogHeader,
  DialogTitle as ShadDialogTitle,
} from '@/components/ui/dialog';


export interface OrderItem extends Omit<MenuItem, 'price' | 'modificationPrices' | 'modifications'> {
  orderItemId: string;
  quantity: number;
  selectedModifications?: string[];
  basePrice: number;
  finalPrice: number;
  ingredients: string[];
  orderNumber?: number;
  category: string;
  observation?: string;
}


export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia';

interface PendingOrderGroup {
  orderNumber: number;
  items: OrderItem[];
  deliveryInfo?: DeliveryInfo | null;
  timestamp: number;
  generalObservation?: string;
  tipAmountForPayment?: number;
}

const INVENTORY_STORAGE_KEY = 'restaurantInventory';
const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';
const PENDING_ORDERS_STORAGE_KEY_PREFIX = 'table-';
const ORDER_NUMBER_STORAGE_KEY = 'lastOrderNumber';


const globalFormatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

interface TableDetailClientProps {
  tableId: string;
}


export default function TableDetailClient({ tableId }: TableDetailClientProps) {
  const router = useRouter();
  const tableIdParam = tableId;
  const { toast } = useToast();

  const [isInitialized, setIsInitialized] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrderGroups, setPendingOrderGroups] = useState<PendingOrderGroup[]>([]);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [itemToModify, setItemToModify] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [totalForPayment, setTotalForPayment] = useState(0);
  const [subtotalForPayment, setSubtotalForPayment] = useState<number | null>(null);
  const [tipForFinalPayment, setTipForFinalPayment] = useState(0);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState(0);
  const [orderToPay, setOrderToPay] = useState<PendingOrderGroup | null>(null);

  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [selectedCategoryForDialog, setSelectedCategoryForDialog] = useState<string | null>(null);
  const [isProductListDialogOpen, setIsProductListDialogOpen] = useState(false);


  const [isConfirmTipForCopyDialogOpen, setIsConfirmTipForCopyDialogOpen] = useState(false);
  const [orderGroupForCopy, setOrderGroupForCopy] = useState<PendingOrderGroup | null>(null);

  const [isGeneralObservationDialogOpen, setIsGeneralObservationDialogOpen] = useState(false);
  const [currentGeneralObservation, setCurrentGeneralObservation] = useState('');


  const isDelivery = useMemo(() => tableIdParam === 'delivery', [tableIdParam]);
  const isMeson = useMemo(() => tableIdParam.toLowerCase() === 'mesón', [tableIdParam]);

  const tableDisplayName = useMemo(() => {
    if (isDelivery) return 'Delivery';
    if (isMeson) return 'Mesón';
    if (!isNaN(Number(tableIdParam))) return `Mesa ${tableIdParam}`;
    const decodedId = decodeURIComponent(tableIdParam);
    return decodedId.charAt(0).toUpperCase() + decodedId.slice(1);
  }, [tableIdParam, isDelivery, isMeson]);


  useEffect(() => {
    if (!tableIdParam || isInitialized) return;

    console.log(`Initializing TableDetailClient for tableId: ${tableIdParam}`);

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
          } as OrderItem)));
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
                        } as OrderItem)),
                        generalObservation: group.generalObservation || undefined,
                        tipAmountForPayment: group.tipAmountForPayment ?? 0,
                    })).sort((a: PendingOrderGroup, b: PendingOrderGroup) => a.timestamp - b.timestamp)
                 );
             } else if (Array.isArray(parsedData)) { // Fallback for old format if it was just an array of groups
                 setPendingOrderGroups(
                    parsedData.map((group: PendingOrderGroup) => ({
                        ...group,
                        items: group.items.map((item: any) => ({
                            ...item,
                            observation: item.observation || undefined,
                        } as OrderItem)),
                         generalObservation: group.generalObservation || undefined,
                         tipAmountForPayment: group.tipAmountForPayment ?? 0,
                    })).sort((a: PendingOrderGroup, b: PendingOrderGroup) => a.timestamp - b.timestamp)
                 );
             }
        } catch (e) { console.error("Error loading pending orders:", e); }
    }

     const storedOrderNumber = localStorage.getItem(ORDER_NUMBER_STORAGE_KEY);
     setLastOrderNumber(storedOrderNumber ? parseInt(storedOrderNumber, 10) : 0);

    if (isDelivery && currentOrder.length === 0 && !pendingOrderGroups.some(pg => pg.deliveryInfo)) {
        // For a fresh delivery "table", ensure deliveryInfo state for current order is null
        setDeliveryInfo(null);
    }


    setIsInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, isInitialized, isDelivery]);


  useEffect(() => {
    const handleMenuUpdate = () => {
      console.log('TableDetailClient: Detected menu update. Reloading menu data.');
      setMenu(loadMenuData());
    };
    window.addEventListener('menuUpdated', handleMenuUpdate);
    return () => window.removeEventListener('menuUpdated', handleMenuUpdate);
  }, []);


 useEffect(() => {
    if (!isInitialized || !tableIdParam) return;

    console.log(`TableDetailClient: Saving currentOrder for ${tableIdParam}`, currentOrder);
    sessionStorage.setItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-currentOrder`, JSON.stringify(currentOrder));

    console.log(`TableDetailClient: Saving pendingOrderGroups for ${tableIdParam}`, pendingOrderGroups);
    sessionStorage.setItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-pendingOrders`, JSON.stringify({ groups: pendingOrderGroups }));


    const hasPending = pendingOrderGroups.length > 0;
    const hasCurrent = currentOrder.length > 0;


    let isEffectivelyOccupied = false;
    if (isDelivery) {
        isEffectivelyOccupied = hasCurrent || pendingOrderGroups.some(pg => !!pg.deliveryInfo);
    } else {
        isEffectivelyOccupied = hasCurrent || hasPending;
    }

    let newStatus: 'available' | 'occupied' = isEffectivelyOccupied ? 'occupied' : 'available';
    const storageKey = `table-${tableIdParam}-status`;
    const oldStatus = sessionStorage.getItem(storageKey) as 'available' | 'occupied' | null;

    sessionStorage.setItem(storageKey, newStatus); // Always write the current calculated status

    if (oldStatus !== newStatus || (oldStatus === null && newStatus === 'occupied')) {
      console.log(`TableDetailClient: Table ${tableIdParam} status in sessionStorage ${oldStatus === null ? 'was unset and now' : 'actually changed from ' + (oldStatus ?? 'unset') + ' to'} ${newStatus}. Dispatching 'tableStatusUpdated' event. hasPending: ${hasPending}, hasCurrent: ${hasCurrent}, isDeliveryOccupied: ${isEffectivelyOccupied}`);
      window.dispatchEvent(new CustomEvent('tableStatusUpdated'));
    } else if (oldStatus === newStatus) {
        // console.log(`TableDetailClient: Table ${tableIdParam} status in sessionStorage remains ${newStatus}. No event dispatched. hasPending: ${hasPending}, hasCurrent: ${hasCurrent}, isDeliveryOccupied: ${isEffectivelyOccupied}`);
    }


  }, [currentOrder, pendingOrderGroups, tableIdParam, isInitialized, isDelivery]);

  const handleOpenMenuOrDeliveryDialog = () => {
    if (isDelivery && !deliveryInfo && currentOrder.length === 0 && !pendingOrderGroups.some(pg => pg.deliveryInfo)) {
        setIsDeliveryDialogOpen(true);
    } else {
        setIsMenuSheetOpen(true);
    }
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategoryForDialog(categoryName);
    setIsProductListDialogOpen(true); // Open the new product list dialog
    setIsMenuSheetOpen(false); // Close the category sheet
  };

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
      setIsProductListDialogOpen(false); // Close the product list dialog
      setItemToModify(null);
      setIsModificationDialogOpen(false);
  };

  const handleProductCardClick = (item: MenuItem) => {
    if (item.modifications && item.modifications.length > 0) {
      setItemToModify(item);
      setIsModificationDialogOpen(true);
      // ProductListDialog remains open in background
    } else {
      handleAddItemToOrder(item); // This will also close ProductListDialog
    }
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
     if (isDelivery && currentOrder.length > 0 && !deliveryInfo) {
        toast({ title: "Faltan Datos de Envío", description: "Por favor, ingrese los datos de envío para este pedido.", variant: "destructive" });
        setIsDeliveryDialogOpen(true);
        return;
    }
    setCurrentGeneralObservation('');
    setIsGeneralObservationDialogOpen(true);
  };

  const handleConfirmPrintKitchenOrderWithObservation = () => {
    if (currentOrder.length === 0) {
        toast({ title: "Pedido Vacío", description: "Añada productos antes de imprimir la comanda.", variant: "destructive" });
        setIsGeneralObservationDialogOpen(false);
        return;
    }

    const orderNumber = getNextOrderNumber();
    const orderWithNumber = currentOrder.map(item => ({ ...item, orderNumber }));

    const currentDeliveryInfoToUse = isDelivery ? deliveryInfo : null;


    const kitchenReceipt = formatKitchenOrderReceipt(
        orderWithNumber,
        tableDisplayName,
        orderNumber,
        currentDeliveryInfoToUse,
        currentGeneralObservation
    );
    printHtml(kitchenReceipt);

    setPendingOrderGroups(prevGroups => [
        ...prevGroups,
        {
            orderNumber,
            items: orderWithNumber,
            deliveryInfo: currentDeliveryInfoToUse,
            timestamp: Date.now(),
            generalObservation: currentGeneralObservation,
            tipAmountForPayment: 0,
        }
    ].sort((a,b) => a.timestamp - b.timestamp));

    setCurrentOrder([]);
    setCurrentGeneralObservation('');
    setIsGeneralObservationDialogOpen(false);
    toast({ title: "Comanda Impresa", description: `Pedido #${String(orderNumber).padStart(3,'0')} enviado a cocina y movido a pendientes.` });

    if (isDelivery) {
      setDeliveryInfo(null);
    }
  };


  const handleReprintKitchenOrder = (groupToReprint: PendingOrderGroup) => {
    if (!groupToReprint || groupToReprint.items.length === 0) {
      toast({ title: "Error", description: "No hay pedido para reimprimir o está vacío.", variant: "destructive" });
      return;
    }
    const kitchenReceipt = formatKitchenOrderReceipt(
      groupToReprint.items,
      tableDisplayName,
      groupToReprint.orderNumber,
      groupToReprint.deliveryInfo,
      groupToReprint.generalObservation
    );
    printHtml(kitchenReceipt);
    toast({ title: "Comanda Reimpresa", description: `Se reimprimió la comanda del pedido #${String(groupToReprint.orderNumber).padStart(3, '0')}.` });
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


    setPendingOrderGroups(prevGroups =>
        prevGroups.map(group =>
            group.orderNumber === orderGroupForCopy.orderNumber
                ? { ...group, tipAmountForPayment: tipForCopy }
                : group
        )
    );

    toast({ title: "Copia Impresa", description: `Se imprimió una copia del pedido #${String(orderGroupForCopy.orderNumber).padStart(3, '0')}. Propina decidida: ${globalFormatCurrency(tipForCopy)}` });
    setIsConfirmTipForCopyDialogOpen(false);
    setOrderGroupForCopy(null);
  };


  const handleFinalizeAndPaySelectedOrder = (groupToPay: PendingOrderGroup) => {
    if (!groupToPay || groupToPay.items.length === 0) {
        toast({ title: "Error", description: "No hay pedido pendiente seleccionado para pagar o está vacío.", variant: "destructive" });
        return;
    }
    setOrderToPay(groupToPay);

    const currentSubtotal = groupToPay.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    setSubtotalForPayment(currentSubtotal);

    let deliveryFeeForThisOrder = 0;
    if (isDelivery && groupToPay.deliveryInfo && groupToPay.deliveryInfo.deliveryFee > 0) {
      deliveryFeeForThisOrder = groupToPay.deliveryInfo.deliveryFee;
    }

    const tipForThisPayment = groupToPay.tipAmountForPayment ?? 0;
    setTipForFinalPayment(tipForThisPayment);

    const finalAmountForDialog = currentSubtotal + deliveryFeeForThisOrder + tipForThisPayment;
    setTotalForPayment(finalAmountForDialog);

    setIsPaymentDialogOpen(true);
  };

 const handleDeletePendingOrder = (orderNumberToDelete: number) => {
    setPendingOrderGroups(prevGroups => {
        const updatedGroups = prevGroups.filter(group => group.orderNumber !== orderNumberToDelete);
        if (isDelivery) {
            // If it was a delivery order and no more delivery orders are pending, and no current delivery order is being built, reset deliveryInfo
            const remainingDeliveryOrders = updatedGroups.some(group => group.deliveryInfo);
            if (!remainingDeliveryOrders && currentOrder.length === 0) {
                setDeliveryInfo(null);
            }
        }
        return updatedGroups;
    });
    toast({ title: "Pedido Eliminado", description: `El pedido #${String(orderNumberToDelete).padStart(3, '0')} ha sido eliminado de pendientes.`, variant: "destructive" });
  };


  const handlePaymentConfirm = (paymentMethod: PaymentMethod, paidAmount: number) => {
    if (!orderToPay || subtotalForPayment === null) {
      toast({ title: "Error", description: "No hay un pedido o subtotal para procesar el pago.", variant: "destructive" });
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
            const fajitaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'fajita');
            if(fajitaIndex !== -1){
                 updatedInventory[fajitaIndex].stock -= orderItem.quantity;
                 inventoryUpdateOccurred = true;
                  if (updatedInventory[fajitaIndex].stock < 0 && orderItem.quantity > 0) {
                    toast({ title: "Advertencia de Stock", description: `El stock de "Fajita" es ahora ${updatedInventory[fajitaIndex].stock}.`, variant: "default"});
                 }
            }
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
             quantityToDeduct = orderItem.quantity *1; // Each promo item uses 1 pan de marraqueta

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
             quantityToDeduct = orderItem.quantity *1; // Each promo item uses 1 pan de marraqueta


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
           inventoryItemName = 'Pan de hamburguesa normal';
           quantityToDeduct = orderItem.quantity * 2;
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


          if (promoNum === 5 || promoNum === 7) { inventoryItemName = 'Pan especial normal'; quantityToDeduct = orderItem.quantity * 2; }
          if (promoNum === 6 || promoNum === 8) { inventoryItemName = 'Pan especial grande'; quantityToDeduct = orderItem.quantity * 2; }

          if (promoNum === 9 || promoNum === 11) { inventoryItemName = 'Pan especial normal'; quantityToDeduct = orderItem.quantity * 4; }
          if (promoNum === 10 || promoNum === 12) { inventoryItemName = 'Pan especial grande'; quantityToDeduct = orderItem.quantity * 4; }



          if ([1,2,3,9,10,11,12].includes(promoNum)) {
              const bebida15Index = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'bebida 1.5lt');
              if (bebida15Index !== -1) {
                const bebidasToDeduct = orderItem.quantity;
                updatedInventory[bebida15Index].stock -= bebidasToDeduct;
                inventoryUpdateOccurred = true;
                if (updatedInventory[bebida15Index].stock < 0 && bebidasToDeduct > 0) {
                    toast({ title: "Advertencia de Stock", description: `El stock de "Bebida 1.5Lt" es ahora ${updatedInventory[bebida15Index].stock}.`, variant: "default"});
                }
              }
          }
          if ([5, 6, 7, 8].includes(promoNum)) {
              const bebidaLataIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'lata');
              if (bebidaLataIndex !== -1) {
                const latasToDeduct = orderItem.quantity * 2;
                updatedInventory[bebidaLataIndex].stock -= latasToDeduct;
                inventoryUpdateOccurred = true;
                if (updatedInventory[bebidaLataIndex].stock < 0 && latasToDeduct > 0) {
                    toast({ title: "Advertencia de Stock", description: `El stock de "Lata" es ahora ${updatedInventory[bebidaLataIndex].stock}.`, variant: "default"});
                }
              }
          }


          if (promoNum === 5) {
             const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
             if (vienaIndex !== -1) { updatedInventory[vienaIndex].stock -= orderItem.quantity * 2; inventoryUpdateOccurred = true; }
          }
          if (promoNum === 6) {
             const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
             if (vienaIndex !== -1) { updatedInventory[vienaIndex].stock -= orderItem.quantity * 4; inventoryUpdateOccurred = true; }
          }
          if (promoNum === 9) {
             const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
             if (vienaIndex !== -1) { updatedInventory[vienaIndex].stock -= orderItem.quantity * 4; inventoryUpdateOccurred = true; }
          }
          if (promoNum === 10) {
             const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
             if (vienaIndex !== -1) { updatedInventory[vienaIndex].stock -= orderItem.quantity * 8; inventoryUpdateOccurred = true; }
          }
        }


      if (orderItem.category === 'Papas Fritas' && itemNameLower === 'box cami') {
          const empanadaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'empanada');
          if (empanadaIndex !== -1) { updatedInventory[empanadaIndex].stock -= orderItem.quantity * 8; inventoryUpdateOccurred = true; }

          const bebida15Index = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'bebida 1.5lt');
          if (bebida15Index !== -1) { updatedInventory[bebida15Index].stock -= orderItem.quantity * 1; inventoryUpdateOccurred = true; }
      }

      if (orderItem.category === 'Papas Fritas' && itemNameLower === 'salchipapas') {
          const vienaIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
          if (vienaIndex !== -1) { updatedInventory[vienaIndex].stock -= orderItem.quantity * 3; inventoryUpdateOccurred = true; }
      }



      if (inventoryItemName) {
        const itemIndex = updatedInventory.findIndex(invItem => invItem.name.toLowerCase() === inventoryItemName.toLowerCase());
        if (itemIndex !== -1) {
          updatedInventory[itemIndex].stock -= quantityToDeduct;
          inventoryUpdateOccurred = true;

           if (updatedInventory[itemIndex].stock < 0 && quantityToDeduct > 0) {
             toast({ title: "Advertencia de Stock", description: `El stock de "${updatedInventory[itemIndex].name}" es ahora ${updatedInventory[itemIndex].stock}.`, variant: "default"});
           }
        } else {
          console.warn(`Inventory item "${inventoryItemName}" not found for deduction.`);
        }
      }
    });

    if (inventoryUpdateOccurred) {
      setInventory(updatedInventory);
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
    }

    const customerReceiptHtml = formatCustomerReceipt(
      orderToPay.items,
      paidAmount,
      paymentMethod,
      tableDisplayName,
      orderToPay.orderNumber,
      orderToPay.deliveryInfo,
      tipForFinalPayment
    );
    printHtml(customerReceiptHtml);

    const cashMovement: CashMovement = {
      id: Date.now(),
      date: new Date(),
      category: 'Ingreso Venta',
      description: `Venta ${tableDisplayName} - Orden #${String(orderToPay.orderNumber).padStart(3, '0')}${tipForFinalPayment > 0 ? ` (Propina: ${globalFormatCurrency(tipForFinalPayment)})` : ''}`,
      amount: subtotalForPayment,
      paymentMethod: paymentMethod,
      deliveryFee: (isDelivery && orderToPay.deliveryInfo && orderToPay.deliveryInfo.deliveryFee > 0) ? orderToPay.deliveryInfo.deliveryFee : undefined,
    };

    const storedMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    const currentMovements: CashMovement[] = storedMovements ? JSON.parse(storedMovements) : [];
    currentMovements.push(cashMovement);
    sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(currentMovements));

    setPendingOrderGroups(prevGroups => prevGroups.filter(group => group.orderNumber !== orderToPay!.orderNumber));

    toast({ title: "Pago Registrado", description: `Pago de ${globalFormatCurrency(paidAmount)} para la orden #${String(orderToPay.orderNumber).padStart(3, '0')} registrado.` });
    setIsPaymentDialogOpen(false);
    setOrderToPay(null);
    setSubtotalForPayment(null);
    setTipForFinalPayment(0);


    if (isDelivery && orderToPay.deliveryInfo) {
        const remainingDeliveryOrders = pendingOrderGroups.filter(pg => pg.orderNumber !== orderToPay.orderNumber && pg.deliveryInfo).length === 0;
        if (remainingDeliveryOrders && currentOrder.length === 0) {
            setDeliveryInfo(null);
        }
    }
  };

  const currentOrderTotal = useMemo(
    () => currentOrder.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0),
    [currentOrder]
  );


  const groupedMenu = useMemo(() => {
    const allCategories = Array.from(new Set(menu.map(item => item.category)));

    const sortedCategoryNames = allCategories.sort((a, b) => {
        const indexA = predefinedOrderedCategories.indexOf(a);
        const indexB = predefinedOrderedCategories.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    return sortedCategoryNames.map(categoryName => ({
        name: categoryName,
        items: menu.filter(item => item.category === categoryName).sort((a,b) => a.name.localeCompare(b.name)),
    }));
  }, [menu]);

  const productsForSelectedCategory = useMemo(() => {
    if (!selectedCategoryForDialog) return [];
    return menu.filter(item => item.category === selectedCategoryForDialog).sort((a,b) => a.name.localeCompare(b.name));
  }, [menu, selectedCategoryForDialog]);


  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando mesa...</div>;
  }

  return (
    <div className="container mx-auto p-4 flex flex-col min-h-screen">
      <div className="flex justify-between items-center mb-4">
         <Button variant="outline" onClick={() => router.push('/tables')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
        </Button>
        <h1 className="text-2xl font-bold text-center flex-grow">{tableDisplayName}</h1>
        <div></div> {/* Placeholder for centering title if needed */}
      </div>

      <div className="flex justify-center mb-6">
        <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
            <SheetTrigger asChild>
                <Button size="lg" className="px-8 py-6 text-lg" onClick={handleOpenMenuOrDeliveryDialog}>
                    <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col">
                <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
                    <SheetTitle className="text-2xl text-center">Categorías del Menú</SheetTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMenuSheetOpen(false)}
                        className="absolute right-4 top-3"
                        aria-label="Cerrar menú"
                    >
                        <XCircle className="h-6 w-6" />
                    </Button>
                </SheetHeader>
                <ScrollArea className="flex-grow h-[calc(100vh-80px)]">
                  <div className="grid grid-cols-1 gap-3 p-4">
                    {groupedMenu.map((categoryGroup) => (
                      <Button
                        key={categoryGroup.name}
                        variant="outline"
                        className="w-full justify-start text-left py-6 text-lg"
                        onClick={() => handleCategorySelect(categoryGroup.name)}
                      >
                        {categoryGroup.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
      </div>

      {/* Product List Dialog */}
      <ShadDialog open={isProductListDialogOpen} onOpenChange={setIsProductListDialogOpen}>
        <ShadDialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl max-h-[90vh] flex flex-col">
          <ShadDialogHeader>
            <ShadDialogTitle className="text-2xl text-center">
              {selectedCategoryForDialog ? `Productos en ${selectedCategoryForDialog}` : "Productos"}
            </ShadDialogTitle>
             <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProductListDialogOpen(false)}
                className="absolute right-4 top-4"
                aria-label="Cerrar lista de productos"
            >
                <XCircle className="h-6 w-6" />
            </Button>
          </ShadDialogHeader>
          <ScrollArea className="flex-grow overflow-y-auto pr-2">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {productsForSelectedCategory.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                        "shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col",
                        "bg-secondary" // Apply secondary background color (light green)
                    )}
                    onClick={() => handleProductCardClick(item)}
                  >
                    <CardHeader className="p-3 pb-1 flex-grow">
                      <CardTitle className="text-base font-semibold text-center">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-center">
                      <p className={cn(
                          "font-mono text-sm",
                          "text-primary" // Apply primary text color (orange)
                      )}>
                          {globalFormatCurrency(item.price)}
                      </p>
                       {item.ingredients && item.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate" title={item.ingredients.join(', ')}>
                           {item.ingredients.join(', ').length > 30 ? item.ingredients.join(', ').substring(0, 27) + '...' : item.ingredients.join(', ')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
          </ScrollArea>
          <ShadDialogFooter className="p-4 border-t mt-auto">
            <Button variant="outline" onClick={() => setIsProductListDialogOpen(false)}>Cerrar</Button>
          </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>



      <div className="grid md:grid-cols-2 gap-6 flex-grow">

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-center text-xl">Pedido Actual</CardTitle>
          </CardHeader>
            <ScrollArea className="flex-grow min-h-0">
                 <div className="p-3">
                  {currentOrder.length === 0 ? (
                    <p className="text-muted-foreground text-center py-10">No hay productos en el pedido actual.</p>
                  ) : (
                    currentOrder.map((item) => (
                      <Card key={item.orderItemId} className="mb-3 shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-base">{item.name}</p>
                              {item.category && <p className="text-xs text-muted-foreground font-bold">{item.category}</p>}
                              {item.selectedModifications && item.selectedModifications.length > 0 && (
                                <p className="text-xs text-muted-foreground font-bold">({item.selectedModifications.join(', ')})</p>
                              )}
                              {item.observation && (
                                 <p className="text-xs text-amber-700 font-bold">Obs: {item.observation}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-7 w-7" onClick={() => handleRemoveItemFromOrder(item.orderItemId)}>
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleDecreaseQuantity(item.orderItemId)}>
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleIncreaseQuantity(item.orderItemId)}>
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="font-semibold text-base">{globalFormatCurrency(item.finalPrice * item.quantity)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
            </ScrollArea>
          <CardFooter className="p-3 border-t">
            <div className="w-full">
              <div className="flex justify-between items-center text-lg mb-3">
                <span className="font-bold">Total Actual:</span>
                <span className="font-bold">{globalFormatCurrency(currentOrderTotal)}</span>
              </div>
              <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
              </Button>
            </div>
          </CardFooter>
        </Card>


        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-center text-xl">Pedidos Pendientes de Pago</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow min-h-0">
            <div className="p-3">
              {pendingOrderGroups.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No hay pedidos pendientes de pago.</p>
              ) : (
                pendingOrderGroups.map((group) => {
                  const groupSubtotal = group.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
                  const groupDeliveryFee = (isDelivery && group.deliveryInfo?.deliveryFee) ? group.deliveryInfo.deliveryFee : 0;
                  const groupTip = group.tipAmountForPayment ?? 0;
                  const groupTotal = groupSubtotal + groupDeliveryFee + groupTip;

                  return (
                    <Card key={group.orderNumber} className="mb-3 shadow-md">
                       <CardHeader className="p-3 pb-1">
                           <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-7 w-7 p-0">
                                                <XCircle className="h-5 w-5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar Pedido #{String(group.orderNumber).padStart(3, '0')}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeletePendingOrder(group.orderNumber)} className={cn(buttonVariants({ variant: "destructive" }))}>
                                                    Confirmar Eliminación
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <span className="text-lg font-bold">Orden #{String(group.orderNumber).padStart(3, '0')}</span>
                                </div>
                                <Badge variant="outline" className="text-sm font-bold">{globalFormatCurrency(groupTotal)}</Badge>
                           </div>
                           <div className="flex justify-between items-center mt-1">
                               {group.deliveryInfo && (
                                    <p className="text-xs text-muted-foreground font-bold">
                                        <Utensils className="inline h-3 w-3 mr-1"/>{group.deliveryInfo.name} - {group.deliveryInfo.address}
                                    </p>
                               )}
                               {!group.deliveryInfo && <div/>}
                           </div>
                           {group.generalObservation && (
                                <p className="text-xs text-amber-700 font-bold mt-1">Obs. General: {group.generalObservation}</p>
                           )}
                        </CardHeader>
                      <CardContent className="p-3 text-xs">
                        {group.items.map(item => (
                          <div key={item.orderItemId} className="mb-1 pb-1 border-b border-dashed last:border-b-0 last:pb-0">
                            <p className="font-semibold">{item.quantity}x {item.name} <span className="float-right">{globalFormatCurrency(item.finalPrice * item.quantity)}</span></p>
                            {item.category && <p className="text-xs text-muted-foreground font-bold">{item.category}</p>}
                            {item.selectedModifications && item.selectedModifications.length > 0 && (
                              <p className="text-xs text-muted-foreground font-bold">({item.selectedModifications.join(', ')})</p>
                            )}
                            {item.observation && (
                                <p className="text-xs text-amber-700 font-bold">Obs: {item.observation}</p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                      <CardFooter className="p-3 pt-2 flex flex-col gap-2">
                         <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleReprintKitchenOrder(group)}
                            >
                                <Printer className="mr-2 h-3 w-3"/> Reimprimir Comanda
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleOpenPrintCustomerCopyDialog(group)}
                            >
                                <Copy className="mr-2 h-3 w-3"/> Imprimir Copia Cliente
                            </Button>
                         </div>
                         <Button onClick={() => handleFinalizeAndPaySelectedOrder(group)} className="w-full" size="sm">
                            <CreditCard className="mr-2 h-3 w-3" /> Cobrar Pedido
                         </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>



      {itemToModify && (
        <ModificationDialog
          isOpen={isModificationDialogOpen}
          onOpenChange={setIsModificationDialogOpen}
          item={itemToModify}
          onConfirm={(selectedMods, obsText) => {
            if (itemToModify) {
              handleAddItemToOrder(itemToModify, selectedMods, obsText);
            }
            setIsModificationDialogOpen(false); // Close modification dialog
            // ProductListDialog is closed within handleAddItemToOrder
            setItemToModify(null);
          }}
          onCancel={() => {
            setIsModificationDialogOpen(false);
            setItemToModify(null);
            // ProductListDialog remains open
          }}
        />
      )}

        <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            totalAmount={totalForPayment}
            onConfirm={handlePaymentConfirm}
        />

       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo} // Pass null for new, or existing for edit
               onConfirm={(info) => {
                   setDeliveryInfo(info);
                   setIsDeliveryDialogOpen(false);
                   // Only open menu sheet if it wasn't already open due to other logic
                   if (!isMenuSheetOpen && !isProductListDialogOpen) {
                       setIsMenuSheetOpen(true);
                   }
               }}
               onCancel={() => {
                   setIsDeliveryDialogOpen(false);
                   // If canceling delivery for a brand new order attempt, go back or allow closing.
                   if (currentOrder.length === 0 && !pendingOrderGroups.some(pg=> pg.deliveryInfo)) {
                       // No specific action needed here for current flow, as setIsDeliveryDialogOpen(false) handles closure.
                       // If we wanted to redirect or close menu sheet, it would go here.
                   }
               }}
           />
       )}


        {orderGroupForCopy && (
             <AlertDialog open={isConfirmTipForCopyDialogOpen} onOpenChange={setIsConfirmTipForCopyDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Incluir Propina en Copia</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Desea incluir una propina sugerida del 10% en esta copia para el cliente?
                            Monto de propina: {globalFormatCurrency(Math.round(orderGroupForCopy.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) * 0.10))}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => handleConfirmPrintCustomerCopy(false)}>No Incluir</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleConfirmPrintCustomerCopy(true)}>Sí, Incluir Propina</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}


      <ShadDialog open={isGeneralObservationDialogOpen} onOpenChange={(isOpen) => {
          setIsGeneralObservationDialogOpen(isOpen);
          if (!isOpen) setCurrentGeneralObservation('');
      }}>
        <ShadDialogContent className="sm:max-w-md">
            <ShadDialogHeader>
                <ShadDialogTitle>Observación General del Pedido</ShadDialogTitle>
                <ShadDialogDescription>
                    Añada una observación general para este pedido (ej: para llevar, sin cubiertos, etc.).
                </ShadDialogDescription>
            </ShadDialogHeader>
            <div className="py-4">
                <Textarea
                    value={currentGeneralObservation}
                    onChange={(e) => setCurrentGeneralObservation(e.target.value)}
                    placeholder="Ingrese observación aquí..."
                    rows={3}
                />
            </div>
            <ShadDialogFooter>
                 <Button type="button" variant="secondary" onClick={() => {
                        setIsGeneralObservationDialogOpen(false);
                        setCurrentGeneralObservation('');
                    }}>Cancelar</Button>
                 <Button type="button" onClick={handleConfirmPrintKitchenOrderWithObservation}>
                    Confirmar e Imprimir Comanda
                 </Button>
            </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>


    </div>
  );
}

