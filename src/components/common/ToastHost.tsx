import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { subscribeToasts, type ToastItem } from '@/lib/toast';

/** Errors stay longer so they can be read. */
const lifetimeMs = (item: ToastItem) => (item.kind === 'error' ? 8000 : 4000);
const MAX_VISIBLE = 4;

const ICONS = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
  error: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />,
  info: <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />,
};

/** Renders messages sent with `toast()`. Mount once, near the root of the admin panel. */
export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const unsubscribe = subscribeToasts((item) => {
      setItems((prev) => [...prev, item].slice(-MAX_VISIBLE));
      const timer = setTimeout(() => {
        timers.delete(timer);
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, lifetimeMs(item));
      timers.add(timer);
    });
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-[min(24rem,calc(100vw-3rem))]">
      {items.map((item) => (
        <div
          key={item.id}
          role={item.kind === 'error' ? 'alert' : 'status'}
          className="bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-start gap-2 animate-in slide-in-from-bottom-2 duration-200 border border-slate-700"
        >
          {ICONS[item.kind]}
          <span className="flex-1 whitespace-pre-line break-words">{item.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
            className="text-slate-400 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
