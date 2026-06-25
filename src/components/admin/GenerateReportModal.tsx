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
import type { Issue, StatusFilter, IssueSeverity } from '@/lib/types';

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: Issue[];
}

const TOTAL_COLUMNS = 14;

function formatDateForExcel(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTimeForExcel(dateString: string): string {
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function slaStatusLabel(status: string | null): string {
  switch (status) {
    case 'on_track':        return 'On Track';
    case 'warning':         return 'Warning (75%+)';
    case 'breached':        return 'Breached';
    case 'unclaimed':       return 'Unclaimed (within 1h)';
    case 'unclaimed_breach':return 'Unclaimed (overdue)';
    case 'resolved':        return 'Resolved';
    default:                return 'N/A';
  }
}

function severityLabel(s: IssueSeverity): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function generateExcel(
  issues: Issue[],
  statusFilter: string,
  severityFilter: string,
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CRC IT Service Desk';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('IT Service Desk Report', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: 'ID',               key: 'id',              width: 10 },
    { header: 'Title',            key: 'title',           width: 36 },
    { header: 'Description',      key: 'description',     width: 52 },
    { header: 'Employee Name',    key: 'employeeName',    width: 22 },
    { header: 'Employee Email',   key: 'employeeEmail',   width: 28 },
    { header: 'Priority',         key: 'priority',        width: 12 },
    { header: 'Status',           key: 'status',          width: 14 },
    { header: 'Assigned To',      key: 'assignedTo',      width: 22 },
    { header: 'Resolved By',      key: 'resolvedBy',      width: 22 },
    { header: 'Claimed Within 1h',key: 'claimed',         width: 18 },
    { header: 'SLA Deadline',     key: 'slaDeadline',     width: 20 },
    { header: 'SLA Status',       key: 'slaStatus',       width: 22 },
    { header: 'Date Created',     key: 'dateCreated',     width: 16 },
    { header: 'Date Resolved',    key: 'dateResolved',    width: 16 },
  ];

  // Header row styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 30;
  for (let c = 1; c <= TOTAL_COLUMNS; c++) {
    headerRow.getCell(c).border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      right: { style: 'medium', color: { argb: 'FF1E3A8A' } },
    };
  }

  const calculateRowHeight = (text: string, colWidth: number) => {
    const lines = Math.ceil(text.length / (colWidth * 1.2));
    return Math.max(35, lines * 15 + 20);
  };

  issues.forEach((issue, index) => {
    const claimedText =
      issue.slaAcknowledged === null ? 'Not Yet' :
      issue.slaAcknowledged ? 'Yes' : 'No';

    const row = worksheet.addRow({
      id:           `  ${issue.id}  `,
      title:        issue.title,
      description:  issue.description,
      employeeName: issue.employeeName,
      employeeEmail:issue.employeeEmail,
      priority:     severityLabel(issue.severity),
      status:       issue.status === 'completed' ? 'Completed' : 'Pending',
      assignedTo:   issue.assignedToName ?? 'Unassigned',
      resolvedBy:   issue.resolvedByName ?? '—',
      claimed:      claimedText,
      slaDeadline:  issue.slaResolveBy ? formatDateTimeForExcel(issue.slaResolveBy) : 'Awaiting Claim',
      slaStatus:    slaStatusLabel(issue.slaStatus),
      dateCreated:  formatDateForExcel(issue.createdAt),
      dateResolved: issue.resolvedAt ? formatDateForExcel(issue.resolvedAt) : 'N/A',
    });

    // Alternating row background
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: index % 2 === 0 ? 'FFF1F5F9' : 'FFFFFFFF' },
    };

    // Priority cell colour
    const priorityColors: Record<string, { bg: string; fg: string }> = {
      Critical: { bg: 'FFFFE4E4', fg: 'FFDC2626' },
      High:     { bg: 'FFFFF7ED', fg: 'FFD97706' },
      Low:      { bg: 'FFFEFCE8', fg: 'FFCA8A04' },
      Minor:    { bg: 'FFF8FAFC', fg: 'FF64748B' },
    };
    const pc = priorityColors[severityLabel(issue.severity)];
    if (pc) {
      const cell = row.getCell('priority');
      cell.font = { bold: true, size: 10, color: { argb: pc.fg } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pc.bg } };
    }

    // Status cell colour
    const statusCell = row.getCell('status');
    if (issue.status === 'completed') {
      statusCell.font = { color: { argb: 'FF16A34A' }, bold: true, size: 10 };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    } else {
      statusCell.font = { color: { argb: 'FFCA8A04' }, bold: true, size: 10 };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
    }

    // SLA Status cell colour
    const slaColors: Record<string, { bg: string; fg: string }> = {
      'On Track':              { bg: 'FFDCFCE7', fg: 'FF16A34A' },
      'Warning (75%+)':       { bg: 'FFFEFCE8', fg: 'FFCA8A04' },
      'Breached':              { bg: 'FFFFE4E4', fg: 'FFDC2626' },
      'Unclaimed (within 1h)':{ bg: 'FFFEF3C7', fg: 'FFD97706' },
      'Unclaimed (overdue)':  { bg: 'FFFFE4E4', fg: 'FFDC2626' },
      'Resolved':              { bg: 'FFEFF6FF', fg: 'FF1E40AF' },
    };
    const label = slaStatusLabel(issue.slaStatus);
    const sc = slaColors[label];
    if (sc) {
      const cell = row.getCell('slaStatus');
      cell.font = { bold: true, size: 10, color: { argb: sc.fg } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sc.bg } };
    }

    // Claimed cell colour
    const claimedCell = row.getCell('claimed');
    if (issue.slaAcknowledged === true) {
      claimedCell.font = { bold: true, size: 10, color: { argb: 'FF16A34A' } };
    } else if (issue.slaAcknowledged === false) {
      claimedCell.font = { bold: true, size: 10, color: { argb: 'FFDC2626' } };
    }

    // Borders and alignment for all columns
    for (let c = 1; c <= TOTAL_COLUMNS; c++) {
      const cell = row.getCell(c);
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left:   { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right:  { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
      // ID — center; date/status/priority/sla cols — center; text cols — left with wrap
      const centredCols = [1, 6, 7, 10, 11, 12, 13, 14];
      if (centredCols.includes(c)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
      }
    }

    row.height = calculateRowHeight(issue.description, 52);
  });

  // ── Summary section ─────────────────────────────────────────────────────
  const emptyRow = issues.length + 2;
  worksheet.getRow(emptyRow).height = 20;

  const sumStart = issues.length + 4;

  worksheet.mergeCells(`A${sumStart}:C${sumStart}`);
  const summaryHeader = worksheet.getCell(`A${sumStart}`);
  summaryHeader.value = 'Report Summary';
  summaryHeader.font = { bold: true, size: 12, color: { argb: 'FF1E40AF' } };
  summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
  summaryHeader.border = {
    top: { style: 'medium', color: { argb: 'FF1E40AF' } },
    left: { style: 'medium', color: { argb: 'FF1E40AF' } },
    bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
    right: { style: 'medium', color: { argb: 'FF1E40AF' } },
  };
  worksheet.getRow(sumStart).height = 28;

  const addSummaryRow = (rowNum: number, label: string, value: string | number, valueColor?: string) => {
    const lCell = worksheet.getCell(`A${rowNum}`);
    lCell.value = label;
    lCell.font = { bold: true, size: 10 };
    lCell.alignment = { indent: 1 };
    lCell.border = {
      left:   { style: 'medium', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'thin',   color: { argb: 'FFE2E8F0' } },
    };

    const vCell = worksheet.getCell(`B${rowNum}`);
    vCell.value = value;
    vCell.font = { bold: true, size: 10, ...(valueColor ? { color: { argb: valueColor } } : {}) };
    vCell.alignment = { horizontal: 'left', indent: 1 };
    vCell.border = {
      right:  { style: 'medium', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'thin',   color: { argb: 'FFE2E8F0' } },
    };
    worksheet.getRow(rowNum).height = 22;
  };

  const completedCount  = issues.filter(i => i.status === 'completed').length;
  const pendingCount    = issues.filter(i => i.status === 'pending').length;
  const criticalCount   = issues.filter(i => i.severity === 'critical').length;
  const highCount       = issues.filter(i => i.severity === 'high').length;
  const lowCount        = issues.filter(i => i.severity === 'low').length;
  const minorCount      = issues.filter(i => i.severity === 'minor').length;
  const breachedCount   = issues.filter(i => i.slaStatus === 'breached').length;

  let r = sumStart + 1;
  addSummaryRow(r++, 'Total Issues:',   issues.length);
  addSummaryRow(r++, 'Completed:',      completedCount,  'FF16A34A');
  addSummaryRow(r++, 'Pending:',        pendingCount,    'FFCA8A04');
  addSummaryRow(r++, '─ Critical:',     criticalCount,   'FFDC2626');
  addSummaryRow(r++, '─ High:',         highCount,       'FFD97706');
  addSummaryRow(r++, '─ Low:',          lowCount,        'FFCA8A04');
  addSummaryRow(r++, '─ Minor:',        minorCount,      'FF64748B');
  addSummaryRow(r++, 'SLA Breached:',   breachedCount,   breachedCount > 0 ? 'FFDC2626' : undefined);

  // Filters applied row
  worksheet.mergeCells(`A${r}:B${r}`);
  const filterCell = worksheet.getCell(`A${r}`);
  filterCell.value = `Filters: Status = ${statusFilter === 'all' ? 'All' : statusFilter}${severityFilter !== 'all' ? ` | Priority = ${severityLabel(severityFilter as IssueSeverity)}` : ''}`;
  filterCell.font = { size: 10 };
  filterCell.alignment = { indent: 1 };
  filterCell.border = {
    left:   { style: 'medium', color: { argb: 'FF1E40AF' } },
    right:  { style: 'medium', color: { argb: 'FF1E40AF' } },
    bottom: { style: 'thin',   color: { argb: 'FFE2E8F0' } },
  };
  worksheet.getRow(r++).height = 22;

  // Generated timestamp
  worksheet.mergeCells(`A${r}:B${r}`);
  const tsCell = worksheet.getCell(`A${r}`);
  tsCell.value = `Generated: ${new Date().toLocaleString('en-GB')}`;
  tsCell.font = { italic: true, size: 9, color: { argb: 'FF64748B' } };
  tsCell.alignment = { indent: 1 };
  tsCell.border = {
    left:   { style: 'medium', color: { argb: 'FF1E40AF' } },
    right:  { style: 'medium', color: { argb: 'FF1E40AF' } },
    bottom: { style: 'medium', color: { argb: 'FF1E40AF' } },
  };
  worksheet.getRow(r).height = 22;

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
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

export function GenerateReportModal({ open, onOpenChange, issues }: GenerateReportModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      toast.error('Start date must be before end date');
      return;
    }

    setGenerating(true);
    try {
      const filtered = issues.filter((issue) => {
        if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
        if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;

        const dateToCheck = statusFilter === 'completed' && issue.resolvedAt
          ? new Date(issue.resolvedAt)
          : new Date(issue.createdAt);

        return dateToCheck >= start && dateToCheck <= end;
      });

      if (filtered.length === 0) {
        toast.error('No issues found matching the selected filters and date range');
        setGenerating(false);
        return;
      }

      const blob = await generateExcel(filtered, statusFilter, severityFilter);
      const sevSuffix = severityFilter !== 'all' ? `-${severityFilter}` : '';
      const filename = `CRC-IT-report-${statusFilter}${sevSuffix}-${startDate}-to-${endDate}.xlsx`;
      downloadExcel(blob, filename);

      toast.success(`Report generated — ${filtered.length} issue(s) exported`);
      onOpenChange(false);
      setStartDate('');
      setEndDate('');
      setStatusFilter('all');
      setSeverityFilter('all');
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
    setSeverityFilter('all');
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
            Filter by status, priority, and date range to export an Excel report.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v: StatusFilter) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="pending">Pending Only</SelectItem>
                  <SelectItem value="completed">Completed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {statusFilter === 'completed' ? 'Filtering by resolved date' : 'Filtering by created date'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
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
