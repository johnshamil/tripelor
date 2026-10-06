-- Keep existing USD quotations valid while allowing admin-created MVR quotes.
alter table public.manual_quotations
  drop constraint manual_quotations_currency_check;

alter table public.manual_quotations
  add constraint manual_quotations_currency_check
  check (currency in ('USD', 'MVR'));
