"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import Papa from 'papaparse';
import PreviewTable from './PreviewTable';
import ResultsView from './ResultsView';
import axios from 'axios';
import { toast } from 'sonner';

export default function UploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // NEW: State for live AI processing feedback
  const [aiProgress, setAiProgress] = useState(0);
  const [batchInfo, setBatchInfo] = useState({ current: 0, total: 0 });
  
  const [apiResults, setApiResults] = useState<any | null>(null);

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
        toast.error(`Failed to parse CSV locally: ${error.message}`);
      }
    });
  };

  const validateAndProcessFile = (file: File) => {
    setSelectedFile(null);
    setParsedData(null);

    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Invalid format. Please upload a valid CSV file.");
      return;
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast.error("File is too large. Please upload a file under 10 MB.");
      return;
    }

    setSelectedFile(file);
    parseCSV(file); 
  };

  const resetApp = () => {
    setApiResults(null);
    setSelectedFile(null);
    setParsedData(null);
    setUploadProgress(0);
    setAiProgress(0);
    setBatchInfo({ current: 0, total: 0 });
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setUploadProgress(0);
    setAiProgress(0);
    setBatchInfo({ current: 0, total: 0 });

    const jobId = Date.now().toString(); // Generate unique tracking ID
    const formData = new FormData();
    formData.append('csvFile', selectedFile);

    // Deploy a background polling loop to ping the side-channel endpoint
    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/upload/progress/${jobId}`);
        if (res.data) {
          setAiProgress(res.data.progress || 0);
          setBatchInfo({ current: res.data.currentBatch || 0, total: res.data.totalBatches || 0 });
        }
      } catch (e) {
        // Silently ignore polling errors to avoid disrupting UI
      }
    }, 1000);

    try {
      const response = await axios.post(`http://localhost:5000/api/upload?jobId=${jobId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      clearInterval(pollInterval);
      setAiProgress(100);
      toast.success("AI Mapping complete!");
      setApiResults(response.data);
      
    } catch (err: any) {
      console.error("Upload failed:", err);
      clearInterval(pollInterval);
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(`Backend Error: ${err.response.data.error}`);
      } else {
        toast.error('Failed to connect to the backend server.');
      }
    } finally {
      setIsImporting(false);
      setUploadProgress(0); 
    }
  };

  // If we have AI results, render the beautiful Results Dashboard instead of the upload form
  if (apiResults) {
    return <ResultsView results={apiResults} onReset={resetApp} />;
  }

  return (
    <div className={`w-full mx-auto transition-all duration-700 ease-in-out ${parsedData ? 'max-w-6xl' : 'max-w-2xl'}`}>
      
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
                  {parsedData ? `Successfully parsed ${parsedData.length} rows locally` : "Parsing data..."}
                </p>
                <button 
                  onClick={handleBrowseClick}
                  disabled={isImporting}
                  className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
        </div>
      </div>

      {parsedData && (
        <div className="animate-in fade-in duration-500">
          <PreviewTable data={parsedData} />
          
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between bg-card border shadow-sm rounded-2xl p-6">
            <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
              Please review your data in the table above before importing.
            </div>
            
            <button 
              onClick={handleConfirmImport}
              disabled={!parsedData || isImporting}
              className="inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-85 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 h-12 px-8 gap-2 shadow-md w-full sm:w-auto relative overflow-hidden"
            >
              {isImporting ? (
                <div className="flex flex-col items-center justify-center w-full relative z-10 py-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-semibold text-sm">
                      {uploadProgress < 100 
                        ? `Uploading File... ${uploadProgress}%` 
                        : `AI Mapping... ${aiProgress}%`}
                    </span>
                  </div>
                  
                  {uploadProgress === 100 && batchInfo.total > 0 && (
                     <span className="text-[11px] font-medium text-white/80 tracking-wide uppercase">
                       Batch {batchInfo.current} of {batchInfo.total}
                     </span>
                  )}
                  
                  {/* Progress Bar mapped seamlessly to upload then AI completion */}
                  <div 
                    className="absolute bottom-0 left-0 h-1.5 bg-white/40 transition-all duration-500 ease-out" 
                    style={{ width: `${uploadProgress < 100 ? uploadProgress : aiProgress}%` }}
                  ></div>
                </div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Confirm & Map with AI
                </>
              )}
            </button>
          </div>
          
        </div>
      )}
      
    </div>
  );
}
