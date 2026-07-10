import React from "react";
import { 
  LayoutDashboard, 
  UploadCloud, 
  Settings, 
  Menu, 
  Bell, 
  Search
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-card sm:flex">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-2 font-bold text-primary text-xl">
            <UploadCloud className="h-6 w-6" />
            <span>GrowEasy</span>
          </div>
        </div>
        <nav className="flex flex-col gap-2 p-4 text-sm font-medium">
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </a>
          {/* Highlighted active state for the importer */}
          <a href="#" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-all">
            <UploadCloud className="h-4 w-4" />
            Import CSV
          </a>
          <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col sm:pl-64 w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <button className="sm:hidden text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input 
                type="search" 
                placeholder="Search..." 
                className="h-9 w-64 rounded-md border bg-muted/50 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"></span>
            </button>
            {/* User Avatar Placeholder */}
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 shadow-sm border-2 border-background"></div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
