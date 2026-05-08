-- 회사별 서브도메인 식별자(tenant_slug) 도입

set search_path = public, extensions;

alter table public.companies
  add column if not exists tenant_slug text;

-- 기존 회사 백필: 이름 기반 slug + 중복 시 suffix
do $$
declare
  r record;
  base_slug text;
  candidate text;
  n int;
begin
  for r in select id, name from public.companies where tenant_slug is null or tenant_slug = '' loop
    base_slug := lower(regexp_replace(coalesce(r.name, 'company'), '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    if base_slug = '' then
      base_slug := 'company';
    end if;

    candidate := base_slug;
    n := 1;
    while exists (select 1 from public.companies c where c.tenant_slug = candidate and c.id <> r.id) loop
      n := n + 1;
      candidate := base_slug || '-' || n::text;
    end loop;

    update public.companies set tenant_slug = candidate where id = r.id;
  end loop;
end $$;

alter table public.companies
  alter column tenant_slug set not null;

create unique index if not exists companies_tenant_slug_key
  on public.companies (tenant_slug);

-- 새 회사 생성 시 tenant_slug 자동 생성
create or replace function public.set_company_tenant_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  n int;
begin
  if new.tenant_slug is not null and trim(new.tenant_slug) <> '' then
    new.tenant_slug := lower(trim(new.tenant_slug));
    return new;
  end if;

  base_slug := lower(regexp_replace(coalesce(new.name, 'company'), '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then
    base_slug := 'company';
  end if;

  candidate := base_slug;
  n := 1;
  while exists (select 1 from public.companies c where c.tenant_slug = candidate) loop
    n := n + 1;
    candidate := base_slug || '-' || n::text;
  end loop;

  new.tenant_slug := candidate;
  return new;
end;
$$;

drop trigger if exists companies_set_tenant_slug on public.companies;
create trigger companies_set_tenant_slug
before insert on public.companies
for each row
execute function public.set_company_tenant_slug();
