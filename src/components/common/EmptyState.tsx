import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-pk-blue-light/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-pk-primary-border dark:border-slate-700 my-4">
      {icon && (
        <div className="p-3 bg-pk-primary-subtle dark:bg-pk-primary/10 rounded-full text-pk-primary mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
