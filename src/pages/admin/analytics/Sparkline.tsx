import React from 'react';

// Mini Sparkline Component
export const Sparkline: React.FC<{ points: number[]; color: string }> = ({ points, color }) => {
  if (!points || points.length < 2) return <span className="text-[10px] text-slate-400">—</span>;
  const safePoints = points;
  const min = Math.min(...safePoints);
  const max = Math.max(...safePoints);
  const range = max - min || 1;
  const width = 56;
  const height = 18;
  const step = width / Math.max(1, safePoints.length - 1);
  const coords = safePoints
    .map((p, i) => `${i * step},${height - ((p - min) / range) * (height - 4) - 2}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
};
