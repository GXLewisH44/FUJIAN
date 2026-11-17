begin;
create temp table questlog_test_actors(a uuid,b uuid);
insert into questlog_test_actors values(gen_random_uuid(),gen_random_uuid());
grant select on questlog_test_actors to authenticated;
insert into auth.users(id,instance_id,aud,role,email)
select a,'00000000-0000-0000-0000-000000000000'::uuid,'authenticated','authenticated',a::text||'@questlog-test.invalid' from questlog_test_actors
union all select b,'00000000-0000-0000-0000-000000000000'::uuid,'authenticated','authenticated',b::text||'@questlog-test.invalid' from questlog_test_actors;
set local role anon;
do $$ begin
  begin perform 1 from public.questlog_saves; raise exception 'FAIL: anon read allowed'; exception when insufficient_privilege then null; end;
  if has_function_privilege(current_user,'public.questlog_write(bigint,jsonb)','EXECUTE') then raise exception 'FAIL: anonymous RPC access'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',a::text,true) from questlog_test_actors;
do $$ declare r jsonb; begin
  r:=public.questlog_write(0,'{"schema":1,"demo":false,"tasks":[]}');
  if r->>'version' is distinct from '1' then raise exception 'FAIL: first write'; end if;
  r:=public.questlog_write(0,'{"schema":1,"demo":false,"tasks":[]}');
  if r->>'conflict' is distinct from 'true' then raise exception 'FAIL: duplicate write overwrote'; end if;
  r:=public.questlog_write(1,'{"schema":1,"demo":false,"tasks":[]}');
  if r->>'version' is distinct from '2' then raise exception 'FAIL: version update'; end if;
  r:=public.questlog_write(1,'{"schema":1,"demo":false,"tasks":[]}');
  if r->>'conflict' is distinct from 'true' then raise exception 'FAIL: stale version overwrote'; end if;
  if (select count(*) from public.questlog_saves)<>1 then raise exception 'FAIL: own row not visible'; end if;
  begin delete from public.questlog_saves; raise exception 'FAIL: delete allowed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',b::text,true) from questlog_test_actors;
do $$ declare touched integer; r jsonb; begin
  if (select count(*) from public.questlog_saves)<>0 then raise exception 'FAIL: another user sees A'; end if;
  update public.questlog_saves set version=99 where user_id=(select a from questlog_test_actors);
  get diagnostics touched=row_count;
  if touched<>0 then raise exception 'FAIL: another user updates A'; end if;
  begin
    insert into public.questlog_saves(user_id,payload) select a,'{"schema":1,"tasks":[]}'::jsonb from questlog_test_actors;
    raise exception 'FAIL: forged ownership inserted';
  exception when insufficient_privilege then null; end;
  r:=public.questlog_write(0,'{"schema":1,"demo":false,"tasks":[]}');
  if r->>'version' is distinct from '1' then raise exception 'FAIL: B cannot create own save'; end if;
  begin
    update public.questlog_saves set user_id=(select a from questlog_test_actors) where user_id=(select b from questlog_test_actors);
    raise exception 'FAIL: owner reassignment allowed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  if (select count(*) from public.questlog_saves)<>0 then raise exception 'FAIL: missing identity sees rows'; end if;
  begin perform public.questlog_write(0,'{"schema":1,"tasks":[]}'); raise exception 'FAIL: missing identity writes';
  exception when raise_exception then if SQLERRM <> 'Authentication required' then raise; end if; end;
end $$;
reset role;
rollback;
select 'PASS: anonymous denial, account isolation, owner checks, create/update, version conflicts; all fixtures rolled back' as result;

