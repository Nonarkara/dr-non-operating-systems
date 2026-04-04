-- ============================================================
-- Backend hardening: durable targets, raw health checks,
-- trigger audit state, and job run history.
-- ============================================================

create table if not exists targets (
  id text primary key,
  label text not null,
  url text not null,
  description text,
  repo text,
  category text,
  surface text,
  featured boolean not null default false,
  added_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists health_checks (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique,
  scan_id text not null,
  target_id text not null references targets(id) on delete cascade,
  checked_at timestamptz not null,
  status_code integer,
  ok boolean not null default false,
  health_code text not null,
  health_label text not null,
  health_reason text,
  response_time_ms integer,
  final_url text,
  hostname text,
  platform text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists triggers (
  id bigint generated always as identity primary key,
  external_key text not null unique,
  target_id text not null,
  target_label text not null,
  type text not null,
  severity text not null,
  status text not null check (status in ('open', 'claimed', 'resolved')),
  context jsonb not null default '{}'::jsonb,
  claimed_by text,
  created_at timestamptz not null,
  resolved_at timestamptz,
  resolution text,
  audit_log jsonb not null default '[]'::jsonb
);

create table if not exists job_runs (
  id bigint generated always as identity primary key,
  external_key text not null unique,
  job_type text not null check (job_type in ('scan', 'publish', 'backfill')),
  source text not null,
  actor text,
  request_id text,
  status text not null check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null,
  finished_at timestamptz,
  error_message text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table incidents add column if not exists external_key text;
create unique index if not exists idx_incidents_external_key on incidents (external_key) where external_key is not null;

create index if not exists idx_targets_category on targets (category);
create index if not exists idx_health_checks_target_time on health_checks (target_id, checked_at desc);
create index if not exists idx_health_checks_scan on health_checks (scan_id);
create index if not exists idx_triggers_target_status on triggers (target_id, status);
create index if not exists idx_job_runs_type_started on job_runs (job_type, started_at desc);

alter table targets enable row level security;
alter table health_checks enable row level security;
alter table triggers enable row level security;
alter table job_runs enable row level security;

create policy "Public read targets" on targets for select using (true);
create policy "Public read health_checks" on health_checks for select using (true);
create policy "Public read triggers" on triggers for select using (true);
create policy "Public read job_runs" on job_runs for select using (true);

create policy "Service write targets" on targets for all using (true) with check (true);
create policy "Service write health_checks" on health_checks for all using (true) with check (true);
create policy "Service write triggers" on triggers for all using (true) with check (true);
create policy "Service write job_runs" on job_runs for all using (true) with check (true);
