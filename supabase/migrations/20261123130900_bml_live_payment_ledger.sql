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
  customer_terms_version text check (customer_terms_version is null or length(customer_terms_version) between 5 and 120),
  customer_terms_accepted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bml_live_intent_one_booking check (num_nonnulls(reservation_id,cart_booking_id) = 1),
  constraint bml_live_intent_confirmed_timestamp check (status <> 'confirmed' or confirmed_at is not null),
  constraint bml_live_intent_checkout_consent check (status = 'awaiting_payment' or (customer_terms_version is not null and customer_terms_accepted_at is not null))
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
-- Prevent multiple chargeable requests for the same booking, even when
-- separate admin browser tabs submit different idempotency keys.
create unique index bml_live_one_active_reservation
  on public.bml_live_payment_intents(reservation_id)
  where reservation_id is not null and status in ('awaiting_payment','initiated','confirmed');
create unique index bml_live_one_active_cart
  on public.bml_live_payment_intents(cart_booking_id)
  where cart_booking_id is not null and status in ('awaiting_payment','initiated','confirmed');
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
    or (old.customer_terms_version is not null and new.customer_terms_version is distinct from old.customer_terms_version)
    or (old.customer_terms_accepted_at is not null and new.customer_terms_accepted_at is distinct from old.customer_terms_accepted_at)
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


-- The API MUST authenticate and independently verify the bank transaction
-- (amount, USD currency, localId and provider ID) before invoking this RPC.
-- Inside PostgreSQL a single transaction commits both the verified event and
-- the payment status. Only service_role can execute.
create function public.bml_record_verified_payment(
  p_intent_id uuid, p_provider_transaction_id text,
  p_provider_state text, p_event_type text, p_signature_timestamp bigint
) returns table(payment_status text, booking_marked_paid boolean)
language plpgsql security invoker set search_path = ''
as $function$
declare
  v public.bml_live_payment_intents%rowtype;
  v_new_status text;
  v_booked boolean := false;
  v_updated_count bigint := 0;
begin
  if p_provider_state not in ('INITIATED','CONFIRMED','CANCELLED','FAILED','EXPIRED','VOIDED','AUTHORIZED','REFUND_REQUESTED','REFUNDED')
     or p_event_type <> 'NOTIFY_TRANSACTION_CHANGE'
     or p_provider_transaction_id is null or length(p_provider_transaction_id) not between 4 and 100
     or p_signature_timestamp is null or p_signature_timestamp <= 0
  then raise exception using errcode='23514',message='BML_VERIFIED_EVENT_INVALID'; end if;

  select * into v from public.bml_live_payment_intents where id = p_intent_id for update;
  if not found or v.customer_terms_accepted_at is null or v.customer_terms_version is null
  then raise exception using errcode='23514',message='BML_PAYMENT_LINKAGE_INVALID'; end if;

  -- A legitimate signed webhook may beat the HTTP create-transaction reply.
  -- The server already verified transaction currency, amount and local ID
  -- against BML before calling this function. Claim the provider ID exactly
  -- once under row lock; never attach a bank ID to an unstarted payment.
  if v.provider_transaction_id is null and v.status = 'initiated' then
    update public.bml_live_payment_intents
    set provider_transaction_id = p_provider_transaction_id where id = v.id;
  elsif v.provider_transaction_id is distinct from p_provider_transaction_id then
    raise exception using errcode='23514',message='BML_PAYMENT_LINKAGE_INVALID';
  end if;

  insert into public.bml_live_payment_events(intent_id,provider_transaction_id,provider_state,event_type,signature_timestamp)
  values(v.id,p_provider_transaction_id,p_provider_state,p_event_type,p_signature_timestamp)
  on conflict (provider_transaction_id, provider_state) do nothing;

  -- Confirm only after a server-verified bank CONFIRMED status. Never allow
  -- late INITIATED/FAILED webhooks to undo a previously confirmed payment.
  if p_provider_state = 'CONFIRMED' and v.status not in ('confirmed','refunded') then
    update public.bml_live_payment_intents
    set status = 'confirmed', confirmed_at = now() where id = v.id;
    if v.reservation_id is not null then
      update public.reservations r
      set payment_status = 'paid'
      where r.id = v.reservation_id and r.status = 'confirmed'
        and r.payment_status in ('unpaid','partial');
      get diagnostics v_updated_count = row_count;
      v_booked := v_updated_count > 0;
    end if;
  elsif p_provider_state = 'REFUNDED' and v.status = 'confirmed' then
    update public.bml_live_payment_intents set status = 'refunded' where id = v.id;
    -- Booking-side refund workflows require separate refund accounting.
  elsif p_provider_state in ('CANCELLED','FAILED','EXPIRED','VOIDED') and v.status in ('awaiting_payment','initiated') then
    v_new_status := case when p_provider_state = 'CANCELLED' then 'cancelled' else 'failed' end;
    update public.bml_live_payment_intents set status = v_new_status where id = v.id;
  end if;

  return query select i.status, v_booked from public.bml_live_payment_intents i where i.id = v.id;
end;
$function$;
revoke all on function public.bml_record_verified_payment(uuid,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.bml_record_verified_payment(uuid,text,text,text,bigint) to service_role;
