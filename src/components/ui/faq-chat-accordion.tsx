import * as React from 'react';
import { motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  /** A small emoji pinned to the corner of the question bubble. */
  icon?: string;
  iconPosition?: 'left' | 'right';
}

interface FaqAccordionProps {
  data: FAQItem[];
  className?: string;
  /** Small caption above the list, like a chat timestamp. */
  timestamp?: string;
  questionClassName?: string;
  answerClassName?: string;
  /** Item open on first render. */
  defaultOpenId?: number;
}

/** FAQ list styled as a chat: questions are bubbles you tap, answers reply below them. */
export function FaqAccordion({
  data,
  className,
  timestamp,
  questionClassName,
  answerClassName,
  defaultOpenId,
}: FaqAccordionProps) {
  const [openId, setOpenId] = React.useState<number | null>(defaultOpenId ?? null);
  const baseId = React.useId();

  return (
    <div className={cn('p-4', className)}>
      {timestamp && <div className="mb-4 text-sm text-slate-500">{timestamp}</div>}

      <div>
        {data.map((item) => {
          const isOpen = openId === item.id;
          const panelId = `${baseId}-${item.id}`;
          return (
            <div key={item.id} className="mb-3">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-start gap-x-4 text-left cursor-pointer"
                >
                  <div
                    className={cn(
                      'relative flex items-center rounded-xl px-4 py-2.5 transition-colors',
                      isOpen
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                        : 'bg-white text-slate-900 ring-1 ring-slate-200/80 shadow-sm hover:bg-blue-50/60',
                      questionClassName,
                    )}
                  >
                    {item.icon && (
                      <span
                        aria-hidden
                        className={cn('absolute bottom-7 text-lg', item.iconPosition === 'right' ? '-right-1' : '-left-1')}
                        style={{ transform: item.iconPosition === 'right' ? 'rotate(7deg)' : 'rotate(-4deg)' }}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="font-medium">{item.question}</span>
                  </div>

                  <span className={cn('flex-shrink-0 text-slate-400', isOpen && 'text-blue-600')}>
                    {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </span>
                </button>
              </h3>

              <motion.div
                id={panelId}
                role="region"
                initial={false}
                animate={isOpen ? 'open' : 'collapsed'}
                variants={{
                  open: { opacity: 1, height: 'auto' },
                  collapsed: { opacity: 0, height: 0 },
                }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden"
                aria-hidden={!isOpen}
              >
                <div className="ml-7 mt-2 md:ml-16">
                  <div
                    className={cn(
                      'relative max-w-xl rounded-2xl rounded-tl-md bg-blue-600 px-4 py-2.5 text-white',
                      answerClassName,
                    )}
                  >
                    {item.answer}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
