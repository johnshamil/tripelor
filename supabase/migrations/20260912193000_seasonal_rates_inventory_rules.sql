-- Seasonal rates and inventory rules are stored in managed_properties.data.
-- These functions enforce those rules during availability checks, calendar reads,
-- and reservation creation while preserving the existing property_inventory table.

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
set search_path to 'public'
as $function$
declare
  v_total integer;
  v_inventory_room text;
  v_property_data jsonb := '{}'::jsonb;
begin
  if p_check_out <= p_check_in then
    raise exception 'Check-out must be after check-in';
  end if;
  if p_rooms <= 0 then
    raise exception 'Room quantity must be positive';
  end if;

  v_inventory_room := case when lower(p_property_name)='rivethi beach hotel' then 'ALL ROOMS' else p_room_type end;

  select i.total_rooms into v_total
  from public.property_inventory i
  where i.property_name=p_property_name
    and i.room_type=v_inventory_room
    and i.active=true;

  if v_total is null then
    return query select false, 0, 0;
    return;
  end if;

  v_property_data := coalesce((
    select mp.data
    from public.managed_properties mp
    where mp.status='published'
      and lower(mp.data->>'name')=lower(p_property_name)
    limit 1
  ), '{}'::jsonb);

  return query
  with days as (
    select generate_series(p_check_in::timestamp, (p_check_out - 1)::timestamp, interval '1 day')::date as day
  ),
  daily_capacity as (
    select
      d.day,
      coalesce((
        select min(
          case
            when coalesce((rule->>'stopSale')::boolean, false) then 0
            else least(v_total, greatest(coalesce(nullif(rule->>'roomsAvailable','')::integer, v_total), 0))
          end
        )
        from jsonb_array_elements(coalesce(v_property_data->'inventoryRules', '[]'::jsonb)) as rule
        where lower(coalesce(rule->>'roomName',''))=lower(p_room_type)
          and d.day between (rule->>'startDate')::date and (rule->>'endDate')::date
      ), v_total) as capacity
    from days d
  ),
  daily_occupancy as (
    select
      c.day,
      c.capacity,
      coalesce(sum(r.rooms), 0)::integer as reserved
    from daily_capacity c
    left join public.reservations r
      on lower(r.property_name)=lower(p_property_name)
      and (lower(p_property_name)='rivethi beach hotel' or lower(r.room_type)=lower(p_room_type))
      and lower(coalesce(r.status,'')) in ('pending','confirmed')
      and r.check_in <= c.day
      and r.check_out > c.day
    group by c.day, c.capacity
  )
  select
    bool_and((capacity - reserved) >= p_rooms),
    greatest(min(capacity - reserved), 0)::integer,
    min(capacity)::integer
  from daily_occupancy;
end;
$function$;

revoke execute on function public.check_room_availability(text, text, date, date, integer) from public;
grant execute on function public.check_room_availability(text, text, date, date, integer) to service_role;
revoke execute on function public.reserve_rooms(text, text, date, date, integer, text, text, text) from public;
grant execute on function public.reserve_rooms(text, text, date, date, integer, text, text, text) to service_role;
revoke execute on function public.get_room_calendar(text, text, date, date) from public;
grant execute on function public.get_room_calendar(text, text, date, date) to service_role;

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
set search_path to 'public'
as $function$
declare
  v_total integer;
  v_reserved integer;
  v_id uuid;
  v_inventory_room text;
  v_available boolean;
begin
  if p_check_out <= p_check_in then
    raise exception 'Check-out must be after check-in';
  end if;
  if p_rooms <= 0 then
    raise exception 'Room quantity must be positive';
  end if;

  v_inventory_room := case when lower(p_property_name)='rivethi beach hotel' then 'ALL ROOMS' else p_room_type end;

  select i.total_rooms into v_total
  from public.property_inventory i
  where i.property_name=p_property_name
    and i.room_type=v_inventory_room
    and i.active=true
  for update;

  if v_total is null then
    raise exception 'Room inventory is not configured';
  end if;

  select c.available into v_available
  from public.check_room_availability(p_property_name, p_room_type, p_check_in, p_check_out, p_rooms) c;

  if not coalesce(v_available, false) then
    raise exception 'ROOM_NOT_AVAILABLE';
  end if;

  select coalesce(sum(r.rooms),0)::integer into v_reserved
  from public.reservations r
  where r.property_name=p_property_name
    and (lower(p_property_name)='rivethi beach hotel' or r.room_type=p_room_type)
    and r.status in ('pending','confirmed')
    and r.check_in < p_check_out
    and r.check_out > p_check_in;

  if v_reserved+p_rooms>v_total then
    raise exception 'ROOM_NOT_AVAILABLE';
  end if;

  insert into public.reservations(property_name,room_type,check_in,check_out,rooms,guest_name,guest_email,guest_phone,status)
  values(p_property_name,p_room_type,p_check_in,p_check_out,p_rooms,p_guest_name,p_guest_email,p_guest_phone,'pending')
  returning id into v_id;

  return v_id;
end;
$function$;

create or replace function public.get_room_calendar(
  p_property_name text,
  p_room_type text,
  p_from date,
  p_to date
)
returns table(day date, available boolean)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    d.day::date,
    coalesce((
      select c.available
      from public.check_room_availability(
        p_property_name,
        p_room_type,
        d.day::date,
        (d.day + interval '1 day')::date,
        1
      ) c
    ), false) as available
  from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') as d(day)
  order by d.day;
$function$;
