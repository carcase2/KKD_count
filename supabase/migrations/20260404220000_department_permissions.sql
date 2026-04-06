-- 부서별 탭 접근 권한을 저장하기 위한 컬럼 추가

set search_path = public, extensions;

-- 1. permissions 컬럼 추가 (문자열 배열)
alter table public.departments add column if not exists permissions text[] not null default '{}';
comment on column public.departments.permissions is '해당 부서에 허용된 좌측 탭들의 href 배열 (예: {"/dashboard", "/settings/staff"})';

-- 2. 이미 존재하는 '관리부서'에 모든 권한 부여
update public.departments
set permissions = array[
  '/dashboard',
  '/tasks',
  '/quotation',
  '/approval',
  '/calls',
  '/training',
  '/settings/general',
  '/settings/departments',
  '/settings/staff'
]
where name = '관리부서';

-- 3. '관리부서'가 아닌 다른 기존 부서들에는 최소 권한 부여
update public.departments
set permissions = array[
  '/dashboard',
  '/settings/general'
]
where name != '관리부서' and permissions = '{}';
