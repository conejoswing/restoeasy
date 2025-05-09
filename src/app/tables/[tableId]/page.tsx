
'use client';

import * as React from 'react';
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, buttonVariants} from '@/components/ui/button'; // Import buttonVariants
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {ScrollArea}
from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard, ChevronRight, Banknote, Landmark, Home, Phone, User, DollarSign, PackageSearch, Edit, Trash2 } from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import PaymentDialog from '@/components/app/payment-dialog';
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page';
import type { DeliveryInfo } from '@/components/app/delivery-dialog';
import DeliveryDialog from '@/components/app/delivery-dialog'; // Corrected import
import { formatKitchenOrderReceipt, formatCustomerReceipt, printHtml } from '@/lib/printUtils';
import type { InventoryItem } from '@/app/inventory/page';
import { Dialog as ShadDialog, DialogClose as ShadDialogClose, DialogContent as ShadDialogContent, DialogDescription as ShadDialogDescription, DialogFooter as ShadDialogFooter, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle, DialogTrigger as ShadDialogTrigger } from '@/components/ui/dialog'; // Renamed to avoid conflict
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  modifications?: string[];
  modificationPrices?: { [key: string]: number };
  ingredients?: string[];
}

export interface OrderItem extends Omit<MenuItem, 'price' | 'modificationPrices' | 'modifications'> {
  orderItemId: string;
  quantity: number;
  selectedModifications?: string[];
  basePrice: number;
  finalPrice: number;
  ingredients?: string[];
  orderNumber?: number;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta Débito' | 'Tarjeta Crédito' | 'Transferencia';

// New interface for grouping pending orders
interface PendingOrderGroup {
  orderNumber: number;
  items: OrderItem[];
  deliveryInfo?: DeliveryInfo | null; // Store delivery info with the order group if it's a delivery
}

interface PendingOrderStorageData {
    groups: PendingOrderGroup[];
}

// Helper function to format currency (consistent with other parts of the app)
// Moved to global scope or a utils file if used across multiple components
const globalFormatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};


// Mock data - replace with actual API calls - Updated prices to CLP
const mockMenu: MenuItem[] = [
    // --- Completos Vienesas ---
    {
      id: 13,
      name: 'Italiano Normal',
      price: 4000,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta', ],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Palta', 'Tomate']
    },
    {
      id: 14,
      name: 'Italiano Grande',
      price: 4500,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta', 'con americana', 'con chucrut', 'con palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Palta', 'Tomate']
    },
     {
      id: 15,
      name: 'Hot Dog Normal',
      price: 4200,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Salsas']
    },
     {
        id: 27,
        name: 'Hot Dog Grande',
        price: 4700,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Salsas']
    },
     {
        id: 28,
        name: 'Completo Normal',
        price: 4300,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 29,
        name: 'Completo Grande',
        price: 4800,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 30,
        name: 'Palta Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Palta']
    },
    {
        id: 31,
        name: 'Palta Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Palta']
    },
     {
        id: 32,
        name: 'Tomate Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate']
    },
    {
        id: 33,
        name: 'Tomate Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate']
    },
    {
        id: 34,
        name: 'Dinamico Normal',
        price: 4400,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 35,
        name: 'Dinamico Grande',
        price: 4900,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    // --- Completos As --- (Updated mods for Dinamico and Chacarero)
    {
      id: 10,
      name: 'Italiano Normal',
      price: 5500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Palta', 'Tomate']
    },
    {
      id: 11,
      name: 'Italiano Grande',
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Palta', 'Tomate']
    },
    {
      id: 12,
      name: 'Completo Normal',
      price: 6500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    { id: 36, name: 'Completo Grande', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Chucrut', 'Americana'] },
    { id: 37, name: 'Palta Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta'] },
    { id: 38, name: 'Palta Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta'] },
    { id: 39, name: 'Tomate Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate'] },
    { id: 40, name: 'Tomate Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate'] },
    { id: 41, name: 'Queso Normal', price: 6000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso'] },
    { id: 42, name: 'Queso Grande', price: 6500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso'] },
    { id: 43, name: 'Solo Carne Normal', price: 5000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: [] },
    { id: 44, name: 'Solo Carne Grande', price: 5500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: [] },
    {
        id: 45,
        name: 'Dinamico Normal',
        price: 6800,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 46,
        name: 'Dinamico Grande',
        price: 7300,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 47,
        name: 'Chacarero Normal',
        price: 6700,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño']
    },
    {
        id: 48,
        name: 'Chacarero Grande',
        price: 7200,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño']
    },
    {
        id: 49,
        name: 'Napolitano Normal',
        price: 6900,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin queso', 'sin tomate', 'sin oregano', 'sin aceituna'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    {
        id: 50,
        name: 'Napolitano Grande',
        price: 7400,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin queso', 'sin tomate', 'sin oregano', 'sin aceituna'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    { id: 51, name: 'Queso Champiñon Normal', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Sin Queso', 'Sin Champiñon', 'Sin Tocino'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino'] },
    { id: 52, name: 'Queso Champiñon Grande', price: 7500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Sin Queso', 'Sin Champiñon', 'Sin Tocino'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino'] },
    // --- Fajitas --- (Updated to standard modifications)
    { id: 104, name: 'Italiana', price: 9500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Palta', 'Tomate'] },
    { id: 105, name: 'Brasileño', price: 9200, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'cebolla caramelizada', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Queso Amarillo', 'Papas Hilo', 'Aceituna'] },
    { id: 106, name: 'Chacarero', price: 9800, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Aceituna', 'Bebida Lata', 'Papa Personal'] },
    { id: 107, name: 'Americana', price: 8900, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Cebolla Caramelizada', 'Aceituna', 'bebida lata', 'papa personal'] },
    { id: 108, name: 'Primavera', price: 9000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Palta', 'Choclo', 'Tomate'] },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Queso', 'Champiñones', 'Papas Hilo', 'Pimentón'] },
    { id: 110, name: '4 Ingredientes', price: 11000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Bebida Lata', 'Papa Personal'] },
    { id: 111, name: '6 Ingredientes', price: 12000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Bebida Lata', 'Papa Personal'] },
    // --- Hamburguesas --- (Updated Modifications)
    {
        id: 17,
        name: 'Simple',
        price: 7000,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Kétchup', 'Mostaza', 'Cebolla', 'Pepinillo', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 18,
        name: 'Doble',
        price: 8500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Kétchup', 'Mostaza', 'Cebolla', 'Pepinillo', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 67,
        name: 'Italiana',
        price: 7800,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Palta', 'Tomate', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 68,
        name: 'Doble Italiana',
        price: 9500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Palta', 'Tomate', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 69,
        name: 'Tapa Arteria',
        price: 10500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Huevo Frito', 'Cebolla Frita', 'Bacon']
    },
    {
        id: 70,
        name: 'Super Tapa Arteria',
        price: 13000,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso Cheddar', 'Aro Cebolla', 'Salsa Cheddar', 'Cebolla Caramelizada', 'Tocino', 'Kétchup', 'Mostaza', 'Pepinillo', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 71,
        name: 'Big Cami',
        price: 9800,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Lechuga', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Pepinillo', 'Salsa de la Casa', 'Kétchup', 'Mostaza', 'Cebolla', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 72,
        name: 'Super Big Cami',
        price: 12500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Lechuga', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Pepinillo', 'Salsa de la Casa', 'Kétchup', 'Mostaza', 'Cebolla', 'Bebida Lata', 'Papa Personal']
    },
    // --- Churrascos --- (Updated Modifications)
    {
        id: 19,
        name: 'Churrasco Italiano',
        price: 7500,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Palta', 'Tomate', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 20,
        name: 'Churrasco Completo',
        price: 7200,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Chucrut', 'Americana', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 53,
        name: 'Churrasco Queso',
        price: 7100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 54,
        name: 'Churrasco Tomate',
        price: 7000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 55,
        name: 'Churrasco Palta',
        price: 7300,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Palta', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 56,
        name: 'Churrasco Campestre',
        price: 7800,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Lechuga', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 57,
        name: 'Churrasco Dinamico',
        price: 7600,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Chucrut', 'Palta', 'Americana', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 58,
        name: 'Churrasco Napolitano',
        price: 7900,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 59,
        name: 'Churrasco Che milico',
        price: 8000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Cebolla Caramelizada', 'Huevo', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 60,
        name: 'Churrasco Queso Champiñon',
        price: 8100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso Champiñón', 'Tocino', 'Bebida Lata', 'Papa Personal']
    },
    // --- Papas Fritas --- (No modifications)
    {
        id: 21,
        name: 'Papas Fritas Normal',
        price: 3500,
        category: 'Papas Fritas',
        ingredients: ['Papas Fritas']
    },
    {
        id: 22,
        name: 'Papas Fritas Mediana',
        price: 5000,
        category: 'Papas Fritas',
        ingredients: ['Papas Fritas']
    },
    { id: 61, name: 'Papas Fritas Grande', price: 6500, category: 'Papas Fritas', ingredients: ['Papas Fritas'] },
    { id: 62, name: 'Papas Fritas XL', price: 8000, category: 'Papas Fritas', ingredients: ['Papas Fritas'] },
    { id: 63, name: 'Salchipapas', price: 7000, category: 'Papas Fritas', ingredients: ['Vienesas'] },
    { id: 64, name: 'Chorrillana 2', price: 12000, category: 'Papas Fritas', ingredients: ['Carne', 'Cebolla Frita', 'Huevo Frito x2'] },
    { id: 65, name: 'Chorrillana 4', price: 18000, category: 'Papas Fritas', ingredients: ['Carne x2', 'Cebolla Frita x2', 'Huevo Frito x4'] },
    { id: 66, name: 'Box Cami', price: 15000, category: 'Papas Fritas', ingredients: ['2 Papas XL', '8 Porciones Aro Cebolla', '8 Empanadas de Queso', '1 Porción Carne Vacuno', '6 Laminas Queso Cheddar', 'Tocino', 'Salsa Cheddar', 'Bebida 1.5Lt'] },
    // --- Promo Churrasco --- (Updated Modifications where applicable)
    {
        id: 25,
        name: 'Completo',
        price: 5500,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Chucrut', 'Americana', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 26,
        name: 'Italiano',
        price: 6000,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Palta', 'Bebida Lata', 'Papa Personal']
    },
    { id: 73, name: 'Chacarero', price: 7000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño', 'Bebida Lata', 'Papa Personal'] },
    { id: 74, name: 'Queso', price: 6500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Bebida Lata', 'Papa Personal'] },
    { id: 75, name: 'Palta', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Bebida Lata', 'Papa Personal'] },
    { id: 76, name: 'Tomate', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Bebida Lata', 'Papa Personal'] },
    { id: 77, name: 'Brasileño', price: 7200, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Queso', 'Bebida Lata', 'Papa Personal'] },
    { id: 78, name: 'Dinamico', price: 7300, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata', 'Papa Personal'] },
    { id: 79, name: 'Campestre', price: 7500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Lechuga', 'Bebida Lata', 'Papa Personal'] },
    { id: 80, name: 'Queso Champiñon', price: 7800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino', 'Bebida Lata', 'Papa Personal'] },
    { id: 81, name: 'Che milico', price: 8000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Cebolla Caramelizada', 'Huevo', 'Bebida Lata', 'Papa Personal'] },
    // --- Promo Mechada --- (Updated Modifications where applicable)
    {
      id: 4,
      name: 'Completo',
      price: 8000,
      category: 'Promo Mechada',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana', 'Bebida Lata', 'Papa Personal']
    },
    {
      id: 24,
      name: 'Italiano',
      price: 7800,
      category: 'Promo Mechada',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Tomate', 'Palta', 'Bebida Lata', 'Papa Personal']
    },
     { id: 82, name: 'Chacarero', price: 9000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño', 'Bebida Lata', 'Papa Personal'] },
     { id: 83, name: 'Queso', price: 8500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Bebida Lata', 'Papa Personal'] },
     { id: 84, name: 'Palta', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Bebida Lata', 'Papa Personal'] },
     { id: 85, name: 'Tomate', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Bebida Lata', 'Papa Personal'] },
     { id: 86, name: 'Brasileño', price: 9200, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Queso Amarillo', 'Papas Hilo', 'Aceituna', 'Bebida Lata', 'Papa Personal'] },
     { id: 87, name: 'Dinamico', price: 9300, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'Papa Personal'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata', 'Papa Personal'] },
     { id: 88, name: 'Campestre', price: 9500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Lechuga', 'Bebida Lata', 'Papa Personal'] },
     { id: 89, name: 'Queso Champiñon', price: 9800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino', 'Bebida Lata', 'Papa Personal'] },
     { id: 90, name: 'Che milico', price: 10000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Cebolla Caramelizada', 'Huevo', 'Bebida Lata', 'Papa Personal'] },
    // --- Promociones --- (Adding modifications)
    {
      id: 6,
      name: 'Promo 1',
      price: 4500,
      category: 'Promociones',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Churrasco XL', 'Bebida 1.5Lt', 'Papas Normal']
    },
     {
      id: 5,
      name: 'Promo 2',
      price: 5000,
      category: 'Promociones',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Churrasco XL', 'Queso o Chacarero', 'Bebida 1.5Lt', 'Papas Normal']
    },
    {
      id: 23,
      name: 'Promo 3',
      price: 6000,
      category: 'Promociones',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['4 Churrascos', 'Bebida 1.5Lt', 'Papas Mediana']
    },
    { id: 91, name: 'Promo 4', price: 6500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['2 Churrascos Lomito', 'Papa Personal'] },
    { id: 92, name: 'Promo 5', price: 7000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['2 Completo Vienesas Normal', '2 Latas', 'Papa Personal'] },
    { id: 93, name: 'Promo 6', price: 7500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['2 Completo Vienesas Grande', '2 Latas', 'Papa Personal'] },
    { id: 94, name: 'Promo 7', price: 8000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['2 Completo As Normal', '2 Latas', 'Papa Personal'] },
    { id: 95, name: 'Promo 8', price: 8500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['2 Completo As Grande', '2 Latas', 'Papa Personal'] },
    { id: 96, name: 'Promo 9', price: 9000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['4 Completo Vienesas Normal', '1 Bebida 1.5Lt', 'Papa Mediana'] },
    { id: 97, name: 'Promo 10', price: 9500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['4 Completo Vienesas Grande', '1 Bebida 1.5Lt', 'Papa Mediana'] },
    { id: 98, name: 'Promo 11', price: 10000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['4 Completo As Normal', '1 Bebida 1.5Lt', 'Papa Mediana'] },
    { id: 99, name: 'Promo 12', price: 10500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['4 Completo As Grande', '1 Bebida 1.5Lt', 'Papa Mediana'] },
    // --- Bebidas --- (No modifications)
    {
      id: 100,
      name: 'Bebida 1.5Lt', // Changed L to Lt
      price: 2000,
      category: 'Bebidas',
    },
     {
      id: 101,
      name: 'Lata',
      price: 1500,
      category: 'Bebidas',
    },
    {
      id: 102,
      name: 'Cafe Chico',
      price: 1800,
      category: 'Bebidas',
    },
    {
      id: 103,
      name: 'Cafe Grande',
      price: 2500,
      category: 'Bebidas',
    },
     // --- Colaciones --- (No modifications usually)
].filter(item => !(item.category === 'Fajitas' && [1, 2, 8].includes(item.id)));


// Define the desired order for categories
const orderedCategories = [
  'Completos Vienesas',
  'Completos As',
  'Fajitas',
  'Hamburguesas',
  'Churrascos',
  'Papas Fritas',
  'Promo Churrasco',
  'Promo Mechada',
  'Promociones',
  'Bebidas',
  'Colaciones',
];


// Helper function to extract number from promo name
const extractPromoNumber = (name: string): number => {
    const match = name.match(/^Promo (\d+)/i);
    return match ? parseInt(match[1], 10) : Infinity;
};


// Sort menu items by category order first, then alphabetically by name
const sortMenu = (menu: MenuItem[]): MenuItem[] => {
  return [...menu].sort((a, b) => {
    const categoryAIndex = orderedCategories.indexOf(a.category);
    const categoryBIndex = orderedCategories.indexOf(b.category);

    if (categoryAIndex !== categoryBIndex) {
        if (categoryAIndex === -1 && categoryBIndex === -1) return a.name.localeCompare(b.name);
        if (categoryAIndex === -1) return 1;
        if (categoryBIndex === -1) return -1;
        return categoryAIndex - categoryBIndex;
    }

     if (a.category === 'Promociones') {
        const numA = extractPromoNumber(a.name);
        const numB = extractPromoNumber(b.name);
        if (numA !== numB) {
            return numA - numB;
        }
      }


    return a.name.localeCompare(b.name);
  });
};

// Global state for menu items (consider Zustand or Redux for larger apps)
let globalMenu: MenuItem[] = sortMenu(mockMenu);

const updateGlobalMenu = (newMenu: MenuItem[]) => {
  globalMenu = sortMenu(newMenu);
  // Persist to localStorage or a backend if needed
};


// Component to display and manage products (used in both /products and table detail page)
// This component is now self-contained for the products page,
// and a simplified version will be used for the table detail page's menu sheet.
const ProductsPage = ({ onProductSelect, onEditProduct, onAddProduct }: {
  onProductSelect?: (product: MenuItem) => void; // Optional: if used for selection
  onEditProduct?: (product: MenuItem) => void; // Optional: if editing is handled by parent
  onAddProduct?: (product: Omit<MenuItem, 'id'>) => void; // Optional: if adding is handled by parent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>(globalMenu); // Local state for display, initialized from global
  const [isEditPriceDialogOpen, setIsEditPriceDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const { toast } = useToast();

  // Sync local menu with global changes (e.g., if another component updates it)
  useEffect(() => {
    setMenu(globalMenu);
  }, []); // Removed globalMenu from dependency array as it causes infinite loop with current setup


  const filteredProducts = menu.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditPriceDialog = (product: MenuItem) => {
    setEditingProduct(product);
    setNewPrice(product.price.toString());
    setIsEditPriceDialogOpen(true);
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

    const updatedMenu = menu.map(item =>
      item.id === editingProduct.id ? { ...item, price: priceValue } : item
    );
    setMenu(sortMenu(updatedMenu)); // Update local state first for immediate UI feedback
    updateGlobalMenu(updatedMenu); // Update global state

    if (onEditProduct) {
        onEditProduct({ ...editingProduct, price: priceValue });
    }
    const toastDescription = `El precio de ${editingProduct.name} se actualizó a ${globalFormatCurrency(priceValue)}.`;
    toast({ title: "Precio Actualizado", description: toastDescription});
    setIsEditPriceDialogOpen(false);
    setEditingProduct(null);
    setNewPrice('');
  };

  // Group products by category for accordion display
  const groupedMenu = useMemo(() => {
    const groups: { [key: string]: MenuItem[] } = {};
    filteredProducts.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return orderedCategories.reduce((acc, categoryName) => {
      if (groups[categoryName]) {
        acc[categoryName] = groups[categoryName];
      }
      return acc;
    }, {} as { [key: string]: MenuItem[] });
  }, [filteredProducts]);


  return (
    <>
      <Input
        type="text"
        placeholder="Buscar producto..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-full"
      />

      <Accordion type="multiple" className="w-full" defaultValue={orderedCategories}>
        {Object.entries(groupedMenu).map(([category, items]) => (
          <AccordionItem value={category} key={category} className="border-b-0">
            <AccordionTrigger className="text-xl font-semibold hover:bg-muted/50 px-4 py-3 rounded-md hover:no-underline">
                {category} ({items.length})
            </AccordionTrigger>
            <AccordionContent className="px-1 pt-2">
              <div className="grid grid-cols-1 gap-3">
                {items.map((item) => (
                  <Card key={item.id} className="flex flex-col rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 px-4 pt-3">
                      <CardTitle className="text-lg font-medium">{item.name}</CardTitle>
                       {item.ingredients && item.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ({item.ingredients.join(', ')})
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="flex-grow px-4 pb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-primary">{globalFormatCurrency(item.price)}</span>
                        {onProductSelect && ( // Only show "Añadir" button if onProductSelect prop is passed (meaning it's for the table detail sheet)
                          <Button size="sm" variant="outline" onClick={() => onProductSelect(item)} className="rounded-md">
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
       {/* Edit Price Dialog */}
       <ShadDialog open={isEditPriceDialogOpen} onOpenChange={setIsEditPriceDialogOpen}>
         <ShadDialogContent className="sm:max-w-[425px]">
           <ShadDialogHeader>
             <ShadDialogTitle>Editar Precio de {editingProduct?.name}</ShadDialogTitle>
             <ShadDialogDescription>
                 Actualice el precio base para este producto.
             </ShadDialogDescription>
           </ShadDialogHeader>
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
                     step="1"
                 />
             </div>
           </div>
           <ShadDialogFooter>
             <ShadDialogClose asChild>
                 <Button type="button" variant="secondary" onClick={() => setIsEditPriceDialogOpen(false)}>Cancelar</Button>
             </ShadDialogClose>
             <Button type="submit" onClick={handleUpdatePrice}>Guardar Cambios</Button>
           </ShadDialogFooter>
         </ShadDialogContent>
       </ShadDialog>
    </>
);
};

export default function TableDetailPage() {
  const params = useParams();
  const tableIdParam = params.tableId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrderGroups, setPendingOrderGroups] = useState<PendingOrderGroup[]>([]);
  const [selectedProductForModification, setSelectedProductForModification] = useState<MenuItem | null>(null);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [orderNumberCounter, setOrderNumberCounter] = useState<number>(1);
  const [hasInitialized, setHasInitialized] = useState(false); // Track initialization
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [selectedPendingOrderGroup, setSelectedPendingOrderGroup] = useState<PendingOrderGroup | null>(null);


  const isDelivery = tableIdParam === 'delivery';
  const currentTableId = isNaN(Number(tableIdParam)) ? tableIdParam : Number(tableIdParam);

  // Load initial state from sessionStorage
  useEffect(() => {
    if (hasInitialized) return; // Prevent re-initialization

    console.log(`Initializing state for table/delivery: ${tableIdParam}`);

    const storedOrder = sessionStorage.getItem(`table-${tableIdParam}-currentOrder`);
    if (storedOrder) {
      setCurrentOrder(JSON.parse(storedOrder));
      console.log(`Loaded currentOrder for ${tableIdParam}:`, JSON.parse(storedOrder));
    }

    const storedPendingOrders = sessionStorage.getItem(`table-${tableIdParam}-pendingOrders`);
     if (storedPendingOrders) {
        const parsedData = JSON.parse(storedPendingOrders) as PendingOrderStorageData;
        if (parsedData && Array.isArray(parsedData.groups)) {
            setPendingOrderGroups(parsedData.groups);
            console.log(`Loaded pendingOrderGroups for ${tableIdParam}:`, parsedData.groups);
        } else {
             setPendingOrderGroups([]); // Initialize as empty array if format is incorrect
        }
    }


    const storedOrderNumber = sessionStorage.getItem('orderNumberCounter');
    if (storedOrderNumber) {
      setOrderNumberCounter(parseInt(storedOrderNumber, 10));
      console.log('Loaded orderNumberCounter:', parseInt(storedOrderNumber, 10));
    }

    if (isDelivery) {
      const storedDeliveryInfo = sessionStorage.getItem(`deliveryInfo-${tableIdParam}`);
      if (storedDeliveryInfo) {
        setDeliveryInfo(JSON.parse(storedDeliveryInfo));
         console.log(`Loaded deliveryInfo for ${tableIdParam}:`, JSON.parse(storedDeliveryInfo));
      } else {
        // If it's a delivery table and no info, open dialog
        setIsDeliveryDialogOpen(true);
        console.log(`No deliveryInfo for ${tableIdParam}, opening dialog.`);
      }
    }
    setHasInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, hasInitialized, isDelivery]); // Dependencies ensure this runs once per table ID


  // --- Effect to save state changes to sessionStorage and update table status ---
  useEffect(() => {
    if (!hasInitialized) return; // Don't save until initialized

    console.log(`Saving state for ${tableIdParam}...`);
    sessionStorage.setItem(`table-${tableIdParam}-currentOrder`, JSON.stringify(currentOrder));
    const dataToStore: PendingOrderStorageData = { groups: pendingOrderGroups };
    sessionStorage.setItem(`table-${tableIdParam}-pendingOrders`, JSON.stringify(dataToStore));
    sessionStorage.setItem('orderNumberCounter', orderNumberCounter.toString());

    if (isDelivery && deliveryInfo) {
      sessionStorage.setItem(`deliveryInfo-${tableIdParam}`, JSON.stringify(deliveryInfo));
    }

    // Update table status
    const isOccupied = currentOrder.length > 0 || pendingOrderGroups.length > 0 || (isDelivery && !!deliveryInfo);
    sessionStorage.setItem(`table-${tableIdParam}-status`, isOccupied ? 'occupied' : 'available');
    console.log(`Table ${tableIdParam} status set to: ${isOccupied ? 'occupied' : 'available'}`);

  }, [currentOrder, pendingOrderGroups, orderNumberCounter, deliveryInfo, tableIdParam, isDelivery, hasInitialized]);


  const calculateItemFinalPrice = (basePrice: number, selectedMods?: string[], modificationPrices?: { [key: string]: number }) => {
    let finalPrice = basePrice;
    if (selectedMods && modificationPrices) {
      selectedMods.forEach(mod => {
        finalPrice += modificationPrices[mod] || 0;
      });
    }
    return finalPrice;
  };

  const handleAddToOrder = (product: MenuItem, selectedModifications?: string[]) => {
    const finalPrice = calculateItemFinalPrice(product.price, selectedModifications, product.modificationPrices);
    const orderItemId = `${product.id}-${selectedModifications ? selectedModifications.join('-') : 'no-mods'}`;

    setCurrentOrder(prevOrder => {
      const existingItemIndex = prevOrder.findIndex(item => item.orderItemId === orderItemId);
      if (existingItemIndex > -1) {
        const updatedOrder = [...prevOrder];
        updatedOrder[existingItemIndex].quantity += 1;
        return updatedOrder;
      } else {
        return [...prevOrder, {
          ...product,
          orderItemId,
          quantity: 1,
          selectedModifications,
          basePrice: product.price,
          finalPrice,
          ingredients: product.ingredients,
        }];
      }
    });
    toast({ title: `${product.name} añadido al pedido actual.` });
    setIsMenuSheetOpen(false); // Close sheet after adding
  };

  const handleOpenModificationDialog = (product: MenuItem) => {
    setSelectedProductForModification(product);
    setIsModificationDialogOpen(true);
  };

  const handleConfirmModifications = (mods: string[] | undefined) => {
    if (selectedProductForModification) {
      handleAddToOrder(selectedProductForModification, mods);
    }
    setIsModificationDialogOpen(false);
    setSelectedProductForModification(null);
  };

  const updateOrderItemQuantity = (orderItemId: string, delta: number) => {
    setCurrentOrder(prevOrder =>
      prevOrder.map(item =>
        item.orderItemId === orderItemId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

   const handlePrintKitchenOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Pedido Vacío", description: "Añada productos antes de imprimir la comanda.", variant: "destructive" });
      return;
    }

    const newOrderNumber = orderNumberCounter;
    setOrderNumberCounter(prev => (prev % 999) + 1); // Cycle order number

    const kitchenReceiptHtml = formatKitchenOrderReceipt(
        currentOrder,
        isDelivery ? `Delivery #${newOrderNumber}` : `Mesa ${tableIdParam} - Orden #${newOrderNumber}`,
        newOrderNumber,
        deliveryInfo
    );
    printHtml(kitchenReceiptHtml);

    // Move current order to pending orders
    setPendingOrderGroups(prevGroups => [
        ...prevGroups,
        { orderNumber: newOrderNumber, items: [...currentOrder], deliveryInfo: isDelivery ? deliveryInfo : null }
    ]);
    setCurrentOrder([]); // Clear current order
    toast({ title: "Comanda Enviada a Cocina", description: `Nº Orden: ${String(newOrderNumber).padStart(3, '0')}` });
  };


  const handleFinalizeAndPay = (groupToPay: PendingOrderGroup) => {
        setSelectedPendingOrderGroup(groupToPay);
        setIsPaymentDialogOpen(true);
  };


  const handleConfirmPayment = (paymentMethod: PaymentMethod, tipAmount: number, finalAmountWithTip: number) => {
    if (!selectedPendingOrderGroup) return;

    const { items: orderItems, deliveryInfo: orderDeliveryInfo, orderNumber } = selectedPendingOrderGroup;

    let totalPaid = 0;
    orderItems.forEach(item => totalPaid += item.finalPrice * item.quantity);

    // Add delivery fee to total if it's a delivery and fee exists
    let currentDeliveryFee = 0;
    if (isDelivery && orderDeliveryInfo && orderDeliveryInfo.deliveryFee > 0) {
        currentDeliveryFee = orderDeliveryInfo.deliveryFee;
    }
    // The finalAmountWithTip already includes the subtotal of items, delivery fee (if any from group), and tip.
    // totalPaid = finalAmountWithTip; // This is the actual amount collected

    const customerReceiptHtml = formatCustomerReceipt(
      orderItems,
      finalAmountWithTip, // Pass the grand total (items + delivery fee + tip)
      paymentMethod,
      tableIdParam,
      orderDeliveryInfo,
      tipAmount
    );
    printHtml(customerReceiptHtml);

    const newCashMovement: CashMovement = {
      id: Date.now(), // Or a more robust ID generation
      date: new Date(),
      category: 'Ingreso Venta',
      description: `Venta Orden #${String(orderNumber).padStart(3, '0')} (${tableIdParam})${tipAmount > 0 ? ` - Propina: ${globalFormatCurrency(tipAmount)}` : ''}`,
      amount: finalAmountWithTip - currentDeliveryFee, // Amount for cash register is total collected MINUS delivery fee
      paymentMethod: paymentMethod,
      deliveryFee: currentDeliveryFee > 0 ? currentDeliveryFee : undefined,
    };

    // Add to cash register movements
    const storedMovements = sessionStorage.getItem('cashMovements');
    const cashMovements: CashMovement[] = storedMovements ? JSON.parse(storedMovements) : [];
    sessionStorage.setItem('cashMovements', JSON.stringify([...cashMovements, newCashMovement]));

    // Deduct from inventory
    const storedInventory = localStorage.getItem('restaurantInventory');
    let inventory: InventoryItem[] = storedInventory ? JSON.parse(storedInventory) : [];

    orderItems.forEach(orderItem => {
        let itemsToDeduct: { name: string, quantity: number }[] = [];

        // Standard bread and vienesas deductions
        if (orderItem.category === 'Completos Vienesas') {
            if (orderItem.name.includes('Normal')) {
                itemsToDeduct.push({ name: 'Pan especial normal', quantity: 1 * orderItem.quantity });
                itemsToDeduct.push({ name: 'Vienesas', quantity: 1 * orderItem.quantity });
            } else if (orderItem.name.includes('Grande')) {
                itemsToDeduct.push({ name: 'Pan especial grande', quantity: 1 * orderItem.quantity });
                itemsToDeduct.push({ name: 'Vienesas', quantity: 2 * orderItem.quantity });
            }
        } else if (orderItem.category === 'Completos As') {
             if (orderItem.name.includes('Normal')) {
                itemsToDeduct.push({ name: 'Pan especial normal', quantity: 1 * orderItem.quantity });
            } else if (orderItem.name.includes('Grande')) {
                itemsToDeduct.push({ name: 'Pan especial grande', quantity: 1 * orderItem.quantity });
            }
        } else if (orderItem.category === 'Churrascos' || orderItem.category === 'Promo Churrasco' || orderItem.category === 'Promo Mechada') {
            const quantityPerItem = (orderItem.category === 'Promo Churrasco' || orderItem.category === 'Promo Mechada') && !orderItem.name.toLowerCase().includes("2x") ? 1 : 1; // Default to 1 unless specific logic for "2x" is needed elsewhere
            itemsToDeduct.push({ name: 'Pan de marraqueta', quantity: quantityPerItem * orderItem.quantity });
        } else if (orderItem.category === 'Hamburguesas') {
             if (orderItem.name.includes('Simple') || orderItem.name.includes('Italiana') || orderItem.name.includes('Tapa Arteria') || orderItem.name.includes('Big Cami')) {
                itemsToDeduct.push({ name: 'Pan de hamburguesa normal', quantity: 1 * orderItem.quantity });
            } else if (orderItem.name.includes('Doble') || orderItem.name.includes('Super')) { // Assuming 'Super' implies larger or double
                itemsToDeduct.push({ name: 'Pan de hamburguesa grande', quantity: 1 * orderItem.quantity });
            }
        } else if (orderItem.category === 'Fajitas') {
            // Add specific deductions for Fajitas if needed, e.g., a 'Tortilla' item
        }

        // Specific item deductions
        if (orderItem.name === 'Bebida 1.5Lt') itemsToDeduct.push({ name: 'Bebida 1.5Lt', quantity: 1 * orderItem.quantity });
        if (orderItem.name === 'Lata') itemsToDeduct.push({ name: 'Lata', quantity: 1 * orderItem.quantity });
        if (orderItem.name === 'Cafe Chico') itemsToDeduct.push({ name: 'Cafe Chico', quantity: 1 * orderItem.quantity });
        if (orderItem.name === 'Cafe Grande') itemsToDeduct.push({ name: 'Cafe Grande', quantity: 1 * orderItem.quantity });


        itemsToDeduct.forEach(deduction => {
            const inventoryItemIndex = inventory.findIndex(invItem => invItem.name.toLowerCase() === deduction.name.toLowerCase());
            if (inventoryItemIndex > -1) {
                inventory[inventoryItemIndex].stock = Math.max(0, inventory[inventoryItemIndex].stock - deduction.quantity);
            }
        });
    });
    localStorage.setItem('restaurantInventory', JSON.stringify(inventory));


    // Remove the paid group from pending orders
    setPendingOrderGroups(prevGroups => prevGroups.filter(group => group.orderNumber !== orderNumber));

    toast({ title: "Pago Exitoso", description: `Total Pagado: ${globalFormatCurrency(finalAmountWithTip)} con ${paymentMethod}.` });
    setIsPaymentDialogOpen(false);
    setSelectedPendingOrderGroup(null);

    // If it's a delivery, clear deliveryInfo after payment and check if table should become available
    if (isDelivery) {
      setDeliveryInfo(null); // Clear for next delivery
      sessionStorage.removeItem(`deliveryInfo-${tableIdParam}`);
      if (currentOrder.length === 0 && pendingOrderGroups.filter(group => group.orderNumber !== orderNumber).length === 0) {
           sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
      }
    }
  };


  const handleRemoveOrderItem = (orderItemId: string, fromPendingGroupNumber?: number) => {
     if (fromPendingGroupNumber !== undefined) {
        setPendingOrderGroups(prevGroups =>
            prevGroups.map(group =>
                group.orderNumber === fromPendingGroupNumber
                    ? { ...group, items: group.items.filter(item => item.orderItemId !== orderItemId) }
                    : group
            ).filter(group => group.items.length > 0) // Remove group if it becomes empty
        );
        toast({ title: "Producto Eliminado", description: "El producto ha sido eliminado del pedido pendiente.", variant: "destructive" });

    } else {
        setCurrentOrder(prevOrder => prevOrder.filter(item => item.orderItemId !== orderItemId));
        toast({ title: "Producto Eliminado", description: "El producto ha sido eliminado del pedido actual.", variant: "destructive" });
    }
  };

  const handleDeliveryInfoConfirm = (info: DeliveryInfo) => {
    setDeliveryInfo(info);
    setIsDeliveryDialogOpen(false);
    toast({ title: "Datos de Envío Guardados", description: `Envío para ${info.name} registrado.`});
  };

  const handleDeliveryDialogCancel = () => {
    // If delivery info is crucial and not set, redirect back or show a persistent message
    if (isDelivery && !deliveryInfo && pendingOrderGroups.length === 0 && currentOrder.length === 0) {
        toast({ title: "Datos de Envío Requeridos", description: "Debe ingresar los datos de envío para continuar.", variant: "destructive"});
        // Optionally, force dialog to stay open or redirect
        // setIsDeliveryDialogOpen(true); // Keep it open
        router.push('/tables'); // Or redirect
        return;
    }
    setIsDeliveryDialogOpen(false);
  };


  const currentOrderTotal = currentOrder.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

  // Calculate total for a specific pending order group
  const calculatePendingGroupTotal = (group: PendingOrderGroup | null): number => {
    if (!group) return 0;
    let groupTotal = group.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    if (group.deliveryInfo && group.deliveryInfo.deliveryFee > 0) {
        groupTotal += group.deliveryInfo.deliveryFee;
    }
    return groupTotal;
  };

  if (!hasInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando Mesa...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
       <div className="flex justify-start mb-6">
         <Button variant="outline" onClick={() => router.push('/tables')} className="group rounded-md shadow-sm hover:shadow-md transition-shadow">
           <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
           Volver a Mesas
           </Button>
       </div>

      <h1 className="text-3xl font-bold mb-6 text-center">
        {isDelivery ? `Pedido Delivery ${deliveryInfo ? `- ${deliveryInfo.name}` : ''}` : `Mesa ${tableIdParam}`}
        {isDelivery && (
            <Button variant="ghost" size="icon" onClick={() => setIsDeliveryDialogOpen(true)} className="ml-2">
                <Edit className="h-4 w-4" />
            </Button>
        )}
      </h1>

       {/* Delivery Info Dialog (only for delivery table) */}
       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo} // Pass existing data for editing
               onConfirm={handleDeliveryInfoConfirm}
               onCancel={handleDeliveryDialogCancel}
           />
       )}


        {/* Menu Trigger Button */}
        <div className="flex justify-center mb-6">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-8 py-6 text-lg rounded-md shadow-md hover:shadow-lg transition-shadow">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[500px] md:w-[600px] lg:w-[700px] p-0 flex flex-col rounded-l-xl shadow-2xl">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="text-2xl font-semibold">Menú</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-grow p-4">
                        <ProductsPage onProductSelect={handleOpenModificationDialog} />
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Order Section */}
        <Card className="flex flex-col h-full shadow-md rounded-lg">
          <CardHeader>
            <CardTitle>Pedido Actual</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-0">
             <ScrollArea className="h-[calc(100%-0px)] sm:h-[300px] md:h-[350px] lg:h-[400px] p-4">
                {currentOrder.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 font-bold">No hay productos en el pedido actual.</p>
                ) : (
                <div className="space-y-3">
                    {currentOrder.map(item => (
                    <div key={item.orderItemId} className="border p-3 rounded-md shadow-sm">
                        <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold">{item.name} <span className="text-xs text-muted-foreground font-bold">({globalFormatCurrency(item.finalPrice)} c/u)</span></p>
                             {item.selectedModifications && item.selectedModifications.length > 0 && (
                            <p className="text-xs text-muted-foreground font-bold">
                                ({item.selectedModifications.join(', ')})
                            </p>
                            )}
                             {item.ingredients && item.ingredients.length > 0 && (
                                <p className="text-xs text-muted-foreground italic font-bold">
                                    Ingredientes: {item.ingredients.join(', ')}
                                </p>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleRemoveOrderItem(item.orderItemId)}>
                            <XCircle className="h-4 w-4" />
                        </Button>
                        </div>
                        <div className="flex items-center justify-end mt-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateOrderItemQuantity(item.orderItemId, -1)}>
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="mx-3 font-bold w-5 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateOrderItemQuantity(item.orderItemId, 1)}>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                        <span className="ml-4 w-20 text-right font-bold">{globalFormatCurrency(item.finalPrice * item.quantity)}</span>
                         </div>
                    </div>
                    ))}
                </div>
                )}
            </ScrollArea>
          </CardContent>
          <Separator />
          <CardFooter className="p-4 flex flex-col items-stretch gap-3">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="font-bold">Total Actual:</span>
              <span className="font-bold">{globalFormatCurrency(currentOrderTotal)}</span>
            </div>
            <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>


        {/* Pending Orders Section */}
        <Card className="flex flex-col h-full shadow-md rounded-lg">
          <CardHeader>
            <CardTitle>Pedidos Pendientes de Pago</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto p-0">
            <ScrollArea className="h-[calc(100%-0px)] sm:h-[300px] md:h-[350px] lg:h-[400px] p-4">
                {pendingOrderGroups.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 font-bold">No hay pedidos pendientes.</p>
                ) : (
                <div className="space-y-4">
                    {pendingOrderGroups.map((group) => {
                       const groupTotal = calculatePendingGroupTotal(group);
                        return (
                            <Card key={group.orderNumber} className="bg-muted/50 rounded-md shadow-sm">
                                <CardHeader className="pb-2 pt-3 px-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base font-bold">
                                            Orden Nº: {String(group.orderNumber).padStart(3, '0')}
                                            {group.deliveryInfo && (
                                                <span className="text-xs block text-muted-foreground font-normal font-bold">
                                                     (Delivery: {group.deliveryInfo.name} - {globalFormatCurrency(group.deliveryInfo.deliveryFee)})
                                                </span>
                                            )}
                                        </CardTitle>
                                        <Button size="sm" onClick={() => handleFinalizeAndPay(group)} className="rounded-md">
                                            <CreditCard className="mr-2 h-4 w-4" /> Cobrar
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    <div className="space-y-2 text-sm">
                                    {group.items.map(item => (
                                        <div key={item.orderItemId} className="flex justify-between items-start border-b border-dashed pb-1 last:border-b-0 last:pb-0">
                                        <div>
                                            <p className="font-bold">{item.quantity}x {item.name} <span className="text-xs text-muted-foreground font-bold">({globalFormatCurrency(item.finalPrice)} c/u)</span></p>
                                             {item.selectedModifications && item.selectedModifications.length > 0 && (
                                            <p className="text-xs text-muted-foreground font-bold">
                                                ({item.selectedModifications.join(', ')})
                                            </p>
                                            )}
                                             {item.ingredients && item.ingredients.length > 0 && (
                                                <p className="text-xs text-muted-foreground italic font-bold">
                                                    Ingredientes: {item.ingredients.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold mr-2">{globalFormatCurrency(item.finalPrice * item.quantity)}</span>
                                            <Button variant="ghost" size="icon" className="text-destructive h-6 w-6" onClick={() => handleRemoveOrderItem(item.orderItemId, group.orderNumber)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        </div>
                                    ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t flex justify-end font-semibold">
                                        <span className="font-bold">Total Pedido: {globalFormatCurrency(groupTotal)}</span>
                                     </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
                )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>


      <ModificationDialog
        isOpen={isModificationDialogOpen}
        onOpenChange={setIsModificationDialogOpen}
        item={selectedProductForModification}
        onConfirm={handleConfirmModifications}
        onCancel={() => setIsModificationDialogOpen(false)}
      />

        {selectedPendingOrderGroup && (
            <PaymentDialog
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                totalAmount={calculatePendingGroupTotal(selectedPendingOrderGroup)}
                onConfirm={handleConfirmPayment}
            />
        )}
    </div>


      );
}
