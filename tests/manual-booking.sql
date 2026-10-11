-- Integration verification only: all fixtures and booking changes are rolled back.
begin;
select set_config('test.manual_admin_id',(select id::text from auth.users limit 1),true);
set local role service_role;
do $test$
declare
  v_admin uuid;
  v_request uuid := gen_random_uuid();
  v_group uuid := gen_random_uuid();
  v_failed uuid := gen_random_uuid();
  v_property text := 'Manual Booking Verification ' || gen_random_uuid()::text;
  v_today date := (now() at time zone 'Indian/Maldives')::date;
  v_payload jsonb;
  v_count integer;
  v_amount numeric;
  v_rooms integer;
begin
  v_admin := current_setting('test.manual_admin_id')::uuid;
  if v_admin is null then raise exception 'TEST_REQUIRES_EXISTING_ADMIN_ACCOUNT'; end if;
  insert into public.property_inventory(property_name,room_type,total_rooms,active)
    values(v_property,'Room A',5,true),(v_property,'Room B',2,true);
  v_payload := jsonb_build_object('propertyName',v_property,'guestName','Verification only','guestEmail','',
    'guestPhone','','checkIn',v_today+2,'checkOut',v_today+4,'adults',2,'children',0,
    'mealPlan','Bed & Breakfast','bookingSource','Manual','externalReference','','notes','Rollback test',
    'paymentStatus','unpaid','currency','MVR','rooms',jsonb_build_array(jsonb_build_object('roomType','Room A','quantity',5,'nightlyRate',750)));
  select count(*),sum(estimated_total),sum(rooms) into v_count,v_amount,v_rooms
    from public.create_manual_booking(v_request,v_admin,v_payload);
  if v_count<>1 or v_amount<>7500 or v_rooms<>5 then raise exception 'TEST_FIVE_ROOM_MVR_TOTAL_FAILED'; end if;
  if not exists(select 1 from public.reservations where manual_booking_id=v_request
    and currency='MVR' and status='confirmed' and nightly_rate=750 and booking_source='Manual') then raise exception 'TEST_METADATA_FAILED'; end if;
  perform public.create_manual_booking(v_request,v_admin,v_payload);
  if (select count(*) from public.reservations where manual_booking_id=v_request) <> 1 then raise exception 'TEST_IDEMPOTENCY_FAILED'; end if;
  if (select available from public.check_room_availability(v_property,'Room A',v_today+2,v_today+4,1)) then raise exception 'TEST_INVENTORY_NOT_BLOCKED'; end if;

  begin
    perform public.create_manual_booking(v_failed,v_admin,jsonb_set(v_payload,'{rooms}',
      jsonb_build_array(jsonb_build_object('roomType','Room A','quantity',1,'nightlyRate',10))));
    raise exception 'TEST_OVERBOOKING_ALLOWED';
  exception when others then
    if sqlerrm not like '%ROOM_NOT_AVAILABLE%' then raise; end if;
  end;
  if exists(select 1 from public.reservations where manual_booking_id=v_failed) then raise exception 'TEST_FAILED_BOOKING_PERSISTED'; end if;

  perform public.refresh_admin_booking_notifications();
  perform public.refresh_admin_booking_notifications();
  if (select count(*) from public.admin_booking_notifications where booking_key=v_request and check_in=v_today+2) <> 1 then raise exception 'TEST_REMINDER_DEDUPLICATION_FAILED'; end if;
  if exists(select 1 from public.admin_booking_notifications n join public.reservations r on r.id=n.booking_key
    where r.manual_booking_id=v_request) then raise exception 'TEST_INTERMEDIATE_REMINDER_FAILED'; end if;
  update public.admin_booking_notifications set read_at=now() where booking_key=v_request;
  perform public.refresh_admin_booking_notifications();
  if exists(select 1 from public.admin_booking_notifications where booking_key=v_request and read_at is null) then raise exception 'TEST_READ_STATE_LOST'; end if;

  update public.reservations set status='cancelled' where manual_booking_id=v_request;
  if exists(select 1 from public.admin_booking_notifications n where n.booking_key=v_request and exists(
    select 1 from public.reservations r where coalesce(r.manual_booking_id,r.id)=n.booking_key
    and r.check_in=n.check_in and r.status in ('pending','confirmed'))) then raise exception 'TEST_CANCELLED_REMINDER_ACTIVE'; end if;
  v_payload := jsonb_set(v_payload,'{currency}','"USD"');
  v_payload := jsonb_set(v_payload,'{rooms}',jsonb_build_array(
    jsonb_build_object('roomType','Room A','quantity',2,'nightlyRate',99.99),
    jsonb_build_object('roomType','Room B','quantity',1,'nightlyRate',50)));
  select count(*),sum(rooms),sum(estimated_total) into v_count,v_rooms,v_amount
    from public.create_manual_booking(v_group,v_admin,v_payload);
  if v_count<>2 or v_rooms<>3 or v_amount<>499.96 then raise exception 'TEST_GROUP_USD_TOTAL_FAILED'; end if;
  if (select count(*) from public.admin_booking_notifications where booking_key=v_group and check_in=v_today+2) <> 1 then raise exception 'TEST_GROUP_REMINDER_FAILED'; end if;
  if (select count(distinct booking_reference) from public.reservations where manual_booking_id=v_group) <> 1 then raise exception 'TEST_GROUP_REFERENCE_FAILED'; end if;

  v_failed := gen_random_uuid();
  begin
    perform public.create_manual_booking(v_failed,v_admin,jsonb_set(v_payload,'{rooms}',jsonb_build_array(
      jsonb_build_object('roomType','Room A','quantity',1,'nightlyRate',20),
      jsonb_build_object('roomType','Room B','quantity',2,'nightlyRate',20))));
    raise exception 'TEST_PARTIAL_BOOKING_ALLOWED';
  exception when others then
    if sqlerrm not like '%ROOM_NOT_AVAILABLE%' then raise; end if;
  end;
  if exists(select 1 from public.reservations where manual_booking_id=v_failed) then raise exception 'TEST_PARTIAL_SAVE_NOT_ROLLED_BACK'; end if;
  if (select rooms_left from public.check_room_availability(v_property,'Room A',v_today+2,v_today+4,1)) <> 3 then raise exception 'TEST_FAILED_SAVE_CONSUMED_INVENTORY'; end if;

  update public.reservations set check_in=v_today+3,check_out=v_today+5 where manual_booking_id=v_group;
  if exists(select 1 from public.admin_booking_notifications n where n.booking_key=v_group and exists(
    select 1 from public.reservations r where coalesce(r.manual_booking_id,r.id)=n.booking_key
    and r.check_in=n.check_in and r.status in ('pending','confirmed'))) then raise exception 'TEST_MOVED_REMINDER_ACTIVE'; end if;
  update public.reservations set check_in=v_today+1 where manual_booking_id=v_group;
  if (select count(*) from public.admin_booking_notifications where booking_key=v_group and check_in=v_today+1) <> 1 then raise exception 'TEST_SOON_ARRIVAL_REMINDER_FAILED'; end if;

  begin
    perform public.claim_booking_reminders(repeat('0',64),20);
    raise exception 'TEST_FORGED_WORKER_TOKEN_ACCEPTED';
  exception when insufficient_privilege then null;
  end;
  if has_function_privilege('anon','public.create_manual_booking(uuid,uuid,jsonb)','execute')
    or has_function_privilege('authenticated','public.create_manual_booking(uuid,uuid,jsonb)','execute')
    or has_function_privilege('anon','public.claim_booking_reminders(text,integer)','execute')
    or has_table_privilege('authenticated','public.admin_booking_notifications','select') then raise exception 'TEST_ADMIN_STORAGE_EXPOSED'; end if;
end;
$test$;
rollback;
select 'Manual booking integration checks passed; all fixtures rolled back.' as result;
