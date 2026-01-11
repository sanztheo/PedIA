import React from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  disableScroll?: boolean;
}

export function MainLayout({ children, disableScroll = false }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:block w-64 border-r overflow-y-auto">
          <Sidebar />
        </aside>
        <main className={cn(
          "flex-1",
          disableScroll ? "overflow-hidden flex flex-col" : "overflow-y-auto"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
