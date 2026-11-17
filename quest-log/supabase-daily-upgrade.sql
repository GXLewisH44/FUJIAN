-- Preserve daily history if a previously opened client attempts an upload.
begin;
create or replace function public.questlog_write(p_expected bigint, p_snapshot jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare new_version bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_expected < 0 or p_expected is null or p_snapshot->>'schema' is distinct from '1' or jsonb_typeof(p_snapshot->'tasks') is distinct from 'array' then raise exception 'Invalid snapshot'; end if;
  if not (p_snapshot ? 'dailies') and exists (
    select 1 from public.questlog_saves where user_id=auth.uid()
    and payload ? 'dailies' and payload->'dailies' <> '[]'::jsonb
  ) then raise exception '网站已更新，请刷新页面后再同步，以保留每日任务'; end if;
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
select 'daily save protection ready' as result;
