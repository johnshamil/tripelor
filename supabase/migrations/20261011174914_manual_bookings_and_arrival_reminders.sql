-- Manual bookings use the existing inventory locks and availability rules.
alter table public.reservations
  add column currency text not null default 'USD' check (currency in ('USD','MVR')),
  add column nightly_rate numeric check (nightly_rate >= 0),
  add column manual_booking_id uuid,
  add column manual_booking_by uuid references auth.users(id) on delete set null;
create unique index reservations_manual_room_unique on public.reservations(manual_booking_id,room_type)
  where manual_booking_id is not null;
create index reservations_arrival_due_idx on public.reservations(check_in)
  where status in ('pending','confirmed');
create index reservations_manual_creator_idx on public.reservations(manual_booking_by)
  where manual_booking_by is not null;

create function public.create_manual_booking(p_request_id uuid,p_admin_id uuid,p_booking jsonb)
returns setof public.reservations language plpgsql security invoker set search_path='' as $function$
declare
  v_room jsonb;
  v_id uuid;
  v_reference text;
  v_in date;
  v_out date;
  v_quantity integer;
  v_rate numeric;
begin
  if p_request_id is null or p_admin_id is null or jsonb_typeof(p_booking) <> 'object'
    or not coalesce(p_booking->>'currency' in ('USD','MVR'),false)
    or not coalesce(p_booking->>'paymentStatus' in ('unpaid','partial','paid'),false)
    or length(coalesce(p_booking->>'propertyName','')) not between 1 and 150
    or length(coalesce(p_booking->>'guestName','')) not between 1 and 200
    or length(coalesce(p_booking->>'guestEmail','')) > 250
    or length(coalesce(p_booking->>'guestPhone','')) > 80
    or length(coalesce(p_booking->>'bookingSource','')) not between 1 and 80
    or length(coalesce(p_booking->>'notes','')) > 4000
    or length(coalesce(p_booking->>'externalReference','')) > 150
    or length(coalesce(p_booking->>'mealPlan','')) > 100
    or jsonb_typeof(p_booking->'rooms') is distinct from 'array' then
    raise exception 'MANUAL_INVALID_DETAILS';
  end if;
  v_in := (p_booking->>'checkIn')::date;
  v_out := (p_booking->>'checkOut')::date;
  if v_in is null or v_out is null or v_out <= v_in or v_out > v_in + 365
    or not coalesce((p_booking->>'adults')::integer between 1 and 200,false)
    or not coalesce((p_booking->>'children')::integer between 0 and 200,false)
    or jsonb_array_length(p_booking->'rooms') not between 1 and 20 then
    raise exception 'MANUAL_INVALID_DETAILS';
  end if;
  if (select count(distinct lower(r->>'roomType')) from jsonb_array_elements(p_booking->'rooms') r)
    <> jsonb_array_length(p_booking->'rooms') then raise exception 'MANUAL_DUPLICATE_ROOM_TYPE'; end if;
  if (select sum((r->>'quantity')::integer) from jsonb_array_elements(p_booking->'rooms') r) > 100 then
    raise exception 'MANUAL_TOO_MANY_ROOMS';
  end if;

  -- Retrying a timed-out save returns the same booking, without taking more rooms.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,20261011));
  if exists(select 1 from public.reservations r where r.manual_booking_id=p_request_id) then
    if exists(select 1 from public.reservations r where r.manual_booking_id=p_request_id
      and r.manual_booking_by is distinct from p_admin_id) then raise exception 'MANUAL_REQUEST_ALREADY_USED'; end if;
    return query select r.* from public.reservations r where r.manual_booking_id=p_request_id order by r.room_type;
    return;
  end if;
  v_reference := 'MAN-' || to_char(now() at time zone 'Indian/Maldives','YYMMDD') || '-' || upper(substr(p_request_id::text,1,8));

  -- Stable lock order prevents two multi-type bookings from deadlocking.
  for v_room in select r from jsonb_array_elements(p_booking->'rooms') r order by r->>'roomType' loop
    v_quantity := (v_room->>'quantity')::integer;
    v_rate := round((v_room->>'nightlyRate')::numeric,2);
    if not coalesce(v_quantity between 1 and 100,false) or v_rate is null or v_rate < 0 or v_rate > 1000000
      or v_rate::text in ('NaN','Infinity','-Infinity')
      or length(coalesce(v_room->>'roomType','')) not between 1 and 150 then raise exception 'MANUAL_INVALID_ROOM'; end if;
    v_id := public.reserve_rooms(p_booking->>'propertyName',v_room->>'roomType',v_in,v_out,v_quantity,
      p_booking->>'guestName',coalesce(p_booking->>'guestEmail',''),nullif(p_booking->>'guestPhone',''));
    update public.reservations set
      status='confirmed', booking_reference=v_reference, booking_source=p_booking->>'bookingSource',
      currency=p_booking->>'currency', nightly_rate=v_rate, estimated_total=v_rate*v_quantity*(v_out-v_in),
      manual_booking_id=p_request_id, manual_booking_by=p_admin_id, payment_status=p_booking->>'paymentStatus',
      external_reference=nullif(p_booking->>'externalReference',''), notes=nullif(p_booking->>'notes',''),
      meal_plan=nullif(p_booking->>'mealPlan',''), adults=(p_booking->>'adults')::integer,
      children=(p_booking->>'children')::integer where id=v_id;
  end loop;
  return query select r.* from public.reservations r where r.manual_booking_id=p_request_id order by r.room_type;
end;
$function$;
revoke all on function public.create_manual_booking(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.create_manual_booking(uuid,uuid,jsonb) to service_role;

-- One reminder per booking group and arrival date, including multiple room types.
create table public.admin_booking_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_key uuid not null,
  reservation_id uuid references public.reservations(id) on delete set null,
  check_in date not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  email_sent_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  claim_token uuid,
  claim_until timestamptz,
  last_error text,
  unique(booking_key,check_in)
);
create index admin_booking_notifications_arrival_idx on public.admin_booking_notifications(check_in);
create index admin_booking_notifications_reservation_idx on public.admin_booking_notifications(reservation_id);
create index admin_booking_notifications_due_idx on public.admin_booking_notifications(next_attempt_at)
  where email_sent_at is null;
alter table public.admin_booking_notifications enable row level security;
revoke all on public.admin_booking_notifications from public,anon,authenticated;
grant select,insert,update on public.admin_booking_notifications to service_role;

create function public.refresh_admin_booking_notifications() returns void
language sql security invoker set search_path='' as $function$
  insert into public.admin_booking_notifications(booking_key,reservation_id,check_in)
    select distinct on (coalesce(r.manual_booking_id,r.id),r.check_in)
      coalesce(r.manual_booking_id,r.id),r.id,r.check_in
    from public.reservations r
    where r.status in ('pending','confirmed')
      and r.check_in between (now() at time zone 'Indian/Maldives')::date
        and (now() at time zone 'Indian/Maldives')::date + 2
    order by coalesce(r.manual_booking_id,r.id),r.check_in,r.id
    on conflict(booking_key,check_in) do nothing;
$function$;
revoke all on function public.refresh_admin_booking_notifications() from public,anon,authenticated;
grant execute on function public.refresh_admin_booking_notifications() to service_role;

create function private.enqueue_booking_arrival_reminder() returns trigger
language plpgsql security invoker set search_path='' as $function$
begin
  -- The intermediate row inserted by reserve_rooms must not create a second reminder.
  if tg_op='UPDATE' or new.booking_reference is not null then
    perform public.refresh_admin_booking_notifications();
  end if;
  return new;
end;
$function$;
revoke all on function private.enqueue_booking_arrival_reminder() from public,anon,authenticated;
grant execute on function private.enqueue_booking_arrival_reminder() to service_role;
create trigger reservations_arrival_reminder after insert or update of check_in,status,booking_reference,manual_booking_id
  on public.reservations for each row execute function private.enqueue_booking_arrival_reminder();

create table private.booking_reminder_worker_config (
  singleton boolean primary key default true check(singleton), token_hash text not null
);
alter table private.booking_reminder_worker_config enable row level security;
revoke all on private.booking_reminder_worker_config from public,anon,authenticated;
grant select on private.booking_reminder_worker_config to service_role;
do $setup$
declare v_token text;
begin
  v_token := encode(extensions.gen_random_bytes(32),'hex');
  perform vault.create_secret(v_token,'tripelor_booking_reminder_worker','Admin arrival reminders scheduler only');
  insert into private.booking_reminder_worker_config(singleton,token_hash)
    values(true,encode(extensions.digest(v_token,'sha256'),'hex'));
end;
$setup$;

create function public.claim_booking_reminders(p_worker_token text,p_limit integer default 20)
returns setof public.admin_booking_notifications language plpgsql security invoker set search_path='' as $function$
begin
  if p_worker_token is null or length(p_worker_token) <> 64 or not exists (
    select 1 from private.booking_reminder_worker_config
    where token_hash=encode(extensions.digest(p_worker_token,'sha256'),'hex')
  ) then raise exception using errcode='42501',message='WORKER_UNAUTHORIZED'; end if;
  perform public.refresh_admin_booking_notifications();
  return query with due as (
    select n.id from public.admin_booking_notifications n
    where n.email_sent_at is null and n.next_attempt_at <= now()
      and (n.claim_until is null or n.claim_until < now())
      and n.check_in between (now() at time zone 'Indian/Maldives')::date and (now() at time zone 'Indian/Maldives')::date+2
      and exists(select 1 from public.reservations r where coalesce(r.manual_booking_id,r.id)=n.booking_key
        and r.check_in=n.check_in and r.status in ('pending','confirmed'))
    order by n.next_attempt_at,n.id limit least(greatest(p_limit,1),20) for update skip locked
  ) update public.admin_booking_notifications n set claim_token=gen_random_uuid(),claim_until=now()+interval '2 minutes'
      from due where n.id=due.id returning n.*;
end;
$function$;
revoke all on function public.claim_booking_reminders(text,integer) from public,anon,authenticated;
grant execute on function public.claim_booking_reminders(text,integer) to service_role;

create function private.queue_booking_reminder_check() returns bigint
language sql security invoker set search_path='' as $function$
  select net.http_post(url:='https://www.tripelor.com/api/internal/booking-reminders',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name='tripelor_booking_reminder_worker')),
    body:='{}'::jsonb,timeout_milliseconds:=55000);
$function$;
revoke all on function private.queue_booking_reminder_check() from public,anon,authenticated,service_role;

-- Enable delivery only after the corresponding web worker is deployed.
select cron.schedule('tripelor-booking-reminders','*/5 * * * *',
  'select public.refresh_admin_booking_notifications(); select private.queue_booking_reminder_check();');
select cron.alter_job((select jobid from cron.job where jobname='tripelor-booking-reminders'),active:=false);
comment on table public.admin_booking_notifications is 'Admin-only arrival reminders, due two days before check-in in Maldives time. Grouped room types share one notification.';
