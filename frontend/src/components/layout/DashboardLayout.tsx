import React from "react";
import { LayoutDashboard, UploadCloud, Settings } from "lucide-react";
import Navbar from "./Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background selection:bg-primary/20">
      
      <Navbar />

      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-card sm:flex z-10 shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
          <nav className="flex flex-col gap-1 p-4 text-sm font-medium mt-2">
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/50">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2.5 text-primary transition-all font-semibold">
              <UploadCloud className="h-4 w-4" />
              Import CSV
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/50">
              <Settings className="h-4 w-4" />
              Settings
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-x-hidden">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  );
}
