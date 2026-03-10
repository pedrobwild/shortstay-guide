
CREATE TABLE IF NOT EXISTS public.guide_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  session_id text,
  device_type text,
  page text DEFAULT 'guide',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ge_type ON public.guide_events(event_type);
CREATE INDEX idx_ge_created ON public.guide_events(created_at);

ALTER TABLE public.guide_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on guide_events"
ON public.guide_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated read on guide_events"
ON public.guide_events
FOR SELECT
TO authenticated
USING (true);
