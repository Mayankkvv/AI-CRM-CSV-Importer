"use client";

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Users } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

interface ResultsViewProps {
  results: {
    totalOriginalRows: number;
    totalImported: number;
    totalSkipped: number;
    data: any[];
    skippedData: any[];
  };
  onReset: () => void;
}

export default function ResultsView({ results, onReset }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped'>('imported');

  // Safe fallback to empty array to prevent "Cannot read properties of undefined (reading 'length')" crash
  const displayData = (activeTab === 'imported' ? results.data : results.skippedData) || [];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">AI Import Results</h2>
        <button 
          onClick={onReset}
          className="text-sm font-semibold text-primary hover:underline transition-colors"
        >
          Import Another File
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md animate-in fade-in zoom-in-95 duration-500 fill-mode-both" 
          style={{ animationDelay: '100ms' }}
        >
          <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-xl border border-blue-200 dark:border-blue-500/30">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Processed</p>
            <p className="text-2xl font-bold text-foreground">{results.totalOriginalRows}</p>
          </div>
        </div>
        
        <div 
          className="bg-card border border-emerald-200/50 dark:border-emerald-500/20 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
          style={{ animationDelay: '200ms' }}
        >
          <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Successfully Mapped</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{results.totalImported}</p>
          </div>
        </div>
        
        <div 
          className="bg-card border border-destructive/20 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
          style={{ animationDelay: '300ms' }}
        >
          <div className="bg-destructive/10 dark:bg-destructive/20 p-3 rounded-xl border border-destructive/20 dark:border-destructive/30">
            <XCircle className="w-6 h-6 text-destructive dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Skipped Records</p>
            <p className="text-2xl font-bold text-destructive dark:text-red-400">{results.totalSkipped}</p>
          </div>
        </div>
      </div>

      {/* Tabbed Data Table */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="border-b px-6 flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('imported')}
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'imported' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Imported Data ({results.totalImported})
          </button>
          <button 
            onClick={() => setActiveTab('skipped')}
            className={`py-4 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'skipped' 
              ? 'border-destructive text-destructive' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Skipped Records ({results.totalSkipped})
          </button>
        </div>
        
        <div className="p-0 overflow-x-auto max-h-[500px]">
          {displayData.length === 0 ? (
            <div className="p-12">
               <EmptyState 
                 icon={activeTab === 'imported' ? CheckCircle2 : XCircle}
                 title="No records to display."
                 description={`You have zero ${activeTab} records for this upload.`}
               />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground sticky top-0 backdrop-blur-md z-10 shadow-sm">
                <tr>
                  {activeTab === 'skipped' && <th className="px-6 py-4 font-bold text-destructive bg-destructive/5">Skip Reason</th>}
                  <th className="px-6 py-4 font-semibold">First Name</th>
                  <th className="px-6 py-4 font-semibold">Last Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">Company</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={`transition-colors group ${
                      activeTab === 'skipped' ? 'bg-destructive/5 dark:bg-destructive/10 hover:bg-destructive/10 dark:hover:bg-destructive/20' : 'hover:bg-primary/5 dark:hover:bg-primary/10'
                    }`}
                  >
                    {activeTab === 'skipped' && (
                      <td className="px-6 py-4 font-medium text-destructive whitespace-nowrap">
                        {row._skipReason || 'Unknown AI Drop'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{row.first_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">{row.last_name || '-'}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{row.email || '-'}</td>
                    <td className="px-6 py-4 text-foreground">{row.phone || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.company || '-'}</td>
                    <td className="px-6 py-4">
                      {row.status ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {row.status}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-muted-foreground" title={row.crm_note}>
                      {row.crm_note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
    </div>
  );
}
