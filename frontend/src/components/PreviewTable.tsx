import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileX } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

interface PreviewTableProps {
  data: any[];
}

export default function PreviewTable({ data }: PreviewTableProps) {
  // --- STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100; // Limit rendering for performance

  // If no data, render empty state
  if (!data || data.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={FileX}
          title="No Data Found"
          description="The CSV file was empty or could not be parsed correctly."
        />
      </div>
    );
  }

  // Extract column headers dynamically from the first row of JSON
  const columns = Object.keys(data[0]);

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = data.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="w-full flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-700 mt-8">
      
      {/* Table Header / Meta Data */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Data Preview</h3>
        <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shadow-sm">
          {data.length.toLocaleString()} Total Rows
        </span>
      </div>

      {/* TABLE CONTAINER (Handles borders, shadows, and overflow) */}
      <div className="w-full border border-border rounded-2xl shadow-sm bg-card overflow-hidden">
        
        {/* The Scrollable Area (Vertical & Horizontal) */}
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-sm text-left">
            
            {/* STICKY HEADER */}
            <thead className="text-xs text-muted-foreground uppercase bg-muted/80 sticky top-0 z-10 shadow-sm backdrop-blur-md border-b">
              <tr>
                <th className="px-6 py-4 font-bold border-r border-border/50 bg-muted/80 backdrop-blur-md sticky left-0 z-20 w-16 text-center">
                  #
                </th>
                {columns.map((col, index) => (
                  <th key={index} className="px-6 py-4 font-bold whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* TABLE BODY (Alternating Colors) */}
            <tbody className="divide-y divide-border/50">
              {currentData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors even:bg-muted/10 odd:bg-transparent group"
                >
                  {/* Row Number Column (Sticky to left when scrolling horizontally) */}
                  <td className="px-6 py-3 font-semibold text-muted-foreground border-r border-border/50 bg-card/95 backdrop-blur-sm group-even:bg-muted/10 group-hover:bg-primary/5 dark:group-hover:bg-primary/10 transition-colors sticky left-0 z-10 text-center">
                    {startIndex + rowIndex + 1}
                  </td>
                  
                  {/* Dynamic Data Cells */}
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-3 text-foreground whitespace-nowrap max-w-[300px] truncate">
                      {row[col] ? (
                        <span>{row[col]}</span>
                      ) : (
                        <span className="text-muted-foreground/40 italic">empty</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 px-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to <span className="font-semibold text-foreground">{Math.min(startIndex + rowsPerPage, data.length)}</span> of <span className="font-semibold text-foreground">{data.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center p-2 rounded-lg border shadow-sm bg-card text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium px-2 text-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center p-2 rounded-lg border shadow-sm bg-card text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
