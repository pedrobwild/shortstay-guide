# Instruções do projeto (claude.ai) — blocos atualizados em 18/10/2026

As instruções do Projeto "Radar Bewild" no claude.ai só o Pedro edita. Substituir os blocos abaixo pelos textos novos; o resto das instruções continua igual.

## 1. Bloco "DRE padrão do guia" (substituir inteiro)

```
DRE padrão do guia (deduções, decisão de 18/10/2026): Airbnb 15%, gestão 18%, impostos 6%, manutenção 5%, fixos 8%, contas 3% — total 55%. Resultado líquido mensal resumido = receita bruta × 0,45. Fonte única no código: src/data/dreGuia.ts (DRE_GUIA, DEDUCOES_PADRAO_PCT, TEXTO_DRE_PERCENTUAIS); nenhum componente repete os percentuais e o teste dreGuia.test.ts barra textos antigos. No simulador e no exemplo de Pinheiros, Airbnb, gestão, impostos e manutenção incidem em % sobre a receita bruta; fixos e contas entram em reais (condomínio R$ 500 e contas R$ 500 no exemplo, IPTU informado). Todos são hipóteses editáveis — nunca estatística de mercado.
Investimento total (uma definição só): valor do imóvel + reforma (+ ITBI de 3% quando informado, sempre hipótese). Rentabilidade anual = líquido anual ÷ investimento total; prazo estimado de retorno = investimento total ÷ líquido anual. Exemplo de Pinheiros = simulador com as premissas padrão (R$ 5.580 bruto → R$ 2.125 líquido/mês).
```

## 2. Linha sobre Brooklin, Consolação e Vila Olímpia (substituir)

Texto antigo: "Brooklin (R$ 360 / 75%), Consolação (R$ 325 / 63%) e Vila Olímpia (R$ 415 / 79%) são estimativa Bewild, sem fonte pública — nunca atribuir GuestFavorites a elas."

```
Brooklin e Vila Olímpia usam a APROXIMAÇÃO pelo Itaim Bibi (GuestFavorites, 59% / R$ 359 / quartis 180-279-404, jan–set/2026; distrito que inclui a Vila Olímpia e parte do Brooklin; sem anúncios ativos por bairro). A estimativa Bewild anterior (Brooklin R$ 360 / 75%; Vila Olímpia R$ 415 / 79%) aparece só como referência extra, fora das contas, rotulada "Estimativa Bewild (dados anteriores, sem fonte pública)". Consolação (R$ 325 / 63%) é estimativa Bewild, sem fonte pública — nunca atribuir GuestFavorites a ela (a GuestFavorites passou a publicar a Consolação em 2026: 62% / R$ 271 / 1.625 anúncios, jan–jul/2026 — troca pendente de decisão). O filtro "Só dados observados" deixa aproximação e estimativa de fora.
```

## 3. Linha da Mooca (substituir)

```
Aviso de amostra pequena para fonte pública com menos de 200 anúncios: Mooca (85) sempre; Bom Retiro (187) e Lapa (160) quando a base de 28 bairros entrar.
```

## 4. Acrescentar depois da tabela de bairros

```
Base de 28 bairros (coleta GuestFavorites de 18/10/2026, PR #39, aguarda carga aprovada): Santa Cecília, Campo Belo, Santana, Tatuapé, Barra Funda, Butantã, Saúde, Ipiranga, Morumbi, Santo Amaro, Jabaquara, Sé, Brás, Bom Retiro e Lapa — números em docs/coleta-2026-10-18-novos-bairros.md. Santana e Barra Funda: jan–jul/2026. Bairro novo entra em: banco (radar_observacoes via /admin/coletas ou SQL direto), bairrosCurados.ts (reserva, com coletadoEm), bairrosGeo.ts, ARTIGO_BAIRRO/BAIRROS_SEM_ARTIGO em radarUi.ts e seoRoutes.json. Bairro sem linha em bairro_airbnb_sp usa a página BairroSomenteRadar e a lista "Outros bairros da base do Radar" no /ranking; o chat o inclui sem scores.
```

## 5. Acrescentar em "O QUE NUNCA FAZER"

```
Repetir percentuais do DRE em texto ou código fora de src/data/dreGuia.ts; usar "máquina de reservas", "lucro garantido" ou jargão (yield, payback, ROI) nos rótulos — o termo técnico vai só na explicação.
```

## 6. Acrescentar em "AO REVISAR"

```
Todo número de DRE vem de dreGuia.ts? O bairro atual (bairroAtual.ts) e o momento (momento.ts) continuam sendo lidos depois da montagem (SSR = hidratação)?
```
