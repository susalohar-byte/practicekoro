import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminPerformance } from './performance/useAdminPerformance';
import { PerformanceHeader } from './performance/PerformanceHeader';
import { PerformanceStatCards } from './performance/PerformanceStatCards';
import { PerformanceChartsRow } from './performance/PerformanceChartsRow';
import { PerformanceTablesPanel } from './performance/PerformanceTablesPanel';
import { PerformanceDateRangeModal } from './performance/PerformanceDateRangeModal';
import { PerformanceQuestionModal } from './performance/PerformanceQuestionModal';
export type {
  WrongQuestionItem,
  TopicMetricItem,
  SubjectMetricItem,
} from './performance/performanceUtils';

export const AdminPerformance: React.FC = () => {
  const perf = useAdminPerformance();
  const { pageLoading } = perf;
  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      <PerformanceHeader perf={perf} />

      <PerformanceStatCards perf={perf} />

      <PerformanceChartsRow perf={perf} />

      <PerformanceTablesPanel perf={perf} />

      <PerformanceDateRangeModal perf={perf} />

      <PerformanceQuestionModal perf={perf} />
    </div>,
    { label: 'Loading performance…', variant: 'dashboard' }
  );
};
