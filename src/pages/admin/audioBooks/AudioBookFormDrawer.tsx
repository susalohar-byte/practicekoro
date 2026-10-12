import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Clock,
  CloudUpload,
  Headphones,
  Info,
  Link2,
  List,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Save,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { formatDuration, parseDurationInput, parseYouTubeUrl } from '@/lib/youtube';
import { YouTubeAudioPlayer } from '@/components/audiobooks/YouTubeAudioPlayer';
import {
  AUDIOBOOK_THUMBNAIL_MAX_BYTES,
  audioBookAdminApi,
  type AudioBook,
  type AudioBookInput,
  type AudioBookStatus,
  type AudioBookTaxonomy,
} from '@/services/domains/audiobooks';
import { ConfirmDialog, inputClass, type ConfirmRequest } from './shared';

interface AudioBookFormDrawerProps {
  /** undefined = closed, null = create, AudioBook = edit. */
  book: AudioBook | null | undefined;
  taxonomy: AudioBookTaxonomy;
  onClose: () => void;
  onSaved: (book: AudioBook, created: boolean) => void;
  onManageTaxonomy: () => void;
}

interface FormState {
  title: string;
  categoryId: string;
  subjectId: string;
  topicId: string;
  chapterTopic: string;
  description: string;
  narrator: string;
  thumbnailUrl: string | null;
  youtubeUrl: string;
  duration: string;
  status: AudioBookStatus;
}

type Errors = Partial<Record<keyof FormState, string>>;
const DESCRIPTION_MAX = 500;

function initialState(book: AudioBook | null, taxonomy?: AudioBookTaxonomy): FormState {
  const matchedTopic =
    book?.topicId && taxonomy
      ? (taxonomy.topics.find((t) => t.id === book.topicId)?.name ?? '')
      : '';
  return {
    title: book?.title ?? '',
    categoryId: book?.categoryId ?? '',
    subjectId: book?.subjectId ?? '',
    topicId: book?.topicId ?? '',
    chapterTopic: matchedTopic,
    description: book?.description ?? '',
    narrator: book?.narrator ?? '',
    thumbnailUrl: book?.thumbnailUrl ?? null,
    youtubeUrl: book?.youtubeUrl ?? '',
    duration: formatDuration(book?.durationSeconds),
    status: book?.status ?? 'draft',
  };
}

const Label: React.FC<{ htmlFor?: string; required?: boolean; children: React.ReactNode }> = ({
  htmlFor,
  required,
  children,
}) => (
  <label
    htmlFor={htmlFor}
    className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
  >
    {children}
    {required && <span className="ml-0.5 text-rose-500">*</span>}
  </label>
);

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} className="mt-1 text-xs font-medium text-rose-600">
      {message}
    </p>
  ) : null;

export const AudioBookFormDrawer: React.FC<AudioBookFormDrawerProps> = ({
  book,
  taxonomy,
  onClose,
  onSaved,
  onManageTaxonomy,
}) => {
  const open = book !== undefined;
  const isEdit = Boolean(book);
  const [form, setForm] = useState<FormState>(() => initialState(book ?? null, taxonomy));
  const initialRef = useRef(JSON.stringify(form));
  const [errors, setErrors] = useState<Errors>({});
  const [urlTouched, setUrlTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [thumbError, setThumbError] = useState<string | null>(null);
  const [thumbBroken, setThumbBroken] = useState(false);
  const [detected, setDetected] = useState<number | null>(null);
  const [videoProblem, setVideoProblem] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Reset whenever the drawer opens for a different record.
  useEffect(() => {
    if (!open) return;
    const next = initialState(book ?? null, taxonomy);
    setForm(next);
    initialRef.current = JSON.stringify(next);
    setErrors({});
    setUrlTouched(false);
    setSaveError(null);
    setThumbError(null);
    setThumbBroken(false);
    setLocalPreview(null);
    setDetected(null);
    setVideoProblem(null);
    window.setTimeout(() => titleRef.current?.focus(), 50);
  }, [open, book, taxonomy]);

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview]
  );

  const parsedUrl = useMemo(() => parseYouTubeUrl(form.youtubeUrl), [form.youtubeUrl]);
  const videoId = parsedUrl?.videoId ?? null;
  useEffect(() => {
    setDetected(null);
    setVideoProblem(null);
  }, [videoId]);

  const subjects = taxonomy.subjects.filter(
    (s) => !form.categoryId || s.categoryId === form.categoryId
  );
  const topics = taxonomy.topics.filter((t) => !form.subjectId || t.subjectId === form.subjectId);
  const dirty = JSON.stringify(form) !== initialRef.current;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const requestClose = () => {
    if (saving) return;
    if (!dirty && !uploading) return onClose();
    setConfirm({
      title: 'Discard unsaved changes?',
      message: 'Your edits to this audio book will be lost.',
      confirmLabel: 'Discard',
      onConfirm: onClose,
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirm) requestClose();
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  });

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setThumbError(null);
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setThumbError('Use a PNG, JPG or WebP image.');
      return;
    }
    if (file.size > AUDIOBOOK_THUMBNAIL_MAX_BYTES) {
      setThumbError('Image must be 2 MB or smaller.');
      return;
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setThumbBroken(false);
    setUploading(true);
    try {
      const url = await audioBookAdminApi.uploadThumbnail(file);
      set('thumbnailUrl', url);
    } catch (err) {
      setThumbError(getErrorMessage(err, 'Thumbnail upload failed. Try again.'));
    } finally {
      setUploading(false);
      setLocalPreview(null);
    }
  };

  const validate = (): { input: AudioBookInput | null; errors: Errors } => {
    const next: Errors = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    else if (form.title.trim().length > 200) next.title = 'Keep the title under 200 characters.';
    if (!form.subjectId) next.subjectId = 'Select a subject.';
    if (!form.categoryId) next.categoryId = 'Select a category.';
    if (form.description.length > DESCRIPTION_MAX)
      next.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
    if (form.narrator.trim().length > 120)
      next.narrator = 'Keep the narrator under 120 characters.';
    if (!form.youtubeUrl.trim()) next.youtubeUrl = 'YouTube video URL is required.';
    else if (!parsedUrl)
      next.youtubeUrl =
        'Enter a valid YouTube video link (youtube.com/watch?v=…, youtu.be/… or an embed link).';
    const seconds = parseDurationInput(form.duration);
    if (Number.isNaN(seconds)) next.duration = 'Use mm:ss or hh:mm:ss (max 24 hours).';
    if (Object.keys(next).length || !parsedUrl) return { input: null, errors: next };

    let resolvedTopicId = form.topicId || null;
    if (!resolvedTopicId && form.chapterTopic.trim()) {
      const match = taxonomy.topics.find(
        (t) => t.name.toLowerCase() === form.chapterTopic.trim().toLowerCase()
      );
      if (match) resolvedTopicId = match.id;
    }

    return {
      errors: next,
      input: {
        title: form.title,
        description: form.description,
        narrator: form.narrator,
        categoryId: form.categoryId,
        subjectId: form.subjectId,
        topicId: resolvedTopicId,
        thumbnailUrl: form.thumbnailUrl,
        youtubeUrl: parsedUrl.url,
        youtubeVideoId: parsedUrl.videoId,
        durationSeconds: seconds,
        status: form.status,
      },
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || uploading) return;
    setUrlTouched(true);
    const { input, errors: next } = validate();
    setErrors(next);
    if (!input) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = book
        ? await audioBookAdminApi.update(book.id, input)
        : await audioBookAdminApi.create(input);
      onSaved(saved, !book);
    } catch (err) {
      setSaveError(getErrorMessage(err, 'The audio book could not be saved. Try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const urlError =
    errors.youtubeUrl ||
    (urlTouched && form.youtubeUrl.trim() && !parsedUrl
      ? 'This is not a recognised YouTube video link.'
      : undefined);
  const shownThumb = localPreview || form.thumbnailUrl;
  const noCategories = taxonomy.categories.length === 0;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={requestClose}
        aria-hidden="true"
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="ab-drawer-title"
        onSubmit={submit}
        noValidate
        className="relative flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl dark:bg-slate-900"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 pb-4 pt-5 dark:border-slate-800">
          <div>
            <h2 id="ab-drawer-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Edit Audio Book' : 'Add Audio Book'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {isEdit
                ? 'Update the details of this audiobook.'
                : 'Add a new audiobook by providing the details below.'}
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {noCategories && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Create an audio book category and subject first.{' '}
              <button type="button" onClick={onManageTaxonomy} className="font-semibold underline">
                Manage categories
              </button>
            </div>
          )}

          <div>
            <Label htmlFor="ab-title" required>
              Title
            </Label>
            <input
              id="ab-title"
              ref={titleRef}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Enter audiobook title"
              maxLength={200}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'ab-title-err' : undefined}
              className={cn(inputClass, errors.title && 'border-rose-400')}
            />
            <FieldError id="ab-title-err" message={errors.title} />
          </div>

          <div>
            <Label htmlFor="ab-subject" required>
              Subject
            </Label>
            <select
              id="ab-subject"
              value={form.subjectId}
              onChange={(e) => {
                const sid = e.target.value;
                const sub = taxonomy.subjects.find((s) => s.id === sid);
                setForm((f) => ({
                  ...f,
                  subjectId: sid,
                  categoryId: sub && !f.categoryId ? sub.categoryId : f.categoryId,
                }));
                setErrors((er) => ({ ...er, subjectId: undefined }));
              }}
              aria-invalid={Boolean(errors.subjectId)}
              className={cn(inputClass, errors.subjectId && 'border-rose-400')}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <FieldError id="ab-subject-err" message={errors.subjectId} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ab-category" required>
                Category
              </Label>
              <select
                id="ab-category"
                value={form.categoryId}
                onChange={(e) => {
                  setForm((f) => ({ ...f, categoryId: e.target.value }));
                  setErrors((er) => ({ ...er, categoryId: undefined }));
                }}
                aria-invalid={Boolean(errors.categoryId)}
                className={cn(inputClass, errors.categoryId && 'border-rose-400')}
              >
                <option value="">Select category</option>
                {taxonomy.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError id="ab-category-err" message={errors.categoryId} />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label
                  htmlFor="ab-chapter-topic"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  Chapter / Topic
                </label>
                <span
                  title="Specific chapter or topic for this audio book"
                  className="text-slate-400 cursor-help hover:text-slate-600"
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </div>
              <input
                id="ab-chapter-topic"
                list="ab-topics-datalist"
                value={form.chapterTopic}
                onChange={(e) => {
                  const val = e.target.value;
                  const match = taxonomy.topics.find(
                    (t) => t.name.toLowerCase() === val.toLowerCase()
                  );
                  setForm((f) => ({ ...f, chapterTopic: val, topicId: match ? match.id : '' }));
                }}
                placeholder="e.g. Mauryan Empire"
                className={inputClass}
              />
              <datalist id="ab-topics-datalist">
                {topics.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <Label htmlFor="ab-description">Description</Label>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-purple-600 focus-within:border-transparent">
              <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                <button
                  type="button"
                  title="Bold"
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs font-bold w-6 h-6 flex items-center justify-center"
                >
                  B
                </button>
                <button
                  type="button"
                  title="Italic"
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs italic w-6 h-6 flex items-center justify-center font-serif"
                >
                  I
                </button>
                <button
                  type="button"
                  title="Underline"
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 text-xs underline w-6 h-6 flex items-center justify-center"
                >
                  U
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  type="button"
                  title="Bullet List"
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 w-6 h-6 flex items-center justify-center"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Numbered List"
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 w-6 h-6 flex items-center justify-center"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  type="button"
                  title="Link"
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 w-6 h-6 flex items-center justify-center"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="More Options"
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 w-6 h-6 flex items-center justify-center text-slate-400"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
              <textarea
                id="ab-description"
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                maxLength={DESCRIPTION_MAX}
                placeholder="Write a short description about this audiobook…"
                className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 resize-none"
              />
            </div>
            <div className="mt-1 flex justify-between">
              <FieldError id="ab-description-err" message={errors.description} />
              <span className="ml-auto text-xs text-slate-400">
                {form.description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
          </div>

          {/* Thumbnail & Preview Row */}
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Thumbnail Image</Label>
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-4 text-center dark:border-purple-900/40 dark:bg-purple-950/20 aspect-square">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 text-[#7C3AED] dark:text-purple-300 flex items-center justify-center mb-2">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {form.thumbnailUrl ? 'Replace Image' : 'Upload Image'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG (max 2MB)</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={onPickFile}
                    aria-label="Choose thumbnail image"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {uploading && <Loader2 className="h-3 w-3 animate-spin" />}
                    {uploading ? 'Uploading…' : 'Choose Image'}
                  </button>
                </div>
              </div>
              <div>
                <Label>Preview</Label>
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 via-indigo-100 to-violet-200 dark:from-purple-950 dark:via-indigo-950 dark:to-violet-950 flex items-center justify-center border border-purple-200/60 shadow-xs">
                  {shownThumb && !thumbBroken ? (
                    <img
                      src={shownThumb}
                      alt="Thumbnail preview"
                      onError={() => setThumbBroken(true)}
                      className={cn('h-full w-full object-cover', uploading && 'opacity-60')}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-[#7C3AED]">
                      <div className="w-16 h-16 rounded-full bg-white/70 dark:bg-slate-800/70 shadow-sm flex items-center justify-center text-[#7C3AED]">
                        <Headphones className="h-9 w-9" />
                      </div>
                      <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                        {thumbBroken ? 'Image failed to load' : 'Audio Book'}
                      </span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xs">
                      <Loader2 className="h-6 w-6 animate-spin text-white drop-shadow" />
                    </div>
                  )}
                </div>
                {form.thumbnailUrl && !uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      set('thumbnailUrl', null);
                      setThumbBroken(false);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove thumbnail
                  </button>
                )}
              </div>
            </div>
            {thumbError && <p className="mt-1.5 text-xs font-medium text-rose-600">{thumbError}</p>}
          </div>

          {/* Audio Source Section */}
          <div>
            <Label htmlFor="ab-youtube" required>
              YouTube Video URL
            </Label>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                disabled
                title="Audio file uploads are not available yet"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800"
              >
                <CloudUpload className="h-4 w-4" />
                Upload File
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-slate-700">
                  Soon
                </span>
              </button>
              <div className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/80 px-4 py-2 text-xs font-bold text-[#7C3AED] shadow-xs dark:border-purple-800 dark:bg-purple-950/60">
                <Link2 className="h-4 w-4" />
                YouTube Link
              </div>
            </div>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="ab-youtube"
                type="url"
                value={form.youtubeUrl}
                onChange={(e) => set('youtubeUrl', e.target.value)}
                onBlur={() => setUrlTouched(true)}
                inputMode="url"
                placeholder="Paste YouTube video link"
                aria-invalid={Boolean(urlError)}
                aria-describedby="ab-youtube-hint"
                className={cn(inputClass, 'pl-9', urlError && 'border-rose-400')}
              />
            </div>
            {urlError ? (
              <FieldError id="ab-youtube-hint" message={urlError} />
            ) : (
              <p id="ab-youtube-hint" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Supports youtube.com/watch?v=…, youtu.be/…, embed and shorts links.
              </p>
            )}
            {videoId && (
              <div className="mt-3">
                <YouTubeAudioPlayer
                  videoId={videoId}
                  title={form.title || 'preview'}
                  onDuration={(s) => {
                    setDetected(s);
                    setForm((f) => (f.duration.trim() ? f : { ...f, duration: formatDuration(s) }));
                  }}
                  onUnavailable={setVideoProblem}
                />
                {videoProblem && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Students will not be able to play this video: {videoProblem}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ab-duration">Duration</Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="ab-duration"
                  value={form.duration}
                  onChange={(e) => set('duration', e.target.value)}
                  placeholder="e.g. 45:20"
                  className={cn(inputClass, 'pl-9', errors.duration && 'border-rose-400')}
                />
              </div>
              <FieldError id="ab-duration-err" message={errors.duration} />
              {detected && formatDuration(detected) !== form.duration.trim() && (
                <button
                  type="button"
                  onClick={() => set('duration', formatDuration(detected))}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:underline"
                >
                  <Wand2 className="h-3 w-3" />
                  Use YouTube duration ({formatDuration(detected)})
                </button>
              )}
            </div>
            <div>
              <Label htmlFor="ab-narrator">Narrator</Label>
              <input
                id="ab-narrator"
                value={form.narrator}
                onChange={(e) => set('narrator', e.target.value)}
                placeholder="e.g. PracticeKoro"
                maxLength={120}
                className={inputClass}
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              Status
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ['published', 'Published', 'Visible to students'],
                  ['draft', 'Draft', 'Save as draft'],
                ] as const
              ).map(([value, label, hint]) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors',
                    form.status === value
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  )}
                >
                  <input
                    type="radio"
                    name="ab-status"
                    value={value}
                    checked={form.status === value}
                    onChange={() => set('status', value)}
                    className="mt-0.5 h-4 w-4 accent-[#7C3AED]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {label}
                    </span>
                    <span className="block text-xs text-slate-500">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {saveError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
            >
              {saveError}
            </div>
          )}
        </div>

        <footer className="grid grid-cols-[1fr_2fr] gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={requestClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading || noCategories}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:bg-[#6D28D9] disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {saving
              ? 'Saving…'
              : uploading
                ? 'Waiting for upload…'
                : isEdit
                  ? 'Update Audio Book'
                  : 'Save Audio Book'}
          </button>
        </footer>
      </form>
      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>,
    document.body
  );
};
