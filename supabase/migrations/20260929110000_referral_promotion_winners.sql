-- Tripelor Share & Win 2026 winner record
create table if not exists public.referral_promotion_winners (
  id uuid primary key default gen_random_uuid(),
  campaign_slug text not null unique,
  winner_user_id uuid references auth.users(id) on delete set null,
  owner_email text not null,
  referral_code text not null,
  entries_at_selection integer not null check (entries_at_selection > 0),
  selected_by text not null,
  selection_snapshot jsonb not null default '{}'::jsonb,
  selected_at timestamptz not null default now()
);

comment on table public.referral_promotion_winners is
  'Immutable winner record for Tripelor referral promotions. One winner per campaign slug.';

alter table public.referral_promotion_winners enable row level security;
revoke all on table public.referral_promotion_winners from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert on table public.referral_promotion_winners to service_role;
