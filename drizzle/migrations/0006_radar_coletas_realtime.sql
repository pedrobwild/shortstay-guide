DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'radar_observacoes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.radar_observacoes;
  END IF;
END $$;