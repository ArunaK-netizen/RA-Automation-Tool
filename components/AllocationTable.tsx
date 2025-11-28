'use client'

import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Allocation } from '@/lib/types'
import { Download, Search } from 'lucide-react'

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
    // Filter out empId and numLabsReq from the data
    const dataToExport = filteredAllocations.map(({ empId, numLabsReq, ...rest }) => rest);
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allocations");
    XLSX.writeFile(workbook, "lab_allocation.xlsx");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
        </div>
        <button
          onClick={handleDownloadExcel}
          className="w-full md:w-auto px-4 py-2 text-sm font-medium text-primary bg-transparent border border-primary rounded-md hover:bg-primary/10 hover:-translate-y-px transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full divide-y divide-border bg-card">
          <thead className="bg-background">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">RA Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">RA ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Course Code</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Course Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Faculty</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Slot</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedAllocations.length > 0 ? (
              paginatedAllocations.map((a, index) => (
                <tr key={index} className="hover:bg-background/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{a.raName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{a.empId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{a.courseCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{a.courseTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{a.employeeName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{a.slot}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{a.roomNumber}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted">No matching allocations found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-muted bg-background rounded-md hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-muted bg-background rounded-md hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
