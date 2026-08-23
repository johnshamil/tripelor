-- Tripelor Loyalty Club
-- Run this ONCE in Supabase SQL Editor after the existing schema.sql.
-- Rule: 100 points per completed paid room-night. 1,000 points = 1 free night.

create extension if not exists pgcrypto;

-- Allow a reservation to be marked completed after the guest has stayed.
alter table public.reservations drop constraint if exists reservations_status_check;
alter table public.reservations
  add constraint reservations_status_check
  check (status in ('pending','confirmed','completed','cancelled'));

create table if not exists public.loyalty_accounts (
  guest_email text primary key,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_points integer not null default 0 check (lifetime_points >= 0),
  free_nights_earned integer not null default 0 check (free_nights_earned >= 0),
  free_nights_redeemed integer not null default 0 check (free_nights_redeemed >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  guest_email text not null,
  reservation_id uuid references public.reservations(id) on delete set null,
  transaction_type text not null check (transaction_type in ('earn','redeem','adjustment')),
  points integer not null,
  description text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists loyalty_once_per_reservation_idx
  on public.loyalty_transactions(reservation_id, transaction_type)
  where reservation_id is not null and transaction_type = 'earn';

create index if not exists loyalty_transactions_email_idx
  on public.loyalty_transactions(guest_email, created_at desc);

-- Awards points only once, and only when admin marks the stay completed.
create or replace function public.complete_reservation_award_points(p_reservation_id uuid)
returns table(points_awarded integer, points_balance integer, free_nights_available integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res public.reservations%rowtype;
  v_nights integer;
  v_points integer;
  v_balance integer;
  v_free_earned integer;
  v_free_redeemed integer;
begin
  select * into v_res
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'RESERVATION_NOT_FOUND';
  end if;

  if v_res.status = 'cancelled' then
    raise exception 'CANCELLED_RESERVATION';
  end if;

  if exists (
    select 1 from public.loyalty_transactions
    where reservation_id = p_reservation_id and transaction_type = 'earn'
  ) then
    update public.reservations set status = 'completed' where id = p_reservation_id;
    select la.points_balance, la.free_nights_earned, la.free_nights_redeemed
      into v_balance, v_free_earned, v_free_redeemed
    from public.loyalty_accounts la where la.guest_email = lower(v_res.guest_email);
    return query select 0, coalesce(v_balance,0), greatest(coalesce(v_free_earned,0)-coalesce(v_free_redeemed,0),0);
    return;
  end if;

  v_nights := greatest((v_res.check_out - v_res.check_in) * v_res.rooms, 0);
  v_points := v_nights * 100;

  insert into public.loyalty_accounts(guest_email, points_balance, lifetime_points, updated_at)
  values(lower(v_res.guest_email), v_points, v_points, now())
  on conflict (guest_email) do update set
    points_balance = public.loyalty_accounts.points_balance + excluded.points_balance,
    lifetime_points = public.loyalty_accounts.lifetime_points + excluded.lifetime_points,
    updated_at = now();

  insert into public.loyalty_transactions(guest_email, reservation_id, transaction_type, points, description)
  values(lower(v_res.guest_email), v_res.id, 'earn', v_points,
         format('%s points for %s completed room-night(s)', v_points, v_nights));

  -- Every full 1,000 lifetime/usable points creates a free-night entitlement.
  update public.loyalty_accounts
  set free_nights_earned = floor(points_balance / 1000.0)::integer,
      updated_at = now()
  where guest_email = lower(v_res.guest_email);

  update public.reservations set status = 'completed' where id = p_reservation_id;

  select la.points_balance, la.free_nights_earned, la.free_nights_redeemed
    into v_balance, v_free_earned, v_free_redeemed
  from public.loyalty_accounts la where la.guest_email = lower(v_res.guest_email);

  return query select v_points, v_balance, greatest(v_free_earned-v_free_redeemed,0);
end;
$$;

-- Redeem one free night (admin-controlled). Deducts 1,000 usable points.
create or replace function public.redeem_free_night(p_guest_email text)
returns table(points_balance integer, free_nights_available integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_guest_email));
  v_account public.loyalty_accounts%rowtype;
begin
  select * into v_account from public.loyalty_accounts where guest_email = v_email for update;
  if not found or v_account.points_balance < 1000 then
    raise exception 'NOT_ENOUGH_POINTS';
  end if;

  update public.loyalty_accounts
  set points_balance = points_balance - 1000,
      free_nights_redeemed = free_nights_redeemed + 1,
      free_nights_earned = floor((points_balance - 1000) / 1000.0)::integer + free_nights_redeemed + 1,
      updated_at = now()
  where guest_email = v_email;

  insert into public.loyalty_transactions(guest_email, transaction_type, points, description)
  values(v_email, 'redeem', -1000, 'Redeemed 1 Tripelor free night');

  select * into v_account from public.loyalty_accounts where guest_email = v_email;
  return query select v_account.points_balance, floor(v_account.points_balance / 1000.0)::integer;
end;
$$;

alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;
