-- 부서(departments), 회사 초대코드(invite_code), 회원가입 RPC, verify_login에 department_id

set search_path = public, extensions;

-- 회사 초대코드 (기존 행 백필 후 NOT NULL)
alter table public.companies add column if not exists invite_code text;

update public.companies c
set invite_code = upper(substr(md5(random()::text || c.id::text), 1, 8))
where c.invite_code is null;

-- 충돌 시 한 번 더 시도 (극히 드묾)
update public.companies c
set invite_code = upper(substr(md5(random()::text || c.id::text || '2'), 1, 8))
where exists (
  select 1 from public.companies o where o.invite_code = c.invite_code and o.id <> c.id
);

create unique index if not exists companies_invite_code_key on public.companies (invite_code);

alter table public.companies alter column invite_code set not null;

-- 부서
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create index if not exists departments_company_id_idx on public.departments (company_id);

alter table public.intranet_accounts
  add column if not exists department_id uuid references public.departments (id) on delete set null;

create index if not exists intranet_accounts_department_id_idx on public.intranet_accounts (department_id);

-- 기존 회사에 기본 부서(없을 때만)
insert into public.departments (company_id, name, sort_order)
select c.id, '미배정', 0
from public.companies c
where not exists (
  select 1 from public.departments d where d.company_id = c.id
);

-- 기존 계정을 첫 부서에 연결(부서 null인 경우)
update public.intranet_accounts a
set department_id = (
  select d.id from public.departments d
  where d.company_id = a.company_id
  order by d.sort_order, d.name
  limit 1
)
where a.department_id is null;

-- 반환 컬럼(OUT)이 바뀌면 CREATE OR REPLACE 불가 — 먼저 제거
drop function if exists public.verify_login(text, text);

-- 로그인 응답에 부서 포함
create or replace function public.verify_login(p_username text, p_password text)
returns table (
  id uuid,
  company_id uuid,
  role text,
  display_name text,
  username text,
  department_id uuid
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select a.id, a.company_id, a.role, a.display_name, a.username, a.department_id
  from public.intranet_accounts a
  where a.username = p_username
    and a.password_hash = crypt(p_password, a.password_hash);
end;
$$;

revoke all on function public.verify_login(text, text) from public;
grant execute on function public.verify_login(text, text) to anon, authenticated;

-- 초대코드로 부서 목록 (가입 폼용)
create or replace function public.departments_for_invite(p_invite text)
returns table (
  id uuid,
  name text
)
language sql
security definer
set search_path = public
as $$
  select d.id, d.name
  from public.departments d
  inner join public.companies c on c.id = d.company_id
  where upper(trim(c.invite_code)) = upper(trim(p_invite))
  order by d.sort_order, d.name;
$$;

revoke all on function public.departments_for_invite(text) from public;
grant execute on function public.departments_for_invite(text) to anon, authenticated;

-- 새 회사 + 관리자 1명
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
  if exists (select 1 from public.intranet_accounts i where i.username = v_user) then
    raise exception '이미 사용 중인 아이디입니다';
  end if;

  loop
    v_invite := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    exit when not exists (select 1 from public.companies o where o.invite_code = v_invite);
  end loop;

  insert into public.companies (name, invite_code)
  values (v_co, v_invite)
  returning id into v_cid;

  insert into public.departments (company_id, name, sort_order)
  values (v_cid, '미배정', 0)
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

revoke all on function public.signup_new_company(text, text, text, text) from public;
grant execute on function public.signup_new_company(text, text, text, text) to anon, authenticated;

-- 초대코드로 직원 가입
create or replace function public.signup_join_company(
  p_invite_code text,
  p_username text,
  p_password text,
  p_display_name text,
  p_department_id uuid default null
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
  v_aid uuid;
  v_invite text;
  v_user text := trim(p_username);
  v_disp text := trim(p_display_name);
begin
  if length(v_user) < 2 then
    raise exception '아이디는 2자 이상이어야 합니다';
  end if;
  if length(p_password) < 4 then
    raise exception '비밀번호는 4자 이상이어야 합니다';
  end if;

  select c.id, c.invite_code into v_cid, v_invite
  from public.companies c
  where upper(trim(c.invite_code)) = upper(trim(p_invite_code))
  limit 1;

  if v_cid is null then
    raise exception '초대코드가 올바르지 않습니다';
  end if;

  if exists (select 1 from public.intranet_accounts i where i.username = v_user) then
    raise exception '이미 사용 중인 아이디입니다';
  end if;

  if p_department_id is not null then
    if not exists (
      select 1 from public.departments d
      where d.id = p_department_id and d.company_id = v_cid
    ) then
      raise exception '선택한 부서가 이 회사에 속하지 않습니다';
    end if;
  end if;

  insert into public.intranet_accounts (company_id, username, password_hash, role, display_name, department_id)
  values (
    v_cid,
    v_user,
    crypt(p_password, gen_salt('bf')),
    'user',
    nullif(v_disp, ''),
    p_department_id
  )
  returning id into v_aid;

  return query
  select v_aid, v_cid, v_invite, v_user, nullif(v_disp, ''), 'user'::text, p_department_id;
end;
$$;

revoke all on function public.signup_join_company(text, text, text, text, uuid) from public;
grant execute on function public.signup_join_company(text, text, text, text, uuid) to anon, authenticated;

alter table public.departments disable row level security;
