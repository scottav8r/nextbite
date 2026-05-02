CREATE TABLE public.suggestion_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_hash text NOT NULL,
  filters      jsonb,
  result_count int4,
  latency_ms   int4,
  top_score    float4,
  created_at   timestamptz DEFAULT now()
);

-- No RLS needed — written only by Edge Functions via service role
CREATE INDEX idx_suggestion_logs_created ON public.suggestion_logs(created_at DESC);
