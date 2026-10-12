import { supabaseRuntime as supabase } from '@/lib/supabase';
import { uploadValidatedImage, validateRasterFile } from '@/lib/rasterUploads';
import { requireSavedRow } from '@/services/domains/admin.mutations';

/**
 * Audio Book module data access. Its taxonomy (audiobook_categories ->
 * audiobook_subjects -> audiobook_topics) is fully separate from the exam-prep
 * exams/subjects/chapters tables. RLS enforces: students read published books
 * only; content staff (admin_scope_allowed('content')) can write.
 *
 * Every read and write goes to the database and surfaces its error. There is
 * deliberately no seed data or local fallback: the admin must never see
 * statistics or saves that the database did not confirm.
 */

export type AudioBookStatus = 'draft' | 'published';
export type AudioBookSort = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'longest';

export interface AudioBookCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
}
export interface AudioBookSubject {
  id: string;
  categoryId: string;
  name: string;
  displayOrder: number;
}
export interface AudioBookTopic {
  id: string;
  subjectId: string;
  name: string;
  displayOrder: number;
}
export interface AudioBookTaxonomy {
  categories: AudioBookCategory[];
  subjects: AudioBookSubject[];
  topics: AudioBookTopic[];
}

export interface AudioBook {
  id: string;
  title: string;
  description: string | null;
  narrator: string | null;
  categoryId: string;
  subjectId: string;
  topicId: string | null;
  thumbnailUrl: string | null;
  youtubeUrl: string;
  youtubeVideoId: string;
  durationSeconds: number | null;
  status: AudioBookStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AudioBookInput {
  title: string;
  description: string | null;
  narrator: string | null;
  categoryId: string;
  subjectId: string;
  topicId: string | null;
  thumbnailUrl: string | null;
  youtubeUrl: string;
  youtubeVideoId: string;
  durationSeconds: number | null;
  status: AudioBookStatus;
}

export interface AudioBookListQuery {
  search?: string;
  categoryId?: string;
  subjectId?: string;
  status?: AudioBookStatus;
  sort?: AudioBookSort;
  page: number;
  pageSize: number;
}

export interface AudioBookStats {
  total: number;
  published: number;
  drafts: number;
  totalDurationSeconds: number;
  timedCount: number;
  totalListens: number;
}

/** Book counts per taxonomy node, used to block deletes that would orphan books. */
export interface AudioBookUsage {
  byCategory: Record<string, number>;
  bySubject: Record<string, number>;
  byTopic: Record<string, number>;
}

export const AUDIOBOOK_THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
const COLUMNS =
  'id,title,description,narrator,category_id,subject_id,topic_id,thumbnail_url,youtube_url,youtube_video_id,duration_seconds,status,published_at,created_at,updated_at';

type Row = Record<string, any>;

function mapBook(r: Row): AudioBook {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    narrator: r.narrator ?? null,
    categoryId: r.category_id,
    subjectId: r.subject_id,
    topicId: r.topic_id ?? null,
    thumbnailUrl: r.thumbnail_url ?? null,
    youtubeUrl: r.youtube_url,
    youtubeVideoId: r.youtube_video_id,
    durationSeconds: r.duration_seconds ?? null,
    status: r.status === 'published' ? 'published' : 'draft',
    publishedAt: r.published_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toRow(input: AudioBookInput) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    narrator: input.narrator?.trim() || null,
    category_id: input.categoryId,
    subject_id: input.subjectId,
    topic_id: input.topicId || null,
    thumbnail_url: input.thumbnailUrl || null,
    youtube_url: input.youtubeUrl,
    youtube_video_id: input.youtubeVideoId,
    duration_seconds: input.durationSeconds,
    status: input.status,
  };
}

/** Turns Postgres constraint errors into messages an admin can act on. */
export function friendlyError(error: { code?: string; message: string }, entity: string): Error {
  if (error.code === '23505') return new Error(`A ${entity} with this name already exists here.`);
  if (error.code === '23503')
    return new Error(
      `This ${entity} is still in use. Reassign or delete the linked items first, then try again.`
    );
  if (error.code === '42501' || /row-level security/i.test(error.message))
    return new Error('You do not have permission to manage audio books.');
  if (error.code === '42P01' || /relation .*audiobook.* does not exist/i.test(error.message))
    return new Error('Audio Book tables are missing. Apply the audiobooks database migration.');
  if (error.code === '23514')
    return new Error(`Some ${entity} details are invalid. Check the form.`);
  return new Error(error.message);
}

/** Strips characters that would break a PostgREST `or=` filter. */
function searchTerm(value: string): string {
  return value
    .replace(/[,()*%\\:"'.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchTaxonomy(): Promise<AudioBookTaxonomy> {
  const [c, s, t] = await Promise.all([
    supabase
      .from('audiobook_categories')
      .select('id,name,description,display_order')
      .order('display_order')
      .order('name'),
    supabase
      .from('audiobook_subjects')
      .select('id,category_id,name,display_order')
      .order('display_order')
      .order('name'),
    supabase
      .from('audiobook_topics')
      .select('id,subject_id,name,display_order')
      .order('display_order')
      .order('name'),
  ]);
  const error = c.error || s.error || t.error;
  if (error) throw friendlyError(error, 'category');
  return {
    categories: (c.data ?? []).map((r: Row) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      displayOrder: r.display_order ?? 0,
    })),
    subjects: (s.data ?? []).map((r: Row) => ({
      id: r.id,
      categoryId: r.category_id,
      name: r.name,
      displayOrder: r.display_order ?? 0,
    })),
    topics: (t.data ?? []).map((r: Row) => ({
      id: r.id,
      subjectId: r.subject_id,
      name: r.name,
      displayOrder: r.display_order ?? 0,
    })),
  };
}

type TaxonomyTable = 'audiobook_categories' | 'audiobook_subjects' | 'audiobook_topics';
const ENTITY: Record<TaxonomyTable, string> = {
  audiobook_categories: 'category',
  audiobook_subjects: 'subject',
  audiobook_topics: 'topic',
};

async function insertTaxonomy(table: TaxonomyTable, row: Row): Promise<string> {
  const result = await supabase.from(table).insert(row).select('id').single();
  if (result.error) throw friendlyError(result.error, ENTITY[table]);
  return requireSavedRow(result).id;
}

async function updateTaxonomy(table: TaxonomyTable, id: string, row: Row): Promise<void> {
  const result = await supabase.from(table).update(row).eq('id', id).select('id').single();
  if (result.error) throw friendlyError(result.error, ENTITY[table]);
  requireSavedRow(result, id);
}

async function deleteRow(table: TaxonomyTable | 'audiobooks', id: string): Promise<void> {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error) throw friendlyError(error, table === 'audiobooks' ? 'audio book' : ENTITY[table]);
  if (!data || data.length !== 1)
    throw new Error('Deletion was not confirmed. Refresh and check your permissions.');
}

export const audioBookAdminApi = {
  getTaxonomy: fetchTaxonomy,

  async getUsage(): Promise<AudioBookUsage> {
    const { data, error } = await supabase
      .from('audiobooks')
      .select('category_id,subject_id,topic_id');
    if (error) throw friendlyError(error, 'audio book');
    const usage: AudioBookUsage = { byCategory: {}, bySubject: {}, byTopic: {} };
    for (const r of (data ?? []) as Row[]) {
      usage.byCategory[r.category_id] = (usage.byCategory[r.category_id] ?? 0) + 1;
      usage.bySubject[r.subject_id] = (usage.bySubject[r.subject_id] ?? 0) + 1;
      if (r.topic_id) usage.byTopic[r.topic_id] = (usage.byTopic[r.topic_id] ?? 0) + 1;
    }
    return usage;
  },

  async getStats(): Promise<AudioBookStats> {
    const { data, error } = await supabase.rpc('get_admin_audiobook_stats');
    if (error) throw friendlyError(error, 'audio book');
    return {
      total: Number(data?.total ?? 0),
      published: Number(data?.published ?? 0),
      drafts: Number(data?.drafts ?? 0),
      totalDurationSeconds: Number(data?.total_duration_seconds ?? 0),
      timedCount: Number(data?.timed_count ?? 0),
      totalListens: Number(data?.total_listens ?? 0),
    };
  },

  async list(
    query: AudioBookListQuery,
    taxonomy: AudioBookTaxonomy
  ): Promise<{ items: AudioBook[]; total: number }> {
    let q = supabase.from('audiobooks').select(COLUMNS, { count: 'exact' });
    if (query.status) q = q.eq('status', query.status);
    if (query.categoryId) q = q.eq('category_id', query.categoryId);
    if (query.subjectId) q = q.eq('subject_id', query.subjectId);
    const term = searchTerm(query.search ?? '');
    if (term) {
      // Title/narrator match, or the book sits under a category/subject/topic whose name matches.
      const needle = term.toLowerCase();
      const ids = <T extends { id: string; name: string }>(rows: T[]) =>
        rows.filter((r) => r.name.toLowerCase().includes(needle)).map((r) => r.id);
      const filters = [`title.ilike.*${term}*`, `narrator.ilike.*${term}*`];
      const categoryIds = ids(taxonomy.categories);
      const subjectIds = ids(taxonomy.subjects);
      const topicIds = ids(taxonomy.topics);
      if (categoryIds.length) filters.push(`category_id.in.(${categoryIds.join(',')})`);
      if (subjectIds.length) filters.push(`subject_id.in.(${subjectIds.join(',')})`);
      if (topicIds.length) filters.push(`topic_id.in.(${topicIds.join(',')})`);
      q = q.or(filters.join(','));
    }
    switch (query.sort) {
      case 'oldest':
        q = q.order('created_at', { ascending: true });
        break;
      case 'title_asc':
        q = q.order('title', { ascending: true });
        break;
      case 'title_desc':
        q = q.order('title', { ascending: false });
        break;
      case 'longest':
        q = q.order('duration_seconds', { ascending: false, nullsFirst: false });
        break;
      default:
        q = q.order('created_at', { ascending: false });
    }
    const from = (query.page - 1) * query.pageSize;
    const { data, error, count } = await q.range(from, from + query.pageSize - 1);
    if (error) throw friendlyError(error, 'audio book');
    return { items: (data ?? []).map(mapBook), total: count ?? 0 };
  },

  async create(input: AudioBookInput): Promise<AudioBook> {
    const result = await supabase.from('audiobooks').insert(toRow(input)).select(COLUMNS).single();
    if (result.error) throw friendlyError(result.error, 'audio book');
    return mapBook(requireSavedRow(result));
  },

  async update(id: string, input: AudioBookInput): Promise<AudioBook> {
    const result = await supabase
      .from('audiobooks')
      .update(toRow(input))
      .eq('id', id)
      .select(COLUMNS)
      .single();
    if (result.error) throw friendlyError(result.error, 'audio book');
    return mapBook(requireSavedRow(result, id));
  },

  async setStatus(ids: string[], status: AudioBookStatus): Promise<void> {
    if (!ids.length) return;
    const { data, error } = await supabase
      .from('audiobooks')
      .update({ status })
      .in('id', ids)
      .select('id');
    if (error) throw friendlyError(error, 'audio book');
    if ((data ?? []).length !== ids.length)
      throw new Error('Some audio books were not updated. Refresh and try again.');
  },

  delete: (id: string) => deleteRow('audiobooks', id),

  /** Returns a durable storage URL; never a local blob/data preview. */
  async uploadThumbnail(file: File): Promise<string> {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
      throw new Error('Use a PNG, JPG or WebP image.');
    validateRasterFile(file, 'banners', AUDIOBOOK_THUMBNAIL_MAX_BYTES);
    return uploadValidatedImage(file, 'banners');
  },

  createCategory: (name: string, description: string | null) =>
    insertTaxonomy('audiobook_categories', { name: name.trim(), description: description || null }),
  updateCategory: (id: string, name: string, description: string | null) =>
    updateTaxonomy('audiobook_categories', id, {
      name: name.trim(),
      description: description || null,
    }),
  deleteCategory: (id: string) => deleteRow('audiobook_categories', id),

  createSubject: (categoryId: string, name: string) =>
    insertTaxonomy('audiobook_subjects', { category_id: categoryId, name: name.trim() }),
  updateSubject: (id: string, name: string) =>
    updateTaxonomy('audiobook_subjects', id, { name: name.trim() }),
  deleteSubject: (id: string) => deleteRow('audiobook_subjects', id),

  createTopic: (subjectId: string, name: string) =>
    insertTaxonomy('audiobook_topics', { subject_id: subjectId, name: name.trim() }),
  updateTopic: (id: string, name: string) =>
    updateTaxonomy('audiobook_topics', id, { name: name.trim() }),
  deleteTopic: (id: string) => deleteRow('audiobook_topics', id),
};

export const audioBookStudentApi = {
  getTaxonomy: fetchTaxonomy,

  /** RLS already hides drafts from students; the explicit filter keeps staff previews honest too. */
  async listPublished(): Promise<AudioBook[]> {
    const { data, error } = await supabase
      .from('audiobooks')
      .select(COLUMNS)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw friendlyError(error, 'audio book');
    return (data ?? []).map(mapBook);
  },

  /** Counts at most one listen per student, book and day; failures never interrupt playback. */
  async recordListen(audiobookId: string): Promise<void> {
    await supabase.rpc('record_audiobook_listen', { p_audiobook_id: audiobookId });
  },
};
