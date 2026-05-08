-- 멀티테넌트 아이디 정책
-- - 같은 회사: username 중복 금지
-- - 다른 회사: 같은 username 허용
-- - 로그인 입력: 회사코드(invite_code) + username + password

set search_path = public, extensions;

-- 1) 전역 username unique 제거 (있으면 제거)
alter table public.intranet_accounts
  drop constraint if exists intranet_accounts_username_key;
drop index if exists public.intranet_accounts_username_key;

-- 2) 회사별 username unique 강제
create unique index if not exists intranet_accounts_company_username_key
  on public.intranet_accounts (company_id, username)
  where username is not null;

-- 3) 로그인 검증 함수 교체 (회사코드 + 아이디 + 비밀번호)
drop function if exists public.verify_login(text, text);
drop function if exists public.verify_login(text, text, text);

create or replace function public.verify_login(
  p_invite_code text,
  p_username text,
  p_password text
)
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
  v_cid uuid;
begin
  select c.id into v_cid
  from public.companies c
  where upper(trim(c.invite_code)) = upper(trim(p_invite_code))
  limit 1;

  if v_cid is null then
    return;
  end if;

  return query
  select
    a.id,
    a.company_id,
    a.role,
    a.display_name,
    a.username,
    a.department_id,
    coalesce(a.must_change_password, false)
  from public.intranet_accounts a
  where a.company_id = v_cid
    and a.username = trim(p_username)
    and a.password_hash = crypt(p_password, a.password_hash);
end;
$$;

revoke all on function public.verify_login(text, text, text) from public;
grant execute on function public.verify_login(text, text, text) to anon, authenticated;

-- 4) 회사 가입 RPC: username 전역 중복 체크 제거
create or replace function public.signup_new_company(
  p_company_name text,
  p_username text,
  p_password text,
  p_display_name text
)
returns table (
  account_id uuid,
  company_id uuid,
  invite_code text,
  username text,
  display_name text,
  role text,
  department_id uuid
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_cid uuid;
  v_did uuid;
  v_aid uuid;
  v_invite text;
  v_co text := trim(p_company_name);
  v_user text := trim(p_username);
  v_disp text := trim(p_display_name);
begin
  if length(v_co) < 1 then
    raise exception '회사명을 입력하세요';
  end if;
  if length(v_user) < 2 then
    raise exception '아이디는 2자 이상이어야 합니다';
  end if;
  if length(p_password) < 4 then
    raise exception '비밀번호는 4자 이상이어야 합니다';
  end if;

  loop
    v_invite := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    exit when not exists (select 1 from public.companies o where o.invite_code = v_invite);
  end loop;

  insert into public.companies (name, invite_code)
  values (v_co, v_invite)
  returning id into v_cid;

  insert into public.departments (company_id, name, sort_order)
  values (v_cid, '관리부서', 0)
  returning id into v_did;

  insert into public.intranet_accounts (company_id, username, password_hash, role, display_name, department_id)
  values (
    v_cid,
    v_user,
    crypt(p_password, gen_salt('bf')),
    'admin',
    nullif(v_disp, ''),
    v_did
  )
  returning id into v_aid;

  return query
  select v_aid, v_cid, v_invite, v_user, nullif(v_disp, ''), 'admin'::text, v_did;
end;
$$;

-- 5) 계정 발급 RPC: 동일 회사 내에서만 username 중복 체크
drop function if exists public.intranet_activate_account(uuid, text);

create or replace function public.intranet_activate_account(
  p_account_id uuid,
  p_username text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user text := trim(p_username);
  v_cid uuid;
begin
  if length(v_user) < 2 then
    raise exception '아이디는 2자 이상이어야 합니다';
  end if;

  select a.company_id into v_cid
  from public.intranet_accounts a
  where a.id = p_account_id
  limit 1;

  if v_cid is null then
    raise exception '대상 계정을 찾을 수 없습니다';
  end if;

  if exists (
    select 1
    from public.intranet_accounts i
    where i.company_id = v_cid
      and i.username = v_user
      and i.id <> p_account_id
  ) then
    raise exception '이미 사용 중인 아이디입니다';
  end if;

  update public.intranet_accounts
  set
    username = v_user,
    password_hash = crypt('1234', gen_salt('bf')),
    login_enabled = true,
    must_change_password = true
  where id = p_account_id;
end;
$$;

revoke all on function public.intranet_activate_account(uuid, text) from public;
grant execute on function public.intranet_activate_account(uuid, text) to anon, authenticated;
