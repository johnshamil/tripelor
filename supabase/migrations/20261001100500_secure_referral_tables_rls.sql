-- Referral data is server-only through Tripelor API routes using the Supabase service role.
-- Keep anonymous and normal authenticated clients from accessing these tables directly.

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

revoke all on table public.referral_codes from anon, authenticated;
revoke all on table public.referrals from anon, authenticated;

grant select, insert, update, delete on table public.referral_codes to service_role;
grant select, insert, update, delete on table public.referrals to service_role;
