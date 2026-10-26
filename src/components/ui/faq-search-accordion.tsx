import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface FaqSearchAccordionProps {
  data: FAQItem[];
  className?: string;
  /** Item open on first render. */
  defaultOpenId?: number;
  searchPlaceholder?: string;
  emptyText?: string;
}

const EASE = [0.4, 0, 0.2, 1] as const;

/**
 * Search box over a list of soft cards. One answer is open at a time: opening another closes
 * the first as the new one grows open, the answer fades in, and the chevron turns.
 */
export function FaqSearchAccordion({
  data,
  className,
  defaultOpenId,
  searchPlaceholder = 'Search FAQs...',
  emptyText = 'No matching questions.',
}: FaqSearchAccordionProps) {
  const [openId, setOpenId] = React.useState<number | null>(defaultOpenId ?? null);
  const [query, setQuery] = React.useState('');
  const baseId = React.useId();

  const term = query.trim().toLowerCase();
  const items = term
    ? data.filter((item) => `${item.question} ${item.answer}`.toLowerCase().includes(term))
    : data;

  return (
    <div className={cn('space-y-4', className)}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="h-14 w-full rounded-full border border-slate-200 bg-white px-6 text-base text-slate-900 outline-none transition-shadow placeholder:text-slate-400 focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60"
      />

      <motion.div layout className="space-y-4">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item) => {
            const isOpen = openId === item.id;
            const panelId = `${baseId}-${item.id}`;
            return (
              <motion.div
                key={item.id}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="rounded-[20px] bg-white"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 rounded-[20px] px-6 py-5 text-left text-base sm:text-lg font-semibold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
                  >
                    {item.question}
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="flex-shrink-0 text-slate-500"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ height: { duration: 0.32, ease: EASE }, opacity: { duration: 0.25, ease: EASE } }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-[15px] sm:text-base leading-relaxed text-slate-500">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {items.length === 0 && <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>}
      </motion.div>
    </div>
  );
}
