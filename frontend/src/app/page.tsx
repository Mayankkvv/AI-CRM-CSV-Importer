import React from 'react';
import UploadCard from '@/components/UploadCard';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* Hero Text Section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
          Intelligent <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Data Import</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Upload your raw CRM exports below. Our Groq AI engine will securely process, clean, and standardize your data entirely in memory.
        </p>
      </div>

      {/* Render our newly created modular component */}
      <UploadCard />

    </div>
  );
}
