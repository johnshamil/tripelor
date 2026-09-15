create table public.host_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.managed_properties(id) on delete cascade,
  property_slug text not null,
  property_name text not null,
  guest_name text not null default '',
  guest_email text not null default '',
  topic text not null check(topic in ('Room','Food','Beach','Children & family','Other')),
  question text not null check(char_length(question) between 1 and 1500),
  draft_name text not null default '' check(char_length(draft_name)<=120),
  draft_text text not null default '' check(char_length(draft_text)<=5000),
  draft_audio text not null default '' check(char_length(draft_audio)<=200),
  draft_transcript text not null default '' check(char_length(draft_transcript)<=5000),
  reply_name text not null default '' check(char_length(reply_name)<=120),
  reply_text text not null default '' check(char_length(reply_text)<=5000),
  reply_audio text not null default '' check(char_length(reply_audio)<=200),
  reply_transcript text not null default '' check(char_length(reply_transcript)<=5000),
  replied_at timestamptz,
  version integer not null default 1 check(version>0),
  created_at timestamptz not null default now()
);
create index host_questions_user_created on public.host_questions(user_id,created_at desc,id desc);
create index host_questions_property on public.host_questions(property_id);
create index host_questions_created on public.host_questions(created_at desc,id desc);
create index host_questions_pending on public.host_questions(created_at desc,id desc) where replied_at is null;
alter table public.host_questions enable row level security;
revoke all on public.host_questions from public,anon,authenticated;
grant select,insert,update on public.host_questions to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('host-media','host-media',false,10485760,array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4','audio/x-m4a','audio/ogg','audio/webm','audio/wav','audio/x-wav']);
-- No client storage policies: the admin signs uploads and the server checks
-- published profile references or enquiry ownership before signing downloads.
