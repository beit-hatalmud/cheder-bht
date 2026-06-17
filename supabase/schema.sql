-- =============================================================
-- cheder-bht — Supabase PostgreSQL schema (replaces Google Sheets)
-- Date: 2026-06-17
-- Author: Claude Code, on behalf of יוסף שניידר
--
-- Design principles:
--   * UUIDs for all primary keys (offline-friendly, mergeable)
--   * Foreign keys + cascading deletes where logical
--   * Row Level Security (RLS) wired to auth.uid()
--   * created_at / updated_at on every table for audit
--   * legacy_id column preserves the original Sheet row ref
--     (so we can re-run migration idempotently)
-- =============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ─── Helper: auto-update updated_at ──────────────────────────
create or replace function bht_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

-- =============================================================
-- 1. users — replaces the 'משתמשים' sheet + identity
-- =============================================================
create table if not exists users (
  id              uuid primary key default uuid_generate_v4(),
  auth_uid        uuid unique,                          -- Supabase auth user id (after Google sign-in)
  email           text unique not null,
  full_name       text not null,
  role            text not null default 'צוות',
  permissions     text not null default '',             -- comma list OR 'all'
  visible_classes text default '',                      -- legacy filter
  active          boolean not null default true,
  must_change     boolean not null default false,       -- forced password change (deprecated w/ google)
  legacy_id       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger users_touch before update on users for each row execute function bht_touch_updated_at();
create index if not exists users_email_idx on users(lower(email));

-- =============================================================
-- 2. classes — replaces 'כיתות'
-- =============================================================
create table if not exists classes (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  year        text,
  homeroom_id uuid references users(id) on delete set null,
  is_active   boolean not null default true,
  legacy_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger classes_touch before update on classes for each row execute function bht_touch_updated_at();

-- =============================================================
-- 3. students — replaces 'תלמידים'
-- =============================================================
create table if not exists students (
  id          uuid primary key default uuid_generate_v4(),
  full_name   text not null,
  class_id    uuid references classes(id) on delete set null,
  birthdate   date,
  phone       text,
  parent_phone text,
  parent_email text,
  status      text default 'פעיל',                      -- פעיל / השעיה / יצא
  notes       text,
  photo_url   text,
  legacy_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger students_touch before update on students for each row execute function bht_touch_updated_at();
create index if not exists students_class_idx on students(class_id);
create index if not exists students_status_idx on students(status);

-- =============================================================
-- 4. categories — replaces 'קטגוריות' (behavior event types)
-- =============================================================
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  kind        text not null default 'התנהגות',           -- התנהגות / שיעור / חופש / וכו'
  weight      int default 0,                             -- ניקוד
  color       text default '#6b7280',
  icon        text default 'bi-circle',
  is_active   boolean not null default true,
  legacy_id   text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- 5. behavior_events — replaces 'מעקב_התנהגות'
-- =============================================================
create table if not exists behavior_events (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references students(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  occurred_at timestamptz not null default now(),
  description text,
  score_delta int default 0,
  recorded_by uuid references users(id) on delete set null,
  legacy_id   text,
  created_at  timestamptz not null default now()
);
create index if not exists be_student_idx on behavior_events(student_id, occurred_at desc);

-- =============================================================
-- 6. attendance — replaces 'נוכחות'
-- =============================================================
create table if not exists attendance (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references students(id) on delete cascade,
  on_date     date not null,
  status      text not null,           -- נוכח / חסר / איחור / חופש
  notes       text,
  recorded_by uuid references users(id) on delete set null,
  legacy_id   text,
  created_at  timestamptz not null default now(),
  unique(student_id, on_date)
);
create index if not exists att_date_idx on attendance(on_date);

-- =============================================================
-- 7. tasks — replaces 'משימות'
-- =============================================================
create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references students(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'pending',  -- pending / in_progress / done / cancelled
  priority    int not null default 2,            -- 1=urgent .. 4=low
  due_date    date,
  assigned_to uuid references users(id) on delete set null,
  created_by  uuid references users(id) on delete set null,
  legacy_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger tasks_touch before update on tasks for each row execute function bht_touch_updated_at();

-- =============================================================
-- 8. projects — replaces 'פרויקטים'
-- =============================================================
create table if not exists projects (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  student_id  uuid references students(id) on delete set null,
  start_date  date,
  end_date    date,
  status      text not null default 'active',
  legacy_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger projects_touch before update on projects for each row execute function bht_touch_updated_at();

-- =============================================================
-- 9. tests — replaces 'מבחנים'
-- =============================================================
create table if not exists tests (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references students(id) on delete cascade,
  subject     text not null,
  test_date   date not null,
  score       numeric,
  max_score   numeric default 100,
  notes       text,
  legacy_id   text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- 10. medications — replaces 'כדורים'
-- =============================================================
create table if not exists medications (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references students(id) on delete cascade,
  name        text not null,
  dose        text,
  frequency   text,
  start_date  date,
  end_date    date,
  notes       text,
  legacy_id   text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- 11. meetings — replaces 'אסיפות'
-- =============================================================
create table if not exists meetings (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references students(id) on delete cascade,
  meeting_date timestamptz not null,
  attendees   text[],
  notes       text,
  next_steps  text,
  recorded_by uuid references users(id) on delete set null,
  legacy_id   text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- 12. conversations — replaces 'שיחות'
-- =============================================================
create table if not exists conversations (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references students(id) on delete cascade,
  participant text,
  on_date     date not null,
  duration_min int,
  summary     text,
  recorded_by uuid references users(id) on delete set null,
  legacy_id   text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- 13. signatures — replaces 'חתימות'
-- =============================================================
create table if not exists signatures (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references students(id) on delete cascade,
  kind        text not null,
  signed_at   timestamptz not null default now(),
  signed_by   text,
  document_url text,
  legacy_id   text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- 14. functioning — replaces 'תפקוד'
-- =============================================================
create table if not exists functioning_reports (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid not null references students(id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  scores      jsonb,
  comments    text,
  legacy_id   text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- 15. petty_cash — replaces 'קופה_קטנה'
-- =============================================================
create table if not exists petty_cash (
  id          uuid primary key default uuid_generate_v4(),
  on_date     date not null,
  amount      numeric not null,
  direction   text not null,                 -- in / out
  description text,
  legacy_id   text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- 16. audit_log — replaces 'יומן_פעולות' + new error logging
-- =============================================================
create table if not exists audit_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  actor_id    uuid references users(id) on delete set null,
  actor_email text,
  action      text not null,                  -- create / update / delete / login / error
  table_name  text,
  row_id      uuid,
  payload     jsonb,
  ip_addr     text,
  user_agent  text,
  level       text not null default 'info'    -- info / warn / error
);
create index if not exists audit_at_idx on audit_log(at desc);
create index if not exists audit_actor_idx on audit_log(actor_id);
create index if not exists audit_level_idx on audit_log(level);

-- =============================================================
-- 17. error_log — client-reported errors (better-isolated)
-- =============================================================
create table if not exists error_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  user_email  text,
  build_hash  text,
  url         text,
  message     text not null,
  stack       text,
  user_agent  text,
  resolved    boolean not null default false
);
create index if not exists error_at_idx on error_log(at desc);

-- =============================================================
-- 18. permission_groups — for the admin UI (replaces _groups in JSON)
-- =============================================================
create table if not exists permission_groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  permissions text not null,                    -- 'all' or comma-list
  description text
);
insert into permission_groups(name, permissions, description) values
  ('מנהל', 'all', 'גישה מלאה לכל המסכים'),
  ('רב', 'home,students,behavior,reading,writing,lessonsKlein,tasks,projects,conversations,calendar,classview,reports,attendance,tests', 'רב כיתה'),
  ('מורה', 'home,students,behavior,tasks,attendance,tests,reading,writing,reports', 'מורה רגיל'),
  ('מזכירות', 'home,students,staff,calendar,signatures,reports,settings', 'מזכירות'),
  ('צוות_שירותים', 'home,tasks,signatures', 'צוות שירותים'),
  ('הורה', 'home,students,behavior,conversations', 'הורה')
on conflict (name) do nothing;

-- =============================================================
-- Row Level Security policies (basic — to refine after migration)
-- =============================================================
alter table users enable row level security;
alter table students enable row level security;
alter table behavior_events enable row level security;
alter table tasks enable row level security;
alter table attendance enable row level security;
alter table tests enable row level security;
alter table medications enable row level security;
alter table meetings enable row level security;
alter table conversations enable row level security;
alter table functioning_reports enable row level security;
alter table signatures enable row level security;
alter table projects enable row level security;
alter table classes enable row level security;
alter table categories enable row level security;
alter table petty_cash enable row level security;
alter table audit_log enable row level security;
alter table error_log enable row level security;

-- Helper: lookup the calling user's permissions
create or replace function bht_caller()
returns users language sql security definer stable as $$
  select * from users where auth_uid = auth.uid() limit 1;
$$;

create or replace function bht_is_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select permissions = 'all' or role = 'מנהל' from users where auth_uid = auth.uid()), false);
$$;

create or replace function bht_has_perm(area text)
returns boolean language sql security definer stable as $$
  select case
    when (select permissions from users where auth_uid = auth.uid()) = 'all' then true
    when (select role from users where auth_uid = auth.uid()) = 'מנהל' then true
    when (select permissions from users where auth_uid = auth.uid()) ~ ('(^|,)' || area || '(,|$)') then true
    else false
  end;
$$;

-- ── Users table policies
create policy users_self_read on users for select using (auth_uid = auth.uid() or bht_is_admin());
create policy users_admin_write on users for all using (bht_is_admin()) with check (bht_is_admin());

-- ── Students: anyone with the permission can read; only admin can write (refine later)
create policy students_read on students for select using (bht_has_perm('students'));
create policy students_write on students for all using (bht_is_admin()) with check (bht_is_admin());

-- ── Behavior events: anyone with behavior perm can read+write
create policy be_read on behavior_events for select using (bht_has_perm('behavior'));
create policy be_write on behavior_events for all using (bht_has_perm('behavior')) with check (bht_has_perm('behavior'));

-- ── Generic policy generator (apply to remaining)
create policy tasks_rw on tasks for all using (bht_has_perm('tasks')) with check (bht_has_perm('tasks'));
create policy att_rw on attendance for all using (bht_has_perm('attendance')) with check (bht_has_perm('attendance'));
create policy tests_rw on tests for all using (bht_has_perm('tests')) with check (bht_has_perm('tests'));
create policy meds_rw on medications for all using (bht_has_perm('medications')) with check (bht_has_perm('medications'));
create policy meetings_rw on meetings for all using (bht_has_perm('meetings')) with check (bht_has_perm('meetings'));
create policy conv_rw on conversations for all using (bht_has_perm('conversations')) with check (bht_has_perm('conversations'));
create policy func_rw on functioning_reports for all using (bht_has_perm('functioning')) with check (bht_has_perm('functioning'));
create policy sig_rw on signatures for all using (bht_has_perm('signatures')) with check (bht_has_perm('signatures'));
create policy proj_rw on projects for all using (bht_has_perm('projects')) with check (bht_has_perm('projects'));
create policy classes_read on classes for select using (true);
create policy classes_write on classes for all using (bht_is_admin()) with check (bht_is_admin());
create policy cat_read on categories for select using (true);
create policy cat_write on categories for all using (bht_is_admin()) with check (bht_is_admin());
create policy pc_rw on petty_cash for all using (bht_is_admin()) with check (bht_is_admin());

-- ── Audit / error logs: insert open (so client can report), read admin-only
create policy audit_insert on audit_log for insert with check (true);
create policy audit_read on audit_log for select using (bht_is_admin());
create policy err_insert on error_log for insert with check (true);
create policy err_read on error_log for select using (bht_is_admin());

-- =============================================================
-- Bootstrap admin users (yosef + yerushalmi)
-- (auth_uid will be filled in automatically on first Google sign-in)
-- =============================================================
insert into users(email, full_name, role, permissions, active) values
  ('6742853@gmail.com',       'יוסף שניידר',           'מנהל', 'all', true),
  ('6787012@gmail.com',       'יוסף שניידר (מכינה)',   'מנהל', 'all', true),
  ('tt0527686018@gmail.com',  'הרב אהוד ירושלמי',      'מנהל', 'all', true)
on conflict (email) do nothing;

-- =============================================================
-- End of schema
-- =============================================================
