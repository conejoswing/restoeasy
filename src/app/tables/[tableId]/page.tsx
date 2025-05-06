

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
        ingredients: ['Pan Especial Normal', 'Vienesa', 'Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 29,
        name: 'Completo Grande',
        price: 4800,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Grande', 'Vienesa x2', 'Tomate', 'Chucrut', 'Americana']
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
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Pan Especial Normal', 'Carne As', 'Palta', 'Tomate']
    },
    {
      id: 11,
      name: 'Italiano Grande',
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Pan Especial Grande', 'Carne As', 'Palta', 'Tomate']
    },
    {
      id: 12,
      name: 'Completo Normal',
      price: 6500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Carne As', 'Tomate', 'Chucrut', 'Americana']
    },
    { id: 36, name: 'Completo Grande', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Tomate', 'Chucrut', 'Americana'] },
    { id: 37, name: 'Palta Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As', 'Palta'] },
    { id: 38, name: 'Palta Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Palta'] },
    { id: 39, name: 'Tomate Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As', 'Tomate'] },
    { id: 40, name: 'Tomate Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Tomate'] },
    { id: 41, name: 'Queso Normal', price: 6000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As', 'Queso'] },
    { id: 42, name: 'Queso Grande', price: 6500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As', 'Queso'] },
    { id: 43, name: 'Solo Carne Normal', price: 5000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Normal', 'Carne As'] },
    { id: 44, name: 'Solo Carne Grande', price: 5500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Especial Grande', 'Carne As'] },
    {
        id: 45,
        name: 'Dinamico Normal',
        price: 6800,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Carne As', 'Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 46,
        name: 'Dinamico Grande',
        price: 7300,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Especial Grande', 'Carne As', 'Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 47,
        name: 'Chacarero Normal',
        price: 6700,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Especial Normal', 'Carne As', 'Tomate', 'Poroto Verde', 'Ají Verde']
    },
    {
        id: 48,
        name: 'Chacarero Grande',
        price: 7200,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Pan Especial Grande', 'Carne As', 'Tomate', 'Poroto Verde', 'Ají Verde']
    },
    {
        id: 49,
        name: 'Napolitano Normal',
        price: 6900,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], // Updated mods
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Pan Especial Normal', 'Carne As', 'Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    {
        id: 50,
        name: 'Napolitano Grande',
        price: 7400,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño', 'con queso', 'sin queso', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna', 'Queso Fundido', 'Champiñones Salteados'], // Updated mods
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
    { id: 73, name: 'Chacarero', price: 7000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Pan Marraqueta', 'Carne Churrasco', 'Tomate', 'Poroto Verde', 'Ají Verde', 'Bebida Lata'] }, // Removed Porotos Verdes
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


// Storage keys
const TABLE_ORDER_STORAGE_PREFIX = 'table-';
const TABLE_STATUS_STORAGE_PREFIX = 'table-status-'; // Separate key for just the status
const PENDING_ORDER_STORAGE_PREFIX = 'table-pending-order-';
const DELIVERY_INFO_STORAGE_KEY = 'deliveryInfo-'; // Use localStorage now
const INVENTORY_STORAGE_KEY = 'restaurantInventory'; // Key for inventory data
const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements'; // Key for cash movements


// Group menu items by category
const menuByCategory = mockMenu.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, MenuItem[]>);

// Sort categories based on predefined order
const sortedCategories = orderedCategories.filter(cat => menuByCategory[cat]); // Only include categories with items


// Mapping from OrderItem name/category to InventoryItem name for deduction
const inventoryDeductionMap: Record<string, Record<string, number>> = {
    // --- Bebidas ---
    'Bebida 1.5Lt': {'Bebida 1.5Lt': 1},
    'Lata': {'Lata': 1},
    'Cafe Chico': {'Cafe Chico': 1},
    'Cafe Grande': {'Cafe Grande': 1},

    // --- Completos Vienesas ---
    'Italiano Normal': {'Pan Especial Normal': 1, 'Vienesa': 1},
    'Italiano Grande': {'Pan Especial Grande': 1, 'Vienesa': 2},
    'Hot Dog Normal': {'Pan Especial Normal': 1, 'Vienesa': 1},
    'Hot Dog Grande': {'Pan Especial Grande': 1, 'Vienesa': 2},
    'Completo Normal': {'Pan Especial Normal': 1, 'Vienesa': 1},
    'Completo Grande': {'Pan Especial Grande': 1, 'Vienesa': 2},
    'Palta Normal': {'Pan Especial Normal': 1, 'Vienesa': 1},
    'Palta Grande': {'Pan Especial Grande': 1, 'Vienesa': 2},
    'Tomate Normal': {'Pan Especial Normal': 1, 'Vienesa': 1},
    'Tomate Grande': {'Pan Especial Grande': 1, 'Vienesa': 2},
    'Dinamico Normal': {'Pan Especial Normal': 1, 'Vienesa': 1},
    'Dinamico Grande': {'Pan Especial Grande': 1, 'Vienesa': 2},

     // --- Completos As --- (Assuming 'Carne As' is not tracked in simple inventory)
     'Italiano Normal (Completos As)': {'Pan Especial Normal': 1},
     'Italiano Grande (Completos As)': {'Pan Especial Grande': 1},
     'Completo Normal (Completos As)': {'Pan Especial Normal': 1},
     'Completo Grande (Completos As)': {'Pan Especial Grande': 1},
     'Palta Normal (Completos As)': {'Pan Especial Normal': 1},
     'Palta Grande (Completos As)': {'Pan Especial Grande': 1},
     'Tomate Normal (Completos As)': {'Pan Especial Normal': 1},
     'Tomate Grande (Completos As)': {'Pan Especial Grande': 1},
     'Queso Normal': {'Pan Especial Normal': 1},
     'Queso Grande': {'Pan Especial Grande': 1},
     'Solo Carne Normal': {'Pan Especial Normal': 1},
     'Solo Carne Grande': {'Pan Especial Grande': 1},
     'Dinamico Normal (Completos As)': {'Pan Especial Normal': 1},
     'Dinamico Grande (Completos As)': {'Pan Especial Grande': 1},
     'Chacarero Normal': {'Pan Especial Normal': 1},
     'Chacarero Grande': {'Pan Especial Grande': 1},
     'Napolitano Normal': {'Pan Especial Normal': 1},
     'Napolitano Grande': {'Pan Especial Grande': 1},
     'Queso Champiñon Normal': {'Pan Especial Normal': 1},
     'Queso Champiñon Grande': {'Pan Especial Grande': 1},

     // --- Fajitas --- (Assuming 'Tortilla', 'Carne Fajita' not tracked)
     'Italiana': {},
     'Brasileño': {},
     'Chacarero': {},
     'Americana': {},
     'Primavera': {},
     'Golosasa': {},
     '4 Ingredientes': {},
     '6 Ingredientes': {},


    // --- Hamburguesas --- (Assuming 'Carne Hamburguesa' not tracked)
    'Simple': {'Pan Hamburguesa Normal': 1},
    'Doble': {'Pan Hamburguesa Grande': 1},
    'Italiana (Hamburguesas)': {'Pan Hamburguesa Normal': 1},
    'Doble Italiana': {'Pan Hamburguesa Grande': 1},
    'Tapa Arteria': {'Pan Hamburguesa Grande': 1},
    'Super Tapa Arteria': {'Pan Hamburguesa Grande': 1},
    'Big Cami': {'Pan Hamburguesa Normal': 1},
    'Super Big Cami': {'Pan Hamburguesa Grande': 1},

     // --- Churrascos --- (Assuming 'Carne Churrasco' not tracked)
    'Churrasco Italiano': {'Pan Marraqueta': 1},
    'Churrasco Completo': {'Pan Marraqueta': 1},
    'Churrasco Queso': {'Pan Marraqueta': 1},
    'Churrasco Tomate': {'Pan Marraqueta': 1},
    'Churrasco Palta': {'Pan Marraqueta': 1},
    'Churrasco Campestre': {'Pan Marraqueta': 1},
    'Churrasco Dinamico': {'Pan Marraqueta': 1},
    'Churrasco Napolitano': {'Pan Marraqueta': 1},
    'Churrasco Che milico': {'Pan Marraqueta': 1},
    'Churrasco Queso Champiñon': {'Pan Marraqueta': 1},

     // --- Papas Fritas --- (Assuming 'Papas Fritas', 'Carne', etc. not tracked simply)
     'Papas Fritas Normal': {},
     'Papas Fritas Mediana': {},
     'Papas Fritas Grande': {},
     'Papas Fritas XL': {},
     'Salchipapas': {'Vienesa': 1}, // Example: Deduct Vienesas for Salchipapas
     'Chorrillana 2': {},
     'Chorrillana 4': {},
     'Box Cami': {'Vienesa': 1}, // Example: Deduct Vienesas for Box Cami


     // --- Promo Churrasco --- (Multiply deduction by 1 for single items)
     'Completo (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Italiano (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Chacarero (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Queso (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Palta (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Tomate (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Brasileño (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Dinamico (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Campestre (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Queso Champiñon (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Che milico (Promo Churrasco)': {'Pan Marraqueta': 1, 'Lata': 1},


     // --- Promo Mechada --- (Assuming 'Carne Mechada' not tracked, multiply deduction by 1)
     'Completo (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Italiano (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Chacarero (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Queso (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Palta (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Tomate (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Brasileño (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Dinamico (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Campestre (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Queso Champiñon (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},
     'Che milico (Promo Mechada)': {'Pan Marraqueta': 1, 'Lata': 1},


     // --- Promociones ---
     'Promo 1': {'Pan Especial Normal': 1, 'Vienesa': 1, 'Lata': 1}, // Completo Normal + Lata
     'Promo 2': {'Pan Especial Normal': 1, 'Vienesa': 1, 'Lata': 1}, // Italiano Normal + Lata
     'Promo 3': {'Pan Marraqueta': 1, 'Lata': 1}, // Churrasco Simple? Needs clarification + Lata
     'Promo 4': {'Pan Hamburguesa Normal': 1, 'Lata': 1}, // Hamburguesa Simple + Lata
     // Add deductions for Promo 5-12 if their ingredients are known
      'Promo 5': {'Lata': 1}, // Assuming at least a drink
      'Promo 6': {'Lata': 1},
      'Promo 7': {'Lata': 1},
      'Promo 8': {'Lata': 1},
      'Promo 9': {'Lata': 1},
      'Promo 10': {'Lata': 1},
      'Promo 11': {'Lata': 1},
      'Promo 12': {'Lata': 1},

    // Default/Fallback (if an item isn't explicitly mapped)
    // 'default': {}
};


// Helper function to get deduction mapping key
const getDeductionKey = (item: OrderItem): string => {
    // Prioritize specific names within categories if needed
    if (item.category === 'Completos As' && item.name.startsWith('Italiano')) return 'Italiano Normal (Completos As)'; // Map both sizes for deduction
    if (item.category === 'Completos As' && item.name.startsWith('Completo')) return 'Completo Normal (Completos As)';
    if (item.category === 'Completos As' && item.name.startsWith('Palta')) return 'Palta Normal (Completos As)';
    if (item.category === 'Completos As' && item.name.startsWith('Tomate')) return 'Tomate Normal (Completos As)';
    if (item.category === 'Completos As' && item.name.startsWith('Dinamico')) return 'Dinamico Normal (Completos As)';
    if (item.category === 'Completos As' && item.name.startsWith('Chacarero')) return 'Chacarero Normal'; // Use base name
    if (item.category === 'Completos As' && item.name.startsWith('Napolitano')) return 'Napolitano Normal';
    if (item.category === 'Completos As' && item.name.startsWith('Queso Champiñon')) return 'Queso Champiñon Normal';
    if (item.category === 'Completos As' && item.name.startsWith('Queso')) return 'Queso Normal';
    if (item.category === 'Completos As' && item.name.startsWith('Solo Carne')) return 'Solo Carne Normal';

    if (item.category === 'Fajitas') return `${item.name}`; // Use name directly for Fajitas
    if (item.category === 'Hamburguesas') return `${item.name}`; // Use name directly
    if (item.category === 'Churrascos') return `${item.name}`; // Use name directly

    if (item.category === 'Promo Churrasco') return `${item.name} (Promo Churrasco)`;
    if (item.category === 'Promo Mechada') return `${item.name} (Promo Mechada)`;
    // Default to item name
    return item.name;
};


// --- Component ---
export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tableIdParam = params.tableId as string; // Get table ID from URL
  const isDelivery = tableIdParam === 'delivery';

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrder, setPendingOrder] = useState<OrderItem[]>([]); // State for items moved from current to pending
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null); // State for delivery info
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(sortedCategories[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modificationItem, setModificationItem] = useState<MenuItem | null>(null);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false); // State for payment dialog
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(isDelivery); // Open delivery dialog initially for delivery table
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization


   // --- Initialization Effect ---
   useEffect(() => {
        if (isInitialized) return; // Prevent running multiple times

        console.log(`Initializing state for table ${tableIdParam}...`);

        // --- Load Current Order ---
        const currentOrderKey = `${TABLE_ORDER_STORAGE_PREFIX}${tableIdParam}-order`;
        const storedCurrentOrder = sessionStorage.getItem(currentOrderKey);
        if (storedCurrentOrder) {
            try {
                const parsedOrder = JSON.parse(storedCurrentOrder);
                if (Array.isArray(parsedOrder)) {
                    setCurrentOrder(parsedOrder);
                    console.log(`Loaded current order for ${tableIdParam}:`, parsedOrder);
                } else {
                     console.warn(`Invalid current order data for ${tableIdParam}`);
                }
            } catch (e) {
                console.error(`Failed to parse current order for ${tableIdParam}:`, e);
                sessionStorage.removeItem(currentOrderKey); // Clear corrupted data
            }
        } else {
            console.log(`No current order found for ${tableIdParam}.`);
            setCurrentOrder([]); // Initialize as empty array
        }

       // --- Load Pending Order ---
       const pendingOrderKey = `${PENDING_ORDER_STORAGE_PREFIX}${tableIdParam}`;
       const storedPendingOrderData = sessionStorage.getItem(pendingOrderKey);
       if (storedPendingOrderData) {
           try {
               const parsedData: PendingOrderData = JSON.parse(storedPendingOrderData);
               if (parsedData && Array.isArray(parsedData.items)) {
                   setPendingOrder(parsedData.items);
                   // Load delivery info associated with the pending order
                   if (isDelivery && parsedData.deliveryInfo) {
                       setDeliveryInfo(parsedData.deliveryInfo);
                       console.log(`Loaded pending delivery info for ${tableIdParam}:`, parsedData.deliveryInfo);
                   }
                   console.log(`Loaded pending order for ${tableIdParam}:`, parsedData.items);
               } else {
                   console.warn(`Invalid pending order data format for ${tableIdParam}`);
                   setPendingOrder([]); // Initialize as empty if format is wrong
                   if (isDelivery) setDeliveryInfo(null);
               }
           } catch (e) {
               console.error(`Failed to parse pending order data for ${tableIdParam}:`, e);
               sessionStorage.removeItem(pendingOrderKey); // Clear corrupted data
               setPendingOrder([]);
               if (isDelivery) setDeliveryInfo(null);
           }
       } else {
           console.log(`No pending order found for ${tableIdParam}.`);
           setPendingOrder([]); // Initialize as empty array
           if (isDelivery) setDeliveryInfo(null); // Ensure delivery info is cleared if no pending order
       }

       // --- Load Delivery Info (Independent Check for Delivery Table) ---
        // This handles cases where delivery info might exist even if pending order was cleared or empty
        if (isDelivery && !deliveryInfo) { // Only load if not already loaded via pending order
            const deliveryInfoKey = `${DELIVERY_INFO_STORAGE_KEY}${tableIdParam}`;
            const storedDeliveryInfo = localStorage.getItem(deliveryInfoKey); // Use localStorage
            if (storedDeliveryInfo) {
                try {
                    const parsedInfo = JSON.parse(storedDeliveryInfo);
                    if (parsedInfo) {
                        setDeliveryInfo(parsedInfo);
                        console.log(`Loaded delivery info separately for ${tableIdParam}:`, parsedInfo);
                    }
                } catch (e) {
                     console.error(`Failed to parse delivery info separately for ${tableIdParam}:`, e);
                     localStorage.removeItem(deliveryInfoKey); // Clear corrupted data
                }
            } else {
                 console.log(`No separate delivery info found for ${tableIdParam}. Opening dialog.`);
                // If no delivery info exists at all for delivery table, ensure dialog opens
                setIsDeliveryDialogOpen(true);
            }
        }


        setIsInitialized(true); // Mark initialization as complete
        console.log(`Initialization complete for ${tableIdParam}.`);

   }, [tableIdParam, isInitialized, isDelivery]); // Dependencies ensure this runs once per table ID


   // --- Effect to save state changes to sessionStorage and update table status ---
   useEffect(() => {
        if (!isInitialized) return; // Don't save until initialized

        console.log(`Saving state for table ${tableIdParam}...`);

       // Save Current Order
       const currentOrderKey = `${TABLE_ORDER_STORAGE_PREFIX}${tableIdParam}-order`;
       if (currentOrder.length > 0) {
           try {
               sessionStorage.setItem(currentOrderKey, JSON.stringify(currentOrder));
               console.log(`Saved current order for ${tableIdParam}:`, currentOrder);
           } catch (e) {
                console.error(`Error saving current order for ${tableIdParam}:`, e);
           }
       } else {
           sessionStorage.removeItem(currentOrderKey); // Clear if empty
           console.log(`Cleared current order for ${tableIdParam}.`);
       }

        // Save Pending Order and Associated Delivery Info
        const pendingOrderKey = `${PENDING_ORDER_STORAGE_PREFIX}${tableIdParam}`;
        if (pendingOrder.length > 0) {
            try {
                const totalPendingAmount = calculateTotal(pendingOrder); // Recalculate total for pending
                const dataToSave: PendingOrderData = {
                    items: pendingOrder,
                    deliveryInfo: isDelivery ? deliveryInfo : null, // Only save delivery info for delivery table's pending order
                    totalAmount: totalPendingAmount
                };
                sessionStorage.setItem(pendingOrderKey, JSON.stringify(dataToSave));
                console.log(`Saved pending order for ${tableIdParam}:`, dataToSave);
            } catch (e) {
                console.error(`Error saving pending order for ${tableIdParam}:`, e);
            }
        } else {
            sessionStorage.removeItem(pendingOrderKey); // Clear if empty
            console.log(`Cleared pending order for ${tableIdParam}.`);
        }

        // Save Delivery Info (Independently for Delivery Table if present)
         // This ensures delivery info persists even if pending order is empty temporarily
         const deliveryInfoKey = `${DELIVERY_INFO_STORAGE_KEY}${tableIdParam}`;
         if (isDelivery && deliveryInfo) {
            try {
                localStorage.setItem(deliveryInfoKey, JSON.stringify(deliveryInfo)); // Use localStorage for persistence
                console.log(`Saved delivery info for ${tableIdParam}:`, deliveryInfo);
            } catch (e) {
                 console.error(`Error saving delivery info for ${tableIdParam}:`, e);
            }
         } else if (isDelivery && !deliveryInfo) {
            localStorage.removeItem(deliveryInfoKey); // Clear from localStorage if no info
             console.log(`Cleared delivery info for ${tableIdParam}.`);
         }


       // Update Table Status based on combined state
       const isTableOccupied = currentOrder.length > 0 || pendingOrder.length > 0 || (isDelivery && !!deliveryInfo);
       const newStatus = isTableOccupied ? 'occupied' : 'available';
       const statusKey = `${TABLE_STATUS_STORAGE_PREFIX}${tableIdParam}`;
       const currentStatus = sessionStorage.getItem(statusKey);

       if (currentStatus !== newStatus) {
           sessionStorage.setItem(statusKey, newStatus);
           console.log(`Updated table ${tableIdParam} status to ${newStatus}`);
           // Consider notifying the main tables page to update UI (e.g., via context or events if needed)
       }

   }, [currentOrder, pendingOrder, deliveryInfo, tableIdParam, isDelivery, isInitialized]); // Rerun whenever relevant state changes


  const formatCurrency = (amount: number) => {
    // Format as CLP with no decimals
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const calculateTotal = (items: OrderItem[]): number => {
    let total = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
     // Add delivery fee to the total if it's a delivery order and info exists
     if (isDelivery && deliveryInfo && deliveryInfo.deliveryFee > 0) {
        total += deliveryInfo.deliveryFee;
    }
    return total;
  };

  const currentTotal = useMemo(() => calculateTotal(currentOrder), [currentOrder, deliveryInfo, isDelivery]);
  const pendingTotal = useMemo(() => calculateTotal(pendingOrder), [pendingOrder, deliveryInfo, isDelivery]);


   // --- Inventory Deduction ---
   const deductInventory = (orderItems: OrderItem[]) => {
        try {
            const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
            if (!storedInventory) {
                console.warn("Inventario no encontrado para descontar.");
                return; // No inventory to deduct from
            }

            let inventory: InventoryItem[] = JSON.parse(storedInventory);

            orderItems.forEach(orderItem => {
                const deductionKey = getDeductionKey(orderItem); // Use helper to get the correct key
                const mapping = inventoryDeductionMap[deductionKey];

                if (mapping) {
                    console.log(`Descontando para: ${orderItem.name} (Key: ${deductionKey})`);
                    Object.entries(mapping).forEach(([inventoryItemName, quantityToDeduct]) => {
                        const itemIndex = inventory.findIndex(invItem => invItem.name === inventoryItemName);
                        if (itemIndex !== -1) {
                            const totalDeduction = quantityToDeduct * orderItem.quantity;
                             const newStock = inventory[itemIndex].stock - totalDeduction;
                            inventory[itemIndex].stock = Math.max(0, newStock); // Prevent negative stock
                            console.log(`- Descontado ${totalDeduction} de ${inventoryItemName}. Nuevo stock: ${inventory[itemIndex].stock}`);
                        } else {
                             console.warn(`!! Item de inventario "${inventoryItemName}" no encontrado para descontar para "${orderItem.name}".`);
                        }
                    });
                } else {
                     console.log(`-- No hay mapeo de descuento de inventario para "${orderItem.name}" (Key: ${deductionKey}).`);
                }
            });

            // Save the updated inventory back to localStorage
            localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
            console.log("Inventario actualizado después del descuento:", inventory);

        } catch (error) {
            console.error("Error al descontar inventario:", error);
            toast({ title: "Error de Inventario", description: "No se pudo actualizar el inventario.", variant: "destructive"});
        }
   };

  // --- Add Cash Movement ---
    const addCashMovement = (amount: number, paymentMethod: PaymentMethod, deliveryFee?: number) => {
        try {
            const storedMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
            let movements: CashMovement[] = storedMovements ? JSON.parse(storedMovements).map((m: any) => ({...m, date: new Date(m.date)})) : [];

             // Ensure unique ID generation
             const maxId = movements.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);
             const newId = maxId + 1;

            const newMovement: CashMovement = {
                id: newId,
                date: new Date(), // Use current date/time
                category: 'Ingreso Venta',
                description: `Venta Mesa ${tableIdParam}`,
                amount: amount, // This is the total amount including delivery fee if applicable
                paymentMethod: paymentMethod,
                deliveryFee: deliveryFee && deliveryFee > 0 ? deliveryFee : undefined, // Only add if positive
            };

            // Convert dates back to ISO strings before saving
             const movementsToStore = [...movements, newMovement]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Keep sorted
                .map(m => ({
                    ...m,
                    date: m.date instanceof Date ? m.date.toISOString() : m.date
                 }));


            sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(movementsToStore));
            console.log("Movimiento de caja añadido:", newMovement);

        } catch (error) {
            console.error("Error al añadir movimiento de caja:", error);
            toast({ title: "Error de Caja", description: "No se pudo registrar la venta en la caja.", variant: "destructive"});
        }
    };


    // --- Modification Dialog Logic ---
     const openModificationDialog = (item: MenuItem) => {
         setModificationItem(item);
         setIsModificationDialogOpen(true);
     };

     const handleModificationConfirm = (selectedMods: string[] | undefined) => {
         if (modificationItem) {
            // Calculate price based on selected modifications
            let finalPrice = modificationItem.price;
            if (selectedMods) {
                selectedMods.forEach(mod => {
                    finalPrice += modificationItem.modificationPrices?.[mod] ?? 0;
                });
            }

             const newItem: OrderItem = {
                id: modificationItem.id, // Original menu item ID
                orderItemId: `${modificationItem.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Unique ID for this instance
                name: modificationItem.name,
                category: modificationItem.category,
                quantity: 1,
                basePrice: modificationItem.price,
                finalPrice: finalPrice, // Use calculated price
                selectedModifications: selectedMods,
                // ingredients are not stored in OrderItem
             };
             addToCurrentOrder(newItem);
             setIsModificationDialogOpen(false);
             setModificationItem(null);
         }
     };

    const handleModificationCancel = () => {
         setIsModificationDialogOpen(false);
         setModificationItem(null);
    };

  // --- Order Management Functions ---
  const addToCurrentOrder = (item: MenuItem | OrderItem) => {
    // Check if it's a MenuItem needing conversion or already an OrderItem
     const orderItemToAdd = 'orderItemId' in item ? item : {
         ...item,
         orderItemId: `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Ensure unique ID
         quantity: 1,
         basePrice: item.price,
         finalPrice: item.price, // Initial finalPrice is basePrice
         selectedModifications: undefined // Start with no mods if adding fresh from menu
         // ingredients are not stored in OrderItem
     };

    setCurrentOrder((prevOrder) => {
        // Try to find an existing item with the SAME ID and EXACTLY the same modifications
        const existingItemIndex = prevOrder.findIndex(
             (orderItem) =>
                orderItem.id === orderItemToAdd.id &&
                isEqual(orderItem.selectedModifications?.sort(), orderItemToAdd.selectedModifications?.sort()) // Compare sorted mods
         );

      if (existingItemIndex > -1) {
        // Item with same mods exists, increase quantity
        const updatedOrder = [...prevOrder];
        updatedOrder[existingItemIndex].quantity += 1;
        return updatedOrder;
      } else {
        // New item or item with different mods, add to order
        return [...prevOrder, { ...orderItemToAdd, quantity: 1 }]; // Ensure quantity is 1 for new additions
      }
    });
    // Don't close the sheet automatically
    // setIsMenuSheetOpen(false);
  };

    const handleMenuItemClick = (item: MenuItem) => {
        // If item has modifications, open dialog, otherwise add directly
        if (item.modifications && item.modifications.length > 0) {
            openModificationDialog(item);
        } else {
             // Check if the item requires inventory mapping (e.g., unique name in a category)
             const key = getDeductionKey({ ...item, orderItemId: '', quantity: 1, basePrice: item.price, finalPrice: item.price });
             const newItem: OrderItem = {
                 id: item.id,
                 orderItemId: `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                 name: item.name, // Use original name for display
                 category: item.category,
                 quantity: 1,
                 basePrice: item.price,
                 finalPrice: item.price,
                 selectedModifications: undefined,
                 // ingredients are not stored in OrderItem
             };
            addToCurrentOrder(newItem);
        }
    };


  const removeFromCurrentOrder = (orderItemId: string) => {
    setCurrentOrder((prevOrder) =>
      prevOrder.filter((item) => item.orderItemId !== orderItemId)
    );
  };

  const increaseQuantity = (orderItemId: string) => {
    setCurrentOrder((prevOrder) =>
      prevOrder.map((item) =>
        item.orderItemId === orderItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (orderItemId: string) => {
    setCurrentOrder((prevOrder) => {
      const itemIndex = prevOrder.findIndex((item) => item.orderItemId === orderItemId);
      if (itemIndex === -1) return prevOrder; // Item not found

      const currentItem = prevOrder[itemIndex];
      if (currentItem.quantity > 1) {
        // Decrease quantity
        const updatedOrder = [...prevOrder];
        updatedOrder[itemIndex] = { ...currentItem, quantity: currentItem.quantity - 1 };
        return updatedOrder;
      } else {
        // Remove item if quantity is 1
        return prevOrder.filter((item) => item.orderItemId !== orderItemId);
      }
    });
  };

   // Function to move items from current order to pending order
   const handlePrintKitchenOrder = () => {
        if (currentOrder.length === 0) {
            toast({ title: "Pedido Vacío", description: "Agregue productos antes de imprimir.", variant: "destructive" });
            return;
        }

        // 1. Format and Print the *current* order for the kitchen
        const kitchenReceiptHtml = formatKitchenOrderReceipt(currentOrder, tableIdParam, deliveryInfo);
        printHtml(kitchenReceiptHtml);
        console.log(`Imprimiendo comanda para mesa ${tableIdParam}...`, currentOrder);


        // 2. Merge current order items into the pending order
         setPendingOrder(prevPending => {
            const newPending = [...prevPending];
            currentOrder.forEach(currentItem => {
                // Find if an identical item (same id and mods) exists in pending
                const existingIndex = newPending.findIndex(
                    pendingItem =>
                        pendingItem.id === currentItem.id &&
                        isEqual(pendingItem.selectedModifications?.sort(), currentItem.selectedModifications?.sort())
                );
                if (existingIndex > -1) {
                    // Item exists, just add quantities
                    newPending[existingIndex].quantity += currentItem.quantity;
                } else {
                    // Item doesn't exist, add it to pending
                    newPending.push({ ...currentItem });
                }
            });
             console.log(`Merged into pending order for ${tableIdParam}:`, newPending);
            return newPending; // Return the updated pending order array
         });


        // 3. Clear the current order
        setCurrentOrder([]);
        console.log(`Current order cleared for ${tableIdParam}.`);

        toast({ title: "Comanda Enviada", description: "El pedido se envió a cocina y se movió a pendiente.", variant: "default" });
   };

   // --- Payment Logic ---
   const handleOpenPaymentDialog = () => {
       if (pendingOrder.length === 0) {
           toast({ title: "Sin Pedido Pendiente", description: "No hay items pendientes de pago.", variant: "destructive"});
           return;
       }
       setIsPaymentDialogOpen(true);
   }

    const handleConfirmPayment = (selectedPaymentMethod: PaymentMethod) => {
        if (pendingOrder.length === 0) return; // Should not happen if button is disabled

        const amountToPay = pendingTotal; // Use the calculated pending total

        // 1. Deduct inventory based on items in the *pending* order
        deductInventory(pendingOrder);

        // 2. Add cash movement record
        const fee = isDelivery && deliveryInfo ? deliveryInfo.deliveryFee : undefined;
        addCashMovement(amountToPay, selectedPaymentMethod, fee);


        // 3. Format and Print Customer Receipt (using pending order data)
        const customerReceiptHtml = formatCustomerReceipt(pendingOrder, amountToPay, selectedPaymentMethod, tableIdParam, deliveryInfo);
        printHtml(customerReceiptHtml);
        console.log(`Imprimiendo boleta para mesa ${tableIdParam}...`, pendingOrder, amountToPay, selectedPaymentMethod);

        // 4. Clear the pending order state
        setPendingOrder([]);

        // 5. Clear delivery info state *only* for delivery table after successful payment
        if (isDelivery) {
            setDeliveryInfo(null);
            // Also clear delivery info from storage explicitly
             const deliveryInfoKey = `${DELIVERY_INFO_STORAGE_KEY}${tableIdParam}`;
             localStorage.removeItem(deliveryInfoKey); // Use localStorage
              console.log(`Cleared delivery info for ${tableIdParam} after payment.`);
        }


        // 6. Close payment dialog
        setIsPaymentDialogOpen(false);

        toast({ title: "Pago Registrado", description: `Pago de ${formatCurrency(amountToPay)} con ${selectedPaymentMethod} registrado. Boleta impresa.`, variant: "default"});

        // 7. Optionally navigate back to tables page after successful payment
        // router.push('/tables');
   };

   // --- Delivery Dialog Logic ---
   const handleConfirmDeliveryInfo = (info: DeliveryInfo) => {
       setDeliveryInfo(info);
       setIsDeliveryDialogOpen(false); // Close dialog
       // Save immediately to storage (will also be saved by the main useEffect)
       const deliveryInfoKey = `${DELIVERY_INFO_STORAGE_KEY}${tableIdParam}`;
       localStorage.setItem(deliveryInfoKey, JSON.stringify(info)); // Use localStorage
       toast({ title: "Datos de Envío Guardados", description: `Costo de envío: ${formatCurrency(info.deliveryFee)}`, variant: "default"});
   };

   const handleCancelDeliveryInfo = () => {
        // Only allow cancellation if there's no pending or current order *and* no existing delivery info
        if (pendingOrder.length === 0 && currentOrder.length === 0 && !deliveryInfo) {
             setIsDeliveryDialogOpen(false);
             // Navigate back if dialog is cancelled on initial entry
             router.push('/tables');
        } else {
            // If there's an order or existing info, just close the dialog without navigating away
            setIsDeliveryDialogOpen(false);
            if(!deliveryInfo) {
                 toast({ title: "Cancelado", description: "Debe ingresar datos de envío para continuar.", variant: "destructive"});
                 // Optionally re-open dialog if info is strictly required
                 // setIsDeliveryDialogOpen(true);
            }
        }

   };


  // --- Filtered Menu ---
  const filteredMenu = useMemo(() => {
    if (!searchTerm) {
      return menuByCategory[selectedCategory] || [];
    }
    return mockMenu.filter(
      (item) =>
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedCategory, searchTerm]);


   // Loading state check
   if (!isInitialized) {
        // You might want a more styled loading indicator
        return <div className="flex items-center justify-center min-h-screen">Cargando datos de la mesa...</div>;
   }

   // Handle case where delivery info is required but not provided yet
    if (isDelivery && !deliveryInfo && !isDeliveryDialogOpen) {
         // This state should ideally be handled by forcing the dialog open,
         // but as a fallback, show a message or redirect.
          console.warn(`Delivery table ${tableIdParam} accessed without delivery info. Re-opening dialog.`);
          // Force dialog open again if somehow closed without confirming
          // This relies on the state update happening before the next render cycle
          // Consider using a different approach if this causes issues.
          // setImmediate(() => setIsDeliveryDialogOpen(true)); // Potential solution, might need testing

          // Or show a specific message:
          // return (
          //     <div className="container mx-auto p-4 text-center">
          //         <p>Cargando datos de envío...</p>
          //         {/* Render DeliveryDialog directly here might be another option */}
          //     </div>
          // );
     }


  return (
    <div className="container mx-auto p-6">
        {/* Back Button */}
        <div className="mb-4">
             <Button variant="outline" onClick={() => router.push('/tables')} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mesas
             </Button>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6">
            {isDelivery ? 'Pedido Delivery' : `Mesa ${tableIdParam}`}
        </h1>

         {/* Delivery Info Display (if applicable) */}
         {isDelivery && deliveryInfo && (
             <Card className="mb-6 bg-muted/50">
                 <CardHeader className="pb-2">
                     <CardTitle className="text-lg flex items-center justify-between">
                         <span>Datos de Envío</span>
                         <Button variant="ghost" size="sm" onClick={() => setIsDeliveryDialogOpen(true)}>
                             <ChevronRight className="h-4 w-4"/> Editar
                         </Button>
                     </CardTitle>
                 </CardHeader>
                 <CardContent className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1">
                     <div className="flex items-center"><User className="h-4 w-4 mr-2"/> {deliveryInfo.name}</div>
                     <div className="flex items-center"><Home className="h-4 w-4 mr-2"/> {deliveryInfo.address}</div>
                     <div className="flex items-center"><Phone className="h-4 w-4 mr-2"/> {deliveryInfo.phone}</div>
                     <div className="flex items-center md:col-start-1"><DollarSign className="h-4 w-4 mr-2"/> Costo Envío: {formatCurrency(deliveryInfo.deliveryFee)}</div>
                 </CardContent>
             </Card>
         )}


        {/* Main Layout: Menu Button above, Order sections below */}
        <div className="flex justify-center mb-6">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-8 py-6 text-lg">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full md:w-[800px] flex flex-col p-0"> {/* Adjusted width */}
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Menú</SheetTitle>
                         {/* Search Input - Moved inside Header */}
                          <div className="mt-2">
                             <Input
                                 type="text"
                                 placeholder="Buscar producto o categoría..."
                                 value={searchTerm}
                                 onChange={(e) => setSearchTerm(e.target.value)}
                                 className="w-full"
                             />
                          </div>
                    </SheetHeader>

                   {/* Category and Item Selection Area */}
                   <div className="flex flex-grow overflow-hidden">
                        {/* Category List */}
                        <ScrollArea className="w-2/5 border-r"> {/* Increased width */}
                            <div className="p-2">
                                {sortedCategories.map((category) => (
                                    <Button
                                    key={category}
                                    variant={selectedCategory === category ? 'secondary' : 'ghost'}
                                    className="w-full justify-start mb-1 text-left h-auto py-2" // Adjusted style
                                    onClick={() => {
                                        setSelectedCategory(category);
                                        setSearchTerm(''); // Clear search when changing category
                                    }}
                                    >
                                    {category}
                                    </Button>
                                ))}
                             </div>
                        </ScrollArea>

                       {/* Item List */}
                       <ScrollArea className="w-3/5"> {/* Decreased width */}
                           <div className="p-4 grid grid-cols-1 gap-3">
                                {filteredMenu.length > 0 ? (
                                    filteredMenu.map((item) => (
                                        <Card key={item.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMenuItemClick(item)}>
                                             <CardContent className="p-3 flex justify-between items-center">
                                                 <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    {/* Do not show price here - removed */}
                                                  </div>
                                                 <PlusCircle className="h-5 w-5 text-primary" />
                                             </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                     <p className="text-muted-foreground text-center col-span-1">No hay productos en esta categoría{searchTerm ? ' que coincidan con la búsqueda' : ''}.</p>
                                )}
                           </div>
                       </ScrollArea>
                    </div>
                    {/* Removed Footer and Close Menu button */}
                </SheetContent>
            </Sheet>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Order Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Pedido Actual</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[400px] px-4"> {/* Added padding here */}
                         {currentOrder.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4 font-bold">Añade productos desde el menú.</p>
                         ) : (
                            currentOrder.map((item) => (
                                <div key={item.orderItemId} className="py-3 border-b last:border-b-0 font-bold"> {/* Added font-bold here */}
                                    <div className="flex justify-between items-start mb-1">
                                         <span className="mr-2">{item.name}</span> {/* No bold needed, parent has it */}
                                         {/* Do not show price */}
                                    </div>
                                     {item.selectedModifications && (
                                        <p className="text-xs text-muted-foreground italic ml-2 mb-1 font-bold"> {/* Apply bold here directly */}
                                           ({item.selectedModifications.join(', ')})
                                        </p>
                                     )}
                                    <div className="flex items-center justify-end gap-2">
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => decreaseQuantity(item.orderItemId)}>
                                             <MinusCircle className="h-4 w-4" />
                                         </Button>
                                         <span className="w-6 text-center">{item.quantity}</span> {/* No bold needed, parent has it */}
                                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => increaseQuantity(item.orderItemId)}>
                                             <PlusCircle className="h-4 w-4" />
                                         </Button>
                                         <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCurrentOrder(item.orderItemId)}>
                                             <XCircle className="h-4 w-4" />
                                         </Button>
                                    </div>
                                </div>
                            ))
                         )}
                    </ScrollArea>
                </CardContent>
                 {/* Don't show total for current order */}
                 <Separator />
                 <CardFooter className="p-4 flex justify-end">
                     <Button onClick={handlePrintKitchenOrder} disabled={currentOrder.length === 0}>
                         <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
                     </Button>
                 </CardFooter>
            </Card>

             {/* Pending Order Section */}
             <Card>
                 <CardHeader>
                     <CardTitle>Pedidos Pendientes de Pago</CardTitle>
                 </CardHeader>
                  <CardContent className="p-0">
                      <ScrollArea className="h-[400px] px-4">
                           {pendingOrder.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4 font-bold">No hay pedidos pendientes.</p>
                           ) : (
                              pendingOrder.map((item) => (
                                  <div key={item.orderItemId} className="py-3 border-b last:border-b-0 font-bold"> {/* Added font-bold here */}
                                     <div className="flex justify-between items-start mb-1">
                                          <span className="mr-2">{item.quantity}x {item.name}</span> {/* No bold needed, parent has it */}
                                          <span>{formatCurrency(item.finalPrice * item.quantity)}</span> {/* No bold needed, parent has it */}
                                     </div>
                                      {item.selectedModifications && (
                                         <p className="text-xs text-muted-foreground italic ml-4 font-bold"> {/* Apply bold here directly */}
                                            ({item.selectedModifications.join(', ')})
                                         </p>
                                      )}
                                  </div>
                              ))
                           )}
                      </ScrollArea>
                  </CardContent>
                   {/* Show total for pending order */}
                 <Separator />
                  <CardFooter className="p-4 flex flex-col items-stretch gap-4">
                     {/* Display Delivery Fee in Pending Order Footer if applicable */}
                     {isDelivery && deliveryInfo && deliveryInfo.deliveryFee > 0 && (
                         <div className="flex justify-between items-center text-sm text-muted-foreground font-bold"> {/* Added font-bold */}
                             <span>Costo Envío:</span>
                             <span>{formatCurrency(deliveryInfo.deliveryFee)}</span>
                         </div>
                     )}
                     <div className="flex justify-between items-center text-lg font-semibold">
                         <span>Total Pendiente:</span>
                         <span className="font-bold">{formatCurrency(pendingTotal)}</span> {/* Use pendingTotal */}
                     </div>
                     <Button onClick={handleOpenPaymentDialog} disabled={pendingOrder.length === 0} size="lg">
                          <CreditCard className="mr-2 h-5 w-5" /> Imprimir Pago
                     </Button>
                 </CardFooter>
             </Card>
        </div>

         {/* Modification Dialog */}
         <ModificationDialog
             isOpen={isModificationDialogOpen}
             onOpenChange={setIsModificationDialogOpen}
             item={modificationItem}
             onConfirm={handleModificationConfirm}
             onCancel={handleModificationCancel}
         />

         {/* Payment Dialog */}
         <PaymentDialog
              isOpen={isPaymentDialogOpen}
              onOpenChange={setIsPaymentDialogOpen}
              totalAmount={pendingTotal} // Pass pendingTotal to payment dialog
              onConfirm={handleConfirmPayment}
         />

       {/* Delivery Info Dialog (only for delivery table) */}
       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo} // Pass existing data for editing
               onConfirm={handleConfirmDeliveryInfo}
               onCancel={handleCancelDeliveryInfo} // Use specific cancel handler
           />
       )}

    </div>
  );
}



