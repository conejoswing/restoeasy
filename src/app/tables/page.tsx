
'use client';

import * as React from 'react';
import {useState, useEffect, useCallback} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import { Store, Truck, Utensils, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import type { DeliveryInfo } from '@/components/app/delivery-dialog';

interface Table {
  id: number | string;
  name?: string;
  status: 'available' | 'occupied';
}

const numberedTables: Table[] = Array.from({length: 10}, (_, i) => ({
  id: i + 1,
  status: 'available',
}));

const specialTables: Table[] = [
    { id: 'mesón', name: 'Mesón', status: 'available'},
    { id: 'delivery', name: 'Delivery', status: 'available' }
];

const initialTables: Table[] = [...numberedTables, ...specialTables];
const PENDING_ORDERS_STORAGE_KEY_PREFIX = 'table-';
const DELIVERY_INFO_STORAGE_KEY_PREFIX = 'deliveryInfo-';

const isDeliveryTable = (id: string | number): boolean => {
  return String(id).toLowerCase() === 'delivery';
};


export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const { logout, isAuthenticated, isLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  const updateTableStatuses = useCallback(() => {
    console.log("TablesPage: Updating table statuses from sessionStorage...");
    const updatedTables = initialTables.map(table => {
      const explicitStatus = sessionStorage.getItem(`table-${table.id}-status`) as 'available' | 'occupied' | null;

      if (explicitStatus === 'occupied' || explicitStatus === 'available') {
        console.log(`TablesPage: Using explicit status for ${table.id}: ${explicitStatus}`);
        return { ...table, status: explicitStatus };
      }

      console.log(`TablesPage: No explicit status for ${table.id}, using fallback logic.`);
      const currentOrderKey = `${PENDING_ORDERS_STORAGE_KEY_PREFIX}${table.id}-currentOrder`;
      const pendingOrdersKey = `${PENDING_ORDERS_STORAGE_KEY_PREFIX}${table.id}-pendingOrders`;
      const deliveryInfoKey = isDeliveryTable(table.id) ? `${DELIVERY_INFO_STORAGE_KEY_PREFIX}${table.id}` : null;

      const storedCurrentOrder = sessionStorage.getItem(currentOrderKey);
      const storedPendingOrdersData = sessionStorage.getItem(pendingOrdersKey);
      let isOccupied = false;

      try {
        const parsedCurrentOrder = storedCurrentOrder ? JSON.parse(storedCurrentOrder) : null;
        if (Array.isArray(parsedCurrentOrder) && parsedCurrentOrder.length > 0) {
          isOccupied = true;
        }

        if (storedPendingOrdersData) {
            const parsedPending = JSON.parse(storedPendingOrdersData);
            const groups = Array.isArray(parsedPending) ? parsedPending : (parsedPending?.groups || []);
            if (groups.length > 0) {
                isOccupied = true;
            }
        }

        if (deliveryInfoKey) {
            const storedDeliveryInfo = sessionStorage.getItem(deliveryInfoKey);
            if (storedDeliveryInfo) {
                const parsedDeliveryInfo = JSON.parse(storedDeliveryInfo) as DeliveryInfo | null;
                 if (parsedDeliveryInfo && (parsedDeliveryInfo.name || parsedDeliveryInfo.address || parsedDeliveryInfo.phone || parsedDeliveryInfo.deliveryFee > 0)) {
                     isOccupied = true;
                 }
            }
        }
        const determinedStatus: 'available' | 'occupied' = isOccupied ? 'occupied' : 'available';
        sessionStorage.setItem(`table-${table.id}-status`, determinedStatus);
        console.log(`TablesPage: Fallback determined status for ${table.id}: ${determinedStatus} and saved it.`);
        return { ...table, status: determinedStatus };
      } catch (e) {
        console.error(`TablesPage: Error processing stored data for ${table.id} during fallback:`, e);
        sessionStorage.setItem(`table-${table.id}-status`, 'available');
        return { ...table, status: 'available' };
      }
    });
    setTables(updatedTables);
  }, []); // initialTables is module-scoped, useCallback ensures stability

  useEffect(() => {
    if (!isInitialized) {
      updateTableStatuses();
      setIsInitialized(true);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("TablesPage: Page became visible, updating table statuses.");
        updateTableStatuses();
      }
    };

    const handleTableStatusUpdateEvent = () => {
        console.log("TablesPage: Received tableStatusUpdated event, updating table statuses.");
        updateTableStatuses();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('tableStatusUpdated', handleTableStatusUpdateEvent);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('tableStatusUpdated', handleTableStatusUpdateEvent);
    };
  }, [isInitialized, updateTableStatuses]);


  const getIcon = (tableId: number | string) => {
      if (tableId === 'mesón') return <Store className="h-6 w-6 mb-1 mx-auto text-foreground"/>;
      if (tableId === 'delivery') return <Truck className="h-6 w-6 mb-1 mx-auto text-foreground"/>;
      return <Utensils className="h-6 w-6 mb-1 mx-auto text-foreground"/>;
  }

   const handleLogout = () => {
     logout();
   };


  if (isLoading || !isInitialized) {
     return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
         {isAuthenticated && (
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
         )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <Link key={table.id} href={`/tables/${table.id}`} passHref legacyBehavior>
            <a className="block h-full">
                <Card
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col justify-between h-full group',
                    table.status === 'available'
                      ? 'bg-secondary hover:bg-secondary/90'
                      : 'bg-muted hover:bg-muted/90',
                    table.status === 'occupied' ? 'border-primary border-2' : ''
                  )}
                >
                  <CardHeader className="p-4 flex-grow">
                    {getIcon(table.id)}
                    <CardTitle className="text-center text-lg">
                      {table.name || `Mesa ${table.id}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-center">
                    <span
                      className={cn(
                        'text-sm font-medium px-2 py-1 rounded-full',
                        table.status === 'available'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-orange-200 text-orange-800'
                      )}
                    >
                      {table.status === 'available' ? 'Disponible' : 'Ocupada'}
                    </span>
                  </CardContent>
                </Card>
             </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
