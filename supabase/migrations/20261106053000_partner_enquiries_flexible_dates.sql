-- Allow truly flexible travel dates in partner enquiries without placeholders.
-- Existing dated enquiries retain dates_flexible = false.
alter table public.partner_enquiries
  alter column start_date drop not null,
  alter column end_date drop not null;

alter table public.partner_enquiries
  add column if not exists dates_flexible boolean not null default false;

alter table public.partner_enquiries
  add constraint partner_enquiries_travel_dates_valid
  check (
    (dates_flexible = true and start_date is null and end_date is null)
    or
    (dates_flexible = false and start_date is not null and end_date is not null and end_date >= start_date)
  );

comment on column public.partner_enquiries.dates_flexible is
  'True when the customer has not provided any travel dates. Never substitute invented dates.';
