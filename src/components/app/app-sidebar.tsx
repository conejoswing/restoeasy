
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UtensilsCrossed, Package, Receipt, Users, LogOut } from 'lucide-react'; // Import Users icon & LogOut

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter, // Import SidebarFooter
  SidebarSeparator, // Import SidebarSeparator
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext'; // Import useAuth


export default function AppSidebar() {
  const pathname = usePathname();
  const { isAuthenticated, userRole, logout } = useAuth(); // Get auth state, role and logout function
  const router = useRouter();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const handleLogout = () => {
      logout();
      // router.push('/login'); // Already handled in AuthContext logout
  }

  return (
    <>
      <SidebarHeader className="flex flex-col items-center p-4 gap-2">
        <h2 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden text-center">
          El Bajón de la Cami
        </h2>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between flex-grow"> {/* Added flex-grow */}
        <SidebarMenu>
          {/* Tables is visible to all authenticated users */}
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

          {/* Admin Only Menu Items */}
          {userRole === 'admin' && (
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
            </>
          )}
        </SidebarMenu>

        {/* Logout Button Section - Visible to all authenticated users */}
        {isAuthenticated && (
            <SidebarFooter className="mt-auto"> {/* Push footer to bottom */}
                 <SidebarSeparator /> {/* Optional separator */}
                 <SidebarMenu>
                     <SidebarMenuItem>
                         <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                             <LogOut />
                             <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                         </SidebarMenuButton>
                     </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarFooter>
        )}

      </SidebarContent>
    </>
  );
}
