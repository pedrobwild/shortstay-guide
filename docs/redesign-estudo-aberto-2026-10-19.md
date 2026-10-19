# Redesign "Estudo aberto" (direção 2a) — 19/10/2026

Branch `claude/redesign-estudo-aberto`. Implementa as 8 telas públicas do direcionamento "Radar Bewild — direcionamento do redesign" (out/2026).

## Decisões do Pedro (19/10/2026)
- Tudo num PR só.
- Seções da home sem página própria viram links: simulador e case vão para `/projecao`; diagnóstico, recomendação e plano de ação ficam em `/ferramentas`; FAQ fica no fim da home em `<details>`.
- Telas públicas só no tema claro (exceção registrada à regra do par `.dark`).
- Magenta, ciano 700 e neutros derivados das três cores do documento, com contraste conferido.

## Decisões técnicas
- **Escopo visual:** `:root.estudo` em `src/index.css`. A classe sai no `<html>` do `index.html` (e das páginas pré-renderizadas); `src/components/EscopoVisual.tsx` a tira em `/login`, `/signup`, `/painel`, `/projetos`, `/projeto/*` e `/admin/*`, que seguem no visual anterior (pendência 4 do documento). Fica no `<html>` para menus e diálogos em portal herdarem os tokens.
- **Fonte:** Source Serif 4 variável (latin, OFL) em `public/fonts`, com preload só do arquivo normal; o itálico verdadeiro carrega sob demanda (variáveis das fórmulas). DM Sans e Playfair seguem para o admin, sem preload.
- **Ícones:** Lucide mantido (sem instalar Phosphor), só em setas, download e norte.
- **Investimento total:** segue a regra aprovada (ITBI só quando informado), não a soma fixa do documento.
- **Financiamento:** usa as taxas consultadas em 19/07/2026 (pendência 1 do documento já resolvida no código).

## Cores derivadas (sobre o papel #f3f2f2)
| Token | Valor | Contraste |
|---|---|---|
| tinta | #201e1d | 14,9:1 |
| tinta 78% / 70% | #4f4c4b / #5e5b5a | 7,6:1 / 6,0:1 |
| ciano (gráficos, foco) | #0088b0 | 3,7:1 |
| ciano 700 (texto, botão primário) | #006a8a | 5,5:1; branco sobre ele 6,1:1 |
| magenta (seleção) | #c7287a | 4,7:1 |
| magenta 700 (alerta, negativo) | #a31d63 | 6,5:1 |
| escala do mapa | ciano 200 / 400 / 600 / 900 | sempre com contorno de tinta a 55% |
| borda de campo (neutro 500) | #86807d | 3,5:1 |

## O que mudou por tela
- **Home:** hero, três perfis (comprar / reformar / operar, reaproveitando as chaves de `momento.ts`), bloco "Base de dados", três achados, guia por tema, quem produz e FAQ. Links antigos `/?bairro=x#simulador` seguem para `/projecao?bairro=x`.
- **Guia por tema:** quatro páginas novas: `/guia/escolha-do-ativo`, `/guia/rentabilidade`, `/guia/reforma`, `/guia/checklist`.
- **Mercado:** indicadores de SP, Fig. 1 (histograma de pontos em classes de R$ 500 com a linha de SP), destaques e método. A jornada guiada (estimativa de mercado — base 2025) segue no fim, atrás de um botão.
- **Ranking:** Tab. 1 por critério e filtro, com empates em faixa ("2–4"). Os critérios internos ficam numa tabela recolhida.
- **Bairro:** resumo contra SP e posição (com empate), quatro indicadores, Fig. 1 (posição entre os 28 em diária e ocupação), Tab. 1 (fórmula e DRE até o líquido, com cada custo marcado como hipótese). Histórico, reforma no bairro e critérios internos continuam abaixo.
- **Mapa:** Fig. 1 em SVG com coordenadas reais, grade, escala de 2 km, norte, 4 classes por quartil, área pela amostra e amostra pequena com "*". O mapa de ruas e metrô (MapLibre) abre sob demanda.
- **Comparar:** três seletores, Tab. 1 com 8 linhas (maior valor em negrito) e Fig. 1 com faixas de diária de R$ 0 a 600.
- **Ferramentas:** 01 financiamento, 02 estimativa de reforma por área, 03 "meu studio contra o bairro"; abaixo, diagnóstico, recomendação e plano de ação.
- **Simular:** premissas editáveis, resultado líquido, Fig. 1 (barra empilhada), Tab. 1 (DRE), investimento total, rentabilidade anual e prazo estimado de retorno; abaixo, mês a mês, cenários, todas as premissas, case e análise detalhada.

## Pendências
- Versão celular desenhada pelo design: as telas foram feitas mobile-first a partir do desktop, sem referência visual do celular.
- Grupo 3 (Anúncios, Metodologia, 404) e conta/admin só herdaram os tokens; não foram redesenhados.
- Código sem uso depois da home nova: `SimuladorSection`, `MobileStickyBar`, `MidPageCTA`, `ResumeToast`/retomada da simulação, `VariacaoColetaResumo`, `MercadoSection` e outras seções do guia antigo. Decidir se saem.
- Alvos de toque pequenos nos pontos do histograma (Mercado) e da faixa de posição (Bairro); botões do mapa se sobrepõem no centro. A tabela equivalente cobre o acesso.
- Cores fora dos tokens em telas não tocadas que aparecem em público: `ProjectAnalytics` (análise detalhada da /projecao) e as etapas da jornada guiada do /mercado.
- O case exibido na /projecao é o da Vila Olímpia (`caseStudies.ts`); o de Pinheiros já não estava na base de cases.
- Os arquivos de referência visual (`Radar 2a - Telas.dc.html`, `Radar Redesign.dc.html`) e o design system Broadsheet não estavam acessíveis; as telas seguem o texto do direcionamento.
