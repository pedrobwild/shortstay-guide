
-- ============================================================
-- Tabela: projects
-- Finalidade: Representa um projeto/obra do usuário.
-- ============================================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.projects IS 'Projetos/obras do usuário. Cada projeto pode ter múltiplas conexões OTA.';

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- Tabela: ota_connections
-- Finalidade: Conexão entre projeto e canal OTA (Airbnb via iCal).
-- ============================================================
CREATE TABLE public.ota_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'airbnb',
  connection_type text NOT NULL DEFAULT 'ical',
  external_listing_id text,
  ical_url text,
  status text NOT NULL DEFAULT 'active',
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ota_connections IS 'Conexões entre projetos e canais OTA. Cada registro = 1 listing em 1 provider.';

-- Validação via trigger (não CHECK, para flexibilidade)
CREATE OR REPLACE FUNCTION public.validate_ota_connection()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.provider NOT IN ('airbnb') THEN
    RAISE EXCEPTION 'Provider inválido: %. Aceitos: airbnb', NEW.provider;
  END IF;
  IF NEW.connection_type NOT IN ('ical') THEN
    RAISE EXCEPTION 'Tipo de conexão inválido: %. Aceitos: ical', NEW.connection_type;
  END IF;
  IF NEW.status NOT IN ('active', 'inactive', 'error') THEN
    RAISE EXCEPTION 'Status inválido: %. Aceitos: active, inactive, error', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ota_connection
  BEFORE INSERT OR UPDATE ON public.ota_connections
  FOR EACH ROW EXECUTE FUNCTION public.validate_ota_connection();

ALTER TABLE public.ota_connections ENABLE ROW LEVEL SECURITY;

-- Security definer: checa se user é dono do projeto
CREATE OR REPLACE FUNCTION public.user_owns_project(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id
  );
$$;

CREATE POLICY "Users can view own ota_connections"
  ON public.ota_connections FOR SELECT TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can insert own ota_connections"
  ON public.ota_connections FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can update own ota_connections"
  ON public.ota_connections FOR UPDATE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id))
  WITH CHECK (public.user_owns_project(auth.uid(), project_id));

CREATE POLICY "Users can delete own ota_connections"
  ON public.ota_connections FOR DELETE TO authenticated
  USING (public.user_owns_project(auth.uid(), project_id));

-- ============================================================
-- Tabela: ota_calendar_events
-- Finalidade: Eventos importados do calendário iCal.
-- ============================================================
CREATE TABLE public.ota_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.ota_connections(id) ON DELETE CASCADE,
  external_event_uid text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  summary text,
  raw_payload jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ota_calendar_events IS 'Eventos de calendário importados via iCal. Cada registro = 1 reserva ou bloqueio.';

-- Validação: end_date >= start_date
CREATE OR REPLACE FUNCTION public.validate_ota_calendar_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date (%) deve ser >= start_date (%)', NEW.end_date, NEW.start_date;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_ota_calendar_event
  BEFORE INSERT OR UPDATE ON public.ota_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_ota_calendar_event();

-- Índice único para dedup por UID
CREATE UNIQUE INDEX idx_ota_calendar_events_dedup
  ON public.ota_calendar_events (connection_id, external_event_uid)
  WHERE external_event_uid IS NOT NULL;

CREATE INDEX idx_ota_calendar_events_connection
  ON public.ota_calendar_events (connection_id);

CREATE INDEX idx_ota_calendar_events_start_date
  ON public.ota_calendar_events (start_date);

ALTER TABLE public.ota_calendar_events ENABLE ROW LEVEL SECURITY;

-- Security definer: checa acesso via conexão → projeto
CREATE OR REPLACE FUNCTION public.user_owns_ota_connection(_user_id uuid, _connection_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ota_connections oc
    JOIN public.projects p ON p.id = oc.project_id
    WHERE oc.id = _connection_id AND p.user_id = _user_id
  );
$$;

CREATE POLICY "Users can view own ota_calendar_events"
  ON public.ota_calendar_events FOR SELECT TO authenticated
  USING (public.user_owns_ota_connection(auth.uid(), connection_id));

CREATE POLICY "Users can insert own ota_calendar_events"
  ON public.ota_calendar_events FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_ota_connection(auth.uid(), connection_id));

CREATE POLICY "Users can update own ota_calendar_events"
  ON public.ota_calendar_events FOR UPDATE TO authenticated
  USING (public.user_owns_ota_connection(auth.uid(), connection_id))
  WITH CHECK (public.user_owns_ota_connection(auth.uid(), connection_id));

CREATE POLICY "Users can delete own ota_calendar_events"
  ON public.ota_calendar_events FOR DELETE TO authenticated
  USING (public.user_owns_ota_connection(auth.uid(), connection_id));
