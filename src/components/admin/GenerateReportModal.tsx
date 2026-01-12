'use client';

import { useState } from 'react';
import { Calendar, Download, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { Issue, StatusFilter } from '@/lib/types';

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: Issue[];
}

function formatDateForExcel(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function generateExcel(issues: Issue[], statusFilter: string): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CRC IT Helpdesk';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('IT Helpdesk Report', {
    views: [{ state: 'frozen', ySplit: 1 }], // Freeze header row
  });

  // Define columns with headers - increased widths for better spacing
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Employee Name', key: 'employeeName', width: 22 },
    { header: 'Employee Email', key: 'employeeEmail', width: 28 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Description', key: 'description', width: 60 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Date Created', key: 'dateCreated', width: 16 },
    { header: 'Date Resolved', key: 'dateResolved', width: 16 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }, // Primary blue color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30; // Taller header

  // Add border to header - only 8 columns (A-H)
  for (let colNumber = 1; colNumber <= 8; colNumber++) {
    const cell = headerRow.getCell(colNumber);
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      right: { style: 'medium', color: { argb: 'FF1E3A8A' } },
    };
  }

  // Calculate row height based on description length
  const calculateRowHeight = (text: string, columnWidth: number): number => {
    const charsPerLine = columnWidth * 1.2; // Approximate chars per line
    const lines = Math.ceil(text.length / charsPerLine);
    const minHeight = 35; // Minimum row height for good spacing
    const lineHeight = 15; // Height per line
    return Math.max(minHeight, lines * lineHeight + 20); // Add padding
  };

  // Add data rows
  issues.forEach((issue, index) => {
    const row = worksheet.addRow({
      id: `  ${issue.id}  `, // Add spacing around ID
      employeeName: issue.employeeName,
      employeeEmail: issue.employeeEmail,
      title: issue.title,
      description: issue.description,
      status: issue.status === 'completed' ? 'Completed' : 'Pending',
      dateCreated: formatDateForExcel(issue.createdAt),
      dateResolved: issue.resolvedAt ? formatDateForExcel(issue.resolvedAt) : 'N/A',
    });

    // Alternate row colors
    const isEvenRow = index % 2 === 0;
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isEvenRow ? 'FFF1F5F9' : 'FFFFFFFF' }, // Slightly more visible alternating
    };

    // Style status cell based on value
    const statusCell = row.getCell('status');
    if (issue.status === 'completed') {
      statusCell.font = { color: { argb: 'FF16A34A' }, bold: true, size: 10 };
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDCFCE7' }, // Light green background
      };
    } else {
      statusCell.font = { color: { argb: 'FFCA8A04' }, bold: true, size: 10 };
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }, // Light amber background
      };
    }

    // Add borders and alignment to only the 8 defined columns (A-H)
    for (let colNumber = 1; colNumber <= 8; colNumber++) {
      const cell = row.getCell(colNumber);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };

      // Different alignment for different columns
      if (colNumber === 1) {
        // ID column - center
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      } else if (colNumber === 6 || colNumber === 7 || colNumber === 8) {
        // Status and date columns - center
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      } else {
        // Text columns - left aligned with wrap
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
      }
    }

    // Dynamic row height based on description length
    row.height = calculateRowHeight(issue.description, 60);
  });

  // Add empty row before summary
  const emptyRowIndex = issues.length + 2;
  worksheet.getRow(emptyRowIndex).height = 20;

  // Add summary section with better styling
  const summaryRowIndex = issues.length + 4;

  // Summary header
  worksheet.mergeCells(`A${summaryRowIndex}:B${summaryRowIndex}`);
  const summaryHeaderCell = worksheet.getCell(`A${summaryRowIndex}`);
  summaryHeaderCell.value = 'Report Summary';
  summaryHeaderCell.font = { bold: true, size: 12, color: { argb: 'FF1E40AF' } };
  summaryHeaderCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEFF6FF' },
  };
  summaryHeaderCell.border = {
    top: { style: 'medium', color: { argb: 'FF1E40AF' } },
    left: { style: 'medium', color: { argb: 'FF1E40AF' } },
    bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
    right: { style: 'medium', color: { argb: 'FF1E40AF' } },
  };
  worksheet.getRow(summaryRowIndex).height = 28;

  // Summary rows styling helper
  const styleSummaryRow = (rowNum: number, label: string, value: string | number, valueColor?: string) => {
    worksheet.getCell(`A${rowNum}`).value = label;
    worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 10 };
    worksheet.getCell(`A${rowNum}`).alignment = { indent: 1 };
    worksheet.getCell(`A${rowNum}`).border = {
      left: { style: 'medium', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    worksheet.getCell(`B${rowNum}`).value = value;
    worksheet.getCell(`B${rowNum}`).font = {
      bold: true,
      size: 10,
      color: valueColor ? { argb: valueColor } : undefined
    };
    worksheet.getCell(`B${rowNum}`).alignment = { horizontal: 'left', indent: 1 };
    worksheet.getCell(`B${rowNum}`).border = {
      right: { style: 'medium', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
    worksheet.getRow(rowNum).height = 22;
  };

  const completedCount = issues.filter(i => i.status === 'completed').length;
  const pendingCount = issues.filter(i => i.status === 'pending').length;

  styleSummaryRow(summaryRowIndex + 1, 'Total Issues:', issues.length);
  styleSummaryRow(summaryRowIndex + 2, 'Completed:', completedCount, 'FF16A34A');
  styleSummaryRow(summaryRowIndex + 3, 'Pending:', pendingCount, 'FFCA8A04');

  // Report type row
  const reportTypeRow = summaryRowIndex + 4;
  worksheet.mergeCells(`A${reportTypeRow}:B${reportTypeRow}`);
  worksheet.getCell(`A${reportTypeRow}`).value = `Report Type: ${statusFilter === 'all' ? 'All Issues' : statusFilter === 'completed' ? 'Completed Only' : 'Pending Only'}`;
  worksheet.getCell(`A${reportTypeRow}`).font = { size: 10 };
  worksheet.getCell(`A${reportTypeRow}`).alignment = { indent: 1 };
  worksheet.getCell(`A${reportTypeRow}`).border = {
    left: { style: 'medium', color: { argb: 'FF1E40AF' } },
    right: { style: 'medium', color: { argb: 'FF1E40AF' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };
  worksheet.getRow(reportTypeRow).height = 22;

  // Generated timestamp row
  const timestampRow = summaryRowIndex + 5;
  worksheet.mergeCells(`A${timestampRow}:B${timestampRow}`);
  worksheet.getCell(`A${timestampRow}`).value = `Generated: ${new Date().toLocaleString('en-GB')}`;
  worksheet.getCell(`A${timestampRow}`).font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
  worksheet.getCell(`A${timestampRow}`).alignment = { indent: 1 };
  worksheet.getCell(`A${timestampRow}`).border = {
    left: { style: 'medium', color: { argb: 'FF1E40AF' } },
    right: { style: 'medium', color: { argb: 'FF1E40AF' } },
    bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
  };
  worksheet.getRow(timestampRow).height = 22;

  // Generate buffer and create blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function downloadExcel(blob: Blob, filename: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function GenerateReportModal({
  open,
  onOpenChange,
  issues,
}: GenerateReportModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    if (start > end) {
      toast.error('Start date must be before end date');
      return;
    }

    setGenerating(true);

    try {
      // Filter issues based on status and date range
      const filteredIssues = issues.filter((issue) => {
        // First filter by status
        if (statusFilter !== 'all' && issue.status !== statusFilter) {
          return false;
        }

        // For completed issues, filter by resolvedAt date
        // For pending/all issues, filter by createdAt date
        if (statusFilter === 'completed' && issue.resolvedAt) {
          const resolvedDate = new Date(issue.resolvedAt);
          return resolvedDate >= start && resolvedDate <= end;
        } else {
          const createdDate = new Date(issue.createdAt);
          return createdDate >= start && createdDate <= end;
        }
      });

      if (filteredIssues.length === 0) {
        const statusText = statusFilter === 'all' ? '' : ` ${statusFilter}`;
        toast.error(`No${statusText} issues found in the selected date range`);
        setGenerating(false);
        return;
      }

      // Generate and download Excel
      const blob = await generateExcel(filteredIssues, statusFilter);
      const statusSuffix = statusFilter === 'all' ? 'all' : statusFilter;
      const filename = `CRC-IT-helpdesk-report-${statusSuffix}-${startDate}-to-${endDate}.xlsx`;
      downloadExcel(blob, filename);

      toast.success(`Report generated with ${filteredIssues.length} issue(s)`);
      onOpenChange(false);

      // Reset form
      setStartDate('');
      setEndDate('');
      setStatusFilter('all');
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
  };

  const getDateFilterLabel = () => {
    if (statusFilter === 'completed') {
      return 'Filter by resolved date';
    }
    return 'Filter by created date';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Select status and date range to generate an Excel report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value: StatusFilter) => setStatusFilter(value)}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issues</SelectItem>
                <SelectItem value="pending">Pending Only</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {getDateFilterLabel()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
