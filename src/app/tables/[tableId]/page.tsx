

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogClose, 
  DialogContent as ShadDialogContent, 
  DialogDescription as ShadDialogDescription,
  DialogFooter as ShadDialogFooter,
  DialogHeader as ShadDialogHeader,
  DialogTitle as ShadDialogTitle,
  DialogTrigger as ShadDialogTrigger,
} from '@/components/ui/dialog';
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
import DeliveryDialog from '@/components/app/delivery-dialog'; 
import { formatKitchenOrderReceipt, formatCustomerReceipt, printHtml, formatCurrency as printUtilsFormatCurrency } from '@/lib/printUtils';
import type { InventoryItem } from '@/app/inventory/page';

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
  category: string;
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
const INVENTORY_STORAGE_KEY = 'restaurantInventory';
const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';
const PENDING_ORDERS_STORAGE_KEY_PREFIX = 'table-';
const DELIVERY_INFO_STORAGE_KEY_PREFIX = 'deliveryInfo-';
const ORDER_NUMBER_STORAGE_KEY = 'lastOrderNumber';


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
    // --- Completos As ---
    {
      id: 10,
      name: 'Italiano Normal',
      price: 5500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Palta', 'Tomate', 'Carne As']
    },
    {
      id: 11,
      name: 'Italiano Grande',
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Palta', 'Tomate', 'Carne As']
    },
    {
      id: 12,
      name: 'Completo Normal',
      price: 6500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana', 'Carne As']
    },
    { id: 36, name: 'Completo Grande', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Chucrut', 'Americana', 'Carne As'] },
    { id: 37, name: 'Palta Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Carne As'] },
    { id: 38, name: 'Palta Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Carne As'] },
    { id: 39, name: 'Tomate Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Carne As'] },
    { id: 40, name: 'Tomate Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Carne As'] },
    { id: 41, name: 'Queso Normal', price: 6000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Carne As'] },
    { id: 42, name: 'Queso Grande', price: 6500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Carne As'] },
    { id: 43, name: 'Solo Carne Normal', price: 5000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne As'] },
    { id: 44, name: 'Solo Carne Grande', price: 5500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne As'] },
    {
        id: 45,
        name: 'Dinamico Normal',
        price: 6800,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana', 'Carne As']
    },
    {
        id: 46,
        name: 'Dinamico Grande',
        price: 7300,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana', 'Carne As']
    },
    {
        id: 47,
        name: 'Chacarero Normal',
        price: 6700,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño', 'Carne As']
    },
    {
        id: 48,
        name: 'Chacarero Grande',
        price: 7200,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño', 'Carne As']
    },
    {
        id: 49,
        name: 'Napolitano Normal',
        price: 6900,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin queso', 'sin tomate', 'sin oregano', 'sin aceituna'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna', 'Carne As']
    },
    {
        id: 50,
        name: 'Napolitano Grande',
        price: 7400,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin queso', 'sin tomate', 'sin oregano', 'sin aceituna'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna', 'Carne As']
    },
    { id: 51, name: 'Queso Champiñon Normal', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Sin Queso', 'Sin Champiñon', 'Sin Tocino'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino', 'Carne As'] },
    { id: 52, name: 'Queso Champiñon Grande', price: 7500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Sin Queso', 'Sin Champiñon', 'Sin Tocino'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino', 'Carne As'] },
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
  'Completos Vienesas',
  'Completos As',
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


const getPersistedMenu = (): MenuItem[] => {
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
      console.error("Failed to parse menu from localStorage:", e);
    }
  }
  const initialSortedMenu = sortMenu(mockMenu);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(initialSortedMenu));
    } catch (e) {
      console.error("Failed to save initial menu to localStorage:", e);
    }
  }
  return initialSortedMenu;
};


// Helper function to get the next order number
const getNextOrderNumber = (): number => {
  if (typeof window === 'undefined') return 1; // SSR fallback

  const lastOrderNumberStr = sessionStorage.getItem(ORDER_NUMBER_STORAGE_KEY);
  let lastOrderNumber = lastOrderNumberStr ? parseInt(lastOrderNumberStr, 10) : 0;
  if (isNaN(lastOrderNumber) || lastOrderNumber >= 999) {
    lastOrderNumber = 0; // Reset if invalid or max reached
  }
  const nextOrderNumber = lastOrderNumber + 1;
  sessionStorage.setItem(ORDER_NUMBER_STORAGE_KEY, nextOrderNumber.toString());
  return nextOrderNumber;
};


// Main component for the table detail page
export function TableDetailPage() {
  const params = useParams();
  const tableIdParam = params.tableId as string;
  const router = useRouter();
  const { toast } = useToast();

  const isDelivery = tableIdParam === 'delivery';
  const decodedTableIdParam = useMemo(() => {
    try {
      return decodeURIComponent(tableIdParam);
    } catch (e) {
      console.error("Error decoding tableIdParam:", e);
      return tableIdParam; // Fallback to original if decoding fails
    }
  }, [tableIdParam]);


  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrderGroups, setPendingOrderGroups] = useState<PendingOrderGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [itemToModify, setItemToModify] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [orderToPay, setOrderToPay] = useState<PendingOrderGroup | null>(null);

  // --- Effect for Initial Load and Delivery Dialog ---
  useEffect(() => {
    if (isInitialized) return;

    console.log(`Initializing page for table: ${tableIdParam}`);
    setMenu(getPersistedMenu());

    // Load current order for the table
    const storedCurrentOrder = sessionStorage.getItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-currentOrder`);
    if (storedCurrentOrder) {
      try {
        const parsedCurrentOrder = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsedCurrentOrder)) {
          setCurrentOrder(parsedCurrentOrder);
          console.log(`Loaded current order for table ${tableIdParam}:`, parsedCurrentOrder);
        }
      } catch (e) {
        console.error("Error parsing current order from sessionStorage:", e);
      }
    }

    // Load pending order groups
    const storedPendingOrders = sessionStorage.getItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-pendingOrders`);
    if (storedPendingOrders) {
        try {
            const parsedData: PendingOrderStorageData | PendingOrderGroup[] = JSON.parse(storedPendingOrders);
            // Handle both old array format and new object format for backward compatibility
            if (Array.isArray(parsedData)) { // Old format
                setPendingOrderGroups(parsedData);
                console.log(`Loaded PENDING orders (old format) for table ${tableIdParam}:`, parsedData);
            } else if (parsedData && Array.isArray(parsedData.groups)) { // New format
                setPendingOrderGroups(parsedData.groups);
                console.log(`Loaded PENDING orders (new format) for table ${tableIdParam}:`, parsedData.groups);
            }
        } catch (e) {
            console.error("Error parsing pending orders from sessionStorage:", e);
        }
    }


    // Load delivery info if it's the delivery table
    if (isDelivery) {
      const storedDeliveryInfo = sessionStorage.getItem(`${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`);
      if (storedDeliveryInfo) {
        try {
          const parsedInfo = JSON.parse(storedDeliveryInfo) as DeliveryInfo;
          setDeliveryInfo(parsedInfo);
          console.log("Loaded delivery info:", parsedInfo);
        } catch (e) {
          console.error("Error parsing delivery info:", e);
        }
      }
      // Open delivery dialog if no info is present for a new delivery order
      if (!storedDeliveryInfo && pendingOrderGroups.length === 0 && currentOrder.length === 0) {
        console.log("Delivery table: No delivery info, opening dialog.");
        setIsDeliveryDialogOpen(true);
      }
    }
    setIsInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, isInitialized, isDelivery]);


  // --- Effect to save state changes to sessionStorage ---
  useEffect(() => {
    if (!isInitialized) return; // Don't save during initial load

    console.log(`State changed for table ${tableIdParam}, saving to sessionStorage.`);
    sessionStorage.setItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-currentOrder`, JSON.stringify(currentOrder));

    const dataToStore: PendingOrderStorageData = { groups: pendingOrderGroups };
    sessionStorage.setItem(`${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-pendingOrders`, JSON.stringify(dataToStore));


    if (isDelivery && deliveryInfo) {
      sessionStorage.setItem(`${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`, JSON.stringify(deliveryInfo));
    }
    // Explicit status updates are handled in handlePrintKitchenOrder and handleFinalizeAndPay

  }, [currentOrder, pendingOrderGroups, deliveryInfo, tableIdParam, isInitialized, isDelivery]);


  const handleGoBack = () => {
    router.push('/tables');
  };

  // Deduct inventory based on item name and quantity
  const deductInventory = (itemName: string, quantity: number, menuItemCategory?: string) => {
    console.log(`Attempting to deduct ${quantity} of ${itemName} (Category: ${menuItemCategory}) from inventory.`);
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (storedInventory) {
      let inventory: InventoryItem[] = JSON.parse(storedInventory);
      let itemFoundAndDeducted = false;

      const lowerItemName = itemName.toLowerCase();
      const lowerCategory = menuItemCategory?.toLowerCase();

      if (lowerCategory === 'completos vienesas') {
        if (lowerItemName.includes('normal')) {
          inventory = updateStock(inventory, 'Pan especial normal', quantity);
          inventory = updateStock(inventory, 'Vienesas', quantity); // Deduct 1 vienesa for normal
          itemFoundAndDeducted = true;
        } else if (lowerItemName.includes('grande')) {
          inventory = updateStock(inventory, 'Pan especial grande', quantity);
           inventory = updateStock(inventory, 'Vienesas', quantity * 2); // Deduct 2 vienesas for grande
          itemFoundAndDeducted = true;
        }
      }
      else if (lowerCategory === 'completos as') {
         if (lowerItemName.includes('normal')) {
           inventory = updateStock(inventory, 'Pan especial normal', quantity);
           // Note: Meat for 'As' is not deducted here, assumed to be managed separately or not tracked granularly
           itemFoundAndDeducted = true;
         } else if (lowerItemName.includes('grande')) {
           inventory = updateStock(inventory, 'Pan especial grande', quantity);
           // Note: Meat for 'As' is not deducted here
           itemFoundAndDeducted = true;
         }
      }
       else if (lowerCategory === 'promo fajitas') {
            if (['4 ingredientes', '6 ingredientes', 'americana', 'brasileño', 'chacarero', 'golosasa', 'italiana', 'primavera'].includes(lowerItemName)) {
                inventory = updateStock(inventory, 'Fajita', quantity);
                inventory = updateStock(inventory, 'Lata', quantity); // Deduct 1 can per promo fajita item
                itemFoundAndDeducted = true;
            }
       }
       else if (lowerCategory === 'churrascos') {
            inventory = updateStock(inventory, 'Pan de marraqueta', quantity);
            itemFoundAndDeducted = true;
       }
        else if (lowerCategory === 'promo churrasco') {
             // For "2x" promos, deduct 2 buns, but this logic might need adjustment if item names don't imply "2x"
            inventory = updateStock(inventory, 'Pan de marraqueta', quantity * (lowerItemName.startsWith("2x") ? 2 : 1));
            itemFoundAndDeducted = true;
        }
        else if (lowerCategory === 'promo mechada') {
            inventory = updateStock(inventory, 'Pan de marraqueta', quantity * (lowerItemName.startsWith("2x") ? 2 : 1));
            itemFoundAndDeducted = true;
        }
         else if (lowerCategory === 'promo hamburguesas') {
              if (lowerItemName === 'big cami') {
                  inventory = updateStock(inventory, 'Pan de hamburguesa normal', quantity);
                  inventory = updateStock(inventory, 'Lata', quantity);
                  itemFoundAndDeducted = true;
              } else if (lowerItemName === 'doble') {
                  inventory = updateStock(inventory, 'Pan de hamburguesa normal', quantity * 2); // 2 buns for "Doble"
                  inventory = updateStock(inventory, 'Lata', quantity);
                  itemFoundAndDeducted = true;
              } else if (lowerItemName === 'doble italiana') {
                  inventory = updateStock(inventory, 'Pan de hamburguesa normal', quantity * 2);
                  inventory = updateStock(inventory, 'Lata', quantity);
                  itemFoundAndDeducted = true;
              } else if (lowerItemName === 'italiana') {
                  inventory = updateStock(inventory, 'Pan de hamburguesa normal', quantity);
                  inventory = updateStock(inventory, 'Lata', quantity);
                  itemFoundAndDeducted = true;
              } else if (lowerItemName === 'simple') {
                  inventory = updateStock(inventory, 'Pan de hamburguesa normal', quantity);
                  inventory = updateStock(inventory, 'Lata', quantity);
                  itemFoundAndDeducted = true;
              } else if (lowerItemName === 'super big cami') {
                  inventory = updateStock(inventory, 'Pan de hamburguesa normal', quantity * 2);
                  inventory = updateStock(inventory, 'Lata', quantity);
                  itemFoundAndDeducted = true;
              } else if (lowerItemName === 'super tapa arteria') {
                  inventory = updateStock(inventory, 'Pan de hamburguesa normal', quantity * 2); // 2 buns for "Super Tapa Arteria"
                  inventory = updateStock(inventory, 'Lata', quantity);
                  itemFoundAndDeducted = true;
              }
         }
        // Bebidas
        else if (lowerCategory === 'bebidas') {
            if (lowerItemName === 'bebida 1.5lt') {
                inventory = updateStock(inventory, 'Bebida 1.5Lt', quantity);
                itemFoundAndDeducted = true;
            } else if (lowerItemName === 'lata') {
                inventory = updateStock(inventory, 'Lata', quantity);
                itemFoundAndDeducted = true;
            } else if (lowerItemName === 'cafe chico') {
                inventory = updateStock(inventory, 'Cafe Chico', quantity);
                itemFoundAndDeducted = true;
            } else if (lowerItemName === 'cafe grande') {
                inventory = updateStock(inventory, 'Cafe Grande', quantity);
                itemFoundAndDeducted = true;
            }
        }


      if (!itemFoundAndDeducted) {
        const inventoryItem = inventory.find(invItem => invItem.name.toLowerCase() === itemName.toLowerCase());
        if (inventoryItem) {
          inventory = inventory.map(invItem =>
            invItem.id === inventoryItem.id
              ? { ...invItem, stock: Math.max(0, invItem.stock - quantity) }
              : invItem
          );
          itemFoundAndDeducted = true;
        }
      }

      if (itemFoundAndDeducted) {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
        console.log(`Inventory updated after deducting ${itemName}.`);
      } else {
        console.warn(`Inventory item "${itemName}" not found for deduction or specific logic not implemented.`);
      }
    }
  };

  // Helper function to update stock for a specific inventory item
  const updateStock = (inventory: InventoryItem[], itemName: string, quantityToDeduct: number): InventoryItem[] => {
    const itemIndex = inventory.findIndex(invItem => invItem.name.toLowerCase() === itemName.toLowerCase());
    if (itemIndex > -1) {
      inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - quantityToDeduct);
      console.log(`Deducted ${quantityToDeduct} of ${itemName}. New stock: ${inventory[itemIndex].stock}`);
    } else {
      console.warn(`Inventory item "${itemName}" not found for stock update.`);
    }
    return inventory;
  };


  const addItemToOrder = (item: MenuItem, modifications?: string[]) => {
    const orderItemId = `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    let finalPrice = item.price;
    if (modifications && item.modificationPrices) {
      modifications.forEach(mod => {
        finalPrice += item.modificationPrices![mod] ?? 0;
      });
    }

    const newItem: OrderItem = {
      ...item,
      orderItemId: orderItemId,
      quantity: 1,
      selectedModifications: modifications,
      basePrice: item.price,
      finalPrice: finalPrice,
      ingredients: item.ingredients,
      category: item.category,
    };
    setCurrentOrder(prevOrder => [...prevOrder, newItem]);
    setIsMenuSheetOpen(false);
    toast({ title: `${item.name} añadido`, description: "Producto agregado al pedido actual."});
  };

  const increaseQuantity = (orderItemId: string) => {
    setCurrentOrder(prevOrder =>
      prevOrder.map(item =>
        item.orderItemId === orderItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (orderItemId: string) => {
    setCurrentOrder(prevOrder =>
      prevOrder
        .map(item =>
          item.orderItemId === orderItemId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
        )
    );
  };

  const removeItem = (orderItemId: string) => {
    setCurrentOrder(prevOrder => prevOrder.filter(item => item.orderItemId !== orderItemId));
  };




  const handlePrintKitchenOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Pedido Vacío", description: "No hay artículos en el pedido actual para enviar a cocina.", variant: "destructive" });
      return;
    }

    const newOrderNumber = getNextOrderNumber();

    const itemsWithOrderNumber = currentOrder.map(item => ({
        ...item,
        orderNumber: newOrderNumber
    }));


    const newPendingGroup: PendingOrderGroup = {
        orderNumber: newOrderNumber,
        items: itemsWithOrderNumber,
        deliveryInfo: isDelivery ? deliveryInfo : null
    };

    setPendingOrderGroups(prevGroups => [...prevGroups, newPendingGroup]);


    const kitchenReceiptHtml = formatKitchenOrderReceipt(
        itemsWithOrderNumber,
        isDelivery ? `Delivery #${newOrderNumber}` : `Mesa ${decodedTableIdParam} / Orden #${newOrderNumber}`,
        newOrderNumber,
        isDelivery ? deliveryInfo : null
    );
    printHtml(kitchenReceiptHtml);

    setCurrentOrder([]);
    toast({ title: "Comanda Impresa", description: `Pedido #${newOrderNumber} enviado a cocina y añadido a pendientes.` });

    // Update table status to occupied
    sessionStorage.setItem(`table-${tableIdParam}-status`, 'occupied');
    console.log(`Table ${tableIdParam} status updated to: occupied after printing kitchen order.`);
  };


  const handleOpenPaymentDialog = (group: PendingOrderGroup) => {
    setOrderToPay(group);
    setIsPaymentDialogOpen(true);
  };


  const handleFinalizeAndPay = (
      paymentMethod: PaymentMethod,
      tipAmount: number,
      finalAmountWithTip: number
    ) => {
        if (!orderToPay) {
            toast({ title: "Error", description: "No se ha seleccionado un pedido para pagar.", variant: "destructive" });
            setIsPaymentDialogOpen(false);
            return;
        }

        const orderToFinalize = orderToPay;


    let orderSubtotal = orderToFinalize.items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

    let deliveryFeeForThisOrder = 0;
    if (orderToFinalize.deliveryInfo && orderToFinalize.deliveryInfo.deliveryFee > 0) {
        deliveryFeeForThisOrder = orderToFinalize.deliveryInfo.deliveryFee;
        orderSubtotal += deliveryFeeForThisOrder; // Add delivery fee to subtotal for cash movement
    }

    const saleMovement: CashMovement = {
      id: Date.now(),
      date: new Date(),
      category: 'Ingreso Venta',
      description: isDelivery
        ? `Venta Delivery #${orderToFinalize.orderNumber} a ${orderToFinalize.deliveryInfo?.name || 'Cliente'}` + (tipAmount > 0 ? ` (Propina: ${printUtilsFormatCurrency(tipAmount)})` : '')
        : `Venta Mesa ${decodedTableIdParam} / Orden #${orderToFinalize.orderNumber}` + (tipAmount > 0 ? ` (Propina: ${printUtilsFormatCurrency(tipAmount)})` : ''),
      amount: orderSubtotal, // This is the subtotal + delivery fee (if any), before tip for this specific movement
      paymentMethod: paymentMethod,
      deliveryFee: deliveryFeeForThisOrder > 0 ? deliveryFeeForThisOrder : undefined,
    };

    const storedCashMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    let cashMovements: CashMovement[] = storedCashMovements ? JSON.parse(storedCashMovements) : [];
    cashMovements.push(saleMovement);
    sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(cashMovements));

    orderToFinalize.items.forEach(item => {
      deductInventory(item.name, item.quantity, item.category);
    });

    const customerReceiptHtml = formatCustomerReceipt(
        orderToFinalize.items,
        finalAmountWithTip, // This is the grand total including tip
        paymentMethod,
        decodedTableIdParam,
        orderToFinalize.orderNumber,
        orderToFinalize.deliveryInfo,
        tipAmount
    );
    printHtml(customerReceiptHtml);

    const updatedPendingOrderGroups = pendingOrderGroups.filter(group => group.orderNumber !== orderToFinalize.orderNumber);
    setPendingOrderGroups(updatedPendingOrderGroups);


    toast({ title: "Pago Realizado", description: `Pago de ${printUtilsFormatCurrency(finalAmountWithTip)} para Orden #${orderToFinalize.orderNumber} registrado. Boleta impresa.` });
    setIsPaymentDialogOpen(false);
    setOrderToPay(null);


    // Check if the table should become available
    if (updatedPendingOrderGroups.length === 0 && currentOrder.length === 0) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
        console.log(`Table ${tableIdParam} status updated to: available after final payment.`);
        if (isDelivery) {
            setDeliveryInfo(null);
            sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`);
            console.log("Last delivery order paid. Cleared delivery info and set table to available.");
        }
    } else {
        // If there are still pending orders or items in current order, keep it occupied
        sessionStorage.setItem(`table-${tableIdParam}-status`, 'occupied');
        console.log(`Table ${tableIdParam} remains occupied. Pending groups: ${updatedPendingOrderGroups.length}, Current order items: ${currentOrder.length}`);
    }
  };


  const currentOrderTotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  }, [currentOrder]);


  const filteredMenu = useMemo(() => {
    let result = menu;
    if (selectedCategory) {
      result = result.filter(item => item.category === selectedCategory);
    }
    if (searchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [menu, selectedCategory, searchTerm]);

  const groupedMenu = useMemo(() => {
    const groups: { [key: string]: MenuItem[] } = {};
    filteredMenu.forEach(item => {
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
  }, [filteredMenu]);

   const handleConfirmDeliveryInfo = (info: DeliveryInfo) => {
     setDeliveryInfo(info);
     setIsDeliveryDialogOpen(false);
     toast({ title: "Datos de Envío Guardados", description: `Envío para ${info.name} configurado.` });
   };

   const handleCancelDeliveryInfo = () => {
       if (currentOrder.length === 0 && pendingOrderGroups.length === 0 && !deliveryInfo) {
           toast({ title: "Envío Cancelado", description: "Se requieren datos de envío para continuar.", variant: "destructive" });
           router.push('/tables');
       } else {
           setIsDeliveryDialogOpen(false);
       }
   };

   const handleRemovePendingOrderGroup = (orderNumberToRemove: number) => {
       setPendingOrderGroups(prevGroups =>
           prevGroups.filter(group => group.orderNumber !== orderNumberToRemove)
       );
       toast({ title: "Pedido Pendiente Eliminado", description: `El pedido #${orderNumberToRemove} ha sido eliminado de los pendientes.`, variant: "destructive"});
   };



  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando Mesa...</div>;
  }


  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      <header className="flex justify-between items-center pb-4 border-b">
        <Button variant="outline" onClick={handleGoBack} className="hover:bg-secondary/90">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver a Mesas
        </Button>
        <h1 className="text-3xl font-bold">
            {isDelivery ? `Pedido Delivery ${deliveryInfo ? `- ${deliveryInfo.name}` : ''}` : `Mesa ${decodedTableIdParam}`}
        </h1>
        {isDelivery && (
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Editar Datos Envío
            </Button>
        )}
        <div /> {/* Spacer */}
      </header>

      <div className="flex justify-center mb-2">
          <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
              <SheetTrigger asChild>
                   <Button size="lg" className="px-8 py-6 text-lg">
                      <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-full p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b">
                      <SheetTitle className="text-2xl">Menú</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                     <Input
                        type="text"
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-4 w-full" />
                  </div>
                  <ScrollArea className="flex-grow px-4">
                    <Accordion type="multiple" defaultValue={orderedCategories} className="w-full">
                      {Object.entries(groupedMenu).map(([category, items]) => (
                        <AccordionItem value={category} key={category} className="border-b-0 mb-2 last:mb-0">
                          <AccordionTrigger className="text-xl font-semibold hover:bg-muted/50 px-4 py-3 rounded-md hover:no-underline bg-card border data-[state=open]:rounded-b-none">
                            {category}
                          </AccordionTrigger>
                          <AccordionContent className="pt-0 bg-card border border-t-0 rounded-b-md">
                            <div className="grid grid-cols-1 divide-y">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-center p-3 hover:bg-muted/30 cursor-pointer"
                                  onClick={() => {
                                    if (item.modifications && item.modifications.length > 0) {
                                      setItemToModify(item);
                                      setIsModificationDialogOpen(true);
                                    } else {
                                      addItemToOrder(item);
                                    }
                                  }}
                                >
                                  <div>
                                    <p className="font-semibold">{item.name}</p>
                                    {item.ingredients && item.ingredients.length > 0 && (
                                        <p className="text-xs text-muted-foreground italic">
                                            ({item.ingredients.join(', ')})
                                        </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm">{printUtilsFormatCurrency(item.price)}</span>
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                  <SheetFooter className="p-4 border-t">
                    <SheetClose asChild>
                        <Button>Confirmar</Button>
                    </SheetClose>
                </SheetFooter>
              </SheetContent>
          </Sheet>
      </div>


      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        <Card className="flex flex-col overflow-hidden h-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Pedido Actual</CardTitle>
            <CardDescription>Artículos para la comanda actual.</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="pt-0 pr-2">
              {currentOrder.length === 0 ? (
                <p className="text-muted-foreground">No hay artículos en el pedido actual.</p>
              ) : (
                <ul className="space-y-3">
                  {currentOrder.map((item) => (
                    <li key={item.orderItemId} className="p-3 border rounded-md shadow-sm bg-background">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-base">
                            {item.name} <span className="text-xs text-muted-foreground font-normal">({item.category})</span>
                          </p>
                          {item.selectedModifications && item.selectedModifications.length > 0 && (
                            <p className="text-xs text-muted-foreground italic font-bold">
                              ({item.selectedModifications.join(', ')})
                            </p>
                          )}
                           {item.ingredients && item.ingredients.length > 0 && (
                            <p className="text-xs text-muted-foreground italic font-bold">
                                Ingredientes: {item.ingredients.join(', ')}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.orderItemId)} className="h-7 w-7 text-destructive hover:text-destructive/90">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-start gap-3 mt-2">
                        <Button variant="outline" size="icon" onClick={() => decreaseQuantity(item.orderItemId)} className="h-7 w-7">
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" onClick={() => increaseQuantity(item.orderItemId)} className="h-7 w-7">
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </ScrollArea>
          <Separator />
          <CardFooter className="p-4 flex flex-col items-stretch gap-3">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="font-bold">Total Actual:</span>
              <span className="font-bold">{printUtilsFormatCurrency(currentOrderTotal)}</span>
            </div>
            <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col overflow-hidden h-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Pedidos Pendientes de Pago</CardTitle>
            <CardDescription>Comandas enviadas a cocina, listas para cobrar.</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="pt-0 pr-2">
              {pendingOrderGroups.length === 0 ? (
                <p className="text-muted-foreground">No hay pedidos pendientes de pago.</p>
              ) : (
                <Accordion type="multiple" className="w-full space-y-3">
                  {pendingOrderGroups.map((group) => {
                    const groupSubtotal = group.items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
                    const groupDeliveryFee = group.deliveryInfo?.deliveryFee ?? 0;
                    const groupTotalWithDelivery = groupSubtotal + groupDeliveryFee;

                    return (
                      <AccordionItem value={`order-${group.orderNumber}`} key={group.orderNumber} className="border rounded-md shadow-sm bg-background">
                        <AccordionTrigger className="p-3 text-base font-semibold hover:no-underline hover:bg-muted/30 rounded-t-md data-[state=open]:rounded-b-none">
                          <div className="flex justify-between w-full items-center">
                            <span className="font-bold">Orden #{String(group.orderNumber).padStart(3, '0')} - Total: {printUtilsFormatCurrency(groupTotalWithDelivery)}</span>
                             {group.deliveryInfo && <Badge variant="outline" className="font-bold">Envío: {group.deliveryInfo.name}</Badge>}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-3 border-t">
                          <ul className="space-y-2 mb-3">
                            {group.items.map((item) => (
                              <li key={item.orderItemId} className="text-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold">
                                      {item.quantity}x {item.name}
                                    </p>
                                    {item.selectedModifications && item.selectedModifications.length > 0 && (
                                      <p className="text-xs text-muted-foreground italic font-bold">
                                        ({item.selectedModifications.join(', ')})
                                      </p>
                                    )}
                                  </div>
                                  <span className="font-mono font-bold">{printUtilsFormatCurrency(item.finalPrice * item.quantity)}</span>
                                </div>
                              </li>
                            ))}
                            {group.deliveryInfo && group.deliveryInfo.deliveryFee > 0 && (
                                <li className="text-sm mt-2 pt-2 border-t border-dashed">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold">Costo Envío:</p>
                                        <span className="font-mono font-bold">{printUtilsFormatCurrency(group.deliveryInfo.deliveryFee)}</span>
                                    </div>
                                </li>
                            )}
                          </ul>
                          <div className="flex gap-2 mt-2">
                            <Button onClick={() => handleOpenPaymentDialog(group)} className="flex-grow">
                              <CreditCard className="mr-2 h-4 w-4" /> Cobrar Pedido
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemovePendingOrderGroup(group.orderNumber)} className="text-destructive hover:text-destructive/90">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar Pedido Pendiente</span>
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </div>


      {itemToModify && (
        <ModificationDialog
          isOpen={isModificationDialogOpen}
          onOpenChange={setIsModificationDialogOpen}
          item={itemToModify}
          onConfirm={(selectedMods) => {
            if (itemToModify) {
              addItemToOrder(itemToModify, selectedMods);
            }
            setIsModificationDialogOpen(false);
            setItemToModify(null);
          }}
          onCancel={() => {
            setIsModificationDialogOpen(false);
            setItemToModify(null);
          }}
        />
      )}

        {orderToPay && (
            <PaymentDialog
                isOpen={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
                totalAmount={orderToPay.items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0) + (orderToPay.deliveryInfo?.deliveryFee ?? 0)}
                onConfirm={(method, tip, finalTotal) => {
                    handleFinalizeAndPay(method, tip, finalTotal);
                }}
            />
        )}


       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo}
               onConfirm={handleConfirmDeliveryInfo}
               onCancel={handleCancelDeliveryInfo}
           />
       )}
    </div>
  );
}

export default TableDetailPage;

  







