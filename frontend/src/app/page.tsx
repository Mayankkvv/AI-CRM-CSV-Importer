import React from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* 1. Hero Text Section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen AI Mapping Engine</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
          Seamlessly Import Your <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
            Customer Data
          </span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Upload any chaotic CSV file. Our Groq AI engine will automatically identify, clean, and map your columns to a perfect, standardized CRM format.
        </p>
      </div>

      {/* 2. Supported Sources / Trust Badges */}
      <div className="flex flex-wrap justify-center gap-6 mb-12 text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Salesforce
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> HubSpot
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pipedrive
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom CSVs
        </div>
      </div>

      {/* 3. Glassmorphism Upload Card */}
      <div className="w-full max-w-3xl relative group">
        
        {/* Background Ambient Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-500 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-700"></div>
        
        {/* The Glass Card Surface */}
        <div className="relative bg-background/80 backdrop-blur-xl border border-border shadow-2xl rounded-3xl p-6 md:p-10 text-center">
          
          {/* Dashed Drop Zone */}
          <div className="border-2 border-dashed border-primary/20 rounded-2xl p-10 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group/dropzone">
            
            {/* 4. Beautiful Illustration Placeholder */}
            <div className="relative mb-8 mt-4">
              {/* Inner Glow */}
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              
              {/* Spreadsheet Icon */}
              <div className="bg-gradient-to-br from-primary to-purple-600 text-white p-4 rounded-2xl shadow-lg relative z-10 transform -rotate-6 group-hover/dropzone:rotate-0 transition-transform duration-500">
                <FileSpreadsheet className="w-10 h-10" />
              </div>
              
              {/* Layered Upload Badge */}
              <div className="absolute -bottom-3 -right-3 bg-background p-2 rounded-full shadow-xl border border-border z-20">
                <UploadCloud className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Upload Call to Action */}
            <h3 className="text-xl font-bold mb-2 text-foreground">Click to upload or drag and drop</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm">
              Standard CSV files only. We securely process your data entirely in memory without permanent storage.
            </p>

            {/* Premium Button */}
            <button className="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 h-12 px-8 gap-2 shadow-md">
              Select CSV File
              <ArrowRight className="w-4 h-4" />
            </button>
            
          </div>
        </div>
      </div>

    </div>
  );
}
