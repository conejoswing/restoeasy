
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Import Table components
import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard, ChevronRight, Banknote, Landmark, Home, Phone, User, DollarSign, PackageSearch } from 'lucide-react';
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

interface MenuItem {
  id: number;
  name: string;
  price: number; // Base price
  category: string;
  modifications?: string[]; // Optional list of modifications
  modificationPrices?: { [key: string]: number }; // Optional map of modification name to additional price
  ingredients?: string[]; // Optional list of ingredients
}

export interface OrderItem extends Omit<MenuItem, 'price' | 'modificationPrices' | 'modifications' | 'ingredients'> {
  orderItemId: string;
  quantity: number;
  selectedModifications?: string[];
  basePrice: number;
  finalPrice: number;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta Débito' | 'Tarjeta Crédito' | 'Transferencia';

interface PendingOrderData {
    items: OrderItem[];
    deliveryInfo?: DeliveryInfo | null;
    totalAmount: number;
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
      ingredients: ['Palta', 'Tomate']
    },
    {
      id: 14,
      name: 'Italiano Grande',
      price: 4500,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
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
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 29,
        name: 'Completo Grande',
        price: 4800,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
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
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 35,
        name: 'Dinamico Grande',
        price: 4900,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    // --- Completos As --- (Updated mods for Dinamico and Chacarero)
    {
      id: 10,
      name: 'Italiano Normal',
      price: 5500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Palta', 'Tomate']
    },
    {
      id: 11,
      name: 'Italiano Grande',
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
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
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 46,
        name: 'Dinamico Grande',
        price: 7300,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 47,
        name: 'Chacarero Normal',
        price: 6700,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño']
    },
    {
        id: 48,
        name: 'Chacarero Grande',
        price: 7200,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Poroto Verde', 'Ají Oro', 'Ají Jalapeño']
    },
    {
        id: 49,
        name: 'Napolitano Normal',
        price: 6900,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con queso', 'sin queso', 'con tomate', 'sin tomate', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    {
        id: 50,
        name: 'Napolitano Grande',
        price: 7400,
        category: 'Completos As',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con queso', 'sin queso', 'con tomate', 'sin tomate', 'con oregano', 'sin oregano', 'con aceituna', 'sin aceituna'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    { id: 51, name: 'Queso Champiñon Normal', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Queso', 'Champiñon', 'Tocino'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino'] },
    { id: 52, name: 'Queso Champiñon Grande', price: 7500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'Queso', 'Champiñon', 'Tocino'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Champiñon', 'Tocino'] },
    // --- Fajitas --- (Updated to standard modifications)
    { id: 104, name: 'Italiana', price: 9500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Palta', 'Tomate'] },
    { id: 105, name: 'Brasileño', price: 9200, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Palta', 'Queso'] },
    { id: 106, name: 'Chacarero', price: 9800, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Tomate', 'Poroto Verde', 'Ají Verde'] },
    { id: 107, name: 'Americana', price: 8900, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Queso', 'Champiñones', 'Jamón'] },
    { id: 108, name: 'Primavera', price: 9000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Palta', 'Choclo', 'Tomate'] },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Queso', 'Champiñones', 'Papas Hilo', 'Pimentón'] },
    { id: 110, name: '4 Ingredientes', price: 11000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', '(Elegir 4)'] },
    { id: 111, name: '6 Ingredientes', price: 12000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', '(Elegir 6)'] },
    // --- Hamburguesas --- (Updated Modifications)
    {
        id: 17,
        name: 'Simple',
        price: 7000,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Carne Hamburguesa', 'Lechuga', 'Tomate']
    },
    {
        id: 18,
        name: 'Doble',
        price: 8500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Hamburguesa x2', 'Queso', 'Lechuga', 'Tomate']
    },
    {
        id: 67,
        name: 'Italiana',
        price: 7800,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Hamburguesa', 'Palta', 'Tomate']
    },
    {
        id: 68,
        name: 'Doble Italiana',
        price: 9500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Hamburguesa x2', 'Palta', 'Tomate']
    },
    {
        id: 69,
        name: 'Tapa Arteria',
        price: 10500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Hamburguesa x3', 'Queso x3', 'Huevo Frito', 'Cebolla Frita', 'Bacon']
    },
    {
        id: 70,
        name: 'Super Tapa Arteria',
        price: 13000,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Hamburguesa x4', 'Queso x4', 'Huevo Frito x2', 'Cebolla Frita', 'Bacon x2']
    },
    {
        id: 71,
        name: 'Big Cami',
        price: 9800,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Hamburguesa x2', 'Queso Cheddar x2', 'Lechuga', 'Pepinillos', 'Salsa Especial']
    },
    {
        id: 72,
        name: 'Super Big Cami',
        price: 12500,
        category: 'Hamburguesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Hamburguesa x4', 'Queso Cheddar x4', 'Lechuga', 'Pepinillos', 'Salsa Especial']
    },
    // --- Churrascos --- (Updated Modifications)
    {
        id: 19,
        name: 'Churrasco Italiano',
        price: 7500,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Palta', 'Tomate']
    },
    {
        id: 20,
        name: 'Churrasco Completo',
        price: 7200,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Tomate', 'Chucrut', 'Americana']
    },
    {
        id: 53,
        name: 'Churrasco Queso',
        price: 7100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Queso']
    },
    {
        id: 54,
        name: 'Churrasco Tomate',
        price: 7000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Tomate']
    },
    {
        id: 55,
        name: 'Churrasco Palta',
        price: 7300,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Palta']
    },
    {
        id: 56,
        name: 'Churrasco Campestre',
        price: 7800,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita']
    },
    {
        id: 57,
        name: 'Churrasco Dinamico',
        price: 7600,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Tomate', 'Palta', 'Chucrut', 'Americana']
    },
    {
        id: 58,
        name: 'Churrasco Napolitano',
        price: 7900,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Queso', 'Tomate', 'Orégano', 'Aceituna']
    },
    {
        id: 59,
        name: 'Churrasco Che milico',
        price: 8000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas']
    },
    {
        id: 60,
        name: 'Churrasco Queso Champiñon',
        price: 8100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Queso Fundido', 'Champiñones Salteados']
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
    { id: 63, name: 'Salchipapas', price: 7000, category: 'Papas Fritas', ingredients: ['Vienesas', 'Salsas'] },
    { id: 64, name: 'Chorrillana 2', price: 12000, category: 'Papas Fritas', ingredients: ['Carne', 'Cebolla Frita', 'Huevo Frito x2'] },
    { id: 65, name: 'Chorrillana 4', price: 18000, category: 'Papas Fritas', ingredients: ['Carne x2', 'Cebolla Frita x2', 'Huevo Frito x4'] },
    { id: 66, name: 'Box Cami', price: 15000, category: 'Papas Fritas', ingredients: ['Carne', 'Vienesa', 'Queso Fundido', 'Champiñones', 'Pimentón'] },
    // --- Promo Churrasco --- (Updated Modifications where applicable)
    {
        id: 25,
        name: 'Completo',
        price: 5500,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Tomate', 'Chucrut', 'Americana', 'Bebida Lata']
    },
    {
        id: 26,
        name: 'Italiano',
        price: 6000,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Carne Churrasco', 'Palta', 'Tomate', 'Bebida Lata']
    },
    { id: 73, name: 'Chacarero', price: 7000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Tomate', 'Poroto Verde', 'Ají Verde', 'Bebida Lata'] },
    { id: 74, name: 'Queso', price: 6500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Queso', 'Bebida Lata'] },
    { id: 75, name: 'Palta', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Palta', 'Bebida Lata'] },
    { id: 76, name: 'Tomate', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Tomate', 'Bebida Lata'] },
    { id: 77, name: 'Brasileño', price: 7200, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Palta', 'Queso', 'Bebida Lata'] },
    { id: 78, name: 'Dinamico', price: 7300, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata'] },
    { id: 79, name: 'Campestre', price: 7500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Bebida Lata'] },
    { id: 80, name: 'Queso Champiñon', price: 7800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Queso Fundido', 'Champiñones Salteados', 'Bebida Lata'] },
    { id: 81, name: 'Che milico', price: 8000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Churrasco', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas', 'Bebida Lata'] },
    // --- Promo Mechada --- (Updated Modifications where applicable)
    {
      id: 4,
      name: 'Completo',
      price: 8000,
      category: 'Promo Mechada',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Carne Mechada', 'Tomate', 'Chucrut', 'Americana', 'Bebida Lata']
    },
    {
      id: 24,
      name: 'Italiano',
      price: 7800,
      category: 'Promo Mechada',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Carne Mechada', 'Palta', 'Tomate', 'Bebida Lata']
    },
     { id: 82, name: 'Chacarero', price: 9000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Tomate', 'Poroto Verde', 'Ají Verde', 'Bebida Lata'] },
     { id: 83, name: 'Queso', price: 8500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Queso', 'Bebida Lata'] },
     { id: 84, name: 'Palta', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Palta', 'Bebida Lata'] },
     { id: 85, name: 'Tomate', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Tomate', 'Bebida Lata'] },
     { id: 86, name: 'Brasileño', price: 9200, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Palta', 'Queso', 'Bebida Lata'] },
     { id: 87, name: 'Dinamico', price: 9300, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata'] },
     { id: 88, name: 'Campestre', price: 9500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Bebida Lata'] },
     { id: 89, name: 'Queso Champiñon', price: 9800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Queso Fundido', 'Champiñones Salteados', 'Bebida Lata'] },
     { id: 90, name: 'Che milico', price: 10000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Mechada', 'Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas', 'Bebida Lata'] },
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
    { id: 92, name: 'Promo 5', price: 7000, category: 'Promociones', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Promo 5 Placeholder'] },
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
     // --- Colaciones --- (No modifications usually)
].filter(item => !(item.category === 'Fajitas' && [1, 2, 8].includes(item.id)));


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


export default function TableDetailPage() {
  const params = useParams();
  const tableIdParam = params.tableId as string;
  const router = useRouter();
  const { toast } = useToast();

  const [order, setOrder] = useState<OrderItem[]>([]);
  const [pendingOrder, setPendingOrder] = useState<OrderItem[]>([]);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [itemToModify, setItemToModify] = useState<MenuItem | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [currentMenuCategory, setCurrentMenuCategory] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);


  const isDelivery = tableIdParam === 'delivery';

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const deductFromInventory = (itemsToDeduct: OrderItem[]) => {
      const storedInventory = localStorage.getItem('restaurantInventory');
      if (!storedInventory) {
          console.warn("Inventario no encontrado para deducción.");
          return;
      }

      let inventory: InventoryItem[] = JSON.parse(storedInventory);

      itemsToDeduct.forEach(orderItem => {
          const menuItem = mockMenu.find(m => m.id === orderItem.id);
          if (!menuItem) return;

          let ingredientToDeduct: string | null = null;
          let quantityMultiplier = 1;

          switch (menuItem.category) {
            case 'Completos Vienesas':
              if (menuItem.name.includes(' Normal') || menuItem.name.includes(' Chico')) {
                ingredientToDeduct = 'Pan Especial Normal';
              } else if (menuItem.name.includes(' Grande')) {
                ingredientToDeduct = 'Pan Especial Grande';
              }
              break;
            case 'Completos As':
                if (menuItem.name.includes(' Normal') || menuItem.name.includes(' Chico')) {
                    ingredientToDeduct = 'Pan Especial Normal';
                } else if (menuItem.name.includes(' Grande')) {
                    ingredientToDeduct = 'Pan Especial Grande';
                }
                break;
            case 'Churrascos':
              ingredientToDeduct = 'Pan de Marraqueta';
              break;
            case 'Promo Churrasco':
            case 'Promo Mechada':
              ingredientToDeduct = 'Pan de Marraqueta';
              if (menuItem.category.startsWith('Promo ')) {
                  quantityMultiplier = 2;
              }
              break;
            case 'Hamburguesas':
               if (menuItem.name.includes(' Normal') || menuItem.name.includes(' Simple') || menuItem.name.includes('Big Cami') ) {
                  ingredientToDeduct = 'Pan de Hamburguesa Normal';
                } else if (menuItem.name.includes(' Grande') || menuItem.name.includes(' Doble') || menuItem.name.includes('Tapa Arteria') || menuItem.name.includes('Super')) {
                  ingredientToDeduct = 'Pan de Hamburguesa Grande';
               }
              break;
            case 'Bebidas':
                if (menuItem.name === 'Bebida 1.5Lt') {
                    ingredientToDeduct = 'Bebida 1.5Lt';
                } else if (menuItem.name === 'Lata') {
                    ingredientToDeduct = 'Lata';
                } else if (menuItem.name === 'Cafe Chico') {
                    ingredientToDeduct = 'Cafe Chico';
                } else if (menuItem.name === 'Cafe Grande') {
                     ingredientToDeduct = 'Cafe Grande';
                }
                break;
             case 'Fajitas':
                ingredientToDeduct = 'Tortilla';
                break;
          }

          if (ingredientToDeduct) {
              const inventoryItemIndex = inventory.findIndex(
                  invItem => invItem.name.toLowerCase() === ingredientToDeduct!.toLowerCase()
              );
              if (inventoryItemIndex !== -1) {
                  const quantityToDeduct = orderItem.quantity * quantityMultiplier;
                  inventory[inventoryItemIndex].stock = Math.max(
                      0,
                      inventory[inventoryItemIndex].stock - quantityToDeduct
                  );
                  console.log(`Deducted ${quantityToDeduct} of ${ingredientToDeduct} for ${orderItem.name}. New stock: ${inventory[inventoryItemIndex].stock}`);
              } else {
                  console.warn(`Ingrediente principal "${ingredientToDeduct}" no encontrado en inventario para ${orderItem.name}.`);
              }
          }

          if (menuItem.category === 'Completos Vienesas') {
            const vienesaItemIndex = inventory.findIndex(invItem => invItem.name.toLowerCase() === 'vienesas');
            if (vienesaItemIndex !== -1) {
                let vienesaQuantityToDeduct = 0;
                if (menuItem.name.toLowerCase().includes(' normal') || menuItem.name.toLowerCase().includes(' chico')) {
                    vienesaQuantityToDeduct = orderItem.quantity;
                } else if (menuItem.name.toLowerCase().includes(' grande')) {
                     vienesaQuantityToDeduct = orderItem.quantity * 2;
                }

                if (vienesaQuantityToDeduct > 0) {
                   inventory[vienesaItemIndex].stock = Math.max(
                       0,
                       inventory[vienesaItemIndex].stock - vienesaQuantityToDeduct
                   );
                    console.log(`Deducted ${vienesaQuantityToDeduct} of Vienesas for ${orderItem.name}. New stock: ${inventory[vienesaItemIndex].stock}`);
                }
            } else {
                 console.warn(`Ingrediente "Vienesas" no encontrado en el inventario para deducir.`);
            }
          }

          menuItem.ingredients?.forEach(ingredientName => {
            const nonDeductiblePlaceholders = ['(elegir 4)', '(elegir 6)', 'salsas'];
            const alreadyHandled = ingredientToDeduct && ingredientName.toLowerCase() === ingredientToDeduct.toLowerCase();
            const isPlaceholder = nonDeductiblePlaceholders.includes(ingredientName.toLowerCase());
             const isBreadOrMeatOrBase = [
                 'pan especial normal', 'pan especial grande', 'pan de marraqueta',
                 'pan de hamburguesa normal', 'pan de hamburguesa grande',
                 'vienesa', 'vienesa x2', 'carne as', 'carne fajita', 'carne hamburguesa', 'carne hamburguesa x2',
                 'carne hamburguesa x3', 'carne hamburguesa x4', 'carne churrasco', 'carne mechada', 'tortilla',
                 'papas fritas', 'bebida lata', 'bebida 1.5lt', 'cafe chico', 'cafe grande'
             ].includes(ingredientName.toLowerCase());

            if (alreadyHandled || isPlaceholder || isBreadOrMeatOrBase) {
                return;
            }

            const inventoryItemIndex = inventory.findIndex(
                invItem => invItem.name.toLowerCase() === ingredientName.toLowerCase()
            );

            if (inventoryItemIndex !== -1) {
                inventory[inventoryItemIndex].stock = Math.max(
                    0,
                    inventory[inventoryItemIndex].stock - orderItem.quantity
                );
                 console.log(`Deducted ${orderItem.quantity} of secondary ingredient ${ingredientName} for ${orderItem.name}. New stock: ${inventory[inventoryItemIndex].stock}`);
            } else {
                console.warn(`Ingrediente secundario "${ingredientName}" para "${orderItem.name}" no encontrado en el inventario.`);
            }
          });
      });

      localStorage.setItem('restaurantInventory', JSON.stringify(inventory));
      console.log("Inventario actualizado después de la deducción.");
  };

   useEffect(() => {
       if (!tableIdParam || isInitialized) return;

       console.log(`Initializing state for table: ${tableIdParam}`);

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
                sessionStorage.removeItem(`table-${tableIdParam}-order`);
           }
       }

       const storedPendingOrderData = sessionStorage.getItem(`table-${tableIdParam}-pending-order`);
       if (storedPendingOrderData) {
           try {
               const parsedPendingOrder: PendingOrderData = JSON.parse(storedPendingOrderData);
               if (parsedPendingOrder && Array.isArray(parsedPendingOrder.items)) {
                   setPendingOrder(parsedPendingOrder.items);
                   if (isDelivery && parsedPendingOrder.deliveryInfo) {
                       setDeliveryInfo(parsedPendingOrder.deliveryInfo);
                       console.log(`Loaded delivery info with pending order for table ${tableIdParam}:`, parsedPendingOrder.deliveryInfo);
                   }
                   console.log(`Loaded pending order for table ${tableIdParam}:`, parsedPendingOrder.items);
               }
           } catch (e) {
                console.error(`Error parsing pending order for table ${tableIdParam}:`, e);
                sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);
           }
       }

       if (isDelivery && !deliveryInfo) {
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
           }
       }
        if (isDelivery && !deliveryInfo && !sessionStorage.getItem(`deliveryInfo-${tableIdParam}`) && !sessionStorage.getItem(`table-${tableIdParam}-pending-order`)) {
            console.log(`Delivery table ${tableIdParam} has no info, opening dialog.`);
            setIsDeliveryDialogOpen(true);
        }

       setIsInitialized(true);
       console.log(`Initialization complete for ${tableIdParam}.`);

   }, [tableIdParam, isInitialized, isDelivery, deliveryInfo, isDeliveryDialogOpen]);


  useEffect(() => {
      if (!tableIdParam || !isInitialized) return;

      console.log(`Saving state for table: ${tableIdParam}`);

      if (order.length > 0) {
          sessionStorage.setItem(`table-${tableIdParam}-order`, JSON.stringify(order));
          console.log(`Saved current order for table ${tableIdParam}:`, order);
      } else {
          sessionStorage.removeItem(`table-${tableIdParam}-order`);
          console.log(`Removed current order for table ${tableIdParam} as it is empty.`);
      }

      const pendingOrderData: PendingOrderData = {
          items: pendingOrder,
          deliveryInfo: isDelivery ? deliveryInfo : null,
          totalAmount: calculateTotal(pendingOrder) + (isDelivery && deliveryInfo ? deliveryInfo.deliveryFee : 0)
      };
      if (pendingOrder.length > 0 || (isDelivery && deliveryInfo)) {
          sessionStorage.setItem(`table-${tableIdParam}-pending-order`, JSON.stringify(pendingOrderData));
          console.log(`Saved pending order data for table ${tableIdParam}:`, pendingOrderData);
      } else {
          sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);
          console.log(`Removed pending order data for table ${tableIdParam} as it is empty.`);
      }

       if (isDelivery && deliveryInfo) {
           sessionStorage.setItem(`deliveryInfo-${tableIdParam}`, JSON.stringify(deliveryInfo));
           console.log(`Saved delivery info for table ${tableIdParam}:`, deliveryInfo);
       } else if (isDelivery && !deliveryInfo) {
           sessionStorage.removeItem(`deliveryInfo-${tableIdParam}`);
           console.log(`Removed delivery info for table ${tableIdParam} as it is null.`);
       }

      const isTableOccupied = order.length > 0 || pendingOrder.length > 0 || (isDelivery && deliveryInfo !== null);
      const newStatus = isTableOccupied ? 'occupied' : 'available';
      const currentStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);

      if (newStatus !== currentStatus) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
        console.log(`Updated status for table ${tableIdParam} to: ${newStatus}`);
      }

  }, [order, pendingOrder, deliveryInfo, tableIdParam, isInitialized, isDelivery]);


  const handleAddItem = (item: MenuItem, modifications?: string[]) => {
    let modificationCost = 0;
    if (modifications && item.modificationPrices) {
      modifications.forEach(modName => {
        modificationCost += item.modificationPrices![modName] ?? 0;
      });
    }

    const newItem: OrderItem = {
      id: item.id,
      orderItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: item.name,
      category: item.category,
      quantity: 1,
      selectedModifications: modifications,
      basePrice: item.price,
      finalPrice: item.price + modificationCost,
    };

    setOrder((prevOrder) => {
        const existingItemIndex = prevOrder.findIndex(
            (orderedItem) =>
            orderedItem.id === newItem.id &&
            isEqual(orderedItem.selectedModifications?.sort(), newItem.selectedModifications?.sort())
        );

        if (existingItemIndex > -1) {
            const updatedOrder = [...prevOrder];
            updatedOrder[existingItemIndex].quantity += 1;
            return updatedOrder;
        } else {
            return [...prevOrder, newItem];
        }
    });
    toast({ title: `${item.name} añadido`, description: modifications ? `Modificaciones: ${modifications.join(', ')}` : "Sin modificaciones." });
    setIsModificationDialogOpen(false);
    setItemToModify(null);
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
        .filter(item => item.quantity > 0)
    );
  };

  const handleOpenModificationDialog = (item: MenuItem) => {
    setItemToModify(item);
    setIsModificationDialogOpen(true);
  };

  const calculateTotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
  };

  const currentOrderTotal = useMemo(() => calculateTotal(order), [order]);
  const pendingOrderTotal = useMemo(() => {
      const itemsTotal = calculateTotal(pendingOrder);
      const fee = isDelivery && deliveryInfo ? deliveryInfo.deliveryFee : 0;
      return itemsTotal + fee;
  }, [pendingOrder, deliveryInfo, isDelivery]);

  const handlePrintComanda = () => {
    if (order.length === 0) {
      toast({ title: "Pedido Vacío", description: "Añada artículos antes de imprimir la comanda.", variant: "destructive" });
      return;
    }

    const kitchenReceiptHtml = formatKitchenOrderReceipt(order, tableIdParam, deliveryInfo);
    printHtml(kitchenReceiptHtml);

    toast({ title: "Comanda Impresa", description: `Enviando pedido para ${isDelivery ? 'Delivery' : `Mesa ${tableIdParam}`}.` });

    setPendingOrder(prevPending => [...prevPending, ...order]);
    setOrder([]);
  };

  const handleInitiatePayment = () => {
      if (pendingOrder.length === 0) {
          toast({ title: "Sin Pedido Pendiente", description: "No hay artículos pendientes de pago.", variant: "destructive"});
          return;
      }
      setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = (paymentMethod: PaymentMethod) => {
    setIsPaymentDialogOpen(false);

    deductFromInventory(pendingOrder);

    const customerReceiptHtml = formatCustomerReceipt(pendingOrder, pendingOrderTotal, paymentMethod, tableIdParam, deliveryInfo);
    printHtml(customerReceiptHtml);

    const cashMovementsStorageKey = 'cashMovements';
    const storedCashMovements = sessionStorage.getItem(cashMovementsStorageKey);
    let cashMovements: CashMovement[] = storedCashMovements ? JSON.parse(storedCashMovements) : [];

    const maxId = cashMovements.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);

    const newSaleMovement: CashMovement = {
      id: maxId + 1,
      date: new Date().toISOString(),
      category: 'Ingreso Venta',
      description: `Venta Mesa ${tableIdParam}${isDelivery && deliveryInfo ? ` (Delivery: ${deliveryInfo.name})` : ''}`,
      amount: pendingOrderTotal,
      paymentMethod: paymentMethod,
      deliveryFee: isDelivery && deliveryInfo ? deliveryInfo.deliveryFee : undefined,
    };
    cashMovements.push(newSaleMovement);
    sessionStorage.setItem(cashMovementsStorageKey, JSON.stringify(cashMovements));

    toast({ title: "Pago Confirmado", description: `Total: ${formatCurrency(pendingOrderTotal)} pagado con ${paymentMethod}.` });

    setPendingOrder([]);
    if (isDelivery) {
        setDeliveryInfo(null);
        sessionStorage.removeItem(`deliveryInfo-${tableIdParam}`);
    }
  };

  const menuCategories = useMemo(() => {
    const categories = new Set(mockMenu.map(item => item.category));
    return orderedCategories.filter(cat => categories.has(cat));
  }, []);

  const filteredMenu = useMemo(() => {
    let itemsToDisplay = mockMenu;

    if (currentMenuCategory) {
      itemsToDisplay = itemsToDisplay.filter(item => item.category === currentMenuCategory);
    }

    if (searchTerm) {
      itemsToDisplay = itemsToDisplay.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (currentMenuCategory ? false : item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return sortMenu(itemsToDisplay);
  }, [searchTerm, currentMenuCategory]);

  const handleCategoryClick = (category: string) => {
      setCurrentMenuCategory(category);
      setSearchTerm('');
  };

  const handleBackToCategories = () => {
      setCurrentMenuCategory(null);
      setSearchTerm('');
  };

  const handleMenuSheetOpenChange = (open: boolean) => {
    setIsMenuSheetOpen(open);
    if (!open) {
        setCurrentMenuCategory(null); // Reset category view when sheet closes
        setSearchTerm(''); // Clear search
    }
  };


   const handleConfirmDeliveryInfo = (info: DeliveryInfo) => {
       setDeliveryInfo(info);
       setIsDeliveryDialogOpen(false);
       toast({ title: "Datos de Envío Guardados", description: `Cliente: ${info.name}, Envío: ${formatCurrency(info.deliveryFee)}` });
   };

   const handleCancelDeliveryDialog = () => {
       setIsDeliveryDialogOpen(false);
       if (!deliveryInfo && isDelivery) {
           toast({ title: "Envío Cancelado", description: "Debe ingresar datos de envío para continuar.", variant: "destructive" });
           router.push('/tables');
       }
   };

   if (!isInitialized && !tableIdParam) {
       return <div className="flex items-center justify-center min-h-screen">Cargando Mesa...</div>;
   }
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
         <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => router.push('/tables')} className="px-3 py-2 h-10 w-10 sm:px-4 sm:w-auto">
                <ArrowLeft className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Volver a Mesas</span>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-center flex-grow">
                {isDelivery ? (deliveryInfo ? `Delivery: ${deliveryInfo.name}` : 'Pedido Delivery') : `Mesa ${tableIdParam}`}
            </h1>
            {isDelivery && deliveryInfo && (
                 <Button variant="ghost" size="sm" onClick={() => setIsDeliveryDialogOpen(true)}>
                     <ChevronRight className="h-4 w-4"/>
                 </Button>
            )}
        </div>

        <div className="flex justify-center mb-6">
             <Sheet open={isMenuSheetOpen} onOpenChange={handleMenuSheetOpenChange}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-8 py-6 text-lg">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
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

                    <ScrollArea className="flex-grow p-4">
                        {currentMenuCategory ? (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredMenu.map((item) => (
                                <Card key={item.id} className="flex flex-col overflow-hidden">
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-base">{item.name}
                                        {item.ingredients && item.ingredients.length > 0 && (
                                            <span className="text-xs italic ml-2 font-normal text-muted-foreground">({item.ingredients.join(', ')})</span>
                                        )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 flex-grow">
                                        <p className="text-sm text-muted-foreground">
                                           Precio: {formatCurrency(item.price)}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {menuCategories.map((category) => (
                                <Button
                                    key={category}
                                    variant="outline"
                                    className="justify-between h-auto py-3 px-4 text-left text-base sm:text-lg hover:bg-accent/80"
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
                </SheetContent>
            </Sheet>
        </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
            <Card className="flex flex-col overflow-hidden h-full">
                <CardHeader className="pb-2 pt-4 px-4">
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
                                <div className="flex-grow font-bold">
                                    <p className="text-sm">{item.name} </p>
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
                    <CardFooter className="p-3 mt-auto border-t">
                        <Button onClick={handlePrintComanda} className="w-full">
                            <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <Card className="flex flex-col overflow-hidden h-full">
                <CardHeader className="pb-2 pt-4 px-4">
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
                                         <div className="flex-grow font-bold">
                                            <p className="text-sm">
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
                                    <div className="flex justify-between items-center font-bold">
                                        <p className="text-sm">Costo Envío</p>
                                        <span className="text-sm">{formatCurrency(deliveryInfo.deliveryFee)}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </ScrollArea>
                {(pendingOrder.length > 0 || (isDelivery && deliveryInfo)) && (
                    <CardFooter className="p-3 mt-auto border-t flex flex-col gap-2">
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

        <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            totalAmount={pendingOrderTotal}
            onConfirm={handleConfirmPayment}
        />

       {isDelivery && (
           <DeliveryDialog
               isOpen={isDeliveryDialogOpen}
               onOpenChange={setIsDeliveryDialogOpen}
               initialData={deliveryInfo}
               onConfirm={handleConfirmDeliveryInfo}
               onCancel={handleCancelDeliveryDialog}
           />
       )}
    </div>
  );
}
