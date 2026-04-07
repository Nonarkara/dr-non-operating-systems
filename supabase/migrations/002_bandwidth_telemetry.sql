-- ============================================================
-- Bandwidth & Performance Telemetry
-- Tracks response size, compression, cache status per check.
-- ============================================================

-- Individual check records (high-resolution, append-only)
CREATE TABLE IF NOT EXISTS bandwidth_checks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target_id text NOT NULL,
  target_label text NOT NULL,
  platform text,
  checked_at timestamptz NOT NULL DEFAULT now(),
  status_code integer,
  health text,
  response_ms integer,
  body_bytes integer,
  content_encoding text,
  cache_status text,
  error_type text
);

CREATE INDEX IF NOT EXISTS idx_bandwidth_target_date ON bandwidth_checks (target_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_bandwidth_platform ON bandwidth_checks (platform, checked_at DESC);

-- Extend daily_uptime with bandwidth columns
ALTER TABLE daily_uptime ADD COLUMN IF NOT EXISTS p50_ms integer;
ALTER TABLE daily_uptime ADD COLUMN IF NOT EXISTS p95_ms integer;
ALTER TABLE daily_uptime ADD COLUMN IF NOT EXISTS avg_bytes integer;
ALTER TABLE daily_uptime ADD COLUMN IF NOT EXISTS total_bytes bigint;
ALTER TABLE daily_uptime ADD COLUMN IF NOT EXISTS cache_hit_pct numeric(5,2);
ALTER TABLE daily_uptime ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0;

-- RLS
ALTER TABLE bandwidth_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read bandwidth_checks" ON bandwidth_checks FOR SELECT USING (true);
CREATE POLICY "Service write bandwidth_checks" ON bandwidth_checks FOR ALL USING (true) WITH CHECK (true);
