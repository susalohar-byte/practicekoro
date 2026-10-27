export type ToastType = 'success' | 'error' | 'info';

export const PRESET_LOGOS = [
  { name: 'WBP Police', url: '/images/exams/logo_wbp.png' },
  { name: 'Kolkata Police', url: '/images/exams/logo_kp.png' },
  { name: 'WBPSC', url: '/images/exams/logo_wbpsc.png' },
  { name: 'WBSSC Group C/D', url: '/images/exams/emblem_wbssc.png' },
  { name: 'Railway', url: '/images/exams/logo_railway.png' },
  { name: 'SSC', url: '/images/exams/logo_ssc.png' },
  { name: 'WB TET', url: '/images/exams/logo_wbtet.png' },
];

export function formatScheduledDate(
  dateStr: string | null | undefined
): { date: string; time: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return {
    date: `${day < 10 ? '0' + day : day} ${month} ${year}`,
    time: `${formattedHours}:${minutes} ${ampm}`,
  };
}

export const getDefaultStartDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};
