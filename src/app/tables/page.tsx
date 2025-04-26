
'use client';

import * as React from 'react';
import {useState, useEffect} from 'react'; // Import useEffect
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import { Store, Truck, Utensils, LogOut } from 'lucide-react'; // Added Utensils & LogOut
import { useAuth } from '@/context/AuthContext'; // Import useAuth

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
    { id: 'mezon', name: 'Mezón', status: 'available'}, // Counter/Bar - Using Store icon now
    { id: 'delivery', name: 'Delivery', status: 'available' }
];

const initialTables: Table[] = [...numberedTables, ...specialTables];


export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const { logout, isAuthenticated, isLoading, userRole } = useAuth(); // Get auth state and logout

  // --- Dynamic Table Status Update (Placeholder/Example) ---
  // In a real application, you'd fetch status or get it from global state.
  // This useEffect simulates checking localStorage/sessionStorage after an order
  // might have been placed on a table detail page.
  useEffect(() => {
    const updatedTables = tables.map(table => {
      // Check if there's a stored status for this table
      const storedStatus = sessionStorage.getItem(`table-${table.id}-status`);
      if (storedStatus === 'occupied') {
        return { ...table, status: 'occupied' };
      }
      // Check if there's an active order stored (more complex logic)
      const storedOrder = sessionStorage.getItem(`table-${table.id}-order`);
      if (storedOrder && JSON.parse(storedOrder).length > 0) {
          return { ...table, status: 'occupied'};
      }
      // You might also need to reset status if order is cleared
      // For this example, we'll just use the initial state or the stored 'occupied' status
      return table;
    });
    // Only update state if there are actual changes to avoid infinite loops
    if (JSON.stringify(updatedTables) !== JSON.stringify(tables)) {
        setTables(updatedTables);
    }
    // Dependency array should include things that trigger a re-check,
    // but be careful not to cause infinite loops. `tables` itself shouldn't be here
    // unless the check logic is very carefully managed. For simplicity, this runs once on mount.
  }, []); // Empty dependency array means this runs once on mount


  const getIcon = (tableId: number | string) => {
      if (tableId === 'mezon') return <Store className="h-6 w-6 mb-1 mx-auto"/>;
      if (tableId === 'delivery') return <Truck className="h-6 w-6 mb-1 mx-auto"/>;
      // Add icon for regular tables
      return <Utensils className="h-6 w-6 mb-1 mx-auto group-hover:text-foreground transition-colors"/>;
  }

  const handleLogout = () => {
    logout();
    // Navigation is handled by AuthContext
  };

  // Loading state is handled by AuthProvider wrapper in layout.tsx
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>; // Or a minimal loading indicator if preferred
  }
  // If not authenticated AuthProvider will redirect
  if (!isAuthenticated) {
    return null; // Prevent rendering content before redirect
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
         {/* Only show logout for admin on this page */}
         {userRole === 'admin' && (
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
                      ? 'bg-green-200 text-green-800' // Use direct colors temporarily for visibility
                      : 'bg-orange-200 text-orange-800' // Use direct colors temporarily for visibility
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
