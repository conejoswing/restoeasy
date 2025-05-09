
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
  CardFooter,
} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
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
import DeliveryDialog from '@/components/app/delivery-dialog';
import { formatKitchenOrderReceipt, formatCustomerReceipt, printHtml } from '@/lib/printUtils';
import type { InventoryItem } from '@/app/inventory/page';
import { Dialog as EditDialog, DialogClose as EditDialogCloseButton, DialogContent as EditDialogContent, DialogDescription as EditDialogDescription, DialogFooter as EditDialogFooter, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle } from '@/components/ui/dialog';
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


// Helper to format currency
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
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Palta', 'Tomate']
    },
    {
      id: 14,
      name: 'Italiano Grande',
      price: 4500,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
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
    { id: 105, name: 'Brasileño', price: 9200, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Palta', 'Queso'] },
    { id: 106, name: 'Chacarero', price: 9800, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Tomate', 'Poroto Verde', 'Ají Verde'] },
    { id: 107, name: 'Americana', price: 8900, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Cebolla Caramelizada', 'Aceituna'] },
    { id: 108, name: 'Primavera', price: 9000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Palta', 'Choclo', 'Tomate'] },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Queso', 'Champiñones', 'Papas Hilo', 'Pimentón'] },
    { id: 110, name: '4 Ingredientes', price: 11000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno'] },
    { id: 111, name: '6 Ingredientes', price: 12000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno'] },
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
     { id: 86, name: 'Brasileño', price: 9200, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Palta', 'Bebida Lata', 'Papa Personal'] },
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

let globalMenu: MenuItem[] = sortMenu(mockMenu);

const updateGlobalMenu = (newMenu: MenuItem[]) => {
  globalMenu = sortMenu(newMenu);
};

const ProductsPageContent = ({ onProductSelect, onEditProduct, onAddProduct }: {
  onProductSelect?: (product: MenuItem) => void;
  onEditProduct?: (product: MenuItem) => void;
  onAddProduct?: (product: Omit<MenuItem, 'id'>) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>(globalMenu);
  const [isEditPriceDialogOpen, setIsEditPriceDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setMenu(globalMenu);
  }, []);


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
    setMenu(sortMenu(updatedMenu));
    updateGlobalMenu(updatedMenu);

    if (onEditProduct) {
        onEditProduct({ ...editingProduct, price: priceValue });
    }

    toast({ title: "Precio Actualizado", description: `El precio de ${editingProduct.name} se actualizó a ${globalFormatCurrency(priceValue)}.`});
    setIsEditPriceDialogOpen(false);
    setEditingProduct(null);
    setNewPrice('');
  };

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
           className="mb-4"
       />
      <ScrollArea className="h-[calc(100vh-250px)] pr-3"> {/* Adjusted height for better visibility */}
          {Object.keys(groupedMenu).length === 0 && (
             <p className="text-center text-muted-foreground py-10">
               {searchTerm ? 'No se encontraron productos.' : 'Cargando menú...'}
             </p>
          )}
          <Accordion type="multiple" className="w-full" defaultValue={Object.keys(groupedMenu)}>
              {Object.entries(groupedMenu).map(([category, items]) => (
                  <AccordionItem value={category} key={category}>
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline px-1 py-3">
                          {category}
                      </AccordionTrigger>
                      <AccordionContent className="pl-2 pr-1">
                          <div className="grid grid-cols-1 gap-2">
                              {items.map((item) => (
                                  <Card
                                      key={item.id}
                                      onClick={() => onProductSelect && onProductSelect(item)}
                                      className={cn(
                                          "cursor-pointer hover:shadow-md transition-shadow p-3 rounded-md",
                                          onProductSelect ? "hover:bg-accent" : ""
                                      )}
                                  >
                                      <div className="flex justify-between items-center">
                                          <div className="flex-grow">
                                              <p className="font-medium text-sm">{item.name}
                                              {item.ingredients && item.ingredients.length > 0 && (
                                                <span className="text-xs text-muted-foreground ml-1">
                                                   ({item.ingredients.join(', ')})
                                                </span>
                                              )}
                                              </p>
                                          </div>
                                          <div className="flex items-center">
                                              <span className="text-sm font-mono mr-3">{globalFormatCurrency(item.price)}</span>
                                              {onEditProduct && (
                                                 <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditPriceDialog(item); }} className="h-7 w-7" title="Editar Precio">
                                                      <Edit className="h-4 w-4" />
                                                 </Button>
                                              )}
                                          </div>
                                      </div>
                                  </Card>
                              ))}
                          </div>
                      </AccordionContent>
                  </AccordionItem>
              ))}
          </Accordion>
      </ScrollArea>

       {onEditProduct && isEditPriceDialogOpen && editingProduct && (
        <EditDialog open={isEditPriceDialogOpen} onOpenChange={setIsEditPriceDialogOpen}>
            <EditDialogContent className="sm:max-w-[425px]">
            <EditDialogHeader>
                <EditDialogTitle>Editar Precio de {editingProduct?.name}</EditDialogTitle>
                <EditDialogDescription>
                    Actualice el precio base para este producto.
                </EditDialogDescription>
            </EditDialogHeader>
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
            <EditDialogFooter>
                <EditDialogCloseButton asChild>
                    <Button type="button" variant="secondary" onClick={() => setIsEditPriceDialogOpen(false)}>Cancelar</Button>
                </EditDialogCloseButton>
                <Button type="submit" onClick={handleUpdatePrice}>Guardar Cambios</Button>
            </EditDialogFooter>
            </EditDialogContent>
        </EditDialog>
        )}
    </>
  );
};


const ORDER_NUMBER_STORAGE_KEY = 'currentOrderNumber';

const getNextOrderNumber = (): number => {
    if (typeof window === 'undefined') return 1;

    let currentOrderNumber = parseInt(localStorage.getItem(ORDER_NUMBER_STORAGE_KEY) || '0', 10);
    currentOrderNumber = (currentOrderNumber % 999) + 1;
    localStorage.setItem(ORDER_NUMBER_STORAGE_KEY, currentOrderNumber.toString());
    return currentOrderNumber;
};


export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const tableIdParam = params.tableId as string;
  const isDelivery = tableIdParam === 'delivery';

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrderGroups, setPendingOrderGroups] = useState<PendingOrderGroup[]>([]); // Store groups of orders
  const [selectedPendingOrderNumbers, setSelectedPendingOrderNumbers] = useState<number[]>([]);


  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [selectedItemForModification, setSelectedItemForModification] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  const [hasBeenInitialized, setHasBeenInitialized] = useState(false);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const INVENTORY_STORAGE_KEY = 'restaurantInventory';

  useEffect(() => {
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (storedInventory) {
      setInventory(JSON.parse(storedInventory));
    }
  }, []);

  const updateInventory = (itemName: string, quantityToDeduct: number) => {
    const itemIndex = inventory.findIndex(item => item.name.toLowerCase() === itemName.toLowerCase());
    if (itemIndex !== -1) {
      const updatedInventory = [...inventory];
      updatedInventory[itemIndex].stock = Math.max(0, updatedInventory[itemIndex].stock - quantityToDeduct);
      setInventory(updatedInventory);
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
    }
  };

  const deductIngredientsForOrderItem = (orderItem: OrderItem) => {
    const itemName = orderItem.name.toLowerCase();
    const category = orderItem.category.toLowerCase();

    if (category === 'completos vienesas') {
        if (itemName.includes('normal')) updateInventory('Pan especial normal', 1 * orderItem.quantity);
        if (itemName.includes('grande')) updateInventory('Pan especial grande', 1 * orderItem.quantity);
        if (['completo normal', 'dinamico normal', 'hot dog normal', 'italiano normal', 'palta normal', 'tomate normal'].some(namePart => itemName.includes(namePart))) {
            updateInventory('Vienesas', 1 * orderItem.quantity);
        } else if (['completo grande', 'dinamico grande', 'hot dog grande', 'italiano grande', 'palta grande', 'tomate grande'].some(namePart => itemName.includes(namePart))) {
            updateInventory('Vienesas', 2 * orderItem.quantity);
        }
    } else if (category === 'completos as') {
        if (itemName.includes('normal')) updateInventory('Pan especial normal', 1 * orderItem.quantity);
        if (itemName.includes('grande')) updateInventory('Pan especial grande', 1 * orderItem.quantity);
    } else if (category === 'fajitas') {
         updateInventory('Pan de marraqueta', 1 * orderItem.quantity); // All fajitas use Pan de Marraqueta
    } else if (category === 'churrascos') {
        updateInventory('Pan de marraqueta', 1 * orderItem.quantity);
    } else if (category === 'promo churrasco') {
        updateInventory('Pan de marraqueta', 1 * orderItem.quantity);
    } else if (category === 'promo mechada') {
        updateInventory('Pan de marraqueta', 1 * orderItem.quantity);
    } else if (category === 'bebidas') {
        if (itemName.includes('1.5lt')) updateInventory('Bebida 1.5Lt', 1 * orderItem.quantity);
        if (itemName.includes('lata')) updateInventory('Lata', 1 * orderItem.quantity);
        if (itemName.includes('cafe chico')) updateInventory('Cafe Chico', 1 * orderItem.quantity);
        if (itemName.includes('cafe grande')) updateInventory('Cafe Grande', 1 * orderItem.quantity);
    }
  };


  useEffect(() => {
    if (hasBeenInitialized || !tableIdParam) return;

    console.log(`Initializing state for table/delivery: ${tableIdParam}`);

    const storedCurrentOrder = sessionStorage.getItem(`table-${tableIdParam}-order`);
    if (storedCurrentOrder) {
        try {
            const parsed = JSON.parse(storedCurrentOrder);
            if (Array.isArray(parsed)) setCurrentOrder(parsed);
        } catch (e) { console.error("Error parsing current order:", e); }
    }

    const storedPendingOrders = sessionStorage.getItem(`table-${tableIdParam}-pending-orders`);
    if (storedPendingOrders) {
        try {
            const parsed = JSON.parse(storedPendingOrders) as PendingOrderStorageData;
            if (parsed && Array.isArray(parsed.groups)) {
                setPendingOrderGroups(parsed.groups);
                 // If it's a delivery and the first pending group has delivery info, set it
                 if (isDelivery && parsed.groups.length > 0 && parsed.groups[0].deliveryInfo) {
                    setDeliveryInfo(parsed.groups[0].deliveryInfo);
                }
            }
        } catch (e) { console.error("Error parsing pending orders:", e); }
    }


    if (isDelivery) {
        const storedDeliveryInfo = sessionStorage.getItem(`deliveryInfo-${tableIdParam}`);
        if (storedDeliveryInfo) {
            try {
                const parsed = JSON.parse(storedDeliveryInfo);
                if (parsed) {
                    setDeliveryInfo(parsed);
                } else {
                     if (pendingOrderGroups.length === 0) { // Only open if no pending orders for this delivery
                        setIsDeliveryDialogOpen(true);
                     }
                }
            } catch (e) {
                console.error("Error parsing delivery info:", e);
                 if (pendingOrderGroups.length === 0){
                    setIsDeliveryDialogOpen(true);
                 }
            }
        } else if (pendingOrderGroups.length === 0){
            setIsDeliveryDialogOpen(true);
        }
    }

    setHasBeenInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, isDelivery, pendingOrderGroups.length, hasBeenInitialized]); // Added hasBeenInitialized


  useEffect(() => {
    if (!tableIdParam) return; // Don't save if no tableId (should not happen)
    // Save only if initialization is complete OR if it's a delivery and deliveryInfo is present (for initial save)
    if (!hasBeenInitialized && !(isDelivery && deliveryInfo)) return;


    console.log(`Saving state for table/delivery: ${tableIdParam}`);

    sessionStorage.setItem(`table-${tableIdParam}-order`, JSON.stringify(currentOrder));

    const pendingOrdersData: PendingOrderStorageData = {
        groups: pendingOrderGroups,
    };
    sessionStorage.setItem(`table-${tableIdParam}-pending-orders`, JSON.stringify(pendingOrdersData));


    if (isDelivery && deliveryInfo) {
      sessionStorage.setItem(`deliveryInfo-${tableIdParam}`, JSON.stringify(deliveryInfo));
    } else if (isDelivery && !deliveryInfo && pendingOrderGroups.length === 0) { // Only clear if no pending orders for this delivery
      sessionStorage.removeItem(`deliveryInfo-${tableIdParam}`);
    }

    const isOccupied = currentOrder.length > 0 || pendingOrderGroups.length > 0 || (isDelivery && deliveryInfo != null);
    sessionStorage.setItem(`table-${tableIdParam}-status`, isOccupied ? 'occupied' : 'available');

    console.log(`State saved. Table status: ${isOccupied ? 'occupied' : 'available'}`);

  }, [currentOrder, pendingOrderGroups, deliveryInfo, tableIdParam, hasBeenInitialized, isDelivery]);


  const calculateItemPrice = (item: MenuItem, modifications?: string[]): number => {
    let price = item.price;
    if (modifications && item.modificationPrices) {
      modifications.forEach(mod => {
        price += item.modificationPrices![mod] ?? 0;
      });
    }
    return price;
  };

  const handleAddProductToOrder = (product: MenuItem, selectedMods?: string[]) => {
    const finalPrice = calculateItemPrice(product, selectedMods);
    const orderItemId = `${product.id}-${selectedMods ? selectedMods.join('-') : 'no-mods'}-${Date.now()}`;

    const existingItemIndex = currentOrder.findIndex(
        (item) => item.id === product.id && isEqual(item.selectedModifications?.sort(), selectedMods?.sort())
    );


    if (existingItemIndex > -1) {
      const updatedOrder = [...currentOrder];
      updatedOrder[existingItemIndex].quantity += 1;
      setCurrentOrder(updatedOrder);
    } else {
      setCurrentOrder((prevOrder) => [
        ...prevOrder,
        {
          orderItemId,
          id: product.id,
          name: product.name,
          category: product.category,
          quantity: 1,
          selectedModifications: selectedMods,
          basePrice: product.price,
          finalPrice: finalPrice,
          ingredients: product.ingredients,
        },
      ]);
    }
    setIsModificationDialogOpen(false);
    setIsMenuSheetOpen(false);
    toast({ title: `${product.name} añadido`, description: selectedMods ? `Modificaciones: ${selectedMods.join(', ')}` : "Sin modificaciones." });
  };


  const handleRemoveItemFromOrder = (orderItemIdToRemove: string) => {
    setCurrentOrder((prevOrder) =>
      prevOrder.filter((item) => item.orderItemId !== orderItemIdToRemove)
    );
    toast({ title: "Artículo eliminado del pedido actual.", variant: "destructive" });
  };

  const handleAdjustQuantity = (orderItemId: string, amount: number) => {
    setCurrentOrder((prevOrder) =>
      prevOrder
        .map((item) =>
          item.orderItemId === orderItemId
            ? { ...item, quantity: Math.max(1, item.quantity + amount) }
            : item
        )
    );
  };

  const handleOpenModificationDialog = (menuItem: MenuItem) => {
    setSelectedItemForModification(menuItem);
    setIsModificationDialogOpen(true);
  };


  const handleConfirmModifications = (modifications?: string[]) => {
    if (selectedItemForModification) {
      handleAddProductToOrder(selectedItemForModification, modifications);
    }
    setIsModificationDialogOpen(false);
    setSelectedItemForModification(null);
  };

  const handlePrintKitchenOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Pedido Vacío", description: "Añada productos antes de enviar a cocina.", variant: "destructive" });
      return;
    }
    const orderNumber = getNextOrderNumber();

    const itemsForKitchen = currentOrder.map(item => ({ ...item, orderNumber }));


    const kitchenReceiptHtml = formatKitchenOrderReceipt(itemsForKitchen, isDelivery ? `Delivery: ${deliveryInfo?.name || 'Cliente'}` : `Mesa ${tableIdParam}`, orderNumber, deliveryInfo);
    printHtml(kitchenReceiptHtml);
    toast({ title: "Comanda Enviada a Cocina", description: `Pedido #${orderNumber} para ${isDelivery ? 'Delivery' : `Mesa ${tableIdParam}`} impreso.` });

    // Add the current order as a new group to pending orders
    setPendingOrderGroups(prevGroups => [
        ...prevGroups,
        {
            orderNumber: orderNumber,
            items: itemsForKitchen,
            deliveryInfo: isDelivery ? deliveryInfo : null // Associate delivery info with this order group
        }
    ]);
    setCurrentOrder([]);
  };

  const handleFinalizeAndPay = () => {
    if (selectedPendingOrderNumbers.length === 0) {
        toast({ title: "Ningún Pedido Seleccionado", description: "Seleccione al menos un pedido pendiente para cobrar.", variant: "destructive" });
        return;
    }
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = (paymentMethod: PaymentMethod, tipAmount: number, finalAmountWithTip: number) => {
    const ordersToPay = pendingOrderGroups.filter(group => selectedPendingOrderNumbers.includes(group.orderNumber));
    if (ordersToPay.length === 0) {
      toast({ title: "Error", description: "No se encontraron los pedidos seleccionados para pagar.", variant: "destructive" });
      return;
    }

    let itemsForReceipt: OrderItem[] = [];
    let deliveryFeeForPayment = 0;

    ordersToPay.forEach(group => {
        group.items.forEach(item => {
            itemsForReceipt.push(item);
            deductIngredientsForOrderItem(item);
        });
        if (isDelivery && group.deliveryInfo && group.deliveryInfo.deliveryFee) {
            deliveryFeeForPayment += group.deliveryInfo.deliveryFee;
        }
    });

    const customerReceiptHtml = formatCustomerReceipt(
      itemsForReceipt,
      finalAmountWithTip, // Use the final amount including tip for the receipt total
      paymentMethod,
      tableIdParam,
      isDelivery ? deliveryInfo : null,
      tipAmount // Pass tip amount for display on receipt
    );
    printHtml(customerReceiptHtml);


    const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';
    const storedMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    let cashMovements: CashMovement[] = storedMovements ? JSON.parse(storedMovements).map((m:any) => ({...m, date: new Date(m.date)})) : [];


    const saleMovement: CashMovement = {
      id: Date.now(),
      date: new Date(),
      category: 'Ingreso Venta',
      description: isDelivery ? `Venta Delivery: ${deliveryInfo?.name || tableIdParam}` : `Venta Mesa ${tableIdParam}` + ` (Pedidos: ${selectedPendingOrderNumbers.join(', ')})` + (tipAmount > 0 ? ` Propina: ${globalFormatCurrency(tipAmount)}` : ''),
      amount: finalAmountWithTip, // Record the final amount including tip
      paymentMethod: paymentMethod,
      deliveryFee: isDelivery ? deliveryFeeForPayment : undefined
    };
    cashMovements.push(saleMovement);
    sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(cashMovements.map(m => ({...m, date: m.date.toISOString()}))));


    toast({ title: "Pago Completado", description: `${ordersToPay.length} pedido(s) pagado(s) con ${paymentMethod}. Total: ${globalFormatCurrency(finalAmountWithTip)}.` });


    setPendingOrderGroups(prevGroups => prevGroups.filter(group => !selectedPendingOrderNumbers.includes(group.orderNumber)));
    setSelectedPendingOrderNumbers([]);


    if (isDelivery && pendingOrderGroups.filter(group => !selectedPendingOrderNumbers.includes(group.orderNumber)).length === 0) {
        setDeliveryInfo(null);
        sessionStorage.removeItem(`deliveryInfo-${tableIdParam}`);
    }


    if (pendingOrderGroups.filter(group => !selectedPendingOrderNumbers.includes(group.orderNumber)).length === 0) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
        if (!isDelivery) {
           router.push('/tables');
        } else if (currentOrder.length === 0) {
            router.push('/tables');
        }
    }

    setIsPaymentDialogOpen(false);
  };


  const handleSaveDeliveryInfo = (info: DeliveryInfo) => {
      setDeliveryInfo(info);
      setIsDeliveryDialogOpen(false);
      setHasBeenInitialized(true); // Mark as initialized after delivery info is set
      toast({ title: "Datos de Envío Guardados", description: `Cliente: ${info.name}, Costo Envío: ${globalFormatCurrency(info.deliveryFee)}`});
  };

  const handleCancelDeliveryDialog = () => {
      if (!deliveryInfo && isDelivery && pendingOrderGroups.length === 0 && currentOrder.length === 0) {
          router.push('/tables');
      }
      setIsDeliveryDialogOpen(false);
  };


  const calculateOrderTotal = (orderItems: OrderItem[]): number => {
    return orderItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  };

  const handleTogglePendingOrderSelection = (orderNumber: number) => {
    setSelectedPendingOrderNumbers(prevSelected =>
      prevSelected.includes(orderNumber)
        ? prevSelected.filter(num => num !== orderNumber)
        : [...prevSelected, orderNumber]
    );
  };

  // This calculates the subtotal of selected pending orders (before tip)
  const subtotalOfSelectedPendingOrders = useMemo(() => {
    let subtotal = 0;
    pendingOrderGroups.forEach(group => {
      if (selectedPendingOrderNumbers.includes(group.orderNumber)) {
        subtotal += calculateOrderTotal(group.items);
        if (isDelivery && group.deliveryInfo && group.deliveryInfo.deliveryFee) {
          subtotal += group.deliveryInfo.deliveryFee;
        }
      }
    });
    return subtotal;
  }, [pendingOrderGroups, selectedPendingOrderNumbers, isDelivery]);



  const currentOrderTotal = useMemo(() => calculateOrderTotal(currentOrder), [currentOrder]);

  if (!tableIdParam || (!hasBeenInitialized && !isDelivery && !isDeliveryDialogOpen) ) {
    return <div className="flex items-center justify-center min-h-screen">Cargando datos de la mesa...</div>;
  }

  return (
    <div className="flex flex-col h-screen p-4 gap-4">
       <div className="flex items-center justify-between mb-0">
         <Button variant="outline" onClick={() => router.push('/tables')} className="bg-card hover:bg-accent">
           <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mesas
         </Button>
         <h1 className="text-2xl font-bold">
           {isDelivery ? `Pedido Delivery: ${deliveryInfo?.name || 'Nuevo Pedido'}` : `Mesa ${tableIdParam}`}
         </h1>
         <div className="w-auto min-w-[120px] text-right">
         </div>
       </div>

        <div className="flex justify-center mb-2">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-8 py-6 text-lg">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col"> {/* Adjusted width */}
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="text-xl">Menú de Productos</SheetTitle>
                    </SheetHeader>
                    <div className="flex-grow overflow-y-auto p-4">
                        <ProductsPageContent onProductSelect={handleOpenModificationDialog} onEditProduct={() => {}} />
                    </div>
                     <SheetClose asChild>
                        <Button type="button" variant="outline" className="m-4">Cerrar Menú</Button>
                    </SheetClose>
                </SheetContent>
            </Sheet>
        </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
      <Card className="flex flex-col h-full max-h-[calc(100vh-220px)]"> {/* Added max-h */}
          <CardHeader>
            <CardTitle>Pedido Actual</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow p-0">
            <CardContent className="p-4">
                {currentOrder.length === 0 ? (
                <p className="text-muted-foreground font-bold">No hay productos en el pedido actual.</p>
                ) : (
                currentOrder.map((item) => (
                    <div key={item.orderItemId} className="mb-3 pb-3 border-b last:border-b-0">
                        <div className="flex justify-between items-start">
                            <div className="flex-grow font-bold">
                                <p>{item.name}</p>
                                {item.selectedModifications && item.selectedModifications.length > 0 && (
                                <p className="text-xs text-muted-foreground font-bold"> {/* Added font-bold */}
                                    ({item.selectedModifications.join(', ')})
                                </p>
                                )}
                                 {item.ingredients && item.ingredients.length > 0 && (
                                    <p className="text-xs text-muted-foreground font-bold"> {/* Added font-bold */}
                                      Ingredientes: ({item.ingredients.join(', ')})
                                    </p>
                                  )}
                            </div>
                            <div className="flex items-center gap-2 ml-2 font-bold">
                                <Button variant="ghost" size="icon" onClick={() => handleAdjustQuantity(item.orderItemId, -1)} className="h-7 w-7">
                                    <MinusCircle className="h-4 w-4" />
                                </Button>
                                <span className="w-5 text-center">{item.quantity}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleAdjustQuantity(item.orderItemId, 1)} className="h-7 w-7">
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromOrder(item.orderItemId)} className="h-7 w-7 text-destructive hover:text-destructive/80">
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))
                )}
            </CardContent>
          </ScrollArea>
          <Separator />
          <CardFooter className="p-4 mt-auto">
            <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col h-full max-h-[calc(100vh-220px)]"> {/* Added max-h */}
          <CardHeader>
            <CardTitle>Pedidos Pendientes de Pago</CardTitle>
            {isDelivery && deliveryInfo && (
                <CardDescription className="text-xs">
                    <span className="font-bold">Envío para: {deliveryInfo.name} - {deliveryInfo.address} - {deliveryInfo.phone}</span>
                    <br/>
                    <span className="font-bold">Costo Envío Base: {globalFormatCurrency(deliveryInfo.deliveryFee)}</span>
                     {/* Only show edit if there are no pending orders or the pending orders are NOT for delivery */}
                    {pendingOrderGroups.filter(g => g.deliveryInfo).length === 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setIsDeliveryDialogOpen(true)} className="ml-2 h-6 px-1 py-0 text-xs">
                            <Edit className="h-3 w-3 mr-1"/> Editar
                        </Button>
                    )}
                </CardDescription>
            )}
          </CardHeader>
          <ScrollArea className="flex-grow p-0">
            <CardContent className="p-4">
            {pendingOrderGroups.length === 0 ? (
              <p className="text-muted-foreground font-bold">No hay pedidos pendientes.</p>
            ) : (
              pendingOrderGroups.map((group) => (
                <div key={group.orderNumber} className="mb-3 pb-3 border-b last:border-b-0">
                   <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                             <Checkbox
                                id={`pending-order-${group.orderNumber}`}
                                checked={selectedPendingOrderNumbers.includes(group.orderNumber)}
                                onCheckedChange={() => handleTogglePendingOrderSelection(group.orderNumber)}
                                className="mr-2"
                            />
                            <Label htmlFor={`pending-order-${group.orderNumber}`} className="font-bold text-base">
                                Pedido #{String(group.orderNumber).padStart(3, '0')}
                            </Label>
                        </div>
                        <span className="font-bold text-base">
                           {globalFormatCurrency(calculateOrderTotal(group.items) + (group.deliveryInfo?.deliveryFee || 0))}
                        </span>
                    </div>
                   {group.items.map(item => (
                       <div key={item.orderItemId} className="ml-6 mb-1 text-sm font-bold">
                           <div className="flex justify-between items-center">
                               <div>
                                   <p>
                                   {item.quantity}x {item.name}
                                   </p>
                                   {item.selectedModifications && item.selectedModifications.length > 0 && (
                                       <p className="text-xs text-muted-foreground font-bold"> {/* Added font-bold */}
                                           ({item.selectedModifications.join(', ')})
                                       </p>
                                   )}
                               </div>
                               <span>{globalFormatCurrency(item.finalPrice * item.quantity)}</span>
                           </div>
                       </div>
                   ))}
                    {group.deliveryInfo && group.deliveryInfo.deliveryFee > 0 && (
                         <div className="ml-6 mt-1 text-sm flex justify-between font-bold">
                            <span>Costo Envío Pedido:</span>
                            <span>{globalFormatCurrency(group.deliveryInfo.deliveryFee)}</span>
                        </div>
                    )}
                </div>
              ))
            )}
            </CardContent>
          </ScrollArea>
           <Separator />
          <CardFooter className="p-4 mt-auto flex flex-col items-stretch gap-2">
             <div className="flex justify-between items-center text-lg font-semibold">
               <span>Total Seleccionado:</span>
               <span>{globalFormatCurrency(subtotalOfSelectedPendingOrders)}</span>
             </div>
            <Button onClick={handleFinalizeAndPay} className="w-full" disabled={selectedPendingOrderNumbers.length === 0}>
              <CreditCard className="mr-2 h-4 w-4" /> Imprimir Pago
            </Button>
          </CardFooter>
        </Card>
      </div>

       <ModificationDialog
         isOpen={isModificationDialogOpen}
         onOpenChange={setIsModificationDialogOpen}
         item={selectedItemForModification}
         onConfirm={handleConfirmModifications}
         onCancel={() => {
            setIsModificationDialogOpen(false);
            setSelectedItemForModification(null);
         }}
       />

        <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            totalAmount={subtotalOfSelectedPendingOrders} // Pass subtotal here
            onConfirm={handleConfirmPayment}
        />

       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo}
               onConfirm={handleSaveDeliveryInfo}
               onCancel={handleCancelDeliveryDialog}
           />
       )}
    </div>
  );
}

