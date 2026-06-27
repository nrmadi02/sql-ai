import type * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DatasourceProvider } from "@/components/providers/datasource-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

type MainLayoutProps = {
  children: React.ReactNode;
};

function MainLayout({ children }: MainLayoutProps) {
  return (
    <TooltipProvider>
      <DatasourceProvider>
        <SidebarProvider className="h-svh overflow-hidden">
          <AppSidebar />
          <SidebarInset className="min-h-0 overflow-hidden">
            <AppHeader />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {children}
            </div>
          </SidebarInset>
          <Toaster richColors closeButton position="bottom-right" />
        </SidebarProvider>
      </DatasourceProvider>
    </TooltipProvider>
  );
}

export { MainLayout };
