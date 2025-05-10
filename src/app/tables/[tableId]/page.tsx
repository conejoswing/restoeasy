

'use client';

import * as React from 'react';
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button, buttonVariants} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {ScrollArea }from '@/components/ui/scroll-area';
import {Separator }from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// import { Checkbox } from '@/components/ui/checkbox'; // No longer directly used here, but in ModificationDialog
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
import {useToast }from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import PaymentDialog from '@/components/app/payment-dialog';
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page';
import type { DeliveryInfo } from '@/components/app/delivery-dialog';
import DeliveryDialog from '@/components/app/delivery-dialog'; // Corrected import
import { formatKitchenOrderReceipt, formatCustomerReceipt, printHtml, formatCurrency as printUtilsFormatCurrency } from '@/lib/printUtils';
import type { InventoryItem } from '@/app/inventory/page';
import { Dialog as ShadDialog, DialogClose as ShadDialogClose, DialogContent as ShadDialogContent, DialogDescription as ShadDialogDescription, DialogFooter as ShadDialogFooter, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle, DialogTrigger as ShadDialogTrigger } from '@/components/ui/dialog';
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

interface PendingOrderGroup {
  orderNumber: number;
  items: OrderItem[];
  deliveryInfo?: DeliveryInfo | null;
}

interface PendingOrderStorageData {
    groups: PendingOrderGroup[];
}

const MENU_STORAGE_KEY = 'restaurantMenuData';

const mockMenu: MenuItem[] = [
    // --- Vienesas ---
    {
      id: 13,
      name: 'Italiano Normal',
      price: 4000,
      category: 'Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Palta', 'Tomate']
    },
    {
      id: 14,
      name: 'Italiano Grande',
      price: 4500,
      category: 'Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Palta', 'Tomate']
    },
     {
      id: 15,
      name: 'Hot Dog Normal',
      price: 4200,
      category: 'Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Salsas']
    },
     {
        id: 27,
        name: 'Hot Dog Grande',
        price: 4700,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Salsas']
    },
     {
        id: 28,
        name: 'Completo Normal',
        price: 4300,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 29,
        name: 'Completo Grande',
        price: 4800,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 30,
        name: 'Palta Normal',
        price: 4100,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Palta']
    },
    {
        id: 31,
        name: 'Palta Grande',
        price: 4600,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Palta']
    },
     {
        id: 32,
        name: 'Tomate Normal',
        price: 4100,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate']
    },
    {
        id: 33,
        name: 'Tomate Grande',
        price: 4600,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate']
    },
    {
        id: 34,
        name: 'Dinamico Normal',
        price: 4400,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 35,
        name: 'Dinamico Grande',
        price: 4900,
        category: 'Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    // --- As ---
    {
      id: 10,
      name: 'Italiano Normal',
      price: 5500,
      category: 'As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Palta', 'Tomate']
    },
    {
      id: 11,
      name: 'Italiano Grande',
      price: 6000,
      category: 'As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Palta', 'Tomate']
    },
    {
      id: 12,
      name: 'Completo Normal',
      price: 6500,
      category: 'As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    { id: 36, name: 'Completo Grande', price: 7000, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Chucrut', 'Americana'] },
    { id: 37, name: 'Palta Normal', price: 5800, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta'] },
    { id: 38, name: 'Palta Grande', price: 6300, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta'] },
    { id: 39, name: 'Tomate Normal', price: 5800, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate'] },
    { id: 40, name: 'Tomate Grande', price: 6300, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate'] },
    { id: 41, name: 'Queso Normal', price: 6000, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso'] },
    { id: 42, name: 'Queso Grande', price: 6500, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso'] },
    { id: 43, name: 'Solo Carne Normal', price: 5000, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: [] },
    { id: 44, name: 'Solo Carne Grande', price: 5500, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: [] },
    {
        id: 45,
        name: 'Dinamico Normal',
        price: 6800,
        category: 'As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 46,
        name: 'Dinamico Grande',
        price: 7300,
        category: 'As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 47,
        name: 'Chacarero Normal',
        price: 6700,
        category: 'As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño']
    },
    {
        id: 48,
        name: 'Chacarero Grande',
        price: 7200,
        category: 'As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño']
    },
    {
        id: 49,
        name: 'Napolitano Normal',
        price: 6900,
        category: 'As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin queso', 'sin tomate', 'sin oregano', 'sin aceituna'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    {
        id: 50,
        name: 'Napolitano Grande',
        price: 7400,
        category: 'As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin queso', 'sin tomate', 'sin oregano', 'sin aceituna'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    { id: 51, name: 'Queso Champiñon Normal', price: 7000, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Sin Queso', 'Sin Champiñon', 'Sin Tocino'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino'] },
    { id: 52, name: 'Queso Champiñon Grande', price: 7500, category: 'As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Sin Queso', 'Sin Champiñon', 'Sin Tocino'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino'] },
    // --- Promo Fajitas ---
    { id: 104, name: 'Italiana', price: 9500, category: 'Promo Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'palta', 'tomate', 'aceituna', 'bebida lata', 'papa personal'] },
    { id: 105, name: 'Brasileño', price: 9200, category: 'Promo Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Queso Amarillo', 'Papas Hilo', 'Aceituna', 'bebida lata', 'papa personal'] },
    { id: 106, name: 'Chacarero', price: 9800, category: 'Promo Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Aceituna', 'Bebida Lata', 'Papa Personal'] },
    { id: 107, name: 'Americana', price: 8900, category: 'Promo Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Cebolla Caramelizada', 'Aceituna', 'bebida lata', 'papa personal'] },
    { id: 108, name: 'Primavera', price: 9000, category: 'Promo Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'tomate', 'poroto verde', 'choclo', 'aceituna', 'bebida lata', 'papa personal'] },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Promo Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'tocino', 'champiñón', 'queso amarillo', 'choclo', 'cebolla', 'aceituna', 'papas hilo', 'bebida lata', 'papa personal'] },
    { id: 110, name: '4 Ingredientes', price: 11000, category: 'Promo Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Bebida Lata', 'Papa Personal'] },
    { id: 111, name: '6 Ingredientes', price: 12000, category: 'Promo Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde', 'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Bebida Lata', 'Papa Personal'] },
    // --- Promo Hamburguesas ---
    {
        id: 17,
        name: 'Simple',
        price: 7000,
        category: 'Promo Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Kétchup', 'Mostaza', 'Cebolla', 'Pepinillo', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 18,
        name: 'Doble',
        price: 8500,
        category: 'Promo Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Kétchup', 'Mostaza', 'Cebolla', 'Pepinillo', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 67,
        name: 'Italiana',
        price: 7800,
        category: 'Promo Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Palta', 'Tomate', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 68,
        name: 'Doble Italiana',
        price: 9500,
        category: 'Promo Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Palta', 'Tomate', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 69,
        name: 'Tapa Arteria',
        price: 10500,
        category: 'Promo Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Huevo Frito', 'Cebolla Frita', 'Bacon']
    },
    {
        id: 70,
        name: 'Super Tapa Arteria',
        price: 13000,
        category: 'Promo Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso Cheddar', 'Aro Cebolla', 'Salsa Cheddar', 'Cebolla Caramelizada', 'Tocino', 'Kétchup', 'Mostaza', 'Pepinillo', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 71,
        name: 'Big Cami',
        price: 9800,
        category: 'Promo Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Lechuga', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Pepinillo', 'Salsa de la Casa', 'Kétchup', 'Mostaza', 'Cebolla', 'Bebida Lata', 'Papa Personal']
    },
    {
        id: 72,
        name: 'Super Big Cami',
        price: 12500,
        category: 'Promo Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Lechuga', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Pepinillo', 'Salsa de la Casa', 'Kétchup', 'Mostaza', 'Cebolla', 'Bebida Lata', 'Papa Personal']
    },
    // --- Churrascos ---
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
    // --- Papas Fritas ---
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
    {
        id: 64,
        name: 'Chorrillana 2',
        price: 12000,
        category: 'Papas Fritas',
        ingredients: ['Carne', 'Cebolla Frita', 'Longaniza', '2 Huevos Fritos'],
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Quitar Huevos', 'Agregado Huevos', 'Agregado Tocino', 'Agregado Cheddar'],
        modificationPrices: { 'Agregado Queso': 1000, 'Agregado Huevos': 1000, 'Agregado Tocino': 2000, 'Agregado Cheddar': 2000 }
    },
    {
        id: 65,
        name: 'Chorrillana 4',
        price: 18000,
        category: 'Papas Fritas',
        ingredients: ['Carne', 'Cebolla Frita', 'Longaniza', '4 Huevos Fritos'],
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Quitar Huevos', 'Agregado Huevos', 'Agregado Tocino', 'Agregado Cheddar'],
        modificationPrices: { 'Agregado Queso': 1000, 'Agregado Huevos': 1000, 'Agregado Tocino': 2000, 'Agregado Cheddar': 2000 }
    },
    { id: 66, name: 'Box Cami', price: 15000, category: 'Papas Fritas', ingredients: ['2 Papas XL', '8 Porciones Aro Cebolla', '8 Empanadas de Queso', '1 Porción Carne Vacuno', '6 Laminas Queso Cheddar', 'Tocino', 'Salsa Cheddar', 'Bebida 1.5Lt'] },
    // --- Promo Churrasco ---
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
    // --- Promo Mechada ---
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
    // --- Promociones ---
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
    // --- Bebidas ---
    {
      id: 100,
      name: 'Bebida 1.5Lt',
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
     // --- Colaciones ---
].filter(item => !(item.category === 'Promo Fajitas' && [1, 2, 8].includes(item.id)));


const orderedCategories = [
  'Vienesas',
  'As',
  'Promo Fajitas',
  'Promo Hamburguesas',
  'Churrascos',
  'Papas Fritas',
  'Promo Churrasco',
  'Promo Mechada',
  'Promociones',
  'Bebidas',
  'Colaciones',
];


const extractPromoNumber = (name: string): number => {
    const match = name.match(/^Promo (\d+)/i);
    return match ? parseInt(match[1], 10) : Infinity;
};


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

const getPersistedMenuForTablePage = (): MenuItem[] => {
  if (typeof window === 'undefined') {
    return sortMenu(mockMenu); // SSR fallback
  }
  const storedMenuJson = localStorage.getItem(MENU_STORAGE_KEY);
  if (storedMenuJson) {
    try {
      const parsedMenu = JSON.parse(storedMenuJson);
      if (Array.isArray(parsedMenu) && parsedMenu.length > 0) {
        return sortMenu(parsedMenu);
      }
    } catch (e) {
      console.error("Failed to parse menu from localStorage on table page:", e);
    }
  }
  return sortMenu(mockMenu);
};


// --- Helper function to get next order number ---
const getNextOrderNumber = (): number => {
    const lastOrderNumberStr = sessionStorage.getItem('lastOrderNumber');
    let lastOrderNumber = lastOrderNumberStr ? parseInt(lastOrderNumberStr, 10) : 0;
    if (isNaN(lastOrderNumber) || lastOrderNumber >= 999) {
        lastOrderNumber = 0; // Reset if invalid or max reached
    }
    const nextOrderNumber = lastOrderNumber + 1;
    sessionStorage.setItem('lastOrderNumber', nextOrderNumber.toString());
    return nextOrderNumber;
};


// --- Product Management Component (simplified for menu sheet) ---
interface ProductsMenuSheetProps {
  menu: MenuItem[];
  onAddProduct: (item: MenuItem) => void;
  onClose: () => void; // Callback to close the sheet
}

const ProductsMenuSheet: React.FC<ProductsMenuSheetProps> = ({ menu, onAddProduct, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const groupedMenu = useMemo(() => {
    const groups: { [key: string]: MenuItem[] } = {};
    menu.forEach(item => {
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
  }, [menu]);

  const itemsForSelectedCategory = selectedCategory ? groupedMenu[selectedCategory] : [];

  return (
    <SheetContent side="left" className="w-full max-w-2xl flex flex-col p-0">
      <SheetHeader className="p-4 border-b">
        <SheetTitle className="text-2xl">
          {selectedCategory ? `Productos: ${selectedCategory}` : 'Menú de Productos'}
        </SheetTitle>
        {selectedCategory && (
          <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)} className="mt-2 self-start">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Categorías
          </Button>
        )}
      </SheetHeader>
      <ScrollArea className="flex-grow p-1">
        {!selectedCategory ? (
          // Category List
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
            {Object.keys(groupedMenu).map((category) => (
              <Button
                key={category}
                variant="outline"
                className="w-full h-auto py-4 text-lg justify-between items-center"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
                <ChevronRight className="h-5 w-5" />
              </Button>
            ))}
          </div>
        ) : (
          // Product List for Selected Category
          <div className="grid grid-cols-1 gap-2 p-3">
            {itemsForSelectedCategory.map((item) => (
              <Card key={item.id} className="flex items-center justify-between p-3 shadow-sm hover:shadow-md transition-shadow rounded-md">
                <div className="flex-grow">
                  <h4 className="font-semibold text-base">{item.name}</h4>
                  {item.ingredients && item.ingredients.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ({item.ingredients.join(', ')})
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono">{printUtilsFormatCurrency(item.price)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        onAddProduct(item);
                        // Optionally, you might want to close the sheet or go back to categories
                        // onClose(); // or setSelectedCategory(null);
                    }}
                    className="h-8 px-3"
                  >
                    <PlusCircle className="mr-1.5 h-4 w-4" /> Añadir
                  </Button>
                </div>
              </Card>
            ))}
             {itemsForSelectedCategory.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No hay productos en esta categoría.</p>
             )}
          </div>
        )}
      </ScrollArea>
      <div className="p-4 border-t mt-auto">
          <Button onClick={onClose} className="w-full" variant="outline">
              Cerrar Menú
          </Button>
      </div>
    </SheetContent>
  );
};


// --- Main Table Detail Page Component ---
export default function TableDetailPage() {
  const params = useParams();
  const tableIdParam = params.tableId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrderGroups, setPendingOrderGroups] = useState<PendingOrderGroup[]>([]);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [currentItemToModify, setCurrentItemToModify] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  // const [orderNumberCounter, setOrderNumberCounter] = useState(0); // Replaced by getNextOrderNumber
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedPendingOrderGroup, setSelectedPendingOrderGroup] = useState<PendingOrderGroup | null>(null);
  const [displayMenu, setDisplayMenu] = useState<MenuItem[]>([]);
  const [isDisplayMenuInitialized, setIsDisplayMenuInitialized] = useState(false);


  const isDelivery = tableIdParam === 'delivery';
  const DELIVERY_INFO_STORAGE_KEY = 'deliveryInfo';

   useEffect(() => {
    setDisplayMenu(getPersistedMenuForTablePage());
    setIsDisplayMenuInitialized(true);
  }, []);


   useEffect(() => {
    if (hasInitialized) return;

    console.log(`Initializing state for table/delivery: ${tableIdParam}`);

    const storedCurrentOrder = sessionStorage.getItem(`table-${tableIdParam}-current-order`);
    if (storedCurrentOrder) {
      try {
        const parsedCurrentOrder = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsedCurrentOrder)) {
          setCurrentOrder(parsedCurrentOrder);
        }
      } catch (e) { console.error("Error parsing current order from sessionStorage:", e); }
    }

    const storedPendingOrders = sessionStorage.getItem(`table-${tableIdParam}-pending-orders`);
    if (storedPendingOrders) {
      try {
        const parsedPendingOrders = JSON.parse(storedPendingOrders);
        if (Array.isArray(parsedPendingOrders)) {
          setPendingOrderGroups(parsedPendingOrders);
        }
      } catch (e) { console.error("Error parsing pending orders from sessionStorage:", e); }
    }

    if (isDelivery) {
      const storedDeliveryInfoForTable = sessionStorage.getItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`);
      if (storedDeliveryInfoForTable) {
        try {
          setDeliveryInfo(JSON.parse(storedDeliveryInfoForTable));
        } catch (e) { console.error("Error parsing delivery info from sessionStorage:", e); }
      } else {
        // Only open delivery dialog if no current order and no pending orders exist
        // to prevent it from opening when re-entering a delivery session with an active order.
        if (!storedCurrentOrder && !storedPendingOrders) {
             setIsDeliveryDialogOpen(true);
        }
      }
    }

    setHasInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, hasInitialized, isDelivery]);


  useEffect(() => {
    if (!hasInitialized) return;

    console.log(`Saving state for table/delivery: ${tableIdParam}`);
    sessionStorage.setItem(`table-${tableIdParam}-current-order`, JSON.stringify(currentOrder));
    sessionStorage.setItem(`table-${tableIdParam}-pending-orders`, JSON.stringify(pendingOrderGroups));
    // sessionStorage.setItem('orderNumberCounter', orderNumberCounter.toString()); // Removed, using getNextOrderNumber

    const isOccupied = currentOrder.length > 0 || pendingOrderGroups.length > 0 || (isDelivery && !!deliveryInfo);
    sessionStorage.setItem(`table-${tableIdParam}-status`, isOccupied ? 'occupied' : 'available');

    if (isDelivery && deliveryInfo) {
      sessionStorage.setItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`, JSON.stringify(deliveryInfo));
    } else if (isDelivery && !deliveryInfo) {
      sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`);
    }
  }, [currentOrder, pendingOrderGroups, deliveryInfo, tableIdParam, isDelivery, hasInitialized]);


  const deductInventory = (items: OrderItem[]) => {
    console.log("Deducting inventory for items:", items);
    const inventoryKey = 'restaurantInventory';
    const storedInventory = localStorage.getItem(inventoryKey);
    if (!storedInventory) return;

    try {
      let inventory: InventoryItem[] = JSON.parse(storedInventory);

      items.forEach(orderItem => {
        let itemsToDeduct: { name: string, quantity: number }[] = [];

        if (orderItem.category === 'Vienesas') {
            if (orderItem.name.includes('Normal')) itemsToDeduct.push({ name: 'Pan especial normal', quantity: 1 * orderItem.quantity });
            if (orderItem.name.includes('Grande')) itemsToDeduct.push({ name: 'Pan especial grande', quantity: 1 * orderItem.quantity });
            if (['Completo Normal', 'Dinamico Normal', 'Hot Dog Normal', 'Italiano Normal', 'Palta Normal', 'Tomate Normal'].includes(orderItem.name)) {
                itemsToDeduct.push({ name: 'Vienesas', quantity: 1 * orderItem.quantity });
            }
            if (['Completo Grande', 'Dinamico Grande', 'Hot Dog Grande', 'Italiano Grande', 'Palta Grande', 'Tomate Grande'].includes(orderItem.name)) {
                itemsToDeduct.push({ name: 'Vienesas', quantity: 2 * orderItem.quantity });
            }
        } else if (orderItem.category === 'As') {
            if (orderItem.name.includes('Normal')) itemsToDeduct.push({ name: 'Pan especial normal', quantity: 1 * orderItem.quantity });
            if (orderItem.name.includes('Grande')) itemsToDeduct.push({ name: 'Pan especial grande', quantity: 1 * orderItem.quantity });
        } else if (orderItem.category === 'Promo Fajitas') {
             // No specific bread deduction for fajitas unless mapped otherwise
        } else if (orderItem.category === 'Churrascos') {
            itemsToDeduct.push({ name: 'Pan de marraqueta', quantity: 1 * orderItem.quantity });
        } else if (orderItem.category === 'Promo Churrasco') {
             const quantityMultiplier = 1; // Names no longer have "2x"
             itemsToDeduct.push({ name: 'Pan de marraqueta', quantity: quantityMultiplier * orderItem.quantity });
        } else if (orderItem.category === 'Promo Mechada') {
             const quantityMultiplier = 1; // Names no longer have "2x"
             itemsToDeduct.push({ name: 'Pan de marraqueta', quantity: quantityMultiplier * orderItem.quantity });
        }
         else if (orderItem.category === 'Promo Hamburguesas') {
           if (orderItem.name.includes('Simple') || orderItem.name.includes('Italiana') || orderItem.name.includes('Big Cami') || orderItem.name.includes('Tapa Arteria')) {
              itemsToDeduct.push({ name: 'Pan de hamburguesa normal', quantity: 1 * orderItem.quantity });
           }
            if (orderItem.name.includes('Doble') || orderItem.name.includes('Super')) {
               itemsToDeduct.push({ name: 'Pan de hamburguesa grande', quantity: 1 * orderItem.quantity });
            }
        }


        if (orderItem.name.toLowerCase().includes('bebida 1.5lt')) {
          itemsToDeduct.push({ name: 'Bebida 1.5Lt', quantity: 1 * orderItem.quantity });
        } else if (orderItem.name.toLowerCase().includes('lata')) {
          itemsToDeduct.push({ name: 'Lata', quantity: 1 * orderItem.quantity });
        } else if (orderItem.name.toLowerCase().includes('cafe chico')) {
          itemsToDeduct.push({ name: 'Cafe Chico', quantity: 1 * orderItem.quantity });
        } else if (orderItem.name.toLowerCase().includes('cafe grande')) {
          itemsToDeduct.push({ name: 'Cafe Grande', quantity: 1 * orderItem.quantity });
        }


        itemsToDeduct.forEach(deduction => {
          const itemIndex = inventory.findIndex(invItem => invItem.name.toLowerCase() === deduction.name.toLowerCase());
          if (itemIndex > -1) {
            inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - deduction.quantity);
            console.log(`Deducted ${deduction.quantity} of ${deduction.name}. New stock: ${inventory[itemIndex].stock}`);
          } else {
            console.warn(`Inventory item "${deduction.name}" not found for deduction.`);
          }
        });
      });

      localStorage.setItem(inventoryKey, JSON.stringify(inventory));
      console.log("Inventory updated after deductions.");
    } catch (e) {
      console.error("Error deducting inventory:", e);
    }
  };


  const currentOrderTotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  }, [currentOrder]);

  const calculatePendingOrderTotal = (group: PendingOrderGroup | null): number => {
      if (!group) return 0;
      let total = group.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
      if (isDelivery && group.deliveryInfo && group.deliveryInfo.deliveryFee > 0) {
        total += group.deliveryInfo.deliveryFee;
      }
      return total;
  };


  const handleAddItemToOrder = (item: MenuItem) => {
    const menuItemFromPersistedSource = displayMenu.find(m => m.id === item.id);
    if (!menuItemFromPersistedSource) {
        toast({title: "Error", description: "Producto no encontrado en el menú actual.", variant: "destructive"});
        return;
    }

    if (menuItemFromPersistedSource.modifications && menuItemFromPersistedSource.modifications.length > 0) {
      setCurrentItemToModify(menuItemFromPersistedSource);
      setIsModificationDialogOpen(true);
    } else {
      const orderItem: OrderItem = {
        ...menuItemFromPersistedSource,
        orderItemId: `${menuItemFromPersistedSource.id}-${Date.now()}`,
        quantity: 1,
        basePrice: menuItemFromPersistedSource.price, // Use persisted price
        finalPrice: menuItemFromPersistedSource.price, // Use persisted price
        selectedModifications: [],
      };
      addItemToCurrentOrder(orderItem);
      toast({ title: `${orderItem.name} añadido`, description: `1 unidad añadida al pedido actual.`});
    }
     // Keep menu sheet open: setIsMenuSheetOpen(false);
  };

  const addItemToCurrentOrder = (newItem: OrderItem) => {
    setCurrentOrder(prevOrder => {
      const existingItemIndex = prevOrder.findIndex(
        (item) =>
          item.id === newItem.id &&
          isEqual(item.selectedModifications?.sort(), newItem.selectedModifications?.sort())
      );

      if (existingItemIndex > -1) {
        const updatedOrder = [...prevOrder];
        updatedOrder[existingItemIndex].quantity += 1;
        return updatedOrder;
      } else {
        return [...prevOrder, newItem];
      }
    });
  };

  const handleConfirmModification = (modifications?: string[]) => {
    if (currentItemToModify) {
      const menuItemFromPersistedSource = displayMenu.find(m => m.id === currentItemToModify.id);
      if (!menuItemFromPersistedSource) {
        toast({title: "Error", description: "Producto base no encontrado para modificación.", variant: "destructive"});
        setIsModificationDialogOpen(false);
        setCurrentItemToModify(null);
        return;
      }

      let finalPrice = menuItemFromPersistedSource.price; // Start with persisted base price
      if (modifications && menuItemFromPersistedSource.modificationPrices) {
        modifications.forEach(mod => {
          finalPrice += menuItemFromPersistedSource.modificationPrices![mod] ?? 0;
        });
      }

      const orderItem: OrderItem = {
        ...menuItemFromPersistedSource,
        orderItemId: `${menuItemFromPersistedSource.id}-${Date.now()}`,
        quantity: 1,
        selectedModifications: modifications,
        basePrice: menuItemFromPersistedSource.price,
        finalPrice: finalPrice,
      };
      addItemToCurrentOrder(orderItem);
      toast({ title: `${orderItem.name} añadido`, description: `Con modificaciones: ${modifications?.join(', ') || 'Ninguna'}`});
    }
    setIsModificationDialogOpen(false);
    setCurrentItemToModify(null);
  };

  const handleIncreaseQuantity = (orderItemId: string, inPendingGroupNumber?: number) => {
     if (inPendingGroupNumber !== undefined) {
        setPendingOrderGroups(prevGroups => prevGroups.map(group =>
            group.orderNumber === inPendingGroupNumber
            ? {
                ...group,
                items: group.items.map(item =>
                    item.orderItemId === orderItemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                )
              }
            : group
        ));
     } else {
        setCurrentOrder(prevOrder =>
          prevOrder.map(item =>
            item.orderItemId === orderItemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
     }
  };

  const handleDecreaseQuantity = (orderItemId: string, inPendingGroupNumber?: number) => {
      if (inPendingGroupNumber !== undefined) {
          setPendingOrderGroups(prevGroups => prevGroups.map(group =>
              group.orderNumber === inPendingGroupNumber
              ? {
                  ...group,
                  items: group.items.map(item =>
                      item.orderItemId === orderItemId && item.quantity > 1
                      ? { ...item, quantity: item.quantity - 1 }
                      : item
                  ).filter(item => item.quantity > 0)
                }
              : group
          ).filter(group => group.items.length > 0));
      } else {
          setCurrentOrder(prevOrder =>
            prevOrder
              .map(item =>
                item.orderItemId === orderItemId && item.quantity > 1
                  ? { ...item, quantity: item.quantity - 1 }
                  : item
              )
              .filter(item => !(item.orderItemId === orderItemId && item.quantity <= 1))
          );
      }
  };


  const handleRemoveItem = (orderItemId: string, inPendingGroupNumber?: number) => {
    if (inPendingGroupNumber !== undefined) {
        setPendingOrderGroups(prevGroups => prevGroups.map(group =>
            group.orderNumber === inPendingGroupNumber
            ? { ...group, items: group.items.filter(item => item.orderItemId !== orderItemId) }
            : group
        ).filter(group => group.items.length > 0));
    } else {
        setCurrentOrder(prevOrder => prevOrder.filter(item => item.orderItemId !== orderItemId));
    }
    toast({ title: "Artículo Eliminado", description: "El artículo ha sido eliminado del pedido.", variant: "destructive" });
  };


  const handlePrintKitchenOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Pedido Vacío", description: "Añada artículos antes de imprimir.", variant: "destructive" });
      return;
    }

    const newOrderNumber = getNextOrderNumber();
    const orderIdentifier = isDelivery ? `Delivery #${newOrderNumber}` : `Mesa ${tableIdParam} - Orden #${newOrderNumber}`;

    const kitchenReceiptHtml = formatKitchenOrderReceipt(currentOrder, orderIdentifier, newOrderNumber, deliveryInfo);
    printHtml(kitchenReceiptHtml);

    setPendingOrderGroups(prevGroups => [
      ...prevGroups,
      { orderNumber: newOrderNumber, items: currentOrder, deliveryInfo: isDelivery ? deliveryInfo : null }
    ]);
    setCurrentOrder([]);
    if (isDelivery) setDeliveryInfo(null); // Clear delivery info for this specific group in current order

    toast({ title: `Comanda #${newOrderNumber} Impresa`, description: "El pedido ha sido enviado a cocina y movido a pendientes." });
  };

 const handleFinalizeAndPay = (groupToPay: PendingOrderGroup) => {
     setSelectedPendingOrderGroup(groupToPay);
     setIsPaymentDialogOpen(true);
 };

  const handleConfirmPayment = (paymentMethod: PaymentMethod, tipAmount: number, finalAmountWithTip: number) => {
    if (!selectedPendingOrderGroup) return;

    const { items: paidItems, orderNumber, deliveryInfo: orderDeliveryInfo } = selectedPendingOrderGroup;

    const customerReceiptHtml = formatCustomerReceipt(paidItems, finalAmountWithTip, paymentMethod, tableIdParam, orderNumber, orderDeliveryInfo, tipAmount);
    printHtml(customerReceiptHtml);
    deductInventory(paidItems);

    const cashMovementsKey = 'cashMovements';
    const storedCashMovements = sessionStorage.getItem(cashMovementsKey);
    let cashMovements: CashMovement[] = storedCashMovements ? JSON.parse(storedCashMovements) : [];

    let saleBaseAmount = paidItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    let saleDeliveryFee = 0;
    if (isDelivery && orderDeliveryInfo && orderDeliveryInfo.deliveryFee > 0) {
        saleDeliveryFee = orderDeliveryInfo.deliveryFee;
    }

    const tipDescription = tipAmount > 0 ? ` (Propina: ${printUtilsFormatCurrency(tipAmount)})` : '';
    const deliveryIdentifier = isDelivery ? ` (Delivery #${orderNumber} - ${orderDeliveryInfo?.name || 'Cliente'})` : ` (Mesa ${tableIdParam} - Orden #${orderNumber})`;

    const saleMovement: CashMovement = {
      id: Date.now(),
      date: new Date(),
      category: 'Ingreso Venta',
      description: `Venta Orden #${orderNumber}${deliveryIdentifier}${tipDescription}`,
      amount: saleBaseAmount + saleDeliveryFee, // Amount is subtotal + delivery fee, tip is separate in description for now
      paymentMethod: paymentMethod,
      deliveryFee: isDelivery ? saleDeliveryFee : undefined,
    };
    cashMovements.push(saleMovement);

    sessionStorage.setItem(cashMovementsKey, JSON.stringify(cashMovements.map(m => ({...m, date: m.date instanceof Date ? m.date.toISOString() : m.date }))));


    setPendingOrderGroups(prevGroups => prevGroups.filter(group => group.orderNumber !== orderNumber));
    setSelectedPendingOrderGroup(null);
    setIsPaymentDialogOpen(false);

    toast({ title: "Pago Exitoso", description: `Pedido #${orderNumber} pagado con ${paymentMethod}. Boleta impresa.` });

    if (isDelivery && pendingOrderGroups.length === 1 && pendingOrderGroups[0].orderNumber === orderNumber) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
    }
  };


  const handleDeliveryInfoConfirm = (info: DeliveryInfo) => {
    setDeliveryInfo(info);
    setIsDeliveryDialogOpen(false);
    toast({ title: "Datos de Envío Guardados", description: `Envío para ${info.name} configurado.` });
  };

  const handleDeliveryInfoCancel = () => {
    setIsDeliveryDialogOpen(false);
    if (isDelivery && !deliveryInfo && pendingOrderGroups.length === 0 && currentOrder.length === 0) {
      toast({ title: "Envío Cancelado", description: "No se configuraron datos de envío.", variant: "destructive" });
      router.push('/tables');
    }
  };

  const handleGoBack = () => {
    const isTableOccupied = currentOrder.length > 0 || pendingOrderGroups.length > 0 || (isDelivery && !!deliveryInfo);
    sessionStorage.setItem(`table-${tableIdParam}-status`, isTableOccupied ? 'occupied' : 'available');
    router.push('/tables');
  };


  if (!hasInitialized || !isDisplayMenuInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando Mesa y Menú...</div>;
  }


  return (
    <div className="container mx-auto p-4 flex flex-col h-screen">
      <div className="flex items-center justify-between mb-6">
         <Button variant="outline" onClick={handleGoBack} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-md shadow-sm">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver a Mesas
         </Button>
        <h1 className="text-3xl font-bold text-center flex-grow">
          {isDelivery ? `Gestión de Pedido Delivery` : `Gestión de Mesa ${tableIdParam}`}
           {isDelivery && deliveryInfo && (
             <Button variant="ghost" size="icon" onClick={() => setIsDeliveryDialogOpen(true)} className="ml-2 h-7 w-7">
                 <Edit className="h-4 w-4 text-muted-foreground"/>
                 <span className="sr-only">Editar Datos Envío</span>
             </Button>
           )}
        </h1>
         <div style={{ width: '150px' }}></div>
      </div>

        {isDelivery && deliveryInfo && (
            <Card className="mb-6 bg-muted/50">
                <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-base flex items-center">
                        <User className="mr-2 h-4 w-4 text-primary" /> Cliente: {deliveryInfo.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xs px-4 pb-3 space-y-0.5">
                    <p className="flex items-center"><Home className="mr-2 h-3 w-3 text-muted-foreground" /> {deliveryInfo.address}</p>
                    <p className="flex items-center"><Phone className="mr-2 h-3 w-3 text-muted-foreground" /> {deliveryInfo.phone}</p>
                    <p className="flex items-center"><DollarSign className="mr-2 h-3 w-3 text-muted-foreground" /> Costo Envío: {printUtilsFormatCurrency(deliveryInfo.deliveryFee)}</p>
                </CardContent>
            </Card>
        )}


        <div className="flex justify-center mb-6">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-8 py-6 text-lg">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <ProductsMenuSheet menu={displayMenu} onAddProduct={handleAddItemToOrder} onClose={() => setIsMenuSheetOpen(false)} />
            </Sheet>
        </div>


      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        <Card className="flex flex-col max-h-[calc(100vh-350px)]"> {/* Adjusted max-height */}
          <CardHeader>
            <CardTitle className="text-xl font-bold">Pedido Actual</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="space-y-3 p-4">
              {currentOrder.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay artículos en el pedido actual.</p>
              ) : (
                currentOrder.map(item => (
                  <div key={item.orderItemId} className="flex items-center justify-between p-3 bg-background rounded-md shadow-sm">
                    <div className="font-bold">
                      <p className="text-sm font-bold">{item.name}</p>
                       <p className="text-xs text-muted-foreground font-bold">{item.category}</p> {/* Display category */}
                      {item.selectedModifications && item.selectedModifications.length > 0 && (
                        <p className="text-xs text-muted-foreground font-bold">
                          ({item.selectedModifications.join(', ')})
                        </p>
                      )}
                       {item.ingredients && item.ingredients.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic font-bold">
                                Ing: {item.ingredients.join(', ')}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 font-bold">
                      <Button variant="ghost" size="icon" onClick={() => handleDecreaseQuantity(item.orderItemId)} className="h-7 w-7">
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="font-mono text-sm w-6 text-center font-bold">{item.quantity}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleIncreaseQuantity(item.orderItemId)} className="h-7 w-7">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.orderItemId)} className="h-7 w-7 text-destructive">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </ScrollArea>
          {currentOrder.length > 0 && <Separator />}
          <CardFooter className="p-4 flex flex-col items-stretch gap-2 mt-auto">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="font-bold">Total Actual:</span>
              <span className="font-bold">{printUtilsFormatCurrency(currentOrderTotal)}</span>
            </div>
            <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>


        <Card className="flex flex-col max-h-[calc(100vh-350px)]"> {/* Adjusted max-height */}
            <CardHeader>
                <CardTitle className="text-xl font-bold">Pedidos Pendientes de Pago</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-grow">
                <CardContent className="space-y-4 p-4">
                {pendingOrderGroups.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay pedidos pendientes de pago.</p>
                ) : (
                    pendingOrderGroups.map(group => (
                    <Card key={group.orderNumber} className="bg-muted/30 shadow-md">
                        <CardHeader className="py-2 px-3 border-b">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-semibold">
                                    Orden #{String(group.orderNumber).padStart(3, '0')}
                                    {group.deliveryInfo && <span className="text-xs font-normal text-muted-foreground ml-2">({group.deliveryInfo.name})</span>}
                                </CardTitle>
                                <Button size="sm" onClick={() => handleFinalizeAndPay(group)} className="h-7 px-2.5">
                                    <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Pagar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 text-sm space-y-1.5 font-bold">
                        {group.items.map(item => (
                            <div key={item.orderItemId} className="flex justify-between items-center">
                            <div className="font-bold">
                                <span className="font-bold">{item.quantity}x {item.name}</span>
                                {item.selectedModifications && item.selectedModifications.length > 0 && (
                                <span className="text-xs text-muted-foreground ml-1 font-bold">({item.selectedModifications.join(', ')})</span>
                                )}
                                {item.ingredients && item.ingredients.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-0.5 italic font-bold">
                                        Ing: {item.ingredients.join(', ')}
                                    </p>
                                )}
                            </div>
                            <span className="font-mono font-bold">{printUtilsFormatCurrency(item.finalPrice * item.quantity)}</span>
                            </div>
                        ))}
                        {isDelivery && group.deliveryInfo && group.deliveryInfo.deliveryFee > 0 && (
                             <div className="flex justify-between items-center pt-1 border-t border-dashed mt-1.5 font-bold">
                                 <span className="font-bold">Costo Envío:</span>
                                 <span className="font-mono font-bold">{printUtilsFormatCurrency(group.deliveryInfo.deliveryFee)}</span>
                             </div>
                         )}
                        <div className="flex justify-between items-center text-base font-bold pt-1.5 border-t">
                            <span className="font-bold">Total Pedido:</span>
                            <span className="font-bold">{printUtilsFormatCurrency(calculatePendingOrderTotal(group))}</span>
                        </div>
                        </CardContent>
                    </Card>
                    ))
                )}
                </CardContent>
            </ScrollArea>
        </Card>

      </div>

       <ModificationDialog
         isOpen={isModificationDialogOpen}
         onOpenChange={setIsModificationDialogOpen}
         item={currentItemToModify}
         onConfirm={handleConfirmModification}
         onCancel={() => setIsModificationDialogOpen(false)}
       />

        {selectedPendingOrderGroup && (
            <PaymentDialog
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                totalAmount={calculatePendingOrderTotal(selectedPendingOrderGroup)}
                onConfirm={handleConfirmPayment}
            />
        )}


       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo}
               onConfirm={handleDeliveryInfoConfirm}
               onCancel={handleDeliveryInfoCancel}
           />
       )}
    </div>
  );
}

