import React, { useState, useRef, useCallback } from 'react';
import { Upload, RefreshCw, FileText, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileDropZoneProps {
  /** Accepted MIME types or extensions, e.g. "image/png,image/jpeg,.csv" */
  accept?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether an upload/processing operation is currently in progress */
  isProcessing?: boolean;
  /** Callback fired when a file is selected or dropped */
  onFile: (file: File) => void;
  /** Currently selected file (if any) */
  selectedFile?: File | null;
  /** Callback fired when removing/clearing the selected file */
  onClear?: () => void;
  /** Custom label text while idle */
  label?: string;
  /** Label shown while processing/uploading */
  processingLabel?: string;
  /** Hint text shown below the label */
  hint?: string;
  /** Button text inside the zone */
  buttonLabel?: string;
  /** Additional wrapper classes */
  className?: string;
  /** Custom icon element to show instead of default Upload icon */
  icon?: React.ReactNode;
  /** Optional aria-label for accessibility/tests */
  ariaLabel?: string;
  /** Children to render inside the dropzone (overrides default content) */
  children?: React.ReactNode;
}

/**
 * FileDropZone
 *
 * Reusable drag-and-drop + click-to-browse file input zone.
 * Provides visual feedback on drag-over, displays selected file details,
 * and can be customized for images, CSVs, or any other file type upload.
 */
export const FileDropZone: React.FC<FileDropZoneProps> = ({
  accept,
  disabled = false,
  isProcessing = false,
  onFile,
  selectedFile,
  onClear,
  label = 'Click to upload or drag & drop',
  processingLabel = 'Processing...',
  hint,
  buttonLabel = 'Browse File',
  className,
  icon,
  ariaLabel,
  children,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || isProcessing) return;

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    },
    [disabled, isProcessing]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled || isProcessing) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFile(file);
      }
    },
    [disabled, isProcessing, onFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFile(file);
      }
      // Reset so the same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  }, [disabled, isProcessing]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        'relative cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 select-none',
        dragActive
          ? 'border-[#026BFC] bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-blue-500/10 scale-[1.01]'
          : selectedFile
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50',
        (disabled || isProcessing) && 'opacity-60 pointer-events-none',
        className
      )}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        aria-label={ariaLabel}
        accept={accept}
        disabled={disabled || isProcessing}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag overlay state */}
      {dragActive && (
        <div className="absolute inset-0 rounded-2xl bg-blue-500/10 dark:bg-blue-600/20 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5 z-10 pointer-events-none">
          <Upload className="w-8 h-8 text-[#026BFC] dark:text-blue-400 animate-bounce" />
          <p className="text-xs font-bold text-[#026BFC] dark:text-blue-300">
            Drop file here to upload
          </p>
        </div>
      )}

      {children ? (
        children
      ) : selectedFile ? (
        <div className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 shadow-2xs text-left">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>{formatFileSize(selectedFile.size)}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleClick}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Change
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Default idle state */}
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-[#026BFC] shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700">
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin text-[#026BFC]" />
            ) : (
              icon || <Upload className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isProcessing ? processingLabel : label}
            </p>
            {hint && <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
          </div>

          {!isProcessing && (
            <button
              type="button"
              className="mt-0.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all pointer-events-none"
            >
              {buttonLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
};
