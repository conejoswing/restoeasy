'use client';

import * as React from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import { UtensilsCrossed, Package, Receipt } from 'lucide-react';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

// Simple SVG Logo Placeholder (Fork & Knife)
const RestoFacilLogo = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32" // Increased size slightly
        height="32" // Increased size slightly
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 shrink-0 text-sidebar-foreground" // Ensure color and size
    >
        <path d="M16 2v20"></path>
        <path d="M11 2v11a5 5 0 0 0 10 0V2"></path>
        <path d="M8 2v20"></path>
        <path d="M3 12h3a3 3 0 0 1 0 6H3"></path>
    </svg>
);


export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/'); // Updated isActive to handle detail pages

  return (
    <>
      {/* Changed flex direction to column, added padding, centered items */}
      <SidebarHeader className="flex flex-col items-center p-4 gap-2">
         {/* Logo removido de aquí */}
        {/* Added text-center */}
        <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden text-center">
          El Bajón de la Cami
        </h2>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between"> {/* Flex container for menu and logo */}
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/tables" passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive('/tables')}
                tooltip="Mesas" // Changed from Tables
              >
                <UtensilsCrossed />
                <span>Mesas</span> {/* Changed from Tables */}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/inventory" passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive('/inventory')}
                tooltip="Inventario" // Changed from Inventory
              >
                <Package />
                <span>Inventario</span> {/* Changed from Inventory */}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/expenses" passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive('/expenses')}
                tooltip="Gastos" // Changed from Expenses
              >
                <Receipt />
                <span>Gastos</span> {/* Changed from Expenses */}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Logo movido aquí, al final del contenido */}
        {/* <div className="flex justify-center p-4 mt-auto group-data-[collapsible=icon]:hidden">
            <RestoFacilLogo />
        </div>
         <div className="flex justify-center p-2 mt-auto group-data-[collapsible=icon]:flex hidden group-data-[collapsible=icon]:visible">  Icon only when collapsed 
             <RestoFacilLogo />
        </div> */}
      </SidebarContent>
    </>
  );
}

