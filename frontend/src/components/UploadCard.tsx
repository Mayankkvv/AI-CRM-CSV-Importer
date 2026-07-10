import React from 'react';
import { UploadCloud, FileText } from 'lucide-react';

export default function UploadCard() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main Card Container */}
      <div className="relative group rounded-3xl bg-card border shadow-sm transition-all hover:shadow-md overflow-hidden">
        
        {/* Subtle top gradient accent bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-purple-400 to-primary/50"></div>
        
        <div className="p-8 md:p-10">
          
          {/* Card Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Import CSV Data</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Drag and drop your file to let AI instantly map your columns to the CRM format.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div className="relative border-2 border-dashed border-muted-foreground/25 rounded-2xl p-10 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all duration-300 cursor-pointer group/dropzone">
            
            {/* Animated Icon */}
            <div className="bg-background p-4 rounded-full shadow-sm border mb-5 group-hover/dropzone:scale-110 group-hover/dropzone:shadow-md transition-all duration-300">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>

            {/* Drop Instructions */}
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Drag & drop your CSV file here
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              or click to browse from your computer
            </p>

            {/* Primary Action Button */}
            <button className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-100 h-11 px-8 shadow-sm">
              Browse File
            </button>
            
          </div>

          {/* File Requirements Footer */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-medium text-muted-foreground px-2">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Supported format: .CSV
            </div>
            <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
              Maximum file size: 10 MB
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
