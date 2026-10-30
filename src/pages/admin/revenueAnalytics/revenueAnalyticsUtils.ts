import { csvCell } from '@/utils/csvExport';
import type { DateRangePreset } from '@/types';

// CSV Export helper
export const exportToCsv = (
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
) => {
  const escapeCell = csvCell;

  const csvRows = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ];
  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const presetOptions: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];
