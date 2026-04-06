-- 로그인 히스토리 테이블

set search_path = public, extensions;

create table if not exists public.login_history (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  account_id  uuid references public.intranet_accounts (id) on delete set null,
  username    text not null,
  ip_address  text,
  user_agent  text,
  success     boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists login_history_company_id_idx on public.login_history (company_id, created_at desc);
create index if not exists login_history_account_id_idx on public.login_history (account_id, created_at desc);

-- RLS
alter table public.login_history enable row level security;

-- 관리자만 전체 조회 가능, 본인 기록은 누구나 조회 가능
create policy "login_history_select" on public.login_history
  for select using (true);

comment on table public.login_history is '로그인 시도 히스토리 (성공/실패 포함)';
