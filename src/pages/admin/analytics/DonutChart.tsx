import React from 'react';

// Donut Chart Component
export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export const DonutChart: React.FC<{
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
  size?: number;
  strokeWidth?: number;
}> = ({ slices, centerValue, centerLabel, size = 130, strokeWidth = 14 }) => {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
      >
        {slices.map((slice, idx) => {
          const slicePercent = slice.value / total;
          const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercent * circumference;
          cumulativePercent += slicePercent;

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
          {centerValue}
        </span>
        <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-none mt-0.5">
          {centerLabel}
        </span>
      </div>
    </div>
  );
};
