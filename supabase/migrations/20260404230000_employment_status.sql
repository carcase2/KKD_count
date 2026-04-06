-- 직원 상태(재직/휴직/퇴직), 입사일, 퇴사일 추가

set search_path = public, extensions;

-- 고용 상태 타입
do $$ begin
  create type public.employment_status as enum ('active', 'leave', 'resigned');
exception when duplicate_object then null;
end $$;

-- 컬럼 추가
alter table public.intranet_accounts
  add column if not exists employment_status public.employment_status not null default 'active',
  add column if not exists joined_at date,
  add column if not exists resigned_at date;

comment on column public.intranet_accounts.employment_status is '재직 상태: active=재직, leave=휴직, resigned=퇴직';
comment on column public.intranet_accounts.joined_at is '입사일';
comment on column public.intranet_accounts.resigned_at is '퇴사일 (퇴직 시)';
