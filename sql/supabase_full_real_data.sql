-- Full SQL for real data persistence in Sistema Etork
-- Covers: auth-linked CRUD tables + receipts view used by the app

begin;

-- ------------------------------------------------------------
-- Helpers
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
-- CLIENTS
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

drop trigger if exists trg_clients_v2_updated_at on public.clients_v2;
create trigger trg_clients_v2_updated_at
before update on public.clients_v2
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- PRODUCTS / SERVICES CATALOG
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

-- ------------------------------------------------------------
-- FINANCIAL ENTRIES
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

-- ------------------------------------------------------------
-- DOCUMENTS (quote / appointment / sale)
-- ------------------------------------------------------------
create table if not exists public.documents_v2 (
  id bigserial primary key,
  doc_type text not null check (doc_type in ('orcamento', 'agendamento', 'venda')),
  status text not null default 'aberto',
  customer_name_snapshot text,
  phone_snapshot text,
  plate_snapshot text,
  vehicle_snapshot text,
  labor_required boolean not null default true,
  service_time_days int not null default 1,
  scheduled_for timestamptz,
  discount_amount numeric(12,2) not null default 0,
  notes text,
  subtotal_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_v2_doc_type_created_at on public.documents_v2 (doc_type, created_at desc);
create index if not exists idx_documents_v2_created_at on public.documents_v2 (created_at desc);

drop trigger if exists trg_documents_v2_updated_at on public.documents_v2;
create trigger trg_documents_v2_updated_at
before update on public.documents_v2
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- DOCUMENT ITEMS
-- ------------------------------------------------------------
create table if not exists public.document_items_v2 (
  id bigserial primary key,
  document_id bigint not null references public.documents_v2(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_items_v2_document_id on public.document_items_v2 (document_id);

drop trigger if exists trg_document_items_v2_updated_at on public.document_items_v2;
create trigger trg_document_items_v2_updated_at
before update on public.document_items_v2
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Receipts list view consumed by app: v_receipts_list_v2
-- ------------------------------------------------------------
create or replace view public.v_receipts_list_v2 as
select
  d.id,
  d.created_at,
  d.created_at::date as sale_date,
  coalesce(d.customer_name_snapshot, 'SEM CLIENTE') as customer_name,
  coalesce(nullif(split_part(d.vehicle_snapshot, E'\n', 1), ''), d.vehicle_snapshot, 'SEM VEICULO') as vehicle_desc,
  coalesce(d.plate_snapshot, 'SEM PLACA') as plate,
  d.total_amount
from public.documents_v2 d
where d.doc_type = 'venda';

-- ------------------------------------------------------------
-- RLS + Policies (authenticated users)
-- ------------------------------------------------------------
alter table public.clients_v2 enable row level security;
alter table public.service_catalog_v2 enable row level security;
alter table public.financial_entries_v2 enable row level security;
alter table public.documents_v2 enable row level security;
alter table public.document_items_v2 enable row level security;

-- clients_v2 policies
drop policy if exists "clients_v2_select_authenticated" on public.clients_v2;
create policy "clients_v2_select_authenticated" on public.clients_v2
for select using (auth.role() = 'authenticated');

drop policy if exists "clients_v2_insert_authenticated" on public.clients_v2;
create policy "clients_v2_insert_authenticated" on public.clients_v2
for insert with check (auth.role() = 'authenticated');

drop policy if exists "clients_v2_update_authenticated" on public.clients_v2;
create policy "clients_v2_update_authenticated" on public.clients_v2
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "clients_v2_delete_authenticated" on public.clients_v2;
create policy "clients_v2_delete_authenticated" on public.clients_v2
for delete using (auth.role() = 'authenticated');

-- service_catalog_v2 policies
drop policy if exists "service_catalog_v2_select_authenticated" on public.service_catalog_v2;
create policy "service_catalog_v2_select_authenticated" on public.service_catalog_v2
for select using (auth.role() = 'authenticated');

drop policy if exists "service_catalog_v2_insert_authenticated" on public.service_catalog_v2;
create policy "service_catalog_v2_insert_authenticated" on public.service_catalog_v2
for insert with check (auth.role() = 'authenticated');

drop policy if exists "service_catalog_v2_update_authenticated" on public.service_catalog_v2;
create policy "service_catalog_v2_update_authenticated" on public.service_catalog_v2
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "service_catalog_v2_delete_authenticated" on public.service_catalog_v2;
create policy "service_catalog_v2_delete_authenticated" on public.service_catalog_v2
for delete using (auth.role() = 'authenticated');

-- financial_entries_v2 policies
drop policy if exists "financial_entries_v2_select_authenticated" on public.financial_entries_v2;
create policy "financial_entries_v2_select_authenticated" on public.financial_entries_v2
for select using (auth.role() = 'authenticated');

drop policy if exists "financial_entries_v2_insert_authenticated" on public.financial_entries_v2;
create policy "financial_entries_v2_insert_authenticated" on public.financial_entries_v2
for insert with check (auth.role() = 'authenticated');

drop policy if exists "financial_entries_v2_update_authenticated" on public.financial_entries_v2;
create policy "financial_entries_v2_update_authenticated" on public.financial_entries_v2
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "financial_entries_v2_delete_authenticated" on public.financial_entries_v2;
create policy "financial_entries_v2_delete_authenticated" on public.financial_entries_v2
for delete using (auth.role() = 'authenticated');

-- documents_v2 policies
drop policy if exists "documents_v2_select_authenticated" on public.documents_v2;
create policy "documents_v2_select_authenticated" on public.documents_v2
for select using (auth.role() = 'authenticated');

drop policy if exists "documents_v2_insert_authenticated" on public.documents_v2;
create policy "documents_v2_insert_authenticated" on public.documents_v2
for insert with check (auth.role() = 'authenticated');

drop policy if exists "documents_v2_update_authenticated" on public.documents_v2;
create policy "documents_v2_update_authenticated" on public.documents_v2
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "documents_v2_delete_authenticated" on public.documents_v2;
create policy "documents_v2_delete_authenticated" on public.documents_v2
for delete using (auth.role() = 'authenticated');

-- document_items_v2 policies
drop policy if exists "document_items_v2_select_authenticated" on public.document_items_v2;
create policy "document_items_v2_select_authenticated" on public.document_items_v2
for select using (auth.role() = 'authenticated');

drop policy if exists "document_items_v2_insert_authenticated" on public.document_items_v2;
create policy "document_items_v2_insert_authenticated" on public.document_items_v2
for insert with check (auth.role() = 'authenticated');

drop policy if exists "document_items_v2_update_authenticated" on public.document_items_v2;
create policy "document_items_v2_update_authenticated" on public.document_items_v2
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "document_items_v2_delete_authenticated" on public.document_items_v2;
create policy "document_items_v2_delete_authenticated" on public.document_items_v2
for delete using (auth.role() = 'authenticated');

commit;
