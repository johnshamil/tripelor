create table if not exists public.flight_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_email text not null check (char_length(customer_email) between 3 and 250),
  customer_phone text not null default '' check (char_length(customer_phone) <= 60),
  trip_type text not null check (trip_type in ('one-way','round-trip')),
  origin text not null check (char_length(origin) between 2 and 120),
  destination text not null default 'MLE' check (char_length(destination) between 2 and 120),
  departure_date date not null,
  return_date date,
  adults integer not null default 1 check (adults between 1 and 20),
  children integer not null default 0 check (children between 0 and 20),
  infants integer not null default 0 check (infants between 0 and 10),
  cabin text not null default 'Economy' check (cabin in ('Economy','Premium Economy','Business','First')),
  flexible_dates boolean not null default false,
  notes text not null default '' check (char_length(notes) <= 2000),
  status text not null default 'new' check (status in ('new','quoted','payment_pending','paid','ticketed','travelled','cancelled')),
  supplier text not null default '' check (char_length(supplier) <= 160),
  airline text not null default '' check (char_length(airline) <= 160),
  outbound_flight text not null default '' check (char_length(outbound_flight) <= 40),
  return_flight text not null default '' check (char_length(return_flight) <= 40),
  baggage text not null default '' check (char_length(baggage) <= 500),
  fare_rules text not null default '' check (char_length(fare_rules) <= 3000),
  base_fare numeric not null default 0 check (base_fare >= 0 and base_fare <= 1000000),
  taxes numeric not null default 0 check (taxes >= 0 and taxes <= 1000000),
  service_fee numeric not null default 0 check (service_fee >= 0 and service_fee <= 1000000),
  selling_price numeric not null default 0 check (selling_price >= 0 and selling_price <= 1000000),
  quote_expires_at timestamptz,
  pnr text not null default '' check (char_length(pnr) <= 40),
  e_ticket_numbers text not null default '' check (char_length(e_ticket_numbers) <= 1000),
  admin_notes text not null default '' check (char_length(admin_notes) <= 3000),
  marketing_consent boolean not null default false,
  source text not null default 'tripelor-flight-desk',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (trip_type = 'one-way' and return_date is null)
    or
    (trip_type = 'round-trip' and return_date is not null and return_date >= departure_date)
  )
);

create index if not exists flight_requests_status_created_idx
  on public.flight_requests(status, created_at desc);

create index if not exists flight_requests_user_created_idx
  on public.flight_requests(user_id, created_at desc);

create index if not exists flight_requests_email_created_idx
  on public.flight_requests(lower(customer_email), created_at desc);

alter table public.flight_requests enable row level security;
revoke all on public.flight_requests from public, anon, authenticated;
grant select, insert, update, delete on public.flight_requests to service_role;

comment on table public.flight_requests is
  'Manual Tripelor airline ticket request, quote and ticketing workflow. No flight availability or fare is guaranteed until an authorized supplier confirms and Tripelor records the quote.';
