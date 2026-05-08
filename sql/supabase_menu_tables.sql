-- Supabase schema for menu CRUD screens
-- Tables used by the app:
-- 1) clients_v2
-- 2) service_catalog_v2 (if missing)
-- 3) financial_entries_v2

begin;

-- ------------------------------------------------------------
-- Optional helper: updated_at trigger function
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- clients_v2
-- ------------------------------------------------------------
create table if not exists public.clients_v2 (
  id bigserial primary key,
  name text not null,
  phone text,
  plate text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_v2_name on public.clients_v2 (name);
create index if not exists idx_clients_v2_plate on public.clients_v2 (plate);

-- Recreate trigger safely
drop trigger if exists trg_clients_v2_updated_at on public.clients_v2;
create trigger trg_clients_v2_updated_at
before update on public.clients_v2
for each row execute function public.set_updated_at();

alter table public.clients_v2 enable row level security;

-- Policies: authenticated users can manage rows
drop policy if exists "clients_v2_select_authenticated" on public.clients_v2;
create policy "clients_v2_select_authenticated"
on public.clients_v2
for select
using (auth.role() = 'authenticated');

drop policy if exists "clients_v2_insert_authenticated" on public.clients_v2;
create policy "clients_v2_insert_authenticated"
on public.clients_v2
for insert
with check (auth.role() = 'authenticated');

drop policy if exists "clients_v2_update_authenticated" on public.clients_v2;
create policy "clients_v2_update_authenticated"
on public.clients_v2
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "clients_v2_delete_authenticated" on public.clients_v2;
create policy "clients_v2_delete_authenticated"
on public.clients_v2
for delete
using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- service_catalog_v2 (create only if missing)
-- ------------------------------------------------------------
create table if not exists public.service_catalog_v2 (
  id bigserial primary key,
  name text not null,
  default_price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_service_catalog_v2_name on public.service_catalog_v2 (name);
create index if not exists idx_service_catalog_v2_is_active on public.service_catalog_v2 (is_active);

drop trigger if exists trg_service_catalog_v2_updated_at on public.service_catalog_v2;
create trigger trg_service_catalog_v2_updated_at
before update on public.service_catalog_v2
for each row execute function public.set_updated_at();

alter table public.service_catalog_v2 enable row level security;

drop policy if exists "service_catalog_v2_select_authenticated" on public.service_catalog_v2;
create policy "service_catalog_v2_select_authenticated"
on public.service_catalog_v2
for select
using (auth.role() = 'authenticated');

drop policy if exists "service_catalog_v2_insert_authenticated" on public.service_catalog_v2;
create policy "service_catalog_v2_insert_authenticated"
on public.service_catalog_v2
for insert
with check (auth.role() = 'authenticated');

drop policy if exists "service_catalog_v2_update_authenticated" on public.service_catalog_v2;
create policy "service_catalog_v2_update_authenticated"
on public.service_catalog_v2
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "service_catalog_v2_delete_authenticated" on public.service_catalog_v2;
create policy "service_catalog_v2_delete_authenticated"
on public.service_catalog_v2
for delete
using (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- financial_entries_v2
-- ------------------------------------------------------------
create table if not exists public.financial_entries_v2 (
  id bigserial primary key,
  entry_date date not null default current_date,
  description text not null,
  amount numeric(12,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_financial_entries_v2_date on public.financial_entries_v2 (entry_date desc);
create index if not exists idx_financial_entries_v2_description on public.financial_entries_v2 (description);

drop trigger if exists trg_financial_entries_v2_updated_at on public.financial_entries_v2;
create trigger trg_financial_entries_v2_updated_at
before update on public.financial_entries_v2
for each row execute function public.set_updated_at();

alter table public.financial_entries_v2 enable row level security;

drop policy if exists "financial_entries_v2_select_authenticated" on public.financial_entries_v2;
create policy "financial_entries_v2_select_authenticated"
on public.financial_entries_v2
for select
using (auth.role() = 'authenticated');

drop policy if exists "financial_entries_v2_insert_authenticated" on public.financial_entries_v2;
create policy "financial_entries_v2_insert_authenticated"
on public.financial_entries_v2
for insert
with check (auth.role() = 'authenticated');

drop policy if exists "financial_entries_v2_update_authenticated" on public.financial_entries_v2;
create policy "financial_entries_v2_update_authenticated"
on public.financial_entries_v2
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "financial_entries_v2_delete_authenticated" on public.financial_entries_v2;
create policy "financial_entries_v2_delete_authenticated"
on public.financial_entries_v2
for delete
using (auth.role() = 'authenticated');

commit;
