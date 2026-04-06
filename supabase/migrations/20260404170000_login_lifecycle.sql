-- 로그인 생애주기: 가입은 이름·전화만(계정 대기). 관리자가 아이디·초기 비밀번호 발급.
-- 첫 로그인 시 비밀번호 변경 강제(must_change_password). 로그인 허용 토글(login_enabled).

set search_path = public, extensions;

alter table public.intranet_accounts add column if not exists login_enabled boolean not null default true;
alter table public.intranet_accounts add column if not exists must_change_password boolean not null default false;

alter table public.intranet_accounts alter column username drop not null;
alter table public.intranet_accounts alter column password_hash drop not null;

-- 기존 행: 로그인 가능하도록
update public.intranet_accounts
set login_enabled = true, must_change_password = coalesce(must_change_password, false)
where username is not null and password_hash is not null and login_enabled is distinct from false;

update public.intranet_accounts
set login_enabled = false
where username is null or password_hash is null;

-- 공개 가입 RPC 교체: 아이디·비밀번호 없이 신청만
drop function if exists public.signup_employee(text, text, text, text);

create or replace function public.register_employee_request(
  p_display_name text,
  p_phone text
)
returns table (account_id uuid, company_id uuid)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cid uuid;
  v_aid uuid;
  v_disp text := trim(p_display_name);
  v_phone text := trim(regexp_replace(coalesce(p_phone, ''), '[[:space:]-]', '', 'g'));
begin
  if length(v_disp) < 1 then
    raise exception '이름을 입력하세요';
  end if;
  if length(v_phone) < 8 then
    raise exception '전화번호를 8자 이상 입력하세요';
  end if;

  select c.id into v_cid
  from public.companies c
  order by c.created_at asc
  limit 1;

  if v_cid is null then
    raise exception '회사(companies) 정보가 없습니다';
  end if;

  insert into public.intranet_accounts (
    company_id,
    username,
    password_hash,
    role,
    display_name,
    phone,
    department_id,
    login_enabled,
    must_change_password
  )
  values (
    v_cid,
    null,
    null,
    'user',
    v_disp,
    v_phone,
    null,
    false,
    false
  )
  returning id into v_aid;

  return query select v_aid, v_cid;
end;
$$;

revoke all on function public.register_employee_request(text, text) from public;
grant execute on function public.register_employee_request(text, text) to anon, authenticated;

-- 관리자(앱 서버)에서 호출: 로그인 아이디·초기 비밀번호 발급
create or replace function public.intranet_activate_account(
  p_account_id uuid,
  p_username text,
  p_initial_password text,
  p_must_change_password boolean default true
)
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
  if length(p_initial_password) < 4 then
    raise exception '초기 비밀번호는 4자 이상이어야 합니다';
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
    password_hash = crypt(p_initial_password, gen_salt('bf')),
    login_enabled = true,
    must_change_password = p_must_change_password,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_activate_account(uuid, text, text, boolean) from public;
grant execute on function public.intranet_activate_account(uuid, text, text, boolean) to anon, authenticated;

create or replace function public.intranet_reset_password(
  p_account_id uuid,
  p_new_password text,
  p_must_change_password boolean default true
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if length(p_new_password) < 4 then
    raise exception '비밀번호는 4자 이상이어야 합니다';
  end if;

  update public.intranet_accounts
  set
    password_hash = crypt(p_new_password, gen_salt('bf')),
    must_change_password = p_must_change_password,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_reset_password(uuid, text, boolean) from public;
grant execute on function public.intranet_reset_password(uuid, text, boolean) to anon, authenticated;

create or replace function public.intranet_set_login_enabled(p_account_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.intranet_accounts
  set
    login_enabled = p_enabled,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_set_login_enabled(uuid, boolean) from public;
grant execute on function public.intranet_set_login_enabled(uuid, boolean) to anon, authenticated;

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
begin
  if length(p_new_password) < 4 then
    raise exception '새 비밀번호는 4자 이상이어야 합니다';
  end if;

  if not exists (
    select 1 from public.intranet_accounts a
    where a.id = p_account_id
      and a.password_hash is not null
      and a.password_hash = crypt(p_old_password, a.password_hash)
  ) then
    raise exception '현재 비밀번호가 올바르지 않습니다';
  end if;

  update public.intranet_accounts
  set
    password_hash = crypt(p_new_password, gen_salt('bf')),
    must_change_password = false,
    updated_at = now()
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_change_own_password(uuid, text, text) from public;
grant execute on function public.intranet_change_own_password(uuid, text, text) to anon, authenticated;

-- 로그인 검증 갱신
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
  where a.username = p_username
    and a.login_enabled = true
    and a.password_hash is not null
    and a.password_hash = crypt(p_password, a.password_hash);
end;
$$;

revoke all on function public.verify_login(text, text) from public;
grant execute on function public.verify_login(text, text) to anon, authenticated;
