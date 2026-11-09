import { useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';

export interface OptionImageFieldProps {
  /** Option letter, e.g. "A" (used in labels). */
  option: string;
  /** Current image URL ('' or undefined when the option has no image). */
  value?: string;
  /** Called with the uploaded image URL, or '' when the image is removed. */
  onChange: (url: string) => void;
  /** Reports upload errors (falls back to alert). */
  onError?: (message: string) => void;
  disabled?: boolean;
}

/**
 * Image for one MCQ answer option: upload, preview, replace and remove. The file goes to the
 * question-images Storage bucket through the validated upload; only its URL is kept.
 */
export function OptionImageField({
  option,
  value,
  onChange,
  onError,
  disabled,
}: OptionImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const upload = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await api.uploadQuestionImage(file);
      onChange(url);
    } catch (err) {
      const message = `Option ${option} image could not be uploaded: ${getErrorMessage(err, 'Upload failed')}`;
      if (onError) onError(message);
      else alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        aria-label={`Option ${option} image file`}
        onChange={(e) => {
          const input = e.currentTarget;
          const file = input.files?.[0];
          // Allow choosing the same file again later (e.g. after an error)
          input.value = '';
          if (file) void upload(file);
        }}
      />

      {value ? (
        <div className="flex items-center gap-2">
          <img
            src={value}
            alt={`Option ${option} image`}
            className="h-16 max-w-[8rem] rounded-lg border border-slate-200 dark:border-slate-700 object-contain bg-white"
          />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={pick}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#026BFC] hover:underline disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {isUploading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={disabled || isUploading}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#026BFC] disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
          {isUploading ? 'Uploading…' : `Add image to option ${option}`}
        </button>
      )}
    </div>
  );
}
