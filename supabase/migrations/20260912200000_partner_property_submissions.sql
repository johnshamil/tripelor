create table if not exists public.property_partner_submissions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.managed_properties(id) on delete cascade,
  partner_email text not null,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'::text),
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_note text not null default '',
  base_updated_at timestamptz
);

create index if not exists property_partner_submissions_property_status_idx
  on public.property_partner_submissions (property_id, status, created_at desc);
create index if not exists property_partner_submissions_partner_status_idx
  on public.property_partner_submissions (partner_email, status, created_at desc);

alter table public.property_partner_submissions enable row level security;
alter table public.property_partner_submissions add column if not exists base_updated_at timestamptz;
revoke all on table public.property_partner_submissions from anon, authenticated;
grant select, insert, update, delete on table public.property_partner_submissions to service_role;
