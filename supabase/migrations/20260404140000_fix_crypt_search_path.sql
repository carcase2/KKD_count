-- 이미 적용한 DB에서 verify_login이 "function crypt(text, text) does not exist" 를 낼 때:
-- pgcrypto가 extensions 스키마에만 있고 함수의 search_path가 public만 있었기 때문입니다.

create extension if not exists pgcrypto with schema extensions;

set search_path = public, extensions;

create or replace function public.verify_login(p_username text, p_password text)
returns table (
  id uuid,
  company_id uuid,
  role text,
  display_name text,
  username text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select a.id, a.company_id, a.role, a.display_name, a.username
  from public.intranet_accounts a
  where a.username = p_username
    and a.password_hash = crypt(p_password, a.password_hash);
end;
$$;

revoke all on function public.verify_login(text, text) from public;
grant execute on function public.verify_login(text, text) to anon, authenticated;
