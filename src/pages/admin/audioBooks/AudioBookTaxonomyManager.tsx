import React, { useEffect, useState } from 'react';
import { Check, ChevronRight, FolderTree, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import {
  audioBookAdminApi,
  type AudioBookTaxonomy,
  type AudioBookUsage,
} from '@/services/domains/audiobooks';
import { inputClass, type ConfirmRequest } from './shared';

interface TaxonomyManagerProps {
  taxonomy: AudioBookTaxonomy;
  usage: AudioBookUsage;
  onChanged: () => Promise<void>;
  confirm: (request: ConfirmRequest) => void;
  notify: (type: 'success' | 'error', text: string) => void;
}

interface Item {
  id: string;
  name: string;
  meta: string;
  books: number;
  children: number;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** One column of the category -> subject -> topic browser. */
const Column: React.FC<{
  title: string;
  entity: string;
  items: Item[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  disabledReason?: string;
  childLabel?: string;
  onCreate: (name: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (item: Item) => void;
}> = ({
  title,
  entity,
  items,
  selectedId,
  onSelect,
  disabledReason,
  childLabel,
  onCreate,
  onRename,
  onDelete,
}) => {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAdding(false);
    setEditingId(null);
    setError(null);
  }, [disabledReason]);

  const run = async (action: () => Promise<void>, done: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      done();
    } catch (err) {
      setError(getErrorMessage(err, `The ${entity} could not be saved.`));
    } finally {
      setBusy(false);
    }
  };

  const submitNew = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || busy) return;
    void run(
      () => onCreate(name),
      () => {
        setNewName('');
        setAdding(false);
      }
    );
  };

  const submitRename = (e: React.FormEvent) => {
    e.preventDefault();
    const name = editName.trim();
    if (!name || !editingId || busy) return;
    void run(
      () => onRename(editingId, name),
      () => setEditingId(null)
    );
  };

  return (
    <section className="flex min-h-[320px] flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {title} <span className="font-medium text-slate-400">({items.length})</span>
        </h3>
        <button
          type="button"
          onClick={() => {
            setAdding(true);
            setError(null);
          }}
          disabled={Boolean(disabledReason)}
          className="inline-flex items-center gap-1 rounded-lg bg-[#F5F3FF] px-2.5 py-1.5 text-xs font-semibold text-[#7C3AED] hover:bg-[#EDE9FE] disabled:opacity-40 dark:bg-purple-950/50 dark:text-purple-300"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add
        </button>
      </header>

      {adding && (
        <form
          onSubmit={submitNew}
          className="flex gap-2 border-b border-slate-100 p-3 dark:border-slate-800"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
            placeholder={`New ${entity} name`}
            maxLength={120}
            aria-label={`New ${entity} name`}
            className={cn(inputClass, 'py-1.5')}
          />
          <button
            type="submit"
            disabled={busy || !newName.trim()}
            aria-label={`Save ${entity}`}
            className="rounded-lg bg-[#7C3AED] px-2.5 text-white hover:bg-[#6D28D9] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            aria-label="Cancel"
            className="rounded-lg border border-slate-200 px-2.5 text-slate-500 hover:bg-slate-50 dark:border-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      )}
      {error && (
        <p className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {disabledReason ? (
          <p className="px-3 py-8 text-center text-sm text-slate-400">{disabledReason}</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-400">
            No {entity}s yet. Click Add to create one.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((item) =>
              editingId === item.id ? (
                <li key={item.id}>
                  <form onSubmit={submitRename} className="flex gap-2 p-1">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setEditingId(null)}
                      maxLength={120}
                      aria-label={`Rename ${entity}`}
                      className={cn(inputClass, 'py-1.5')}
                    />
                    <button
                      type="submit"
                      disabled={busy || !editName.trim()}
                      aria-label="Save name"
                      className="rounded-lg bg-[#7C3AED] px-2.5 text-white hover:bg-[#6D28D9] disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel rename"
                      className="rounded-lg border border-slate-200 px-2.5 text-slate-500 hover:bg-slate-50 dark:border-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                </li>
              ) : (
                <li key={item.id}>
                  <div
                    className={cn(
                      'group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                      selectedId === item.id
                        ? 'bg-[#F5F3FF] ring-1 ring-[#DDD6FE] dark:bg-purple-950/40 dark:ring-purple-900'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect?.(item.id)}
                      disabled={!onSelect}
                      className="min-w-0 flex-1 text-left disabled:cursor-default"
                    >
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {item.name}
                      </span>
                      <span className="block text-xs text-slate-500">{item.meta}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
                        setError(null);
                      }}
                      aria-label={`Rename ${item.name}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-[#7C3AED] dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      aria-label={`Delete ${item.name}`}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {onSelect && childLabel && (
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 shrink-0',
                          selectedId === item.id ? 'text-[#7C3AED]' : 'text-slate-300'
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </section>
  );
};

export const AudioBookTaxonomyManager: React.FC<TaxonomyManagerProps> = ({
  taxonomy,
  usage,
  onChanged,
  confirm,
  notify,
}) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');

  // Keep selections valid after reloads/deletes.
  useEffect(() => {
    if (categoryId && !taxonomy.categories.some((c) => c.id === categoryId)) setCategoryId('');
    if (!categoryId && taxonomy.categories[0]) setCategoryId(taxonomy.categories[0].id);
  }, [taxonomy.categories, categoryId]);
  useEffect(() => {
    const valid = taxonomy.subjects.some((s) => s.id === subjectId && s.categoryId === categoryId);
    if (subjectId && !valid) setSubjectId('');
  }, [taxonomy.subjects, subjectId, categoryId]);

  const subjectsIn = (cid: string) => taxonomy.subjects.filter((s) => s.categoryId === cid);
  const topicsIn = (sid: string) => taxonomy.topics.filter((t) => t.subjectId === sid);

  const categoryItems: Item[] = taxonomy.categories.map((c) => {
    const children = subjectsIn(c.id).length;
    const books = usage.byCategory[c.id] ?? 0;
    return {
      id: c.id,
      name: c.name,
      children,
      books,
      meta: `${plural(children, 'subject')} · ${plural(books, 'book')}`,
    };
  });
  const subjectItems: Item[] = subjectsIn(categoryId).map((s) => {
    const children = topicsIn(s.id).length;
    const books = usage.bySubject[s.id] ?? 0;
    return {
      id: s.id,
      name: s.name,
      children,
      books,
      meta: `${plural(children, 'topic')} · ${plural(books, 'book')}`,
    };
  });
  const topicItems: Item[] = topicsIn(subjectId).map((t) => {
    const books = usage.byTopic[t.id] ?? 0;
    return { id: t.id, name: t.name, children: 0, books, meta: plural(books, 'book') };
  });

  const afterChange = async (message: string) => {
    await onChanged();
    notify('success', message);
  };

  const requestDelete = (
    entity: 'category' | 'subject' | 'topic',
    item: Item,
    childWord: string,
    remove: (id: string) => Promise<void>
  ) => {
    if (item.books > 0 || item.children > 0) {
      const parts = [
        item.books > 0 && plural(item.books, 'audio book'),
        item.children > 0 && plural(item.children, childWord),
      ].filter(Boolean);
      confirm({
        title: `Can't delete “${item.name}” yet`,
        message: (
          <>
            This {entity} still has {parts.join(' and ')}. Move those audio books to another{' '}
            {entity}
            {item.children > 0 ? ` and delete or move its ${childWord}s` : ''} first, so nothing is
            left orphaned.
          </>
        ),
        infoOnly: true,
      });
      return;
    }
    confirm({
      title: `Delete ${entity} “${item.name}”?`,
      message: `This permanently removes the ${entity} from the Audio Book library. Exam-preparation content is not affected.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await remove(item.id);
          await afterChange(`${entity[0].toUpperCase()}${entity.slice(1)} deleted.`);
        } catch (err) {
          notify('error', getErrorMessage(err, `The ${entity} could not be deleted.`));
          throw err;
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-purple-100 bg-purple-50/60 p-4 text-sm text-slate-700 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-slate-300">
        <FolderTree className="mt-0.5 h-5 w-5 shrink-0 text-[#7C3AED]" aria-hidden="true" />
        <p>
          Audio Book categories, subjects and topics are a separate library taxonomy. They are not
          linked to exam categories, the Subjects page or the Topics page, so changes here never
          affect tests or questions.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Column
          title="Categories"
          entity="category"
          items={categoryItems}
          selectedId={categoryId}
          onSelect={(id) => {
            setCategoryId(id);
            setSubjectId('');
          }}
          childLabel="subjects"
          onCreate={async (name) => {
            const id = await audioBookAdminApi.createCategory(name, null);
            await afterChange('Category created.');
            setCategoryId(id);
          }}
          onRename={async (id, name) => {
            const current = taxonomy.categories.find((c) => c.id === id);
            await audioBookAdminApi.updateCategory(id, name, current?.description ?? null);
            await afterChange('Category renamed.');
          }}
          onDelete={(item) =>
            requestDelete('category', item, 'subject', audioBookAdminApi.deleteCategory)
          }
        />
        <Column
          title="Subjects"
          entity="subject"
          items={subjectItems}
          selectedId={subjectId}
          onSelect={setSubjectId}
          childLabel="topics"
          disabledReason={categoryId ? undefined : 'Select or create a category first.'}
          onCreate={async (name) => {
            const id = await audioBookAdminApi.createSubject(categoryId, name);
            await afterChange('Subject created.');
            setSubjectId(id);
          }}
          onRename={async (id, name) => {
            await audioBookAdminApi.updateSubject(id, name);
            await afterChange('Subject renamed.');
          }}
          onDelete={(item) =>
            requestDelete('subject', item, 'topic', audioBookAdminApi.deleteSubject)
          }
        />
        <Column
          title="Topics"
          entity="topic"
          items={topicItems}
          disabledReason={subjectId ? undefined : 'Select a subject to manage its topics.'}
          onCreate={async (name) => {
            await audioBookAdminApi.createTopic(subjectId, name);
            await afterChange('Topic created.');
          }}
          onRename={async (id, name) => {
            await audioBookAdminApi.updateTopic(id, name);
            await afterChange('Topic renamed.');
          }}
          onDelete={(item) => requestDelete('topic', item, 'topic', audioBookAdminApi.deleteTopic)}
        />
      </div>
    </div>
  );
};
