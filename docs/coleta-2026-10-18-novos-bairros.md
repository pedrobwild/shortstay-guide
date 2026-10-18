# Coleta GuestFavorites de 18/10/2026 — base de 28 bairros

**Status: aprovada pelo Pedro e carregada no banco em 18/10/2026** (15 bairros novos + Consolação como dado público), via SQL direto em `radar_observacoes`, preservando o histórico. `bairrosCurados.ts` (reserva offline) e os demais arquivos deste PR trazem os mesmos números.

Leitura das páginas públicas da GuestFavorites em 18/10/2026 (`https://www.guestfavorites.com/airbnb-occupancy-rates-in-{slug}-sao-paulo-brazil`). Valores como estão nas páginas: ocupação e diária média do cabeçalho; quartis da tabela de faixas de preço (25% mais baratos / mediana / 25% mais caros); anúncios ativos.

## 15 bairros novos (13 → 28)

| Bairro | Ocupação | Diária | Quartis (P25 / mediana / P75) | Anúncios | Período | Página atualizada em | Observação |
|---|---|---|---|---|---|---|---|
| Santa Cecília | 59% | R$ 215 | 53 / 163 / 222 | 607 | jan–set/2026 | 15/10/2026 | P25 muito baixo na página (R$ 53), como na Mooca; conferir. |
| Campo Belo | 60% | R$ 233 | 142 / 194 / 252 | 1.077 | jan–set/2026 | 08/10/2026 |  |
| Santana | 61% | R$ 228 | 160 / 205 / 254 | 506 | jan–jul/2026 | 19/08/2026 | Período jan–jul/2026 (página atualizada em 19/08/2026). |
| Tatuapé | 58% | R$ 249 | 157 / 220 / 268 | 422 | jan–set/2026 | 15/10/2026 |  |
| Barra Funda | 57% | R$ 257 | 196 / 235 / 281 | 549 | jan–jul/2026 | 19/08/2026 | Período jan–jul/2026 (página atualizada em 19/08/2026). |
| Butantã | 61% | R$ 276 | 87 / 207 / 268 | 402 | jan–set/2026 | 16/10/2026 | P25 baixo na página (R$ 87); conferir. |
| Saúde | 63% | R$ 247 | 120 / 191 / 243 | 525 | jan–set/2026 | 15/10/2026 |  |
| Ipiranga | 56% | R$ 226 | 89 / 171 / 228 | 238 | jan–set/2026 | 08/10/2026 | P25 baixo na página (R$ 89); conferir. |
| Morumbi | 56% | R$ 487 | 204 / 323 / 574 | 334 | jan–set/2026 | 02/10/2026 | Diária média puxada por anúncios de alto valor (mediana R$ 323). |
| Santo Amaro | 56% | R$ 256 | 152 / 201 / 256 | 1.488 | jan–set/2026 | 15/10/2026 |  |
| Jabaquara | 55% | R$ 227 | 110 / 183 / 248 | 417 | jan–set/2026 | 02/10/2026 |  |
| Sé | 64% | R$ 184 | 133 / 160 / 190 | 502 | jan–set/2026 | 08/10/2026 |  |
| Brás | 65% | R$ 217 | 122 / 167 / 256 | 798 | jan–set/2026 | 02/10/2026 |  |
| Bom Retiro | 60% | R$ 189 | 120 / 170 / 204 | 187 | jan–set/2026 | 08/10/2026 | Amostra pequena (187 anúncios). |
| Lapa | 57% | R$ 239 | 125 / 190 / 247 | 160 | jan–set/2026 | 08/10/2026 | Amostra pequena (160 anúncios). |

Critério de escolha: todos os bairros da cidade de São Paulo com página na GuestFavorites e amostra razoável. Bom Retiro (187) e Lapa (160) ficam com o aviso de amostra pequena (regra já existente: n < 200), como a Mooca. Ficaram de fora por amostra muito pequena: Vila Andrade (154), Penha (79), Vila Prudente (77), Vila Leopoldina (38), Cambuci (35). Sem página na GuestFavorites: Vila Madalena, Higienópolis, Paraíso, Aclimação, Jardins, Brooklin, Vila Olímpia.

## Consolação (troca aprovada em 18/10/2026)

A GuestFavorites passou a publicar a página da Consolação: **62% · R$ 271 · quartis 155 / 221 / 281 · 1.625 anúncios · jan–jul/2026** (atualizada em 20/08/2026). O Radar mostrava a estimativa Bewild (R$ 325 / 63%, sem fonte pública); com a troca, o bairro é dado observado e a estimativa ficou inativa no histórico. A AirDNA segue prevista só para Brooklin e Vila Olímpia (a RPC ainda aceita Consolação; mudar isso exige migration).

## Pontos a conferir antes de aprovar

- P25 muito baixo em Santa Cecília (R$ 53), Butantã (R$ 87) e Ipiranga (R$ 89) — mesmo padrão da Mooca (R$ 27); a página mostra assim.
- Morumbi: diária média R$ 487 bem acima da mediana (R$ 323) — anúncios de alto valor puxam a média; o Radar mostra a média (ADR), como nos demais.
- Santana e Barra Funda: período jan–jul/2026; páginas atualizadas em 19/08/2026 (ainda dentro dos 240 dias da regra de confiança).

## Como carregar depois de aprovado

1. **Sem SQL:** registrar cada bairro em `/admin/coletas` (fonte GuestFavorites, período, coleta 18/10/2026, publicação, amostra, link e indicadores). A RPC valida e preserva o histórico.
2. **Com SQL:** `docs/sql/coleta-2026-10-18-novos-bairros.sql` (mesmo efeito da RPC; dados por SQL direto, nunca por migration). O bloco da Consolação está comentado.

Depois da carga: mesclar este PR (reserva offline, mapa, artigos nas frases, páginas de bairro, chat) e reimplantar a função `chat` no serviço compartilhado.

## O que este PR muda no código (vale só com a carga)

- `src/data/bairrosCurados.ts`: 15 entradas novas na reserva offline (mesmos números da tabela).
- `src/data/bairrosGeo.ts`: centro aproximado de cada bairro novo no mapa (geografia, não dado de mercado).
- `src/lib/radarUi.ts`: artigo de cada bairro novo nas frases do comparador.
- `src/data/seoRoutes.json`: páginas `/bairro/{slug}` dos bairros novos na pré-renderização e no sitemap.
- Página de bairro e `/ranking`: bairro que só existe na base do Radar (sem a estimativa de mercado — base 2025) mostra os números da base, fonte, quartis, variação e próximos passos, em vez de "não há dados".
- Função `chat`: bairros que só existem na base do Radar entram no contexto (sem scores); o texto "15 bairros analisados" vira "bairros listados".
