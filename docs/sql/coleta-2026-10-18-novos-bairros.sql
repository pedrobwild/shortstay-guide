-- Coleta GuestFavorites de 18/10/2026 — 15 bairros novos (+ Consolação, opcional).
-- NÃO EXECUTAR sem a aprovação explícita do Pedro (regra: a base aprovada só muda com aprovação).
-- Dados vão por SQL direto (nunca por migration). Mesmo formato que a RPC admin_registrar_coleta_radar grava:
-- desativa as observações ativas do bairro e insere a coleta nova, preservando o histórico.
-- Alternativa sem SQL: registrar cada bairro em /admin/coletas com os mesmos valores (a RPC faz a validação).
-- Origem de cada número: a página pública do bairro na GuestFavorites (link em cada bloco), lida em 18/10/2026.
-- Períodos: jan–set/2026, exceto Santana, Barra Funda e Consolação (jan–jul/2026).
BEGIN;

-- Santa Cecília — https://www.guestfavorites.com/airbnb-occupancy-rates-in-santa-cecilia-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Santa Cecília' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Santa Cecília', 'São Paulo', '2026-01-01', '2026-09-30', 215, 'BRL',      607, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santa-cecilia-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('ocupacao_media_pct', 'Santa Cecília', 'São Paulo', '2026-01-01', '2026-09-30', 59, 'pct',      607, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santa-cecilia-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_p25_brl',        'Santa Cecília', 'São Paulo', '2026-01-01', '2026-09-30', 53, 'BRL',      607, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santa-cecilia-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_mediana_brl',    'Santa Cecília', 'São Paulo', '2026-01-01', '2026-09-30', 163, 'BRL',      607, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santa-cecilia-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_p75_brl',        'Santa Cecília', 'São Paulo', '2026-01-01', '2026-09-30', 222, 'BRL',      607, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santa-cecilia-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('anuncios_ativos',    'Santa Cecília', 'São Paulo', '2026-01-01', '2026-09-30', 607,   'anuncios', 607, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santa-cecilia-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true);

-- Campo Belo — https://www.guestfavorites.com/airbnb-occupancy-rates-in-campo-belo-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Campo Belo' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Campo Belo', 'São Paulo', '2026-01-01', '2026-09-30', 233, 'BRL',      1077, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-campo-belo-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('ocupacao_media_pct', 'Campo Belo', 'São Paulo', '2026-01-01', '2026-09-30', 60, 'pct',      1077, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-campo-belo-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_p25_brl',        'Campo Belo', 'São Paulo', '2026-01-01', '2026-09-30', 142, 'BRL',      1077, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-campo-belo-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_mediana_brl',    'Campo Belo', 'São Paulo', '2026-01-01', '2026-09-30', 194, 'BRL',      1077, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-campo-belo-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_p75_brl',        'Campo Belo', 'São Paulo', '2026-01-01', '2026-09-30', 252, 'BRL',      1077, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-campo-belo-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('anuncios_ativos',    'Campo Belo', 'São Paulo', '2026-01-01', '2026-09-30', 1077,   'anuncios', 1077, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-campo-belo-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true);

-- Santana — https://www.guestfavorites.com/airbnb-occupancy-rates-in-santana-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Santana' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Santana', 'São Paulo', '2026-01-01', '2026-07-31', 228, 'BRL',      506, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santana-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('ocupacao_media_pct', 'Santana', 'São Paulo', '2026-01-01', '2026-07-31', 61, 'pct',      506, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santana-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('adr_p25_brl',        'Santana', 'São Paulo', '2026-01-01', '2026-07-31', 160, 'BRL',      506, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santana-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('adr_mediana_brl',    'Santana', 'São Paulo', '2026-01-01', '2026-07-31', 205, 'BRL',      506, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santana-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('adr_p75_brl',        'Santana', 'São Paulo', '2026-01-01', '2026-07-31', 254, 'BRL',      506, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santana-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('anuncios_ativos',    'Santana', 'São Paulo', '2026-01-01', '2026-07-31', 506,   'anuncios', 506, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santana-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true);

-- Tatuapé — https://www.guestfavorites.com/airbnb-occupancy-rates-in-tatuape-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Tatuapé' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Tatuapé', 'São Paulo', '2026-01-01', '2026-09-30', 249, 'BRL',      422, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-tatuape-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('ocupacao_media_pct', 'Tatuapé', 'São Paulo', '2026-01-01', '2026-09-30', 58, 'pct',      422, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-tatuape-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_p25_brl',        'Tatuapé', 'São Paulo', '2026-01-01', '2026-09-30', 157, 'BRL',      422, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-tatuape-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_mediana_brl',    'Tatuapé', 'São Paulo', '2026-01-01', '2026-09-30', 220, 'BRL',      422, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-tatuape-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_p75_brl',        'Tatuapé', 'São Paulo', '2026-01-01', '2026-09-30', 268, 'BRL',      422, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-tatuape-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('anuncios_ativos',    'Tatuapé', 'São Paulo', '2026-01-01', '2026-09-30', 422,   'anuncios', 422, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-tatuape-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true);

-- Barra Funda — https://www.guestfavorites.com/airbnb-occupancy-rates-in-barra-funda-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Barra Funda' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Barra Funda', 'São Paulo', '2026-01-01', '2026-07-31', 257, 'BRL',      549, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-barra-funda-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('ocupacao_media_pct', 'Barra Funda', 'São Paulo', '2026-01-01', '2026-07-31', 57, 'pct',      549, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-barra-funda-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('adr_p25_brl',        'Barra Funda', 'São Paulo', '2026-01-01', '2026-07-31', 196, 'BRL',      549, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-barra-funda-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('adr_mediana_brl',    'Barra Funda', 'São Paulo', '2026-01-01', '2026-07-31', 235, 'BRL',      549, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-barra-funda-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('adr_p75_brl',        'Barra Funda', 'São Paulo', '2026-01-01', '2026-07-31', 281, 'BRL',      549, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-barra-funda-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true),
  ('anuncios_ativos',    'Barra Funda', 'São Paulo', '2026-01-01', '2026-07-31', 549,   'anuncios', 549, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-barra-funda-sao-paulo-brazil', '2026-10-18', '2026-08-19', 'Período jan–jul/2026 (página atualizada em 19/08/2026).', true);

-- Butantã — https://www.guestfavorites.com/airbnb-occupancy-rates-in-butanta-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Butantã' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Butantã', 'São Paulo', '2026-01-01', '2026-09-30', 276, 'BRL',      402, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-butanta-sao-paulo-brazil', '2026-10-18', '2026-10-16', NULL, true),
  ('ocupacao_media_pct', 'Butantã', 'São Paulo', '2026-01-01', '2026-09-30', 61, 'pct',      402, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-butanta-sao-paulo-brazil', '2026-10-18', '2026-10-16', NULL, true),
  ('adr_p25_brl',        'Butantã', 'São Paulo', '2026-01-01', '2026-09-30', 87, 'BRL',      402, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-butanta-sao-paulo-brazil', '2026-10-18', '2026-10-16', NULL, true),
  ('adr_mediana_brl',    'Butantã', 'São Paulo', '2026-01-01', '2026-09-30', 207, 'BRL',      402, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-butanta-sao-paulo-brazil', '2026-10-18', '2026-10-16', NULL, true),
  ('adr_p75_brl',        'Butantã', 'São Paulo', '2026-01-01', '2026-09-30', 268, 'BRL',      402, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-butanta-sao-paulo-brazil', '2026-10-18', '2026-10-16', NULL, true),
  ('anuncios_ativos',    'Butantã', 'São Paulo', '2026-01-01', '2026-09-30', 402,   'anuncios', 402, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-butanta-sao-paulo-brazil', '2026-10-18', '2026-10-16', NULL, true);

-- Saúde — https://www.guestfavorites.com/airbnb-occupancy-rates-in-saude-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Saúde' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Saúde', 'São Paulo', '2026-01-01', '2026-09-30', 247, 'BRL',      525, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-saude-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('ocupacao_media_pct', 'Saúde', 'São Paulo', '2026-01-01', '2026-09-30', 63, 'pct',      525, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-saude-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_p25_brl',        'Saúde', 'São Paulo', '2026-01-01', '2026-09-30', 120, 'BRL',      525, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-saude-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_mediana_brl',    'Saúde', 'São Paulo', '2026-01-01', '2026-09-30', 191, 'BRL',      525, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-saude-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_p75_brl',        'Saúde', 'São Paulo', '2026-01-01', '2026-09-30', 243, 'BRL',      525, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-saude-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('anuncios_ativos',    'Saúde', 'São Paulo', '2026-01-01', '2026-09-30', 525,   'anuncios', 525, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-saude-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true);

-- Ipiranga — https://www.guestfavorites.com/airbnb-occupancy-rates-in-ipiranga-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Ipiranga' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Ipiranga', 'São Paulo', '2026-01-01', '2026-09-30', 226, 'BRL',      238, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-ipiranga-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('ocupacao_media_pct', 'Ipiranga', 'São Paulo', '2026-01-01', '2026-09-30', 56, 'pct',      238, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-ipiranga-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_p25_brl',        'Ipiranga', 'São Paulo', '2026-01-01', '2026-09-30', 89, 'BRL',      238, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-ipiranga-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_mediana_brl',    'Ipiranga', 'São Paulo', '2026-01-01', '2026-09-30', 171, 'BRL',      238, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-ipiranga-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_p75_brl',        'Ipiranga', 'São Paulo', '2026-01-01', '2026-09-30', 228, 'BRL',      238, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-ipiranga-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('anuncios_ativos',    'Ipiranga', 'São Paulo', '2026-01-01', '2026-09-30', 238,   'anuncios', 238, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-ipiranga-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true);

-- Morumbi — https://www.guestfavorites.com/airbnb-occupancy-rates-in-morumbi-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Morumbi' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Morumbi', 'São Paulo', '2026-01-01', '2026-09-30', 487, 'BRL',      334, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-morumbi-sao-paulo-brazil', '2026-10-18', '2026-10-02', 'Diária média acima da mediana (R$ 323): anúncios de alto valor na amostra.', true),
  ('ocupacao_media_pct', 'Morumbi', 'São Paulo', '2026-01-01', '2026-09-30', 56, 'pct',      334, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-morumbi-sao-paulo-brazil', '2026-10-18', '2026-10-02', 'Diária média acima da mediana (R$ 323): anúncios de alto valor na amostra.', true),
  ('adr_p25_brl',        'Morumbi', 'São Paulo', '2026-01-01', '2026-09-30', 204, 'BRL',      334, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-morumbi-sao-paulo-brazil', '2026-10-18', '2026-10-02', 'Diária média acima da mediana (R$ 323): anúncios de alto valor na amostra.', true),
  ('adr_mediana_brl',    'Morumbi', 'São Paulo', '2026-01-01', '2026-09-30', 323, 'BRL',      334, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-morumbi-sao-paulo-brazil', '2026-10-18', '2026-10-02', 'Diária média acima da mediana (R$ 323): anúncios de alto valor na amostra.', true),
  ('adr_p75_brl',        'Morumbi', 'São Paulo', '2026-01-01', '2026-09-30', 574, 'BRL',      334, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-morumbi-sao-paulo-brazil', '2026-10-18', '2026-10-02', 'Diária média acima da mediana (R$ 323): anúncios de alto valor na amostra.', true),
  ('anuncios_ativos',    'Morumbi', 'São Paulo', '2026-01-01', '2026-09-30', 334,   'anuncios', 334, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-morumbi-sao-paulo-brazil', '2026-10-18', '2026-10-02', 'Diária média acima da mediana (R$ 323): anúncios de alto valor na amostra.', true);

-- Santo Amaro — https://www.guestfavorites.com/airbnb-occupancy-rates-in-santo-amaro-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Santo Amaro' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Santo Amaro', 'São Paulo', '2026-01-01', '2026-09-30', 256, 'BRL',      1488, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santo-amaro-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('ocupacao_media_pct', 'Santo Amaro', 'São Paulo', '2026-01-01', '2026-09-30', 56, 'pct',      1488, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santo-amaro-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_p25_brl',        'Santo Amaro', 'São Paulo', '2026-01-01', '2026-09-30', 152, 'BRL',      1488, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santo-amaro-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_mediana_brl',    'Santo Amaro', 'São Paulo', '2026-01-01', '2026-09-30', 201, 'BRL',      1488, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santo-amaro-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('adr_p75_brl',        'Santo Amaro', 'São Paulo', '2026-01-01', '2026-09-30', 256, 'BRL',      1488, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santo-amaro-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true),
  ('anuncios_ativos',    'Santo Amaro', 'São Paulo', '2026-01-01', '2026-09-30', 1488,   'anuncios', 1488, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-santo-amaro-sao-paulo-brazil', '2026-10-18', '2026-10-15', NULL, true);

-- Jabaquara — https://www.guestfavorites.com/airbnb-occupancy-rates-in-jabaquara-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Jabaquara' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Jabaquara', 'São Paulo', '2026-01-01', '2026-09-30', 227, 'BRL',      417, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-jabaquara-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('ocupacao_media_pct', 'Jabaquara', 'São Paulo', '2026-01-01', '2026-09-30', 55, 'pct',      417, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-jabaquara-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('adr_p25_brl',        'Jabaquara', 'São Paulo', '2026-01-01', '2026-09-30', 110, 'BRL',      417, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-jabaquara-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('adr_mediana_brl',    'Jabaquara', 'São Paulo', '2026-01-01', '2026-09-30', 183, 'BRL',      417, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-jabaquara-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('adr_p75_brl',        'Jabaquara', 'São Paulo', '2026-01-01', '2026-09-30', 248, 'BRL',      417, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-jabaquara-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('anuncios_ativos',    'Jabaquara', 'São Paulo', '2026-01-01', '2026-09-30', 417,   'anuncios', 417, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-jabaquara-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true);

-- Sé — https://www.guestfavorites.com/airbnb-occupancy-rates-in-se-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Sé' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Sé', 'São Paulo', '2026-01-01', '2026-09-30', 184, 'BRL',      502, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-se-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('ocupacao_media_pct', 'Sé', 'São Paulo', '2026-01-01', '2026-09-30', 64, 'pct',      502, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-se-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_p25_brl',        'Sé', 'São Paulo', '2026-01-01', '2026-09-30', 133, 'BRL',      502, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-se-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_mediana_brl',    'Sé', 'São Paulo', '2026-01-01', '2026-09-30', 160, 'BRL',      502, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-se-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('adr_p75_brl',        'Sé', 'São Paulo', '2026-01-01', '2026-09-30', 190, 'BRL',      502, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-se-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true),
  ('anuncios_ativos',    'Sé', 'São Paulo', '2026-01-01', '2026-09-30', 502,   'anuncios', 502, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-se-sao-paulo-brazil', '2026-10-18', '2026-10-08', NULL, true);

-- Brás — https://www.guestfavorites.com/airbnb-occupancy-rates-in-bras-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Brás' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Brás', 'São Paulo', '2026-01-01', '2026-09-30', 217, 'BRL',      798, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bras-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('ocupacao_media_pct', 'Brás', 'São Paulo', '2026-01-01', '2026-09-30', 65, 'pct',      798, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bras-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('adr_p25_brl',        'Brás', 'São Paulo', '2026-01-01', '2026-09-30', 122, 'BRL',      798, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bras-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('adr_mediana_brl',    'Brás', 'São Paulo', '2026-01-01', '2026-09-30', 167, 'BRL',      798, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bras-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('adr_p75_brl',        'Brás', 'São Paulo', '2026-01-01', '2026-09-30', 256, 'BRL',      798, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bras-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true),
  ('anuncios_ativos',    'Brás', 'São Paulo', '2026-01-01', '2026-09-30', 798,   'anuncios', 798, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bras-sao-paulo-brazil', '2026-10-18', '2026-10-02', NULL, true);

-- Bom Retiro — https://www.guestfavorites.com/airbnb-occupancy-rates-in-bom-retiro-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Bom Retiro' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Bom Retiro', 'São Paulo', '2026-01-01', '2026-09-30', 189, 'BRL',      187, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bom-retiro-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (187 anúncios).', true),
  ('ocupacao_media_pct', 'Bom Retiro', 'São Paulo', '2026-01-01', '2026-09-30', 60, 'pct',      187, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bom-retiro-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (187 anúncios).', true),
  ('adr_p25_brl',        'Bom Retiro', 'São Paulo', '2026-01-01', '2026-09-30', 120, 'BRL',      187, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bom-retiro-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (187 anúncios).', true),
  ('adr_mediana_brl',    'Bom Retiro', 'São Paulo', '2026-01-01', '2026-09-30', 170, 'BRL',      187, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bom-retiro-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (187 anúncios).', true),
  ('adr_p75_brl',        'Bom Retiro', 'São Paulo', '2026-01-01', '2026-09-30', 204, 'BRL',      187, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bom-retiro-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (187 anúncios).', true),
  ('anuncios_ativos',    'Bom Retiro', 'São Paulo', '2026-01-01', '2026-09-30', 187,   'anuncios', 187, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-bom-retiro-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (187 anúncios).', true);

-- Lapa — https://www.guestfavorites.com/airbnb-occupancy-rates-in-lapa-sao-paulo-brazil
UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Lapa' AND cidade = 'São Paulo' AND ativo;
INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
  ('adr_medio_brl',      'Lapa', 'São Paulo', '2026-01-01', '2026-09-30', 239, 'BRL',      160, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-lapa-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (160 anúncios).', true),
  ('ocupacao_media_pct', 'Lapa', 'São Paulo', '2026-01-01', '2026-09-30', 57, 'pct',      160, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-lapa-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (160 anúncios).', true),
  ('adr_p25_brl',        'Lapa', 'São Paulo', '2026-01-01', '2026-09-30', 125, 'BRL',      160, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-lapa-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (160 anúncios).', true),
  ('adr_mediana_brl',    'Lapa', 'São Paulo', '2026-01-01', '2026-09-30', 190, 'BRL',      160, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-lapa-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (160 anúncios).', true),
  ('adr_p75_brl',        'Lapa', 'São Paulo', '2026-01-01', '2026-09-30', 247, 'BRL',      160, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-lapa-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (160 anúncios).', true),
  ('anuncios_ativos',    'Lapa', 'São Paulo', '2026-01-01', '2026-09-30', 160,   'anuncios', 160, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-lapa-sao-paulo-brazil', '2026-10-18', '2026-10-08', 'Amostra pequena (160 anúncios).', true);

-- Consolação: só se o Pedro aprovar a troca da estimativa Bewild pelo dado público.
-- (descomente o bloco abaixo)
-- -- Consolação — https://www.guestfavorites.com/airbnb-occupancy-rates-in-consolacao-sao-paulo-brazil
-- UPDATE public.radar_observacoes SET ativo = false WHERE bairro = 'Consolação' AND cidade = 'São Paulo' AND ativo;
-- INSERT INTO public.radar_observacoes (indicador, bairro, cidade, periodo_inicio, periodo_fim, valor, unidade, amostra_n, fonte_id, url_origem, coletado_em, publicado_em, observacao, ativo) VALUES
--   ('adr_medio_brl',      'Consolação', 'São Paulo', '2026-01-01', '2026-07-31', 271, 'BRL',      1625, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-consolacao-sao-paulo-brazil', '2026-10-18', '2026-08-20', 'Substitui a estimativa Bewild (R$ 325 / 63%): a GuestFavorites passou a publicar a página do bairro. Período jan–jul/2026.', true),
--   ('ocupacao_media_pct', 'Consolação', 'São Paulo', '2026-01-01', '2026-07-31', 62, 'pct',      1625, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-consolacao-sao-paulo-brazil', '2026-10-18', '2026-08-20', 'Substitui a estimativa Bewild (R$ 325 / 63%): a GuestFavorites passou a publicar a página do bairro. Período jan–jul/2026.', true),
--   ('adr_p25_brl',        'Consolação', 'São Paulo', '2026-01-01', '2026-07-31', 155, 'BRL',      1625, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-consolacao-sao-paulo-brazil', '2026-10-18', '2026-08-20', 'Substitui a estimativa Bewild (R$ 325 / 63%): a GuestFavorites passou a publicar a página do bairro. Período jan–jul/2026.', true),
--   ('adr_mediana_brl',    'Consolação', 'São Paulo', '2026-01-01', '2026-07-31', 221, 'BRL',      1625, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-consolacao-sao-paulo-brazil', '2026-10-18', '2026-08-20', 'Substitui a estimativa Bewild (R$ 325 / 63%): a GuestFavorites passou a publicar a página do bairro. Período jan–jul/2026.', true),
--   ('adr_p75_brl',        'Consolação', 'São Paulo', '2026-01-01', '2026-07-31', 281, 'BRL',      1625, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-consolacao-sao-paulo-brazil', '2026-10-18', '2026-08-20', 'Substitui a estimativa Bewild (R$ 325 / 63%): a GuestFavorites passou a publicar a página do bairro. Período jan–jul/2026.', true),
--   ('anuncios_ativos',    'Consolação', 'São Paulo', '2026-01-01', '2026-07-31', 1625,   'anuncios', 1625, 'guestfavorites', 'https://www.guestfavorites.com/airbnb-occupancy-rates-in-consolacao-sao-paulo-brazil', '2026-10-18', '2026-08-20', 'Substitui a estimativa Bewild (R$ 325 / 63%): a GuestFavorites passou a publicar a página do bairro. Período jan–jul/2026.', true);

COMMIT;
