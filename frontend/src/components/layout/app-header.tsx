"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

// App header: sidebar trigger (mobile/collapse), spacer, theme toggle.
// Height <= 80px (skill 4.7: nav height cap). Single line on desktop.
function AppHeader() {
  return (
    <header className="flex h-14 items-center gap-2 px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-4!" />
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  );
}

export { AppHeader };
