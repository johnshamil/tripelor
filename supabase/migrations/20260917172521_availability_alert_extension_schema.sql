-- pg_net was enabled for this feature and has not yet been scheduled.
-- Its own functions remain in net; install extension metadata outside public.
do $guard$
begin
  if exists(select 1 from net.http_request_queue) then raise exception 'Networking queue must be empty before relocation'; end if;
end;
$guard$;
drop extension pg_net;
create extension pg_net with schema extensions;
