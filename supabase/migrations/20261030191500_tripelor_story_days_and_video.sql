update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']
where id='trip-stories';

alter table public.trip_story_photos
  add column if not exists media_type text not null default 'photo',
  add column if not exists day_number integer,
  add column if not exists duration_seconds integer;

alter table public.trip_story_photos
  drop constraint if exists trip_story_photos_media_type_check;
alter table public.trip_story_photos
  add constraint trip_story_photos_media_type_check
  check (media_type in ('photo','video'));

alter table public.trip_story_photos
  drop constraint if exists trip_story_photos_day_number_check;
alter table public.trip_story_photos
  add constraint trip_story_photos_day_number_check
  check (day_number is null or day_number between 1 and 60);

create table if not exists public.trip_story_days (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.trip_stories(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 60),
  title text not null default '' check (char_length(title) <= 160),
  body text not null default '' check (char_length(body) <= 3000),
  location_label text not null default '' check (char_length(location_label) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(story_id, day_number)
);

create index if not exists trip_story_days_story_idx
  on public.trip_story_days(story_id, day_number);

alter table public.trip_story_days enable row level security;
revoke all on public.trip_story_days from public, anon, authenticated;
grant select, insert, update, delete on public.trip_story_days to service_role;

comment on table public.trip_story_days is
'Private day-by-day Tripelor Story journal entries. Public access is only through server-rendered published story pages.';
