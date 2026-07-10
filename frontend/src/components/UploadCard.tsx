"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';
import PreviewTable from './PreviewTable';

export default function UploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false); 
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) validateAndProcessFile(files[0]);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) validateAndProcessFile(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setParsedData(results.data);
      },
      error: (error: any) => {
        setError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const validateAndProcessFile = (file: File) => {
    setError(null);
    setSelectedFile(null);
    setParsedData(null);

    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      setError("Invalid format. Please upload a valid CSV file.");
      return;
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setError("File is too large. Please upload a file under 10 MB.");
      return;
    }

    setSelectedFile(file);
    parseCSV(file);
  };

  return (
    /* We dynamically expand the width from 2xl to 6xl if parsed data exists so the table fits beautifully! */
    <div className={`w-full mx-auto transition-all duration-700 ease-in-out ${parsedData ? 'max-w-6xl' : 'max-w-2xl'}`}>
      
      {/* Upload Card */}
      <div className="relative group rounded-3xl bg-card border shadow-sm transition-all hover:shadow-md overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-purple-400 to-primary/50"></div>
        
        <div className="p-8 md:p-10">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Import CSV Data</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Drag and drop your file to let AI instantly map your columns to the CRM format.
            </p>
          </div>

          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300
              ${isDragging 
                ? "border-primary bg-primary/5 scale-[1.02]" 
                : "border-muted-foreground/25 bg-muted/20 hover:bg-muted/40 hover:border-primary/50" 
              }
            `}
          >
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center text-center animate-in zoom-in duration-300">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-full mb-4 shadow-sm border border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  File Ready: {selectedFile.name}
                </h3>
                <p className="text-sm font-medium text-muted-foreground mb-6">
                  {parsedData ? `Successfully parsed ${parsedData.length} rows` : "Parsing data..."}
                </p>
                <button 
                  onClick={handleBrowseClick}
                  className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
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

          {error && (
            <div className="mt-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* THE BRAND NEW DATA TABLE (Only renders if parsedData exists) */}
      {parsedData && <PreviewTable data={parsedData} />}
      
    </div>
  );
}
