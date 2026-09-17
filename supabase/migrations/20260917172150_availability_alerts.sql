create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table public.availability_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_name text not null check (length(property_name) between 1 and 150),
  room_type text not null check (length(room_type) between 1 and 150),
  check_in date not null,
  check_out date not null check (check_out > check_in and check_out <= check_in + 90),
  rooms integer not null default 1 check (rooms between 1 and 10),
  status text not null default 'active' check (status in ('active','notified','cancelled','expired')),
  created_at timestamptz not null default now(),
  next_check_at timestamptz not null default now(),
  last_checked_at timestamptz,
  notified_at timestamptz,
  claim_token uuid,
  claim_until timestamptz,
  last_error text
);
create index availability_alerts_owner_idx on public.availability_alerts(user_id, created_at desc);
create index availability_alerts_due_idx on public.availability_alerts(next_check_at) where status='active';
create unique index availability_alerts_active_unique on public.availability_alerts
  (user_id, property_name, room_type, check_in, check_out, rooms) where status='active';
alter table public.availability_alerts enable row level security;
revoke all on public.availability_alerts from public, anon, authenticated;
grant select on public.availability_alerts to authenticated;
grant select, insert, update, delete on public.availability_alerts to service_role;
create policy "Customers read their own alerts" on public.availability_alerts for select to authenticated
  using ((select auth.uid()) = user_id);

create table private.availability_alert_worker_config (
  singleton boolean primary key default true check (singleton),
  token_hash text not null
);
alter table private.availability_alert_worker_config enable row level security;
revoke all on private.availability_alert_worker_config from public, anon, authenticated;
grant select on private.availability_alert_worker_config to service_role;

-- Generate the scheduling credential inside the database; never export it.
do $setup$
declare v_token text;
begin
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  perform vault.create_secret(v_token, 'tripelor_availability_alert_worker', 'Availability alert scheduler only');
  insert into private.availability_alert_worker_config(singleton,token_hash)
    values(true,encode(extensions.digest(v_token,'sha256'),'hex'));
end;
$setup$;

create function public.create_availability_alert(
  p_user_id uuid, p_property_name text, p_room_type text,
  p_check_in date, p_check_out date, p_rooms integer
) returns setof public.availability_alerts
language plpgsql security invoker set search_path='' as $function$
declare v_existing public.availability_alerts;
begin
  if p_user_id is null or p_check_in < (now() at time zone 'Indian/Maldives')::date
    or p_check_in > (now() at time zone 'Indian/Maldives')::date + 730
    or p_check_out <= p_check_in or p_check_out > p_check_in + 90
    or p_rooms not between 1 and 10 then
    raise exception 'INVALID_ALERT_DATES';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 37));
  update public.availability_alerts set status='expired',claim_token=null,claim_until=null
    where user_id=p_user_id and status='active' and check_in < (now() at time zone 'Indian/Maldives')::date;
  select * into v_existing from public.availability_alerts
    where user_id=p_user_id and property_name=p_property_name and room_type=p_room_type
    and check_in=p_check_in and check_out=p_check_out and rooms=p_rooms and status='active';
  if found then return next v_existing; return; end if;
  if (select count(*) from public.availability_alerts where user_id=p_user_id and status='active') >= 10 then
    raise exception 'ALERT_LIMIT_REACHED';
  end if;
  return query insert into public.availability_alerts(user_id,property_name,room_type,check_in,check_out,rooms)
    values(p_user_id,p_property_name,p_room_type,p_check_in,p_check_out,p_rooms) returning *;
end;
$function$;
revoke all on function public.create_availability_alert(uuid,text,text,date,date,integer) from public,anon,authenticated;
grant execute on function public.create_availability_alert(uuid,text,text,date,date,integer) to service_role;

create function public.claim_availability_alerts(p_worker_token text, p_limit integer default 20)
returns setof public.availability_alerts language plpgsql security invoker set search_path='' as $function$
begin
  if p_worker_token is null or length(p_worker_token) <> 64 or not exists (
    select 1 from private.availability_alert_worker_config
    where token_hash=encode(extensions.digest(p_worker_token,'sha256'),'hex')
  ) then raise exception using errcode='42501',message='WORKER_UNAUTHORIZED'; end if;
  update public.availability_alerts set status='expired',claim_token=null,claim_until=null
    where status='active' and check_in < (now() at time zone 'Indian/Maldives')::date;
  return query
    with due as (
      select id from public.availability_alerts where status='active' and next_check_at<=now()
        and (claim_until is null or claim_until<now())
      order by next_check_at,id limit least(greatest(p_limit,1),20) for update skip locked
    )
    update public.availability_alerts a set claim_token=gen_random_uuid(),claim_until=now()+interval '2 minutes'
      from due where a.id=due.id returning a.*;
end;
$function$;
revoke all on function public.claim_availability_alerts(text,integer) from public,anon,authenticated;
grant execute on function public.claim_availability_alerts(text,integer) to service_role;

create function private.queue_availability_alert_check() returns bigint
language sql security invoker set search_path='' as $function$
  select net.http_post(
    url := 'https://www.tripelor.com/api/internal/availability-alerts',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name='tripelor_availability_alert_worker')),
    body := '{}'::jsonb, timeout_milliseconds := 55000
  );
$function$;
revoke all on function private.queue_availability_alert_check() from public,anon,authenticated,service_role;
comment on table public.availability_alerts is 'Opt-in, one-time room availability emails. Account ownership is enforced by RLS and server routes. No reservation or price guarantee.';
