-- Migration 015: Upgrade admin@practicekoro.online to Admin
-- Author: PracticeKoro Team
-- Description:
--   1. Promotes existing account admin@practicekoro.online in auth.users and profiles to 'admin'.
--   2. Inserts 'admin' into public.user_roles.
--   3. Updates public.handle_new_user() trigger so future sign-in/OAuth with admin@practicekoro.online
--      or admin@practicekoro.com automatically receives 'admin' permissions.

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Find user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE LOWER(email) = 'admin@practicekoro.online'
    LIMIT 1;

    -- Fallback to profiles if needed
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id
        FROM public.profiles
        WHERE LOWER(email) = 'admin@practicekoro.online'
        LIMIT 1;
    END IF;

    IF v_user_id IS NOT NULL THEN
        -- Add admin role to user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Update profiles table
        INSERT INTO public.profiles (id, full_name, email, role, updated_at)
        VALUES (v_user_id, 'Admin', 'admin@practicekoro.online', 'admin', NOW())
        ON CONFLICT (id) DO UPDATE
        SET role = 'admin', updated_at = NOW();

        RAISE NOTICE 'Successfully upgraded user % (ID: %) to admin', 'admin@practicekoro.online', v_user_id;
    END IF;
END $$;

-- 2. Update handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role text := 'student';
    v_name text;
BEGIN
    IF LOWER(NEW.email) IN ('admin@practicekoro.online', 'admin@practicekoro.com') THEN
        v_role := 'admin';
    END IF;

    v_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
    VALUES (
        NEW.id,
        v_name,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
        v_role
    )
    ON CONFLICT (id) DO UPDATE
    SET role = CASE
        WHEN LOWER(NEW.email) IN ('admin@practicekoro.online', 'admin@practicekoro.com') THEN 'admin'
        ELSE public.profiles.role
    END,
    avatar_url = COALESCE(
        public.profiles.avatar_url,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NULL
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, v_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
