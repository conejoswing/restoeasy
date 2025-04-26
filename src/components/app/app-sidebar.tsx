'use client';

import * as React from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import { UtensilsCrossed, Package, Receipt, Users } from 'lucide-react'; // Import Users icon

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';


export default function AppSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <>
      <SidebarHeader className="flex flex-col items-center p-4 gap-2">
        <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden text-center">
          El Bajón de la Cami
        </h2>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between flex-grow"> {/* Added flex-grow */}
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/tables">
              <SidebarMenuButton
                isActive={isActive('/tables')}
                tooltip="Mesas"
              >
                <UtensilsCrossed />
                <span>Mesas</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/inventory">
              <SidebarMenuButton
                isActive={isActive('/inventory')}
                tooltip="Inventario"
              >
                <Package />
                <span>Inventario</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/expenses">
              <SidebarMenuButton
                isActive={isActive('/expenses')}
                tooltip="Caja"
              >
                <Receipt />
                <span>Caja</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {/* New Staff Menu Item */}
          <SidebarMenuItem>
            <Link href="/staff"> {/* Placeholder link, adjust as needed */}
              <SidebarMenuButton
                isActive={isActive('/staff')}
                tooltip="Personal de Trabajo"
              >
                <Users /> {/* Staff icon */}
                <span>Personal de Trabajo</span> {/* Staff text */}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Image section removed */}

      </SidebarContent>
    </>
  );
}
