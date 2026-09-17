-- Combined package/excursion requests are pending quotations, not room holds or payments.
create table public.cart_booking_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null,
  request_hash text not null check (length(request_hash) = 64),
  booking_reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 50),
  estimated_total numeric(12,2) not null check (estimated_total > 0),
  guest_name text not null check (length(guest_name) between 1 and 120),
  guest_email text not null,
  guest_phone text not null check (length(guest_phone) between 6 and 40),
  notes text not null default '' check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  notification_sent_at timestamptz,
  unique (user_id, submission_id)
);
create index cart_booking_requests_user_created_idx on public.cart_booking_requests(user_id, created_at desc, id desc);
create index cart_booking_requests_created_idx on public.cart_booking_requests(created_at desc, id desc);
alter table public.cart_booking_requests enable row level security;
revoke all on public.cart_booking_requests from public, anon, authenticated;
grant select on public.cart_booking_requests to authenticated;
grant select, insert, update on public.cart_booking_requests to service_role;
create policy "Customers can read their own cart booking requests"
  on public.cart_booking_requests for select to authenticated
  using ((select auth.uid()) = user_id);
comment on table public.cart_booking_requests is 'Server-priced combined booking requests. Customers can read their own requests; writes require the authenticated server checkout. No payment or inventory hold is implied.';
