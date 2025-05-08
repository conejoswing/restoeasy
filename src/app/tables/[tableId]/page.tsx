









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
import { Badge } from '@/components/ui/badge'; // Added Badge import
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
} from "@/components/ui/table"; // Import Table components
import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard, ChevronRight, Banknote, Landmark, Home, Phone, User, DollarSign, PackageSearch, Edit } from 'lucide-react'; // Removed category specific icons
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
import { Dialog, DialogClose as EditDialogCloseButton, DialogContent as EditDialogContent, DialogDescription as EditDialogDescription, DialogFooter as EditDialogFooter, DialogHeader as EditDialogHeader, DialogTitle as EditDialogTitle } from '@/components/ui/dialog'; // Renamed DialogTitle for price edit to avoid conflict
import { Label } from '@/components/ui/label'; // For ProductsPage price edit


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
  ingredients?: string[]; // Keep ingredients on OrderItem for display in order summary
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
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
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
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Palta', 'Tomate']
    },
    {
      id: 11,
      name: 'Italiano Grande',
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con americana', 'sin americana', 'con chucrut', 'sin chucrut', 'con palta', 'sin palta'],
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
    { id: 106, name: 'Chacarero', price: 9800, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Tomate', 'Poroto Verde', 'Ají Verde'] }, // Removed Porotos Verdes from Fajita Chacarero as well
    { id: 107, name: 'Americana', price: 8900, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Queso', 'Champiñones', 'Jamón'] },
    { id: 108, name: 'Primavera', price: 9000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Palta', 'Choclo', 'Tomate'] },
    { id: 109, name: 'Golosasa', price: 10500, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Carne Fajita', 'Queso', 'Champiñones', 'Papas Hilo', 'Pimentón'] },
    { id: 110, name: '4 Ingredientes', price: 11000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno'] },
    { id: 111, name: '6 Ingredientes', price: 12000, category: 'Fajitas', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Lechuga', 'Pollo', 'Lomito', 'Vacuno'] },
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
         ingredients: ['Huevo Frito x2', 'Cebolla Frita', 'Bacon x2']
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
         ingredients: ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita']
    },
    {
        id: 57,
        name: 'Churrasco Dinamico',
        price: 7600,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana']
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
         ingredients: ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas']
    },
    {
        id: 60,
        name: 'Churrasco Queso Champiñon',
        price: 8100,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Queso Fundido', 'Champiñones Salteados']
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
         ingredients: ['Tomate', 'Chucrut', 'Americana', 'Bebida Lata']
    },
    {
        id: 26,
        name: 'Italiano',
        price: 6000,
        category: 'Promo Churrasco',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
         ingredients: ['Palta', 'Tomate', 'Bebida Lata']
    },
    { id: 73, name: 'Chacarero', price: 7000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso', 'con tomate', 'sin tomate', 'con aji oro', 'sin aji oro', 'con poroto verde', 'sin poroto verde', 'con aji jalapeño', 'sin aji jalapeño'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Verde', 'Bebida Lata'] },
    { id: 74, name: 'Queso', price: 6500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Bebida Lata'] },
    { id: 75, name: 'Palta', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Bebida Lata'] },
    { id: 76, name: 'Tomate', price: 6800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Bebida Lata'] },
    { id: 77, name: 'Brasileño', price: 7200, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Queso', 'Bebida Lata'] },
    { id: 78, name: 'Dinamico', price: 7300, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata'] },
    { id: 79, name: 'Campestre', price: 7500, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Bebida Lata'] },
    { id: 80, name: 'Queso Champiñon', price: 7800, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso Fundido', 'Champiñones Salteados', 'Bebida Lata'] },
    { id: 81, name: 'Che milico', price: 8000, category: 'Promo Churrasco', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas', 'Bebida Lata'] },
    // --- Promo Mechada --- (Updated Modifications where applicable)
    {
      id: 4,
      name: 'Completo',
      price: 8000,
      category: 'Promo Mechada',
       modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1000 },
        ingredients: ['Tomate', 'Chucrut', 'Americana', 'Bebida Lata']
    },
    {
      id: 24,
      name: 'Italiano',
      price: 7800,
      category: 'Promo Mechada',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 },
       ingredients: ['Palta', 'Tomate', 'Bebida Lata']
    },
     { id: 82, name: 'Chacarero', price: 9000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Poroto Verde', 'Ají Verde', 'Bebida Lata'] },
     { id: 83, name: 'Queso', price: 8500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso', 'Bebida Lata'] },
     { id: 84, name: 'Palta', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Bebida Lata'] },
     { id: 85, name: 'Tomate', price: 8800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Bebida Lata'] },
     { id: 86, name: 'Brasileño', price: 9200, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Palta', 'Queso', 'Bebida Lata'] },
     { id: 87, name: 'Dinamico', price: 9300, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Tomate', 'Palta', 'Chucrut', 'Americana', 'Bebida Lata'] },
     { id: 88, name: 'Campestre', price: 9500, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Bebida Lata'] },
     { id: 89, name: 'Queso Champiñon', price: 9800, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso Fundido', 'Champiñones Salteados', 'Bebida Lata'] },
     { id: 90, name: 'Che milico', price: 10000, category: 'Promo Mechada', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1000 }, ingredients: ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas', 'Bebida Lata'] },
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


// ProductsPage Component (embedded for simplicity, could be separate)
function ProductsPage({ onProductSelect }: { onProductSelect: (product: MenuItem) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [menu, setMenu] = useState<MenuItem[]>(sortMenu(mockMenu));
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isEditPriceDialogOpen, setIsEditPriceDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
    const [newPrice, setNewPrice] = useState('');
    const { toast } = useToast();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

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

        setMenu(prevMenu =>
            sortMenu(
                prevMenu.map(item =>
                    item.id === editingProduct.id ? { ...item, price: priceValue } : item
                )
            )
        );

        toast({ title: "Precio Actualizado", description: `El precio de ${editingProduct.name} se actualizó a ${formatCurrency(priceValue)}.`});
        setIsEditPriceDialogOpen(false);
        setEditingProduct(null);
        setNewPrice('');
    };

    // Filter categories or products based on search term and selected category
    const filteredCategories = useMemo(() => {
        if (selectedCategory) return []; // Don't show categories if one is selected
        return orderedCategories.filter(category =>
            mockMenu.some(item => item.category === category) // Only show categories with items
        );
    }, [selectedCategory]);

    const filteredProducts = useMemo(() => {
        if (!selectedCategory) return [];
        return menu.filter(product =>
            product.category === selectedCategory &&
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [menu, searchTerm, selectedCategory]);


    return (
        <div className="p-0">
             <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <h1 className="text-2xl font-bold">
                    {selectedCategory ? `${selectedCategory}` : "Categorías"}
                </h1>
                {/* Search input for categories or products */}
                 {(selectedCategory) && (
                    <Input
                        type="text"
                        placeholder="Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-xs"
                    />
                 )}
            </div>
            {selectedCategory && (
                <Button
                    variant="outline"
                    onClick={() => { setSelectedCategory(null); setSearchTerm(''); }}
                    className="mb-4 ml-4 bg-card hover:bg-accent"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Categorías
                </Button>
            )}
            <ScrollArea className="h-[calc(85vh-180px)] px-1"> {/* Adjusted height */}
                {!selectedCategory && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-3"> {/* Increased xl columns */}
                        {filteredCategories.length === 0 && searchTerm && (
                             <p className="text-muted-foreground text-center py-10 col-span-full">No se encontraron categorías.</p>
                        )}
                        {filteredCategories.map((category) => (
                            <Card key={category} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedCategory(category); setSearchTerm(''); }}>
                                <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base">{category}</CardTitle>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}

                {selectedCategory && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-3">  {/* Increased xl columns */}
                         {filteredProducts.length === 0 && (
                             <p className="text-muted-foreground text-center py-10 col-span-full">No se encontraron productos en esta categoría.</p>
                         )}
                        {filteredProducts.map((item) => (
                            <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow flex flex-col" onClick={() => onProductSelect(item)}>
                                <CardHeader className="p-3 pb-1 flex-grow">
                                    <CardTitle className="text-base">{item.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-1">
                                    <p className="text-sm font-semibold">{formatCurrency(item.price)}</p>
                                    {item.ingredients && item.ingredients.length > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            ({item.ingredients.join(', ')})
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Edit Price Dialog (moved from ProductsPage) */}
            <Dialog open={isEditPriceDialogOpen} onOpenChange={setIsEditPriceDialogOpen}>
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
                        <Button type="button" variant="secondary">Cancelar</Button>
                    </EditDialogCloseButton>
                    <Button type="submit" onClick={handleUpdatePrice}>Guardar Cambios</Button>
                </EditDialogFooter>
                </EditDialogContent>
            </Dialog>
        </div>
    );
}


export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const decodedTableId = decodeURIComponent(params.tableId as string);
  const tableIdParam = params.tableId as string; // "mesón", "delivery", or number as string
  const isDelivery = tableIdParam === 'delivery';

  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [pendingOrder, setPendingOrder] = useState<PendingOrderData | null>(null); // For orders waiting for payment
  const [orderTotal, setOrderTotal] = useState(0);
  const [pendingOrderTotal, setPendingOrderTotal] = useState(0);


  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [itemToModify, setItemToModify] = useState<MenuItem | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false); // For the product selection sheet
  const [isInitialized, setIsInitialized] = useState(false);


  // --- Inventory Management Integration ---
  const INVENTORY_STORAGE_KEY = 'restaurantInventory';

  const getInventory = (): InventoryItem[] => {
    if (typeof window === 'undefined') return [];
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    return storedInventory ? JSON.parse(storedInventory) : [];
  };

  const saveInventory = (inventory: InventoryItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  };

  const deductFromInventory = (orderItems: OrderItem[]) => {
    let currentInventory = getInventory();
    let inventoryUpdated = false;

    orderItems.forEach(orderItem => {
        let itemsToDeduct: { name: string; quantity: number }[] = [];

        // Common items
        if (orderItem.name.toLowerCase().includes('bebida 1.5lt')) itemsToDeduct.push({ name: 'Bebida 1.5Lt', quantity: orderItem.quantity });
        if (orderItem.name.toLowerCase().includes('lata')) itemsToDeduct.push({ name: 'Lata', quantity: orderItem.quantity });
        if (orderItem.name.toLowerCase().includes('cafe chico')) itemsToDeduct.push({ name: 'Cafe Chico', quantity: orderItem.quantity });
        if (orderItem.name.toLowerCase().includes('cafe grande')) itemsToDeduct.push({ name: 'Cafe Grande', quantity: orderItem.quantity });

        // Pan y Vienesas para Completos Vienesas
        if (orderItem.category === 'Completos Vienesas') {
            if (orderItem.name.includes('Normal')) {
                itemsToDeduct.push({ name: 'Pan especial normal', quantity: orderItem.quantity });
                itemsToDeduct.push({ name: 'Vienesas', quantity: orderItem.quantity });
            } else if (orderItem.name.includes('Grande')) {
                itemsToDeduct.push({ name: 'Pan especial grande', quantity: orderItem.quantity });
                itemsToDeduct.push({ name: 'Vienesas', quantity: orderItem.quantity * 2 });
            }
        }
        // Pan para Completos As
        if (orderItem.category === 'Completos As') {
             if (orderItem.name.includes('Normal')) itemsToDeduct.push({ name: 'Pan especial normal', quantity: orderItem.quantity });
             else if (orderItem.name.includes('Grande')) itemsToDeduct.push({ name: 'Pan especial grande', quantity: orderItem.quantity });
        }
        // Pan de Hamburguesa
        if (orderItem.category === 'Hamburguesas') {
            // Assuming all burgers use "Pan de hamburguesa normal" for now
            itemsToDeduct.push({ name: 'Pan de hamburguesa normal', quantity: orderItem.quantity });
        }
         // Pan Marraqueta para Churrascos y Promos
        if (orderItem.category === 'Churrascos' || orderItem.category.startsWith('Promo Churrasco') || orderItem.category.startsWith('Promo Mechada')) {
             let quantityPerItem = 1;
             // For promo churrasco/mechada, deduct 2 units of Pan de marraqueta if the name implies 2 items (e.g. "2x ...")
             // Update: Removed "2x" from promo names, so assuming single bread unit per promo item unless logic changes
             if (orderItem.category.startsWith('Promo') && (orderItem.name.startsWith('4') || ['Promo 3', 'Promo 9', 'Promo 10', 'Promo 11', 'Promo 12'].includes(orderItem.name))) {
                 quantityPerItem = 4;
             } else if (orderItem.category.startsWith('Promo') && (orderItem.name.startsWith('2') || ['Promo 4', 'Promo 5', 'Promo 6', 'Promo 7', 'Promo 8'].includes(orderItem.name))){
                 quantityPerItem = 2;
             }
            itemsToDeduct.push({ name: 'Pan de marraqueta', quantity: orderItem.quantity * quantityPerItem });
        }

         // Fajitas (Placeholder - assuming no specific inventory item for "fajita bread" yet)
         if (orderItem.category === 'Fajitas') {
            // console.log(`No specific inventory deduction rule for Fajita: ${orderItem.name}`);
            // Potentially add 'Tortillas' to inventory later
        }


        itemsToDeduct.forEach(deduction => {
            const inventoryItemIndex = currentInventory.findIndex(invItem => invItem.name.toLowerCase() === deduction.name.toLowerCase());
            if (inventoryItemIndex > -1) {
                currentInventory[inventoryItemIndex].stock = Math.max(0, currentInventory[inventoryItemIndex].stock - deduction.quantity);
                inventoryUpdated = true;
                console.log(`Deducted ${deduction.quantity} of ${deduction.name}. New stock: ${currentInventory[inventoryItemIndex].stock}`);
            } else {
                console.warn(`Inventory item "${deduction.name}" not found for deduction.`);
            }
        });
    });

    if (inventoryUpdated) {
        saveInventory(currentInventory);
        console.log("Inventory updated after deductions.");
    }
  };


  // --- STORAGE KEYS ---
  const CURRENT_ORDER_STORAGE_KEY = `table-${tableIdParam}-order`;
  const PENDING_ORDER_STORAGE_KEY = `table-${tableIdParam}-pending-order`;
  const DELIVERY_INFO_STORAGE_KEY = `deliveryInfo-${tableIdParam}`;
  const TABLE_STATUS_STORAGE_KEY = `table-${tableIdParam}-status`;

  // --- Initialization Effect (Load from Session Storage) ---
  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization

    console.log(`TableDetailPage: Initializing state for table/order ${tableIdParam}...`);

    // Load current order
    const storedCurrentOrder = sessionStorage.getItem(CURRENT_ORDER_STORAGE_KEY);
    if (storedCurrentOrder) {
        try {
            const parsedOrder = JSON.parse(storedCurrentOrder);
            if (Array.isArray(parsedOrder)) {
                setCurrentOrder(parsedOrder);
                console.log(`Loaded current order for ${tableIdParam}:`, parsedOrder);
            }
        } catch (e) { console.error(`Error parsing current order for ${tableIdParam}:`, e); }
    }

    // Load pending order
    const storedPendingOrder = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    if (storedPendingOrder) {
        try {
            const parsedPending = JSON.parse(storedPendingOrder) as PendingOrderData;
            // Basic validation for pending order structure
            if (parsedPending && Array.isArray(parsedPending.items) && typeof parsedPending.totalAmount === 'number') {
                 setPendingOrder(parsedPending);
                 console.log(`Loaded pending order for ${tableIdParam}:`, parsedPending);
            } else {
                 console.warn(`Invalid pending order structure for ${tableIdParam}. Clearing.`);
                 sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY);
            }
        } catch (e) { console.error(`Error parsing pending order for ${tableIdParam}:`, e); }
    }

    // Load delivery info (only for delivery table)
    if (isDelivery) {
        const storedDeliveryInfo = sessionStorage.getItem(DELIVERY_INFO_STORAGE_KEY);
        if (storedDeliveryInfo) {
            try {
                const parsedInfo = JSON.parse(storedDeliveryInfo) as DeliveryInfo;
                // Basic validation for delivery info structure
                if(parsedInfo && parsedInfo.name && parsedInfo.address && parsedInfo.phone && typeof parsedInfo.deliveryFee === 'number'){
                    setDeliveryInfo(parsedInfo);
                    console.log(`Loaded delivery info for ${tableIdParam}:`, parsedInfo);
                } else {
                    console.warn(`Invalid delivery info structure for ${tableIdParam}. Clearing.`);
                    sessionStorage.removeItem(DELIVERY_INFO_STORAGE_KEY);
                }
            } catch (e) { console.error(`Error parsing delivery info for ${tableIdParam}:`, e); }
        }
        // If delivery and no info, open dialog
        if (!deliveryInfo && !storedDeliveryInfo) { // Check both current state and storage
             console.log(`Delivery table ${tableIdParam} has no delivery info. Opening dialog.`);
            setIsDeliveryDialogOpen(true);
        }
    }
    setIsInitialized(true);
    console.log(`Initialization complete for ${tableIdParam}.`);

  }, [tableIdParam, isInitialized, isDelivery, deliveryInfo]); // Added deliveryInfo to dependencies


  // --- Effect to save state changes to sessionStorage and update table status ---
  useEffect(() => {
    if (!isInitialized) return; // Don't save until initialized

    // Save current order
    sessionStorage.setItem(CURRENT_ORDER_STORAGE_KEY, JSON.stringify(currentOrder));

    // Save pending order
    if (pendingOrder) {
        sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(pendingOrder));
    } else {
        sessionStorage.removeItem(PENDING_ORDER_STORAGE_KEY); // Clear if null
    }

    // Save delivery info
    if (isDelivery && deliveryInfo) {
        sessionStorage.setItem(DELIVERY_INFO_STORAGE_KEY, JSON.stringify(deliveryInfo));
    } else if (isDelivery && !deliveryInfo) {
        sessionStorage.removeItem(DELIVERY_INFO_STORAGE_KEY); // Clear if null for delivery
    }

    // Update table status
    const isOccupied = currentOrder.length > 0 || !!pendingOrder || (isDelivery && !!deliveryInfo);
    sessionStorage.setItem(TABLE_STATUS_STORAGE_KEY, isOccupied ? 'occupied' : 'available');
     console.log(`Table ${tableIdParam} status updated to: ${isOccupied ? 'occupied' : 'available'}`);


  }, [currentOrder, pendingOrder, deliveryInfo, tableIdParam, isDelivery, isInitialized]);


  // --- Calculate Totals ---
  useEffect(() => {
    const total = currentOrder.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
    setOrderTotal(total);
  }, [currentOrder]);

  useEffect(() => {
     const pendingTotal = pendingOrder ? pendingOrder.items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0) : 0;
     // Add delivery fee to pending total if applicable
     const finalPendingTotal = pendingOrder && pendingOrder.deliveryInfo && pendingOrder.deliveryInfo.deliveryFee
         ? pendingTotal + pendingOrder.deliveryInfo.deliveryFee
         : pendingTotal;
     setPendingOrderTotal(finalPendingTotal);
   }, [pendingOrder]);


  const calculateItemPrice = (basePrice: number, selectedMods?: string[], modPrices?: { [key: string]: number }): number => {
    let final = basePrice;
    if (selectedMods && modPrices) {
      selectedMods.forEach(mod => {
        final += modPrices[mod] ?? 0;
      });
    }
    return final;
  };

  const handleProductSelect = (product: MenuItem) => {
     if (product.modifications && product.modifications.length > 0) {
          setItemToModify(product);
          setIsModificationDialogOpen(true);
     } else {
          // Add directly if no modifications
          addItemToOrder(product, undefined);
     }
     setIsMenuSheetOpen(false); // Close menu sheet after selection or opening modification dialog
  };


  const addItemToOrder = (menuItem: MenuItem, selectedModifications?: string[]) => {
    const finalPrice = calculateItemPrice(menuItem.price, selectedModifications, menuItem.modificationPrices);
    const orderItemId = `${menuItem.id}-${selectedModifications?.join('-') || 'no-mods'}`;

    setCurrentOrder(prevOrder => {
      const existingItemIndex = prevOrder.findIndex(item => item.orderItemId === orderItemId);
      if (existingItemIndex > -1) {
        const updatedOrder = [...prevOrder];
        updatedOrder[existingItemIndex].quantity += 1;
        return updatedOrder;
      } else {
        return [
          ...prevOrder,
          {
            id: menuItem.id,
            orderItemId: orderItemId,
            name: menuItem.name,
            category: menuItem.category,
            quantity: 1,
            selectedModifications: selectedModifications,
            basePrice: menuItem.price,
            finalPrice: finalPrice,
            ingredients: menuItem.ingredients, // Store ingredients with the order item
          },
        ];
      }
    });
    toast({ title: "Producto Añadido", description: `${menuItem.name} añadido al pedido actual.` });
  };

  const handleConfirmModification = (mods: string[] | undefined) => {
    if (itemToModify) {
      addItemToOrder(itemToModify, mods);
    }
    setIsModificationDialogOpen(false);
    setItemToModify(null);
  };

  const updateOrderItemQuantity = (orderItemId: string, change: number) => {
    setCurrentOrder(prevOrder =>
      prevOrder
        .map(item =>
          item.orderItemId === orderItemId
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeOrderItem = (orderItemId: string) => {
    setCurrentOrder(prevOrder => prevOrder.filter(item => item.orderItemId !== orderItemId));
    toast({ title: "Producto Eliminado", description: "Producto eliminado del pedido actual.", variant: "destructive"});
  };


  const handlePrintKitchenOrder = () => {
      if (currentOrder.length === 0) {
          toast({ title: "Pedido Vacío", description: "Añada productos antes de imprimir la comanda.", variant: "destructive" });
          return;
      }

      // Format and print kitchen receipt
      const kitchenReceiptHtml = formatKitchenOrderReceipt(currentOrder, isDelivery ? `Delivery: ${deliveryInfo?.name || 'Cliente'}` : `Mesa ${decodedTableId}`, deliveryInfo);
      printHtml(kitchenReceiptHtml);
      toast({ title: "Comanda Impresa", description: "La comanda ha sido enviada a cocina." });

      // Move current order to pending order
      setPendingOrder(prevPending => {
          const newItems = [...(prevPending?.items || []), ...currentOrder];
          // Recalculate total for pending order based on new items
          const newTotalAmount = newItems.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);
          return {
              items: newItems,
              deliveryInfo: isDelivery ? deliveryInfo : null, // Only include delivery info for delivery table
              totalAmount: newTotalAmount // This will be updated by the useEffect for pendingOrderTotal
          };
      });

      // Clear current order
      setCurrentOrder([]);
  };


  const handlePayment = (paymentMethod: PaymentMethod) => {
    if (!pendingOrder || pendingOrder.items.length === 0) {
      toast({ title: "Error", description: "No hay pedido pendiente para pagar.", variant: "destructive" });
      setIsPaymentDialogOpen(false);
      return;
    }

    // Deduct items from inventory
    deductFromInventory(pendingOrder.items);

    // Add sale to cash movements
    const cashMovementsKey = 'cashMovements';
    const storedCashMovements = sessionStorage.getItem(cashMovementsKey);
    let cashMovements: CashMovement[] = storedCashMovements ? JSON.parse(storedCashMovements) : [];

    // Ensure IDs are numbers before finding the max
    const maxId = cashMovements.reduce((max, m) => Math.max(max, typeof m.id === 'number' ? m.id : 0), 0);
    const newMovementId = maxId + 1;

    const saleMovement: CashMovement = {
        id: newMovementId,
        date: new Date().toISOString(), // Store as ISO string
        category: 'Ingreso Venta',
        description: isDelivery ? `Venta Delivery: ${deliveryInfo?.name || 'Cliente'}` : `Venta Mesa ${decodedTableId}`,
        amount: pendingOrderTotal, // Use the total including delivery fee
        paymentMethod: paymentMethod,
        deliveryFee: isDelivery && deliveryInfo ? deliveryInfo.deliveryFee : 0, // Add delivery fee if applicable
    };
    cashMovements.push(saleMovement);
    sessionStorage.setItem(cashMovementsKey, JSON.stringify(cashMovements));

    // Format and print customer receipt
    const customerReceiptHtml = formatCustomerReceipt(pendingOrder.items, pendingOrderTotal, paymentMethod, tableIdParam, deliveryInfo);
    printHtml(customerReceiptHtml);

    toast({ title: "Pago Realizado", description: `Pago de ${formatCurrencyDisplay(pendingOrderTotal)} con ${paymentMethod} completado. Boleta impresa.` });

    // Clear pending order and delivery info (if applicable)
    setPendingOrder(null);
    if (isDelivery) {
        setDeliveryInfo(null);
         sessionStorage.removeItem(DELIVERY_INFO_STORAGE_KEY); // Also clear from storage
    }
     setCurrentOrder([]); // Also clear current order just in case
    sessionStorage.removeItem(TABLE_STATUS_STORAGE_KEY); // Mark table as available
    sessionStorage.setItem(TABLE_STATUS_STORAGE_KEY, 'available');


    setIsPaymentDialogOpen(false);
    router.push('/tables'); // Go back to tables overview
  };


  const handleConfirmDeliveryInfo = (info: DeliveryInfo) => {
    setDeliveryInfo(info);
    setIsDeliveryDialogOpen(false);
    toast({ title: "Datos de Envío Guardados", description: "Puede proceder a tomar el pedido." });
  };

  const handleCancelDeliveryDialog = () => {
    setIsDeliveryDialogOpen(false);
    // If delivery info is still null (meaning they cancelled without entering anything)
    // and it's a delivery table, redirect back or show a message.
    if (isDelivery && !deliveryInfo) {
        toast({ title: "Envío Cancelado", description: "Debe ingresar datos de envío para continuar.", variant: "destructive"});
        router.push('/tables'); // Or handle differently
    }
  };


  // Format currency consistently
  const formatCurrencyDisplay = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const goBackToTables = () => {
    router.push('/tables');
  };

  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando datos de la mesa...</div>;
  }

  return (
    <div className="container mx-auto p-4 flex flex-col h-screen">
        {/* Header with Back Button and Table ID */}
        <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={goBackToTables} className="bg-card hover:bg-accent">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Volver a Mesas
            </Button>
            <h1 className="text-3xl font-bold">
                {isDelivery ? 'Pedido Delivery' : `Mesa ${decodedTableId.toUpperCase()}`}
            </h1>
            <div className="w-auto min-w-[160px]"></div> {/* Adjusted spacer width */}
        </div>

        {/* Ver Menú Button - Centered */}
        <div className="flex justify-center mb-6">
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                <SheetTrigger asChild>
                     <Button size="lg" className="px-8 py-6 text-lg">
                        <PackageSearch className="mr-2 h-5 w-5"/> Ver Menú
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] w-full max-w-4xl mx-auto p-0 rounded-t-lg border-t-0"> {/* Wider sheet, no top border */}
                    <ProductsPage onProductSelect={handleProductSelect} />
                     <SheetClose asChild>
                         <Button variant="outline" className="absolute bottom-4 right-4">Confirmar</Button>
                     </SheetClose>
                </SheetContent>
            </Sheet>
        </div>


      {/* Main Content Area (Current Order and Pending Order side-by-side) */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">

        {/* Current Order Section */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-xl">Pedido Actual</CardTitle>
          </CardHeader>
           <ScrollArea className="flex-grow" style={{ maxHeight: 'calc(100vh - 360px)' }}> {/* Adjusted maxHeight */}
            <CardContent className="p-4">
                {currentOrder.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Añada productos del menú.</p>
                ) : (
                <div className="space-y-3">
                    {currentOrder.map(item => (
                    <div key={item.orderItemId} className="border p-3 rounded-md shadow-sm bg-background">
                        <div className="flex justify-between items-center font-bold">
                          <span className="flex-1 font-bold">{item.name}</span>
                        </div>
                        {item.selectedModifications && item.selectedModifications.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 font-bold">
                             ({item.selectedModifications.join(', ')})
                        </p>
                        )}
                         {item.ingredients && item.ingredients.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 font-bold">
                                [{item.ingredients.join(', ')}]
                            </p>
                         )}
                        <div className="flex items-center justify-end gap-2 mt-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => updateOrderItemQuantity(item.orderItemId, -1)}
                        >
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-primary"
                            onClick={() => updateOrderItemQuantity(item.orderItemId, 1)}
                        >
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeOrderItem(item.orderItemId)}
                        >
                            <XCircle className="h-4 w-4" />
                        </Button>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-4 border-t">
            <Button
              onClick={handlePrintKitchenOrder}
              disabled={currentOrder.length === 0}
              className="w-full"
              size="lg"
            >
              <Printer className="mr-2 h-5 w-5" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>


        {/* Pending Order Section */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-xl">Pedidos Pendientes de Pago</CardTitle>
             {isDelivery && deliveryInfo && (
                 <CardDescription className="text-sm">
                     <span className="font-bold">Enviar a:</span> {deliveryInfo.name} - {deliveryInfo.address} - {deliveryInfo.phone}<br/>
                     <span className="font-bold">Costo Envío:</span> {formatCurrencyDisplay(deliveryInfo.deliveryFee)}
                 </CardDescription>
             )}
          </CardHeader>
          <ScrollArea className="flex-grow" style={{ maxHeight: 'calc(100vh - 360px)' }}> {/* Adjusted maxHeight */}
            <CardContent className="p-4">
                {!pendingOrder || pendingOrder.items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay pedidos pendientes de pago.</p>
                ) : (
                <div className="space-y-3">
                    {pendingOrder.items.map(item => (
                    <div key={item.orderItemId} className="border p-3 rounded-md shadow-sm bg-background">
                        <div className="flex justify-between items-center font-bold">
                        <span className="flex-1 font-bold">{item.quantity}x {item.name}</span>
                        <span className="font-bold">{formatCurrencyDisplay(item.finalPrice * item.quantity)}</span>
                        </div>
                         {item.selectedModifications && item.selectedModifications.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 font-bold">
                             ({item.selectedModifications.join(', ')})
                        </p>
                        )}
                         {item.ingredients && item.ingredients.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 font-bold">
                                 [{item.ingredients.join(', ')}]
                            </p>
                         )}
                    </div>
                    ))}
                </div>
                )}
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-4 border-t flex-col items-stretch gap-2">
             <div className="flex justify-between items-center text-lg font-semibold">
               <span>Total Pendiente:</span>
               <span className="font-bold">{formatCurrencyDisplay(pendingOrderTotal)}</span>
             </div>
            <Button
              onClick={() => setIsPaymentDialogOpen(true)}
              disabled={!pendingOrder || pendingOrder.items.length === 0}
              className="w-full"
              size="lg"
              variant="default"
            >
              <CreditCard className="mr-2 h-5 w-5" /> Imprimir Pago
            </Button>
          </CardFooter>
        </Card>

      </div>


      {/* Modification Dialog */}
      {itemToModify && (
        <ModificationDialog
          isOpen={isModificationDialogOpen}
          onOpenChange={setIsModificationDialogOpen}
          item={itemToModify}
          onConfirm={handleConfirmModification}
          onCancel={() => {
            setIsModificationDialogOpen(false);
            setItemToModify(null);
          }}
        />
      )}

       {/* Payment Dialog */}
       <PaymentDialog
         isOpen={isPaymentDialogOpen}
         onOpenChange={setIsPaymentDialogOpen}
         totalAmount={pendingOrderTotal}
         onConfirm={handlePayment}
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














