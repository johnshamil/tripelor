create table if not exists public.trip_stories (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  guest_email text not null,
  title text not null default '' check (char_length(title) <= 160),
  story_text text not null default '' check (char_length(story_text) <= 6000),
  favorite_moment text not null default '' check (char_length(favorite_moment) <= 500),
  badges text[] not null default '{}',
  is_public boolean not null default false,
  share_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, reservation_id),
  unique (share_token)
);

create index if not exists trip_stories_reservation_idx
  on public.trip_stories(reservation_id);

create index if not exists trip_stories_user_updated_idx
  on public.trip_stories(user_id, updated_at desc);

create index if not exists trip_stories_public_share_idx
  on public.trip_stories(share_token)
  where is_public = true;

create table if not exists public.trip_story_photos (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.trip_stories(id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 300),
  sort_order integer not null default 0 check (sort_order >= 0 and sort_order <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists trip_story_photos_story_sort_idx
  on public.trip_story_photos(story_id, sort_order, created_at);

alter table public.trip_stories enable row level security;
alter table public.trip_story_photos enable row level security;

revoke all on public.trip_stories from public, anon, authenticated;
revoke all on public.trip_story_photos from public, anon, authenticated;
grant select, insert, update, delete on public.trip_stories to service_role;
grant select, insert, update, delete on public.trip_story_photos to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-stories',
  'trip-stories',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

comment on table public.trip_stories is
  'Private customer travel journals linked to verified Tripelor reservations. Public sharing is opt-in through a random share token and served only through Tripelor server routes.';

comment on table public.trip_story_photos is
  'Photo metadata for private Tripelor travel journals. Image objects live in the private trip-stories Storage bucket.';
