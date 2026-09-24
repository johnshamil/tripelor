create table if not exists public.matchmaker_leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  email text not null default '' check (char_length(email) <= 250),
  whatsapp text not null default '' check (char_length(whatsapp) <= 60),
  adults integer not null check (adults between 1 and 20),
  children integer not null default 0 check (children between 0 and 20),
  arrival date,
  nights integer not null check (nights between 1 and 60),
  budget_usd numeric not null default 0 check (budget_usd >= 0 and budget_usd <= 1000000),
  travel_style text not null check (travel_style in ('romance','family','ocean','adventure','relax')),
  destination text not null check (destination in ('flexible','vaavu','ukulhas','maafushi','airport')),
  meal_preference text not null check (meal_preference in ('flexible','Bed & Breakfast','Half Board','Full Board')),
  recommended_property text not null default '' check (char_length(recommended_property) <= 180),
  recommended_room text not null default '' check (char_length(recommended_room) <= 180),
  estimated_stay_total numeric not null default 0 check (estimated_stay_total >= 0 and estimated_stay_total <= 1000000),
  marketing_consent boolean not null default false,
  status text not null default 'new' check (status in ('new','contacted','quoted','booked','closed')),
  source text not null default 'website-matchmaker',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email <> '' or whatsapp <> '')
);

create index if not exists matchmaker_leads_status_created_idx
  on public.matchmaker_leads(status, created_at desc);

alter table public.matchmaker_leads enable row level security;
revoke all on public.matchmaker_leads from public, anon, authenticated;
grant select, insert, update, delete on public.matchmaker_leads to service_role;

comment on table public.matchmaker_leads is
  'Tripelor Maldives Matchmaker enquiries. Contact data is collected only after the visitor requests their personalised match; marketing consent is stored separately.';
