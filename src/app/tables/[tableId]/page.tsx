
'use client';

import * as React from 'react';
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useParams, useRouter }from 'next/navigation';
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
  Dialog as ShadDialog,
  DialogClose as ShadDialogClose,
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

const promoFajitasBaseModifications = [
    'Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso',
    'Pollo', 'Lomito', 'Vacuno', 'Lechuga', 
    'tocino', 'palta', 'queso cheddar', 'cebolla', 'tomate', 'poroto verde',
    'queso amarillo', 'aceituna', 'choclo', 'cebolla caramelizada', 'champiñón', 'papas hilo'
];


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
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
      ingredients: ['Salsas']
    },
    {
        id: 27,
        name: 'Hot Dog Grande',
        price: 4700,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
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
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Palta']
    },
    {
        id: 31,
        name: 'Palta Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Palta']
    },
     {
        id: 32,
        name: 'Tomate Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate']
    },
    {
        id: 33,
        name: 'Tomate Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
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
    { id: 36, name: 'Completo Grande', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Chucrut', 'Americana'] },
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
    // --- Promo Fajitas ---
    { id: 104, name: 'Italiana', price: 9500, category: 'Promo Fajitas', modifications: [...promoFajitasBaseModifications], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'palta', 'tomate', 'aceituna', 'bebida lata', 'papa personal'] },
    { id: 105, name: 'Brasileño', price: 9200, category: 'Promo Fajitas', modifications: [...promoFajitasBaseModifications], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Queso Amarillo', 'Papas Hilo', 'Aceituna', 'bebida lata', 'papa personal'] },
    { id: 106, name: 'Chacarero', price: 9800, category: 'Promo Fajitas', modifications: [...promoFajitasBaseModifications], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Aceituna', 'Bebida Lata', 'Papa Personal'] },
    { id: 107, name: 'Americana', price: 8900, category: 'Promo Fajitas', modifications: [...promoFajitasBaseModifications], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'Queso Cheddar', 'Salsa Cheddar', 'Tocino', 'Cebolla Caramelizada', 'Aceituna', 'bebida lata', 'papa personal'] },
    { id: 108, name: 'Primavera', price: 9000, category: 'Promo Fajitas', modifications: [...promoFajitasBaseModifications], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'tomate', 'poroto verde', 'choclo', 'aceituna', 'bebida lata', 'papa personal'] },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Promo Fajitas', modifications: [...promoFajitasBaseModifications], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno', 'tocino', 'champiñón', 'queso amarillo', 'choclo', 'cebolla', 'aceituna', 'papas hilo', 'bebida lata', 'papa personal'] },
    { id: 110, name: '4 Ingredientes', price: 11000, category: 'Promo Fajitas', modifications: [...promoFajitasBaseModifications, 'Pollo', 'Lomito', 'Vacuno', 'Lechuga'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['1 bebida lata', '1 papas fritas personal'] },
    { id: 111, name: '6 Ingredientes', price: 12000, category: 'Promo Fajitas', modifications: [...promoFajitasBaseModifications, 'Pollo', 'Lomito', 'Vacuno', 'Lechuga'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['1 bebida lata', '1 papas fritas personal'] },
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
         ingredients: ['Huevo Frito', 'Cebolla Frita', 'Bacon', 'Bebida Lata', 'Papa Personal']
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
    { id: 73, name: 'Chacarero', price: 7000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin tomate', 'sin aji oro', 'sin poroto verde', 'sin aji jalapeño', 'con tomate', 'con aji oro', 'con poroto verde', 'con aji jalapeño'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño', 'Bebida Lata', 'Papa Personal'] },
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
     { id: 87, name: 'Dinamico', price: 9300, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'sin americana', 'sin chucrut', 'sin palta'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata', 'Papa Personal'] },
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
];


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
  let baseMenu: MenuItem[] = mockMenu.map(item => ({ 
    ...item,
    modifications: item.modifications || [],
  }));

  if (typeof window === 'undefined') {
    return sortMenu(baseMenu); 
  }

  const storedMenuJson = localStorage.getItem(MENU_STORAGE_KEY);
  let finalMenuToSave = [...baseMenu]; 

  if (storedMenuJson) {
    try {
      const parsedLocalStorageMenu: MenuItem[] = JSON.parse(storedMenuJson);
      if (Array.isArray(parsedLocalStorageMenu)) {
        const mergedMenu = baseMenu.map(mockItem => {
          const storedItem = parsedLocalStorageMenu.find(lsItem => lsItem.id === mockItem.id);
          if (storedItem) {
            return {
              ...mockItem,
              price: storedItem.price,
              modifications: storedItem.modifications && storedItem.modifications.length > 0 ? storedItem.modifications : (mockItem.modifications || []),
              ingredients: storedItem.ingredients && storedItem.ingredients.length > 0 ? storedItem.ingredients : (mockItem.ingredients || []),
            };
          }
          return mockItem;
        });
        finalMenuToSave = mergedMenu;
      }
    } catch (e) {
      console.error("Failed to parse menu from localStorage. Using mock menu.", e);
    }
  }

  finalMenuToSave = finalMenuToSave.map(item => {
    const newItem = { ...item };
    if (item.category === 'Promo Fajitas' &&
        ['Italiana', 'Brasileño', 'Chacarero', 'Americana', 'Primavera', 'Golosasa', '4 Ingredientes', '6 Ingredientes'].includes(item.name)) {
      const existingMods = new Set(newItem.modifications || []);
      promoFajitasBaseModifications.forEach(mod => existingMods.add(mod));
      newItem.modifications = Array.from(existingMods);
    }
    return newItem;
  });

  const sortedFinalMenu = sortMenu(finalMenuToSave);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(sortedFinalMenu));
    } catch (e) {
      console.error("Failed to save final menu to localStorage:", e);
    }
  }
  return sortedFinalMenu;
};


const TableDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const tableIdParam = params.tableId as string;
  const isDelivery = tableIdParam.toLowerCase() === 'delivery';

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrderGroups, setPendingOrderGroups] = useState<PendingOrderGroup[]>([]);

  const [currentOrderTotal, setCurrentOrderTotal] = useState(0);
  const [pendingOrderTotal, setPendingOrderTotal] = useState(0);

  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [itemToModify, setItemToModify] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] useState(false);

  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [orderNumber, setOrderNumber] = useState(1);
  const [lastOrderNumber, setLastOrderNumber] = useState(0);

  const [hasBeenInitialized, setHasBeenInitialized] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [orderToPay, setOrderToPay] = useState<PendingOrderGroup | null>(null);
  const [paymentDialogForGroup, setPaymentDialogForGroup] = useState<PendingOrderGroup | null>(null);



  const loadOrderNumber = useCallback(() => {
    const storedOrderNumber = localStorage.getItem(ORDER_NUMBER_STORAGE_KEY);
    if (storedOrderNumber) {
        setLastOrderNumber(parseInt(storedOrderNumber, 10));
    }
  }, []);

  const saveOrderNumber = useCallback((num: number) => {
    localStorage.setItem(ORDER_NUMBER_STORAGE_KEY, num.toString());
  }, []);

  const getNextOrderNumber = useCallback(() => {
    const nextNum = lastOrderNumber + 1 > 999 ? 1 : lastOrderNumber + 1;
    setLastOrderNumber(nextNum);
    saveOrderNumber(nextNum);
    return nextNum;
  }, [lastOrderNumber, saveOrderNumber]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };


  useEffect(() => {
    console.log(`Initializing state for table: ${tableIdParam}`);
    if (hasBeenInitialized) {
      console.log(`Already initialized for ${tableIdParam}, skipping.`);
      return;
    }

    loadOrderNumber();
    setMenu(getPersistedMenu());

    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (storedInventory) {
      try {
        setInventory(JSON.parse(storedInventory));
      } catch (e) {
        console.error("Failed to parse inventory from localStorage", e);
        setInventory([]);
      }
    } else {
      setInventory([]);
    }


    const currentOrderKey = `${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-currentOrder`;
    const pendingOrdersKey = `${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-pendingOrders`;
    const deliveryInfoKey = `${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`;

    const storedCurrentOrder = sessionStorage.getItem(currentOrderKey);
    if (storedCurrentOrder) {
      try {
        setCurrentOrder(JSON.parse(storedCurrentOrder));
      } catch (e) {
        console.error("Error parsing current order for table", tableIdParam, e);
        setCurrentOrder([]);
      }
    }

    const storedPendingOrdersData = sessionStorage.getItem(pendingOrdersKey);
    if (storedPendingOrdersData) {
      try {
        const parsedData: PendingOrderStorageData | PendingOrderGroup[] = JSON.parse(storedPendingOrdersData);
        if (Array.isArray(parsedData)) { // Handle old format (array of groups)
             setPendingOrderGroups(parsedData);
        } else if (parsedData && Array.isArray(parsedData.groups)) { // Handle new format (object with groups array)
             setPendingOrderGroups(parsedData.groups);
        } else {
            setPendingOrderGroups([]);
        }
      } catch (e) {
        console.error("Error parsing pending orders for table", tableIdParam, e);
        setPendingOrderGroups([]);
      }
    }


    if (isDelivery) {
      const storedDeliveryInfo = sessionStorage.getItem(deliveryInfoKey);
      if (storedDeliveryInfo) {
        try {
          setDeliveryInfo(JSON.parse(storedDeliveryInfo));
        } catch (e) {
          console.error("Error parsing delivery info for table", tableIdParam, e);
          setDeliveryInfo(null);
        }
      }
      setIsDeliveryDialogOpen(!storedDeliveryInfo);
    }
    setHasBeenInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, hasBeenInitialized, isDelivery, loadOrderNumber]);


  useEffect(() => {
    if (!hasBeenInitialized) return;
    console.log(`Saving state for table: ${tableIdParam}`);

    const currentOrderKey = `${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-currentOrder`;
    const pendingOrdersKey = `${PENDING_ORDERS_STORAGE_KEY_PREFIX}${tableIdParam}-pendingOrders`;
    const deliveryInfoKey = `${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`;
    const tableStatusKey = `table-${tableIdParam}-status`;


    try {
      sessionStorage.setItem(currentOrderKey, JSON.stringify(currentOrder));
      const dataToStore: PendingOrderStorageData = { groups: pendingOrderGroups };
      sessionStorage.setItem(pendingOrdersKey, JSON.stringify(dataToStore));

      if (isDelivery && deliveryInfo) {
        sessionStorage.setItem(deliveryInfoKey, JSON.stringify(deliveryInfo));
      }


      const isOccupied = currentOrder.length > 0 || pendingOrderGroups.length > 0 || (isDelivery && !!deliveryInfo && (deliveryInfo.name !== '' || deliveryInfo.address !== '' || deliveryInfo.phone !== '' || deliveryInfo.deliveryFee > 0));
      sessionStorage.setItem(tableStatusKey, isOccupied ? 'occupied' : 'available');
      console.log(`Table ${tableIdParam} status set to: ${isOccupied ? 'occupied' : 'available'}`);

    } catch (e) {
      console.error("Error saving state to sessionStorage for table", tableIdParam, e);
      toast({ title: "Error de Guardado", description: "No se pudo guardar el estado del pedido.", variant: "destructive" });
    }
  }, [currentOrder, pendingOrderGroups, deliveryInfo, tableIdParam, isDelivery, toast, hasBeenInitialized]);


  useEffect(() => {
    setCurrentOrderTotal(currentOrder.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0));
  }, [currentOrder]);

  useEffect(() => {
    const totalForPending = pendingOrderGroups.reduce((sum, group) => {
        const groupTotal = group.items.reduce((itemSum, item) => itemSum + item.finalPrice * item.quantity, 0);
        const groupDeliveryFee = group.deliveryInfo?.deliveryFee || 0;
        return sum + groupTotal + groupDeliveryFee;
    }, 0);
    setPendingOrderTotal(totalForPending);
  }, [pendingOrderGroups]);


  const updateInventory = useCallback((itemName: string, quantityToDecrement: number) => {
    setInventory(prevInventory => {
      const updatedInventory = prevInventory.map(invItem => {
        if (invItem.name.toLowerCase() === itemName.toLowerCase()) {
          const newStock = Math.max(0, invItem.stock - quantityToDecrement);
          if (newStock === 0 && invItem.stock > 0) {
            toast({ title: "Inventario Bajo", description: `¡${invItem.name} se ha agotado!`, variant: "destructive"});
          }
          return { ...invItem, stock: newStock };
        }
        return invItem;
      });
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedInventory));
      return updatedInventory;
    });
  }, [toast]);

  const deductInventoryForOrder = useCallback((orderItems: OrderItem[]) => {
    orderItems.forEach(orderItem => {
      const { name, quantity, category } = orderItem;

      const itemSpecificDeductions: { [key:string]: { inventoryItemName: string, count: number }[] } = {
        // Completos Vienesas - Normal
        "italiano normal_completos vienesas": [{ inventoryItemName: "Pan especial normal", count: 1 }, {inventoryItemName: "Vienesas", count: 1}],
        "hot dog normal_completos vienesas": [{ inventoryItemName: "Pan especial normal", count: 1 }, {inventoryItemName: "Vienesas", count: 1}],
        "completo normal_completos vienesas": [{ inventoryItemName: "Pan especial normal", count: 1 }, {inventoryItemName: "Vienesas", count: 1}],
        "palta normal_completos vienesas": [{ inventoryItemName: "Pan especial normal", count: 1 }, {inventoryItemName: "Vienesas", count: 1}],
        "tomate normal_completos vienesas": [{ inventoryItemName: "Pan especial normal", count: 1 }, {inventoryItemName: "Vienesas", count: 1}],
        "dinamico normal_completos vienesas": [{ inventoryItemName: "Pan especial normal", count: 1 }, {inventoryItemName: "Vienesas", count: 1}],
        // Completos Vienesas - Grande
        "italiano grande_completos vienesas": [{ inventoryItemName: "Pan especial grande", count: 1 }, {inventoryItemName: "Vienesas", count: 2}],
        "hot dog grande_completos vienesas": [{ inventoryItemName: "Pan especial grande", count: 1 }, {inventoryItemName: "Vienesas", count: 2}],
        "completo grande_completos vienesas": [{ inventoryItemName: "Pan especial grande", count: 1 }, {inventoryItemName: "Vienesas", count: 2}],
        "palta grande_completos vienesas": [{ inventoryItemName: "Pan especial grande", count: 1 }, {inventoryItemName: "Vienesas", count: 2}],
        "tomate grande_completos vienesas": [{ inventoryItemName: "Pan especial grande", count: 1 }, {inventoryItemName: "Vienesas", count: 2}],
        "dinamico grande_completos vienesas": [{ inventoryItemName: "Pan especial grande", count: 1 }, {inventoryItemName: "Vienesas", count: 2}],
        // Completos As - Normal
        "italiano normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "completo normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "palta normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "tomate normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "queso normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "solo carne normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "dinamico normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "chacarero normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "napolitano normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        "queso champiñon normal_completos as": [{ inventoryItemName: "Pan especial normal", count: 1 }],
        // Completos As - Grande
        "italiano grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "completo grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "palta grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "tomate grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "queso grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "solo carne grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "dinamico grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "chacarero grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "napolitano grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
        "queso champiñon grande_completos as": [{ inventoryItemName: "Pan especial grande", count: 1 }],
         // Promo Fajitas
        "4 ingredientes_promo fajitas": [{ inventoryItemName: "Fajita", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "6 ingredientes_promo fajitas": [{ inventoryItemName: "Fajita", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "americana_promo fajitas": [{ inventoryItemName: "Fajita", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "brasileño_promo fajitas": [{ inventoryItemName: "Fajita", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "chacarero_promo fajitas": [{ inventoryItemName: "Fajita", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "golosasa_promo fajitas": [{ inventoryItemName: "Fajita", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "italiana_promo fajitas": [{ inventoryItemName: "Fajita", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "primavera_promo fajitas": [{ inventoryItemName: "Fajita", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        // Promo Hamburguesas
        "big cami_promo hamburguesas": [{ inventoryItemName: "Pan de hamburguesa normal", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "doble_promo hamburguesas": [{ inventoryItemName: "Pan de hamburguesa normal", count: 2 }, { inventoryItemName: "Lata", count: 1 }],
        "doble italiana_promo hamburguesas": [{ inventoryItemName: "Pan de hamburguesa normal", count: 2 }, { inventoryItemName: "Lata", count: 1 }],
        "italiana_promo hamburguesas": [{ inventoryItemName: "Pan de hamburguesa normal", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "simple_promo hamburguesas": [{ inventoryItemName: "Pan de hamburguesa normal", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "super big cami_promo hamburguesas": [{ inventoryItemName: "Pan de hamburguesa grande", count: 2 }, { inventoryItemName: "Lata", count: 1 }],
        "super tapa arteria_promo hamburguesas": [{ inventoryItemName: "Pan de hamburguesa grande", count: 2 }, { inventoryItemName: "Lata", count: 1 }],
        "tapa arteria_promo hamburguesas": [{ inventoryItemName: "Pan de hamburguesa normal", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        // Churrascos (uses Pan de Marraqueta)
        "churrasco campestre_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco che milico_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco completo_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco dinamico_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco italiano_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco napolitano_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco palta_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco queso_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco queso champiñon_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        "churrasco tomate_churrascos": [{ inventoryItemName: "Pan de marraqueta", count: 1 }],
        // Promo Churrasco (uses Pan de Marraqueta + Lata)
        "brasileño_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "campestre_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "chacarero_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "che milico_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "completo_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "dinamico_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "italiano_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "queso_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "queso champiñon_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "tomate_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "palta_promo churrasco": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
         // Promo Mechada (Pan de Marraqueta + Lata)
        "brasileño_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "campestre_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "chacarero_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "che milico_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "completo_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "dinamico_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "italiano_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "queso_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "queso champiñon_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "tomate_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        "palta_promo mechada": [{ inventoryItemName: "Pan de marraqueta", count: 1 }, { inventoryItemName: "Lata", count: 1 }],
        // Promociones
        "promo 1_promociones": [{ inventoryItemName: "Pan de hamburguesa grande", count: 1 }, { inventoryItemName: "Bebida 1.5Lt", count: 1 }],
        "promo 2_promociones": [{ inventoryItemName: "Pan de hamburguesa grande", count: 1 }, { inventoryItemName: "Bebida 1.5Lt", count: 1 }],
        "promo 3_promociones": [{ inventoryItemName: "Pan de marraqueta", count: 4 }, { inventoryItemName: "Bebida 1.5Lt", count: 1 }],
        "promo 4_promociones": [{ inventoryItemName: "Pan de marraqueta", count: 2 }],
        "promo 5_promociones": [{ inventoryItemName: "Pan especial normal", count: 2 }, { inventoryItemName: "Vienesas", count: 2 }, { inventoryItemName: "Lata", count: 2 }],
        "promo 6_promociones": [{ inventoryItemName: "Pan especial grande", count: 2 }, { inventoryItemName: "Vienesas", count: 4 }, { inventoryItemName: "Lata", count: 2 }],
        "promo 7_promociones": [{ inventoryItemName: "Pan especial normal", count: 2 }, { inventoryItemName: "Lata", count: 2 }],
        "promo 8_promociones": [{ inventoryItemName: "Pan especial grande", count: 2 }, { inventoryItemName: "Lata", count: 2 }],
        "promo 9_promociones": [{ inventoryItemName: "Pan especial normal", count: 4 }, { inventoryItemName: "Vienesas", count: 4 }, { inventoryItemName: "Bebida 1.5Lt", count: 1 }],
        "promo 10_promociones": [{ inventoryItemName: "Pan especial grande", count: 4 }, { inventoryItemName: "Vienesas", count: 8 }, { inventoryItemName: "Bebida 1.5Lt", count: 1 }],
        "promo 11_promociones": [{ inventoryItemName: "Pan especial normal", count: 4 }, { inventoryItemName: "Bebida 1.5Lt", count: 1 }],
        "promo 12_promociones": [{ inventoryItemName: "Pan especial grande", count: 4 }, { inventoryItemName: "Bebida 1.5Lt", count: 1 }],
        // Papas Fritas
        "box cami_papas fritas": [{ inventoryItemName: "Bebida 1.5Lt", count: 1 }], // Assuming "empanadas" are not tracked or part of a generic "supply"
        // Bebidas
        "bebida 1.5lt_bebidas": [{ inventoryItemName: "Bebida 1.5Lt", count: 1 }],
        "lata_bebidas": [{ inventoryItemName: "Lata", count: 1 }],
        "cafe chico_bebidas": [{ inventoryItemName: "Cafe Chico", count: 1 }],
        "cafe grande_bebidas": [{ inventoryItemName: "Cafe Grande", count: 1 }],
      };

      const key = `${name.toLowerCase()}_${category.toLowerCase()}`;
      const deductions = itemSpecificDeductions[key];

      if (deductions) {
        deductions.forEach(deduction => {
            updateInventory(deduction.inventoryItemName, deduction.count * quantity);
        });
      } else {
        // Generic deduction based on name if not in specific list
        const genericItemName = name.toLowerCase().includes("bebida 1.5lt") ? "Bebida 1.5Lt"
                              : name.toLowerCase().includes("lata") ? "Lata"
                              : name.toLowerCase().includes("cafe chico") ? "Cafe Chico"
                              : name.toLowerCase().includes("cafe grande") ? "Cafe Grande"
                              : name; // Fallback to item name if no specific match

        if (genericItemName !== name) { // If a generic match was found
            updateInventory(genericItemName, quantity);
        }
        // If no specific or generic mapping, no inventory is deducted for this item.
      }
    });
  }, [updateInventory, toast]);


  const handleAddItem = (item: MenuItem) => {
    if (item.modifications && item.modifications.length > 0) {
      setItemToModify(item);
      setIsModificationDialogOpen(true);
    } else {
      addToOrder(item);
    }
    setIsMenuSheetOpen(false); // Close menu sheet after adding item
  };

 const addToOrder = (item: MenuItem, selectedModifications?: string[]) => {
    const finalPrice = calculateFinalPrice(item, selectedModifications);
    const orderItemId = `${item.id}-${selectedModifications ? selectedModifications.join('-') : 'no-mods'}-${Date.now()}`;

    setCurrentOrder(prevOrder => {
        const existingItemIndex = prevOrder.findIndex(
            (orderItem) =>
            orderItem.id === item.id &&
            isEqual(orderItem.selectedModifications?.sort(), selectedModifications?.sort())
        );

        if (existingItemIndex > -1) {
            const updatedOrder = [...prevOrder];
            updatedOrder[existingItemIndex].quantity += 1;
            return updatedOrder;
        } else {
            return [
            ...prevOrder,
            {
                ...item,
                orderItemId,
                quantity: 1,
                selectedModifications,
                basePrice: item.price,
                finalPrice: finalPrice,
                ingredients: item.ingredients,
                category: item.category,
            },
            ];
        }
    });
    toast({ title: "Producto Añadido", description: `${item.name} ${selectedModifications ? `(${selectedModifications.join(', ')})` : ''} añadido al pedido actual.`});
};


  const handleModificationConfirm = (mods: string[] | undefined) => {
    if (itemToModify) {
      addToOrder(itemToModify, mods);
    }
    setIsModificationDialogOpen(false);
    setItemToModify(null);
  };

  const handleModificationCancel = () => {
    setIsModificationDialogOpen(false);
    setItemToModify(null);
  };

  const calculateFinalPrice = (item: MenuItem, modifications?: string[]): number => {
    let finalPrice = item.price;
    if (modifications && item.modificationPrices) {
      modifications.forEach(mod => {
        finalPrice += item.modificationPrices![mod] || 0;
      });
    }
    return finalPrice;
  };


  const handleRemoveItem = (orderItemId: string) => {
    setCurrentOrder(prev => prev.filter(item => item.orderItemId !== orderItemId));
    toast({ title: "Producto Eliminado", description: "El producto ha sido eliminado del pedido actual.", variant: "destructive" });
  };

  const handleIncreaseQuantity = (orderItemId: string) => {
    setCurrentOrder(prev => prev.map(item => item.orderItemId === orderItemId ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const handleDecreaseQuantity = (orderItemId: string) => {
    setCurrentOrder(prev => prev.map(item => item.orderItemId === orderItemId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
  };


  const handlePrintKitchenOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Pedido Vacío", description: "No hay productos en el pedido actual para enviar a cocina.", variant: "destructive"});
      return;
    }
    const newOrderNum = getNextOrderNumber();

    const orderItemsWithNumber = currentOrder.map(item => ({ ...item, orderNumber: newOrderNum }));

    const receiptHtml = formatKitchenOrderReceipt(
      orderItemsWithNumber,
      isDelivery ? `Delivery #${newOrderNum}` : `Mesa ${tableIdParam} - Orden #${newOrderNum}`,
      newOrderNum,
      deliveryInfo
    );
    printHtml(receiptHtml);


    setPendingOrderGroups(prevGroups => [
        ...prevGroups,
        { orderNumber: newOrderNum, items: orderItemsWithNumber, deliveryInfo: deliveryInfo }
    ]);
    setCurrentOrder([]); // Clear current order
    if (isDelivery) {
        setDeliveryInfo(null); // Clear delivery info for the next delivery order on this "table"
        sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY_PREFIX}${tableIdParam}`);
    }
    toast({ title: "Comanda Impresa", description: `Pedido #${newOrderNum} enviado a cocina y movido a pendientes.` });
  };


  const handleFinalizeAndPay = (groupToPay: PendingOrderGroup) => {
     setOrderToPay(groupToPay);
     setIsPaymentDialogOpen(true);
  };


  const handlePaymentConfirm = (method: PaymentMethod, tipAmount: number, finalAmountWithTip: number) => {
    if (!orderToPay) {
         toast({ title: "Error de Pago", description: "No hay pedido seleccionado para pagar.", variant: "destructive" });
         setIsPaymentDialogOpen(false);
        return;
    }

    const { items: orderItems, orderNumber: payingOrderNumber, deliveryInfo: payingDeliveryInfo } = orderToPay;

    const totalAmountForReceipt = orderItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0)
                                + (payingDeliveryInfo?.deliveryFee || 0)
                                + tipAmount;


    const receiptHtml = formatCustomerReceipt(
      orderItems,
      totalAmountForReceipt,
      method,
      tableIdParam,
      payingOrderNumber,
      payingDeliveryInfo,
      tipAmount
    );
    printHtml(receiptHtml);


    const saleAmount = orderItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    let description = `Venta Mesa ${tableIdParam} - Orden #${payingOrderNumber}`;
    if (isDelivery && payingDeliveryInfo?.name) {
        description = `Venta Delivery a ${payingDeliveryInfo.name} - Orden #${payingOrderNumber}`;
    }
    if (tipAmount > 0) {
        description += ` (Propina: ${formatCurrency(tipAmount)})`;
    }

    const cashMovement: CashMovement = {
      id: Date.now(),
      date: new Date(),
      category: 'Ingreso Venta',
      description: description,
      amount: saleAmount, // Amount without tip, tip is informational
      paymentMethod: method,
      deliveryFee: payingDeliveryInfo?.deliveryFee || 0,
    };

    const storedMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    const movements: CashMovement[] = storedMovements ? JSON.parse(storedMovements) : [];
    movements.push(cashMovement);
    sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));


    deductInventoryForOrder(orderItems);

    setPendingOrderGroups(prevGroups => prevGroups.filter(group => group.orderNumber !== payingOrderNumber));
    setIsPaymentDialogOpen(false);
    setOrderToPay(null);

    toast({ title: "Pago Realizado", description: `Pago para Pedido #${payingOrderNumber} registrado y boleta impresa.` });


    if (currentOrder.length === 0 && pendingOrderGroups.filter(group => group.orderNumber !== payingOrderNumber).length === 0 && !isDelivery) {
      sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
    } else if (isDelivery && currentOrder.length === 0 && pendingOrderGroups.filter(group => group.orderNumber !== payingOrderNumber).length === 0 && !deliveryInfo) {
       sessionStorage.setItem(`table-${tableIdParam}-status`, 'available');
    }


  };

  const handleDeliveryInfoConfirm = (info: DeliveryInfo) => {
    setDeliveryInfo(info);
    setIsDeliveryDialogOpen(false);
    toast({ title: "Datos de Envío Guardados", description: "Puede proceder a tomar el pedido." });
  };

  const handleDeliveryInfoCancel = () => {
    if (!deliveryInfo || (!deliveryInfo.name && !deliveryInfo.address && !deliveryInfo.phone)) {
        // If no info was ever entered, or all fields are empty, go back
        router.push('/tables');
    } else {
        // If some info exists (e.g., from a previous session), just close the dialog
        setIsDeliveryDialogOpen(false);
    }
  };

  const handleEditDeliveryInfo = (group?: PendingOrderGroup) => {
      if (group && group.deliveryInfo) {
          setDeliveryInfo(group.deliveryInfo); // Load group's delivery info for editing
      } else if (!group && deliveryInfo) {
          // If editing current order's delivery info, deliveryInfo state is already set
      } else if (!group && !deliveryInfo && isDelivery) {
           // If it's a new delivery order and no info yet, initialize with empty or last used
           const storedLastInfo = localStorage.getItem('lastDeliveryInfo');
           if (storedLastInfo) {
               try {
                   setDeliveryInfo(JSON.parse(storedLastInfo));
               } catch { setDeliveryInfo({ name: '', address: '', phone: '', deliveryFee: 0 }); }
           } else {
               setDeliveryInfo({ name: '', address: '', phone: '', deliveryFee: 0 });
           }
      }
      setIsDeliveryDialogOpen(true);
  };

  const handleRemovePendingOrderGroup = (orderNumToRemove: number) => {
    setPendingOrderGroups(prevGroups => prevGroups.filter(group => group.orderNumber !== orderNumToRemove));
    toast({ title: "Pedido Pendiente Eliminado", description: `El pedido #${orderNumToRemove} ha sido eliminado.`, variant: "destructive"});
  };


  const filteredMenu = useMemo(() => {
    if (!selectedCategory) {
      return menu.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return menu.filter(
      item =>
        item.category === selectedCategory &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menu, selectedCategory, searchTerm]);


  const groupedMenu = useMemo(() => {
    return filteredMenu.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [filteredMenu]);


  const menuCategories = useMemo(() => {
    const uniqueCategories = [...new Set(menu.map(item => item.category))];
    return orderedCategories.filter(cat => uniqueCategories.includes(cat));
  }, [menu]);


  if (!hasBeenInitialized && !isDelivery) {
     return <div className="flex items-center justify-center min-h-screen">Cargando Mesa...</div>;
  }
  if (isDelivery && !deliveryInfo && !isDeliveryDialogOpen) {
     return <div className="flex items-center justify-center min-h-screen">Cargando Delivery...</div>;
  }


  return (
    <div className="flex flex-col h-screen p-1 md:p-2 bg-background">
      <header className="flex items-center justify-between p-2 md:p-4 border-b">
        <Button variant="outline" onClick={() => router.push('/tables')} className="flex items-center">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a Mesas
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">
            {isDelivery ? `Pedido Delivery ${deliveryInfo?.name ? `- ${deliveryInfo.name}` : ''}` : `Mesa ${tableIdParam}`}
        </h1>
         {isDelivery && (
            <Button variant="outline" size="sm" onClick={() => handleEditDeliveryInfo()}>
                <User className="mr-2 h-4 w-4" /> Datos Envío
            </Button>
        )}
        <div className="w-24"> {/* Spacer */} </div>
      </header>

      <div className="flex justify-center my-2 md:my-4">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-6 py-3 md:px-8 md:py-6 text-base md:text-lg">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full md:w-[calc(100vw-2rem)] max-w-4xl p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="text-2xl">Menú de Productos</SheetTitle>
                    </SheetHeader>
                    <div className="p-4">
                        <Input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-4 w-full" />
                    </div>

                    <ScrollArea className="flex-grow p-1 md:p-4">
                        <Accordion type="multiple" className="w-full" defaultValue={menuCategories}>
                            {Object.entries(groupedMenu).map(([category, items]) => (
                            <AccordionItem value={category} key={category} className="border-b-0 mb-2 last:mb-0">
                                <AccordionTrigger className="text-lg md:text-xl font-semibold hover:bg-muted/50 px-3 py-2 md:px-4 md:py-3 rounded-md hover:no-underline bg-card shadow-sm">
                                    {category}
                                </AccordionTrigger>
                                <AccordionContent className="pt-1 pb-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
                                    {items.map((item) => (
                                        <Card
                                            key={item.id}
                                            onClick={() => handleAddItem(item)}
                                            className="cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between"
                                        >
                                        <CardHeader className="pb-2 pt-3 px-3">
                                            <CardTitle className="text-base md:text-lg">{item.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-xs md:text-sm text-muted-foreground pb-2 px-3 flex-grow">
                                          {item.ingredients && item.ingredients.length > 0 ? item.ingredients.join(', ') : <span className="italic">Sin ingredientes base.</span>}
                                        </CardContent>
                                        <CardFooter className="flex justify-end items-center pt-1 pb-2 px-3 border-t mt-1">
                                            <span className="text-sm md:text-base font-semibold">{formatCurrency(item.price)}</span>
                                        </CardFooter>
                                        </Card>
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


      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 overflow-hidden p-1 md:p-2">
        {/* Current Order Section */}
        <Card className="flex flex-col h-full max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)]"> {/* Adjusted max-height */}
          <CardHeader>
            <CardTitle>Pedido Actual</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="space-y-2">
              {currentOrder.length === 0 && <p className="text-muted-foreground text-center py-4">Aún no has añadido productos.</p>}
              {currentOrder.map((item) => (
                <div key={item.orderItemId} className="border p-2 rounded-md shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm md:text-base">
                        {item.name}
                        {item.category && <span className="text-xs text-muted-foreground ml-1">({item.category})</span>}
                      </p>
                      {item.selectedModifications && item.selectedModifications.length > 0 && (
                        <p className="text-xs text-muted-foreground font-bold">
                          ({item.selectedModifications.join(', ')})
                        </p>
                      )}
                       {item.ingredients && item.ingredients.length > 0 && (
                           <p className="text-xs text-muted-foreground mt-1">
                               Ingredientes: {item.ingredients.join(', ')}
                           </p>
                       )}
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={() => handleDecreaseQuantity(item.orderItemId)}>
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="font-mono text-sm md:text-base w-6 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={() => handleIncreaseQuantity(item.orderItemId)}>
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 h-6 w-6 md:h-7 md:w-7" onClick={() => handleRemoveItem(item.orderItemId)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-2 md:p-4 border-t mt-auto">
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="font-bold">Total Actual:</span>
                <span className="font-bold">{formatCurrency(currentOrderTotal)}</span>
              </div>
             <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Pending Orders Section */}
        <Card className="flex flex-col h-full max-h-[calc(100vh-180px)] md:max-h-[calc(100vh-200px)]"> {/* Adjusted max-height */}
          <CardHeader>
            <CardTitle>Pedidos Pendientes de Pago</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="space-y-2">
              {pendingOrderGroups.length === 0 && <p className="text-muted-foreground text-center py-4">No hay pedidos pendientes.</p>}
              {pendingOrderGroups.map((group) => {
                const groupTotal = group.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
                const totalWithDelivery = groupTotal + (group.deliveryInfo?.deliveryFee || 0);
                return (
                    <Card key={group.orderNumber} className="p-2 md:p-3 shadow-md">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm md:text-base">
                                Pedido #{String(group.orderNumber).padStart(3, '0')}
                                {group.deliveryInfo?.name && <span className="text-xs text-muted-foreground"> ({group.deliveryInfo.name})</span>}
                            </span>
                            <Button variant="ghost" size="icon" className="text-destructive h-6 w-6 md:h-7 md:w-7" onClick={() => handleRemovePendingOrderGroup(group.orderNumber)}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar Pedido</span>
                            </Button>
                        </div>
                        <div className="max-h-32 overflow-y-auto text-xs md:text-sm mb-1 border-t border-b py-1">
                        {group.items.map(item => (
                            <div key={item.orderItemId} className="flex justify-between items-start py-0.5">
                                <div className="flex-grow">
                                    <span className="font-bold">{item.quantity}x {item.name}</span>
                                    {item.selectedModifications && item.selectedModifications.length > 0 && (
                                        <span className="text-muted-foreground font-bold"> ({item.selectedModifications.join(', ')})</span>
                                    )}
                                </div>
                                <span className="font-mono ml-2 whitespace-nowrap">{formatCurrency(item.finalPrice * item.quantity)}</span>
                            </div>
                        ))}
                        {group.deliveryInfo?.deliveryFee && group.deliveryInfo.deliveryFee > 0 && (
                            <div className="flex justify-between items-start py-0.5 border-t mt-1 pt-1">
                                <span className="font-bold">Costo Envío:</span>
                                <span className="font-mono ml-2 whitespace-nowrap">{formatCurrency(group.deliveryInfo.deliveryFee)}</span>
                            </div>
                        )}
                        </div>
                        <div className="flex justify-between items-center mt-1 text-sm md:text-base">
                            <span className="font-bold">Total Pedido: {formatCurrency(totalWithDelivery)}</span>
                            <Button size="sm" onClick={() => handleFinalizeAndPay(group)} className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm">
                                <CreditCard className="mr-1 h-3 w-3 md:h-4 md:w-4" /> Cobrar
                            </Button>
                        </div>
                    </Card>
                );
              })}
            </CardContent>
          </ScrollArea>
           <CardFooter className="p-2 md:p-4 border-t mt-auto">
             <div className="flex justify-between items-center text-base md:text-lg font-semibold w-full">
               <span>Total Pendiente General:</span>
               <span>{formatCurrency(pendingOrderTotal)}</span>
             </div>
           </CardFooter>
        </Card>
      </main>

       {/* Modification Dialog */}
       <ModificationDialog
         isOpen={isModificationDialogOpen}
         onOpenChange={setIsModificationDialogOpen}
         item={itemToModify}
         onConfirm={handleModificationConfirm}
         onCancel={handleModificationCancel}
       />

        {/* Payment Dialog */}
        {orderToPay && (
             <PaymentDialog
                isOpen={isPaymentDialogOpen}
                onOpenChange={(isOpen) => {
                    setIsPaymentDialogOpen(isOpen);
                    if (!isOpen) setOrderToPay(null); // Clear orderToPay when dialog closes
                }}
                totalAmount={orderToPay.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) + (orderToPay.deliveryInfo?.deliveryFee || 0)}
                onConfirm={handlePaymentConfirm}
             />
        )}


       {/* Delivery Info Dialog (only for delivery table) */}
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
};

export default TableDetailPage;

    