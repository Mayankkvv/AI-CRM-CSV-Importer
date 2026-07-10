"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UploadCard() {
  // --- STATE ---
  // Tracks if a file is currently hovering over the drop zone
  const [isDragging, setIsDragging] = useState(false);
  // Holds any validation error messages
  const [error, setError] = useState<string | null>(null);
  // Holds the successfully validated file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // A reference to remotely click the hidden HTML file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EVENTS ---
  
  // 1. Fires continuously while dragging over the box
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Stop browser from opening the file
    setIsDragging(true); // Trigger our active UI state
  };

  // 2. Fires when dragging away from the box
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false); // Revert UI
  };

  // 3. Fires when the user lets go of the mouse to drop the file
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Grab the dropped files
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  // 4. Opens the hidden OS file browser
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // 5. Fires when a file is selected from the OS file browser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
    // Reset input so they can re-select the same file if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- VALIDATION ---
  const validateAndProcessFile = (file: File) => {
    setError(null);
    setSelectedFile(null);

    // Validate File Type
    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      setError("Invalid format. Please upload a valid CSV file.");
      return;
    }

    // Validate File Size (10 MB)
    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError("File is too large. Please upload a file under 10 MB.");
      return;
    }

    // Success! Save the file to state
    setSelectedFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative group rounded-3xl bg-card border shadow-sm transition-all hover:shadow-md overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-purple-400 to-primary/50"></div>
        
        <div className="p-8 md:p-10">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Import CSV Data</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Drag and drop your file to let AI instantly map your columns to the CRM format.
            </p>
          </div>

          {/* Interactive Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300
              ${isDragging 
                ? "border-primary bg-primary/5 scale-[1.02]" // Active Drag State
                : "border-muted-foreground/25 bg-muted/20 hover:bg-muted/40 hover:border-primary/50" // Normal State
              }
            `}
          >
            {/* Hidden File Input */}
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {/* SUCCESS STATE UI */}
            {selectedFile ? (
              <div className="flex flex-col items-center text-center animate-in zoom-in duration-300">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-full mb-4 shadow-sm border border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  File Ready: {selectedFile.name}
                </h3>
                <p className="text-sm font-medium text-muted-foreground mb-6">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button 
                  onClick={handleBrowseClick}
                  className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              /* DEFAULT UPLOAD STATE UI */
              <>
                <div className={`
                  bg-background p-4 rounded-full shadow-sm border mb-5 transition-all duration-300
                  ${isDragging ? "scale-110 shadow-md border-primary/50" : ""}
                `}>
                  <UploadCloud className={`w-8 h-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Drag & drop your CSV file here
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  or click to browse from your computer
                </p>

                <button 
                  onClick={handleBrowseClick}
                  className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-100 h-11 px-8 shadow-sm"
                >
                  Browse File
                </button>
              </>
            )}
          </div>

          {/* ERROR MESSAGE DISPLAY */}
          {error && (
            <div className="mt-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Footer */}
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
