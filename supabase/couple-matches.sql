create table public.couple_matches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id) on delete cascade,
  invite_hash text not null check (length(invite_hash)=64),
  owner_preferences jsonb,
  partner_preferences jsonb,
  choice text,
  version integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  check (partner_id is null or partner_id <> owner_id)
);
alter table public.couple_matches enable row level security;
revoke all on public.couple_matches from public, anon, authenticated;
grant select,insert,update,delete on public.couple_matches to service_role;
create index couple_matches_owner on public.couple_matches(owner_id);
create index couple_matches_partner on public.couple_matches(partner_id);
create index couple_matches_expiry on public.couple_matches(expires_at);
comment on table public.couple_matches is 'Private two-traveller holiday matching. Server-only access; API enforces participant ownership and masks partner preferences.';
