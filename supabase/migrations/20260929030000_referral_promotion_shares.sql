-- Tripelor Referral Lucky Draw share tracking
-- Promotion closes 30 December 2026. Share events are written only by server routes.

create extension if not exists pgcrypto;

create table if not exists public.referral_share_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_email text not null,
  referral_code text not null references public.referral_codes(code) on delete cascade,
  action text not null check (action in ('share', 'copy')),
  channel text not null default 'web'
    check (char_length(channel) between 1 and 40),
  created_at timestamptz not null default now()
);

create index if not exists referral_share_events_user_idx
  on public.referral_share_events(user_id, created_at desc);

create index if not exists referral_share_events_code_idx
  on public.referral_share_events(referral_code, created_at desc);

comment on table public.referral_share_events is
  'Server-recorded Tripelor referral share/copy actions used for the 2026 referral promotion and admin participation reporting.';

alter table public.referral_share_events enable row level security;

revoke all on table public.referral_share_events from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.referral_share_events to service_role;
