create table if not exists public.secret_deal_leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  email text not null default '' check (char_length(email) <= 250),
  whatsapp text not null default '' check (char_length(whatsapp) <= 60),
  country text not null default '' check (char_length(country) <= 100),
  travel_month text not null default '' check (travel_month = '' or travel_month ~ '^[0-9]{4}-[0-9]{2}$'),
  adults integer not null check (adults between 1 and 20),
  children integer not null default 0 check (children between 0 and 20),
  nights integer not null check (nights between 1 and 30),
  budget_usd numeric not null default 0 check (budget_usd >= 0 and budget_usd <= 1000000),
  deal_type text not null check (deal_type in ('honeymoon','budget','family','ocean','luxury','last-minute')),
  destination text not null check (destination in ('flexible','vaavu','ukulhas','maafushi','airport')),
  revealed_property text not null default '' check (char_length(revealed_property) <= 180),
  revealed_room text not null default '' check (char_length(revealed_room) <= 180),
  estimated_total numeric not null default 0 check (estimated_total >= 0 and estimated_total <= 1000000),
  marketing_consent boolean not null default false,
  status text not null default 'new' check (status in ('new','contacted','quoted','booked','closed')),
  source text not null default 'website-secret-deals',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email <> '' or whatsapp <> '')
);

create index if not exists secret_deal_leads_status_created_idx
  on public.secret_deal_leads(status, created_at desc);

alter table public.secret_deal_leads enable row level security;
revoke all on public.secret_deal_leads from public, anon, authenticated;
grant select, insert, update, delete on public.secret_deal_leads to service_role;

comment on table public.secret_deal_leads is
  'Lead captures from the Tripelor Secret Deals funnel. Results are estimates based on published Tripelor selling rates; final availability and selling price require confirmation.';
