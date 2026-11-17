-- Supabase's optional automatic-RLS event trigger runs as the database owner.
-- Browser API roles do not need to invoke its SECURITY DEFINER function.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
