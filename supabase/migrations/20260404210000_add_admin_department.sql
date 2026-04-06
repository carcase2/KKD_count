-- 새 회사 생성 시 '관리부서'를 만들고, 모든 기존/신규 사장(admin) 계정을 '관리부서'에 소속되게 합니다.

set search_path = public, extensions;

-- 1. 기존 회사들에 '관리부서'가 없다면 추가
insert into public.departments (company_id, name, sort_order)
select c.id, '관리부서', -1
from public.companies c
where not exists (
  select 1 from public.departments d where d.company_id = c.id and d.name = '관리부서'
);

-- 2. 관리자(admin) 계정들을 '관리부서'로 이동
update public.intranet_accounts a
set department_id = (
  select d.id from public.departments d 
  where d.company_id = a.company_id and d.name = '관리부서'
  limit 1
)
where a.role = 'admin';

-- 3. 새 회사 생성 RPC 갱신: 이제 '미배정' 대신 '관리부서'를 기본으로 생성하고 사장을 할당
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

  -- '미배정' 대신 '관리부서' 생성 (기본 권한 부서)
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
