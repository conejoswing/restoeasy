

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
import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard, ChevronRight, Banknote, Landmark, Home, Phone, User, DollarSign } from 'lucide-react'; // Added more icons
import {useToast} from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import PaymentDialog from '@/components/app/payment-dialog'; // Import the new PaymentDialog
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page'; // Import CashMovement type
import type { DeliveryInfo } from '@/components/app/delivery-dialog'; // Import DeliveryInfo type

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
      name: 'Italiano Normal',
      price: 4000,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
      id: 14,
      name: 'Italiano grande',
      price: 4500,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 }
    },
     {
      id: 15,
      name: 'Hot Dog Normal',
      price: 4200,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 }
    },
     {
        id: 27,
        name: 'Hot Dog Grande',
        price: 4700,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
     {
        id: 28,
        name: 'Completo Normal',
        price: 4300,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 29,
        name: 'Completo Grande',
        price: 4800,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 30,
        name: 'Palta Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 31,
        name: 'Palta Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
     {
        id: 32,
        name: 'Tomate Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 33,
        name: 'Tomate Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 34,
        name: 'Dinamico Normal',
        price: 4400,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 35,
        name: 'Dinamico Grande',
        price: 4900,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    // --- Completos As --- (Removed Porotos Verdes from Chacarero)
    {
      id: 10,
      name: 'Italiano Normal',
      price: 5500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
      id: 11,
      name: 'Italiano Grande',
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
      id: 12,
      name: 'Completo Normal',
      price: 6500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 }
    },
    { id: 36, name: 'Completo Grande', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 37, name: 'Palta Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 38, name: 'Palta Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 39, name: 'Tomate Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 40, name: 'Tomate Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 41, name: 'Queso Normal', price: 6000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 42, name: 'Queso Grande', price: 6500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 43, name: 'Solo Carne Normal', price: 5000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 44, name: 'Solo Carne Grande', price: 5500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 45, name: 'Dinamico Normal', price: 6800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 46, name: 'Dinamico Grande', price: 7300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 47, name: 'Chacarero Normal', price: 6700, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed Porotos Verdes
    { id: 48, name: 'Chacarero Grande', price: 7200, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed Porotos Verdes
    { id: 49, name: 'Napolitano Normal', price: 6900, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Queso Fundido', 'Orégano'], modificationPrices: { 'Agregado Queso': 1000 } }, // Kept Napolitano specific mods
    { id: 50, name: 'Napolitano Grande', price: 7400, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Queso Fundido', 'Orégano'], modificationPrices: { 'Agregado Queso': 1000 } }, // Kept Napolitano specific mods
    { id: 51, name: 'Queso Champiñon Normal', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 } }, // Kept Champiñon specific mods
    { id: 52, name: 'Queso Champiñon Grande', price: 7500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 } }, // Kept Champiñon specific mods
    // --- Fajitas --- (Updated to standard modifications)
    { id: 104, name: 'Italiana', price: 9500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 105, name: 'Brasileño', price: 9200, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 106, name: 'Chacarero', price: 9800, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed Porotos Verdes from Fajita Chacarero as well
    { id: 107, name: 'Americana', price: 8900, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 108, name: 'Primavera', price: 9000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 110, name: '4 Ingredientes', price: 11000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Choose your 4
    { id: 111, name: '6 Ingredientes', price: 12000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Choose your 6
    // --- Hamburguesas --- (Updated Modifications)
    {
        id: 17,
        name: 'Simple',
        price: 7000,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 18,
        name: 'Doble',
        price: 8500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 67,
        name: 'Italiana',
        price: 7800,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed Palta, Tomate
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 68,
        name: 'Doble Italiana',
        price: 9500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed Palta, Tomate
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 69,
        name: 'Tapa Arteria',
        price: 10500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Kept Tapa Arteria mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 70,
        name: 'Super Tapa Arteria',
        price: 13000,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Kept Super Tapa Arteria mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 71,
        name: 'Big Cami',
        price: 9800,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Kept Big Cami mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 72,
        name: 'Super Big Cami',
        price: 12500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Kept Super Big Cami mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    // --- Churrascos --- (Updated Modifications)
    {
        id: 19,
        name: 'Churrasco Italiano',
        price: 7500,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed Palta, Tomate
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 20,
        name: 'Churrasco Completo',
        price: 7200,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Already standard mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 53,
        name: 'Churrasco Queso',
        price: 7100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Already standard mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 54,
        name: 'Churrasco Tomate',
        price: 7000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Already standard mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 55,
        name: 'Churrasco Palta',
        price: 7300,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Already standard mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 56,
        name: 'Churrasco Campestre',
        price: 7800,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 57,
        name: 'Churrasco Dinamico',
        price: 7600,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 58,
        name: 'Churrasco Napolitano',
        price: 7900,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 59,
        name: 'Churrasco Che milico',
        price: 8000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 60,
        name: 'Churrasco Queso Champiñon',
        price: 8100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    // --- Papas Fritas --- (No modifications)
    {
        id: 21,
        name: 'Papas Fritas Normal',
        price: 3500,
        category: 'Papas Fritas',
    },
    {
        id: 22,
        name: 'Papas Fritas Mediana',
        price: 5000,
        category: 'Papas Fritas',
    },
    { id: 61, name: 'Papas Fritas Grande', price: 6500, category: 'Papas Fritas' },
    { id: 62, name: 'Papas Fritas XL', price: 8000, category: 'Papas Fritas' },
    { id: 63, name: 'Salchipapas', price: 7000, category: 'Papas Fritas' },
    { id: 64, name: 'Chorrillana 2', price: 12000, category: 'Papas Fritas' },
    { id: 65, name: 'Chorrillana 4', price: 18000, category: 'Papas Fritas' },
    { id: 66, name: 'Box Cami', price: 15000, category: 'Papas Fritas' },
    // --- Promo Churrasco --- (Updated Modifications where applicable)
    {
        id: 25,
        name: '2x Completo',
        price: 5500,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 26,
        name: '2x Italiano',
        price: 6000,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    { id: 73, name: '2x Chacarero', price: 7000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed Porotos Verdes
    { id: 74, name: '2x Queso', price: 6500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 75, name: '2x Palta', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 76, name: '2x Tomate', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 77, name: '2x Brasileño', price: 7200, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
    { id: 78, name: '2x Dinamico', price: 7300, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed specific mods
    { id: 79, name: '2x Campestre', price: 7500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed specific mods
    { id: 80, name: '2x Queso Champiñon', price: 7800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed specific mods
    { id: 81, name: '2x Che milico', price: 8000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed specific mods
    // --- Promo Mechada --- (Updated Modifications where applicable)
    {
      id: 4,
      name: '2x Completo',
      price: 8000,
      category: 'Promo Mechada',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
      id: 24,
      name: '2x Italiano',
      price: 7800,
      category: 'Promo Mechada',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 }
    },
     { id: 82, name: '2x Chacarero', price: 9000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed Porotos Verdes
     { id: 83, name: '2x Queso', price: 8500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
     { id: 84, name: '2x Palta', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
     { id: 85, name: '2x Tomate', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
     { id: 86, name: '2x Brasileño', price: 9200, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } },
     { id: 87, name: '2x Dinamico', price: 9300, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed specific mods
     { id: 88, name: '2x Campestre', price: 9500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed specific mods
     { id: 89, name: '2x Queso Champiñon', price: 9800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed specific mods
     { id: 90, name: '2x Che milico', price: 10000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 } }, // Removed specific mods
    // --- Promociones --- (No modifications)
    {
      id: 6,
      name: 'Promo 1',
      price: 4500,
      category: 'Promociones',
    },
     {
      id: 5,
      name: 'Promo 2',
      price: 5000,
      category: 'Promociones',
    },
    {
      id: 23,
      name: 'Promo 3',
      price: 6000,
      category: 'Promociones',
    },
    { id: 91, name: 'Promo 4', price: 6500, category: 'Promociones' },
    { id: 92, name: 'Promo 5', price: 7000, category: 'Promociones' },
    { id: 93, name: 'Promo 6', price: 7500, category: 'Promociones' },
    { id: 94, name: 'Promo 7', price: 8000, category: 'Promociones' },
    { id: 95, name: 'Promo 8', price: 8500, category: 'Promociones' },
    { id: 96, name: 'Promo 9', price: 9000, category: 'Promociones' },
    { id: 97, name: 'Promo 10', price: 9500, category: 'Promociones' },
    { id: 98, name: 'Promo 11', price: 10000, category: 'Promociones' },
    { id: 99, name: 'Promo 12', price: 10500, category: 'Promociones' },
    // --- Bebidas --- (No modifications)
    {
      id: 100,
      name: 'Bebida 1.5L',
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
  'Hamburguesas', // Added
  'Churrascos',   // Added
  'Papas Fritas', // Added
  'Promo Churrasco', // Changed from Colaciones
  'Promo Mechada', // Added
  'Promociones',
  'Bebidas',
   'Colaciones', // Added back
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
// Storage key for delivery info
const DELIVERY_INFO_STORAGE_KEY = 'deliveryInfo';


// Helper function to extract number from promo name
const extractPromoNumber = (name: string): number => {
    const match = name.match(/^Promo (\d+)/i);
    return match ? parseInt(match[1], 10) : Infinity; // Place non-numbered promos last
};


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

    // Special sorting for "Promociones" category
    if (a.category === 'Promociones') {
      const numA = extractPromoNumber(a.name);
      const numB = extractPromoNumber(b.name);
      if (numA !== numB) {
          return numA - numB; // Sort numerically
      }
    }


    // Default alphabetical sort for other categories or if numbers are equal
    return a.name.localeCompare(b.name);
  });
};

export type PaymentMethod = 'Efectivo' | 'Tarjeta Débito' | 'Tarjeta Crédito' | 'Transferencia';

export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tableIdParam = params.tableId as string;
  const isDelivery = tableIdParam === 'delivery'; // Check if it's the delivery "table"
  const [order, setOrder] = useState<OrderItem[]>([]); // Current items being added
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<OrderItem[]>([]); // Items sent to print
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [currentItemForModification, setCurrentItemForModification] = useState<MenuItem | null>(null);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false); // State for Menu Sheet
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization
  const [menuSheetView, setMenuSheetView] = useState<'categories' | 'items'>('categories'); // State for sheet view
  const [selectedCategoryForItemsView, setSelectedCategoryForItemsView] = useState<string | null>(null); // State for selected category in items view
  const [menuData, setMenuData] = useState<MenuItem[]>([]); // State for menu data
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false); // State for Payment Dialog
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null); // State for selected payment method
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false); // State for Delivery Dialog
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null); // State for delivery info


  // --- Load orders, status, menu, and delivery info from sessionStorage/mock on mount ---
  useEffect(() => {
    if (!tableIdParam || isInitialized) return; // Avoid running multiple times or without ID

    console.log(`Initializing state for table/delivery ${tableIdParam}...`);

    // --- Load Orders ---
    const storedCurrentOrder = sessionStorage.getItem(`table-${tableIdParam}-order`);
    const storedPendingOrder = sessionStorage.getItem(`table-${tableIdParam}-pending-order`);
    let parsedCurrentOrder: OrderItem[] = [];
    let parsedPendingOrder: OrderItem[] = [];

    if (storedCurrentOrder) {
      try {
        const parsed = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsed)) parsedCurrentOrder = parsed;
        else console.warn(`Invalid current order data for ${tableIdParam}.`);
      } catch (error) {
        console.error(`Failed to parse stored current order for ${tableIdParam}:`, error);
      }
    }
    if (storedPendingOrder) {
       try {
         const parsed = JSON.parse(storedPendingOrder);
         if (Array.isArray(parsed)) parsedPendingOrder = parsed;
         else console.warn(`Invalid pending order data for ${tableIdParam}.`);
       } catch (error) {
         console.error(`Failed to parse stored pending order for ${tableIdParam}:`, error);
       }
     }
     setOrder(parsedCurrentOrder);
     setPendingPaymentOrder(parsedPendingOrder);

     // --- Load Delivery Info (only for delivery) ---
     let loadedDeliveryInfo: DeliveryInfo | null = null;
     if (isDelivery) {
        const storedDeliveryInfo = sessionStorage.getItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`);
        if (storedDeliveryInfo) {
            try {
                const parsed = JSON.parse(storedDeliveryInfo);
                // Basic validation to ensure it has required fields
                if (parsed && parsed.address && parsed.phone && parsed.name && typeof parsed.deliveryFee === 'number') {
                    loadedDeliveryInfo = parsed;
                    setDeliveryInfo(loadedDeliveryInfo);
                    console.log(`Loaded delivery info for ${tableIdParam}.`);
                } else {
                    console.warn(`Invalid delivery info format for ${tableIdParam}.`);
                    setIsDeliveryDialogOpen(true); // Re-open dialog if data is invalid/missing
                }
            } catch (error) {
                console.error(`Failed to parse stored delivery info for ${tableIdParam}:`, error);
                setIsDeliveryDialogOpen(true); // Re-open dialog on parse error
            }
        } else {
             console.log(`No stored delivery info found for ${tableIdParam}, opening dialog.`);
             setIsDeliveryDialogOpen(true); // Open dialog if no info exists
        }
     }


     // --- Load Menu ---
     // For now, we always load from mock data, but you could add storage logic here
     const sortedInitialMenu = sortMenu(mockMenu);
     setMenuData(sortedInitialMenu);
     console.log("Loaded menu data.");


    // --- Determine and Update Table Status ---
    const hasCurrentItems = parsedCurrentOrder.length > 0;
    const hasPendingItems = parsedPendingOrder.length > 0;
    // For delivery, status depends on having delivery info *and* items
    const isOccupied = (isDelivery && loadedDeliveryInfo) || hasCurrentItems || hasPendingItems;
    let newStatus: 'available' | 'occupied' = isOccupied ? 'occupied' : 'available';

    const currentStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);
    if (currentStatus !== newStatus) {
       console.log(`Updating status for ${tableIdParam} from ${currentStatus || 'none'} to ${newStatus}`);
       sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
    } else {
       console.log(`Status for ${tableIdParam} is already ${currentStatus}`);
    }

    setIsInitialized(true); // Mark initialization as complete
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, isInitialized, isDelivery]); // Dependencies ensure this runs once per table ID


  // --- Save orders, delivery info, and update status to sessionStorage whenever they change ---
   useEffect(() => {
     // Only run this effect *after* initial state is loaded
     if (!isInitialized || !tableIdParam) return;

     console.log(`Saving state for ${tableIdParam}...`);

     const hasCurrentItems = order.length > 0;
     const hasPendingItems = pendingPaymentOrder.length > 0;

     // Save current order
     if (hasCurrentItems) {
        sessionStorage.setItem(`table-${tableIdParam}-order`, JSON.stringify(order));
        console.log(`Saved current order for ${tableIdParam}.`);
     } else {
        sessionStorage.removeItem(`table-${tableIdParam}-order`);
        console.log(`Removed current order for ${tableIdParam}.`);
     }

      // Save pending order
     if (hasPendingItems) {
        sessionStorage.setItem(`table-${tableIdParam}-pending-order`, JSON.stringify(pendingPaymentOrder));
         console.log(`Saved pending order for ${tableIdParam}.`);
     } else {
        sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);
         console.log(`Removed pending order for ${tableIdParam}.`);
     }

     // Save delivery info (only if it's the delivery table and info exists)
     if (isDelivery && deliveryInfo) {
        sessionStorage.setItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`, JSON.stringify(deliveryInfo));
        console.log(`Saved delivery info for ${tableIdParam}.`);
     } else if (isDelivery && !deliveryInfo) {
         // If delivery info is cleared, remove it from storage
         sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`);
         console.log(`Removed delivery info for ${tableIdParam}.`);
     }

     // Update table status based on whether items exist OR if it's delivery with info
     const newStatus = (hasCurrentItems || hasPendingItems || (isDelivery && !!deliveryInfo)) ? 'occupied' : 'available';
     const currentStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);

     if (currentStatus !== newStatus) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
        console.log(`Updated status for ${tableIdParam} to ${newStatus}.`);
     }

   }, [order, pendingPaymentOrder, deliveryInfo, tableIdParam, isInitialized, isDelivery]);


  // Helper to format currency
  const formatCurrency = (amount: number) => {
    // Format as CLP with no decimals
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  // Function to handle clicking a category (from Categories view in Sheet)
  const handleCategoryClick = (category: string) => {
    setSelectedCategoryForItemsView(category);
    setMenuSheetView('items'); // Switch to items view
  };

  // Function to handle clicking a menu item (from Items view in Sheet)
  const handleItemClick = (item: MenuItem) => {
     // Check if the item's category allows modifications
     const categoriesWithoutModifications = ['Papas Fritas', 'Promociones', 'Bebidas', 'Colaciones'];
     if (!categoriesWithoutModifications.includes(item.category) && item.modifications && item.modifications.length > 0) {
        setCurrentItemForModification(item);
        setIsModificationDialogOpen(true); // Open modification dialog
    } else {
        // If no modifications or category doesn't allow mods, add directly to current order
        addToOrder(item);
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


  // Calculate total based on finalPrice of each OrderItem, plus delivery fee if applicable
  const calculateTotal = (items: OrderItem[], includeDeliveryFee: boolean = false) => {
    const itemsTotal = items.reduce(
      (total, item) => total + item.finalPrice * item.quantity,
      0
    );
    // Add delivery fee only if requested and it's a delivery order with info
    const fee = (includeDeliveryFee && isDelivery && deliveryInfo) ? deliveryInfo.deliveryFee : 0;
    return itemsTotal + fee;
  };

  const handlePrintOrder = () => {
     if (order.length === 0) {
       toast({ title: "Error", description: "No hay artículos en el pedido actual para imprimir.", variant: "destructive" });
       return;
     }

     // Check for delivery info if it's a delivery order
     if (isDelivery && !deliveryInfo) {
        toast({ title: "Información Requerida", description: "Ingrese los datos de envío antes de imprimir la comanda.", variant: "destructive" });
        setIsDeliveryDialogOpen(true); // Re-open delivery dialog
        return;
     }


     console.log('Imprimiendo Comanda (Pedido Actual):', order);
     if (isDelivery && deliveryInfo) {
         console.log('Datos de Envío:', deliveryInfo);
     }

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

     // Calculate total of *new combined pending order*, including delivery fee
     const newPendingTotal = calculateTotal(currentPendingCopy, true); // Include delivery fee

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
       // Open the payment method dialog instead of printing directly
       setIsPaymentDialogOpen(true);
    };

    // Function to handle the confirmation of payment method
    const handleConfirmPayment = (method: PaymentMethod) => {
        setIsPaymentDialogOpen(false); // Close the dialog
        setSelectedPaymentMethod(method); // Store the selected method (optional, could be used in toast or logs)

        // Now proceed with the original print logic
        const finalTotalToPay = calculateTotal(pendingPaymentOrder, true); // Calculate final total *including delivery fee*

        console.log(`Imprimiendo Boleta/Factura (Pedido Pendiente) - Método: ${method}`);
        console.log('Pedido:', pendingPaymentOrder);
        if (isDelivery && deliveryInfo) {
            console.log('Datos de Envío:', deliveryInfo);
            console.log('Costo de Envío:', formatCurrency(deliveryInfo.deliveryFee));
        }
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
            const saleDescription = isDelivery
                ? `Venta ${getPageTitle()} a ${deliveryInfo?.name} (${deliveryInfo?.address})`
                : `Venta ${getPageTitle()}`;
            const saleMovement: CashMovement = {
                id: newMovementId,
                date: new Date(), // Use current date/time for the sale
                category: 'Ingreso Venta',
                description: saleDescription, // Add delivery info to description if applicable
                amount: finalTotalToPay, // Positive amount for income
                paymentMethod: method // Add the selected payment method
            };

            // Add the new sale and sort (most recent first)
            const updatedMovements = [...currentMovements, saleMovement].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Save back to sessionStorage (store dates as ISO strings)
            sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(
                 updatedMovements.map(m => ({...m, date: m.date instanceof Date ? m.date.toISOString() : m.date }))
             ));
            console.log(`Sale of ${formatCurrency(finalTotalToPay)} (${method}) registered in cash movements.`);

       } catch (error) {
            console.error("Error registering sale in cash movements:", error);
            toast({title: "Error Interno", description: "No se pudo registrar la venta en la caja.", variant: "destructive"});
            // Decide if you want to proceed with clearing the pending order even if saving fails
            // return; // Option: Stop here if saving fails
       }


       // --- Clear pending order and delivery info (for delivery) ---
       setPendingPaymentOrder([]); // Clear the pending order state immediately
       if (isDelivery) {
           setDeliveryInfo(null); // Clear delivery info after payment
           sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`); // Remove from storage
       }


       // Status update is handled by the save useEffect hook

       toast({
         title: "¡Pago Impreso!",
         description: `Boleta/Factura por ${formatCurrency(finalTotalToPay)} (${method}) impresa. Venta registrada en caja. ${isDelivery ? 'Datos de envío limpiados.' : 'Mesa disponible si no hay pedido actual.'}`,
         variant: "default",
         className: "bg-blue-200 text-blue-800 border-blue-400" // Using direct colors for payment success
       });
    };

    // Function to handle saving delivery info from the dialog
    const handleSaveDeliveryInfo = (info: DeliveryInfo) => {
        setDeliveryInfo(info);
        setIsDeliveryDialogOpen(false);
        toast({ title: "Datos de Envío Guardados", description: `Costo de envío: ${formatCurrency(info.deliveryFee)}.` });
        // Status update is handled by the save useEffect hook
    };


  // Filter menu items based on the selected category (used in Items view)
  const filteredMenu = menuData.filter( // Use menuData state here
    (item) => item.category === selectedCategoryForItemsView
  );

  const currentOrderTotal = calculateTotal(order); // Calculate current order total (though not displayed directly)
  const pendingOrderTotal = calculateTotal(pendingPaymentOrder, true); // Calculate pending total *including delivery fee*

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

  // Render Menu Categories or Items inside the Sheet based on view state
  const renderMenuSheetContent = () => {
    if (menuSheetView === 'categories') {
        return (
            <div className="p-4">
                <ScrollArea className="h-[calc(100vh-150px)]"> {/* Adjusted height */}
                    <ul className="space-y-2">
                        {orderedCategories.map((category) => (
                            <li
                                key={category}
                                className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => handleCategoryClick(category)}
                            >
                                <span className="font-medium">{category}</span>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </div>
        );
    } else if (menuSheetView === 'items' && selectedCategoryForItemsView) {
        return (
            <div className="p-4 flex flex-col h-full"> {/* Use flex-col and h-full */}
                <Button variant="ghost" onClick={() => setMenuSheetView('categories')} className="mb-4 self-start"> {/* Align button left */}
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Categorías
                </Button>
                {/* Make ScrollArea take remaining height */}
                <ScrollArea className="flex-grow">
                    <ul className="space-y-2">
                        {filteredMenu.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => handleItemClick(item)} // Use handleItemClick
                            >
                                <span className="font-medium">{item.name}</span>
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
    }
    return null; // Should not happen
  };

   // Function to close the menu sheet and reset view state
   const closeMenuSheet = () => {
        setIsMenuSheetOpen(false);
        // Reset view state when closing
        setTimeout(() => { // Delay reset slightly to allow animation
            setMenuSheetView('categories');
            setSelectedCategoryForItemsView(null);
        }, 300);
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
                             // Use menuData state to find the original item
                            const originalItem = menuData.find(menuItem => menuItem.id === item.id);
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
    return <div className="flex items-center justify-center min-h-screen">Cargando datos...</div>;
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-theme(spacing.16))] flex flex-col">
       <div className="flex items-center mb-4"> {/* Reduced margin bottom */}
         <Button variant="outline" size="icon" onClick={() => router.push('/tables')} className="mr-2 h-10 w-10 rounded-md bg-card hover:bg-accent"> {/* Changed variant to outline */}
           <ArrowLeft className="h-6 w-6" />
         </Button>
         <h1 className="text-3xl font-bold">{getPageTitle()} - Pedido</h1>
         {/* Button to edit Delivery Info, only shown for delivery */}
          {isDelivery && (
             <Button variant="outline" size="sm" className="ml-auto" onClick={() => setIsDeliveryDialogOpen(true)}>
                  Editar Datos Envío
             </Button>
          )}
       </div>

        {/* Delivery Info Display (only for delivery and if info exists) */}
        {isDelivery && deliveryInfo && (
            <Card className="mb-4 border-primary bg-secondary/20">
                 <CardHeader className="p-3 pb-2">
                     <CardTitle className="text-md flex items-center">
                        <Home className="mr-2 h-4 w-4" /> Datos de Envío
                     </CardTitle>
                 </CardHeader>
                <CardContent className="p-3 pt-0 text-sm grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1">
                     <div className="flex items-center"><User className="mr-1.5 h-3 w-3 text-muted-foreground"/>{deliveryInfo.name}</div>
                     <div className="flex items-center"><Phone className="mr-1.5 h-3 w-3 text-muted-foreground"/>{deliveryInfo.phone}</div>
                     <div className="sm:col-span-2 flex items-center"><Home className="mr-1.5 h-3 w-3 text-muted-foreground"/>{deliveryInfo.address}</div>
                    <div className="flex items-center font-semibold"><DollarSign className="mr-1.5 h-3 w-3 text-muted-foreground"/>Costo Envío: {formatCurrency(deliveryInfo.deliveryFee)}</div>
                 </CardContent>
            </Card>
        )}

        {/* Menu Button Centered Above */}
        <div className="flex justify-center mb-4">
            <Button
                onClick={() => setIsMenuSheetOpen(true)}
                className="h-12 text-md bg-primary hover:bg-primary/90" // Adjusted size/text
                disabled={isDelivery && !deliveryInfo} // Disable menu if delivery info is missing
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
              {/* Show delivery fee in pending section if applicable */}
              {isDelivery && deliveryInfo && pendingPaymentOrder.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center text-sm font-medium pt-1">
                    <span>Costo de Envío:</span>
                    <span className='font-mono'>{formatCurrency(deliveryInfo.deliveryFee)}</span>
                  </div>
                </>
              )}
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
        <Sheet open={isMenuSheetOpen} onOpenChange={closeMenuSheet}> {/* Use closeMenuSheet */}
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0" side="left"> {/* Removed padding p-0 */}
                <SheetHeader className="flex-shrink-0 p-4 pb-0"> {/* Added padding back, remove bottom padding */}
                  <SheetTitle className={cn(
                      "text-center text-lg font-semibold py-2 rounded-md bg-muted text-muted-foreground"
                      // Removed border class
                   )}>
                    {menuSheetView === 'categories' ? 'Menú' : selectedCategoryForItemsView}
                  </SheetTitle>
                </SheetHeader>
                 {/* Make content area flexible and scrollable */}
                 <div className="flex-grow overflow-hidden">
                    {renderMenuSheetContent()} {/* Render categories or items */}
                 </div>
                 <SheetFooter className="mt-auto p-4 flex-shrink-0 border-t">
                   <Button onClick={closeMenuSheet} className="w-full">Confirmar</Button>
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

        {/* Payment Method Dialog */}
        <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            totalAmount={pendingOrderTotal}
            onConfirm={handleConfirmPayment}
        />

       {/* Delivery Info Dialog (only for delivery table) */}
       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo} // Pass existing data for editing
               onConfirm={handleSaveDeliveryInfo}
               onCancel={() => {
                 // Only allow cancelling if info already exists, otherwise force entry
                 if (!deliveryInfo) {
                    toast({title: "Información Requerida", description: "Debe ingresar los datos de envío para continuar.", variant: "destructive"});
                 } else {
                    setIsDeliveryDialogOpen(false); // Allow closing if info exists
                 }
               }}
           />
       )}
    </div>
  );
}
