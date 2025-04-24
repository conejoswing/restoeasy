'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Image component
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
            <Link href="/tables" passHref legacyBehavior>
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
            <Link href="/inventory" passHref legacyBehavior>
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
            <Link href="/expenses" passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive('/expenses')}
                tooltip="Gastos"
              >
                <Receipt />
                <span>Gastos</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Logo Placeholder Below Gastos */}
        <div className="mt-auto p-4 flex justify-center group-data-[collapsible=icon]:hidden">
           {/* Placeholder for the logo - Replace with the actual logo */}
           <Image
             // Using picsum as placeholder - Replace src with your actual logo path
             src="https://picsum.photos/seed/el_bajon_logo/150/150"
             alt="Logo El Bajón de la Cami"
             width={120} // Adjust size as needed
             height={120} // Adjust size as needed
             className="rounded-full" // Example styling
           />
         </div>
         {/* Icon-only placeholder when collapsed */}
         <div className="mt-auto p-2 flex justify-center group-data-[collapsible=icon]:flex hidden">
            {/* Simplified placeholder for collapsed state */}
           <Image
             src="https://picsum.photos/seed/el_bajon_icon/40/40" // Smaller placeholder
             alt="Logo Icono"
             width={32}
             height={32}
             className="rounded-full"
           />
         </div>
      </SidebarContent>
    </>
  );
}
