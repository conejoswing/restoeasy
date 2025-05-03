
'use client';

import * as React from 'react';
import {useState, useEffect} from 'react'; // Import useEffect
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import { Store, Truck, Utensils, LogOut } from 'lucide-react'; // Added LogOut
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation'; // Import useRouter


interface Table {
  id: number | string; // Allow string IDs for Mezon and Delivery
  name?: string; // Optional name for special types
  status: 'available' | 'occupied';
}

// Generate 10 numbered tables, all initially available
const numberedTables: Table[] = Array.from({length: 10}, (_, i) => ({
  id: i + 1,
  status: 'available', // All tables start as available
}));

// Add Mezon and Delivery, also initially available
const specialTables: Table[] = [
    { id: 'mezon', name: 'Mesón', status: 'available'}, // Counter/Bar - Using Store icon now
    { id: 'delivery', name: 'Delivery', status: 'available' }
];

const initialTables: Table[] = [...numberedTables, ...specialTables];
const DELIVERY_INFO_STORAGE_KEY = 'deliveryInfo'; // Add storage key constant


export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const { logout, isAuthenticated, isLoading } = useAuth(); // Get logout and auth state
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization
  const router = useRouter(); // Initialize router

  // --- Dynamic Table Status Update ---
  // This useEffect checks sessionStorage on mount and updates table status locally.
  useEffect(() => {
    if (isInitialized) return; // Only run once

    const updatedTables = initialTables.map(table => {
        const storedStatus = sessionStorage.getItem(`table-${table.id}-status`);
        const storedOrder = sessionStorage.getItem(`table-${table.id}-order`);
        const storedPendingOrder = sessionStorage.getItem(`table-${table.id}-pending-order`);
        const storedDeliveryInfo = table.id === 'delivery' ? sessionStorage.getItem(`${DELIVERY_INFO_STORAGE_KEY}-${table.id}`) : null; // Check delivery info only for delivery
        let currentStatus: 'available' | 'occupied' = 'available'; // Default

        // Determine status based on stored info
        if (storedStatus === 'occupied') {
            currentStatus = 'occupied'; // Explicitly occupied
        } else {
            // Check if there's a valid current or pending order OR delivery info
            let hasOrderOrInfo = false;
            try {
                const parsedOrder = storedOrder ? JSON.parse(storedOrder) : null;
                const parsedPendingOrder = storedPendingOrder ? JSON.parse(storedPendingOrder) : null;
                 const parsedDeliveryInfo = storedDeliveryInfo ? JSON.parse(storedDeliveryInfo) : null;

                if ((Array.isArray(parsedOrder) && parsedOrder.length > 0) ||
                    (Array.isArray(parsedPendingOrder) && parsedPendingOrder.length > 0) ||
                    (table.id === 'delivery' && parsedDeliveryInfo)) { // Check delivery info existence
                    hasOrderOrInfo = true;
                }
            } catch (e) {
                console.error(`Error parsing stored data for ${table.id}:`, e);
                // Optionally clear invalid data
                sessionStorage.removeItem(`table-${table.id}-order`);
                sessionStorage.removeItem(`table-${table.id}-pending-order`);
                if (table.id === 'delivery') sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY}-${table.id}`);
            }

            if (hasOrderOrInfo) {
                currentStatus = 'occupied'; // Occupied due to existing orders or delivery info
            }
        }

         // If derived status is available but orders/info still exist, clear them
         if (currentStatus === 'available') {
             if (storedOrder) sessionStorage.removeItem(`table-${table.id}-order`);
             if (storedPendingOrder) sessionStorage.removeItem(`table-${table.id}-pending-order`);
             if (table.id === 'delivery' && storedDeliveryInfo) sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY}-${table.id}`);
         }

        // If derived status doesn't match stored status, update storage
        if (storedStatus !== currentStatus) {
           console.log(`Initializing/Updating status for ${table.id} from ${storedStatus || 'none'} to ${currentStatus}`);
           sessionStorage.setItem(`table-${table.id}-status`, currentStatus);
        }

      return { ...table, status: currentStatus };
    });

    setTables(updatedTables);
    setIsInitialized(true); // Mark as initialized

  }, [isInitialized]); // Run only once after initial render


  const getIcon = (tableId: number | string) => {
      if (tableId === 'mezon') return <Store className="h-6 w-6 mb-1 mx-auto text-foreground"/>; // Keep icons black
      if (tableId === 'delivery') return <Truck className="h-6 w-6 mb-1 mx-auto text-foreground"/>; // Keep icons black
      // Add icon for regular tables
      return <Utensils className="h-6 w-6 mb-1 mx-auto text-foreground"/>; // Keep icons black
  }

   // Logout handler
   const handleLogout = () => {
     logout();
     // No need to push to '/login' here, AuthGuard will handle it.
   };


  // Wait for auth context and table initialization - Handled by AuthGuard
  // if (isLoading || !isInitialized) {
  //   return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  // }
  // No auth check needed - Handled by AuthGuard


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
         {/* Logout button - Only show if authenticated */}
         {isAuthenticated && (
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>
         )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <Link key={table.id} href={`/tables/${table.id}`} passHref>
            <Card
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col justify-between h-full group', // Added group class
                table.status === 'available'
                  ? 'bg-secondary hover:bg-secondary/90'
                  : 'bg-muted hover:bg-muted/90',
                 table.status === 'occupied' ? 'border-primary border-2' : ''
              )}
            >
              <CardHeader className="p-4 flex-grow">
                 {getIcon(table.id)}
                <CardTitle className="text-center text-lg">
                  {table.name || `Mesa ${table.id}`} {/* Display name or "Mesa {id}" */}
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
          </Link>
        ))}
      </div>
    </div>
  );
}
