-- Tripelor partner enquiry and wholesale quote workflow.
-- Guest identity remains server-side. Partners see requirements only through unique links.
create table if not exists public.partner_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 150),
  island text not null default '' check (char_length(island) <= 120),
  email text not null check (char_length(email) between 5 and 250),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists partner_contacts_email_unique on public.partner_contacts (lower(email));

create table if not exists public.partner_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  guest_name text not null check (char_length(guest_name) between 1 and 120),
  guest_email text not null default '' check (char_length(guest_email) <= 250),
  guest_phone text not null default '' check (char_length(guest_phone) <= 60),
  start_date date not null,
  end_date date not null,
  nights_min integer not null check (nights_min between 1 and 60),
  nights_max integer not null check (nights_max between 1 and 60),
  adults integer not null default 2 check (adults between 1 and 20),
  children integer not null default 0 check (children between 0 and 20),
  budget_usd numeric(12,2) not null default 0 check (budget_usd between 0 and 1000000),
  meal_plan text not null default 'Full Board' check (char_length(meal_plan) <= 100),
  requirements text not null check (char_length(requirements) between 5 and 4000),
  status text not null default 'new' check (status in ('new','sent','quoted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (nights_max >= nights_min)
);

create table if not exists public.partner_enquiry_requests (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.partner_enquiries(id) on delete cascade,
  partner_id uuid not null references public.partner_contacts(id) on delete restrict,
  secure_token uuid not null default gen_random_uuid() unique,
  expires_at timestamptz not null default (now() + interval '14 days'),
  status text not null default 'pending' check (status in ('pending','quoted','declined','cancelled')),
  email_status text not null default 'not_sent' check (email_status in ('not_sent','sent','failed')),
  last_sent_at timestamptz,
  currency text not null default 'USD' check (currency in ('USD','MVR')),
  wholesale_total numeric(12,2) check (wholesale_total between 0 and 10000000),
  availability text not null default '' check (char_length(availability) <= 600),
  inclusions text not null default '' check (char_length(inclusions) <= 3000),
  exclusions text not null default '' check (char_length(exclusions) <= 2000),
  terms text not null default '' check (char_length(terms) <= 2000),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(enquiry_id, partner_id)
);
create index if not exists partner_requests_enquiry_idx on public.partner_enquiry_requests(enquiry_id, created_at desc);
create index if not exists partner_requests_partner_idx on public.partner_enquiry_requests(partner_id);

alter table public.partner_contacts enable row level security;
alter table public.partner_enquiries enable row level security;
alter table public.partner_enquiry_requests enable row level security;

revoke all on public.partner_contacts, public.partner_enquiries, public.partner_enquiry_requests from public, anon, authenticated;
grant select, insert, update, delete on public.partner_contacts, public.partner_enquiries, public.partner_enquiry_requests to service_role;

comment on table public.partner_enquiries is 'Admin-only Tripelor holiday enquiries including guest contact data; never reveal guest identity to guesthouse partners.';
comment on table public.partner_enquiry_requests is 'Token-scoped partner wholesale quotations. Accessed through server routes only; no direct anon/authenticated grants.';