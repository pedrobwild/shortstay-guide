# Levantamento: custo de reforma, prazo de obra e prova social (nada foi editado)

Legenda da última coluna: **Cálculo** = entra em conta na tela; **Texto** = só aparece escrito.

## 1. Custo de reforma e decoração

| Onde | Valor | O que significa | Uso |
|---|---|---|---|
| src/components/guide/ReformaSection.tsx:12 | 66 / 25 / 12 R$/m² × 25 m² | Piso vinílico: material, instalação, preparação (total R$ 2.575) | Cálculo (soma e barra) |
| ReformaSection.tsx:12 | 110 / 85 / 40 R$/m² × 25 m² | Piso porcelanato (total R$ 5.875; diferença R$ 3.300) | Cálculo (soma e barra) |
| ReformaSection.tsx:41 | R$ 24.000 | Marcenaria com armários fechados | Texto |
| ReformaSection.tsx:42 | R$ 19.000 | Marcenaria com armários abertos/nichos | Texto |
| ReformaSection.tsx:50 | R$ 2.800 | Iluminação LED completa | Texto |
| ReformaSection.tsx:51 | R$ 5.200 | Troca de bancadas (quartzo) | Texto |
| ReformaSection.tsx:58 | 56% mais barato; 1–2 dias vs 3–5 dias | Vinílico vs porcelanato: custo e prazo de instalação | Texto |
| ReformaSection.tsx:59 | diária > R$ 400 | Quando porcelanato compensa | Texto |
| src/components/guide/AntiChecklistSection.tsx:8 | R$ 5.000+ | Troca de bancadas | Texto |
| AntiChecklistSection.tsx:9 | a partir de R$ 8.000 | Integração de sacada | Texto |
| AntiChecklistSection.tsx:23 | até 30% | Economia no custo total da obra | Texto |
| src/components/guide/DecoracaoSection.tsx:24 | R$ 15–25k / 25–40k / 40–60k | Decoração por nível (básico/premium/alto) | Texto |
| src/components/guide/FAQSection.tsx:11 | R$ 15k–40k reforma; R$ 15k–60k decoração | Custo de reforma e decoração de um studio | Texto (também no JSON-LD da home) |
| FAQSection.tsx:5 | R$ 250k–600k | Investimento total (imóvel + obra) | Texto (também no JSON-LD) |
| src/data/guide-data.ts:235 (FAQ_DATA) | R$ 35.000 a R$ 120.000 | "Reformas leves" a "projetos premium" | Texto — **contradiz** a FAQ acima (R$ 15–40k) |
| src/data/caseStudies.ts:94 | reforma 32.000; decoração 28.000; imóvel 325.000; total 385.000 | Case Pinheiros 28 m² (≈ R$ 1.143/m² de reforma) | Cálculo (cards do case e ordenação) |
| src/lib/__tests__/caseStudies.test.ts:14 | 30.000 / 25.000 / 300.000 | Dados de teste | Só teste |
| src/components/guide/SimuladorSection.tsx:109 | placeholder "Ex: 45.000" | Exemplo de orçamento de reforma | Texto |
| src/components/intelligence/InvestmentSimulator.tsx:30 | 0% | "Decoração e mobília" no custo de aquisição | Cálculo (entra como zero) |
| src/data/guide-data.ts:181 | — | Item do checklist "Orçamento de reforma definido" | Texto |
| src/components/guide/RentabilidadeSection.tsx:207 | — | ROI "inclui reforma, mobília, ITBI" | Texto (definição) |

Não há custo de reforma em: scenarioModel, bwildComparison, investmentScore, productFoundation, storytelling, intelligenceInsights, assistente (chat), banco de dados ou funções do servidor. Não existe percentual de marcenaria nem ticket médio de obra em nenhum lugar.

## 2. Números que dependem do custo de reforma

| Onde | Valor | O que significa | Uso |
|---|---|---|---|
| SimuladorSection.tsx:58-59 | payback = orçamento ÷ ganho mensal (arredonda para cima) | Payback da reforma em meses; só aparece se o usuário digitar orçamento | Cálculo |
| caseStudies.ts:96-101 | diária 380; ocupação 82%; receita 9.348/mês e 112.176/ano; yield 29,1%; payback 7 meses | Resultado do case Pinheiros | Texto exibido (ordenação usa yield/ocupação/payback) |
| DecoracaoSection.tsx:12 | +25–30% diária; 75–85% ocupação; até +40% valorização; payback 6–12 meses | Ganho atribuído à decoração | Texto |
| DecoracaoSection.tsx:25 | Básico payback 10–14 meses, diária +10–15% (e níveis seguintes) | ROI por nível de decoração | Texto |
| src/data/guide-data.ts:42-45 | 1,0 / 1,2 / 1,45 | Multiplicador de diária por nível de decoração | Cálculo (MercadoSection) |
| src/lib/bwildComparison.ts:57-72 | DIY: diária 0,92×, ocupação 0,85×, gestão 0%. BWild: diária 1,18×, ocupação 1,06×, teto 92%, gestão 18% | Ganho de "reformar com a BWild" vs fazer sozinho | Cálculo (comparativo na projeção) — não considera o custo da obra |
| src/components/guide/MercadoSection.tsx:85 | até 40% | Marcenaria + iluminação + fotos elevam a diária | Texto |
| RentabilidadeSection.tsx:29/38/47 | payback ~11 / ~7 / ~4 anos | Cenários (sem citar valor de obra) | Texto |

## 3. Prazo de obra

| Onde | Valor | O que significa | Uso |
|---|---|---|---|
| src/components/guide/ProjetoSection.tsx:11 | Projeto 2–3 semanas; Execução 3–5; Marcenaria 2–3; Decoração 1 | Etapas da obra (total ≈ 8–12 semanas) | Texto |
| ProjetoSection.tsx:22 | os mesmos prazos | Detalhe de cada etapa | Texto |
| caseStudies.ts:73-77 | Mês 1–2 compra + reforma; Mês 3 decoração; Mês 4 lançamento | Linha do tempo do case | Texto |
| ReformaSection.tsx:58 | 1–2 dias vs 3–5 dias | Instalação de piso | Texto |

Não existe prazo em dias úteis no app. As tabelas de cronograma de obra (de 31/05) foram apagadas; só restam os arquivos antigos de criação delas no histórico.

## 4. Prova social e menções pedidas

| Onde | Valor | O que significa | Uso |
|---|---|---|---|
| src/data/guide-data.ts:228 | "+200 studios" | Studios entregues/operados | Texto (selos de confiança) |
| guide-data.ts:229 | "4.9 nota média" | Nota dos anúncios | Texto |
| guide-data.ts:231 | "+5 anos no mercado" | Tempo de mercado | Texto |
| guide-data.ts:230 | "Operação própria" | Selo, sem número | Texto |
| caseStudies.ts:88-106 | 1 case verificado | Único case real publicado | Exibido |
| HeroSection.tsx:52,106 | "Guia Bwild 2026", "edição 2026" | Edição do guia | Texto |
| AntiChecklistSection.tsx:10 | garantia "geralmente de 5 anos" | Impermeabilização da construtora (não é garantia da Bwild) | Texto |
| MercadoSection.tsx:101 | "não constituem garantia de resultado" | Aviso legal | Texto |
| intelligenceInsights.ts:458 | "não a garantia" | Aviso sobre yield | Texto |
| EscolhaAtivoSection.tsx:307 | "histórico de multas" | Multas do condomínio, não multa por atraso de obra | Texto |
| Tabela `projects` | 3 linhas | Projetos de demonstração do painel iCal, não obras | Dados |

Não encontrado: "contratos" ou "obras entregues" com número, garantia da obra Bwild, multa por atraso, ticket médio, prazo em dias úteis. O assistente (chat) não cita nenhum desses números.

## Pontos de atenção
1. Duas FAQs dizem coisas diferentes sobre custo de reforma (R$ 15–40k vs R$ 35–120k).
2. "+200 studios", "4.9" e "+5 anos" não têm fonte registrada no código.
3. O case Pinheiros (reforma R$ 32k em 28 m²) fica abaixo da referência interna da Bwild (ticket médio R$ 63,5k, R$ 2.369/m²).
4. A ligação real entre selos e uso na tela precisa de uma última checagem (TrustSignals.tsx).

## Próximo passo
Isso foi só um levantamento. Ao aprovar, nada muda no site; me diga quais números quer corrigir e por quais valores.
