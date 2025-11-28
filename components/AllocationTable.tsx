'use client'

import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Allocation } from '@/lib/types'
import { Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

interface AllocationTableProps {
  allocations: Allocation[]
  selectedRA: string | null
}

const ITEMS_PER_PAGE = 10;

export default function AllocationTable({ allocations, selectedRA }: AllocationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAllocations = useMemo(() => {
    let filtered = allocations;

    if (selectedRA) {
      filtered = filtered.filter(a => a.raName === selectedRA);
    }

    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (a.raName || '').toLowerCase().includes(lowercasedFilter) ||
        String(a.empId || '').toLowerCase().includes(lowercasedFilter)
      );
    }

    return filtered;
  }, [allocations, selectedRA, searchTerm]);

  const paginatedAllocations = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAllocations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAllocations, currentPage]);

  const totalPages = Math.ceil(filteredAllocations.length / ITEMS_PER_PAGE);

  const handleDownloadExcel = () => {
    const dataToExport = filteredAllocations.map(({ empId, numLabsReq, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allocations");
    XLSX.writeFile(workbook, "lab_allocation.xlsx");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-xl bg-background/50 backdrop-blur-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm hover:shadow-md"
          />
        </div>
        <button
          onClick={handleDownloadExcel}
          className="w-full md:w-auto px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {/* Table Container */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/20 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-muted-foreground font-medium">
              <tr>
                <th className="px-6 py-4 font-display">RA Name</th>
                <th className="px-6 py-4 font-display">RA ID</th>
                <th className="px-6 py-4 font-display">Course</th>
                <th className="px-6 py-4 font-display">Title</th>
                <th className="px-6 py-4 font-display">Faculty</th>
                <th className="px-6 py-4 font-display">Slot</th>
                <th className="px-6 py-4 font-display">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedAllocations.length > 0 ? (
                paginatedAllocations.map((a, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-primary/5 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">
                      {a.raName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{a.empId || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                        {a.courseCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate" title={a.courseTitle}>
                      {a.courseTitle}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{a.employeeName}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-foreground bg-secondary/50 px-2 py-1 rounded">
                        {a.slot}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{a.roomNumber}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-8 h-8 text-muted-foreground/50" />
                      <p>No allocations found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-secondary/30">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAllocations.length)}</span> of <span className="font-medium text-foreground">{filteredAllocations.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Simple logic to show first 5 pages, can be improved for large page counts
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${currentPage === pageNum
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'hover:bg-background text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
