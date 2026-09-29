alter table public.referrals alter column discount_usd set default 0;
comment on column public.referrals.discount_usd is
  'Actual USD discount amount applied to the booking. The referral offer itself is defined by discount_percent.';
