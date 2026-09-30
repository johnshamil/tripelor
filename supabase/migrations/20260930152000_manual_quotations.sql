create table if not exists public.manual_quotations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  share_token uuid not null default gen_random_uuid() unique,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_email text not null default '' check (char_length(customer_email) <= 250),
  customer_phone text not null default '' check (char_length(customer_phone) <= 60),
  property_name text not null default '' check (char_length(property_name) <= 180),
  room_name text not null default '' check (char_length(room_name) <= 180),
  meal_plan text not null default '' check (char_length(meal_plan) <= 100),
  check_in date,
  check_out date,
  adults integer not null default 2 check (adults between 1 and 20),
  children integer not null default 0 check (children between 0 and 20),
  rooms integer not null default 1 check (rooms between 1 and 20),
  currency text not null default 'USD' check (currency = 'USD'),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0 and subtotal <= 10000000),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0 and discount_amount <= 10000000),
  fees_amount numeric(12,2) not null default 0 check (fees_amount >= 0 and fees_amount <= 10000000),
  total numeric(12,2) not null default 0 check (total >= 0 and total <= 10000000),
  notes text not null default '' check (char_length(notes) <= 3000),
  terms text not null default '' check (char_length(terms) <= 5000),
  status text not null default 'draft' check (status in ('draft','sent','accepted','cancelled')),
  valid_until timestamptz not null,
  created_by text not null default '' check (char_length(created_by) <= 250),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out is null or check_in is null or check_out > check_in),
  check (jsonb_typeof(items) = 'array')
);

create index if not exists manual_quotations_status_created_idx
  on public.manual_quotations(status, created_at desc);

create index if not exists manual_quotations_valid_until_idx
  on public.manual_quotations(valid_until);

alter table public.manual_quotations enable row level security;
revoke all on public.manual_quotations from public, anon, authenticated;
grant select, insert, update, delete on public.manual_quotations to service_role;

comment on table public.manual_quotations is
  'Admin-created Tripelor quotations. Public access is only through a random share token served by Tripelor server routes; direct client access is disabled.';
