

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
import { Button } from '@/components/ui/button'; // Import Button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'; // Import Dialog components
import { Label } from '@/components/ui/label'; // Import Label
import { useState } from 'react';
import { Edit } from 'lucide-react'; // Import Edit icon
import { useToast } from '@/hooks/use-toast'; // Import useToast

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
    // --- Promo Churrasco --- (Previously Colaciones)
    {
        id: 25,
        name: 'Promo Pollo Asado + Acompañamiento', // Updated name
        price: 5500,
        category: 'Promo Churrasco', // Updated Category
        // Add modifications if needed
    },
    {
        id: 26,
        name: 'Promo Mechada + Acompañamiento', // Updated name
        price: 6000,
        category: 'Promo Churrasco', // Updated Category
        // Add modifications if needed
    },
    // --- Promo Mechada ---
    {
      id: 4,
      name: 'Dinamico grande', // Changed from 'Papas Fritas'
      price: 3000,
      category: 'Promo Mechada', // Category already Promo Mechada
    },
    {
      id: 24, // New Promo Mechada
      name: 'Promo Mechada', // Keep name for now, but ensure ID is unique
      price: 7000, // Example price
      category: 'Promo Mechada', // Keep in Promotions category
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
      id: 23, // Promo Churrasco already exists with ID 25/26
      name: 'Promo Churrasco Simple', // Make name unique
      price: 6000, // Example price
      category: 'Promociones',
      // No modifications by default for promos, unless specified
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
  'Promo Churrasco', // Changed from Colaciones
  'Promo Mechada',
  'Promociones',
  'Bebidas',
];

// Sort menu items by category order first, then alphabetically by name
const sortMenu = (menu: MenuItem[]): MenuItem[] => {
  return [...menu].sort((a, b) => {
    const categoryAIndex = orderedCategories.indexOf(a.category);
    const categoryBIndex = orderedCategories.indexOf(b.category);

    if (categoryAIndex !== categoryBIndex) {
        // Handle cases where a category might not be in orderedCategories (place them at the end)
        if (categoryAIndex === -1 && categoryBIndex === -1) return a.name.localeCompare(b.name);
        if (categoryAIndex === -1) return 1;
        if (categoryBIndex === -1) return -1;
        return categoryAIndex - categoryBIndex;
    }
    return a.name.localeCompare(b.name);
  });
};


export default function ProductsPage() {
  // Role checks and redirection are handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>(sortMenu(mockMenu)); // State for menu items
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const { toast } = useToast(); // Toast hook

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
   const filteredProducts = menu.filter(product =>
     product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.category.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const openEditDialog = (product: MenuItem) => {
     setEditingProduct(product);
     setNewPrice(product.price.toString()); // Pre-fill with current price
     setIsEditDialogOpen(true);
   };

   const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setNewPrice(e.target.value);
   };

   const handleUpdatePrice = () => {
     if (!editingProduct || newPrice === '') {
       toast({ title: "Error", description: "Debe ingresar un precio.", variant: "destructive"});
       return;
     }
     const priceValue = parseInt(newPrice, 10);
     if (isNaN(priceValue) || priceValue < 0) {
       toast({ title: "Error", description: "El precio debe ser un número válido y no negativo.", variant: "destructive"});
       return;
     }

     // Update the product price in the menu state
     setMenu(prevMenu =>
       sortMenu( // Re-sort after update
         prevMenu.map(item =>
           item.id === editingProduct.id ? { ...item, price: priceValue } : item
         )
       )
     );

     toast({ title: "Precio Actualizado", description: `El precio de ${editingProduct.name} se actualizó a ${formatCurrency(priceValue)}.`});
     setIsEditDialogOpen(false); // Close dialog
     setEditingProduct(null); // Reset editing state
     setNewPrice(''); // Clear price input
   };

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
        {/* Optional: Add a button to add new products if needed later */}
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
                <TableHead>Descripción</TableHead> {/* Changed from Modificaciones */}
                <TableHead className="text-right">Precio Base</TableHead>
                 <TableHead className="text-center w-20">Editar</TableHead> {/* Add Edit column */}
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
                    <TableCell className="text-center">
                       <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-7 w-7">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar Precio</span>
                       </Button>
                    </TableCell>
                </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground"> {/* Increased colSpan */}
                     {searchTerm ? 'No se encontraron productos.' : 'No hay productos para mostrar.'}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Edit Price Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>Editar Precio de {editingProduct?.name}</DialogTitle>
             <DialogDescription>
               Actualice el precio base para este producto.
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="price" className="text-right">
                 Nuevo Precio (CLP)
               </Label>
               <Input
                 id="price"
                 type="number"
                 value={newPrice}
                 onChange={handlePriceChange}
                 className="col-span-3"
                 required
                 min="0"
                 step="1" // Allow integer prices
               />
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button type="button" variant="secondary">Cancelar</Button>
             </DialogClose>
             <Button type="submit" onClick={handleUpdatePrice}>Guardar Cambios</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

    </div>
  );
}

