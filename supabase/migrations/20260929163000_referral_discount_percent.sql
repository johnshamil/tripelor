-- Change Tripelor referral benefit from flat USD 20 to 20 percent.
alter table public.referrals
  add column if not exists discount_percent numeric not null default 20
  check (discount_percent >= 0 and discount_percent <= 100);

comment on column public.referrals.discount_percent is
  'Percentage referral discount applied to an eligible booking. Current Tripelor referral offer is 20%.';
