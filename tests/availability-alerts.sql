-- Transactional verification only. All test alerts are rolled back.
begin;
do $test$
declare v_user uuid; v_id uuid; v_duplicate uuid; v_token text; v_count integer;
begin
  select id into v_user from auth.users order by created_at limit 1;
  if v_user is null then raise exception 'A test account is required'; end if;
  perform set_config('test.alert_owner', v_user::text, true);
  select id into v_id from public.create_availability_alert(v_user,'QA transient property','QA transient room',current_date+40,current_date+42,1);
  select id into v_duplicate from public.create_availability_alert(v_user,'QA transient property','QA transient room',current_date+40,current_date+42,1);
  if v_id <> v_duplicate then raise exception 'Duplicate protection failed'; end if;
  begin
    perform public.claim_availability_alerts(repeat('0',64),20);
    raise exception 'Invalid worker credential was accepted';
  exception when insufficient_privilege then null;
  end;
  select decrypted_secret into v_token from vault.decrypted_secrets where name='tripelor_availability_alert_worker';
  select count(*) into v_count from public.claim_availability_alerts(v_token,20) where id=v_id;
  if v_count <> 1 then raise exception 'First worker claim failed'; end if;
  select count(*) into v_count from public.claim_availability_alerts(v_token,20) where id=v_id;
  if v_count <> 0 then raise exception 'Concurrent claim protection failed'; end if;
  update public.availability_alerts set check_in=current_date-3,check_out=current_date-1 where id=v_id;
  perform public.claim_availability_alerts(v_token,20);
  if (select status from public.availability_alerts where id=v_id) <> 'expired' then raise exception 'Expiry failed'; end if;
  for i in 1..10 loop
    perform public.create_availability_alert(v_user,'QA transient property','QA transient room',current_date+50+i,current_date+51+i,1);
  end loop;
  begin
    perform public.create_availability_alert(v_user,'QA transient property','QA transient room',current_date+80,current_date+82,1);
    raise exception 'Alert limit was not enforced';
  exception when raise_exception then
    if SQLERRM <> 'ALERT_LIMIT_REACHED' then raise; end if;
  end;
end;
$test$;
set local role authenticated;
do $test$
begin
  perform set_config('request.jwt.claim.sub',current_setting('test.alert_owner'),true);
  if (select count(*) from public.availability_alerts where property_name='QA transient property') <> 11 then raise exception 'Owner read policy failed'; end if;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  if exists(select 1 from public.availability_alerts where property_name='QA transient property') then raise exception 'Customer isolation failed'; end if;
  if has_table_privilege(current_user,'public.availability_alerts','INSERT') or has_table_privilege(current_user,'public.availability_alerts','UPDATE') then raise exception 'Unexpected direct write access'; end if;
  if has_function_privilege(current_user,'public.claim_availability_alerts(text,integer)','EXECUTE') or has_function_privilege(current_user,'public.create_availability_alert(uuid,text,text,date,date,integer)','EXECUTE') then raise exception 'Customer can execute server-only RPC'; end if;
end;
$test$;
reset role;
rollback;
select 'PASS: duplicate, claim, expiry, limit and customer isolation checks; test alerts rolled back' as verification;
