-- Lock the database down against Supabase's built-in Data API --------------------
-- The site only reaches the database through our own backend, never through
-- Supabase's auto-generated REST/GraphQL API. This migration makes sure that API
-- can't read or change anything, even if it is switched on and its public key
-- gets out:
--   1. Row level security (RLS) is turned on for every table, with no policies,
--      so the API roles see no rows at all (Flyway's history table is done by
--      hand, see below).
--   2. The API roles (anon, authenticated) lose their table privileges, now and
--      for tables created later.
-- The backend is unaffected: it connects as the role that owns these tables,
-- and Postgres lets a table's owner skip RLS.
--
-- New tables in later migrations need RLS too:
--   ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;

-- Safety check: stop (and roll back) rather than lock the backend out. Every
-- table must be owned by the role running migrations, or that role must be
-- allowed to bypass RLS.
DO $$
DECLARE
    foreign_owned text;
BEGIN
    SELECT string_agg(tablename, ', ') INTO foreign_owned
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tableowner <> current_user
      AND NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user);
    IF foreign_owned IS NOT NULL THEN
        RAISE EXCEPTION 'V6: tables not owned by %: %. Enabling RLS would block the backend.', current_user, foreign_owned;
    END IF;
END $$;

-- 1. RLS on every table in the public schema. Flyway's own history table is
--    skipped: Flyway holds a lock on it while migrating, so altering it here
--    would wait forever. Turn RLS on for it once by hand in the SQL editor:
--      ALTER TABLE public.flyway_schema_history ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables
             WHERE schemaname = 'public' AND tablename <> 'flyway_schema_history' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;

-- 2. Remove the Data API roles' access. These roles only exist on Supabase, so
--    this step is skipped on a plain Postgres database (local development, tests).
DO $$
DECLARE
    api_role text;
    t record;
BEGIN
    FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
            FOR t IN SELECT tablename FROM pg_tables
                     WHERE schemaname = 'public' AND tablename <> 'flyway_schema_history' LOOP
                EXECUTE format('REVOKE ALL ON public.%I FROM %I', t.tablename, api_role);
            END LOOP;
            EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', api_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', api_role);
        END IF;
    END LOOP;
END $$;

-- 3. Indexes on foreign keys Supabase's advisor flagged. Small tables today,
--    but these keep joins and deletes quick as data grows.
CREATE INDEX IF NOT EXISTS idx_lead_notes_author ON lead_notes (author_id);
CREATE INDEX IF NOT EXISTS idx_leads_service ON leads (service_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_file ON portfolio_images (file_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_cover_file ON portfolio_projects (cover_file_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_projects_service ON portfolio_projects (service_id);
CREATE INDEX IF NOT EXISTS idx_stored_files_uploaded_by ON stored_files (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_team_members_photo_file ON team_members (photo_file_id);
