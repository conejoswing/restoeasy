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

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <SidebarHeader>
        <h2 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          RestoEasy
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/tables" passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive('/tables')}
                tooltip="Tables"
              >
                <UtensilsCrossed />
                <span>Tables</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/inventory" passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive('/inventory')}
                tooltip="Inventory"
              >
                <Package />
                <span>Inventory</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/expenses" passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive('/expenses')}
                tooltip="Expenses"
              >
                <Receipt />
                <span>Expenses</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
