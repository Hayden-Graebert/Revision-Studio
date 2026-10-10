-- Run once in the SQL Editor of a NEW Supabase project (safe to rerun).
-- Never disable RLS. Auth owns passwords; this table only stores study data.
begin;
create table if not exists public.revision_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.revision_state enable row level security;
revoke all on public.revision_state from anon;
revoke all on public.revision_state from authenticated;
grant select, insert, update on public.revision_state to authenticated;
drop policy if exists "Read own revision data" on public.revision_state;
create policy "Read own revision data" on public.revision_state
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Create own revision data" on public.revision_state;
create policy "Create own revision data" on public.revision_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own revision data" on public.revision_state;
create policy "Update own revision data" on public.revision_state
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
commit;
