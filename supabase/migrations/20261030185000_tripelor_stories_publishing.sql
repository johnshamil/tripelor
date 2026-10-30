alter table public.trip_stories
  add column if not exists visibility text not null default 'private',
  add column if not exists public_name text not null default '',
  add column if not exists published_at timestamptz;

alter table public.trip_stories
  drop constraint if exists trip_stories_visibility_check;

alter table public.trip_stories
  add constraint trip_stories_visibility_check
  check (visibility in ('private','unlisted','public'));

update public.trip_stories
set visibility = case when is_public then 'unlisted' else 'private' end
where visibility = 'private' and is_public = true;

create index if not exists trip_stories_public_idx
  on public.trip_stories(published_at desc)
  where visibility = 'public';

comment on column public.trip_stories.visibility is
'Story visibility: private=owner only, unlisted=share-link only, public=listed in Tripelor Stories.';
comment on column public.trip_stories.public_name is
'Optional display name chosen by the story owner for public presentation.';
