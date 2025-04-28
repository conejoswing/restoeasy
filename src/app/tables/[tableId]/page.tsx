

'use client';

import * as React from 'react';
import {useState, useEffect} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter, // Added CardFooter import
} from '@/components/ui/card';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Utensils, PlusCircle, MinusCircle, XCircle, Printer, ArrowLeft, CreditCard, ChevronRight } from 'lucide-react'; // Added ChevronRight
import {useToast} from '@/hooks/use-toast';
import ModificationDialog from '@/components/app/modification-dialog';
import { isEqual } from 'lodash';
import { cn } from '@/lib/utils';
import type { CashMovement } from '@/app/expenses/page'; // Import CashMovement type

interface MenuItem {
  id: number;
  name: string;
  price: number; // Base price
  category: string;
  modifications?: string[]; // Optional list of modifications
  modificationPrices?: { [key: string]: number }; // Optional map of modification name to additional price
}

// OrderItem now includes an array of selected modifications and the calculated price
interface OrderItem extends Omit<MenuItem, 'price' | 'modificationPrices' | 'modifications'> {
  orderItemId: string; // Unique ID for this specific item instance in the order
  quantity: number;
  selectedModifications?: string[]; // Array of selected mods
  basePrice: number; // Store the original base price
  finalPrice: number; // Store the calculated price (base + modifications)
}


// Mock data - replace with actual API calls - Updated prices to CLP
const mockMenu: MenuItem[] = [
    // --- Completos Vienesas ---
    {
      id: 13,
      name: 'Italiano Normal',
      price: 4000,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 } // Add price for cheese
    },
    {
      id: 14,
      name: 'Italiano grande',
      price: 4500,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 } // Example: Add price for cheese here too if applicable
    },
     {
      id: 15,
      name: 'Hot Dog Normal',
      price: 4200,
      category: 'Completos Vienesas',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Chucrut', 'Tomate', 'Americana', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1000 } // Add price for cheese
    },
     {
        id: 27,
        name: 'Hot Dog Grande',
        price: 4700,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Chucrut', 'Tomate', 'Americana', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
     {
        id: 28,
        name: 'Completo Normal',
        price: 4300,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Chucrut', 'Tomate', 'Americana', 'Salsa Verde', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 29,
        name: 'Completo Grande',
        price: 4800,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Chucrut', 'Tomate', 'Americana', 'Salsa Verde', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 30,
        name: 'Palta Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 31,
        name: 'Palta Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
     {
        id: 32,
        name: 'Tomate Normal',
        price: 4100,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 33,
        name: 'Tomate Grande',
        price: 4600,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 34,
        name: 'Dinamico Normal',
        price: 4400,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    {
        id: 35,
        name: 'Dinamico Grande',
        price: 4900,
        category: 'Completos Vienesas',
        modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 }
    },
    // --- Completos As ---
    {
      id: 10,
      name: 'Italiano Normal', // Changed from 'Completo As Italiano'
      price: 5500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1200 } // Different price example
    },
    {
      id: 11,
      name: 'Italiano Grande', // Changed from 'Completo As Dinámico'
      price: 6000,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'],
      modificationPrices: { 'Agregado Queso': 1200 }
    },
    {
      id: 12,
      name: 'Completo Normal', // Changed from 'Completo As Chacarero'
      price: 6500,
      category: 'Completos As',
      modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'],
       modificationPrices: { 'Agregado Queso': 1200 }
    },
    // --- Newly added Completos As ---
    { id: 36, name: 'Completo Grande', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 37, name: 'Palta Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 38, name: 'Palta Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 39, name: 'Tomate Normal', price: 5800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 40, name: 'Tomate Grande', price: 6300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 41, name: 'Queso Normal', price: 6000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde'], modificationPrices: { 'Agregado Queso': 1200 } }, // Assume no 'Agregado Queso' if it's already cheese based
    { id: 42, name: 'Queso Grande', price: 6500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 43, name: 'Solo Carne Normal', price: 5000, category: 'Completos As' }, // Example: No mods by default
    { id: 44, name: 'Solo Carne Grande', price: 5500, category: 'Completos As' },
    { id: 45, name: 'Dinamico Normal', price: 6800, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 46, name: 'Dinamico Grande', price: 7300, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Salsa Verde', 'Americana', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 47, name: 'Chacarero Normal', price: 6700, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Porotos Verdes', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 48, name: 'Chacarero Grande', price: 7200, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Porotos Verdes', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 49, name: 'Napolitano Normal', price: 6900, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Queso Fundido', 'Orégano', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 50, name: 'Napolitano Grande', price: 7400, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Queso Fundido', 'Orégano', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 51, name: 'Queso Champiñon Normal', price: 7000, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Queso Fundido', 'Champiñones Salteados', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    { id: 52, name: 'Queso Champiñon Grande', price: 7500, category: 'Completos As', modifications: ['Mayonesa Casera', 'Mayonesa Envasada', 'Sin Mayo', 'Ají Verde', 'Queso Fundido', 'Champiñones Salteados', 'Agregado Queso'], modificationPrices: { 'Agregado Queso': 1200 } },
    // --- End of newly added Completos As ---
    // --- Fajitas ---
    {
      id: 1,
      name: 'Italiano chico',
      price: 8990,
      category: 'Fajitas',
      modifications: ['Con Queso', 'Sin Cebolla', 'Extra Carne', 'Ají Verde', 'Agregado Queso'], // Simpler modifications + Ají Verde + Agregado Queso
      modificationPrices: { 'Con Queso': 500, 'Extra Carne': 1000, 'Agregado Queso': 1000 }, // Example prices + Cheese
    },
    {
      id: 2,
      name: 'Italiano grande',
      price: 12500,
      category: 'Fajitas',
      modifications: ['Con Queso', 'Sin Cebolla', 'Extra Carne', 'Ají', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Con Queso': 800, 'Extra Carne': 1500, 'Agregado Queso': 1000 }, // + Cheese
    },
     {
      id: 8,
      name: 'Filete',
      price: 18000,
      category: 'Fajitas',
      modifications: ['Ají Verde', 'Agregado Queso'], // Added modifications
      modificationPrices: { 'Agregado Queso': 1000 }, // Added cheese price
    },
    // --- Hamburguesas --- (New Category)
    {
        id: 17,
        name: 'Simple', // Changed name
        price: 7000,
        category: 'Hamburguesas',
        modifications: ['Doble Carne', 'Queso Cheddar', 'Bacon', 'Sin Pepinillos', 'Agregado Queso'],
        modificationPrices: { 'Doble Carne': 2000, 'Queso Cheddar': 800, 'Bacon': 1000, 'Agregado Queso': 1000 },
    },
    {
        id: 18,
        name: 'Doble', // Changed name
        price: 8500,
        category: 'Hamburguesas',
        modifications: ['Queso Azul', 'Cebolla Caramelizada', 'Rúcula', 'Agregado Queso'],
        modificationPrices: { 'Queso Azul': 1200, 'Agregado Queso': 1000 },
    },
    { // Start new IDs after the last used ID (66)
        id: 67,
        name: 'Italiana',
        price: 7800, // Example price
        category: 'Hamburguesas',
        modifications: ['Palta', 'Tomate', 'Mayonesa Casera', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 68,
        name: 'Doble Italiana',
        price: 9500, // Example price
        category: 'Hamburguesas',
        modifications: ['Doble Carne', 'Palta', 'Tomate', 'Mayonesa Casera', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Doble Carne': 2000, 'Agregado Queso': 1000 },
    },
    {
        id: 69,
        name: 'Tapa Arteria',
        price: 10500, // Example price
        category: 'Hamburguesas',
        modifications: ['Queso Cheddar', 'Bacon', 'Huevo Frito', 'Cebolla Frita', 'Agregado Queso'],
        modificationPrices: { 'Queso Cheddar': 800, 'Bacon': 1000, 'Huevo Frito': 800, 'Cebolla Frita': 500, 'Agregado Queso': 1000 },
    },
    {
        id: 70,
        name: 'Super Tapa Arteria',
        price: 13000, // Example price
        category: 'Hamburguesas',
        modifications: ['Doble Carne', 'Doble Queso Cheddar', 'Doble Bacon', 'Huevo Frito', 'Cebolla Frita', 'Agregado Queso'],
        modificationPrices: { 'Doble Carne': 2000, 'Doble Queso Cheddar': 1600, 'Doble Bacon': 2000, 'Huevo Frito': 800, 'Cebolla Frita': 500, 'Agregado Queso': 1000 },
    },
    {
        id: 71,
        name: 'Big Cami',
        price: 9800, // Example price
        category: 'Hamburguesas',
        modifications: ['Triple Carne', 'Triple Queso', 'Pepinillos', 'Lechuga', 'Salsa Especial', 'Agregado Queso'],
        modificationPrices: { 'Triple Carne': 3000, 'Triple Queso': 2400, 'Agregado Queso': 1000 },
    },
    {
        id: 72,
        name: 'Super Big Cami',
        price: 12500, // Example price
        category: 'Hamburguesas',
        modifications: ['Cuádruple Carne', 'Cuádruple Queso', 'Pepinillos', 'Lechuga', 'Salsa Especial', 'Agregado Queso'],
        modificationPrices: { 'Cuádruple Carne': 4000, 'Cuádruple Queso': 3200, 'Agregado Queso': 1000 },
    },
    // --- End of added Hamburguesas ---
    // --- Churrascos --- (New Category & Items)
    {
        id: 19,
        name: 'Churrasco Italiano',
        price: 7500,
        category: 'Churrascos',
        modifications: ['Palta', 'Tomate', 'Mayonesa Casera', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 20,
        name: 'Churrasco Completo', // Changed from Churrasco Luco
        price: 7200,
        category: 'Churrascos',
        modifications: ['Queso Fundido', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 53, // Start IDs after last Completos As ID
        name: 'Churrasco Queso',
        price: 7100,
        category: 'Churrascos',
        modifications: ['Agregado Queso'], // Can still add more cheese
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 54,
        name: 'Churrasco Tomate',
        price: 7000,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 55,
        name: 'Churrasco Palta',
        price: 7300,
        category: 'Churrascos',
        modifications: ['Mayonesa Casera', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 56,
        name: 'Churrasco Campestre',
        price: 7800,
        category: 'Churrascos',
        modifications: ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 57,
        name: 'Churrasco Dinamico',
        price: 7600,
        category: 'Churrascos',
        modifications: ['Palta', 'Tomate', 'Mayonesa Casera', 'Salsa Verde', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 58,
        name: 'Churrasco Napolitano',
        price: 7900,
        category: 'Churrascos',
        modifications: ['Queso Fundido', 'Jamón', 'Tomate', 'Orégano', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 59,
        name: 'Churrasco Che milico',
        price: 8000,
        category: 'Churrascos',
        modifications: ['Queso Fundido', 'Huevo Frito', 'Cebolla Frita', 'Papas Fritas', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    {
        id: 60,
        name: 'Churrasco Queso Champiñon',
        price: 8100,
        category: 'Churrascos',
        modifications: ['Queso Fundido', 'Champiñones Salteados', 'Ají Verde', 'Agregado Queso'],
        modificationPrices: { 'Agregado Queso': 1000 },
    },
    // --- Papas Fritas --- (New Category)
    {
        id: 21,
        name: 'Papas Fritas Normal', // Changed name
        price: 3500,
        category: 'Papas Fritas',
        modifications: ['Agregar Queso Fundido', 'Agregar Salsa Cheddar'],
        modificationPrices: { 'Agregar Queso Fundido': 1500, 'Agregar Salsa Cheddar': 1200 },
    },
    {
        id: 22,
        name: 'Papas Fritas Mediana', // Changed name
        price: 5000,
        category: 'Papas Fritas',
        modifications: ['Queso Cheddar', 'Bacon', 'Cebolla Crispy', 'Salsa BBQ'],
        modificationPrices: { 'Queso Cheddar': 1200, 'Bacon': 1000 },
    },
    { id: 61, name: 'Papas Fritas Grande', price: 6500, category: 'Papas Fritas', modifications: ['Queso Cheddar', 'Bacon'], modificationPrices: { 'Queso Cheddar': 1500, 'Bacon': 1200 } }, // Example modifications and prices
    { id: 62, name: 'Papas Fritas XL', price: 8000, category: 'Papas Fritas', modifications: ['Queso Cheddar', 'Bacon'], modificationPrices: { 'Queso Cheddar': 2000, 'Bacon': 1500 } },
    { id: 63, name: 'Salchipapas', price: 7000, category: 'Papas Fritas', modifications: ['Agregar Huevo Frito'], modificationPrices: { 'Agregar Huevo Frito': 800 } },
    { id: 64, name: 'Chorrillana 2', price: 12000, category: 'Papas Fritas', modifications: ['Carne Mechada', 'Cebolla Caramelizada'], modificationPrices: { 'Carne Mechada': 2000 } },
    { id: 65, name: 'Chorrillana 4', price: 18000, category: 'Papas Fritas', modifications: ['Doble Carne', 'Extra Queso'], modificationPrices: { 'Doble Carne': 3000, 'Extra Queso': 1500 } },
    { id: 66, name: 'Box Cami', price: 15000, category: 'Papas Fritas', modifications: ['Alitas BBQ', 'Nuggets Pollo'], modificationPrices: { 'Alitas BBQ': 1000, 'Nuggets Pollo': 800 } },
    // --- Café ---
    {
      id: 3,
      name: 'Dinamico chico',
      price: 6500,
      category: 'Café',
    },
    {
      id: 7,
      name: 'Alitas de Pollo',
      price: 9500,
      category: 'Café',
    },
     // --- Colaciones --- (New Category - now empty after renaming below)
    // --- Promo Churrasco --- (Previously Colaciones)
    {
        id: 25,
        name: 'Promo Pollo Asado + Acompañamiento', // Updated name
        price: 5500,
        category: 'Promo Churrasco', // Updated Category
        // Add modifications if needed
    },
    {
        id: 26,
        name: 'Promo Mechada + Acompañamiento', // Updated name
        price: 6000,
        category: 'Promo Churrasco', // Updated Category
        // Add modifications if needed
    },
    // --- Promo Mechada ---
    {
      id: 4,
      name: 'Dinamico grande',
      price: 3000,
      category: 'Promo Mechada', // Category already Promo Mechada
    },
    {
      id: 24, // New Promo Mechada
      name: 'Promo Mechada', // Keep name for now, but ensure ID is unique
      price: 7000, // Example price
      category: 'Promo Mechada', // Keep in Promotions category
    },
    // --- Promociones ---
    {
      id: 6,
      name: 'Completo grande',
      price: 4500,
      category: 'Promociones',
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Agregado Queso': 1000 }, // + Cheese
    },
     {
      id: 5,
      name: 'Completo chico',
      price: 2000,
      category: 'Promociones',
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Agregado Queso': 1000 }, // + Cheese
    },
    {
      id: 23, // Promo Churrasco already exists with ID 25/26
      name: 'Promo Churrasco Simple', // Make name unique
      price: 6000, // Example price
      category: 'Promociones',
      // No modifications by default for promos, unless specified
    },
    // --- Bebidas ---
    {
      id: 9,
      name: 'Agua',
      price: 1000,
      category: 'Bebidas',
    },
     {
      id: 16, // Example
      name: 'Coca-Cola',
      price: 1500,
      category: 'Bebidas',
    },
     // --- Colaciones --- (Added back)
    // Add items for Colaciones here if needed
];

// Define the desired order for categories
const orderedCategories = [
  'Completos Vienesas',
  'Completos As',
  'Fajitas',
  'Hamburguesas', // Added
  'Churrascos',   // Added
  'Papas Fritas', // Added
  'Café',
  'Promo Churrasco', // Changed from Colaciones
  'Promo Mechada', // Added
  'Promociones',
  'Bebidas',
   'Colaciones', // Added back
];


// Helper function to compare modification arrays (order insensitive)
const compareModifications = (arr1?: string[], arr2?: string[]): boolean => {
    if (!arr1 && !arr2) return true; // Both undefined/null
    if (!arr1 || !arr2) return false; // One is undefined/null, the other isn't
    if (arr1.length !== arr2.length) return false;
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return isEqual(sortedArr1, sortedArr2); // Use lodash isEqual for deep comparison
};

// Storage key for cash movements
const CASH_MOVEMENTS_STORAGE_KEY = 'cashMovements';

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
    return a.name.localeCompare(b.name);
  });
};

export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tableIdParam = params.tableId as string;
  const [order, setOrder] = useState<OrderItem[]>([]); // Current items being added
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<OrderItem[]>([]); // Items sent to print
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);
  const [currentItemForModification, setCurrentItemForModification] = useState<MenuItem | null>(null);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false); // State for Menu Sheet
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization
  const [menuSheetView, setMenuSheetView] = useState<'categories' | 'items'>('categories'); // State for sheet view
  const [selectedCategoryForItemsView, setSelectedCategoryForItemsView] = useState<string | null>(null); // State for selected category in items view
  const [menuData, setMenuData] = useState<MenuItem[]>([]); // State for menu data


  // --- Load orders, status, and menu from sessionStorage/mock on mount ---
  useEffect(() => {
    if (!tableIdParam || isInitialized) return; // Avoid running multiple times or without ID

    console.log(`Initializing state for table ${tableIdParam}...`);

    // --- Load Orders ---
    const storedCurrentOrder = sessionStorage.getItem(`table-${tableIdParam}-order`);
    const storedPendingOrder = sessionStorage.getItem(`table-${tableIdParam}-pending-order`);
    let parsedCurrentOrder: OrderItem[] = [];
    let parsedPendingOrder: OrderItem[] = [];

    if (storedCurrentOrder) {
      try {
        const parsed = JSON.parse(storedCurrentOrder);
        if (Array.isArray(parsed)) parsedCurrentOrder = parsed;
        else console.warn(`Invalid current order data for table ${tableIdParam}.`);
      } catch (error) {
        console.error(`Failed to parse stored current order for table ${tableIdParam}:`, error);
      }
    }
    if (storedPendingOrder) {
       try {
         const parsed = JSON.parse(storedPendingOrder);
         if (Array.isArray(parsed)) parsedPendingOrder = parsed;
         else console.warn(`Invalid pending order data for table ${tableIdParam}.`);
       } catch (error) {
         console.error(`Failed to parse stored pending order for table ${tableIdParam}:`, error);
       }
     }
     setOrder(parsedCurrentOrder);
     setPendingPaymentOrder(parsedPendingOrder);

     // --- Load Menu ---
     // For now, we always load from mock data, but you could add storage logic here
     const sortedInitialMenu = sortMenu(mockMenu);
     setMenuData(sortedInitialMenu);
     console.log("Loaded menu data.");


    // --- Determine and Update Table Status ---
    const hasCurrentItems = parsedCurrentOrder.length > 0;
    const hasPendingItems = parsedPendingOrder.length > 0;
    let newStatus: 'available' | 'occupied' = 'available';

    if (hasCurrentItems || hasPendingItems) {
      newStatus = 'occupied';
    }
    const currentStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);
    if (currentStatus !== newStatus) {
       console.log(`Updating status for table ${tableIdParam} from ${currentStatus || 'none'} to ${newStatus}`);
       sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
    } else {
       console.log(`Status for table ${tableIdParam} is already ${currentStatus}`);
    }

    setIsInitialized(true); // Mark initialization as complete
    console.log(`Initialization complete for table ${tableIdParam}.`);

  }, [tableIdParam, isInitialized]); // Dependencies ensure this runs once per table ID


  // --- Save orders and update status to sessionStorage whenever they change ---
   useEffect(() => {
     // Only run this effect *after* initial state is loaded
     if (!isInitialized || !tableIdParam) return;

     console.log(`Saving state for table ${tableIdParam}...`);

     const hasCurrentItems = order.length > 0;
     const hasPendingItems = pendingPaymentOrder.length > 0;

     // Save current order
     if (hasCurrentItems) {
        sessionStorage.setItem(`table-${tableIdParam}-order`, JSON.stringify(order));
        console.log(`Saved current order for table ${tableIdParam}.`);
     } else {
        sessionStorage.removeItem(`table-${tableIdParam}-order`);
        console.log(`Removed current order for table ${tableIdParam}.`);
     }

      // Save pending order
     if (hasPendingItems) {
        sessionStorage.setItem(`table-${tableIdParam}-pending-order`, JSON.stringify(pendingPaymentOrder));
         console.log(`Saved pending order for table ${tableIdParam}.`);
     } else {
        sessionStorage.removeItem(`table-${tableIdParam}-pending-order`);
         console.log(`Removed pending order for table ${tableIdParam}.`);
     }

     // Update table status based on whether items exist in either order
     const newStatus = (hasCurrentItems || hasPendingItems) ? 'occupied' : 'available';
     const currentStatus = sessionStorage.getItem(`table-${tableIdParam}-status`);

     if (currentStatus !== newStatus) {
        sessionStorage.setItem(`table-${tableIdParam}-status`, newStatus);
        console.log(`Updated status for table ${tableIdParam} to ${newStatus}.`);
     }

   }, [order, pendingPaymentOrder, tableIdParam, isInitialized]);


  // Helper to format currency
  const formatCurrency = (amount: number) => {
    // Format as CLP with no decimals
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  // Function to handle clicking a category (from Categories view in Sheet)
  const handleCategoryClick = (category: string) => {
    setSelectedCategoryForItemsView(category);
    setMenuSheetView('items'); // Switch to items view
  };

  // Function to handle clicking a menu item (from Items view in Sheet)
  const handleItemClick = (item: MenuItem) => {
    if (item.modifications && item.modifications.length > 0) {
      setCurrentItemForModification(item);
      setIsModificationDialogOpen(true); // Open modification dialog
      // setIsMenuSheetOpen(false); // Keep menu sheet open
    } else {
      // If no modifications, add directly to current order
      addToOrder(item);
      // Do not automatically close the sheet
      // setIsMenuSheetOpen(false); // Close menu sheet
    }
  };

  // Function to handle confirming modification selection (now receives an array)
  const handleModificationConfirm = (modifications: string[] | undefined) => {
    if (currentItemForModification) {
      addToOrder(currentItemForModification, modifications);
      setCurrentItemForModification(null); // Reset after adding
    }
    setIsModificationDialogOpen(false);
  };

  // Updated addToOrder to handle an array of modifications and their prices
  const addToOrder = (item: MenuItem, modifications?: string[]) => {
    // Calculate total modification cost
    const totalModificationCost = modifications?.reduce((acc, mod) => {
      return acc + (item.modificationPrices?.[mod] ?? 0);
    }, 0) ?? 0;
    const finalItemPrice = item.price + totalModificationCost;

    // Update the current order state
    setOrder((prevOrder) => {
       // Check if an identical item *with the exact same set of modifications* already exists in the *current* order
      const existingItemIndex = prevOrder.findIndex(
        (orderItem) => orderItem.id === item.id && compareModifications(orderItem.selectedModifications, modifications)
      );

      if (existingItemIndex > -1) {
        // Increment quantity of the existing item in the current order
        const updatedOrder = [...prevOrder];
        updatedOrder[existingItemIndex] = {
          ...updatedOrder[existingItemIndex],
          quantity: updatedOrder[existingItemIndex].quantity + 1,
        };
        return updatedOrder;
      } else {
         // Add as a new item to the current order
         // Omit original modifications list from OrderItem
        const { price, modificationPrices, modifications: itemMods, ...itemWithoutPricesAndMods } = item;
        const newOrderItem: OrderItem = {
          ...itemWithoutPricesAndMods, // Spread remaining item props (id, name, category)
          orderItemId: `${item.id}-${Date.now()}-${Math.random()}`, // Generate unique ID
          quantity: 1,
          selectedModifications: modifications, // Store array of selected mods
          basePrice: item.price, // Store original base price
          finalPrice: finalItemPrice, // Store calculated final price
        };
        return [...prevOrder, newOrderItem];
      }
    });

    // Format modifications string for toast
    const modificationsString = modifications && modifications.length > 0
        ? ` (${modifications.join(', ')})`
        : '';

    const toastTitle = `${item.name}${modificationsString} añadido`;

    toast({
        title: toastTitle,
        variant: "default",
        className: "bg-secondary text-secondary-foreground"
      })
  };


  // Updated removeFromOrder to use orderItemId - Only removes from the *current* order
  const removeFromOrder = (orderItemId: string) => {
    setOrder((prevOrder) => {
      const existingItemIndex = prevOrder.findIndex((item) => item.orderItemId === orderItemId);
      if (existingItemIndex === -1) return prevOrder; // Item not found in current order

      const updatedOrder = [...prevOrder];
      if (updatedOrder[existingItemIndex].quantity > 1) {
        updatedOrder[existingItemIndex] = {
          ...updatedOrder[existingItemIndex],
          quantity: updatedOrder[existingItemIndex].quantity - 1,
        };
         toast({ title: `Cantidad reducida`, variant: "default" });
        return updatedOrder;
      } else {
        // Remove the item completely if quantity is 1
        const itemToRemove = updatedOrder[existingItemIndex];
        const modsString = itemToRemove.selectedModifications?.join(', ');
        toast({ title: `${itemToRemove.name}${modsString ? ` (${modsString})` : ''} eliminado del pedido actual`, variant: "destructive" });
        // Filter out the item
        const filteredOrder = updatedOrder.filter((item) => item.orderItemId !== orderItemId);
        return filteredOrder;
      }
    });
  };

  // Updated removeCompletely to use orderItemId - Only removes from the *current* order
   const removeCompletely = (orderItemId: string) => {
     const itemToRemove = order.find(item => item.orderItemId === orderItemId);
     const modsString = itemToRemove?.selectedModifications?.join(', ');
     setOrder((prevOrder) => {
        const filteredOrder = prevOrder.filter((orderItem) => orderItem.orderItemId !== orderItemId);
        return filteredOrder;
     });
      toast({
        title: `${itemToRemove?.name}${modsString ? ` (${modsString})` : ''} eliminado del pedido actual`, // Specify current order
        variant: "destructive",
      })
   }


  // Calculate total based on finalPrice of each OrderItem
  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce(
      (total, item) => total + item.finalPrice * item.quantity,
      0
    );
  };

  const handlePrintOrder = () => {
     if (order.length === 0) {
       toast({ title: "Error", description: "No hay artículos en el pedido actual para imprimir.", variant: "destructive" });
       return;
     }

     console.log('Imprimiendo Comanda (Pedido Actual):', order);

     // --- Merge current order into pending payment order ---
     // Create deep copies to avoid state mutation issues
     const currentPendingCopy = JSON.parse(JSON.stringify(pendingPaymentOrder));
     const currentOrderToMove = JSON.parse(JSON.stringify(order));

     currentOrderToMove.forEach((currentItem: OrderItem) => {
         const existingIndex = currentPendingCopy.findIndex((pendingItem: OrderItem) =>
             pendingItem.id === currentItem.id &&
             compareModifications(pendingItem.selectedModifications, currentItem.selectedModifications)
         );
         if (existingIndex > -1) {
             // Item exists, increase quantity
             currentPendingCopy[existingIndex].quantity += currentItem.quantity;
             console.log(`Increased quantity for existing pending item: ${currentItem.name}`);
         } else {
             // New item, add it
             currentPendingCopy.push(currentItem);
              console.log(`Added new item to pending: ${currentItem.name}`);
         }
     });

     // --- Update state ---
     setPendingPaymentOrder(currentPendingCopy); // Update pending order state
     setOrder([]); // Clear the current order state

     // Status update is handled by the save useEffect hook

     // Calculate total of *new combined pending order*
     const newPendingTotal = calculateTotal(currentPendingCopy);

     toast({
       title: "¡Comanda Enviada!",
       description: `Total Pendiente Actualizado: ${formatCurrency(newPendingTotal)}.`, // Show the new total for pending order
       variant: "default",
       className: "bg-green-200 text-green-800 border-green-400" // Using direct colors temporarily for success
     });
  };

   // Helper to get the next available cash movement ID
   const getNextMovementId = (currentMovements: CashMovement[]): number => {
      return currentMovements.length > 0 ? Math.max(...currentMovements.map((m) => m.id)) + 1 : 1;
  };

    const handlePrintPayment = () => {
       if (pendingPaymentOrder.length === 0) {
         toast({ title: "Error", description: "No hay artículos pendientes para imprimir el pago.", variant: "destructive" });
         return;
       }

       const finalTotalToPay = calculateTotal(pendingPaymentOrder); // Calculate final total here

       console.log('Imprimiendo Boleta/Factura (Pedido Pendiente):', pendingPaymentOrder);
       console.log('Total a Pagar:', formatCurrency(finalTotalToPay));

       // --- Add sale to cash movements in sessionStorage ---
       try {
            const storedMovements = sessionStorage.getItem(CASH_MOVEMENTS_STORAGE_KEY);
            let currentMovements: CashMovement[] = [];
            if (storedMovements) {
                const parsed = JSON.parse(storedMovements);
                if (Array.isArray(parsed)) {
                    // Parse dates back to Date objects
                     currentMovements = parsed.map((m: any) => ({ ...m, date: new Date(m.date) }));
                }
            }

            const newMovementId = getNextMovementId(currentMovements);
            const saleMovement: CashMovement = {
                id: newMovementId,
                date: new Date(), // Use current date/time for the sale
                category: 'Ingreso Venta',
                description: `Venta ${getPageTitle()}`, // Description includes table/source
                amount: finalTotalToPay, // Positive amount for income
            };

            // Add the new sale and sort (most recent first)
            const updatedMovements = [...currentMovements, saleMovement].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Save back to sessionStorage (store dates as ISO strings)
            sessionStorage.setItem(CASH_MOVEMENTS_STORAGE_KEY, JSON.stringify(
                 updatedMovements.map(m => ({...m, date: m.date instanceof Date ? m.date.toISOString() : m.date }))
             ));
            console.log(`Sale of ${formatCurrency(finalTotalToPay)} registered in cash movements.`);

       } catch (error) {
            console.error("Error registering sale in cash movements:", error);
            toast({title: "Error Interno", description: "No se pudo registrar la venta en la caja.", variant: "destructive"});
            // Decide if you want to proceed with clearing the pending order even if saving fails
            // return; // Option: Stop here if saving fails
       }


       // --- Clear pending order and update status ---
       setPendingPaymentOrder([]); // Clear the pending order state immediately

       // Status update is handled by the save useEffect hook

       toast({
         title: "¡Pago Impreso!",
         description: `Boleta/Factura por ${formatCurrency(finalTotalToPay)} impresa. Venta registrada en caja. Mesa disponible si no hay pedido actual.`,
         variant: "default",
         className: "bg-blue-200 text-blue-800 border-blue-400" // Using direct colors for payment success
       });
     };

  // Filter menu items based on the selected category (used in Items view)
  const filteredMenu = menuData.filter( // Use menuData state here
    (item) => item.category === selectedCategoryForItemsView
  );

  const currentOrderTotal = calculateTotal(order); // Calculate current order total (though not displayed directly)
  const pendingOrderTotal = calculateTotal(pendingPaymentOrder); // Calculate pending total

  const getPageTitle = () => {
      if (!tableIdParam) return 'Cargando...'; // Handle case where param might be missing initially
      if (tableIdParam === 'mezon') {
          return 'Mezón';
      } else if (tableIdParam === 'delivery') {
          return 'Delivery';
      } else {
          return `Mesa ${tableIdParam}`;
      }
  }

  // Render Menu Categories or Items inside the Sheet based on view state
  const renderMenuSheetContent = () => {
    if (menuSheetView === 'categories') {
        return (
            <div className="p-4">
                <ScrollArea className="h-[calc(100vh-150px)]"> {/* Adjusted height */}
                    <ul className="space-y-2">
                        {orderedCategories.map((category) => (
                            <li
                                key={category}
                                className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => handleCategoryClick(category)}
                            >
                                <span className="font-medium">{category}</span>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </div>
        );
    } else if (menuSheetView === 'items' && selectedCategoryForItemsView) {
        return (
            <div className="p-4 flex flex-col h-full"> {/* Use flex-col and h-full */}
                <Button variant="ghost" onClick={() => setMenuSheetView('categories')} className="mb-4 self-start"> {/* Align button left */}
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Categorías
                </Button>
                {/* Make ScrollArea take remaining height */}
                <ScrollArea className="flex-grow">
                    <ul className="space-y-2">
                        {filteredMenu.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between items-center p-3 border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => handleItemClick(item)} // Use handleItemClick
                            >
                                <span className="font-medium">{item.name}</span>
                                <span className="text-sm text-muted-foreground">{formatCurrency(item.price)}</span>
                            </li>
                        ))}
                        {filteredMenu.length === 0 && (
                            <p className="text-muted-foreground col-span-full text-center pt-4">No hay artículos en esta categoría.</p>
                        )}
                    </ul>
                </ScrollArea>
            </div>
        );
    }
    return null; // Should not happen
  };

   // Function to close the menu sheet and reset view state
   const closeMenuSheet = () => {
        setIsMenuSheetOpen(false);
        // Reset view state when closing
        setTimeout(() => { // Delay reset slightly to allow animation
            setMenuSheetView('categories');
            setSelectedCategoryForItemsView(null);
        }, 300);
   };


   // Render function for both current and pending order items
   const renderOrderItems = (items: OrderItem[], isPendingSection: boolean = false) => {
       if (items.length === 0) {
           return <p className="text-muted-foreground text-center">
               {isPendingSection ? "No hay artículos pendientes de pago." : "Aún no se han añadido artículos al pedido actual."}
           </p>;
       }

       return (
         <ul className="space-y-3">
           {items.map((item) => (
             <li key={item.orderItemId} className="flex items-center justify-between">
               <div className='flex items-center gap-2'>
                 <div>
                   <span className="font-medium text-sm">{item.name}</span>
                    {item.selectedModifications && item.selectedModifications.length > 0 && (
                      <p className="text-xs text-muted-foreground">({item.selectedModifications.join(', ')})</p>
                    )}
                    {/* Show final price only in pending section */}
                    {isPendingSection && (
                        <p className='text-xs text-muted-foreground font-mono'>{formatCurrency(item.finalPrice)}</p>
                    )}
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 {/* Conditionally render +/- buttons only for current order */}
                 {!isPendingSection ? (
                     <>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromOrder(item.orderItemId)}>
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => {
                             // Use menuData state to find the original item
                            const originalItem = menuData.find(menuItem => menuItem.id === item.id);
                            if (originalItem) {
                                // Re-adding needs to consider modifications
                                addToOrder(originalItem, item.selectedModifications);
                            }
                        }}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                          {/* Button to remove completely - only for current order */}
                         <Button
                             variant="ghost"
                             size="icon"
                             className="h-6 w-6 text-destructive/70"
                             onClick={() => removeCompletely(item.orderItemId)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                     </>
                 ) : (
                    // For pending section, just show quantity x price
                    <span className="font-medium w-auto text-right text-sm">{item.quantity} x {formatCurrency(item.finalPrice)}</span>
                 )}
               </div>
             </li>
           ))}
         </ul>
       );
     };

  // Show loading indicator until initialization is complete
  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Cargando datos de la mesa...</div>;
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-theme(spacing.16))] flex flex-col">
       <div className="flex items-center mb-4"> {/* Reduced margin bottom */}
         <Button variant="secondary" size="icon" onClick={() => router.push('/tables')} className="mr-2 h-10 w-10 rounded-md bg-card hover:bg-accent">
           <ArrowLeft className="h-6 w-6" />
         </Button>
         <h1 className="text-3xl font-bold">{getPageTitle()} - Pedido</h1>
       </div>

        {/* Menu Button Centered Above */}
        <div className="flex justify-center mb-4">
            <Button
                onClick={() => setIsMenuSheetOpen(true)}
                className="h-12 text-md bg-primary hover:bg-primary/90" // Adjusted size/text
            >
                <Utensils className="mr-2 h-5 w-5" /> Ver Menú
            </Button>
        </div>

        {/* Order Summaries Side-by-Side */}
      <div className="flex flex-grow gap-4 overflow-hidden">
        {/* Current Order Section */}
        <Card className="w-1/2 flex flex-col shadow-lg"> {/* Use w-1/2 */}
          <CardHeader>
            <CardTitle>Pedido Actual</CardTitle>
            <CardDescription>Artículos para la próxima comanda.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {renderOrderItems(order, false)}
            </ScrollArea>
          </CardContent>
          <Separator />
          <CardFooter className="p-4 flex flex-col items-stretch gap-2">
             {/* No total shown in current order footer */}
            <Button size="sm" onClick={handlePrintOrder} disabled={order.length === 0}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir Comanda
            </Button>
          </CardFooter>
        </Card>

        {/* Pending Payment Order Section */}
        <Card className="w-1/2 flex flex-col shadow-lg"> {/* Use w-1/2 */}
          <CardHeader>
            <CardTitle>Pedido Pendiente de Pago</CardTitle>
            <CardDescription>Comandas impresas esperando pago.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full p-4">
              {renderOrderItems(pendingPaymentOrder, true)}
            </ScrollArea>
          </CardContent>
          <Separator />
          <CardFooter className="p-4 flex flex-col items-stretch gap-2">
            <div className="flex justify-between items-center text-md font-semibold">
              <span>Total Pendiente:</span>
              <span className='font-mono'>{formatCurrency(pendingOrderTotal)}</span>
            </div>
            <Button size="sm" variant="default" onClick={handlePrintPayment} disabled={pendingPaymentOrder.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
              <CreditCard className="mr-2 h-4 w-4" /> Imprimir Pago
            </Button>
          </CardFooter>
        </Card>
      </div>

        {/* Menu Sheet Component */}
        <Sheet open={isMenuSheetOpen} onOpenChange={closeMenuSheet}> {/* Use closeMenuSheet */}
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0" side="left"> {/* Removed padding p-0 */}
                <SheetHeader className="flex-shrink-0 p-4 pb-0"> {/* Added padding back, remove bottom padding */}
                  <SheetTitle className={cn(
                      "text-center text-lg font-semibold py-2 rounded-md bg-muted text-muted-foreground"
                      // Removed border class
                   )}>
                    {menuSheetView === 'categories' ? 'Menú' : selectedCategoryForItemsView}
                  </SheetTitle>
                </SheetHeader>
                 {/* Make content area flexible and scrollable */}
                 <div className="flex-grow overflow-hidden">
                    {renderMenuSheetContent()} {/* Render categories or items */}
                 </div>
                 <SheetFooter className="mt-auto p-4 flex-shrink-0 border-t">
                   <Button onClick={closeMenuSheet} className="w-full">Confirmar</Button>
                 </SheetFooter>
            </SheetContent>
        </Sheet>

       {/* Modification Dialog */}
        {currentItemForModification && (
        <ModificationDialog
          isOpen={isModificationDialogOpen}
          onOpenChange={setIsModificationDialogOpen}
          item={currentItemForModification}
          onConfirm={handleModificationConfirm} // Expects array of modifications
          onCancel={() => setCurrentItemForModification(null)} // Reset item on cancel
        />
      )}
    </div>
  );
}
