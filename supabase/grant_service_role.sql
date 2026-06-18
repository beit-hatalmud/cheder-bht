-- =============================================================
-- Grant service_role full access to all public tables for ETL.
-- service_role bypasses RLS by design; this only adds the
-- table-level GRANT that the new key system now requires.
-- Safe to run multiple times.
-- =============================================================

grant usage on schema public to service_role;

grant select, insert, update, delete
  on all tables in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;

grant usage, select
  on all sequences in schema public to service_role;

alter default privileges in schema public
  grant usage, select on sequences to service_role;

grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  grant execute on functions to service_role;
