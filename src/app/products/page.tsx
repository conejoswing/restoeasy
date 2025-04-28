

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { Button } from '@/components/ui/button'; // Import Button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'; // Import Dialog components
import { Label } from '@/components/ui/label'; // Import Label
import { useState } from 'react';
import { Edit } from 'lucide-react'; // Import Edit icon
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface MenuItem {
  id: number;
  name: string;
  price: number; // Base price
  category: string;
  modifications?: string[]; // Optional list of modifications
  modificationPrices?: { [key: string]: number }; // Optional map of modification name to additional price
}

// Mock data - reused from table detail page (Consider moving to a shared service)
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
      name: 'Café Americano', // Changed name
      price: 2500, // Example price
      category: 'Café',
    },
    {
      id: 7,
      name: 'Café Latte', // Changed name
      price: 3000, // Example price
      category: 'Café',
    },
    // --- Promo Churrasco --- (Previously Colaciones)
    {
        id: 25,
        name: '2x Completo', // Updated name
        price: 5500, // Example price
        category: 'Promo Churrasco', // Updated Category
        // Add modifications if needed
    },
    {
        id: 26,
        name: '2x Italiano', // Updated name
        price: 6000, // Example price
        category: 'Promo Churrasco', // Updated Category
        // Add modifications if needed
    },
    // --- Add new Promo Churrasco items --- Start ID from 73
    { id: 73, name: '2x Chacarero', price: 7000, category: 'Promo Churrasco' },
    { id: 74, name: '2x Queso', price: 6500, category: 'Promo Churrasco' },
    { id: 75, name: '2x Palta', price: 6800, category: 'Promo Churrasco' },
    { id: 76, name: '2x Tomate', price: 6800, category: 'Promo Churrasco' },
    { id: 77, name: '2x Brasileño', price: 7200, category: 'Promo Churrasco' }, // Assuming Brasileño exists or add its definition
    { id: 78, name: '2x Dinamico', price: 7300, category: 'Promo Churrasco' },
    { id: 79, name: '2x Campestre', price: 7500, category: 'Promo Churrasco' },
    { id: 80, name: '2x Queso Champiñon', price: 7800, category: 'Promo Churrasco' },
    { id: 81, name: '2x Che milico', price: 8000, category: 'Promo Churrasco' },
    // --- End of new Promo Churrasco items ---
    // --- Promo Mechada ---
    {
      id: 4,
      name: '2x Completo', // Changed name from Mechada Italiana to 2x Completo
      price: 8000, // Example price
      category: 'Promo Mechada', // Category already Promo Mechada
    },
    {
      id: 24, // New Promo Mechada
      name: '2x Italiano', // Changed name from Mechada Completa to 2x Italiano
      price: 7800, // Example price
      category: 'Promo Mechada', // Keep in Promotions category
    },
     // --- Add new Promo Mechada items --- Start ID from 82 (last used was 81)
     { id: 82, name: '2x Chacarero', price: 9000, category: 'Promo Mechada' }, // Example price
     { id: 83, name: '2x Queso', price: 8500, category: 'Promo Mechada' },
     { id: 84, name: '2x Palta', price: 8800, category: 'Promo Mechada' },
     { id: 85, name: '2x Tomate', price: 8800, category: 'Promo Mechada' },
     { id: 86, name: '2x Brasileño', price: 9200, category: 'Promo Mechada' },
     { id: 87, name: '2x Dinamico', price: 9300, category: 'Promo Mechada' },
     { id: 88, name: '2x Campestre', price: 9500, category: 'Promo Mechada' },
     { id: 89, name: '2x Queso Champiñon', price: 9800, category: 'Promo Mechada' },
     { id: 90, name: '2x Che milico', price: 10000, category: 'Promo Mechada' },
     // --- End of new Promo Mechada items ---
    // --- Promociones ---
    {
      id: 6,
      name: 'Promo 1', // Changed name to Promo 1
      price: 4500,
      category: 'Promociones',
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Agregado Queso': 1000 }, // + Cheese
    },
     {
      id: 5,
      name: 'Promo 2', // Changed name to Promo 2
      price: 5000,
      category: 'Promociones',
      modifications: ['Vienesa', 'As', 'Con Bebida Pequeña', 'Ají Verde', 'Agregado Queso'], // + Ají Verde + Agregado Queso
      modificationPrices: { 'Agregado Queso': 1000 }, // + Cheese
    },
    {
      id: 23,
      name: 'Promo 3', // Changed name to Promo 3
      price: 6000, // Example price
      category: 'Promociones',
      // No modifications by default for promos, unless specified
    },
    // --- Add new Promotions --- Start ID from 91 (last used was 90)
    { id: 91, name: 'Promo 4', price: 6500, category: 'Promociones' }, // Example price
    { id: 92, name: 'Promo 5', price: 7000, category: 'Promociones' },
    { id: 93, name: 'Promo 6', price: 7500, category: 'Promociones' },
    { id: 94, name: 'Promo 7', price: 8000, category: 'Promociones' },
    { id: 95, name: 'Promo 8', price: 8500, category: 'Promociones' },
    { id: 96, name: 'Promo 9', price: 9000, category: 'Promociones' },
    { id: 97, name: 'Promo 10', price: 9500, category: 'Promociones' },
    { id: 98, name: 'Promo 11', price: 10000, category: 'Promociones' },
    { id: 99, name: 'Promo 12', price: 10500, category: 'Promociones' },
    // --- End of new Promotions ---
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
  'Promo Mechada',
  'Promociones',
  'Bebidas',
  'Colaciones', // Added back
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


export default function ProductsPage() {
  // Role checks and redirection are handled by AuthProvider
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [menu, setMenu] = useState<MenuItem[]>(sortMenu(mockMenu)); // State for menu items
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const { toast } = useToast(); // Toast hook

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

   // Loading state is handled by AuthProvider wrapper in layout.tsx
   if (isLoading) {
     return <div className="flex items-center justify-center min-h-screen">Cargando...</div>; // Or a minimal loading indicator if preferred
   }
   // If not authenticated or not admin, AuthProvider will redirect
   if (!isAuthenticated || userRole !== 'admin') {
     return null; // Prevent rendering content before redirect
   }

   // Filter products based on search term
   const filteredProducts = menu.filter(product =>
     product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.category.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const openEditDialog = (product: MenuItem) => {
     setEditingProduct(product);
     setNewPrice(product.price.toString()); // Pre-fill with current price
     setIsEditDialogOpen(true);
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

     // Update the product price in the menu state
     setMenu(prevMenu =>
       sortMenu( // Re-sort after update
         prevMenu.map(item =>
           item.id === editingProduct.id ? { ...item, price: priceValue } : item
         )
       )
     );

     toast({ title: "Precio Actualizado", description: `El precio de ${editingProduct.name} se actualizó a ${formatCurrency(priceValue)}.`});
     setIsEditDialogOpen(false); // Close dialog
     setEditingProduct(null); // Reset editing state
     setNewPrice(''); // Clear price input
   };

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
        {/* Optional: Add a button to add new products if needed later */}
      </div>

      <Card>
         <CardHeader>
             <CardTitle>Menú Completo</CardTitle>
         </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Precio Base</TableHead>
                 <TableHead className="text-center w-20">Editar</TableHead> {/* Add Edit column */}
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map((item) => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {item.modifications && item.modifications.length > 0
                        ? item.modifications.map(mod => {
                            const price = item.modificationPrices?.[mod];
                            return price ? `${mod} (+${formatCurrency(price)})` : mod;
                            }).join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.price)}</TableCell>
                    <TableCell className="text-center">
                       <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-7 w-7">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar Precio</span>
                       </Button>
                    </TableCell>
                </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground"> {/* Increased colSpan */}
                     {searchTerm ? 'No se encontraron productos.' : 'No hay productos para mostrar.'}
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Edit Price Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="sm:max-w-[425px]">
           <DialogHeader>
             <DialogTitle>Editar Precio de {editingProduct?.name}</DialogTitle>
             <DialogDescription>
               Actualice el precio base para este producto.
             </DialogDescription>
           </DialogHeader>
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
                 step="1" // Allow integer prices
               />
             </div>
           </div>
           <DialogFooter>
             <DialogClose asChild>
               <Button type="button" variant="secondary">Cancelar</Button>
             </DialogClose>
             <Button type="submit" onClick={handleUpdatePrice}>Guardar Cambios</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

    </div>
  );
}




