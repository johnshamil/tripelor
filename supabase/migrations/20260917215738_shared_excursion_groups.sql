create table public.shared_excursion_groups (
  id uuid primary key default gen_random_uuid(),
  excursion_slug text not null,
  excursion_name text not null,
  travel_date date not null,
  price_usd numeric(10,2) not null check (price_usd >= 0),
  capacity integer not null check (capacity between 2 and 100),
  joined_guests integer not null default 0 check (joined_guests between 0 and capacity),
  status text not null default 'open' check (status in ('open','confirmed','cancelled','completed')),
  meeting_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index shared_excursion_groups_public_idx on public.shared_excursion_groups(status, travel_date);
alter table public.shared_excursion_groups enable row level security;
create policy "Anyone can view upcoming shared excursion groups" on public.shared_excursion_groups for select to anon, authenticated using (status in ('open','confirmed') and travel_date >= current_date);
revoke insert, update, delete on public.shared_excursion_groups from anon, authenticated;
grant select on public.shared_excursion_groups to anon, authenticated;

create table public.shared_excursion_joins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.shared_excursion_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null default '',
  guests integer not null check (guests between 1 and 20),
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending','confirmed','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notification_sent_at timestamptz
);
create unique index shared_excursion_joins_active_unique on public.shared_excursion_joins(group_id,user_id) where status in ('pending','confirmed');
create index shared_excursion_joins_group_idx on public.shared_excursion_joins(group_id,status);
create index shared_excursion_joins_user_idx on public.shared_excursion_joins(user_id,created_at desc);
alter table public.shared_excursion_joins enable row level security;
create policy "Customers can view their own shared excursion joins" on public.shared_excursion_joins for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.shared_excursion_joins from anon, authenticated;
grant select on public.shared_excursion_joins to authenticated;

create or replace function public.join_shared_excursion_group(
  p_group_id uuid, p_user_id uuid, p_guest_name text, p_guest_email text, p_guest_phone text, p_guests integer, p_notes text
) returns public.shared_excursion_joins language plpgsql security invoker set search_path = public as $$
declare g public.shared_excursion_groups; j public.shared_excursion_joins;
begin
  if p_user_id is null or p_guests is null or p_guests < 1 or p_guests > 20 then raise exception 'INVALID_JOIN'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_group_id::text, 91027));
  select * into g from public.shared_excursion_groups where id = p_group_id for update;
  if not found or g.status <> 'open' or g.travel_date < current_date then raise exception 'GROUP_UNAVAILABLE'; end if;
  select * into j from public.shared_excursion_joins where group_id = p_group_id and user_id = p_user_id and status in ('pending','confirmed') limit 1;
  if found then return j; end if;
  if g.joined_guests + p_guests > g.capacity then raise exception 'GROUP_FULL'; end if;
  insert into public.shared_excursion_joins(group_id,user_id,guest_name,guest_email,guest_phone,guests,notes)
    values (p_group_id,p_user_id,left(trim(p_guest_name),160),lower(left(trim(p_guest_email),240)),left(trim(coalesce(p_guest_phone,'')),80),p_guests,left(trim(coalesce(p_notes,'')),1000)) returning * into j;
  update public.shared_excursion_groups set joined_guests = joined_guests + p_guests, updated_at = now() where id = p_group_id;
  return j;
end; $$;
revoke all on function public.join_shared_excursion_group(uuid,uuid,text,text,text,integer,text) from public, anon, authenticated;
grant execute on function public.join_shared_excursion_group(uuid,uuid,text,text,text,integer,text) to service_role;
