# Coletas de dados de mercado

Registro bruto das coletas usadas pelo Radar Bewild. Cada arquivo guarda o que
estava publicado na fonte no dia da coleta, sem estimar nem converter. A
fonte de verdade dos valores exibidos é o banco: tabela `radar_observacoes`
(uma linha por bairro × indicador × período × fonte), fontes em `radar_fontes`
e a view `radar_bairro_atual`, que entrega a observação ativa mais recente com
`confianca` (alta/média/baixa) e `idade_dias` calculadas. App e chat leem essa
view; `src/data/bairrosCurados.ts` é só reserva offline. Este diretório é a
trilha de auditoria.

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

## Atualização (sem editar código)

1. Refaça a coleta e salve um novo `guestfavorites-AAAA-MM-DD.csv` aqui.
2. Insira as novas linhas em `radar_observacoes` (`ativo = true`, novo
   `coletado_em`, período, `amostra_n`, `url_origem`, `publicado_em`).
3. Desative as linhas antigas do mesmo bairro/indicador (`ativo = false`);
   nunca apague, para manter o histórico.
4. A confiança é recalculada sozinha pela view; nada é digitado.
5. App e chat passam a mostrar os números novos na próxima leitura. O site
   bewild.com.br deve ler a mesma view (pendente).
