-- 계정 발급·비밀번호 초기화 시 기본 비밀번호 1234 + 다음 로그인 시 변경 강제

set search_path = public, extensions;

drop function if exists public.intranet_activate_account(uuid, text, text, boolean);
drop function if exists public.intranet_activate_account(uuid, text);

create or replace function public.intranet_activate_account(p_account_id uuid, p_username text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user text := trim(p_username);
begin
  if length(v_user) < 2 then
    raise exception '아이디는 2자 이상이어야 합니다';
  end if;
  if exists (
    select 1 from public.intranet_accounts i
    where i.username = v_user and i.id <> p_account_id
  ) then
    raise exception '이미 사용 중인 아이디입니다';
  end if;

  update public.intranet_accounts
  set
    username = v_user,
    password_hash = crypt('1234', gen_salt('bf')),
    login_enabled = true,
    must_change_password = true,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_activate_account(uuid, text) from public;
grant execute on function public.intranet_activate_account(uuid, text) to anon, authenticated;

drop function if exists public.intranet_reset_password(uuid, text, boolean);

create or replace function public.intranet_reset_password(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.intranet_accounts
  set
    password_hash = crypt('1234', gen_salt('bf')),
    must_change_password = true,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_reset_password(uuid) from public;
grant execute on function public.intranet_reset_password(uuid) to anon, authenticated;
