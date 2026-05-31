# Ingestão de inteligência de mercado → `bairro_airbnb_sp`

Pipeline que leva a saída da skill **`airbnb-market-intel-sp`** (métricas de
Airbnb por bairro de São Paulo) para a tabela `bairro_airbnb_sp`, que o app
consome em `useBairroData` para preencher ADR/ocupação por bairro nas projeções.

```
skill airbnb-market-intel-sp  →  CSV estruturado  →  scripts/ingest-bairro-market.mjs  →  bairro_airbnb_sp  →  app
```

A escrita é **idempotente**: o upsert usa a chave única
`(bairro, cidade, periodo_inicio, periodo_fim)` (ver migration
`…_800cc98f…sql`). Re-rodar com o mesmo período atualiza a linha em vez de
duplicar.

## Como rodar

```bash
# valida o CSV sem gravar (recomendado antes de tudo)
npm run ingest:bairro -- ./mercado.csv --dry-run

# grava no Supabase (precisa do service role key — bypassa RLS)
SUPABASE_URL="https://<projeto>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  npm run ingest:bairro -- ./mercado.csv
```

> ⚠️ O `SUPABASE_SERVICE_ROLE_KEY` é secreto e **nunca** deve ser commitado.
> `SUPABASE_URL` é o mesmo valor de `VITE_SUPABASE_URL`.

## Contrato do CSV

Cabeçalho com os nomes **exatos** das colunas de `bairro_airbnb_sp`. Colunas
desconhecidas são ignoradas (com aviso); células vazias viram `NULL`. Veja
`bairro-market-template.csv` para um exemplo pronto.

### Obrigatórias (NOT NULL sem default)

| Coluna                 | Tipo   | Observação                                      |
| ---------------------- | ------ | ----------------------------------------------- |
| `bairro`               | texto  | Nome do bairro (casa com a lista do app).        |
| `periodo_inicio`       | data   | `YYYY-MM-DD`. Início da janela analisada.        |
| `periodo_fim`          | data   | `YYYY-MM-DD`. Fim da janela analisada.           |
| `n_listings_total`     | int    | Tamanho da amostra (n=) total no bairro.         |
| `n_listings_studio_1q` | int    | Quantos da amostra são studio/1 quarto.          |
| `pct_studio_1q`        | fração | `n_listings_studio_1q / n_listings_total` (0–1). |
| `nivel_confianca_dados`| texto  | `alta` \| `media` \| `baixa`.                    |

### Recomendadas (alimentam a UI e o painel)

| Coluna                  | Tipo   | Observação                                            |
| ----------------------- | ------ | ----------------------------------------------------- |
| `cidade`                | texto  | Default `São Paulo` se omitida.                       |
| `adr_medio_studio`      | BRL    | Diária média do segmento studio (absoluto, ex. `350`).|
| `ocupacao_media_studio` | fração | **0–1** (ex. `0.75` = 75%). Ver nota abaixo.          |
| `estadia_media_noites`  | número | Estadia média.                                        |
| `rating_medio`          | número | 0–5.                                                  |
| `percentual_superhost`  | fração | 0–1.                                                  |
| `media_reviews_por_listing` | número |                                                   |
| `area_media_estudio`    | m²     | Default `30` se omitida. Usado para preço por m².     |
| `fonte_primaria`        | texto  | Fonte principal + n= e data (rastreabilidade).        |

Demais colunas de `bairro_airbnb_sp` (políticas de cancelamento, métricas
imobiliárias, scores, yields, riscos) são aceitas pelos mesmos nomes quando a
skill conseguir produzi-las.

### Nota sobre frações (importante)

As colunas `ocupacao_media_studio`, `pct_*`, `percentual_*`, `risco_*`,
`yield_*` e `delta_yield` são `NUMERIC(5,4)` no banco → **frações de 0 a 1**.
Emita `0.75`, **não** `75`. Por segurança, o script detecta valores `> 1`,
assume que veio em percentual, divide por 100 e emite um aviso — mas o correto
é a skill já entregar a fração.

## O que o script faz

1. Faz parse do CSV (suporta aspas, vírgulas e quebras de linha em campos).
2. Coage tipos (int/numérico/fração/data), valida obrigatórios e a faixa de
   frações, e preenche `data_atualizacao = now()`.
3. `--dry-run`: imprime o resumo e o primeiro registro sem gravar.
4. Sem `--dry-run`: faz `upsert` em `bairro_airbnb_sp` com
   `onConflict = (bairro, cidade, periodo_inicio, periodo_fim)`.

## Próximos passos possíveis

- Edge Function para acionar a ingestão sem rodar local.
- Persistir a amostra por anúncio em `raw_listings` (já existe no schema) e
  derivar `bairro_airbnb_sp` por agregação SQL, em vez de receber o agregado
  pronto da skill.
