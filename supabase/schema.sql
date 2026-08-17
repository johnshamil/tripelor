-- Tripelor room availability database
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.property_inventory (
  id uuid primary key default gen_random_uuid(),
  property_name text not null,
  room_type text not null default 'Deluxe Room',
  total_rooms integer not null check (total_rooms > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(property_name, room_type)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  property_name text not null,
  room_type text not null default 'Deluxe Room',
  check_in date not null,
  check_out date not null,
  rooms integer not null check (rooms > 0),
  guest_name text not null,
  guest_email text not null,
  guest_phone text,
  booking_source text not null default 'website',
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);

create index if not exists reservations_lookup_idx
  on public.reservations(property_name, room_type, check_in, check_out, status);

-- Set the correct number of sellable rooms for each property here.
-- These can be changed later from the Supabase table editor.
insert into public.property_inventory(property_name, room_type, total_rooms)
values
  ('Uhoo''s Lavish Oasis', 'Deluxe Room', 2),
  ('Masfalhi View Inn', 'Deluxe Room', 1)
on conflict (property_name, room_type) do nothing;

create or replace function public.check_room_availability(
  p_property_name text,
  p_room_type text,
  p_check_in date,
  p_check_out date,
  p_rooms integer
)
returns table(available boolean, rooms_left integer, total_rooms integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_reserved integer;
begin
  if p_check_out <= p_check_in then
    raise exception 'Check-out must be after check-in';
  end if;

  select i.total_rooms into v_total
  from public.property_inventory i
  where i.property_name = p_property_name
    and i.room_type = p_room_type
    and i.active = true;

  if v_total is null then
    return query select false, 0, 0;
    return;
  end if;

  select coalesce(sum(r.rooms), 0)::integer into v_reserved
  from public.reservations r
  where r.property_name = p_property_name
    and r.room_type = p_room_type
    and r.status in ('pending','confirmed')
    and r.check_in < p_check_out
    and r.check_out > p_check_in;

  return query
  select (v_reserved + p_rooms <= v_total), greatest(v_total - v_reserved, 0), v_total;
end;
$$;

create or replace function public.reserve_rooms(
  p_property_name text,
  p_room_type text,
  p_check_in date,
  p_check_out date,
  p_rooms integer,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_reserved integer;
  v_id uuid;
begin
  if p_check_out <= p_check_in then
    raise exception 'Check-out must be after check-in';
  end if;

  -- Serialize reservations for this property/room inventory row to prevent race-condition double booking.
  select i.total_rooms into v_total
  from public.property_inventory i
  where i.property_name = p_property_name
    and i.room_type = p_room_type
    and i.active = true
  for update;

  if v_total is null then
    raise exception 'Room inventory is not configured';
  end if;

  select coalesce(sum(r.rooms), 0)::integer into v_reserved
  from public.reservations r
  where r.property_name = p_property_name
    and r.room_type = p_room_type
    and r.status in ('pending','confirmed')
    and r.check_in < p_check_out
    and r.check_out > p_check_in;

  if v_reserved + p_rooms > v_total then
    raise exception 'ROOM_NOT_AVAILABLE';
  end if;

  insert into public.reservations(
    property_name, room_type, check_in, check_out, rooms,
    guest_name, guest_email, guest_phone, status
  ) values (
    p_property_name, p_room_type, p_check_in, p_check_out, p_rooms,
    p_guest_name, p_guest_email, p_guest_phone, 'pending'
  ) returning id into v_id;

  return v_id;
end;
$$;

-- Keep direct public access closed. Website server uses the Supabase service-role key.
alter table public.property_inventory enable row level security;
alter table public.reservations enable row level security;
