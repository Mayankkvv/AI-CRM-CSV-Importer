import React from "react";
import { LayoutDashboard, UploadCloud, Settings } from "lucide-react";
import Navbar from "./Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      
      {/* 1. Mount our brand new Top Navigation Bar */}
      <Navbar />

      <div className="flex flex-1">
        {/* 2. Side Navigation (Pushed below the Navbar) */}
        <aside className="hidden w-64 flex-col border-r bg-card sm:flex">
          <nav className="flex flex-col gap-2 p-4 text-sm font-medium mt-4">
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/50">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </a>
            {/* Highlighted active state for the importer */}
            <a href="#" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-all">
              <UploadCloud className="h-4 w-4" />
              Import CSV
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted/50">
              <Settings className="h-4 w-4" />
              Settings
            </a>
          </nav>
        </aside>

        {/* 3. Main Content Area */}
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  );
}
