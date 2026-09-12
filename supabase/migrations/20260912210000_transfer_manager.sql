create table if not exists public.transfer_requests (
  id uuid primary key default gen_random_uuid(),
  request_reference text not null unique,
  route text not null default 'Male to Felidhoo',
  operator text not null default 'Dream Speed',
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  flight_number text not null default '',
  arrival_date date not null,
  arrival_time time without time zone not null,
  requested_departure time without time zone,
  seats smallint not null check (seats between 1 and 100),
  price_per_person numeric not null default 50 check (price_per_person >= 0),
  total numeric not null default 0 check (total >= 0),
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'completed', 'cancelled')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmation_sent_at timestamptz
);

create index if not exists transfer_requests_status_arrival_idx
  on public.transfer_requests (status, arrival_date, arrival_time);
create index if not exists transfer_requests_created_idx
  on public.transfer_requests (created_at desc);

alter table public.speedboat_schedule add column if not exists capacity smallint not null default 20;
alter table public.speedboat_schedule add column if not exists price_per_person numeric not null default 50;
alter table public.speedboat_schedule add column if not exists notes text not null default '';
alter table public.speedboat_schedule add constraint speedboat_schedule_capacity_check check (capacity between 1 and 100);
alter table public.speedboat_schedule add constraint speedboat_schedule_price_check check (price_per_person >= 0);

alter table public.transfer_requests enable row level security;
revoke all on table public.transfer_requests from anon, authenticated;
grant select, insert, update, delete on table public.transfer_requests to service_role;
grant select on table public.speedboat_schedule to anon, authenticated;
grant select, insert, update, delete on table public.speedboat_schedule to service_role;
