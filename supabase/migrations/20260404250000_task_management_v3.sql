-- 업무 관리 v3 마이그레이션

-- 1. 기존 테이블 삭제 (데이터 초기화)
drop table if exists public.task_comments cascade;
drop table if exists public.tasks cascade;
drop type if exists public.task_status cascade;
drop type if exists public.task_priority cascade;

-- 2. 타입 생성
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

-- 3. 업무 테이블 생성
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  department_id uuid references public.departments (id) on delete set null,
  created_by uuid references public.intranet_accounts (id) on delete set null,
  assignee_id uuid references public.intranet_accounts (id) on delete set null,
  
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date date,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. 업무 댓글 테이블 생성
create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null references public.intranet_accounts (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 5. 인덱스
create index tasks_company_id_idx on public.tasks (company_id);
create index tasks_department_id_idx on public.tasks (department_id);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index task_comments_task_id_idx on public.task_comments (task_id);

-- 6. RLS 설정
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;

-- 같은 회사 직원끼리는 모든 업무 조회/수정 가능 (권한은 추후 세분화 가능)
create policy tasks_company_all on public.tasks
  for all to authenticated
  using (
    company_id = (select company_id from public.intranet_accounts where id = (auth.uid()::uuid))
  )
  with check (
    company_id = (select company_id from public.intranet_accounts where id = (auth.uid()::uuid))
  );

create policy task_comments_company_all on public.task_comments
  for all to authenticated
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and t.company_id = (select company_id from public.intranet_accounts where id = (auth.uid()::uuid))
    )
  )
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_comments.task_id
        and t.company_id = (select company_id from public.intranet_accounts where id = (auth.uid()::uuid))
    )
  );

-- 7. 트리거 (updated_at)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_tasks_updated_at
  before update on public.tasks
  for each row execute procedure update_updated_at_column();
