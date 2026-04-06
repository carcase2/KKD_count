-- 비밀번호 검증/변경 시 extensions.crypt 명시 + trim (다른 crypt와 혼동 방지)
-- password_hash가 깨진 활성 계정은 1234로 복구(로그인 아이디가 있는 행만)

set search_path = public;

update public.intranet_accounts a
set
  password_hash = extensions.crypt('1234', extensions.gen_salt('bf')),
  must_change_password = true,
  updated_at = now()
where a.username is not null
  and a.login_enabled = true
  and (
    a.password_hash is null
    or btrim(a.password_hash) not like '$2%'
  );

drop function if exists public.intranet_change_own_password(uuid, text, text);

create or replace function public.intranet_change_own_password(
  p_account_id uuid,
  p_old_password text,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_old text := trim(both from coalesce(p_old_password, ''));
  v_new text := trim(both from coalesce(p_new_password, ''));
begin
  if length(v_new) < 4 then
    raise exception '새 비밀번호는 4자 이상이어야 합니다';
  end if;

  if not exists (
    select 1 from public.intranet_accounts a
    where a.id = p_account_id
      and a.password_hash is not null
      and length(trim(a.password_hash)) >= 20
      and a.password_hash = extensions.crypt(v_old, a.password_hash)
  ) then
    raise exception '현재 비밀번호가 올바르지 않습니다';
  end if;

  update public.intranet_accounts
  set
    password_hash = extensions.crypt(v_new, extensions.gen_salt('bf')),
    must_change_password = false,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_change_own_password(uuid, text, text) from public;
grant execute on function public.intranet_change_own_password(uuid, text, text) to anon, authenticated;

drop function if exists public.verify_login(text, text);

create or replace function public.verify_login(p_username text, p_password text)
returns table (
  id uuid,
  company_id uuid,
  role text,
  display_name text,
  username text,
  department_id uuid,
  must_change_password boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user text := trim(both from coalesce(p_username, ''));
  v_pass text := trim(both from coalesce(p_password, ''));
begin
  return query
  select
    a.id,
    a.company_id,
    a.role,
    a.display_name,
    a.username,
    a.department_id,
    a.must_change_password
  from public.intranet_accounts a
  where a.username = v_user
    and a.login_enabled = true
    and a.password_hash is not null
    and length(trim(a.password_hash)) >= 20
    and a.password_hash = extensions.crypt(v_pass, a.password_hash);
end;
$$;

revoke all on function public.verify_login(text, text) from public;
grant execute on function public.verify_login(text, text) to anon, authenticated;

-- 발급·초기화도 동일하게 extensions.* 명시
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
    password_hash = extensions.crypt('1234', extensions.gen_salt('bf')),
    login_enabled = true,
    must_change_password = true,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_activate_account(uuid, text) from public;
grant execute on function public.intranet_activate_account(uuid, text) to anon, authenticated;

drop function if exists public.intranet_reset_password(uuid);

create or replace function public.intranet_reset_password(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.intranet_accounts
  set
    password_hash = extensions.crypt('1234', extensions.gen_salt('bf')),
    must_change_password = true,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_reset_password(uuid) from public;
grant execute on function public.intranet_reset_password(uuid) to anon, authenticated;
