begin;
-- Run once in the connected Supabase project before setting public config.js.
-- No service-role credential is used by the website. Each authenticated user sees only their own row.
create table if not exists public.questlog_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version bigint not null default 1 check (version > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 2000000),
  updated_at timestamptz not null default now()
);
alter table public.questlog_saves enable row level security;
revoke all on public.questlog_saves from public, anon, authenticated;
grant select, insert, update on public.questlog_saves to authenticated;
create policy questlog_read_own on public.questlog_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy questlog_insert_own on public.questlog_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy questlog_update_own on public.questlog_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create or replace function public.questlog_write(p_expected bigint, p_snapshot jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare new_version bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_expected < 0 or p_expected is null or p_snapshot->>'schema' is distinct from '1' or jsonb_typeof(p_snapshot->'tasks') is distinct from 'array' then raise exception 'Invalid snapshot'; end if;
  if p_expected = 0 then
    insert into public.questlog_saves(user_id, version, payload) values(auth.uid(), 1, p_snapshot)
    on conflict (user_id) do nothing returning version into new_version;
  else
    update public.questlog_saves set payload=p_snapshot, version=version+1, updated_at=now()
    where user_id=auth.uid() and version=p_expected returning version into new_version;
  end if;
  if new_version is null then return jsonb_build_object('conflict',true); end if;
  return jsonb_build_object('version',new_version);
end; $$;
revoke all on function public.questlog_write(bigint,jsonb) from public,anon;
grant execute on function public.questlog_write(bigint,jsonb) to authenticated;

commit;
select 'questlog schema ready' as result;
