-- ============================================================================
-- PRACTICEKORO: MIGRATION 027 - QUESTION IMAGES & EXAM CATEGORIES TABLE
-- ============================================================================
-- 1. Adds image_url column to public.questions for Reasoning, Geometry, Maps.
-- 2. Creates public.exam_categories table to eliminate localStorage dependency.
-- 3. Configures public read and admin write policies.
-- 4. Creates question-images storage bucket with public read.
-- ============================================================================

-- 1. Add image_url to questions table
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create exam_categories table
CREATE TABLE IF NOT EXISTS public.exam_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed standard categories
INSERT INTO public.exam_categories (id, name, order_index)
VALUES
    ('cat_police', 'Police Exams', 1),
    ('cat_teaching', 'Teaching Exams', 2),
    ('cat_civil', 'Civil Services', 3),
    ('cat_ssc', 'SSC & Staff Selection', 4),
    ('cat_railways', 'Railways', 5),
    ('cat_defence', 'Defence', 6),
    ('cat_banking', 'Banking', 7),
    ('cat_state_govt', 'State Govt.', 8)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, order_index = EXCLUDED.order_index;

-- Populate any existing categories from public.exams table
INSERT INTO public.exam_categories (id, name, order_index)
SELECT 
    'cat_' || LOWER(REGEXP_REPLACE(e.category, '[^a-zA-Z0-9]+', '_', 'g')),
    e.category,
    10
FROM (SELECT DISTINCT category FROM public.exams WHERE category IS NOT NULL AND TRIM(category) <> '') e
WHERE NOT EXISTS (
    SELECT 1 FROM public.exam_categories ec 
    WHERE ec.name = e.category 
       OR ec.id = ('cat_' || LOWER(REGEXP_REPLACE(e.category, '[^a-zA-Z0-9]+', '_', 'g')))
);

-- Enable RLS
ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read exam categories" ON public.exam_categories;
CREATE POLICY "Anyone can read exam categories"
    ON public.exam_categories
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins can manage exam categories" ON public.exam_categories;
CREATE POLICY "Admins can manage exam categories"
    ON public.exam_categories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
        OR (auth.jwt() ->> 'email') = 'admin@practicekoro.online'
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
        OR (auth.jwt() ->> 'email') = 'admin@practicekoro.online'
    );

GRANT SELECT ON public.exam_categories TO anon, authenticated;
GRANT ALL ON public.exam_categories TO authenticated, service_role;

-- 3. Storage bucket for question diagrams / images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'question-images',
    'question-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Storage policies
DROP POLICY IF EXISTS "Public can view question images" ON storage.objects;
CREATE POLICY "Public can view question images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'question-images');

DROP POLICY IF EXISTS "Admins can upload question images" ON storage.objects;
CREATE POLICY "Admins can upload question images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'question-images' AND (
            EXISTS (
                SELECT 1 FROM public.user_roles ur 
                WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
            )
            OR (auth.jwt() ->> 'email') = 'admin@practicekoro.online'
        )
    );

DROP POLICY IF EXISTS "Admins can delete question images" ON storage.objects;
CREATE POLICY "Admins can delete question images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'question-images' AND (
            EXISTS (
                SELECT 1 FROM public.user_roles ur 
                WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
            )
            OR (auth.jwt() ->> 'email') = 'admin@practicekoro.online'
        )
    );

-- 4. Update get_student_exam_questions to include imageUrl, subject, chapter
CREATE OR REPLACE FUNCTION public.get_student_exam_questions(
    p_test_id TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_has_access BOOLEAN;
    v_questions JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    v_has_access := public.has_test_access(v_user_id, p_test_id);
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Forbidden: Active All-Access Pro Pass required' USING ERRCODE = '40300';
    END IF;

    -- Query test questions explicitly excluding correct_option and explanations
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'questionOrder', tq.question_order,
            'questionText', q.question_text,
            'questionBengaliText', q.question_bengali_text,
            'imageUrl', q.image_url,
            'subjectId', q.subject_id,
            'subjectName', s.name,
            'chapterId', q.chapter_id,
            'chapterName', c.name,
            'optionA', q.option_a,
            'optionB', q.option_b,
            'optionC', q.option_c,
            'optionD', q.option_d,
            'difficulty', q.difficulty,
            'marks', COALESCE(tq.marks, q.default_marks, 1.00),
            'negativeMarks', COALESCE(tq.negative_marks, q.default_negative_marks, 0.25)
        ) ORDER BY tq.question_order ASC
    ) INTO v_questions
    FROM public.test_questions tq
    JOIN public.questions q ON q.id = tq.question_id
    LEFT JOIN public.subjects s ON s.id = q.subject_id
    LEFT JOIN public.chapters c ON c.id = q.chapter_id
    WHERE tq.test_id = p_test_id AND q.is_active = true;

    RETURN COALESCE(v_questions, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. Update get_attempt_solutions to include imageUrl, subject, chapter
CREATE OR REPLACE FUNCTION public.get_attempt_solutions(
    p_attempt_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_attempt RECORD;
    v_solutions JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User authentication required' USING ERRCODE = '40100';
    END IF;

    SELECT * INTO v_attempt FROM public.test_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt not found' USING ERRCODE = '40400';
    END IF;

    IF v_attempt.user_id != v_user_id AND NOT public.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Forbidden: You do not own this attempt' USING ERRCODE = '40300';
    END IF;

    IF v_attempt.status != 'completed' THEN
        RAISE EXCEPTION 'Forbidden: Solutions are only available after test submission' USING ERRCODE = '40301';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', q.id,
            'questionOrder', tq.question_order,
            'questionText', q.question_text,
            'questionBengaliText', q.question_bengali_text,
            'imageUrl', q.image_url,
            'subjectId', q.subject_id,
            'subjectName', s.name,
            'chapterId', q.chapter_id,
            'chapterName', c.name,
            'optionA', q.option_a,
            'optionB', q.option_b,
            'optionC', q.option_c,
            'optionD', q.option_d,
            'selectedOption', aa.selected_option,
            'correctOption', q.correct_option,
            'isCorrect', COALESCE(aa.is_correct, FALSE),
            'marksAwarded', COALESCE(aa.marks_awarded, 0.00),
            'explanation', q.explanation,
            'explanationBengali', q.explanation_bengali,
            'isBookmarked', EXISTS (
                SELECT 1 FROM public.bookmarks b 
                WHERE b.user_id = v_user_id AND b.question_id = q.id
            )
        ) ORDER BY tq.question_order ASC
    ) INTO v_solutions
    FROM public.test_questions tq
    JOIN public.questions q ON q.id = tq.question_id
    LEFT JOIN public.subjects s ON s.id = q.subject_id
    LEFT JOIN public.chapters c ON c.id = q.chapter_id
    LEFT JOIN public.attempt_answers aa 
        ON aa.attempt_id = p_attempt_id AND aa.question_id = q.id
    WHERE tq.test_id = v_attempt.test_id;

    RETURN COALESCE(v_solutions, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
