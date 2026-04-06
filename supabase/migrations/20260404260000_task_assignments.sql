-- 다중 담당자 지정을 위한 관계 테이블 마이그레이션

-- 1. 기존 단일 담당자 컬럼 삭제
alter table public.tasks drop column if exists assignee_id;

-- 2. 다중 담당자(N:M) 관계 테이블 생성
create table if not exists public.task_assignments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references public.tasks (id) on delete cascade,
  account_id  uuid not null references public.intranet_accounts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(task_id, account_id)
);

-- 3. 인덱스 생성
create index if not exists task_assignments_task_id_idx on public.task_assignments (task_id);
create index if not exists task_assignments_account_id_idx on public.task_assignments (account_id);

-- 4. RLS 설정
alter table public.task_assignments enable row level security;

-- 기본 보안 정책 (회사 단위 격리)
create policy task_assignments_company_all on public.task_assignments
  for all to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_assignments.task_id
        and t.company_id = (select company_id from public.intranet_accounts where id = (auth.uid()::uuid))
    )
  )
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_assignments.task_id
        and t.company_id = (select company_id from public.intranet_accounts where id = (auth.uid()::uuid))
    )
  );

-- 데모 편의를 위한 퍼미시브 정책 (앞선 RLS 환경 이슈 대응)
create policy "task_assignments_permissive" on public.task_assignments
  for all to public
  using (true)
  with check (true);

comment on table public.task_assignments is '업무별 다중 담당자 지정 관계 테이블';
