-- 부서별 UI 색상 (#RRGGBB 등, null이면 앱에서 기본색 사용)

set search_path = public;

alter table public.departments add column if not exists color text;

comment on column public.departments.color is '직원·배지 표시용 색 (예: #2563eb). 비어 있으면 클라이언트 기본색.';
