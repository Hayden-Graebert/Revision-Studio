-- Additive update. Leaves revision_state and all existing progress untouched.
begin;
create table if not exists public.generation_usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 requests integer not null default 0,
 input_tokens bigint not null default 0,
 output_tokens bigint not null default 0,
 last_request_at timestamptz,
 primary key(user_id,day)
);
alter table public.generation_usage enable row level security;
revoke all on public.generation_usage from anon, authenticated;
grant select on public.generation_usage to authenticated;
grant all on public.generation_usage to service_role;
drop policy if exists "Read own generation usage" on public.generation_usage;
create policy "Read own generation usage" on public.generation_usage for select to authenticated using ((select auth.uid()) = user_id);
create or replace function public.reserve_generation(p_user_id uuid,p_limit integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Europe/London')::date; row_data public.generation_usage%rowtype;
begin
 insert into public.generation_usage(user_id,day) values(p_user_id,d) on conflict do nothing;
 select * into row_data from public.generation_usage where user_id=p_user_id and day=d for update;
 if row_data.requests >= least(100,greatest(1,p_limit)) then
  return jsonb_build_object('allowed',false,'reason','daily_limit');
 end if;
 if row_data.last_request_at > now() - interval '3 seconds' then
  return jsonb_build_object('allowed',false,'reason','cooldown');
 end if;
 update public.generation_usage set requests=requests+1,last_request_at=now() where user_id=p_user_id and day=d;
 return jsonb_build_object('allowed',true,'requests',row_data.requests+1,'day',d);
end $$;
create or replace function public.record_generation_usage(p_user_id uuid,p_day date,p_input bigint,p_output bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
 update public.generation_usage set input_tokens=input_tokens+greatest(0,p_input),output_tokens=output_tokens+greatest(0,p_output) where user_id=p_user_id and day=p_day;
 return jsonb_build_object('recorded',true);
end $$;
revoke all on function public.reserve_generation(uuid,integer) from public,anon,authenticated;
revoke all on function public.record_generation_usage(uuid,date,bigint,bigint) from public,anon,authenticated;
grant execute on function public.reserve_generation(uuid,integer) to service_role;
grant execute on function public.record_generation_usage(uuid,date,bigint,bigint) to service_role;
commit;
