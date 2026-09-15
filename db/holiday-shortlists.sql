-- Shared bearer links are authorized only by the server route.
create table public.holiday_shortlists (
  id uuid primary key default gen_random_uuid(),
  share_hash text not null unique check (share_hash ~ '^[0-9a-f]{64}$'),
  owner_hash text not null check (owner_hash ~ '^[0-9a-f]{64}$'),
  network_hash text not null check (network_hash ~ '^[0-9a-f]{64}$'),
  title text not null check (char_length(title) between 1 and 80),
  slugs text[] not null check (cardinality(slugs) between 1 and 3),
  participants jsonb not null default '[]'::jsonb check (jsonb_typeof(participants) = 'array' and jsonb_array_length(participants) <= 30 and octet_length(participants::text) <= 180000),
  version integer not null default 1 check (version > 0),
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index holiday_shortlists_owner_created on public.holiday_shortlists(owner_hash, created_at);
create index holiday_shortlists_network_created on public.holiday_shortlists(network_hash, created_at);
alter table public.holiday_shortlists enable row level security;
revoke all on public.holiday_shortlists from public, anon, authenticated;
grant select, insert, update on public.holiday_shortlists to service_role;
