# Onda 2 — referência em dados: coleta assistida, /metodologia, dados abertos, histórico e sugestão de reforma

PR #40 (https://github.com/pedrobwild/shortstay-guide/pull/40, branch `claude/onda-2-metodologia-dados`). Não publicado. Migration já aplicada no banco em 18/10/2026.

## Correção da carga de 18/10
Seis bairros tinham sido lidos de páginas em cache. Valores ao vivo (jan–set/2026) carregados por UPDATE direto: Santana 62% / R$ 229 / 164-207-257 / 510; Barra Funda 57% / R$ 255 / 193-233-279 / 559; Consolação 63% / R$ 270 / 160-220-282 / 1.567; Brás P75 255 / 841 anúncios; Jabaquara R$ 228 / 421; Morumbi 57% / R$ 485 / 330. **As instruções do projeto no claude.ai ainda trazem os valores antigos desses seis bairros** — atualizar quando possível. Lição registrada: conferir a página ao vivo antes de registrar (motivo da coleta assistida).

## Coleta assistida (nada entra sem aprovação)
- Banco: `radar_coletas_pendentes` (GRANT → RLS → policy só admin), `admin_aprovar_coleta_pendente(uuid)` (chama `admin_registrar_coleta_radar`, mesmas validações, histórico preservado), `admin_descartar_coleta_pendente(uuid, motivo)`. A duplicidade da RPC passou a considerar `coletado_em` (a GuestFavorites revisa números dentro do mesmo rótulo de período).
- Parser puro `src/lib/guestfavoritesParser.ts` (ocupação, diária, quartis, anúncios, período, "Last updated"); cópia idêntica em `supabase/functions/coletar-guestfavorites/parser.ts`, conferida por teste com fixture real (Santana).
- Edge Function `coletar-guestfavorites`: só admin (JWT + `has_role`), lê os bairros com fonte GuestFavorites em `radar_bairro_atual` + São Paulo, compara e grava propostas (`atual` guarda o que vale hoje). Página sem leitura completa → erro no resumo, sem número inventado. Deploy acontece com o push para main (Lovable).
- `/admin/coletas` → seção "Coleta assistida": botão "Ler páginas agora", resumo da rodada, lista de propostas com antes → depois por indicador e período, Aprovar (confirmação) / Descartar (motivo). Após aprovar, atualizar `bairrosCurados.ts` no código para a reserva seguir igual (regra um bairro, um número).
- Primeira rodada esperada: Pinheiros (63% / R$ 299 / 2.452), Liberdade (jan–set), Mooca (58% / R$ 243 / 90), São Paulo (60% / R$ 265 / 35.077) e outros bairros de 13/10 — aprovação do Pedro.

## /metodologia (pré-renderizada, no sitemap)
Fontes (três tipos de número via `textosFontes`), o que é lido na página pública, selo de confiança (critério interno), cálculos (DRE de `dreGuia.ts`, investimento total, rentabilidade/prazo), reforma (estudo Bewild), atualização com **registro de atualizações** (de `radar_observacoes`, por data e fonte: bairros novos vs. atualizados; estimativa Bewild e a cidade ficam fora), dados abertos, limites. Links: rodapé ("Metodologia e dados abertos") e seção Fontes da home.

## Dados abertos
- `scripts/prerender.mjs` gera `/dados/bairros.csv` (ponto e vírgula, BOM) e `/dados/bairros.json` a partir da reserva offline (mesmos números do banco por regra), via `src/lib/dadosAbertos.ts`: natureza, fonte, ocupação, diária, quartis, anúncios, receita de referência, período, data de coleta, link de origem, aviso.
- Dataset schema.org em `/metodologia` e `/ranking` (publisher = nó #org da Bewild; `isBasedOn` GuestFavorites).
- **Decisão pendente do Pedro: licença.** Proposta CC BY 4.0 (uso livre com citação); constante única `LICENCA_DADOS` em `dadosAbertos.ts`.

## Histórico por bairro
`src/lib/historicoRadar.ts` (leitura pública paginada + reserva offline) alimenta `HistoricoBairro` nas páginas de bairro: tabela de coletas (data, fonte, período, diária, ocupação, anúncios) e mini-série SVG quando há 2+ coletas da fonte em uso. Some em bairro com ajuste manual (um bairro, um número).

## Simulador — sugestão de reforma (pedido do Pedro em 18/10/2026)
- `reforma: number | null` nas premissas; `null` = sugestão. `reformaSugerida(area, diaria, diariaMediaBairro)`: área de referência da faixa (20–25 → 25 m², 26–35 → 30 m², 36–50 → 45 m²) × custo/m².
- Custo/m²: mediana do estudo (R$ 2.744) na diária média do bairro; cresce linearmente com a razão diária ÷ média até R$ 4.000/m² em 1,45× (alto padrão) — referência do Pedro: 25 m² alto padrão = R$ 100.000 (`CUSTO_M2_ALTO_PADRAO` em provasBewild.ts). Piso P25 (R$ 2.457), teto em 2× a média, arredondado a R$ 500, nunca abaixo de R$ 55 mil. Diária ajustada à mão também move a sugestão.
- Tela: ajuda explica "25 m² × R$ 4.000/m² (hipótese)"; valor informado prevalece com "Voltar à sugestão". Investimento total mostra "(sugerida)" quando é a sugestão.
- Locação tradicional usa a sugestão do nível básico. Links antigos com `reforma=` continuam valendo como valor informado.

## Verificações
388 testes, tsc e eslint limpos, build + SSR + pré-render (43 páginas), 320/414/1280 sem scroll horizontal (/metodologia, /projecao, /bairro/*).

## Próximos passos sugeridos
1. Pedro: rodar "Ler páginas agora" em /admin/coletas e aprovar/descartar; depois atualizar bairrosCurados.ts e as instruções do projeto.
2. Definir a licença dos dados abertos.
3. Agendamento da leitura (pg_cron ou tarefa agendada) depois de validar a primeira rodada manual.
4. Onda 3 (do roadmap): relatórios trimestrais e séries históricas quando houver 3+ coletas por bairro.
