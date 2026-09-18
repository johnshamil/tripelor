create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null check (
    event_name in (
      'page_view',
      'property_view',
      'booking_started',
      'booking_completed',
      'whatsapp_click'
    )
  ),
  path text not null check (char_length(path) between 1 and 500),
  session_id uuid not null,
  visitor_id uuid not null,
  referrer text check (referrer is null or char_length(referrer) <= 1000),
  source text check (source is null or char_length(source) <= 120),
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  device text not null default 'other' check (device in ('mobile', 'tablet', 'desktop', 'other')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_event_created_idx
  on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_visitor_created_idx
  on public.analytics_events (visitor_id, created_at desc);

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from anon, authenticated;
revoke all on sequence public.analytics_events_id_seq from anon, authenticated;

grant select, insert on table public.analytics_events to service_role;
grant usage, select on sequence public.analytics_events_id_seq to service_role;

comment on table public.analytics_events is
  'Privacy-conscious, pseudonymous website events used by the Tripelor admin analytics dashboard.';

create or replace function public.get_website_analytics(p_days integer default 30)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select
      greatest(1, least(coalesce(p_days, 30), 90)) as days,
      (now() at time zone 'Indian/Maldives')::date as today
  ),
  filtered as (
    select event_name, path, session_id, visitor_id, source, country, device, created_at
    from public.analytics_events, bounds
    where (created_at at time zone 'Indian/Maldives')::date >= today - (days - 1)
  ),
  daily as (
    select
      calendar.day::date as day,
      count(filtered.event_name) filter (where filtered.event_name = 'page_view')::integer as page_views,
      count(distinct filtered.visitor_id)::integer as visitors
    from bounds,
      generate_series(today - (days - 1), today, interval '1 day') as calendar(day)
    left join filtered
      on (filtered.created_at at time zone 'Indian/Maldives')::date = calendar.day::date
    group by calendar.day
    order by calendar.day
  ),
  top_pages as (
    select path, count(*)::integer as views
    from filtered
    where event_name = 'page_view'
    group by path
    order by views desc, path
    limit 10
  ),
  top_sources as (
    select coalesce(nullif(source, ''), 'Direct') as source, count(*)::integer as visits
    from filtered
    where event_name = 'page_view'
    group by coalesce(nullif(source, ''), 'Direct')
    order by visits desc, source
    limit 10
  ),
  top_countries as (
    select coalesce(nullif(country, ''), 'Unknown') as country, count(*)::integer as visits
    from filtered
    where event_name = 'page_view'
    group by coalesce(nullif(country, ''), 'Unknown')
    order by visits desc, country
    limit 10
  ),
  devices as (
    select device, count(*)::integer as visits
    from filtered
    where event_name = 'page_view'
    group by device
    order by visits desc, device
  ),
  metrics as (
    select
      count(*) filter (where event_name = 'page_view')::integer as page_views,
      count(distinct visitor_id)::integer as unique_visitors,
      count(distinct session_id)::integer as sessions,
      count(*) filter (where event_name = 'property_view')::integer as property_views,
      count(*) filter (where event_name = 'booking_started')::integer as bookings_started,
      count(*) filter (where event_name = 'booking_completed')::integer as bookings_completed,
      count(*) filter (where event_name = 'whatsapp_click')::integer as whatsapp_clicks
    from filtered
  )
  select jsonb_build_object(
    'days', (select days from bounds),
    'generatedAt', now(),
    'trackingSince', (select min(created_at) from public.analytics_events),
    'metrics', jsonb_build_object(
      'pageViews', metrics.page_views,
      'uniqueVisitors', metrics.unique_visitors,
      'sessions', metrics.sessions,
      'propertyViews', metrics.property_views,
      'bookingsStarted', metrics.bookings_started,
      'bookingsCompleted', metrics.bookings_completed,
      'whatsappClicks', metrics.whatsapp_clicks,
      'conversionRate', case
        when metrics.unique_visitors = 0 then 0
        else round((metrics.bookings_completed::numeric / metrics.unique_visitors::numeric) * 100, 1)
      end,
      'pagesPerSession', case
        when metrics.sessions = 0 then 0
        else round(metrics.page_views::numeric / metrics.sessions::numeric, 1)
      end
    ),
    'daily', coalesce((select jsonb_agg(to_jsonb(daily)) from daily), '[]'::jsonb),
    'topPages', coalesce((select jsonb_agg(to_jsonb(top_pages)) from top_pages), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(to_jsonb(top_sources)) from top_sources), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(to_jsonb(top_countries)) from top_countries), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(to_jsonb(devices)) from devices), '[]'::jsonb)
  )
  from metrics;
$$;

revoke execute on function public.get_website_analytics(integer) from public, anon, authenticated;
grant execute on function public.get_website_analytics(integer) to service_role;
