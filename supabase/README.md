# cheder-bht — Supabase migration

This folder contains everything needed to migrate cheder-bht off Google Sheets
and onto Supabase (PostgreSQL + Auth + Realtime + Storage).

## Why Supabase
- Real database with foreign keys, indexes, transactions, joins
- Built-in Google OAuth (no separate Client ID setup for us)
- Row Level Security — enforced on the **server**, not the browser
- Realtime subscriptions — push updates to all open tabs
- Free tier: 500 MB DB, 2 GB egress, unlimited rows — fits this institution

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Full DDL for 18 tables + RLS policies + bootstrap admins |
| `migrate.py` | Reads Google Sheet via Apps Script proxy and inserts into Supabase |
| `seed_dev.sql` | Sample data for testing without touching real Sheet |
| `policies/` | Per-table RLS refinements (after we know real usage patterns) |

## Migration flow

```
Google Sheet ──[migrate.py]──▶ Supabase
       ▲                            │
       │                       (canonical store)
       │                            │
   read-only                        ▼
   for safety            Frontend (GitHub Pages)
   until cutover         via supabase-js client
```

1. Run `schema.sql` once in Supabase SQL editor → creates all tables.
2. Run `migrate.py` → bulk inserts every row from Sheet, preserving `legacy_id`.
3. Run again later → idempotent on `legacy_id` (upserts).
4. Switch frontend `api.js` to Supabase client.
5. Leave Sheet as backup for 30 days; archive after.

## RLS reasoning

- **Everything starts denied** (`alter table ... enable row level security`).
- A user has rows visible to them via `bht_has_perm('area')` lookup based on
  `users.permissions` (the comma-list).
- Admin (role=מנהל or permissions=all) bypasses all checks.
- Audit + error logs: writes are open (client must report bugs),
  reads are admin-only.

## Refinement plan

After migration, refine per-table:
- `students` → only own class rows for רב (visible_classes filter)
- `behavior_events` → recorded_by must be self for non-admins
- `users` → can update own row but not role/permissions

This is intentionally permissive in v1 so we don't lock anyone out
during cutover. v2 tightens.
