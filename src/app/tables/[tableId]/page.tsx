
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
import {Separator}from '@/components/ui/separator';
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
import {useToast}from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import PaymentDialog from '@/components/app/payment-dialog';
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page';
import type { DeliveryInfo } from '@/components/app/delivery-dialog';
import DeliveryDialog from '@/components/app/delivery-dialog'; // Corrected import
import { formatKitchenOrderReceipt, formatCustomerReceipt, printHtml, formatCurrency as printUtilsFormatCurrency } from '@/lib/printUtils';
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
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Salsas']
    },
     {
        id: 27,
        name: 'Hot Dog Grande',
        price: 4700,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Salsas']
    },
     {
        id: 28,
        name: 'Completo Normal',
        price: 4300,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 29,
        name: 'Completo Grande',
        price: 4800,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 30,
        name: 'Palta Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Palta']
    },
    {
        id: 31,
        name: 'Palta Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Palta']
    },
     {
        id: 32,
        name: 'Tomate Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate']
    },
    {
        id: 33,
        name: 'Tomate Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
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
    { id: 104, name: 'Italiana', price: 9500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'palta', 'tomate', 'aceituna', 'bebida lata', 'papa personal'] },
    { id: 105, name: 'Brasileño', price: 9200, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'cebolla caramelizada', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Queso Amarillo', 'Papas Hilo', 'Aceituna', 'bebida lata', 'papa personal'] },
    { id: 106, name: 'Chacarero', price: 9800, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Aceituna', 'Bebida Lata', 'Papa Personal'] },
    { id: 107, name: 'Americana', price: 8900, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Cebolla Caramelizada', 'Aceituna', 'bebida lata', 'papa personal'] },
    { id: 108, name: 'Primavera', price: 9000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'tomate', 'poroto verde', 'choclo', 'aceituna', 'bebida lata', 'papa personal'] },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'tocino', 'champiñón', 'queso amarillo', 'choclo', 'cebolla', 'aceituna', 'papas hilo', 'bebida lata', 'papa personal'] },
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
         ingredients: ['Palta', 'Tomate']
    },
    {
        id: 20,
        name: 'Churrasco Completo',
        price: 7200,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 53,
        name: 'Churrasco Queso',
        price: 7100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso']
    },
    {
        id: 54,
        name: 'Churrasco Tomate',
        price: 7000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate']
    },
    {
        id: 55,
        name: 'Churrasco Palta',
        price: 7300,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Palta']
    },
    {
        id: 56,
        name: 'Churrasco Campestre',
        price: 7800,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Lechuga']
    },
    {
        id: 57,
        name: 'Churrasco Dinamico',
        price: 7600,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Chucrut', 'Palta', 'Americana']
    },
    {
        id: 58,
        name: 'Churrasco Napolitano',
        price: 7900,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    {
        id: 59,
        name: 'Churrasco Che milico',
        price: 8000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Cebolla Caramelizada', 'Huevo']
    },
    {
        id: 60,
        name: 'Churrasco Queso Champiñon',
        price: 8100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso Champiñón', 'Tocino']
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
    { id: 64, name: 'Chorrillana 2', price: 12000, category: 'Papas Fritas', ingredients: ['Carne', 'Cebolla Frita', 'Longaniza', '2 Huevos Fritos'] },
    { id: 65, name: 'Chorrillana 4', price: 18000, category: 'Papas Fritas', ingredients: ['Carne', 'Cebolla Frita', 'Longaniza', '4 Huevos Fritos'] },
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


// Helper to format currency (consistent with other parts of the app)
// Moved to global scope or a utils file if used across multiple components
const globalFormatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};


// Storage key
const INVENTORY_STORAGE_KEY = 'restaurantInventory';
const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';
const ORDER_NUMBER_STORAGE_KEY = 'lastOrderNumber';
const DELIVERY_INFO_STORAGE_KEY = 'deliveryInfo'; // Add storage key constant

// Component to display the menu inside the Sheet
const MenuSheetContent = ({
  onAddItem,
  onClose,
  currentOrder,
  menu,
}: {
  onAddItem: (item: OrderItem) => void;
  onClose: () => void;
  currentOrder: OrderItem[];
  menu: MenuItem[];
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [selectedItemForModification, setSelectedItemForModification] = useState<MenuItem | null>(null);

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedMenu = useMemo(() => {
    const groups: { [key: string]: MenuItem[] } = {};
    filteredMenu.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    // Ensure categories are displayed in the predefined order
    return orderedCategories.reduce((acc, categoryName) => {
      if (groups[categoryName]) {
        acc[categoryName] = groups[categoryName];
      }
      return acc;
    }, {} as { [key: string]: MenuItem[] });
  }, [filteredMenu]);

  const handleItemClick = (item: MenuItem) => {
    if (item.modifications && item.modifications.length > 0) {
      setSelectedItemForModification(item);
      setIsModificationDialogOpen(true);
    } else {
      const orderItem: OrderItem = {
        ...item,
        orderItemId: `${item.id}-${Date.now()}`,
        quantity: 1,
        basePrice: item.price,
        finalPrice: item.price,
        selectedModifications: [],
      };
      onAddItem(orderItem);
    }
  };

  const handleModificationConfirm = (modifications?: string[]) => {
    if (selectedItemForModification) {
      let finalPrice = selectedItemForModification.price;
      if (modifications && selectedItemForModification.modificationPrices) {
        modifications.forEach(mod => {
          finalPrice += selectedItemForModification.modificationPrices![mod] ?? 0;
        });
      }
      const orderItem: OrderItem = {
        ...selectedItemForModification,
        orderItemId: `${selectedItemForModification.id}-${Date.now()}`,
        quantity: 1,
        basePrice: selectedItemForModification.price,
        finalPrice: finalPrice,
        selectedModifications: modifications ?? [],
      };
      onAddItem(orderItem);
      setIsModificationDialogOpen(false);
      setSelectedItemForModification(null);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="p-4 border-b">
        <SheetTitle className="text-2xl font-semibold text-center">Menú</SheetTitle>
      </SheetHeader>
       {/* Removed Search Input for Categories */}
      <ScrollArea className="flex-grow p-1 overflow-y-auto"> {/* Ensure p-1 to avoid scrollbar overlap with borders */}
         <Accordion type="multiple" className="w-full" defaultValue={orderedCategories}>
          {Object.entries(groupedMenu).map(([category, items]) => (
            <AccordionItem value={category} key={category} className="border-b-0">
              <AccordionTrigger className="text-xl font-semibold hover:bg-muted/50 px-4 py-3 rounded-md hover:no-underline">
                  {category}
              </AccordionTrigger>
              <AccordionContent className="bg-background/50">
                <div className="grid grid-cols-1 gap-1 p-2">
                  {items.map((item) => (
                    <Button
                      key={item.id}
                      variant="ghost"
                      className="w-full h-auto justify-start p-3 text-left rounded-md hover:bg-muted"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex flex-col w-full">
                          <span className="font-medium text-base">{item.name}</span>
                          {item.ingredients && item.ingredients.length > 0 && (
                            <span className="text-xs text-muted-foreground mt-0.5">
                                ({item.ingredients.join(', ')})
                            </span>
                          )}
                          <span className="text-sm text-primary font-semibold mt-0.5">
                              {globalFormatCurrency(item.price)}
                          </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

       <SheetClose asChild>
            <Button onClick={onClose} className="m-4">Confirmar</Button>
       </SheetClose>


      {selectedItemForModification && (
        <ModificationDialog
          isOpen={isModificationDialogOpen}
          onOpenChange={setIsModificationDialogOpen}
          item={selectedItemForModification}
          onConfirm={handleModificationConfirm}
          onCancel={() => setIsModificationDialogOpen(false)}
        />
      )}
    </div>
  );
};



export default function TableDetailPage() {
  const params = useParams();
  const tableIdParam = params.tableId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrder, setPendingOrder] = useState<PendingOrderGroup[]>([]); // Array of order groups
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false); // State for delivery dialog
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null); // State for delivery info
  const [orderToPay, setOrderToPay] = useState<PendingOrderGroup | null>(null); // Order selected for payment
  const [orderNumber, setOrderNumber] = useState<number>(1); // Initialize order number
  const [isInitialized, setIsInitialized] = useState(false); // Track page initialization


  const isDelivery = tableIdParam === 'delivery';

  const getNextOrderNumber = useCallback((currentNumber: number): number => {
    return currentNumber >= 999 ? 1 : currentNumber + 1;
  }, []);


  // --- Effects for loading and saving state from/to sessionStorage ---
  useEffect(() => {
    if (!tableIdParam || isInitialized) return;

    console.log(`Initializing state for table/delivery: ${tableIdParam}...`);

    // Load current order
    const storedCurrentOrder = sessionStorage.getItem(`table-${tableIdParam}-current-order`);
    if (storedCurrentOrder) {
      try {
        const parsed = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsed)) setCurrentOrder(parsed);
      } catch (e) { console.error(`Error parsing current order for ${tableIdParam}:`, e); }
    }

    // Load pending orders
    const storedPendingOrders = sessionStorage.getItem(`table-${tableIdParam}-pending-orders`);
    if (storedPendingOrders) {
      try {
        const parsed = JSON.parse(storedPendingOrders) as PendingOrderStorageData; // Assuming this structure
        if (parsed && Array.isArray(parsed.groups)) {
            setPendingOrder(parsed.groups);
        } else if (Array.isArray(parsed)) { // Handle old format (array of OrderItem[])
            // Convert old format to new PendingOrderGroup structure
            // This assumes each old array was a single order group.
            // If you had multiple unnamed groups before, this might need adjustment.
            const newGroups: PendingOrderGroup[] = parsed.map((orderItems, index) => ({
                orderNumber: index + 1, // Assign a sequential number for now
                items: orderItems as OrderItem[],
                deliveryInfo: null // No delivery info in old format
            }));
            setPendingOrder(newGroups);
        }
      } catch (e) { console.error(`Error parsing pending orders for ${tableIdParam}:`, e); }
    }

    // Load delivery info (only for delivery table)
    if (isDelivery) {
      const storedDeliveryInfo = sessionStorage.getItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`);
      if (storedDeliveryInfo) {
        try {
          const parsed = JSON.parse(storedDeliveryInfo);
          if (parsed && typeof parsed.name === 'string') setDeliveryInfo(parsed); // Basic check
        } catch (e) { console.error(`Error parsing delivery info for ${tableIdParam}:`, e); }
      }
      setIsDeliveryDialogOpen(true); // Open delivery dialog if it's a delivery and no info yet
    }

     // Load last order number (global, not per-table)
     const storedOrderNumber = sessionStorage.getItem(ORDER_NUMBER_STORAGE_KEY);
     if (storedOrderNumber) {
       const parsedNum = parseInt(storedOrderNumber, 10);
       if (!isNaN(parsedNum)) setOrderNumber(parsedNum);
     }


    setIsInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, isInitialized, isDelivery]);


  // --- Effect to save state changes to sessionStorage and update table status ---
  useEffect(() => {
    if (!isInitialized || !tableIdParam) return; // Don't save until initialized

    console.log(`Saving state for table/delivery: ${tableIdParam}...`);

    sessionStorage.setItem(`table-${tableIdParam}-current-order`, JSON.stringify(currentOrder));
    sessionStorage.setItem(`table-${tableIdParam}-pending-orders`, JSON.stringify({ groups: pendingOrder }));

    if (isDelivery && deliveryInfo) {
      sessionStorage.setItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`, JSON.stringify(deliveryInfo));
    }

    // Update table status based on orders
    const isOccupied = currentOrder.length > 0 || pendingOrder.length > 0 || (isDelivery && !!deliveryInfo);
    sessionStorage.setItem(`table-${tableIdParam}-status`, isOccupied ? 'occupied' : 'available');
    console.log(`Table ${tableIdParam} status set to: ${isOccupied ? 'occupied' : 'available'}`);

  }, [currentOrder, pendingOrder, deliveryInfo, tableIdParam, isInitialized, isDelivery]);

  // --- Effect to save global order number ---
   useEffect(() => {
     if (!isInitialized) return;
     sessionStorage.setItem(ORDER_NUMBER_STORAGE_KEY, orderNumber.toString());
     console.log(`Global order number saved: ${orderNumber}`);
   }, [orderNumber, isInitialized]);



  // --- Menu and Order Management Functions ---
  const addItemToOrder = (item: OrderItem) => {
    setCurrentOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex(
        (orderItem) =>
          orderItem.id === item.id &&
          isEqual(orderItem.selectedModifications?.sort(), item.selectedModifications?.sort())
      );
      if (existingItemIndex > -1) {
        const updatedOrder = [...prevOrder];
        updatedOrder[existingItemIndex].quantity += 1;
        return updatedOrder;
      }
      return [...prevOrder, { ...item, quantity: 1 }];
    });
    // toast({ title: `${item.name} añadido al pedido actual.` });
  };

  const removeItemFromOrder = (orderItemId: string) => {
    setCurrentOrder((prevOrder) =>
      prevOrder.filter((item) => item.orderItemId !== orderItemId)
    );
  };

  const updateItemQuantity = (orderItemId: string, newQuantity: number) => {
    setCurrentOrder((prevOrder) =>
      prevOrder
        .map((item) =>
          item.orderItemId === orderItemId ? { ...item, quantity: Math.max(1, newQuantity) } : item
        )
        .filter(item => item.quantity > 0) // Remove if quantity becomes 0 or less
    );
  };

  const handlePrintKitchenOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Pedido Vacío", description: "Añada productos antes de imprimir.", variant: "destructive" });
      return;
    }

    // Assign current order number to all items being printed
    const orderItemsWithNumber = currentOrder.map(item => ({ ...item, orderNumber }));

    // Move current order to pending orders with its delivery info
    const newPendingGroup: PendingOrderGroup = {
      orderNumber: orderNumber,
      items: [...orderItemsWithNumber], // Ensure a copy is made
      deliveryInfo: isDelivery ? deliveryInfo : null, // Add delivery info if applicable
    };
    setPendingOrder((prev) => [...prev, newPendingGroup]);

    // Generate and print kitchen receipt
    const receiptHtml = formatKitchenOrderReceipt(orderItemsWithNumber, tableIdParam, orderNumber, isDelivery ? deliveryInfo : null);
    printHtml(receiptHtml);

    toast({ title: "Comanda Impresa", description: `Pedido #${orderNumber} enviado a cocina.` });

    // Increment and save the global order number
    setOrderNumber(prevNum => getNextOrderNumber(prevNum));

    // Clear current order for this table
    setCurrentOrder([]);
  };


  const handleFinalizeAndPay = (groupToPay: PendingOrderGroup) => {
     if (!groupToPay || groupToPay.items.length === 0) {
         toast({ title: "Error", description: "No hay pedido pendiente seleccionado para pagar.", variant: "destructive" });
         return;
     }
     setOrderToPay(groupToPay); // Set the specific order group to be paid
     setIsPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = (paymentMethod: PaymentMethod, tipAmount: number, finalAmountWithTip: number) => {
    if (!orderToPay) {
        toast({title: "Error", description: "No hay orden seleccionada para el pago.", variant: "destructive"});
        setIsPaymentDialogOpen(false);
        return;
    }

    const { items: orderItems, deliveryInfo: orderDeliveryInfo, orderNumber: paidOrderNumber } = orderToPay;

    // Calculate subtotal from items (basePrice * quantity)
    let subtotal = orderItems.reduce((sum, item) => sum + (item.basePrice * item.quantity), 0);

    // Add modification costs to subtotal
    orderItems.forEach(item => {
        if (item.selectedModifications && item.modificationPrices) {
            item.selectedModifications.forEach(mod => {
                subtotal += (item.modificationPrices![mod] ?? 0) * item.quantity;
            });
        }
    });


    // Add delivery fee if applicable for this specific paid order
    const deliveryFeeForOrder = orderDeliveryInfo?.deliveryFee ?? 0;
    // The finalAmountWithTip already includes subtotal, delivery fee, and tip.

    const receiptHtml = formatCustomerReceipt(orderItems, finalAmountWithTip, paymentMethod, tableIdParam, orderDeliveryInfo, tipAmount);
    printHtml(receiptHtml);

    toast({ title: "Pago Registrado", description: `Mesa ${tableIdParam}, Pedido #${paidOrderNumber} pagado con ${paymentMethod}. Total: ${printUtilsFormatCurrency(finalAmountWithTip)}.` });

    // Deduct items from inventory
    const inventoryKey = INVENTORY_STORAGE_KEY;
    const storedInventory = localStorage.getItem(inventoryKey);
    if (storedInventory) {
      let inventory: InventoryItem[] = JSON.parse(storedInventory);
      orderItems.forEach(orderItem => {
         // --- PAN ESPECIAL NORMAL DEDUCTION ---
        if (['Completo Normal', 'Dinamico Normal', 'Hot Dog Normal', 'Italiano Normal', 'Palta Normal', 'Tomate Normal'].includes(orderItem.name) && orderItem.category === 'Completos Vienesas') {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan especial normal');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }
        if (['Completo Normal', 'Dinamico Normal', 'Chacarero Normal', 'Italiano Normal', 'Palta Normal', 'Tomate Normal', 'Napolitano Normal', 'Queso Champiñon Normal', 'Queso Normal', 'Solo Carne Normal'].includes(orderItem.name) && orderItem.category === 'Completos As') {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan especial normal');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }

        // --- PAN ESPECIAL GRANDE DEDUCTION ---
        if (['Completo Grande', 'Dinamico Grande', 'Hot Dog Grande', 'Italiano Grande', 'Palta Grande', 'Tomate Grande'].includes(orderItem.name) && orderItem.category === 'Completos Vienesas') {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan especial grande');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }
         if (['Completo Grande', 'Dinamico Grande', 'Chacarero Grande', 'Italiano Grande', 'Palta Grande', 'Tomate Grande', 'Napolitano Grande', 'Queso Champiñon Grande', 'Queso Grande', 'Solo Carne Grande'].includes(orderItem.name) && orderItem.category === 'Completos As') {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan especial grande');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }

         // --- PAN DE MARRAQUETA DEDUCTION ---
        if (orderItem.category === 'Churrascos' && ['Churrasco Campestre', 'Churrasco Che milico', 'Churrasco Completo', 'Churrasco Dinamico', 'Churrasco Italiano', 'Churrasco Napolitano', 'Churrasco Palta', 'Churrasco Queso', 'Churrasco Queso Champiñon', 'Churrasco Tomate'].includes(orderItem.name)) {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan de marraqueta');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }
        // For Promo Churrasco (deduct 2 per promo item, as they are likely 2x items or imply double bread)
        if (orderItem.category === 'Promo Churrasco' && ['Brasileño', 'Campestre', 'Chacarero', 'Che milico', 'Completo', 'Dinamico', 'Italiano', 'Palta', 'Queso', 'Queso Champiñon', 'Tomate'].includes(orderItem.name)) {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan de marraqueta');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - (orderItem.quantity * 2)); // Deduct 2
        }
        // For Promo Mechada (deduct 2 per promo item)
        if (orderItem.category === 'Promo Mechada' && ['Brasileño', 'Campestre', 'Chacarero', 'Che milico', 'Completo', 'Dinamico', 'Italiano', 'Palta', 'Queso', 'Queso Champiñon', 'Tomate'].includes(orderItem.name)) {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan de marraqueta');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - (orderItem.quantity * 2)); // Deduct 2
        }


        // --- PAN DE HAMBURGUESA NORMAL DEDUCTION ---
        if (orderItem.category === 'Hamburguesas' && ['Simple', 'Italiana', 'Tapa Arteria', 'Big Cami'].includes(orderItem.name)) {
             const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan de hamburguesa normal');
             if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }
         // --- PAN DE HAMBURGUESA GRANDE DEDUCTION ---
        if (orderItem.category === 'Hamburguesas' && ['Doble', 'Doble Italiana', 'Super Tapa Arteria', 'Super Big Cami'].includes(orderItem.name)) {
             const itemIndex = inventory.findIndex(invItem => invItem.name === 'Pan de hamburguesa grande');
             if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }


        // --- BEBIDAS DEDUCTION ---
        if (orderItem.name === 'Bebida 1.5Lt' && orderItem.category === 'Bebidas') {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Bebida 1.5Lt');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }
        if (orderItem.name === 'Lata' && orderItem.category === 'Bebidas') {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Lata');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }
        if (orderItem.name === 'Cafe Chico' && orderItem.category === 'Bebidas') {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Cafe Chico');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }
        if (orderItem.name === 'Cafe Grande' && orderItem.category === 'Bebidas') {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Cafe Grande');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }

        // --- FAJITAS (assuming each uses 1 unit of a generic 'Fajitas' inventory item) ---
        if (orderItem.category === 'Fajitas' && ['4 Ingredientes', '6 Ingredientes', 'Americana', 'Brasileño', 'Chacarero', 'Golosasa', 'Italiana', 'Primavera'].includes(orderItem.name)) {
           // If you have a generic "Masa Fajita" or similar item:
           // const itemIndex = inventory.findIndex(invItem => invItem.name === 'Masa Fajita');
           // if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
           // For now, no specific deduction for fajitas unless a specific inventory item is defined.
        }

        // --- VIENESAS DEDUCTION ---
        // For "normal" size items in "Completos Vienesas" (1 vienesa)
        if (orderItem.category === 'Completos Vienesas' && ['Completo Normal', 'Dinamico Normal', 'Hot Dog Normal', 'Italiano Normal', 'Palta Normal', 'Tomate Normal'].includes(orderItem.name)) {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Vienesas');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - orderItem.quantity);
        }
        // For "grande" size items in "Completos Vienesas" (2 vienesas)
        if (orderItem.category === 'Completos Vienesas' && ['Completo Grande', 'Dinamico Grande', 'Hot Dog Grande', 'Italiano Grande', 'Palta Grande', 'Tomate Grande'].includes(orderItem.name)) {
            const itemIndex = inventory.findIndex(invItem => invItem.name === 'Vienesas');
            if (itemIndex > -1) inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - (orderItem.quantity * 2));
        }


      });
      localStorage.setItem(inventoryKey, JSON.stringify(inventory));
      console.log("Inventory updated after sale.");
    }

    // Register sale in cash movements
    const storedCashMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    let cashMovements: CashMovement[] = storedCashMovements ? JSON.parse(storedCashMovements) : [];
    // Ensure IDs are numbers before finding the max for new movement
    const maxId = cashMovements.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);

    // Create a description that includes the order number and table/delivery ID
    let saleDescription = `Venta Pedido #${paidOrderNumber} (${tableIdParam})`;
    if (tipAmount > 0) {
        saleDescription += ` - Propina: ${printUtilsFormatCurrency(tipAmount)}`;
    }


    const newSaleMovement: CashMovement = {
      id: maxId + 1,
      date: new Date().toISOString(), // Store as ISO string
      category: 'Ingreso Venta',
      description: saleDescription,
      amount: finalAmountWithTip, // Total amount including tip and delivery
      paymentMethod: paymentMethod,
      deliveryFee: deliveryFeeForOrder > 0 ? deliveryFeeForOrder : undefined,
    };
    cashMovements.push(newSaleMovement);
    sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(cashMovements));
    console.log("Sale registered in cash movements.");

    // Remove the paid order group from pending orders
    setPendingOrder(prev => prev.filter(group => group.orderNumber !== paidOrderNumber));
    setIsPaymentDialogOpen(false);
    setOrderToPay(null); // Clear the order to pay

    // If no more pending orders, reset delivery info for this specific table
    if (isDelivery && pendingOrder.filter(group => group.orderNumber !== paidOrderNumber).length === 0) {
        setDeliveryInfo(null);
        sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`); // Also clear from storage for this table
        console.log(`Delivery info cleared for ${tableIdParam} as all pending orders are paid.`);
    }
  };


  // Function to handle confirming delivery info
  const handleDeliveryInfoConfirm = (info: DeliveryInfo) => {
      setDeliveryInfo(info);
      setIsDeliveryDialogOpen(false); // Close dialog on confirm
      toast({ title: "Datos de Envío Guardados", description: `Envío para ${info.name} registrado.`});
  };

  // Calculate totals for current order and pending order
  const currentOrderTotal = currentOrder.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  const pendingOrderDisplayList = pendingOrder.map(group => {
     const groupSubtotal = group.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
     const groupDeliveryFee = group.deliveryInfo?.deliveryFee ?? 0;
     return {
         ...group,
         displayTotal: groupSubtotal + groupDeliveryFee
     };
  });



  // Handle back navigation
  const handleGoBack = () => {
    router.push('/tables');
  };

  // If not initialized, show loading (or a more specific loading state)
  if (!isInitialized && !isDelivery) { // For non-delivery, wait for initialization
     return <div className="flex items-center justify-center min-h-screen">Cargando Mesa...</div>;
  }
  // For delivery, allow interaction even if delivery dialog is open, as it's part of the flow.


  return (
    <div className="container mx-auto p-4 flex flex-col h-screen">
       <div className="flex justify-between items-center mb-4">
         <Button variant="outline" onClick={handleGoBack} className="group">
           <ArrowLeft className="mr-2 h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors"/>
           <span className="text-lg font-medium text-primary group-hover:text-primary-foreground transition-colors">
               Volver a Mesas
           </span>
         </Button>
         <h1 className="text-3xl font-bold">
            {isDelivery ? `Pedido Delivery` : `Mesa ${tableIdParam}`}
            {isDelivery && deliveryInfo && (
                <span className="block text-sm text-muted-foreground font-normal">
                    Para: {deliveryInfo.name} - {deliveryInfo.address} (Costo Envío: {printUtilsFormatCurrency(deliveryInfo.deliveryFee)})
                </span>
            )}
         </h1>
         {/* Placeholder for potential actions or info on the right */}
         <div className="w-24"></div>
       </div>

       {/* Delivery Info Dialog (only for delivery table) */}
       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo} // Pass existing data for editing
               onConfirm={handleDeliveryInfoConfirm}
               onCancel={() => {
                    // If canceling and no info exists, and no pending/current orders, go back
                    if (!deliveryInfo && currentOrder.length === 0 && pendingOrder.length === 0) {
                        router.push('/tables');
                    } else {
                        setIsDeliveryDialogOpen(false); // Just close if there's info or orders
                    }
               }}
           />
       )}

       {/* Menu Trigger Button - Centered */}
       {(!isDelivery || deliveryInfo) && ( // Show menu button if not delivery OR if delivery info is set
            <div className="flex justify-center mb-6">
                <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                    <SheetTrigger asChild>
                         <Button size="lg" className="px-8 py-6 text-lg">
                            <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-md p-0 sm:max-w-lg md:max-w-xl lg:max-w-2xl"> {/* Wider sheet */}
                        <MenuSheetContent
                        onAddItem={addItemToOrder}
                        onClose={() => setIsMenuSheetOpen(false)}
                        currentOrder={currentOrder}
                        menu={globalMenu} // Pass the globalMenu
                        />
                    </SheetContent>
                </Sheet>
            </div>
       )}


      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        {/* Current Order Section */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Pedido Actual</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow p-1"> {/* Ensure p-1 to avoid scrollbar overlap */}
            <CardContent className="p-3 space-y-3">
              {currentOrder.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay productos en el pedido actual.</p>
              ) : (
                currentOrder.map((item) => (
                  <div key={item.orderItemId} className="border p-3 rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-base">{item.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeItemFromOrder(item.orderItemId)} className="h-7 w-7 text-destructive hover:text-destructive/80">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    {item.selectedModifications && item.selectedModifications.length > 0 && (
                      <p className="text-xs text-muted-foreground mb-1">
                        <span className="font-bold">({item.selectedModifications.join(', ')})</span>
                      </p>
                    )}
                     {item.ingredients && item.ingredients.length > 0 && (
                        <p className="text-xs text-muted-foreground italic mb-1">
                           Ingredientes: {item.ingredients.join(', ')}
                        </p>
                     )}
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => updateItemQuantity(item.orderItemId, item.quantity - 1)} className="h-7 w-7">
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="font-mono text-sm w-6 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" onClick={() => updateItemQuantity(item.orderItemId, item.quantity + 1)} className="h-7 w-7">
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="font-mono text-sm font-bold">{printUtilsFormatCurrency(item.finalPrice * item.quantity)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </ScrollArea>
          <Separator />
          <CardFooter className="p-4 flex flex-col items-stretch gap-3 sticky bottom-0 bg-background border-t">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Total Actual:</span>
              <span className="font-bold">{printUtilsFormatCurrency(currentOrderTotal)}</span>
            </div>
            <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>

        {/* Pending Orders Section */}
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Pedidos Pendientes de Pago</CardTitle>
          </CardHeader>
           <ScrollArea className="flex-grow p-1"> {/* Ensure p-1 */}
            <CardContent className="p-3 space-y-3">
              {pendingOrderDisplayList.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay pedidos pendientes.</p>
              ) : (
                pendingOrderDisplayList.map((group) => (
                  <Card key={group.orderNumber} className="p-3 rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleFinalizeAndPay(group)}>
                     <CardHeader className="p-1 pb-2">
                        <CardTitle className="text-base font-bold flex justify-between items-center">
                            <span>Pedido #{String(group.orderNumber).padStart(3, '0')}</span>
                             <ChevronRight className="h-5 w-5 text-muted-foreground"/>
                        </CardTitle>
                        {group.deliveryInfo && (
                             <CardDescription className="text-xs">
                                Para: {group.deliveryInfo.name} (Envío: {printUtilsFormatCurrency(group.deliveryInfo.deliveryFee)})
                             </CardDescription>
                        )}
                     </CardHeader>
                     <CardContent className="p-1 text-sm space-y-1">
                        {group.items.map(item => (
                            <div key={item.orderItemId} className="flex justify-between">
                                <span className="font-bold">
                                    {item.quantity}x {item.name}
                                    {item.selectedModifications && item.selectedModifications.length > 0 && (
                                        <span className="text-xs text-muted-foreground font-bold"> ({item.selectedModifications.join(', ')})</span>
                                    )}
                                </span>
                                <span className="font-mono font-bold">{printUtilsFormatCurrency(item.finalPrice * item.quantity)}</span>
                            </div>
                        ))}
                     </CardContent>
                     <CardFooter className="p-1 pt-2 mt-2 border-t">
                         <div className="flex justify-between items-center w-full font-bold text-base">
                             <span>Total Pedido:</span>
                             <span>{printUtilsFormatCurrency(group.displayTotal)}</span>
                         </div>
                     </CardFooter>
                  </Card>
                ))
              )}
            </CardContent>
          </ScrollArea>
           {/* No global footer for pending orders, actions are per-item */}
        </Card>
      </div>

      {isPaymentDialogOpen && orderToPay && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          totalAmount={orderToPay.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) + (orderToPay.deliveryInfo?.deliveryFee ?? 0)}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
}
