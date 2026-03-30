-- ============================================================
-- Dr. Non's Operations Radar — Long-term Monitoring Database
-- Run this in your Supabase SQL Editor to set up the tables.
-- ============================================================

-- Daily uptime summary per target (one row per target per day)
-- This is the core table for "which system fails most" analysis
create table if not exists daily_uptime (
  id bigint generated always as identity primary key,
  target_id text not null,
  target_label text not null,
  date date not null,
  checks integer not null default 0,
  ups integer not null default 0,
  uptime_pct numeric(5,2) generated always as (
    case when checks > 0 then round((ups::numeric / checks) * 100, 2) else 0 end
  ) stored,
  avg_response_ms integer,
  min_response_ms integer,
  max_response_ms integer,
  platform text,
  surface text,
  category text,
  created_at timestamptz not null default now(),

  unique (target_id, date)
);

-- Individual incidents (downtime events with duration)
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  target_id text not null,
  target_label text not null,
  severity text not null check (severity in ('critical', 'warning', 'info')),
  type text not null check (type in ('down', 'degraded', 'recovery')),
  message text,
  platform text,
  error_reason text,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  duration_minutes integer generated always as (
    case when resolved_at is not null
      then extract(epoch from (resolved_at - started_at)) / 60
      else null
    end
  ) stored,
  trigger_id text,
  resolution text,
  created_at timestamptz not null default now()
);

-- Visitor analytics (daily per project)
create table if not exists visitor_daily (
  id bigint generated always as identity primary key,
  project_id text not null,
  date date not null,
  visitors integer not null default 0,
  unique_ips integer not null default 0,
  top_countries jsonb default '{}',
  avg_response_ms integer,
  created_at timestamptz not null default now(),

  unique (project_id, date)
);

-- System reliability scores (weekly rollup for dashboards)
create table if not exists reliability_weekly (
  id bigint generated always as identity primary key,
  target_id text not null,
  target_label text not null,
  week_start date not null,
  total_checks integer not null default 0,
  total_ups integer not null default 0,
  uptime_pct numeric(5,2),
  incident_count integer not null default 0,
  avg_response_ms integer,
  worst_downtime_minutes integer,
  platform text,
  created_at timestamptz not null default now(),

  unique (target_id, week_start)
);

-- Indexes for common queries
create index if not exists idx_daily_uptime_date on daily_uptime (date desc);
create index if not exists idx_daily_uptime_target on daily_uptime (target_id, date desc);
create index if not exists idx_incidents_target on incidents (target_id, started_at desc);
create index if not exists idx_incidents_severity on incidents (severity, started_at desc);
create index if not exists idx_incidents_open on incidents (target_id) where resolved_at is null;
create index if not exists idx_visitor_daily_date on visitor_daily (date desc);
create index if not exists idx_reliability_weekly on reliability_weekly (target_id, week_start desc);

-- Row Level Security (public read, service key write)
alter table daily_uptime enable row level security;
alter table incidents enable row level security;
alter table visitor_daily enable row level security;
alter table reliability_weekly enable row level security;

-- Allow anonymous reads (dashboard can display without auth)
create policy "Public read daily_uptime" on daily_uptime for select using (true);
create policy "Public read incidents" on incidents for select using (true);
create policy "Public read visitor_daily" on visitor_daily for select using (true);
create policy "Public read reliability_weekly" on reliability_weekly for select using (true);

-- Service role can insert/update (server-side only)
create policy "Service write daily_uptime" on daily_uptime for all using (true) with check (true);
create policy "Service write incidents" on incidents for all using (true) with check (true);
create policy "Service write visitor_daily" on visitor_daily for all using (true) with check (true);
create policy "Service write reliability_weekly" on reliability_weekly for all using (true) with check (true);
