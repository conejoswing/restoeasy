
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { useState } from 'react';

interface MenuItem {
  id: number;
  name: string;
  price: number; // Base price
  category: string;
  modifications?: string[]; // Optional list of modifications
  modificationPrices?: { [key: string]: number }; // Optional map of modification name to additional price
}

// Mock data - reused from table detail page (Consider moving to a shared service)
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

// Sort menu items by category order first, then alphabetically by name
const sortedMenu = [...mockMenu].sort((a, b) => {
    const categoryAIndex = orderedCategories.indexOf(a.category);
    const categoryBIndex = orderedCategories.indexOf(b.category);

    if (categoryAIndex !== categoryBIndex) {
        return categoryAIndex - categoryBIndex;
    }
    return a.name.localeCompare(b.name);
});


export default function ProductsPage() {
  // Role checks and redirection are handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

   // Loading state is handled by AuthProvider wrapper in layout.tsx
   if (isLoading) {
     return <div className="flex items-center justify-center min-h-screen">Cargando...</div>; // Or a minimal loading indicator if preferred
   }
   // If not authenticated or not admin, AuthProvider will redirect
   if (!isAuthenticated || userRole !== 'admin') {
     return null; // Prevent rendering content before redirect
   }

   // Filter products based on search term
   const filteredProducts = sortedMenu.filter(product =>
     product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.category.toLowerCase().includes(searchTerm.toLowerCase())
   );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lista de Productos</h1>
        <Input
           type="text"
           placeholder="Buscar producto o categoría..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="max-w-sm"
         />
        {/* Optional: Add a button to add/edit products if needed later */}
      </div>

      <Card>
         <CardHeader>
             <CardTitle>Menú Completo</CardTitle>
         </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Modificaciones</TableHead>
                <TableHead className="text-right">Precio Base</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {item.modifications && item.modifications.length > 0
                        ? item.modifications.map(mod => {
                            const price = item.modificationPrices?.[mod];
                            return price ? `${mod} (+${formatCurrency(price)})` : mod;
                            }).join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.price)}</TableCell>
                </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                     {searchTerm ? 'No se encontraron productos.' : 'No hay productos para mostrar.'}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
