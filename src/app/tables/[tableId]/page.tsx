'use client';

import * as React from 'react';
import {useState, useEffect, useMemo} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, buttonVariants} from '@/components/ui/button'; // Import buttonVariants
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter, // Make sure CardFooter is imported
} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import { Input } from '@/components/ui/input'; // Import Input component
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger, // Import SheetTrigger
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Import Table components
import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard, ChevronRight, Banknote, Landmark, Home, Phone, User, DollarSign, PackageSearch } from 'lucide-react'; // Added more icons
import {useToast} from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import PaymentDialog from '@/components/app/payment-dialog'; // Import the new PaymentDialog
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page'; // Import CashMovement type
import type { DeliveryInfo } from '@/components/app/delivery-dialog'; // Import DeliveryInfo type
import DeliveryDialog from '@/components/app/delivery-dialog'; // Import DeliveryDialog
import { formatKitchenOrderReceipt, formatCustomerReceipt, printHtml } from '@/lib/printUtils'; // Import printing utilities
import type { InventoryItem } from '@/app/inventory/page'; // Import InventoryItem type

interface MenuItem {
  id: number;
  name: string;
  price: number; // Base price
  category: string;
  modifications?: string[]; // Optional list of modifications
  modificationPrices?: { [key: string]: number }; // Optional map of modification name to additional price
  ingredients?: string[]; // Optional list of ingredients
}

// OrderItem now includes an array of selected modifications and the calculated price
export interface OrderItem extends Omit<MenuItem, 'price' | 'modificationPrices' | 'modifications' | 'ingredients'> { // Export for printUtils, Omit ingredients here too
  orderItemId: string; // Unique ID for this specific item instance in the order
  quantity: number;
  selectedModifications?: string[]; // Array of selected mods
  basePrice: number; // Store the original base price
  finalPrice: number; // Store the calculated price (base + modifications)
  // ingredients?: string[]; // Ingredients are only on MenuItem, not stored in OrderItem
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta Débito' | 'Tarjeta Crédito' | 'Transferencia';

// Interface for pending order data stored in sessionStorage
interface PendingOrderData {
    items: OrderItem[];
    deliveryInfo?: DeliveryInfo | null;
    totalAmount: number; // Store total amount explicitly
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
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Pan Especial Normal', 'Vienesa', 'Palta', 'Tomate']
    },
    {
      id: 14,
      name: 'Italiano Grande',
      price: 4500,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Pan Especial Grande', 'Vienesa x2', 'Palta', 'Tomate']
    },
     {
      id: 15,
      name: 'Hot Dog Normal',
      price: 4200,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Pan Especial Normal', 'Vienesa', 'Salsas']
    },
     {
        id: 27,
        name: 'Hot Dog Grande',
        price: 4700,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Grande', 'Vienesa x2', 'Salsas']
    },
     {
        id: 28,
        name: 'Completo Normal',
        price: 4300,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana'] // Updated ingredients
    },
    {
        id: 29,
        name: 'Completo Grande',
        price: 4800,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana'] // Updated ingredients
    },
    {
        id: 30,
        name: 'Palta Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Vienesa', 'Palta']
    },
    {
        id: 31,
        name: 'Palta Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Grande', 'Vienesa x2', 'Palta']
    },
     {
        id: 32,
        name: 'Tomate Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Vienesa', 'Tomate']
    },
    {
        id: 33,
        name: 'Tomate Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Grande', 'Vienesa x2', 'Tomate']
    },
    {
        id: 34,
        name: 'Dinamico Normal',
        price: 4400,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Vienesa', 'Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 35,
        name: 'Dinamico Grande',
        price: 4900,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Grande', 'Vienesa x2', 'Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    // --- Completos As --- (Updated mods for Dinamico and Chacarero)
    {
      id: 10,
      name: 'Italiano Normal',
      price: 5500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Pan Especial Normal', 'Carne As', 'Palta', 'Tomate']
    },
    {
      id: 11,
      name: 'Italiano Grande',
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Pan Especial Grande', 'Carne As', 'Palta', 'Tomate']
    },
    {
      id: 12,
      name: 'Completo Normal',
      price: 6500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Carne As', 'Tomate', 'Chucrut', 'Americana']
    },
    { id: 36, name: 'Completo Grande', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Tomate', 'Chucrut', 'Americana'] },
    { id: 37, name: 'Palta Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As', 'Palta'] },
    { id: 38, name: 'Palta Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Palta'] },
    { id: 39, name: 'Tomate Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As', 'Tomate'] },
    { id: 40, name: 'Tomate Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Tomate'] },
    { id: 41, name: 'Queso Normal', price: 6000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As', 'Queso'] },
    { id: 42, name: 'Queso Grande', price: 6500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Queso'] },
    { id: 43, name: 'Solo Carne Normal', price: 5000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As'] },
    { id: 44, name: 'Solo Carne Grande', price: 5500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As'] },
    {
        id: 45,
        name: 'Dinamico Normal',
        price: 6800,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Carne As', 'Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 46,
        name: 'Dinamico Grande',
        price: 7300,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Especial Grande', 'Carne As', 'Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 47,
        name: 'Chacarero Normal',
        price: 6700,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Especial Normal', 'Carne As', 'Tomate', 'Poroto Verde', 'Ají Verde']
    },
    {
        id: 48,
        name: 'Chacarero Grande',
        price: 7200,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verve', 'con aji jalapeño', 'sin aji jalapeño'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Especial Grande', 'Carne As', 'Tomate', 'Poroto Verde', 'Ají Verde']
    },
    {
        id: 49,
        name: 'Napolitano Normal',
        price: 6900,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con queso', 'sin queso', 'con tomate', 'sin tomate', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Carne As', 'Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    {
        id: 50,
        name: 'Napolitano Grande',
        price: 7400,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con queso', 'sin queso', 'con tomate', 'sin tomate', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Especial Grande', 'Carne As', 'Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    { id: 51, name: 'Queso Champiñon Normal', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As', 'Queso Fundido', 'Champiñones Salteados'] }, // Kept Champiñon specific mods
    { id: 52, name: 'Queso Champiñon Grande', price: 7500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Queso Fundido', 'Champiñones Salteados'] }, // Kept Champiñon specific mods
    // --- Fajitas --- (Updated to standard modifications)
    { id: 104, name: 'Italiana', price: 9500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tortilla', 'Carne Fajita', 'Palta', 'Tomate'] },
    { id: 105, name: 'Brasileño', price: 9200, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tortilla', 'Carne Fajita', 'Palta', 'Queso'] },
    { id: 106, name: 'Chacarero', price: 9800, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tortilla', 'Carne Fajita', 'Tomate', 'Poroto Verde', 'Ají Verde'] }, // Removed Porotos Verdes from Fajita Chacarero as well
    { id: 107, name: 'Americana', price: 8900, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tortilla', 'Carne Fajita', 'Queso', 'Champiñones', 'Jamón'] },
    { id: 108, name: 'Primavera', price: 9000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tortilla', 'Carne Fajita', 'Palta', 'Choclo', 'Tomate'] },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tortilla', 'Carne Fajita', 'Queso', 'Champiñones', 'Papas Hilo', 'Pimentón'] },
    { id: 110, name: '4 Ingredientes', price: 11000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tortilla', 'Carne Fajita', '(Elegir 4)'] }, // Choose your 4
    { id: 111, name: '6 Ingredientes', price: 12000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tortilla', 'Carne Fajita', '(Elegir 6)'] }, // Choose your 6
    // --- Hamburguesas --- (Updated Modifications)
    {
        id: 17,
        name: 'Simple',
        price: 7000,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Hamburguesa Normal', 'Carne Hamburguesa', 'Lechuga', 'Tomate']
    },
    {
        id: 18,
        name: 'Doble',
        price: 8500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Hamburguesa Grande', 'Carne Hamburguesa x2', 'Queso', 'Lechuga', 'Tomate']
    },
    {
        id: 67,
        name: 'Italiana',
        price: 7800,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed Palta, Tomate
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Hamburguesa Normal', 'Carne Hamburguesa', 'Palta', 'Tomate']
    },
    {
        id: 68,
        name: 'Doble Italiana',
        price: 9500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed Palta, Tomate
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Hamburguesa Grande', 'Carne Hamburguesa x2', 'Palta', 'Tomate']
    },
    {
        id: 69,
        name: 'Tapa Arteria',
        price: 10500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Kept Tapa Arteria mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Hamburguesa Grande', 'Carne Hamburguesa x3', 'Queso x3', 'Huevo Frito', 'Cebolla Frita', 'Bacon']
    },
    {
        id: 70,
        name: 'Super Tapa Arteria',
        price: 13000,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Kept Super Tapa Arteria mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Hamburguesa Grande', 'Carne Hamburguesa x4', 'Queso x4', 'Huevo Frito x2', 'Cebolla Frita', 'Bacon x2']
    },
    {
        id: 71,
        name: 'Big Cami',
        price: 9800,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Kept Big Cami mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Hamburguesa Normal', 'Carne Hamburguesa x2', 'Queso Cheddar x2', 'Lechuga', 'Pepinillos', 'Salsa Especial']
    },
    {
        id: 72,
        name: 'Super Big Cami',
        price: 12500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Kept Super Big Cami mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Hamburguesa Grande', 'Carne Hamburguesa x4', 'Queso Cheddar x4', 'Lechuga', 'Pepinillos', 'Salsa Especial']
    },
    // --- Churrascos --- (Updated Modifications)
    {
        id: 19,
        name: 'Churrasco Italiano',
        price: 7500,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed Palta, Tomate
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Palta', 'Tomate']
    },
    {
        id: 20,
        name: 'Churrasco Completo',
        price: 7200,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Already standard mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 53,
        name: 'Churrasco Queso',
        price: 7100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Already standard mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso']
    },
    {
        id: 54,
        name: 'Churrasco Tomate',
        price: 7000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Already standard mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Tomate']
    },
    {
        id: 55,
        name: 'Churrasco Palta',
        price: 7300,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Already standard mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Palta']
    },
    {
        id: 56,
        name: 'Churrasco Campestre',
        price: 7800,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita']
    },
    {
        id: 57,
        name: 'Churrasco Dinamico',
        price: 7600,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 58,
        name: 'Churrasco Napolitano',
        price: 7900,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    {
        id: 59,
        name: 'Churrasco Che milico',
        price: 8000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas']
    },
    {
        id: 60,
        name: 'Churrasco Queso Champiñon',
        price: 8100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], // Removed specific mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso Fundido', 'Champiñones Salteados']
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
    { id: 63, name: 'Salchipapas', price: 7000, category: 'Papas Fritas', ingredients: ['Papas Fritas', 'Vienesas', 'Salsas'] },
    { id: 64, name: 'Chorrillana 2', price: 12000, category: 'Papas Fritas', ingredients: ['Papas Fritas', 'Carne', 'Cebolla Frita', 'Huevo Frito x2'] },
    { id: 65, name: 'Chorrillana 4', price: 18000, category: 'Papas Fritas', ingredients: ['Papas Fritas', 'Carne x2', 'Cebolla Frita x2', 'Huevo Frito x4'] },
    { id: 66, name: 'Box Cami', price: 15000, category: 'Papas Fritas', ingredients: ['Papas Fritas', 'Carne', 'Vienesa', 'Queso Fundido', 'Champiñones', 'Pimentón'] },
    // --- Promo Churrasco --- (Updated Modifications where applicable)
    {
        id: 25,
        name: 'Completo',
        price: 5500,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Tomate', 'Chucrut', 'Americana', 'Bebida Lata']
    },
    {
        id: 26,
        name: 'Italiano',
        price: 6000,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Palta', 'Tomate', 'Bebida Lata']
    },
    { id: 73, name: 'Chacarero', price: 7000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Tomate', 'Poroto Verde', 'Ají Verde', 'Bebida Lata'] }, // Removed Porotos Verdes
    { id: 74, name: 'Queso', price: 6500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso', 'Bebida Lata'] },
    { id: 75, name: 'Palta', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Palta', 'Bebida Lata'] },
    { id: 76, name: 'Tomate', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Tomate', 'Bebida Lata'] },
    { id: 77, name: 'Brasileño', price: 7200, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Palta', 'Queso', 'Bebida Lata'] },
    { id: 78, name: 'Dinamico', price: 7300, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata'] }, // Removed specific mods
    { id: 79, name: 'Campestre', price: 7500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Bebida Lata'] }, // Removed specific mods
    { id: 80, name: 'Queso Champiñon', price: 7800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso Fundido', 'Champiñones Salteados', 'Bebida Lata'] }, // Removed specific mods
    { id: 81, name: 'Che milico', price: 8000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas', 'Bebida Lata'] }, // Removed specific mods
    // --- Promo Mechada --- (Updated Modifications where applicable)
    {
      id: 4,
      name: 'Completo',
      price: 8000,
      category: 'Promo Mechada',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Tomate', 'Chucrut', 'Americana', 'Bebida Lata']
    },
    {
      id: 24,
      name: 'Italiano',
      price: 7800,
      category: 'Promo Mechada',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Palta', 'Tomate', 'Bebida Lata']
    },
     { id: 82, name: 'Chacarero', price: 9000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Tomate', 'Poroto Verde', 'Ají Verde', 'Bebida Lata'] }, // Removed Porotos Verdes
     { id: 83, name: 'Queso', price: 8500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Queso', 'Bebida Lata'] },
     { id: 84, name: 'Palta', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Palta', 'Bebida Lata'] },
     { id: 85, name: 'Tomate', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Tomate', 'Bebida Lata'] },
     { id: 86, name: 'Brasileño', price: 9200, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Palta', 'Queso', 'Bebida Lata'] },
     { id: 87, name: 'Dinamico', price: 9300, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata'] }, // Removed specific mods
     { id: 88, name: 'Campestre', price: 9500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Bebida Lata'] }, // Removed specific mods
     { id: 89, name: 'Queso Champiñon', price: 9800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Queso Fundido', 'Champiñones Salteados', 'Bebida Lata'] }, // Removed specific mods
     { id: 90, name: 'Che milico', price: 10000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Mechada', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas', 'Bebida Lata'] }, // Removed specific mods
    // --- Promociones --- (Adding modifications)
    {
      id: 6,
      name: 'Promo 1',
      price: 4500,
      category: 'Promociones',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Completo Normal', 'Bebida Lata']
    },
     {
      id: 5,
      name: 'Promo 2',
      price: 5000,
      category: 'Promociones',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Italiano Normal', 'Bebida Lata']
    },
    {
      id: 23,
      name: 'Promo 3',
      price: 6000,
      category: 'Promociones',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Churrasco Simple', 'Bebida Lata']
    },
    { id: 91, name: 'Promo 4', price: 6500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Hamburguesa Simple', 'Bebida Lata'] },
    { id: 92, name: 'Promo 5', price: 7000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 5 Placeholder'] }, // Add specific ingredients
    { id: 93, name: 'Promo 6', price: 7500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 6 Placeholder'] },
    { id: 94, name: 'Promo 7', price: 8000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 7 Placeholder'] },
    { id: 95, name: 'Promo 8', price: 8500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 8 Placeholder'] },
    { id: 96, name: 'Promo 9', price: 9000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 9 Placeholder'] },
    { id: 97, name: 'Promo 10', price: 9500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 10 Placeholder'] },
    { id: 98, name: 'Promo 11', price: 10000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 11 Placeholder'] },
    { id: 99, name: 'Promo 12', price: 10500, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 12 Placeholder'] },
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
  'Hamburguesas', // Added
  'Churrascos',   // Added
  'Papas Fritas', // Added
  'Promo Churrasco',
  'Promo Mechada',
  'Promociones',
  'Bebidas',
  'Colaciones', // Added back
];


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


    return a.name.localeCompare(b.name);
  });
};


export default function TableDetailPage() {
  const params = useParams();
  const tableIdParam = params.tableId as string; // Assuming tableId is always a string from URL
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderItem[]>([]);
  const [pendingOrder, setPendingOrder] = useState<OrderItem[]>([]); // For items printed to kitchen but not yet paid
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [itemToModify, setItemToModify] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false); // State for menu sheet
  const [searchTerm, setSearchTerm] = useState(''); // State for menu search
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null); // State for delivery info
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false); // State for delivery dialog
  const [currentMenuCategory, setCurrentMenuCategory] = useState<string | null>(null); // State for category drilldown
  const [isInitialized, setIsInitialized] = useState(false); // Track if state has been loaded from sessionStorage


  const isDelivery = tableIdParam === 'delivery';

  // --- Helper to format currency (moved to top for wider use if needed) ---
  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };


  // --- Deduct ingredients from inventory ---
  const deductFromInventory = (itemsToDeduct: OrderItem[]) => {
      const storedInventory = localStorage.getItem('restaurantInventory');
      if (!storedInventory) {
          console.warn("Inventario no encontrado para deducción.");
          return; // No inventory to deduct from
      }

      let inventory: InventoryItem[] = JSON.parse(storedInventory);

      itemsToDeduct.forEach(orderItem => {
          // Find the original menu item to get its ingredients list
          const menuItem = mockMenu.find(m => m.id === orderItem.id);
          if (!menuItem || !menuItem.ingredients) return; // No ingredients to deduct

          menuItem.ingredients.forEach(ingredientName => {
              // Skip specific main ingredients that are not meant to be deducted individually here
              // e.g. 'Pan Especial Normal', 'Vienesa', 'Carne As', 'Tortilla', etc. are handled by product name if needed
              const mainProductIngredients = [
                  'pan especial normal', 'pan especial grande', 'pan de marraqueta',
                  'pan de hamburguesa normal', 'pan de hamburguesa grande',
                  'vienesa', 'vienesa x2', 'carne as', 'carne fajita', 'carne hamburguesa', 'carne hamburguesa x2',
                  'carne hamburguesa x3', 'carne hamburguesa x4', 'carne churrasco', 'carne mechada', 'tortilla',
                  'papas fritas', // Base "Papas Fritas" could be an inventory item for composed dishes
                  'bebida lata' // if "Bebida Lata" is an inventory item
              ];
              if (mainProductIngredients.includes(ingredientName.toLowerCase())) {
                  // Check if this main ingredient should be deducted based on product name
                  const inventoryItemIndex = inventory.findIndex(
                      invItem => invItem.name.toLowerCase() === ingredientName.toLowerCase()
                  );
                   if (inventoryItemIndex !== -1) {
                       inventory[inventoryItemIndex].stock = Math.max(
                           0,
                           inventory[inventoryItemIndex].stock - orderItem.quantity
                       );
                       console.log(`Deducted ${orderItem.quantity} of ${ingredientName} for ${orderItem.name}. New stock: ${inventory[inventoryItemIndex].stock}`);
                   } else {
                       console.warn(`Ingrediente de producto principal "${ingredientName}" no encontrado en inventario para ${orderItem.name}.`);
                   }
                  return; // Skip further processing for these main product ingredients
              }


              const inventoryItemIndex = inventory.findIndex(
                  invItem => invItem.name.toLowerCase() === ingredientName.toLowerCase()
              );

              if (inventoryItemIndex !== -1) {
                  // Deduct based on order item quantity
                  inventory[inventoryItemIndex].stock = Math.max(
                      0,
                      inventory[inventoryItemIndex].stock - orderItem.quantity
                  );
                   console.log(`Deducted ${orderItem.quantity} of ${ingredientName} for ${orderItem.name}. New stock: ${inventory[inventoryItemIndex].stock}`);
              } else {
                  console.warn(`Ingrediente "${ingredientName}" para "${orderItem.name}" no encontrado en el inventario.`);
              }
          });

          // Specific deduction for 'Vienesas' based on item name and category
          if (menuItem.category === 'Completos Vienesas') {
            const vienesaItemIndex = inventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
            if (vienesaItemIndex !== -1) {
                let quantityToDeduct = 0;
                if (menuItem.name.toLowerCase().includes(' normal') || menuItem.name.toLowerCase().includes(' chico')) {
                    quantityToDeduct = orderItem.quantity; // Deduct 1 per item
                } else if (menuItem.name.toLowerCase().includes(' grande')) {
                     quantityToDeduct = orderItem.quantity * 2; // Deduct 2 per item
                }

                if (quantityToDeduct > 0) {
                   inventory[vienesaItemIndex].stock = Math.max(
                       0,
                       inventory[vienesaItemIndex].stock - quantityToDeduct
                   );
                    console.log(`Deducted ${quantityToDeduct} of Vienesas for ${orderItem.name}. New stock: ${inventory[vienesaItemIndex].stock}`);
                }
            } else {
                 console.warn(`Ingrediente "Vienesas" no encontrado en el inventario para deducir.`);
            }
          }
      });

      // Save updated inventory
      localStorage.setItem('restaurantInventory', JSON.stringify(inventory));
      console.log("Inventario actualizado después de la deducción.");
  };


  // --- Effect to load state from sessionStorage on component mount ---
   useEffect(() => {
       if (!tableIdParam || isInitialized) return; // Don't run if no tableId or already initialized

       console.log(`Initializing state for table: ${tableIdParam}`);

       // Load current order
       const storedOrder = sessionStorage.getItem(`table-${tableIdParam}-order`);
       if (storedOrder) {
           try {
               const parsedOrder = JSON.parse(storedOrder);
               if (Array.isArray(parsedOrder)) {
                   setOrder(parsedOrder);
                   console.log(`Loaded current order for table ${tableIdParam}:`, parsedOrder);
               }
           } catch (e) {
                console.error(`Error parsing current order for table ${tableIdParam}:`, e);
                sessionStorage.removeItem(`table-${tableIdParam}-order`); // Clear corrupted data
           }
       }

       // Load pending order
       const storedPendingOrderData = sessionStorage.getItem(`table-${tableIdParam}-pending-order`);
       if (storedPendingOrderData) {
           try {
               const parsedPendingOrder: PendingOrderData = JSON.parse(storedPendingOrderData);
               if (parsedPendingOrder && Array.isArray(parsedPendingOrder.items)) {
                   setPendingOrder(parsedPendingOrder.items);
                    // Also load delivery info if it was part of the pending order
                   if (isDelivery && parsedPendingOrder.deliveryInfo) {
                       setDeliveryInfo(parsedPendingOrder.deliveryInfo);
                       console.log(`Loaded delivery info with pending order for table ${tableIdParam}:`, parsedPendingOrder.deliveryInfo);
                   }
                   console.log(`Loaded pending order for table ${tableIdParam}:`, parsedPendingOrder.items);
               }
           } catch (e) {
                console.error(`Error parsing pending order for table ${tableIdParam}:`, e);
                sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);// Clear corrupted data
           }
       }

       // Load delivery info separately if it's a delivery table and no pending order loaded it
       if (isDelivery && !deliveryInfo) { // Only if not already set by pending order
           const storedDelivery = sessionStorage.getItem(`deliveryInfo-${tableIdParam}`);
           if (storedDelivery) {
                try {
                    const parsedDelivery = JSON.parse(storedDelivery);
                    setDeliveryInfo(parsedDelivery);
                    console.log(`Loaded delivery info for table ${tableIdParam}:`, parsedDelivery);
                } catch (e) {
                    console.error(`Error parsing delivery info for table ${tableIdParam}:`, e);
                    sessionStorage.removeItem(`deliveryInfo-${tableIdParam}`);
                }
           } else if (isDelivery && !isDeliveryDialogOpen) { // If delivery and no info, open dialog
                console.log(`No delivery info for ${tableIdParam}, opening dialog.`);
               //  setIsDeliveryDialogOpen(true); // Open dialog if no info and it's a delivery table
           }
       }
        // If it's a delivery table and no delivery info is present (neither from pending nor standalone storage),
        // and the dialog is not already open, then open it.
        if (isDelivery && !deliveryInfo && !sessionStorage.getItem(`deliveryInfo-${tableIdParam}`) && !sessionStorage.getItem(`table-${tableIdParam}-pending-order`)) {
            console.log(`Delivery table ${tableIdParam} has no info, opening dialog.`);
            setIsDeliveryDialogOpen(true);
        }


       setIsInitialized(true); // Mark as initialized
       console.log(`Initialization complete for ${tableIdParam}.`);

   }, [tableIdParam, isInitialized, isDelivery, deliveryInfo, isDeliveryDialogOpen]); // Added deliveryInfo and isDeliveryDialogOpen to dependencies


  // --- Effect to save state changes to sessionStorage and update table status ---
  useEffect(() => {
      if (!tableIdParam || !isInitialized) return; // Don't save if no tableId or not initialized

      console.log(`Saving state for table: ${tableIdParam}`);

      // Save current order
      if (order.length > 0) {
          sessionStorage.setItem(`table-${tableIdParam}-order`, JSON.stringify(order));
          console.log(`Saved current order for table ${tableIdParam}:`, order);
      } else {
          sessionStorage.removeItem(`table-${tableIdParam}-order`); // Clean up if order is empty
          console.log(`Removed current order for table ${tableIdParam} as it is empty.`);
      }

      // Save pending order (includes delivery info if applicable)
      const pendingOrderData: PendingOrderData = {
          items: pendingOrder,
          deliveryInfo: isDelivery ? deliveryInfo : null,
          totalAmount: calculateTotal(pendingOrder) + (isDelivery && deliveryInfo ? deliveryInfo.deliveryFee : 0)
      };
      if (pendingOrder.length > 0 || (isDelivery && deliveryInfo)) { // Save if pending items OR delivery info exists
          sessionStorage.setItem(`table-${tableIdParam}-pending-order`, JSON.stringify(pendingOrderData));
          console.log(`Saved pending order data for table ${tableIdParam}:`, pendingOrderData);
      } else {
          sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);
          console.log(`Removed pending order data for table ${tableIdParam} as it is empty.`);
      }


      // Save delivery info (specifically for delivery tables, can be redundant if always with pending order)
       if (isDelivery && deliveryInfo) {
           sessionStorage.setItem(`deliveryInfo-${tableIdParam}`, JSON.stringify(deliveryInfo));
           console.log(`Saved delivery info for table ${tableIdParam}:`, deliveryInfo);
       } else if (isDelivery && !deliveryInfo) {
           // Clean up if delivery info is cleared for a delivery table
           sessionStorage.removeItem(`deliveryInfo-${tableIdParam}`);
           console.log(`Removed delivery info for table ${tableIdParam} as it is null.`);
       }


      // Update table status based on whether there's any activity
      const isTableOccupied = order.length > 0 || pendingOrder.length > 0 || (isDelivery && deliveryInfo !== null);
      const newStatus = isTableOccupied ? 'occupied' : 'available';
      const currentStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);

      if (newStatus !== currentStatus) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
        console.log(`Updated status for table ${tableIdParam} to: ${newStatus}`);
      }

  }, [order, pendingOrder, deliveryInfo, tableIdParam, isInitialized, isDelivery]);


  const handleAddItem = (item: MenuItem, modifications?: string[]) => {
    // Calculate additional cost from modifications
    let modificationCost = 0;
    if (modifications && item.modificationPrices) {
      modifications.forEach(modName => {
        modificationCost += item.modificationPrices![modName] ?? 0;
      });
    }

    const newItem: OrderItem = {
      id: item.id,
      orderItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // More unique ID
      name: item.name,
      category: item.category,
      quantity: 1,
      selectedModifications: modifications,
      basePrice: item.price, // Store base price
      finalPrice: item.price + modificationCost, // Add modification cost to final price
      // ingredients: item.ingredients, // Do not store ingredients in order item
    };

    setOrder((prevOrder) => {
        // Check if an identical item (same id and same modifications) already exists
        const existingItemIndex = prevOrder.findIndex(
            (orderedItem) =>
            orderedItem.id === newItem.id &&
            isEqual(orderedItem.selectedModifications?.sort(), newItem.selectedModifications?.sort()) // Compare sorted arrays
        );

        if (existingItemIndex > -1) {
            // Increment quantity of existing item
            const updatedOrder = [...prevOrder];
            updatedOrder[existingItemIndex].quantity += 1;
            return updatedOrder;
        } else {
            // Add new item to order
            return [...prevOrder, newItem];
        }
    });
    toast({ title: `${item.name} añadido`, description: modifications ? `Modificaciones: ${modifications.join(', ')}` : "Sin modificaciones." });
    setIsModificationDialogOpen(false); // Close dialog after adding
    setItemToModify(null); // Reset item to modify
    // Do not close the main menu sheet here
  };

  const handleRemoveItem = (orderItemId: string) => {
    setOrder((prevOrder) => prevOrder.filter((item) => item.orderItemId !== orderItemId));
    toast({ title: "Artículo eliminado", variant: "destructive" });
  };

  const handleIncreaseQuantity = (orderItemId: string) => {
    setOrder((prevOrder) =>
      prevOrder.map((item) =>
        item.orderItemId === orderItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecreaseQuantity = (orderItemId: string) => {
    setOrder((prevOrder) =>
      prevOrder
        .map((item) =>
          item.orderItemId === orderItemId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
        )
        .filter(item => item.quantity > 0) // Remove if quantity becomes 0 (or ensure it doesn't go below 1)
    );
  };


  const handleOpenModificationDialog = (item: MenuItem) => {
    setItemToModify(item);
    setIsModificationDialogOpen(true);
  };


  const calculateTotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  };

  // --- Total for current order (before printing to kitchen) ---
  const currentOrderTotal = useMemo(() => calculateTotal(order), [order]);
  // --- Total for pending order (items sent to kitchen, awaiting payment) ---
  // This now includes delivery fee if applicable for the pending order total display
  const pendingOrderTotal = useMemo(() => {
      const itemsTotal = calculateTotal(pendingOrder);
      const fee = isDelivery && deliveryInfo ? deliveryInfo.deliveryFee : 0;
      return itemsTotal + fee;
  }, [pendingOrder, deliveryInfo, isDelivery]);


  // --- Print Comanda (Kitchen Order) ---
  const handlePrintComanda = () => {
    if (order.length === 0) {
      toast({ title: "Pedido Vacío", description: "Añada artículos antes de imprimir la comanda.", variant: "destructive" });
      return;
    }

    // Format the kitchen receipt HTML
    const kitchenReceiptHtml = formatKitchenOrderReceipt(order, tableIdParam, deliveryInfo);
    // Print the HTML
    printHtml(kitchenReceiptHtml);

    toast({ title: "Comanda Impresa", description: `Enviando pedido para ${isDelivery ? 'Delivery' : `Mesa ${tableIdParam}`}.` });

    // Move current order items to pending order
    setPendingOrder(prevPending => [...prevPending, ...order]);
    setOrder([]); // Clear current order

    // No need to update table status here, useEffect will handle it
  };


  // --- Handle Payment ---
  const handleInitiatePayment = () => {
      if (pendingOrder.length === 0) {
          toast({ title: "Sin Pedido Pendiente", description: "No hay artículos pendientes de pago.", variant: "destructive"});
          return;
      }
      setIsPaymentDialogOpen(true); // Open payment method selection dialog
  };

  const handleConfirmPayment = (paymentMethod: PaymentMethod) => {
    setIsPaymentDialogOpen(false); // Close payment dialog

    // Deduct items from inventory
    deductFromInventory(pendingOrder);

    // Format the customer receipt HTML
    // Pass the full pendingOrderTotal which already includes deliveryFee if applicable
    const customerReceiptHtml = formatCustomerReceipt(pendingOrder, pendingOrderTotal, paymentMethod, tableIdParam, deliveryInfo);
    // Print the HTML
    printHtml(customerReceiptHtml);

    // Add to cash register movements
    const cashMovementsStorageKey = 'cashMovements';
    const storedCashMovements = sessionStorage.getItem(cashMovementsStorageKey);
    let cashMovements: CashMovement[] = storedCashMovements ? JSON.parse(storedCashMovements) : [];

    // Ensure IDs are numbers before finding the max
    const maxId = cashMovements.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);

    const newSaleMovement: CashMovement = {
      id: maxId + 1,
      date: new Date().toISOString(), // Store as ISO string
      category: 'Ingreso Venta',
      description: `Venta Mesa ${tableIdParam}${isDelivery && deliveryInfo ? ` (Delivery: ${deliveryInfo.name})` : ''}`,
      amount: pendingOrderTotal, // Use the total that includes delivery fee
      paymentMethod: paymentMethod,
      deliveryFee: isDelivery && deliveryInfo ? deliveryInfo.deliveryFee : undefined,
    };
    cashMovements.push(newSaleMovement);
    sessionStorage.setItem(cashMovementsStorageKey, JSON.stringify(cashMovements));

    toast({ title: "Pago Confirmado", description: `Total: ${formatCurrency(pendingOrderTotal)} pagado con ${paymentMethod}.` });

    // Clear pending order and delivery info for this table
    setPendingOrder([]);
    if (isDelivery) {
        setDeliveryInfo(null); // Clear delivery info after successful payment
        sessionStorage.removeItem(`deliveryInfo-${tableIdParam}`); // Also clear from direct storage
    }

    // Table status will be updated by useEffect due to pendingOrder change
    // If it's a delivery and no new order is started, the table becomes available
    // If it's a regular table, it becomes available
  };


  // --- Menu filtering and categorization ---
  const menuCategories = useMemo(() => {
    const categories = new Set(mockMenu.map(item => item.category));
    return orderedCategories.filter(cat => categories.has(cat)); // Ensure correct order
  }, []);

  const filteredMenu = useMemo(() => {
    let itemsToDisplay = mockMenu;

    if (currentMenuCategory) {
      itemsToDisplay = itemsToDisplay.filter(item => item.category === currentMenuCategory);
    }

    if (searchTerm) {
      itemsToDisplay = itemsToDisplay.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (currentMenuCategory ? false : item.category.toLowerCase().includes(searchTerm.toLowerCase())) // Only search category if no category selected
      );
    }
    return sortMenu(itemsToDisplay); // Sort the final list
  }, [searchTerm, currentMenuCategory]);

  const handleCategoryClick = (category: string) => {
      setCurrentMenuCategory(category);
      setSearchTerm(''); // Clear search when category changes
  };

  const handleBackToCategories = () => {
      setCurrentMenuCategory(null);
      setSearchTerm(''); // Clear search
  };

  const handleCloseMenuSheet = () => {
      setIsMenuSheetOpen(false);
      setCurrentMenuCategory(null); // Reset category view when sheet closes
      setSearchTerm(''); // Clear search
  };

   // --- Delivery Info Dialog Logic ---
   const handleConfirmDeliveryInfo = (info: DeliveryInfo) => {
       setDeliveryInfo(info);
       setIsDeliveryDialogOpen(false);
       toast({ title: "Datos de Envío Guardados", description: `Cliente: ${info.name}, Envío: ${formatCurrency(info.deliveryFee)}` });
       // Now the user can proceed to add items to the order
   };

   const handleCancelDeliveryDialog = () => {
       setIsDeliveryDialogOpen(false);
       // If delivery info is mandatory and user cancels, redirect or show message
       if (!deliveryInfo && isDelivery) {
           toast({ title: "Envío Cancelado", description: "Debe ingresar datos de envío para continuar.", variant: "destructive" });
           router.push('/tables'); // Or handle as needed
       }
   };

   // Return to tables page if not initialized or tableId is missing (should be caught by loading state too)
   if (!isInitialized && !tableIdParam) {
       return <div className="flex items-center justify-center min-h-screen">Cargando Mesa...</div>;
   }
    // If it's a delivery table and dialog is open, don't render the rest yet
    if (isDelivery && isDeliveryDialogOpen && !deliveryInfo) {
        return (
            <div className="container mx-auto p-4">
                <DeliveryDialog
                    isOpen={isDeliveryDialogOpen}
                    onOpenChange={setIsDeliveryDialogOpen}
                    initialData={deliveryInfo}
                    onConfirm={handleConfirmDeliveryInfo}
                    onCancel={handleCancelDeliveryDialog}
                />
                 <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
                     <p className="text-muted-foreground">Ingrese los datos de envío para continuar...</p>
                 </div>
            </div>
        );
    }


  return (
    <div className="container mx-auto p-4 flex flex-col h-screen">
        {/* Header: Back Button and Table ID/Delivery Info */}
         <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => router.push('/tables')} className="px-3 py-2 h-10 w-10 sm:px-4 sm:w-auto"> {/* Adjusted padding & width */}
                <ArrowLeft className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Volver a Mesas</span>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-center flex-grow">
                {isDelivery ? (deliveryInfo ? `Delivery: ${deliveryInfo.name}` : 'Pedido Delivery') : `Mesa ${tableIdParam}`}
            </h1>
            {/* Placeholder for potential actions like 'Edit Delivery Info' */}
            {isDelivery && deliveryInfo && (
                 <Button variant="ghost" size="sm" onClick={() => setIsDeliveryDialogOpen(true)}>
                     <ChevronRight className="h-4 w-4"/>
                 </Button>
            )}
        </div>

        {/* Main Content Area: Menu Button and Order Sections */}
        <div className="flex justify-center mb-6">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-8 py-6 text-lg">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-0 flex flex-col"> {/* Wider sheet, no padding, flex col */}
                    <SheetHeader className="p-4 border-b"> {/* Add padding and border to header */}
                         <div className="flex items-center justify-between">
                            <SheetTitle className="text-2xl">
                                {currentMenuCategory ? currentMenuCategory : "Menú"}
                            </SheetTitle>
                            {currentMenuCategory && (
                                <Button variant="ghost" onClick={handleBackToCategories} size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Categorías
                                </Button>
                            )}
                        </div>
                        <Input
                            type="text"
                            placeholder={currentMenuCategory ? `Buscar en ${currentMenuCategory}...` : "Buscar en todo el menú..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mt-2"
                        />
                    </SheetHeader>

                    <ScrollArea className="flex-grow p-4"> {/* Scrollable content area with padding */}
                        {currentMenuCategory ? (
                            // Display items in the selected category
                            <div className="grid grid-cols-1 gap-3">
                                {filteredMenu.map((item) => (
                                <Card key={item.id} className="flex flex-col overflow-hidden">
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-base">{item.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 flex-grow">
                                        <p className="text-sm text-muted-foreground">
                                           Precio: {formatCurrency(item.price)}
                                           {item.ingredients && (
                                                <span className="text-xs italic ml-2">({item.ingredients.join(', ')})</span>
                                            )}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="p-3 pt-0">
                                    {item.modifications && item.modifications.length > 0 ? (
                                        <Button onClick={() => handleOpenModificationDialog(item)} className="w-full">
                                            Seleccionar Opciones
                                        </Button>
                                    ) : (
                                        <Button onClick={() => handleAddItem(item)} className="w-full">
                                           Añadir al Pedido
                                        </Button>
                                    )}
                                    </CardFooter>
                                </Card>
                                ))}
                                {filteredMenu.length === 0 && <p className="text-muted-foreground col-span-full text-center py-4">No se encontraron productos.</p>}
                            </div>
                        ) : (
                            // Display categories
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {menuCategories.map((category) => (
                                <Button
                                    key={category}
                                    variant="outline"
                                    className="justify-between h-auto py-3 px-4 text-left text-base sm:text-lg hover:bg-accent/80" // Adjusted styling
                                    onClick={() => handleCategoryClick(category)}
                                >
                                    {category}
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </Button>
                                ))}
                                 {menuCategories.length === 0 && <p className="text-muted-foreground col-span-full text-center py-4">No hay categorías para mostrar.</p>}
                            </div>
                        )}
                    </ScrollArea>
                     {/* Footer with close button - no border if content is scrollable to edge */}
                    {/* Removed SheetFooter and Close button */}
                </SheetContent>
            </Sheet>
        </div>


        {/* Order Sections: Current and Pending - Adjusted to take less space */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
            {/* Current Order Section */}
            <Card className="flex flex-col overflow-hidden h-full">
                <CardHeader className="pb-2 pt-4 px-4"> {/* Reduced padding */}
                    <CardTitle className="text-xl">Pedido Actual</CardTitle>
                    <CardDescription className="text-xs">Items a enviar a cocina.</CardDescription>
                </CardHeader>
                <ScrollArea className="flex-grow px-4">
                    {order.length === 0 ? (
                    <div className="flex items-center justify-center h-full py-10">
                        <p className="text-muted-foreground">No hay artículos en el pedido actual.</p>
                    </div>
                    ) : (
                    order.map((item) => (
                        <div key={item.orderItemId} className="py-2 border-b last:border-b-0">
                            <div className="flex justify-between items-center">
                                <div className="flex-grow">
                                    <p className="font-bold text-sm">{item.name} </p>
                                    {item.selectedModifications && (
                                        <p className="text-xs text-muted-foreground font-bold">
                                            ({item.selectedModifications.join(', ')})
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDecreaseQuantity(item.orderItemId)}>
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleIncreaseQuantity(item.orderItemId)}>
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveItem(item.orderItemId)}>
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                    )}
                </ScrollArea>
                {order.length > 0 && (
                    <CardFooter className="p-3 mt-auto border-t"> {/* Reduced padding */}
                        <Button onClick={handlePrintComanda} className="w-full">
                            <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
                        </Button>
                    </CardFooter>
                )}
            </Card>

            {/* Pending Order Section */}
            <Card className="flex flex-col overflow-hidden h-full">
                <CardHeader className="pb-2 pt-4 px-4"> {/* Reduced padding */}
                    <CardTitle className="text-xl">Pedidos Pendientes de Pago</CardTitle>
                     <CardDescription className="text-xs">Items enviados a cocina.</CardDescription>
                </CardHeader>
                <ScrollArea className="flex-grow px-4">
                    {pendingOrder.length === 0 && (!isDelivery || !deliveryInfo) ? (
                         <div className="flex items-center justify-center h-full py-10">
                            <p className="text-muted-foreground">No hay pedidos pendientes.</p>
                        </div>
                    ) : (
                        <>
                            {pendingOrder.map((item) => (
                                <div key={item.orderItemId} className="py-2 border-b last:border-b-0">
                                    <div className="flex justify-between items-center">
                                         <div className="flex-grow">
                                            <p className="font-bold text-sm">
                                                {item.quantity}x {item.name}
                                            </p>
                                            {item.selectedModifications && (
                                                <p className="text-xs text-muted-foreground font-bold">
                                                    ({item.selectedModifications.join(', ')})
                                                </p>
                                            )}
                                        </div>
                                        <span className="font-bold text-sm">{formatCurrency(item.finalPrice * item.quantity)}</span>
                                    </div>
                                </div>
                            ))}
                             {isDelivery && deliveryInfo && deliveryInfo.deliveryFee > 0 && (
                                <div className="py-2 border-b">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-sm">Costo Envío</p>
                                        <span className="font-bold text-sm">{formatCurrency(deliveryInfo.deliveryFee)}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </ScrollArea>
                {(pendingOrder.length > 0 || (isDelivery && deliveryInfo)) && (
                    <CardFooter className="p-3 mt-auto border-t flex flex-col gap-2"> {/* Reduced padding */}
                        <div className="flex justify-between items-center w-full font-bold text-lg">
                            <span>Total Pendiente:</span>
                            <span>{formatCurrency(pendingOrderTotal)}</span>
                        </div>
                        <Button onClick={handleInitiatePayment} className="w-full" variant="default">
                           <CreditCard className="mr-2 h-4 w-4" /> Imprimir Pago
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>


        {/* Modification Dialog */}
        <ModificationDialog
            isOpen={isModificationDialogOpen}
            onOpenChange={setIsModificationDialogOpen}
            item={itemToModify}
            onConfirm={(selectedMods) => {
            if (itemToModify) {
                handleAddItem(itemToModify, selectedMods);
            }
            }}
            onCancel={() => setIsModificationDialogOpen(false)}
        />

        {/* Payment Dialog */}
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
               onConfirm={handleConfirmDeliveryInfo}
               onCancel={handleCancelDeliveryDialog}
           />
       )}
    </div>
  );
}
