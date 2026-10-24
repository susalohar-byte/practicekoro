-- ============================================================================
-- PRACTICEKORO 011 — ROLE SOURCE OF TRUTH (single-writer sync)
-- ============================================================================
-- Background: role historically lived in BOTH profiles.role and user_roles and
-- could drift (has_role() checks both tables). This migration makes
-- public.user_roles the authoritative store and keeps profiles.role in sync
-- automatically via triggers, so both readers always agree.

-- 1. Backfill: make user_roles match profiles.role for every user.
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = p.role
);

-- 2. Sync profiles.role -> user_roles (insert missing, remove stale).
CREATE OR REPLACE FUNCTION public.sync_user_roles_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure the profile's current role exists in user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Remove other roles that no longer match the profile role
    DELETE FROM public.user_roles
    WHERE user_id = NEW.id AND role <> NEW.role;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_user_roles_from_profile ON public.profiles;
CREATE TRIGGER trg_sync_user_roles_from_profile
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_roles_from_profile();

-- 3. Sync user_roles changes -> profiles.role (keep the profile mirror fresh).
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- If the authoritative role row is removed, keep profile as-is only if
        -- another row still backs it; otherwise demote to 'student'.
        IF NOT EXISTS (
            SELECT 1 FROM public.user_roles WHERE user_id = OLD.user_id
        ) THEN
            UPDATE public.profiles SET role = 'student' WHERE id = OLD.user_id;
        ELSE
            UPDATE public.profiles p
            SET role = (
                SELECT ur.role FROM public.user_roles ur
                WHERE ur.user_id = OLD.user_id
                ORDER BY CASE ur.role WHEN 'admin' THEN 0 WHEN 'instructor' THEN 1 ELSE 2 END
                LIMIT 1
            )
            WHERE p.id = OLD.user_id AND p.role = OLD.role;
        END IF;
        RETURN OLD;
    END IF;

    -- INSERT/UPDATE: make the profile mirror the highest-privilege role row.
    UPDATE public.profiles p
    SET role = (
        SELECT ur.role FROM public.user_roles ur
        WHERE ur.user_id = NEW.user_id
        ORDER BY CASE ur.role WHEN 'admin' THEN 0 WHEN 'instructor' THEN 1 ELSE 2 END
        LIMIT 1
    )
    WHERE p.id = NEW.user_id;

    RETURN COALESCE(NEW, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_sync_profile_role_from_user_roles ON public.user_roles;
CREATE TRIGGER trg_sync_profile_role_from_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role_from_user_roles();

-- 4. Guard against drift going forward: block direct profile.role writes that
--    would contradict user_roles (admin path goes through user_roles).
CREATE OR REPLACE FUNCTION public.enforce_profile_role_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow if a matching user_roles row exists (or the write is the seed row
    -- created by handle_new_user, which also inserts user_roles).
    IF EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = NEW.role
    ) THEN
        RETURN NEW;
    END IF;

    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
        RAISE EXCEPTION 'Role mismatch: user_roles is authoritative. Update user_roles, not profiles.role.'
        USING ERRCODE = '23514';
    END IF;

    -- No user_roles rows yet: allow (handle_new_user inserts both atomically).
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_profile_role_consistency ON public.profiles;
CREATE TRIGGER trg_enforce_profile_role_consistency
BEFORE UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profile_role_consistency();

-- 5. has_role() now reads only the authoritative table (slightly faster, too).
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role = p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
