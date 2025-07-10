"use client";

import {
  Home,
  LineChart,
  LogOut,
  MapPin,
  Package,
  Package2,
  ShoppingCart,
  Users2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "./auth-provider";
import { Button } from "./ui/button";

export function AppSidebar() {
  const { user, signOut } = useAuth();

  return (
    <Sidebar className="hidden border-r sm:flex">
      <SidebarContent>
        <SidebarHeader>
          <a href="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span>Ledger</span>
          </a>
        </SidebarHeader>
        <SidebarMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive>
                    <a href="/">
                      <Home className="h-5 w-5" />
                      <span className="sr-only">Dashboard</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">Dashboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Expenses</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">Expenses</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Package className="h-5 w-5" />
                    <span className="sr-only">Statements</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">Statements</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Users2 className="h-5 w-5" />
                    <span className="sr-only">Categories</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">Categories</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/merchant-mappings">
                      <MapPin className="h-5 w-5" />
                      <span className="sr-only">Merchant Mappings</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">Merchant Mappings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <LineChart className="h-5 w-5" />
                    <span className="sr-only">Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right">Analytics</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2 border-t">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="w-full bg-transparent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
