-- Read-only diagnostics for "Database error saving new user".

-- Custom triggers attached to Supabase Auth's users table and their functions.
select
  trigger_row.tgname as trigger_name,
  pg_get_triggerdef(trigger_row.oid) as trigger_definition,
  pg_get_functiondef(trigger_row.tgfoid) as trigger_function
from pg_trigger as trigger_row
join pg_class as table_row on table_row.oid = trigger_row.tgrelid
join pg_namespace as schema_row on schema_row.oid = table_row.relnamespace
where schema_row.nspname = 'auth'
  and table_row.relname = 'users'
  and not trigger_row.tgisinternal;

-- Profile table columns, nullability, and defaults.
select
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
order by ordinal_position;

-- Profile table constraints that may reject the trigger's insert.
select
  constraint_row.conname as constraint_name,
  pg_get_constraintdef(constraint_row.oid) as constraint_definition
from pg_constraint as constraint_row
join pg_class as table_row on table_row.oid = constraint_row.conrelid
join pg_namespace as schema_row on schema_row.oid = table_row.relnamespace
where schema_row.nspname = 'public'
  and table_row.relname = 'users'
order by constraint_row.conname;
