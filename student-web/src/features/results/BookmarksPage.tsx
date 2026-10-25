import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck, Check, Lightbulb } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { qk, useBookmarks } from '@/hooks/queries';
import { addBookmark, removeBookmark } from '@/services/account';
import { deleteSavedQuestion, readSavedQuestions, writeSavedQuestion } from '@/lib/savedQuestions';
import { friendlyError } from '@/lib/errors';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState, Loader, Message } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { OPTION_LETTERS } from '@/types/models';

export default function BookmarksPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const bookmarks = useBookmarks();
  const [version, setVersion] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const local = useMemo(() => (user ? readSavedQuestions(user.id) : {}), [user, version]);

  const items = (bookmarks.data ?? []).map((b) => ({ b, q: local[b.questionId] }));
  const withContent = items.filter((i) => i.q);
  const elsewhere = items.length - withContent.length;

  const remove = async (questionId: string) => {
    if (!user) return;
    const snapshot = local[questionId];
    try {
      await removeBookmark(user.id, questionId);
      deleteSavedQuestion(user.id, questionId);
      setVersion((v) => v + 1);
      void queryClient.invalidateQueries({ queryKey: qk.bookmarks(user.id) });
      toast('Question removed from saved bookmarks', 'info', {
        label: 'Undo',
        onClick: async () => {
          await addBookmark(user.id, questionId);
          if (snapshot) writeSavedQuestion(user.id, snapshot);
          setVersion((v) => v + 1);
          void queryClient.invalidateQueries({ queryKey: qk.bookmarks(user.id) });
        },
      });
    } catch (e) {
      toast(friendlyError(e, 'Could not remove the bookmark.'), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`Saved Questions (${items.length})`} back="/profile" />
      {bookmarks.isLoading ? (
        <Loader />
      ) : bookmarks.isError ? (
        <ErrorState message="Your saved questions could not be loaded." error={bookmarks.error} onRetry={() => void bookmarks.refetch()} />
      ) : items.length === 0 ? (
        <Message
          icon={<Bookmark />}
          title="No Saved Questions Yet"
          message="Tap the bookmark icon on any question in a solution to save it here for easy revision."
        />
      ) : (
        <>
          {elsewhere > 0 && (
            <p className="mb-4 rounded-card border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3 text-[13px] text-[#1D4ED8]">
              {elsewhere} saved {elsewhere === 1 ? 'question was' : 'questions were'} bookmarked on another device. Open that test's
              solutions to see {elsewhere === 1 ? 'it' : 'them'} here.
            </p>
          )}
          <ul className="grid items-start gap-3.5 xl:grid-cols-2">
            {withContent.map(({ b, q }, i) => (
              <li key={b.id} className="rounded-2xl border border-[#E2E8F0] bg-white shadow-card">
                <div className="flex items-center gap-2 border-b border-[#F1F5F9] px-3.5 py-2.5">
                  <span className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] px-2 py-0.5 text-[12px] font-extrabold text-[#1D4ED8]">Q #{i + 1}</span>
                  <span className="text-[11.5px] font-semibold text-[#64748B]">Marks: {q!.marks}</span>
                  <button type="button" onClick={() => void remove(b.questionId)} aria-label="Remove bookmark" title="Remove bookmark" className="ml-auto rounded-full p-1.5 text-[#2563EB] hover:bg-surface">
                    <BookmarkCheck className="h-[22px] w-[22px]" />
                  </button>
                </div>
                <div className="px-3.5 pb-3.5 pt-3">
                  {q!.textBengali && (
                    <p lang="bn" className="whitespace-pre-line text-[15.5px] font-bold text-[#0F172A]">
                      {q!.textBengali}
                    </p>
                  )}
                  <p className={cn('whitespace-pre-line', q!.textBengali ? 'mt-1 text-[13px] font-medium text-[#64748B]' : 'text-[15.5px] font-bold text-[#0F172A]')}>{q!.textEnglish}</p>
                  <ul className="mt-3 space-y-2">
                    {OPTION_LETTERS.filter((l) => q!.options[l]).map((l) => {
                      const ok = l === q!.correct;
                      return (
                        <li key={l} className={cn('flex items-center gap-2.5 rounded-[10px] px-3 py-2.5', ok ? 'border-[1.5px] border-success bg-[#F0FDF4]' : 'border border-[#E2E8F0] bg-[#F8FAFC]')}>
                          <span className={cn('flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[12px] font-bold', ok ? 'bg-success text-white' : 'border border-[#CBD5E1] bg-white text-[#475569]')}>
                            {ok ? <Check className="h-4 w-4" /> : l}
                          </span>
                          <span className={cn('flex-1 text-[13.5px]', ok ? 'font-bold text-[#15803D]' : 'font-medium text-[#1E293B]')}>{q!.options[l]}</span>
                          {ok && <span className="rounded bg-[#DCFCE7] px-1.5 text-[10.5px] font-bold text-[#15803D]">Correct</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {(q!.explanationBengali || q!.explanation) && (
                    <div className="mt-3 flex gap-2.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                      <Lightbulb className="h-5 w-5 shrink-0 text-success" />
                      <div>
                        <p lang="bn" className="text-[12.5px] font-extrabold text-[#166534]">
                          ব্যাখ্যা (Explanation):
                        </p>
                        <p className="whitespace-pre-line text-[12.5px] leading-relaxed text-[#14532D]">{q!.explanationBengali || q!.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
