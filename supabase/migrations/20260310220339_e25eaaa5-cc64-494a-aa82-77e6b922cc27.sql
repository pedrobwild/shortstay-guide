
CREATE TABLE IF NOT EXISTS public.guide_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  whatsapp text NOT NULL,
  neighborhood text,
  area_sqm text,
  objective text,
  source text DEFAULT 'guide',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.guide_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert on guide_leads"
ON public.guide_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated read on guide_leads"
ON public.guide_leads
FOR SELECT
TO authenticated
USING (true);
