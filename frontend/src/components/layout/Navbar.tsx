import React from 'react';
import { Database, Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    /* The main navigation wrapper with a frosted glass effect */
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Left Section: Logo & Titles */}
        <div className="flex items-center gap-4">
          
          {/* Logo Placeholder */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/10 shadow-sm">
            <Database className="h-5 w-5" />
          </div>
          
          {/* Text Content */}
          <div className="flex flex-col justify-center">
            <h1 className="text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg">
              AI CRM CSV Importer
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground sm:text-xs mt-0.5">
              Powered by Groq AI
              <Sparkles className="h-3 w-3 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Right Section: Explicitly empty as requested (No Auth) */}
        <div className="flex items-center">
          {/* Future buttons or links can be added here */}
        </div>

      </div>
    </nav>
  );
}
