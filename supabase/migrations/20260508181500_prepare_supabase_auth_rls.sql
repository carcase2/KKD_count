-- Supabase Auth 기반 전환 준비 1단계
-- 목적:
-- 1) intranet_accounts <-> auth.users 매핑 컬럼 추가
-- 2) RLS 정책에서 재사용할 헬퍼 함수 추가
-- 주의:
-- - 이 마이그레이션은 "준비 단계"이며, 즉시 RLS를 강제하지 않습니다.
-- - 현재 앱은 커스텀 세션 기반이므로, 완전 전환 전 RLS를 강제하면 서비스가 중단될 수 있습니다.

set search_path = public, extensions;

-- 1) auth.users 연결 컬럼
alter table public.intranet_accounts
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null;

-- 계정 1개당 auth 사용자 1개 연결
create unique index if not exists intranet_accounts_auth_user_id_key
  on public.intranet_accounts (auth_user_id)
  where auth_user_id is not null;

create index if not exists intranet_accounts_company_auth_idx
  on public.intranet_accounts (company_id, auth_user_id);

comment on column public.intranet_accounts.auth_user_id
  is 'Supabase auth.users.id 와 매핑되는 사용자 식별자';

-- 2) RLS 정책에서 사용할 헬퍼 함수
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.intranet_accounts
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.intranet_accounts
  where auth_user_id = auth.uid()
  limit 1
$$;

revoke all on function public.current_company_id() from public;
revoke all on function public.current_role() from public;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.current_role() to authenticated;

-- 3) 전환 상태 확인용 뷰 (운영 점검)
create or replace view public.intranet_auth_link_health as
select
  a.company_id,
  count(*) as total_accounts,
  count(a.auth_user_id) as linked_accounts,
  count(*) - count(a.auth_user_id) as unlinked_accounts
from public.intranet_accounts a
group by a.company_id;

comment on view public.intranet_auth_link_health
  is '회사별 auth_user_id 매핑 진행률 점검용 뷰';
