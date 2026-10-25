import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  text: string;
  tone: Tone;
  action?: { label: string; onClick: () => void };
}

const ToastContext = createContext<(text: string, tone?: Tone, action?: ToastItem['action']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((text: string, tone: Tone = 'info', action?: ToastItem['action']) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, text, tone, action }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), action ? 6000 : 3500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-card px-4 py-3 text-[13.5px] font-medium text-white shadow-raised',
              t.tone === 'success' && 'bg-[#15803D]',
              t.tone === 'error' && 'bg-danger',
              t.tone === 'info' && 'bg-[#0F172A]'
            )}
          >
            {t.tone === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : t.tone === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <Info className="h-5 w-5 shrink-0" />}
            <span className="flex-1">{t.text}</span>
            {t.action && (
              <button
                type="button"
                className="font-bold uppercase text-amber-300 hover:underline"
                onClick={() => {
                  t.action?.onClick();
                  setItems((s) => s.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
