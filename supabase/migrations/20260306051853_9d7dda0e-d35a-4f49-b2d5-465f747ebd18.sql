
CREATE TABLE public.raw_listings (
    listing_id              VARCHAR(50) PRIMARY KEY,
    url                     TEXT NOT NULL,
    titulo                  TEXT,
    descricao_resumida      TEXT,
    bairro                  VARCHAR(100) NOT NULL,
    cidade                  VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    latitude                NUMERIC(9,6),
    longitude               NUMERIC(9,6),
    unit_type               VARCHAR(30) NOT NULL DEFAULT 'desconhecido',
    bedrooms                INTEGER,
    beds                    INTEGER,
    bathrooms               NUMERIC(3,1),
    capacidade_hospedes     INTEGER,
    area_m2                 NUMERIC(10,2),
    amenities               JSONB DEFAULT '[]'::jsonb,
    preco_noite_atual       NUMERIC(10,2),
    moeda                   VARCHAR(10) NOT NULL DEFAULT 'BRL',
    min_noites              INTEGER,
    max_noites              INTEGER,
    disponibilidade_30d     INTEGER,
    disponibilidade_90d     INTEGER,
    disponibilidade_365d    INTEGER,
    ocupacao_estimada       NUMERIC(5,4),
    receita_anual_estimada  NUMERIC(12,2),
    adr_estimado            NUMERIC(10,2),
    estadia_media_noites    NUMERIC(5,2),
    rating_geral            NUMERIC(3,2),
    n_reviews               INTEGER,
    is_superhost            BOOLEAN DEFAULT FALSE,
    politica_cancelamento   VARCHAR(50) DEFAULT 'desconhecido',
    regras_casa_texto       TEXT,
    data_primeira_reserva   DATE,
    data_coleta             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fonte                   VARCHAR(50) NOT NULL
);

ALTER TABLE public.raw_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on raw_listings"
ON public.raw_listings FOR SELECT
TO anon, authenticated
USING (true);

CREATE TABLE public.bairro_airbnb_sp (
    id                              BIGSERIAL PRIMARY KEY,
    bairro                          VARCHAR(100) NOT NULL,
    cidade                          VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    periodo_inicio                  DATE NOT NULL,
    periodo_fim                     DATE NOT NULL,
    n_listings_total                INTEGER NOT NULL,
    n_listings_studio_1q            INTEGER NOT NULL,
    pct_studio_1q                   NUMERIC(5,4) NOT NULL,
    adr_medio_studio                NUMERIC(10,2),
    ocupacao_media_studio           NUMERIC(5,4),
    receita_anual_media_studio      NUMERIC(12,2),
    estadia_media_noites            NUMERIC(5,2),
    porcentagem_reservas_30d_plus   NUMERIC(5,4),
    rating_medio                    NUMERIC(3,2),
    percentual_superhost            NUMERIC(5,4),
    media_reviews_por_listing       NUMERIC(8,2),
    pct_politica_flexivel           NUMERIC(5,4),
    pct_politica_moderada           NUMERIC(5,4),
    pct_politica_rigida             NUMERIC(5,4),
    preco_m2_residencial_medio      NUMERIC(12,2),
    aluguel_mensal_long_term_medio  NUMERIC(10,2),
    dias_medio_venda_imovel         INTEGER,
    numero_transacoes_imobiliarias_ano INTEGER,
    indice_criminalidade            NUMERIC(5,2),
    grau_saturacao_index            NUMERIC(6,4),
    risco_regulatorio               NUMERIC(5,4),
    risco_condominio                NUMERIC(5,4),
    area_media_estudio              NUMERIC(6,2) NOT NULL DEFAULT 30.00,
    yield_bruto_airbnb              NUMERIC(6,4),
    yield_bruto_long_term           NUMERIC(6,4),
    delta_yield                     NUMERIC(6,4),
    score_rentabilidade             NUMERIC(5,2),
    score_liquidez                  NUMERIC(5,2),
    score_crescimento_potencial     NUMERIC(5,2),
    nivel_confianca_dados           VARCHAR(20) NOT NULL,
    fonte_primaria                  VARCHAR(150),
    data_atualizacao                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.bairro_airbnb_sp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on bairro_airbnb_sp"
ON public.bairro_airbnb_sp FOR SELECT
TO anon, authenticated
USING (true);
