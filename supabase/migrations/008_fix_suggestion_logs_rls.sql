-- Enable RLS on suggestion_logs
-- This table is written only by Edge Functions via service role key,
-- which bypasses RLS. Regular users should not be able to read or write it.
ALTER TABLE public.suggestion_logs ENABLE ROW LEVEL SECURITY;

-- No policies needed — service role bypasses RLS automatically.
-- This prevents any authenticated or anonymous user from accessing the table directly.
