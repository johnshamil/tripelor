-- Draft: BML production payment ledger. DO NOT APPLY until reviewed and
-- coordinated with production booking workflows and credential rotation.
-- No live payment processing is enabled by this migration alone.
create table public.bml_live_payment_intents (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.reservations(id) on delete restrict,
  cart_booking_id uuid references public.cart_booking_requests(id) on delete restrict,
  booking_reference text not null check (length(booking_reference) between 3 and 120),
  customer_email text not null check (length(customer_email) between 3 and 255),
  currency text not null check (currency in ('USD')),
  approved_amount_minor bigint not null check (approved_amount_minor between 1 and 1000000000),
  approved_by uuid not null references auth.users(id) on delete restrict,
  approved_at timestamptz not null default now(),
  terms_version text not null check (length(terms_version) between 5 and 120),
  idempotency_key uuid not null unique,
  local_id text not null unique check (length(local_id) between 12 and 120),
  provider_transaction_id text unique check (provider_transaction_id is null or length(provider_transaction_id) between 4 and 120),
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment','initiated','confirmed','failed','cancelled','refunded')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bml_live_intent_one_booking check (num_nonnulls(reservation_id,cart_booking_id) = 1),
  constraint bml_live_intent_confirmed_timestamp check (status <> 'confirmed' or confirmed_at is not null)
);
comment on table public.bml_live_payment_intents is
  'Server-owned, administrator-approved final payment amounts. This is not a payment gateway or authorization for customer charging. No payment is confirmed by a browser redirect.';

-- Separate, minimal audit trail: never record PAN, CVV, raw notifications,
-- authorization header, BML secret, cardholder data or full signature.
create table public.bml_live_payment_events (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null references public.bml_live_payment_intents(id) on delete restrict,
  provider_transaction_id text not null check (length(provider_transaction_id) between 4 and 120),
  provider_state text not null
    check (provider_state in ('INITIATED','CONFIRMED','CANCELLED','FAILED','EXPIRED','VOIDED','AUTHORIZED','REFUND_REQUESTED','REFUNDED')),
  event_type text not null check (length(event_type) between 1 and 100),
  signature_timestamp bigint not null check (signature_timestamp > 0),
  received_at timestamptz not null default now(),
  verified_at timestamptz not null default now(),
  unique (provider_transaction_id, provider_state)
);
create index bml_live_intents_reservation_idx on public.bml_live_payment_intents(reservation_id) where reservation_id is not null;
create index bml_live_intents_cart_idx on public.bml_live_payment_intents(cart_booking_id) where cart_booking_id is not null;
create index bml_live_intents_status_idx on public.bml_live_payment_intents(status, created_at desc);
create index bml_live_events_intent_idx on public.bml_live_payment_events(intent_id, received_at desc);

-- Final price, owner, consent and booking linkage must never be changed on an
-- already-created payment intent, even by a service-role POST/PATCH mistake.
create function public.prevent_bml_live_intent_terms_update() returns trigger
language plpgsql security invoker set search_path = ''
as $function$
begin
  if new.reservation_id is distinct from old.reservation_id
    or new.cart_booking_id is distinct from old.cart_booking_id
    or new.booking_reference is distinct from old.booking_reference
    or new.customer_email is distinct from old.customer_email
    or new.currency is distinct from old.currency
    or new.approved_amount_minor is distinct from old.approved_amount_minor
    or new.approved_by is distinct from old.approved_by
    or new.approved_at is distinct from old.approved_at
    or new.terms_version is distinct from old.terms_version
    or new.idempotency_key is distinct from old.idempotency_key
    or new.local_id is distinct from old.local_id
    or new.id is distinct from old.id then
    raise exception using errcode='23514',message='BML_LIVE_IMMUTABLE_TERMS';
  end if;
  new.updated_at := now();
  return new;
end;
$function$;
create trigger protect_bml_live_intent_terms before update
on public.bml_live_payment_intents for each row
execute function public.prevent_bml_live_intent_terms_update();

-- Never allow browser/user roles to read or mutate payment or event records.
-- Authenticated account payment views must be implemented through narrow
-- server APIs with explicit ownership checks and redacted output.
alter table public.bml_live_payment_intents enable row level security;
alter table public.bml_live_payment_events enable row level security;
revoke all on public.bml_live_payment_intents from public,anon,authenticated;
revoke all on public.bml_live_payment_events from public,anon,authenticated;
grant select,insert,update on public.bml_live_payment_intents to service_role;
grant select,insert on public.bml_live_payment_events to service_role;
revoke all on function public.prevent_bml_live_intent_terms_update() from public,anon,authenticated;
