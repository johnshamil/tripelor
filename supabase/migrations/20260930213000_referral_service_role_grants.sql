-- Referral tables are server-only through Tripelor API routes.
-- Explicit Data API grants are required for the server secret/service role.
grant select, insert, update, delete on table public.referral_codes to service_role;
grant select, insert, update, delete on table public.referrals to service_role;
