create table if not exists public.pre_arrival_preferences (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reservations(id) on delete cascade,
  guest_email text not null,
  flight_number text,
  arrival_at timestamptz,
  transfer_required boolean not null default false,
  dietary_requirements text,
  allergies text,
  bedding_preference text,
  room_preferences text,
  celebration_type text not null default 'none'
    check (celebration_type in ('none', 'birthday', 'honeymoon', 'anniversary', 'other')),
  celebration_notes text,
  preferred_activities text[] not null default '{}',
  early_check_in boolean not null default false,
  late_check_out boolean not null default false,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewed', 'confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pre_arrival_preferences_guest_email_idx
  on public.pre_arrival_preferences (guest_email);
create index if not exists pre_arrival_preferences_updated_at_idx
  on public.pre_arrival_preferences (updated_at desc);

alter table public.pre_arrival_preferences enable row level security;
revoke all on table public.pre_arrival_preferences from anon, authenticated;
grant select, insert, update, delete on table public.pre_arrival_preferences to service_role;
