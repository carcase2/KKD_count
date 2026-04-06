-- 회사 전용 DB 전제: 공개 가입은 직원(user)만. 이름·전화번호·아이디·비밀번호.
-- companies 첫 행(가장 이른 created_at)에 소속. 관리자는 설정에서 부서·권한 지정.
-- 부서별 권한은 이후 departments 정책 컬럼 또는 별도 테이블로 확장 가능.

set search_path = public, extensions;

alter table public.intranet_accounts add column if not exists phone text;

-- 반환 타입이 달라질 수 있으므로 기존 가입 RPC 제거
drop function if exists public.signup_new_company(text, text, text, text);
drop function if exists public.signup_join_company(text, text, text, text, uuid);
drop function if exists public.departments_for_invite(text);

create or replace function public.signup_employee(
  p_username text,
  p_password text,
  p_display_name text,
  p_phone text
)
returns table (
  account_id uuid,
  company_id uuid,
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
  v_user text := trim(p_username);
  v_disp text := trim(p_display_name);
  v_phone text := trim(regexp_replace(coalesce(p_phone, ''), '[[:space:]-]', '', 'g'));
begin
  if length(v_user) < 2 then
    raise exception '아이디는 2자 이상이어야 합니다';
  end if;
  if length(p_password) < 4 then
    raise exception '비밀번호는 4자 이상이어야 합니다';
  end if;
  if length(v_disp) < 1 then
    raise exception '이름을 입력하세요';
  end if;
  if length(v_phone) < 8 then
    raise exception '전화번호를 8자 이상 입력하세요 (하이픈·공백 제외)';
  end if;

  select c.id into v_cid
  from public.companies c
  order by c.created_at asc
  limit 1;

  if v_cid is null then
    raise exception '회사(companies) 정보가 없습니다. 초기 마이그레이션을 실행하세요';
  end if;

  if exists (select 1 from public.intranet_accounts i where i.username = v_user) then
    raise exception '이미 사용 중인 아이디입니다';
  end if;

  insert into public.intranet_accounts (
    company_id,
    username,
    password_hash,
    role,
    display_name,
    department_id,
    phone
  )
  values (
    v_cid,
    v_user,
    crypt(p_password, gen_salt('bf')),
    'user',
    v_disp,
    null,
    v_phone
  )
  returning id into v_aid;

  return query
  select v_aid, v_cid, v_user, v_disp, 'user'::text, null::uuid;
end;
$$;

revoke all on function public.signup_employee(text, text, text, text) from public;
grant execute on function public.signup_employee(text, text, text, text) to anon, authenticated;
