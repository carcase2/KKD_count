-- 아이디/비밀번호 로그인 (이메일 불필요)
-- 기본 계정: 아이디 관리자 / 비밀번호 1234
-- ⚠️ 데모용: RLS를 끄면 anon 키로 테이블이 열립니다. 외부 공개 배포 전에 반드시 재설계하세요.

-- Supabase는 pgcrypto를 extensions 스키마에 두는 경우가 많습니다.
-- search_path에 extensions가 없으면 verify_login 내부에서 crypt()를 찾지 못합니다.
create extension if not exists pgcrypto with schema extensions;

-- 이후 DDL/시드에서 crypt·gen_salt를 찾기 위해 (대시보드 기본 search_path 대응)
set search_path = public, extensions;

create table if not exists public.intranet_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'user')),
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intranet_accounts_company_id_idx on public.intranet_accounts (company_id);

-- 로그인 검증 (비밀번호 평문은 서버로만 전달, DB에서 해시 비교)
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

-- 기본 관리자 (비밀번호: 1234)
insert into public.intranet_accounts (company_id, username, password_hash, role, display_name)
select c.id, '관리자', crypt('1234', gen_salt('bf')), 'admin', '관리자'
from public.companies c
order by c.created_at
limit 1
on conflict (username) do nothing;

-- 데모: 클라이언트에서 company_id 필터로 조회·수정 (RLS 끔)
alter table public.companies disable row level security;
alter table public.profiles disable row level security;
alter table public.tasks disable row level security;
alter table public.call_logs disable row level security;
alter table public.approval_documents disable row level security;
alter table public.company_settings disable row level security;
alter table public.intranet_accounts disable row level security;
