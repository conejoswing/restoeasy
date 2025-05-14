
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
const PENDING_ORDERS_STORAGE_KEY_PREFIX = 'table-'; // Not used directly for status logic here anymore
const DELIVERY_INFO_STORAGE_KEY_PREFIX = 'deliveryInfo-'; // Not used directly for status logic here anymore

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
      // Directly use the status set by TableDetailPage. Default to 'available' if not set or invalid.
      const explicitStatus = sessionStorage.getItem(`table-${table.id}-status`);
      if (explicitStatus === 'occupied') {
        return { ...table, status: 'occupied' };
      }
      // If not explicitly 'occupied', or if key is missing/invalid, assume 'available'.
      // TableDetailPage is responsible for setting it to 'occupied' and clearing to 'available'.
      return { ...table, status: 'available' };
    });
    setTables(updatedTables);
    console.log("TablesPage: Table statuses updated.", updatedTables.map(t => ({id: t.id, status: t.status})));
  }, []); // initialTables is module-scoped, stable.


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
    window.addEventListener('tableStatusUpdated', handleTableStatusUpdateEvent); // Listener added

    return () => { // Cleanup
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('tableStatusUpdated', handleTableStatusUpdateEvent);
    };
  }, [isInitialized, updateTableStatuses]); // updateTableStatuses is a dependency.


  const getIcon = (tableId: number | string) => {
      if (tableId === 'mesón') return <Store className="h-6 w-6 mb-1 mx-auto text-foreground"/>;
      if (tableId === 'delivery') return <Truck className="h-6 w-6 mb-1 mx-auto text-foreground"/>;
      return <Utensils className="h-6 w-6 mb-1 mx-auto text-foreground"/>;
  }

   const handleLogout = () => {
     logout();
     // router.push('/login'); // AuthGuard will handle redirection
   };


  if (isLoading || !isInitialized) { // Ensure isInitialized is also checked
     return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
         {isAuthenticated && ( // Only show logout if authenticated
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
         )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <Link key={table.id} href={`/tables/${table.id}`} passHref legacyBehavior>
            <a className="block h-full"> {/* Ensure anchor takes full height for card */}
                <Card
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col justify-between h-full group', // Added h-full
                    table.status === 'available'
                      ? 'bg-secondary hover:bg-secondary/90' // Greenish for available
                      : 'bg-muted hover:bg-muted/90',     // Beigish for occupied (or use primary/destructive)
                    table.status === 'occupied' ? 'border-primary border-2' : '' // Orange border for occupied
                  )}
                >
                  <CardHeader className="p-4 flex-grow"> {/* flex-grow to push content */}
                    {getIcon(table.id)}
                    <CardTitle className="text-center text-lg">
                      {table.name || `Mesa ${table.id}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-center"> {/* pt-0 to reduce space if title is long */}
                    <span
                      className={cn(
                        'text-sm font-medium px-2 py-1 rounded-full',
                        table.status === 'available'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-orange-200 text-orange-800' // Consistent with border-primary
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

