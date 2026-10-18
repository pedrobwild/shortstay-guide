-- Gestão de usuários cadastrados (/admin/usuarios).
-- Só admins leem a lista (e-mail e datas vêm de auth.users, que o cliente não enxerga) e
-- só admins dão ou tiram o papel de admin, sempre pelas RPCs abaixo: elas aplicam as
-- guardas (não tirar o próprio acesso, nunca ficar sem admin, não promover conta bloqueada)
-- e registram cada ação em admin_usuarios_auditoria. Bloquear e desbloquear acesso exigem
-- a API de administração do Auth (service role) e ficam na Edge Function admin-usuarios,
-- que grava na mesma auditoria.
--
-- A policy antiga "Admins can manage roles" (FOR ALL em user_roles) deixava qualquer admin
-- escrever direto na tabela pelo cliente, por fora das guardas e da auditoria. Ninguém no app
-- escreve em user_roles direto (useIsAdmin só lê a própria linha), então ela sai: a escrita
-- passa a ser só pela RPC admin_definir_admin; admins mantêm a leitura.

-- 1) Auditoria das ações de administração de usuários.
-- usuario_id e feito_por são UUID simples (sem FK para auth.users): o registro sobrevive à conta.
CREATE TABLE public.admin_usuarios_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  acao text NOT NULL CHECK (acao IN ('promover_admin', 'remover_admin', 'bloquear', 'desbloquear')),
  motivo text CHECK (motivo IS NULL OR char_length(motivo) <= 300),
  feito_por uuid NOT NULL,
  feito_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_usuarios_auditoria IS 'Quem deu/tirou acesso de admin e quem bloqueou/desbloqueou cada conta. Escrita só pelas RPCs admin_* e pela Edge Function admin-usuarios.';

GRANT SELECT ON public.admin_usuarios_auditoria TO authenticated;
GRANT ALL ON public.admin_usuarios_auditoria TO service_role;
-- Os privilégios padrão do Supabase dão escrita (e TRUNCATE, que ignora RLS) a anon/authenticated: retira.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.admin_usuarios_auditoria FROM anon, authenticated;

ALTER TABLE public.admin_usuarios_auditoria ENABLE ROW LEVEL SECURITY;

-- Leitura só de admin; nenhuma policy de escrita: quem grava são as funções SECURITY DEFINER
-- e a Edge Function (service role), nunca o navegador.
CREATE POLICY "Admins leem a auditoria de usuários"
  ON public.admin_usuarios_auditoria FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX admin_usuarios_auditoria_usuario_idx ON public.admin_usuarios_auditoria (usuario_id, feito_em DESC);

-- 2) Lista paginada de usuários (busca por e-mail ou nome, filtro, ordem estável com id).
-- Devolve só o necessário para administrar a conta: nada de senha, token ou metadados brutos.
CREATE OR REPLACE FUNCTION public.admin_listar_usuarios(
  p_busca text DEFAULT NULL,
  p_filtro text DEFAULT 'todos',
  p_limite integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  email text,
  nome text,
  criado_em timestamptz,
  ultimo_acesso timestamptz,
  email_confirmado boolean,
  bloqueado_ate timestamptz,
  admin boolean,
  projetos integer,
  lead_bairro text,
  lead_criado_em timestamptz,
  total bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_busca text := nullif(btrim(coalesce(p_busca, '')), '');
  v_padrao text;
  v_limite integer := least(greatest(coalesce(p_limite, 50), 1), 200);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE = '42501';
  END IF;
  IF p_filtro IS NOT NULL AND p_filtro NOT IN ('todos', 'admins', 'bloqueados', 'nao_confirmados', 'inativos') THEN
    RAISE EXCEPTION 'Filtro inválido: %.', p_filtro;
  END IF;
  -- Busca literal: % e _ digitados pela pessoa não viram curinga.
  IF v_busca IS NOT NULL THEN
    v_padrao := '%' || replace(replace(replace(left(v_busca, 120), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      u.id,
      u.email::text AS email,
      nullif(btrim(coalesce(p.full_name, u.raw_user_meta_data->>'full_name', '')), '') AS nome,
      u.created_at AS criado_em,
      u.last_sign_in_at AS ultimo_acesso,
      (u.email_confirmed_at IS NOT NULL) AS email_confirmado,
      CASE WHEN u.banned_until > now() THEN u.banned_until END AS bloqueado_ate,
      EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'::public.app_role) AS admin
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.deleted_at IS NULL AND NOT coalesce(u.is_anonymous, false)
  )
  SELECT
    b.id, b.email, b.nome, b.criado_em, b.ultimo_acesso, b.email_confirmado, b.bloqueado_ate, b.admin,
    (SELECT count(*)::integer FROM public.projects pr WHERE pr.user_id = b.id) AS projetos,
    l.neighborhood AS lead_bairro,
    l.created_at AS lead_criado_em,
    count(*) OVER () AS total
  FROM base b
  LEFT JOIN LATERAL (
    SELECT gl.neighborhood, gl.created_at FROM public.guide_leads gl
    WHERE gl.user_id = b.id ORDER BY gl.created_at DESC NULLS LAST, gl.id LIMIT 1
  ) l ON true
  WHERE (v_padrao IS NULL OR b.email ILIKE v_padrao ESCAPE '\' OR b.nome ILIKE v_padrao ESCAPE '\')
    AND CASE coalesce(p_filtro, 'todos')
      WHEN 'admins' THEN b.admin
      WHEN 'bloqueados' THEN b.bloqueado_ate IS NOT NULL
      WHEN 'nao_confirmados' THEN NOT b.email_confirmado
      WHEN 'inativos' THEN b.ultimo_acesso IS NULL OR b.ultimo_acesso < now() - interval '30 days'
      ELSE true
    END
  ORDER BY b.criado_em DESC, b.id
  LIMIT v_limite OFFSET v_offset;
END;
$$;

-- 3) Números do topo da tela (contagens; nenhum dado pessoal).
CREATE OR REPLACE FUNCTION public.admin_resumo_usuarios()
RETURNS TABLE (
  total bigint,
  admins bigint,
  bloqueados bigint,
  nao_confirmados bigint,
  novos_7d bigint,
  ativos_30d bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    count(*),
    count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'::public.app_role)),
    count(*) FILTER (WHERE u.banned_until > now()),
    count(*) FILTER (WHERE u.email_confirmed_at IS NULL),
    count(*) FILTER (WHERE u.created_at >= now() - interval '7 days'),
    count(*) FILTER (WHERE u.last_sign_in_at >= now() - interval '30 days')
  FROM auth.users u
  WHERE u.deleted_at IS NULL AND NOT coalesce(u.is_anonymous, false);
END;
$$;

-- 4) Dar ou tirar o papel de admin, com guardas e auditoria.
CREATE OR REPLACE FUNCTION public.admin_definir_admin(p_usuario uuid, p_admin boolean, p_motivo text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eu uuid := auth.uid();
  v_bloqueado boolean;
  v_mudou integer;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
BEGIN
  IF NOT public.has_role(v_eu, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso exclusivo de administrador.' USING ERRCODE = '42501';
  END IF;
  IF p_usuario IS NULL OR p_admin IS NULL THEN
    RAISE EXCEPTION 'Informe o usuário e o acesso.';
  END IF;
  IF v_motivo IS NOT NULL AND char_length(v_motivo) > 300 THEN
    RAISE EXCEPTION 'O motivo tem no máximo 300 caracteres.';
  END IF;
  -- Uma alteração de admin por vez: duas remoções simultâneas não deixam o Radar sem admin.
  -- A Edge Function admin-usuarios confere o papel de novo depois de bloquear (desfaz se virou admin).
  PERFORM pg_advisory_xact_lock(hashtext('admin_definir_admin'));

  SELECT (u.banned_until IS NOT NULL AND u.banned_until > now()) INTO v_bloqueado
  FROM auth.users u WHERE u.id = p_usuario AND u.deleted_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  IF p_admin THEN
    IF v_bloqueado THEN
      RAISE EXCEPTION 'Desbloqueie a conta antes de dar acesso de administrador.';
    END IF;
    INSERT INTO public.user_roles (user_id, role) VALUES (p_usuario, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    GET DIAGNOSTICS v_mudou = ROW_COUNT;
  ELSE
    IF p_usuario = v_eu THEN
      RAISE EXCEPTION 'Você não pode remover o seu próprio acesso de administrador.';
    END IF;
    -- Precisa sobrar ao menos um admin que consiga entrar (sem bloqueio).
    IF (SELECT count(*) FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id
        WHERE r.role = 'admin'::public.app_role AND r.user_id <> p_usuario
          AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until <= now())) = 0 THEN
      RAISE EXCEPTION 'O Radar precisa de pelo menos um administrador.';
    END IF;
    DELETE FROM public.user_roles WHERE user_id = p_usuario AND role = 'admin'::public.app_role;
    GET DIAGNOSTICS v_mudou = ROW_COUNT;
  END IF;

  IF v_mudou > 0 THEN
    INSERT INTO public.admin_usuarios_auditoria (usuario_id, acao, motivo, feito_por)
    VALUES (p_usuario, CASE WHEN p_admin THEN 'promover_admin' ELSE 'remover_admin' END, v_motivo, v_eu);
  END IF;
  RETURN v_mudou > 0;
END;
$$;

-- Funções nascem executáveis por PUBLIC: só usuários autenticados chamam (e a função barra quem não é admin).
REVOKE ALL ON FUNCTION public.admin_listar_usuarios(text, text, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_resumo_usuarios() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_definir_admin(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_listar_usuarios(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_resumo_usuarios() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_definir_admin(uuid, boolean, text) TO authenticated;

-- 5) user_roles: escrita só pela RPC (sai o FOR ALL antigo); admins continuam lendo todos os papéis.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins leem todos os papéis"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Contagem de projetos por usuário na lista.
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);
