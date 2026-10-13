CREATE OR REPLACE VIEW public.radar_bairro_atual WITH (security_invoker = true) AS
SELECT DISTINCT ON (o.cidade, o.bairro, o.indicador)
  o.id, o.indicador, o.bairro, o.cidade, o.periodo_inicio, o.periodo_fim, o.valor, o.unidade,
  o.amostra_n, o.fonte_id, f.nome AS fonte_nome, f.tipo AS fonte_tipo, f.url AS fonte_url,
  f.metodologia_declarada, o.url_origem, o.coletado_em, o.publicado_em, o.observacao,
  (CURRENT_DATE - o.coletado_em) AS idade_dias,
  CASE
    WHEN f.tipo = 'publica' AND COALESCE(o.amostra_n, 0) >= 1000 AND (CURRENT_DATE - o.coletado_em) <= 120 THEN 'alta'
    WHEN f.tipo = 'publica' AND COALESCE(o.amostra_n, 0) >= 200 AND (CURRENT_DATE - o.coletado_em) <= 240 THEN 'media'
    ELSE 'baixa'
  END AS confianca
FROM public.radar_observacoes o
JOIN public.radar_fontes f ON f.id = o.fonte_id
WHERE o.ativo
ORDER BY o.cidade, o.bairro, o.indicador, o.coletado_em DESC, o.periodo_fim DESC NULLS LAST, o.created_at DESC;
GRANT SELECT ON public.radar_bairro_atual TO anon, authenticated, service_role;
COMMENT ON VIEW public.radar_bairro_atual IS 'Observação ativa mais recente por bairro/indicador. Confiança: alta = fonte pública, n>=1000, coleta <=120d; media = fonte pública, n>=200, coleta <=240d; baixa = todo o resto (amostra <200 ou nula, dado velho, fonte estimativa).';