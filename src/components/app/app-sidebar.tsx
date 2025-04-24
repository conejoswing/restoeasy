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

export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/'); // Updated isActive to handle detail pages

  return (
    <>
      <SidebarHeader>
        <h2 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          RestoFácil {/* Changed from RestoEasy */}
        </h2>
      </SidebarHeader>
      <SidebarContent>
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
      </SidebarContent>
    </>
  );
}
