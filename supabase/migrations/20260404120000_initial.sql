-- 인트라넷 데모: 멀티테넌시 + RLS
-- Supabase SQL Editor에서 한 번 실행하거나 CLI로 마이그레이션

-- 확장 (Supabase: extensions 스키마 권장 — crypt/gen_salt 위치와 맞춤)
create extension if not exists pgcrypto with schema extensions;

-- 회사
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default '데모 회사',
  created_at timestamptz not null default now()
);

-- 프로필 (auth.users 1:1)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  role text not null default 'user' check (role in ('admin', 'user')),
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles (company_id);

-- 업무
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  description text,
  status text not null check (status in ('received', 'progress', 'done')),
  assignee text,
  source text check (source is null or source in ('manual', 'call')),
  created_at timestamptz not null default now()
);

create index if not exists tasks_company_id_idx on public.tasks (company_id);
create index if not exists tasks_created_at_idx on public.tasks (created_at desc);

-- 전화 접수
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  customer_name text not null,
  phone text not null,
  inquiry_type text not null,
  assignee text not null,
  created_at timestamptz not null default now()
);

create index if not exists call_logs_company_id_idx on public.call_logs (company_id);

-- 전자결재 (결재선은 jsonb)
create table if not exists public.approval_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  body text default '',
  line jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists approval_documents_company_id_idx on public.approval_documents (company_id);

-- 회사별 설정 (텔레그램 등)
create table if not exists public.company_settings (
  company_id uuid primary key references public.companies (id) on delete cascade,
  telegram_bot_token text default '',
  telegram_channel_id text default '',
  updated_at timestamptz not null default now()
);

-- 최초 회사 1개 (가입 시 프로필이 이 회사에 연결됨)
insert into public.companies (name)
select '데모 회사'
where not exists (select 1 from public.companies limit 1);

-- RLS
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.call_logs enable row level security;
alter table public.approval_documents enable row level security;
alter table public.company_settings enable row level security;

-- 소속 회사만 조회
create policy companies_select_member on public.companies
  for select to authenticated
  using (
    id = (select p.company_id from public.profiles p where p.id = auth.uid())
  );

-- 프로필: 같은 회사 직원 목록
create policy profiles_select_company on public.profiles
  for select to authenticated
  using (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  );

-- 본인 프로필 수정 (이름 등)
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 관리자: 같은 회사 직원 역할/표시 정보 수정
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid()
        and me.role = 'admin'
        and me.company_id = profiles.company_id
    )
  )
  with check (
    company_id = (select me.company_id from public.profiles me where me.id = auth.uid())
  );

-- 태스크
create policy tasks_all on public.tasks
  for all to authenticated
  using (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  );

-- 전화 접수
create policy call_logs_all on public.call_logs
  for all to authenticated
  using (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  );

-- 결재
create policy approval_documents_all on public.approval_documents
  for all to authenticated
  using (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  );

-- 회사 설정
create policy company_settings_all on public.company_settings
  for all to authenticated
  using (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  )
  with check (
    company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  );

-- 가입 시 프로필 자동 생성 (첫 번째 회사에 소속)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c_id uuid;
begin
  select id into c_id from public.companies order by created_at limit 1;
  if c_id is null then
    insert into public.companies (name) values ('데모 회사') returning id into c_id;
  end if;

  insert into public.profiles (id, company_id, role, email, display_name)
  values (
    new.id,
    c_id,
    'user',
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  insert into public.company_settings (company_id)
  values (c_id)
  on conflict (company_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
