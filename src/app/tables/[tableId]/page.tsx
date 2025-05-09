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
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
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
         ingredients: ['Tomate', 'Lechuga']
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
         ingredients: ['Cebolla Caramelizada', 'Huevo']
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
const ProductsPage = () => { // Renamed to avoid conflict with ProductsPage in table detail
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

    const toastDescription = `El precio de ${editingProduct.name} se actualizó a ${printUtilsFormatCurrency(priceValue)}.`;
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
      </div>

       <Card>
         <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Ingredientes</TableHead>
                  <TableHead className="text-right">Precio Base</TableHead>
                  <TableHead className="text-center w-28">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                )}
                {filteredProducts.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.ingredients && item.ingredients.length > 0
                        ? item.ingredients.join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{printUtilsFormatCurrency(item.price)}</TableCell>
                    <TableCell className="text-center">
                    <Button variant="outline" size="icon" onClick={() => openEditPriceDialog(item)} className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar Precio</span>
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
         </CardContent>
       </Card>


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
    </div>
);
};


// Helper function to format currency (consistent with other parts of the app)
// Moved to global scope or a utils file if used across multiple components
const globalFormatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};


// Main component for the table detail page
export default function TableDetailPage() {
  const params = useParams();
  const tableIdParam = params.tableId as string;
  const router = useRouter();
  const { toast } = useToast();
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [selectedItemForModification, setSelectedItemForModification] = useState<MenuItem | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrder, setPendingOrder] = useState<OrderItem[]>([]);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [hasBeenInitialized, setHasBeenInitialized] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number>(1); // State for order number
  const [pendingOrderGroups, setPendingOrderGroups] = useState<PendingOrderGroup[]>([]); // State for pending order groups
  const [selectedPendingOrderGroup, setSelectedPendingOrderGroup] = useState<PendingOrderGroup | null>(null); // State for selected pending order group for payment
  const [isClient, setIsClient] = useState(false); // To handle client-side only rendering parts


  const isDelivery = tableIdParam === 'delivery';

  // Load order number from localStorage
  useEffect(() => {
    setIsClient(true); // Indicate client-side rendering is active
    const storedOrderNumber = localStorage.getItem('lastOrderNumber');
    if (storedOrderNumber) {
      const nextNumber = parseInt(storedOrderNumber, 10) + 1;
      setOrderNumber(nextNumber > 999 ? 1 : nextNumber);
    }
  }, []);

  // Save order number to localStorage
  useEffect(() => {
      if (isClient) { // Only run on client
        localStorage.setItem('lastOrderNumber', (orderNumber -1).toString()); // Store the last used number
      }
  }, [orderNumber, isClient]);


  // --- Calculate totals ---
  const currentOrderTotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  }, [currentOrder]);

  // Total for all pending orders (including delivery fee if applicable and for the main delivery table)
  const pendingOrderTotal = useMemo(() => {
    return pendingOrderGroups.reduce((total, group) => {
        const groupSubtotal = group.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
        const groupDeliveryFee = (tableIdParam === 'delivery' && group.deliveryInfo?.deliveryFee) ? group.deliveryInfo.deliveryFee : 0;
        return total + groupSubtotal + groupDeliveryFee;
    }, 0);
  }, [pendingOrderGroups, tableIdParam]);


  // --- Effect to load and initialize state from sessionStorage ---
  useEffect(() => {
    if (hasBeenInitialized || !isClient) return; // Prevent re-initialization or SSR execution

    console.log(`Initializing state for table ${tableIdParam}...`);

    // Load current order
    const storedCurrentOrder = sessionStorage.getItem(`table-${tableIdParam}-current-order`);
    if (storedCurrentOrder) {
      try {
        const parsed = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsed)) setCurrentOrder(parsed);
      } catch (e) { console.error("Error parsing current order:", e); }
    }

     // Load pending order groups
     const storedPendingOrders = sessionStorage.getItem(`table-${tableIdParam}-pending-orders`);
     if (storedPendingOrders) {
         try {
             const parsed: PendingOrderStorageData | PendingOrderGroup[] = JSON.parse(storedPendingOrders);
             // Handle both old (array) and new (object with 'groups' key) formats
             if (Array.isArray(parsed)) { // Old format
                 setPendingOrderGroups(parsed);
             } else if (parsed && Array.isArray(parsed.groups)) { // New format
                 setPendingOrderGroups(parsed.groups);
             }
         } catch (e) { console.error("Error parsing pending orders:", e); }
     }


    // Load delivery info (only if it's a delivery table)
    if (isDelivery) {
      const storedDeliveryInfo = sessionStorage.getItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`);
      if (storedDeliveryInfo) {
        try {
          setDeliveryInfo(JSON.parse(storedDeliveryInfo));
        } catch (e) { console.error("Error parsing delivery info:", e); }
      } else {
        // If it's a delivery table and no info is stored, open the dialog
        setIsDeliveryDialogOpen(true);
      }
    }
    setHasBeenInitialized(true); // Mark as initialized
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, hasBeenInitialized, isDelivery, isClient]);


  // --- Effect to save state changes to sessionStorage and update table status ---
  useEffect(() => {
    if (!hasBeenInitialized || !isClient) return; // Don't save before initialization or on server

    console.log(`Saving state for table ${tableIdParam}...`);

    sessionStorage.setItem(`table-${tableIdParam}-current-order`, JSON.stringify(currentOrder));
    // Save pending orders (new format)
    sessionStorage.setItem(`table-${tableIdParam}-pending-orders`, JSON.stringify({ groups: pendingOrderGroups }));


    if (isDelivery && deliveryInfo) {
      sessionStorage.setItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`, JSON.stringify(deliveryInfo));
    }

    // Update table status based on whether there are pending orders or (for delivery) delivery info
    const isOccupied = pendingOrderGroups.length > 0 || (isDelivery && deliveryInfo !== null);
    sessionStorage.setItem(`table-${tableIdParam}-status`, isOccupied ? 'occupied' : 'available');

    console.log(`State saved. Table ${tableIdParam} status: ${isOccupied ? 'occupied' : 'available'}`);

  }, [currentOrder, pendingOrderGroups, deliveryInfo, tableIdParam, hasBeenInitialized, isDelivery, isClient]);

  // --- Inventory Management ---
  const updateInventory = useCallback((itemsToDeduct: { name: string; quantity: number }[]) => {
      if (!isClient) return; // Ensure this runs client-side only

      const INVENTORY_STORAGE_KEY = 'restaurantInventory';
      const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
      let inventory: InventoryItem[] = storedInventory ? JSON.parse(storedInventory) : [];

      itemsToDeduct.forEach(deduction => {
          const itemIndex = inventory.findIndex(invItem => invItem.name.toLowerCase() === deduction.name.toLowerCase());
          if (itemIndex > -1) {
              inventory[itemIndex].stock = Math.max(0, inventory[itemIndex].stock - deduction.quantity);
          }
      });
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
      console.log("Inventory updated after payment:", inventory);
  }, [isClient]);


  // --- Event Handlers ---
  const handleSelectItem = (item: MenuItem) => {
    if (item.modifications && item.modifications.length > 0) {
      setSelectedItemForModification(item);
      setIsModificationDialogOpen(true);
    } else {
      addItemToOrder(item, undefined); // Add directly if no modifications
    }
    setIsMenuSheetOpen(false); // Close menu sheet after selection or opening modification dialog
  };


  const addItemToOrder = (item: MenuItem, selectedMods: string[] | undefined) => {
    const existingItemIndex = currentOrder.findIndex(
      (orderItem) =>
        orderItem.id === item.id &&
        isEqual(orderItem.selectedModifications?.sort(), selectedMods?.sort()) // Compare sorted mods
    );

    let modificationCost = 0;
    if (selectedMods && item.modificationPrices) {
      modificationCost = selectedMods.reduce((acc, modName) => acc + (item.modificationPrices?.[modName] ?? 0), 0);
    }
    const finalPrice = item.price + modificationCost;

    if (existingItemIndex > -1) {
      const updatedOrder = [...currentOrder];
      updatedOrder[existingItemIndex].quantity += 1;
      setCurrentOrder(updatedOrder);
    } else {
      setCurrentOrder((prevOrder) => [
        ...prevOrder,
        {
          orderItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: 1,
          selectedModifications: selectedMods,
          basePrice: item.price,
          finalPrice: finalPrice,
          ingredients: item.ingredients, // Pass ingredients
        },
      ]);
    }
    toast({
        title: `${item.name} añadido`,
        description: selectedMods && selectedMods.length > 0 ? `Modificaciones: ${selectedMods.join(', ')}` : "Añadido al pedido actual.",
    });
  };

  const handleModificationConfirm = (modifications: string[] | undefined) => {
    if (selectedItemForModification) {
      addItemToOrder(selectedItemForModification, modifications);
    }
    setIsModificationDialogOpen(false);
    setSelectedItemForModification(null);
  };

  const handleModificationCancel = () => {
    setIsModificationDialogOpen(false);
    setSelectedItemForModification(null);
  };

  const handleIncreaseQuantity = (orderItemId: string) => {
    setCurrentOrder((prevOrder) =>
      prevOrder.map((item) =>
        item.orderItemId === orderItemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecreaseQuantity = (orderItemId: string) => {
    setCurrentOrder((prevOrder) =>
      prevOrder
        .map((item) =>
          item.orderItemId === orderItemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        )
        .filter((item) => item.quantity > 0) // Remove item if quantity is 0
    );
  };

  const handleRemoveItem = (orderItemId: string) => {
    setCurrentOrder((prevOrder) => prevOrder.filter((item) => item.orderItemId !== orderItemId));
    toast({ title: "Artículo Eliminado", description: "El artículo ha sido eliminado del pedido." });
  };


  const handlePrintKitchenOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Pedido Vacío", description: "Añada artículos antes de imprimir.", variant: "destructive" });
      return;
    }

    // Determine order identifier
    const orderIdentifierDisplay = isDelivery ? `Delivery #${orderNumber}` : `Mesa ${tableIdParam}`;

    const receiptHtml = formatKitchenOrderReceipt(currentOrder, orderIdentifierDisplay, orderNumber, deliveryInfo);
    printHtml(receiptHtml);
    toast({ title: "Comanda Enviada", description: "La comanda ha sido enviada a la cocina." });

    // Move current order to pending orders with the current order number
    setPendingOrderGroups(prevGroups => [
        ...prevGroups,
        { orderNumber: orderNumber, items: currentOrder, deliveryInfo: isDelivery ? deliveryInfo : null }
    ]);

    setCurrentOrder([]); // Clear current order
    setOrderNumber(prev => prev + 1 > 999 ? 1 : prev + 1); // Increment order number and reset if > 999
  };


  const handleFinalizePayment = (
    groupToPay: PendingOrderGroup,
    paymentMethod: PaymentMethod,
    tipAmount: number,
    finalAmountWithTip: number
  ) => {
    // Calculate total for the group being paid
    const groupSubtotal = groupToPay.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    const groupDeliveryFee = (tableIdParam === 'delivery' && groupToPay.deliveryInfo?.deliveryFee) ? groupToPay.deliveryInfo.deliveryFee : 0;
    // const totalForReceipt = groupSubtotal + groupDeliveryFee + tipAmount; //This is the totalAmount for customer receipt

    const receiptHtml = formatCustomerReceipt(
        groupToPay.items,
        finalAmountWithTip, // Pass the grand total including tip
        paymentMethod,
        tableIdParam,
        groupToPay.deliveryInfo,
        tipAmount // Pass the calculated tip amount
    );
    printHtml(receiptHtml);
    toast({ title: `Pago Recibido (${paymentMethod})`, description: `Total: ${globalFormatCurrency(finalAmountWithTip)} (Propina: ${globalFormatCurrency(tipAmount)})` });


    // --- Record Sale in Cash Register (expenses/page.tsx logic) ---
    const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';
    const storedCashMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
    let cashMovements: CashMovement[] = storedCashMovements ? JSON.parse(storedCashMovements).map((m:any) => ({...m, date: new Date(m.date)})) : [];

     // Generate a unique ID for the cash movement
     const maxId = cashMovements.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);
     const newCashMovementId = maxId + 1;

    const saleMovement: CashMovement = {
      id: newCashMovementId, // Ensure unique ID
      date: new Date(),
      category: 'Ingreso Venta',
      // Include order number and tip in description
      description: `Venta Orden #${groupToPay.orderNumber}${tipAmount > 0 ? ` (Propina: ${globalFormatCurrency(tipAmount)})` : ''}`,
      amount: groupSubtotal + groupDeliveryFee, // Store amount *before* tip, tip is in description
      paymentMethod: paymentMethod,
      deliveryFee: groupDeliveryFee > 0 ? groupDeliveryFee : undefined,
    };
    cashMovements.push(saleMovement);
    // Store dates as ISO strings
    const movementsToStore = cashMovements.map(m => ({ ...m, date: m.date.toISOString() }));
    sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(movementsToStore));
    console.log("Venta registrada en caja:", saleMovement);


    // --- Deduct from Inventory ---
    const itemsToDeductFromInventory: { name: string; quantity: number }[] = [];

    groupToPay.items.forEach(orderItem => {
        // Standard item deduction
        itemsToDeductFromInventory.push({ name: orderItem.name, quantity: orderItem.quantity });

        // Ingredient-based deductions
        const menuItemDetails = globalMenu.find(menuItm => menuItm.id === orderItem.id);
        if (menuItemDetails?.ingredients) {
            menuItemDetails.ingredients.forEach(ingredientName => {
                // Example: If "Italiano Normal" has "Pan especial normal" and "Vienesas"
                if (orderItem.name.includes('Normal') || orderItem.name.includes('Chico')) {
                    if (ingredientName === 'Pan especial normal' || ingredientName === 'Vienesas' || ingredientName === 'Pan de marraqueta' || ingredientName === 'Pan de hamburguesa normal') {
                        itemsToDeductFromInventory.push({ name: ingredientName, quantity: orderItem.quantity });
                    }
                } else if (orderItem.name.includes('Grande')) {
                     if (ingredientName === 'Pan especial grande' || ingredientName === 'Vienesas' || ingredientName === 'Pan de marraqueta' || ingredientName === 'Pan de hamburguesa grande') {
                        // For "Grande" items that use "Vienesas", deduct 2 vienesas
                        const quantityToDeduct = ingredientName === 'Vienesas' ? orderItem.quantity * 2 : orderItem.quantity;
                        itemsToDeductFromInventory.push({ name: ingredientName, quantity: quantityToDeduct });
                    }
                } else if (orderItem.category === 'Fajitas') {
                     // For Fajitas, deduct "Pan de marraqueta" (assuming this is the tortilla/bread)
                     if (ingredientName === 'Pan de marraqueta') {
                         itemsToDeductFromInventory.push({ name: ingredientName, quantity: orderItem.quantity });
                     }
                }
                // For "Promo Churrasco" and "Promo Mechada", deduct 2 "Pan de marraqueta"
                if ((orderItem.category === 'Promo Churrasco' || orderItem.category === 'Promo Mechada') && ingredientName === 'Pan de marraqueta') {
                    itemsToDeductFromInventory.push({ name: ingredientName, quantity: orderItem.quantity * 2 });
                }
            });
        }
    });
    updateInventory(itemsToDeductFromInventory);


    // Remove the paid group from pending orders
    setPendingOrderGroups(prevGroups => prevGroups.filter(group => group.orderNumber !== groupToPay.orderNumber));

    // If it was a delivery and all pending orders for this delivery are cleared, clear deliveryInfo
    if (isDelivery && pendingOrderGroups.filter(group => group.orderNumber !== groupToPay.orderNumber).length === 0) {
      setDeliveryInfo(null);
      sessionStorage.removeItem(`${DELIVERY_INFO_STORAGE_KEY}-${tableIdParam}`);
    }
    setIsPaymentDialogOpen(false); // Close payment dialog
    setSelectedPendingOrderGroup(null); // Clear selected group
  };

  const openPaymentDialogForGroup = (group: PendingOrderGroup) => {
    setSelectedPendingOrderGroup(group);
    setIsPaymentDialogOpen(true);
  };


  const handleDeliveryInfoConfirm = (info: DeliveryInfo) => {
    setDeliveryInfo(info);
    setIsDeliveryDialogOpen(false);
    // If there are items in currentOrder, move them to a new pending group with this delivery info
    if (currentOrder.length > 0) {
        setPendingOrderGroups(prevGroups => [
            ...prevGroups,
            { orderNumber: orderNumber, items: currentOrder, deliveryInfo: info }
        ]);
        setCurrentOrder([]);
        setOrderNumber(prev => prev + 1 > 999 ? 1 : prev + 1);
    }
    toast({ title: "Datos de Envío Guardados", description: `Cliente: ${info.name}, Dirección: ${info.address}` });
  };

  const handleDeliveryInfoCancel = () => {
    // If cancel without info, and no pending deliveries, redirect or show message
    if (!deliveryInfo && pendingOrderGroups.filter(g => g.deliveryInfo).length === 0) {
        toast({title: "Envío Cancelado", description: "Se requieren datos de envío para continuar.", variant:"destructive"});
        // Optionally redirect if it's critical to have delivery info from the start
        // router.push('/tables'); // Or handle as needed
    }
    setIsDeliveryDialogOpen(false);
  };


  const navigateBack = () => {
    router.push('/tables'); // Navigate to the main tables page
  };

  // Display loading or "select table" if tableId is not yet available or invalid
  if (!tableIdParam || !isClient) {
    return <div className="flex items-center justify-center min-h-screen">Cargando datos de la mesa...</div>;
  }

  // If it's a delivery table and delivery info is not set yet (and dialog is not open), show loading or prompt.
  // This check is now primarily for the initial load before the dialog is forced open by the useEffect.
  if (isDelivery && !deliveryInfo && !isDeliveryDialogOpen && hasBeenInitialized) {
     return (
         <div className="container mx-auto p-4 text-center">
             <h1 className="text-2xl font-bold">Datos de Envío Requeridos</h1>
             <p>Por favor, ingrese los datos de envío para continuar.</p>
             <Button onClick={() => setIsDeliveryDialogOpen(true)} className="mt-4">Ingresar Datos de Envío</Button>
             <Button onClick={navigateBack} variant="outline" className="mt-4 ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mesas
             </Button>
         </div>
     );
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={navigateBack} variant="outline" size="icon" className="rounded-full hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver a Mesas</span>
        </Button>
        <h1 className="text-3xl font-bold text-center flex-grow">
          {isDelivery ? `Pedido Delivery #${deliveryInfo?.name ? `${deliveryInfo.name} (N°${orderNumber})` : orderNumber}` : `Mesa ${tableIdParam}`}
        </h1>
        <div className="w-10"> {/* Spacer to balance the back button */}</div>
      </div>

       {/* Menu Trigger Button - Centered */}
        <div className="flex justify-center mb-6">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-8 py-6 text-lg">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] flex flex-col rounded-t-lg">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="text-2xl text-center">Menú</SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-grow p-1">
                         <Accordion type="multiple" defaultValue={orderedCategories} className="w-full space-y-1">
                            {Object.entries(
                                globalMenu.reduce((acc, item) => {
                                    if (!acc[item.category]) acc[item.category] = [];
                                    acc[item.category].push(item);
                                    return acc;
                                }, {} as Record<string, MenuItem[]>)
                            )
                            .sort(([catA], [catB]) => orderedCategories.indexOf(catA) - orderedCategories.indexOf(catB))
                            .map(([category, items]) => (
                                <AccordionItem value={category} key={category} className="border-none">
                                    <AccordionTrigger className="text-xl font-semibold hover:bg-muted/50 px-4 py-3 rounded-md hover:no-underline data-[state=open]:bg-muted">
                                        {category}
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0 pb-0">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
                                            {items.map(item => (
                                                <Card
                                                    key={item.id}
                                                    onClick={() => handleSelectItem(item)}
                                                    className="cursor-pointer hover:shadow-md transition-shadow flex flex-col justify-between h-full"
                                                >
                                                    <CardHeader className="p-3 pb-1">
                                                        <CardTitle className="text-base">{item.name}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-3 pt-0 pb-2 flex-grow">
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.ingredients && item.ingredients.length > 0 ? `(${item.ingredients.join(', ')})` : ''}
                                                        </p>
                                                    </CardContent>
                                                    <CardFooter className="p-3 pt-0">
                                                        <p className="text-base font-semibold text-primary">{globalFormatCurrency(item.price)}</p>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </ScrollArea>
                     <SheetClose asChild>
                        <Button type="button" variant="outline" className="m-4">Cerrar Menú</Button>
                    </SheetClose>
                </SheetContent>
            </Sheet>
        </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Order Section */}
        <Card className="flex flex-col h-[calc(100vh-220px)]"> {/* Adjust height as needed */}
          <CardHeader>
            <CardTitle className="text-2xl">Pedido Actual</CardTitle>
            {isDelivery && deliveryInfo && (
                <CardDescription className="text-sm">
                    <span className="font-semibold">Entregar a:</span> {deliveryInfo.name} - {deliveryInfo.address} ({deliveryInfo.phone})
                    <br/>
                    <span className="font-semibold">Costo Envío:</span> {globalFormatCurrency(deliveryInfo.deliveryFee)}
                </CardDescription>
            )}
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="pr-2"> {/* Add padding to right of content for scrollbar */}
                {currentOrder.length === 0 ? (
                <p className="text-muted-foreground">Aún no se han añadido artículos al pedido actual.</p>
                ) : (
                <ul className="space-y-3">
                    {currentOrder.map((item) => (
                    <li key={item.orderItemId} className="border p-3 rounded-md shadow-sm bg-card">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-base">{item.name} <span className="text-sm text-muted-foreground">({globalFormatCurrency(item.finalPrice)})</span></p>
                                {item.selectedModifications && item.selectedModifications.length > 0 && (
                                <p className="text-xs text-muted-foreground font-bold">
                                    ({item.selectedModifications.join(', ')})
                                </p>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.orderItemId)} className="h-7 w-7 text-destructive hover:text-destructive/90">
                                <XCircle className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                            </Button>
                        </div>
                        <div className="flex items-center justify-end mt-1">
                            <Button variant="ghost" size="icon" onClick={() => handleDecreaseQuantity(item.orderItemId)} className="h-7 w-7 text-destructive">
                                <MinusCircle className="h-4 w-4" />
                                <span className="sr-only">Disminuir</span>
                            </Button>
                            <span className="font-bold w-8 text-center text-base">{item.quantity}</span>
                            <Button variant="ghost" size="icon" onClick={() => handleIncreaseQuantity(item.orderItemId)} className="h-7 w-7 text-primary">
                                <PlusCircle className="h-4 w-4" />
                                <span className="sr-only">Aumentar</span>
                            </Button>
                        </div>
                    </li>
                    ))}
                </ul>
                )}
            </CardContent>
          </ScrollArea>
          <Separator />
           <CardFooter className="p-4 flex flex-col items-stretch gap-3 mt-auto sticky bottom-0 bg-background z-10 border-t">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Total Actual:</span>
              <span className="font-bold">{globalFormatCurrency(currentOrderTotal)}</span>
            </div>
            <Button onClick={handlePrintKitchenOrder} className="w-full" disabled={currentOrder.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>

        {/* Pending Orders Section */}
         <Card className="flex flex-col h-[calc(100vh-220px)]"> {/* Adjust height as needed */}
          <CardHeader>
            <CardTitle className="text-2xl">Pedidos Pendientes de Pago</CardTitle>
             {pendingOrderGroups.length > 0 && (
                <CardDescription>
                    Total Pendiente General: {globalFormatCurrency(pendingOrderTotal)}
                </CardDescription>
            )}
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="pr-2">
                {pendingOrderGroups.length === 0 ? (
                <p className="text-muted-foreground">No hay pedidos pendientes de pago.</p>
                ) : (
                <ul className="space-y-3">
                    {pendingOrderGroups.map((group) => {
                        const groupSubtotal = group.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
                        const groupDeliveryFee = (tableIdParam === 'delivery' && group.deliveryInfo?.deliveryFee) ? group.deliveryInfo.deliveryFee : 0;
                        const groupTotal = groupSubtotal + groupDeliveryFee;

                       return (
                        <li key={group.orderNumber} className="border p-3 rounded-md shadow-sm bg-card">
                             <div className="flex justify-between items-center mb-2">
                                 <h3 className="font-bold text-base">Orden #{String(group.orderNumber).padStart(3, '0')} - Total: {globalFormatCurrency(groupTotal)}</h3>
                                 <Button onClick={() => openPaymentDialogForGroup(group)} size="sm" variant="default">
                                    <CreditCard className="mr-2 h-4 w-4"/> Pagar
                                 </Button>
                             </div>
                            {group.deliveryInfo && (
                                 <p className="text-xs text-muted-foreground mb-1">
                                     <span className="font-semibold">Envío:</span> {group.deliveryInfo.name} - {globalFormatCurrency(group.deliveryInfo.deliveryFee)}
                                 </p>
                            )}
                            <ul className="space-y-1 text-sm">
                            {group.items.map((item) => (
                                <li key={item.orderItemId} className="flex justify-between">
                                <span>{item.quantity}x {item.name} {item.selectedModifications && item.selectedModifications.length > 0 ? <span className="font-bold text-muted-foreground">({item.selectedModifications.join(', ')})</span> : ''}</span>
                                <span>{globalFormatCurrency(item.finalPrice * item.quantity)}</span>
                                </li>
                            ))}
                            </ul>
                        </li>
                       );
                    })}
                </ul>
                )}
            </CardContent>
          </ScrollArea>
           <CardFooter className="p-4 flex flex-col items-stretch gap-3 mt-auto sticky bottom-0 bg-background z-10 border-t">
             {/* Footer for pending orders can be different if needed, or removed if not applicable */}
             {/* Example: Total for all pending orders */}
             {pendingOrderGroups.length > 0 && (
                <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Todos Pendientes:</span>
                    <span>{globalFormatCurrency(pendingOrderTotal)}</span>
                </div>
             )}
           </CardFooter>
        </Card>
      </div>

      {/* Modification Dialog */}
      <ModificationDialog
        isOpen={isModificationDialogOpen}
        onOpenChange={setIsModificationDialogOpen}
        item={selectedItemForModification}
        onConfirm={handleModificationConfirm}
        onCancel={handleModificationCancel}
      />

       {/* Payment Dialog */}
        {selectedPendingOrderGroup && (
            <PaymentDialog
                isOpen={isPaymentDialogOpen}
                onOpenChange={(open) => {
                    setIsPaymentDialogOpen(open);
                    if (!open) setSelectedPendingOrderGroup(null); // Clear selection when dialog closes
                }}
                totalAmount={selectedPendingOrderGroup.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) + ((tableIdParam === 'delivery' && selectedPendingOrderGroup.deliveryInfo?.deliveryFee) ? selectedPendingOrderGroup.deliveryInfo.deliveryFee : 0)}
                onConfirm={(method, tip, finalAmountWithTip) => handleFinalizePayment(selectedPendingOrderGroup, method, tip, finalAmountWithTip)}
            />
        )}


       {/* Delivery Info Dialog (only for delivery table) */}
       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo} // Pass existing data for editing
               onConfirm={handleDeliveryInfoConfirm}
               onCancel={handleDeliveryInfoCancel}
           />
       )}
    </div>
  );
}
