# Coletas de dados de mercado

Registro bruto das coletas usadas pelo Radar Bewild. Cada arquivo guarda o que
estava publicado na fonte no dia da coleta, sem estimar nem converter. Os
valores exibidos no app vêm de `src/data/bairrosCurados.ts`; este diretório é a
trilha de auditoria desses números.

## guestfavorites-2026-10-13.csv

- **Fonte:** páginas públicas "Airbnb Occupancy Rates in <Bairro>, São Paulo"
  de guestfavorites.com.
- **Coleta:** 13/10/2026, leitura das páginas.
- **Cobertura:** 10 bairros com página, mais a referência da cidade. Brooklin,
  Consolação, Vila Olímpia, Vila Nova Conceição, Barra Funda, Campo Belo e
  Butantã não foram encontrados nesta coleta (`status = nao_encontrado`).
- **Período:** jan–set/2026 nas páginas atualizadas em outubro; jan–jul/2026
  em Liberdade e República (páginas atualizadas em 20/08/2026).

### Colunas

- `ocupacao_destaque_pct`, `adr_destaque_brl` e `receita_anual_destaque_brl`:
  número em destaque na página. São estes que o app usa.
- `*_top10`, `*_top25`, `*_mediana` e `*_bottom25`: faixas de desempenho da
  tabela da página. O app usa a diária de `bottom25`, `mediana` e `top25`
  como "25% mais baratos / mediana / 25% mais caros".

### Ressalvas da fonte

- A página não declara a metodologia.
- O número em destaque aparece como "typical" ou "average" e é sempre maior que
  a faixa "mediana" da mesma página. Por isso o app o chama de
  "ocupação/diária média", não de mediana.
- A receita anual leva o rótulo "Median Annual Revenue", mas o texto a chama de
  média.
- Os números não são específicos de studio.

## Atualização

1. Refaça a coleta nas mesmas páginas.
2. Salve um novo arquivo `guestfavorites-AAAA-MM-DD.csv`.
3. Atualize `src/data/bairrosCurados.ts` e a cópia em
   `supabase/functions/chat/index.ts`.
4. Atualize os mesmos números nas páginas `/reforma/<bairro>` do site
   bewild.com.br (`src/content/bairros.ts` no repositório do site), para os
   dois nunca divergirem.
