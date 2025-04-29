
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UtensilsCrossed, Package, Receipt, Users, ShoppingBag } from 'lucide-react'; // Removed LogOut

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  // SidebarSeparator, // Keep if other items remain at bottom, remove otherwise
} from '@/components/ui/sidebar';
// import { useAuth } from '@/context/AuthContext'; // No longer needed for sidebar


export default function AppSidebar() {
  const pathname = usePathname();
  // const { isAuthenticated, userRole, logout } = useAuth(); // No longer needed
  // const router = useRouter();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  // const handleLogout = () => { ... } // Remove logout handler

  return (
    <>
      <SidebarHeader className="flex flex-col items-center p-4 gap-2">
        <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden text-center">
          El Bajón de la Cami
        </h2>
      </SidebarHeader>
      {/* Use flex-col and mt-auto on the logout item to push it down */}
      <SidebarContent className="flex flex-col justify-between flex-grow">
        <SidebarMenu className="flex flex-col flex-grow"> {/* Add flex-grow here */}
          {/* Tables is always visible */}
          <SidebarMenuItem>
            <Link href="/tables">
              <SidebarMenuButton
                isActive={isActive('/tables')}
                tooltip="Mesas" // Added tooltip
              >
                <UtensilsCrossed />
                <span className="group-data-[collapsible=icon]:hidden">Mesas</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {/* Admin Only Menu Items - Always visible now */}
          <>
            <SidebarMenuItem>
              <Link href="/inventory">
                <SidebarMenuButton
                  isActive={isActive('/inventory')}
                  tooltip="Inventario" // Added tooltip
                >
                  <Package />
                  <span className="group-data-[collapsible=icon]:hidden">Inventario</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/expenses">
                <SidebarMenuButton
                  isActive={isActive('/expenses')}
                  tooltip="Caja" // Added tooltip
                >
                  <Receipt />
                  <span className="group-data-[collapsible=icon]:hidden">Caja</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/staff">
                <SidebarMenuButton
                  isActive={isActive('/staff')}
                  tooltip="Personal de Trabajo" // Added tooltip
                >
                  <Users /> {/* Staff icon */}
                  <span className="group-data-[collapsible=icon]:hidden">Personal de Trabajo</span> {/* Staff text */}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/products"> {/* Link to products page */}
                <SidebarMenuButton
                  isActive={isActive('/products')} // Check active state for products
                  tooltip="Productos"
                >
                  <ShoppingBag /> {/* Products icon */}
                  <span className="group-data-[collapsible=icon]:hidden">Productos</span> {/* Products text */}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </>

          {/* Spacer to push potential bottom items down */}
          <div className="flex-grow" />

          {/* Logout Button - Removed */}
          {/*
          {isAuthenticated && (
             <>
                 <SidebarSeparator />
                 <SidebarMenuItem>
                     <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                         <LogOut />
                         <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                     </SidebarMenuButton>
                 </SidebarMenuItem>
             </>
          )}
          */}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
