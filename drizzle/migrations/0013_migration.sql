DROP POLICY IF EXISTS "Allow anonymous insert on guide_leads" ON public.guide_leads;
CREATE POLICY "Visitantes enviam contato valido" ON public.guide_leads FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 2 AND 120
  AND whatsapp ~ '^[0-9()+ \-]{8,20}$'
  AND (neighborhood IS NULL OR char_length(neighborhood) <= 120)
  AND (area_sqm IS NULL OR char_length(area_sqm) <= 20)
  AND (objective IS NULL OR char_length(objective) <= 200)
  AND (source IS NULL OR char_length(source) <= 60)
  AND (session_id IS NULL OR char_length(session_id) <= 120)
  AND (user_id IS NULL OR user_id = auth.uid())
);