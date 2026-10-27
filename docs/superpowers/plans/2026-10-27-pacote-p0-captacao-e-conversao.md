# Pacote P0 — captação, conversão e medição do Radar: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o backlog P0.1–P0.7 do "Plano completo de melhorias" (27/10/2026) sobre o código atual do Radar — medição em todas as entradas, caminho contextual de orçamento, estudo preservado, contexto dos dados, custos sem promessa, captura leve com e-mail e entrega ao comercial — sem reescrever nada do zero.

**Architecture:** Cada item reaproveita uma peça que já existe: a telemetria interna (`useGuideAnalytics` + `guide_events`) passa a ser registrada no `App`, não na home; `OrcamentoButton` volta a renderizar o CTA oficial com medição; `project_assumptions` ganha a cópia íntegra das premissas do simulador (`PremissasSimulador`) para o estudo reabrir igual; o aviso de receita (`AvisoReceita`) ganha a frase do universo da fonte; os números do estudo de reforma passam a ser rotulados como histórico de contratos; a captura leve nasce como tabela nova `radar_pedidos_material` (mesmo padrão de GRANT por coluna → RLS → policies de `simulacoes_busca`) com formulário, confirmação na tela e aba admin "Pedidos" com status comercial e CSV. O envio por e-mail e a integração com CRM ficam atrás de uma interface, para entrar quando o Pedro escolher o provedor e o CRM.

**Tech Stack:** React 18 + Vite 5 + TypeScript 5, Tailwind v3 + shadcn/ui, Supabase (Postgres/RLS, Edge Functions Deno), Vitest (jsdom), React Query, react-router 6.

**Spec:** `docs/superpowers/specs/2026-10-27-radar-bewild-plano-completo-de-melhorias.md` (cópia do documento do Pedro); seções "Backlog prioritário de implementação" (P0.1–P0.7), "Ponte para o orçamento", "Formulário inicial", "Texto de uma oferta", "Instrumentação mínima", "Ajustes de confiança prioritários" e "Definições para marketing e comercial".

## Decisões pendentes do Pedro (o plano assume o padrão indicado)

| # | Decisão | Padrão assumido no plano | Onde impacta |
|---|---|---|---|
| D1 | Reativar o CTA de orçamento (hoje `OrcamentoButton` retorna `null` por regra registrada no AGENTS.md: "Suppress budget CTAs centrally") | **Reativa em todos os locais**, com medição `click_orcamento` consentida | Tarefa 2 |
| D2 | Levar contexto (bairro e faixa de área, nunca dado pessoal) na URL do orçamento — reverte a decisão de 17/10/2026 ("link simples, sem contexto da simulação") | **Sim**: `bairro` e `area` como parâmetros próprios, além dos UTMs; o formulário em bewild.com.br/orcamento decide se os lê | Tarefa 2 |
| D3 | Provedor de e-mail transacional para entregar o checklist (nenhum configurado no repositório; o hook de auth usa o e-mail da Lovable) | **Sem envio nesta rodada**: o pedido é registrado e a pessoa recebe o material na tela (link para `/guia/checklist` + opção de imprimir/salvar); o envio entra quando houver provedor | Tarefa 6 |
| D4 | CRM de destino dos contatos (nenhum integrado) | **Sem CRM nesta rodada**: a entrega ao comercial é a aba `/admin/pedidos` com status, responsável e CSV; webhook para o CRM fica como `enviarAoCrm` sem implementação | Tarefa 7 |
| D5 | Referência vigente de preço de reforma (o estudo é histórico de contratos; o artigo distingue "tabela vigente"), sem números no repositório | **Só rotulagem**: o estudo passa a aparecer como "histórico de 188 contratos (out/2026)"; a referência vigente entra em `provasBewild.ts` quando o Pedro informar os números | Tarefa 5 |
| D6 | Texto do consentimento do pedido de material e menção na política de privacidade (LGPD) | Texto proposto na Tarefa 6; o Pedro valida antes de publicar | Tarefa 6 |

## Global Constraints

- Melhoria contínua: nunca reescrever do zero; sem refatorar fora do escopo; sem remover funcionalidade; sem trocar biblioteca sem confirmação.
- pt-BR em UI, comentários, commits e rótulos; vírgula decimal, BRL via `src/lib/numberFormat.ts`, datas dd/mm/aaaa.
- Alias `@/`; nunca `../../`.
- Marca visível sempre "Bewild". CTA oficial "Peça seu orçamento" → `https://bewild.com.br/orcamento?utm_source=radar&utm_medium=referral&utm_campaign=radar_bewild&utm_content=<local>` (`src/lib/orcamento.ts` + `OrcamentoButton`). Sem "diagnóstico gratuito", sem "resposta em 24 horas", sem "máquina de reservas", sem "lucro garantido"; termos técnicos (ADR, yield, payback, ROI) só na explicação (`tomGuia.test.ts`).
- Nenhum número fora das fontes aprovadas; percentuais do DRE só em `src/data/dreGuia.ts`; números de reforma só em `src/data/provasBewild.ts`.
- Banco: estrutura só por migration; `CREATE TABLE` no `public` com, na mesma migration e nesta ordem, `REVOKE ALL` → `GRANT` (authenticated, service_role; anon só se houver escrita/leitura pública, por coluna) → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`; regras de tempo em trigger, nunca em CHECK; `SECURITY DEFINER` sempre com `search_path` fixado; leitura paginada com ordem estável + `id`; input de filtro com escape.
- Nunca editar `src/integrations/supabase/client.ts`, `previewAuthStorage.ts`, `types.ts`, `.env`, `supabase/config.toml`. Depois de uma migration, `types.ts` é regenerado pela Lovable; até lá, tipar a linha nova localmente (`as unknown as TablesInsert<...>` como em `useGuideAnalytics`).
- Nunca alterar linhas do banco, `bairrosCurados.ts` ou o case Pinheiros.
- Privacidade: nenhum dado pessoal em URL, evento de marketing, link de compartilhamento ou superfície pública; telemetria interna e GA4/Pixel só após consentimento (`canMeasure`) e fora de `/admin`, `/painel`, `/projetos`, `/projeto/*`, `/area-exclusiva`.
- Design: só tokens HSL de `src/index.css` (telas públicas no escopo `:root.estudo`, tema claro); alvo de toque ≥ 44 px; inputs em 16 px; sem scroll horizontal em 320/414/1280; estados de carregando/vazio/erro.
- Estado entre telas (`bairroAtual.ts`, `momento.ts`) lido depois da montagem (SSR = hidratação).
- Verificação de cada tarefa: `npx vitest run <arquivos>`; ao fim de cada tarefa, `npx vitest run`, `npx tsc --noEmit -p tsconfig.app.json` (os 4 erros de `MapaRadar.tsx` já existem na main) e `npx eslint .`. Instalação: `npm install --no-package-lock` (o `package-lock.json` está desatualizado; a Lovable usa `bun.lock`).
- Não publicar o site: o Pedro publica pelo Lovable.

## Review Focus

1. Pessoa que recusou cookies e usa o simulador: nenhum evento interno chega a `guide_events`, mas o fluxo de guardar/pedir material funciona igual — Tarefa 1 (teste "sem consentimento não grava") e Tarefa 6 (registro de pedido não depende de `canMeasure`).
2. Pessoa que entra direto em `/projecao?bairro=mooca` por link compartilhado: `page_view` interno com o `page` = `/projecao` e `cta_clicked` do orçamento medidos sem passar pela home — Tarefa 1.
3. Projeto antigo sem `premissas_simulador` (criado antes desta rodada): `/projeto/:id` reabre a simulação com o que existe (bairro, faixa) e não quebra com `null` — Tarefa 3 (teste `premissasDoProjeto(null)`).
4. E-mail com maiúsculas/espaços repetido ("Pedro@x.com " e "pedro@x.com") pedindo o mesmo material: um só contato por material (índice único em `lower(btrim(email))`), e a segunda vez volta sucesso, não erro — Tarefa 6.
5. URL do orçamento com bairro acentuado ("Santa Cecília") e faixa com "–": `encodeURIComponent` via `URLSearchParams`, nada de dado pessoal nos parâmetros — Tarefa 2 (teste de chaves permitidas).

---

### Task 1: Telemetria interna em todas as entradas (P0.4)

**Files:**
- Create: `src/components/MedicaoGlobal.tsx`
- Create: `src/test/medicaoGlobal.test.tsx`
- Modify: `src/hooks/useGuideAnalytics.ts` (campo `page`)
- Modify: `src/pages/Index.tsx:67-78` (`useMedicaoHome`: sai o registro global e o `page_view`; ficam só os marcos de rolagem)
- Modify: `src/App.tsx:170-171` (monta `<MedicaoGlobal />` ao lado de `PostLoginProvision`)
- Modify: `AGENTS.md` (regra nova, uma linha)

**Interfaces:**
- Consumes: `useGuideAnalytics()`, `setGlobalTrack`, `setGlobalSessionId` (já existem); `canMeasure` (marketingConsent).
- Produces: `trackGlobal(type, data)` passa a funcionar em qualquer rota pública; eventos levam `page: location.pathname` em vez de `"guide"`. Nada mais muda de assinatura.

- [ ] **Step 1: Escrever o teste que falha**

`src/test/medicaoGlobal.test.tsx` (mesmo esqueleto de `homeRender.test.tsx`: `createRoot` + `MemoryRouter`), com `vi.mock("@/integrations/supabase/client", ...)` expondo `from("guide_events").insert` como `vi.fn()` e `localStorage.setItem("radar_bewild_consent_v1", "accepted")` antes de montar:

```tsx
it("registra trackGlobal fora da home e grava page com o caminho", async () => {
  await montar("/projecao?bairro=mooca");          // monta só <MedicaoGlobal /> dentro do router
  trackGlobal("cta_clicked", { cta_id: "x" });
  await act(async () => { vi.advanceTimersByTime(5000); }); // flush do buffer
  const lote = insert.mock.calls[0][0];
  expect(lote.map((e) => e.event_type)).toEqual(["page_view", "cta_clicked"]);
  expect(lote.every((e) => e.page === "/projecao")).toBe(true);
});
it("sem consentimento não grava nada", async () => {
  localStorage.clear(); await montar("/bairro/pinheiros"); trackGlobal("cta_clicked", {});
  await act(async () => { vi.advanceTimersByTime(5000); });
  expect(insert).not.toHaveBeenCalled();
});
it("em /admin não registra page_view", async () => {
  await montar("/admin/leads"); await act(async () => { vi.advanceTimersByTime(5000); });
  expect(insert).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/test/medicaoGlobal.test.tsx`
Expected: FAIL — `MedicaoGlobal` não existe.

- [ ] **Step 3: Implementar `MedicaoGlobal` e o campo `page`**

`export default function MedicaoGlobal(): null` em `src/components/MedicaoGlobal.tsx`: chama `useGuideAnalytics()`, registra `setGlobalTrack(trackEvent)` + `setGlobalSessionId(sessionId)` num `useEffect` (limpa ao desmontar) e, num segundo `useEffect` dependente de `useLocation().pathname`, chama `trackEvent("page_view", { referrer: document.referrer, ua: navigator.userAgent })` — `trackEvent` já descarta quando `canMeasure()` é falso (o que cobre `/admin` e afins). Em `useGuideAnalytics.ts`, `page: window.location.pathname` no lugar de `"guide"`. Em `Index.tsx`, `useMedicaoHome` mantém só os marcos de rolagem (`scroll_25…100`) usando `trackGlobal`. Em `App.tsx`, `<MedicaoGlobal />` dentro do router (precisa de `useLocation`), ao lado de `<PostLoginProvision />`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/test/medicaoGlobal.test.tsx src/test/homeRender.test.tsx src/lib/__tests__/marketingConsent.test.ts`
Expected: PASS.

- [ ] **Step 5: AGENTS.md e commit**

Linha em `AGENTS.md`: "Telemetria interna (`guide_events`) registrada por `MedicaoGlobal` no App, em toda rota pública, com `page` = caminho; a home só acrescenta os marcos de rolagem. Por quê: eventos de bairro, projeção e guia valiam só para quem entrava pela home."

```bash
git add src/components/MedicaoGlobal.tsx src/test/medicaoGlobal.test.tsx src/hooks/useGuideAnalytics.ts src/pages/Index.tsx src/App.tsx AGENTS.md
git commit -m "feat(medição): telemetria interna em todas as rotas públicas"
```

---

### Task 2: Caminho contextual de orçamento (P0.1)

**Files:**
- Modify: `src/lib/orcamento.ts` (contexto opcional)
- Modify: `src/components/OrcamentoButton.tsx` (volta a renderizar)
- Modify: `src/components/projecao/ProjecaoStudio.tsx:323-325` (ponte para o orçamento com o texto do documento)
- Modify: `src/components/guide/FinalCTASection.tsx:36` (passa o contexto quando houver bairro atual)
- Test: `src/lib/__tests__/orcamentoUrl.test.ts` (ajustar o teste "não leva dados da simulação")
- Create: `src/test/orcamentoButton.test.tsx`
- Modify: `AGENTS.md` (substitui a regra "Suppress budget CTAs centrally in OrcamentoButton…")

**Interfaces:**
- Produces: `export type ContextoOrcamento = { bairro?: string | null; area?: SizeKey | null }` e `orcamentoUrl(local: OrcamentoLocal, contexto?: ContextoOrcamento): string` — acrescenta `bairro` (nome) e `area` (faixa) só quando informados; chaves permitidas na URL: `utm_source, utm_medium, utm_campaign, utm_content, bairro, area`.
- `OrcamentoButton` ganha a prop `contexto?: ContextoOrcamento`; ao clicar chama `trackBudgetClick(local)` (GA4/Pixel, consentido) e `trackGlobal("cta_clicked", { cta_id: "orcamento", local, bairro })`.

- [ ] **Step 1: Testes que falham**

Em `orcamentoUrl.test.ts`, trocar o teste "não leva dados da simulação" por:

```ts
it("sem contexto, só UTMs", () => {
  expect([...new URL(orcamentoUrl("projecao")).searchParams.keys()].sort()).toEqual(["utm_campaign", "utm_content", "utm_medium", "utm_source"]);
});
it("com contexto, leva bairro e faixa de área e nada pessoal", () => {
  const url = new URL(orcamentoUrl("projecao", { bairro: "Santa Cecília", area: "26–35 m²" }));
  expect(url.searchParams.get("bairro")).toBe("Santa Cecília");
  expect(url.searchParams.get("area")).toBe("26–35 m²");
  expect([...url.searchParams.keys()].sort()).toEqual(["area", "bairro", "utm_campaign", "utm_content", "utm_medium", "utm_source"]);
});
```

`src/test/orcamentoButton.test.tsx` (esqueleto de `homeRender.test.tsx`; `vi.mock("@/lib/marketingConsent")` com `trackBudgetClick: vi.fn()`, `canMeasure: () => true`; `vi.mock("@/hooks/useGuideAnalytics")` com `trackGlobal: vi.fn()`):

```tsx
it("renderiza o CTA oficial como link externo e mede o clique", async () => {
  const c = await montar(<OrcamentoButton local="projecao" contexto={{ bairro: "Mooca" }} />);
  const a = c.querySelector("a")!;
  expect(a.textContent).toContain("Peça seu orçamento");
  expect(a.getAttribute("href")).toBe(orcamentoUrl("projecao", { bairro: "Mooca" }));
  expect(a.getAttribute("target")).toBe("_blank");
  await act(async () => { a.click(); });
  expect(trackBudgetClick).toHaveBeenCalledWith("projecao");
  expect(trackGlobal).toHaveBeenCalledWith("cta_clicked", expect.objectContaining({ cta_id: "orcamento", local: "projecao", bairro: "Mooca" }));
});
it("rótulo próprio continua valendo", async () => {
  const c = await montar(<OrcamentoButton local="final" rotulo="Solicitar orçamento para este studio" />);
  expect(c.querySelector("a")!.textContent).toContain("Solicitar orçamento para este studio");
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/__tests__/orcamentoUrl.test.ts src/test/orcamentoButton.test.tsx`
Expected: FAIL — `orcamentoUrl` ignora o 2º argumento; `OrcamentoButton` renderiza `null`.

- [ ] **Step 3: Implementar**

`orcamento.ts`: montar `URLSearchParams` com os UTMs e, se `contexto?.bairro`/`contexto?.area` vierem preenchidos, `params.set("bairro", …)` / `params.set("area", …)`. `OrcamentoButton.tsx`: `Button asChild variant="default"` com `<a href={orcamentoUrl(local, contexto)} target="_blank" rel="noopener noreferrer" onClick={…}>` + `NovaAba` (já existe para "(abre em nova aba)") quando `icone !== false`; rótulo padrão "Peça seu orçamento"; manter as props atuais. Em `ProjecaoStudio.tsx`, a `Secao id="proximo-passo"` passa a ter `titulo="Já tem o imóvel e quer planejar a reforma?"`, `lead="Envie as informações do studio para a Bewild avaliar o escopo e preparar o orçamento."` e `<OrcamentoButton local="projecao" rotulo="Solicitar orçamento para este studio" contexto={{ bairro: bairro.name, area: p.area }} />`; o botão da linha 376 (case) recebe o mesmo `contexto`. Em `FinalCTASection.tsx`, `contexto={{ bairro: lerBairroAtual() }}` lido depois da montagem (`useEffect` + estado), como manda a regra de hidratação.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/__tests__/orcamentoUrl.test.ts src/test/orcamentoButton.test.tsx src/lib/__tests__/tomGuia.test.ts src/test/simuladorRender.test.tsx src/test/homeRender.test.tsx`
Expected: PASS (os render tests da home e do simulador passam a conter o link de orçamento; se algum deles afirmar a ausência do CTA, atualizar a afirmação para a presença).

- [ ] **Step 5: Conferir a tela e commit**

Run: `npm run build` e abrir `dist/projecao/index.html` (ou `npx vite preview`) a 320 px: a ponte aparece depois do resultado, sem scroll horizontal. Trocar a regra do AGENTS.md por: "CTA de orçamento central em `OrcamentoButton` (link externo oficial com UTM do local + `bairro`/`area` opcionais, nunca dado pessoal), medido por `trackBudgetClick` e `cta_clicked`; na /projecao a ponte 'Já tem o imóvel e quer planejar a reforma?' vem depois do resultado. Por quê: único caminho de lead, com contexto útil e atribuição (27/10/2026)."

```bash
git add src/lib/orcamento.ts src/components/OrcamentoButton.tsx src/components/projecao/ProjecaoStudio.tsx src/components/guide/FinalCTASection.tsx src/lib/__tests__/orcamentoUrl.test.ts src/test/orcamentoButton.test.tsx AGENTS.md
git commit -m "feat(orçamento): CTA contextual de reforma com medição"
```

---

### Task 3: Estudo preservado — a simulação inteira vira projeto (P0.3)

**Files:**
- Create: `supabase/migrations/20261027120000_project_assumptions_premissas_simulador.sql`
- Create: `src/lib/projetoSimulacao.ts`
- Create: `src/lib/__tests__/projetoSimulacao.test.ts`
- Modify: `src/lib/leadProvisioning.ts` (`LeadIntent.premissas`, grava as colunas novas)
- Modify: `src/components/projecao/AcoesSimulacao.tsx:106-117` (`guardarNoPainel` envia `p` completo)
- Modify: `src/pages/ProjectDetail.tsx` (bloco "Simulação guardada" com "Reabrir na simulação")
- Modify: `AGENTS.md`

**Interfaces:**
- Migration: `ALTER TABLE public.project_assumptions ADD COLUMN premissas_simulador jsonb, ADD COLUMN versao_calculo text, ADD COLUMN base_coletada_em date;` + `COMMENT ON COLUMN` explicando que `premissas_simulador` é `PremissasSimulador` íntegra (sem dado pessoal) e `base_coletada_em` a data da coleta vigente quando a pessoa guardou. Sem GRANT/policy novos: a tabela já tem RLS por `user_owns_project` para SELECT/INSERT/UPDATE.
- `projetoSimulacao.ts`:
  - `export const VERSAO_CALCULO = "simulador-v1-dre-2026-10-18"` (constante única; muda quando o modelo mudar).
  - `export function premissasDoProjeto(row: { premissas_simulador?: unknown; neighborhood?: string | null; area_sqm?: string | null } | null): PremissasSimulador` — `normalizarPremissasSimulador(row?.premissas_simulador ?? { bairro: row?.neighborhood, area: row?.area_sqm })`.
  - `export function linkReabrirSimulacao(p: PremissasSimulador): string` — `/projecao?` + `premissasParaQuery(p, p.bairro ? slugifyBairro(p.bairro) : null)`.
  - `export function baseMudou(baseColetadaEm: string | null, coletadoEmAtual: string): boolean` — compara datas ISO; `null` conta como mudou.
  - `export function intentDaSimulacao(p: PremissasSimulador, coletadoEmAtual: string | null): LeadIntent` — `{ neighborhood: p.bairro ?? undefined, area_sqm: p.area, premissas: p, versao_calculo: VERSAO_CALCULO, base_coletada_em: coletadoEmAtual }`.
- `LeadIntent` ganha `premissas?: PremissasSimulador; versao_calculo?: string; base_coletada_em?: string | null`; `provisionProjectForLead` e `criarProjetoDaSimulacao` inserem as três colunas em `project_assumptions` quando `intent.premissas` existe (linha tipada com `as unknown as TablesInsert<"project_assumptions">` até o `types.ts` ser regenerado).
- Data da coleta vigente do bairro: `BairroRadar.coletadoEm: string | null` (`src/lib/radarBase.ts:18`), ISO `aaaa-mm-dd`; `baseMudou` compara só os 10 primeiros caracteres.

- [ ] **Step 1: Teste que falha**

```ts
describe("simulação guardada como projeto", () => {
  it("premissas íntegras sobrevivem ao ida-e-volta", () => {
    const p = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca", diaria: 310, reforma: 90000, imovel: { valorImovel: 400000, condominio: 650, iptu: 120 } };
    expect(premissasDoProjeto({ premissas_simulador: JSON.parse(JSON.stringify(p)) })).toEqual(p);
  });
  it("projeto antigo só com bairro e faixa reabre com o padrão", () => {
    expect(premissasDoProjeto({ neighborhood: "Pinheiros", area_sqm: "20–25 m²" })).toEqual({ ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Pinheiros", area: "20–25 m²" });
    expect(premissasDoProjeto(null)).toEqual(PREMISSAS_SIMULADOR_PADRAO);
  });
  it("o link reabre a mesma conta na /projecao", () => {
    const p = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Santa Cecília", diaria: 250 };
    const link = linkReabrirSimulacao(p);
    expect(link.startsWith("/projecao?")).toBe(true);
    expect(lerPremissasDaQuery(link.slice("/projecao".length)).premissas.diaria).toBe(250);
  });
  it("avisa quando a base mudou desde que a pessoa guardou", () => {
    expect(baseMudou("2026-10-13", "2026-10-18")).toBe(true);
    expect(baseMudou("2026-10-18", "2026-10-18")).toBe(false);
    expect(baseMudou(null, "2026-10-18")).toBe(true);
  });
  it("intent leva premissas, versão e base, sem dado pessoal", () => {
    const i = intentDaSimulacao({ ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca" }, "2026-10-18");
    expect(Object.keys(i).sort()).toEqual(["area_sqm", "base_coletada_em", "neighborhood", "premissas", "versao_calculo"]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/__tests__/projetoSimulacao.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `projetoSimulacao.ts`, a migration e a gravação**

Migration conforme a interface. `leadProvisioning.ts`: nos dois inserts em `project_assumptions`, acrescentar `premissas_simulador: intent.premissas ?? null, versao_calculo: intent.versao_calculo ?? null, base_coletada_em: intent.base_coletada_em ?? null`. `AcoesSimulacao.tsx`: `const intent = intentDaSimulacao(p, bairro?.coletadoEm ?? null)`. `savePendingProvision(intent)` já serializa em localStorage (sem dado pessoal: só números e escolhas).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/__tests__/projetoSimulacao.test.ts src/lib/__tests__/simuladorReceita.test.ts`
Expected: PASS.

- [ ] **Step 5: Reabrir no `/projeto/:id`**

Em `ProjectDetail.tsx`, no lugar onde as premissas (`useProjectSummary` → `project_assumptions`) já são lidas, renderizar um bloco "Simulação guardada" com: data de `created_at`, bairro, faixa, `Link` "Reabrir na simulação" → `linkReabrirSimulacao(premissasDoProjeto(row))`, e, quando `baseMudou(row.base_coletada_em, coletadoEmAtual)`, a nota "A base de diária e ocupação foi atualizada em dd/mm/aaaa; ao reabrir, a conta é recalculada com a base atual." (`coletadoEmAtual` do bairro via a base já carregada na página). Estado vazio: "Este projeto não tem simulação guardada; comece uma em /projecao." Nenhuma mudança no comparador de cenários existente.

Run: `npx tsc --noEmit -p tsconfig.app.json` — sem erros novos além dos 4 de `MapaRadar.tsx`.

- [ ] **Step 6: AGENTS.md e commit**

Linha: "Guardar no Painel grava a `PremissasSimulador` íntegra, `versao_calculo` e `base_coletada_em` em `project_assumptions` (migration 20261027120000); `/projeto/:id` reabre a mesma conta em `/projecao` por `linkReabrirSimulacao` e avisa quando a base mudou. Por quê: o estudo prometido como guardado reabria só com bairro e faixa."

```bash
git add supabase/migrations/20261027120000_project_assumptions_premissas_simulador.sql src/lib/projetoSimulacao.ts src/lib/__tests__/projetoSimulacao.test.ts src/lib/leadProvisioning.ts src/components/projecao/AcoesSimulacao.tsx src/pages/ProjectDetail.tsx AGENTS.md
git commit -m "feat(painel): simulação guardada reabre com as mesmas premissas"
```

A migration é aplicada no banco pela Lovable no push para a main (ou pelo Pedro); não rodar SQL direto.

---

### Task 4: Contexto dos dados junto ao número (P0.5)

**Files:**
- Modify: `src/lib/estudo.ts:15` (`AVISO_RECEITA` + `AVISO_UNIVERSO`)
- Modify: `src/components/estudo/Numeros.tsx:79-81` (`AvisoReceita` mostra os dois)
- Modify: `src/components/PreRenderMercado.tsx:13` (mesmo aviso nas páginas estáticas)
- Modify: `src/components/projecao/AcoesSimulacao.tsx` (resumo copiado leva a frase)
- Modify: `src/lib/llmsTxt.ts` (uma linha no "Como ler")
- Test: `src/lib/__tests__/estudo.test.ts`, `src/lib/__tests__/llmsTxt.test.ts`

**Interfaces:**
- `export const AVISO_UNIVERSO = "Médias de todos os tipos de anúncio do bairro na fonte, não a receita de um studio específico."` (texto do documento: "Referências de anúncios do bairro, de diferentes tipos de imóvel. Não representam a receita de um studio específico.", adaptado ao tom das telas).
- `AvisoReceita` passa a renderizar `AVISO_UNIVERSO` + `AVISO_RECEITA` em um parágrafo (hero, bairro, comparar, mapa, mercado, ranking e projeção já usam o componente; cobrir `/bairro/*` estático em `PreRenderMercado`).

- [ ] **Step 1: Testes que falham**

Em `estudo.test.ts`:
```ts
it("o aviso de receita diz de que universo o número vem", () => {
  expect(AVISO_UNIVERSO).toMatch(/todos os tipos de anúncio/);
  expect(AVISO_UNIVERSO).toMatch(/não a receita de um studio específico/);
});
```
Em `llmsTxt.test.ts`: `expect(gerarLlmsTxt(...)).toContain(AVISO_UNIVERSO)`.
Em `src/test/homeRender.test.tsx` (teste existente da estrutura): `expect(container.textContent).toContain(AVISO_UNIVERSO)`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/__tests__/estudo.test.ts src/lib/__tests__/llmsTxt.test.ts src/test/homeRender.test.tsx`
Expected: FAIL — constante inexistente.

- [ ] **Step 3: Implementar** conforme a interface; em `AcoesSimulacao.tsx`, a linha "Hipótese de simulação…" do `resumo` ganha `AVISO_UNIVERSO` antes.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/__tests__/estudo.test.ts src/lib/__tests__/llmsTxt.test.ts src/test/homeRender.test.tsx src/test/estudoMercadoRender.test.tsx src/lib/__tests__/tomGuia.test.ts`
Expected: PASS. Depois `npm run build` e conferir que `public/llms.txt` foi regenerado com a frase.

- [ ] **Step 5: Commit**

```bash
git add src/lib/estudo.ts src/components/estudo/Numeros.tsx src/components/PreRenderMercado.tsx src/components/projecao/AcoesSimulacao.tsx src/lib/llmsTxt.ts src/lib/__tests__/estudo.test.ts src/lib/__tests__/llmsTxt.test.ts src/test/homeRender.test.tsx public/llms.txt public/.well-known/llms.txt
git commit -m "feat(dados): universo da fonte junto de todo número de receita"
```

---

### Task 5: Custos de reforma como histórico, sem promessa (P0.6)

**Files:**
- Modify: `src/data/provasBewild.ts` (rótulo do estudo)
- Modify: componentes que exibem o estudo: `src/components/guide/ReformaSection.tsx`, bloco Reforma de `src/pages/Index.tsx`, ajuda do campo "Reforma (R$)" em `ProjecaoStudio.tsx:169`, `src/components/ferramentas/FerramentaReformar.tsx` (estimativa por área), `src/pages/PerfilDestino.tsx` e `src/pages/Ferramentas.tsx` onde citam `CONTRATOS_ANALISADOS`/`ESTUDO_REFORMA_DATA`
- Test: `src/lib/__tests__/provasBewild.test.ts`

**Interfaces:**
- `export const ROTULO_ESTUDO_REFORMA = \`histórico de ${CONTRATOS_ANALISADOS} contratos de reforma completa (${ESTUDO_REFORMA_DATA})\`` em `provasBewild.ts`; `RESPOSTA_CUSTO_REFORMA` e `RESPOSTA_INVESTIMENTO_TOTAL` citam o rótulo.
- Nenhum número novo. A referência vigente (D5) entra depois como `REFERENCIA_VIGENTE = { data, custoM2, fonte }` quando o Pedro informar; até lá, nada de "tabela vigente" no site.

- [ ] **Step 1: Teste que falha**

Em `provasBewild.test.ts`:
```ts
it("o estudo é apresentado como histórico de contratos, com data", () => {
  expect(ROTULO_ESTUDO_REFORMA).toBe("histórico de 188 contratos de reforma completa (out/2026)");
  expect(RESPOSTA_CUSTO_REFORMA).toContain("histórico de 188 contratos");
});
it("nenhuma frase de reforma promete resultado", () => {
  for (const t of [RESPOSTA_CUSTO_REFORMA, RESPOSTA_INVESTIMENTO_TOTAL]) expect(t).not.toMatch(/garantid|a partir de R\$|valoriza/i);
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/lib/__tests__/provasBewild.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implementar** o rótulo e usar `ROTULO_ESTUDO_REFORMA` nos quatro pontos de tela listados ("mediana de R$ 71.850 para 27,5 m² no histórico de 188 contratos… (out/2026)"). Manter `TEXTO_GARANTIA` (5 anos) e `TEXTO_MULTA_ATRASO` como estão.

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/lib/__tests__/provasBewild.test.ts src/lib/__tests__/reformaExample.test.ts src/lib/__tests__/tomGuia.test.ts src/test/homeRender.test.tsx`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/provasBewild.ts src/components/guide/ReformaSection.tsx src/pages/Index.tsx src/components/projecao/ProjecaoStudio.tsx src/components/ferramentas src/lib/__tests__/provasBewild.test.ts
git commit -m "feat(reforma): estudo rotulado como histórico de contratos"
```

---

### Task 6: Captura leve — pedido de material por e-mail (P0.2)

**Files:**
- Create: `supabase/migrations/20261027130000_radar_pedidos_material.sql`
- Create: `src/lib/pedidosMaterial.ts`
- Create: `src/lib/__tests__/pedidosMaterial.test.ts`
- Create: `src/components/captacao/PedidoMaterial.tsx`
- Create: `src/test/pedidoMaterial.test.tsx`
- Modify: `src/pages/GuiaTema.tsx` (oferta no fim do tema `checklist` e `escolha-do-ativo`), `src/pages/CompararBairros.tsx` (depois da Tab. 1), `src/pages/IntelligenceBairroDetail.tsx` (depois dos indicadores)
- Modify: `AGENTS.md`, `src/AGENTS.md`

**Interfaces:**
- Migration (mesmo padrão de `simulacoes_busca`):
  ```sql
  CREATE TABLE public.radar_pedidos_material (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254 AND position('@' in email) > 1),
    email_chave text GENERATED ALWAYS AS (lower(btrim(email))) STORED,
    nome text CHECK (nome IS NULL OR char_length(nome) BETWEEN 1 AND 80),
    material text NOT NULL CHECK (material IN ('checklist_compra')),
    etapa text CHECK (etapa IS NULL OR etapa IN ('procurando','tenho','reformar')),
    bairro text CHECK (bairro IS NULL OR char_length(bairro) BETWEEN 1 AND 80),
    boletim boolean NOT NULL DEFAULT false,
    consentimento_versao text NOT NULL CHECK (char_length(consentimento_versao) BETWEEN 1 AND 20),
    origem text NOT NULL CHECK (origem IN ('guia','bairro','comparar','projecao')),
    sessao text,
    entregue_em timestamptz,
    status_comercial text NOT NULL DEFAULT 'novo' CHECK (status_comercial IN ('novo','qualificado','oportunidade','perdido','fora_do_perfil')),
    responsavel text, motivo_perda text, atualizado_em timestamptz NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX radar_pedidos_material_email_material_uq ON public.radar_pedidos_material (email_chave, material);
  REVOKE ALL ON public.radar_pedidos_material FROM anon, authenticated;
  GRANT INSERT (email, nome, material, etapa, bairro, boletim, consentimento_versao, origem, sessao) ON public.radar_pedidos_material TO anon, authenticated;
  GRANT SELECT, UPDATE (status_comercial, responsavel, motivo_perda, atualizado_em) ON public.radar_pedidos_material TO authenticated;
  GRANT ALL ON public.radar_pedidos_material TO service_role;
  ALTER TABLE public.radar_pedidos_material ENABLE ROW LEVEL SECURITY;
  CREATE POLICY pedidos_insert_publico ON public.radar_pedidos_material FOR INSERT TO anon, authenticated WITH CHECK (consentimento_versao IS NOT NULL);
  CREATE POLICY pedidos_select_admin ON public.radar_pedidos_material FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
  CREATE POLICY pedidos_update_admin ON public.radar_pedidos_material FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
  ```
  + trigger `touch_atualizado_em` (mesmo modelo de `touch_project_assumptions_updated_at`). Dedupe: o índice único faz o segundo pedido do mesmo e-mail/material falhar com `23505`; o cliente trata como sucesso.
- `pedidosMaterial.ts`:
  - `export const CONSENTIMENTO_MATERIAL_VERSAO = "2026-10-27"`; `export const TEXTO_CONSENTIMENTO_MATERIAL` = "A Bewild usa seu e-mail só para enviar este material e, se você marcar, as próximas análises do Radar Bewild. Você pode cancelar a qualquer momento pelo link no e-mail. Política de privacidade: bewild.com.br/privacidade." (D6 — o Pedro valida).
  - `export const MATERIAIS = { checklist_compra: { titulo: "Checklist antes de comprar o studio", caminho: "/guia/checklist" } } as const`; `export type Material = keyof typeof MATERIAIS`.
  - `export function emailValido(e: string): boolean` (trim, um `@`, domínio com ponto, ≤ 254).
  - `export type OrigemPedido = "guia" | "bairro" | "comparar" | "projecao"`; `Momento` vem de `@/lib/momento` (`"procurando" | "tenho" | "reformar"`).
  - `export function montarPedido(d: { email: string; nome?: string; material: Material; etapa?: Momento | null; bairro?: string | null; boletim: boolean; origem: OrigemPedido }, sessao: string | null): RegistroPedido` — normaliza (`trim`, nome vazio → null) e fixa `consentimento_versao`.
  - `export async function registrarPedido(r: RegistroPedido): Promise<"ok" | "duplicado" | "erro">` — `supabase.from("radar_pedidos_material").insert(r)`; código `23505` → `"duplicado"`.
  - `export function enviarMaterial(_r: RegistroPedido): Promise<void>` — por D3, resolve sem enviar; comentário aponta que o envio por e-mail entra aqui quando houver provedor.
- `PedidoMaterial.tsx`: props `{ material: Material; origem: OrigemPedido; bairro?: string | null }`. E-mail obrigatório, primeiro nome opcional, caixa separada "Quero também receber as próximas análises do Radar Bewild" (desmarcada), texto do consentimento, botão "Receber meu checklist". Etapa herdada de `lerMomento()` depois da montagem. Estados: enviando (`aria-busy`), sucesso ("Pedido registrado. O checklist está aqui: [link /guia/checklist] — por D3, enquanto o envio por e-mail não existe, a tela entrega o material"), duplicado (mesmo texto de sucesso), erro ("Não foi possível registrar agora; o checklist continua disponível em /guia/checklist."). Mede `trackGlobal("material_solicitado", { material, origem, boletim })` só após `"ok"`; nunca envia e-mail a GA4/Pixel.

- [ ] **Step 1: Testes que falham**

`pedidosMaterial.test.ts`:
```ts
it("valida e-mail", () => { expect(emailValido(" pedro@bewild.com.br ")).toBe(true); expect(emailValido("pedro@")).toBe(false); expect(emailValido("sem-arroba")).toBe(false); });
it("monta o pedido normalizado, com a versão do consentimento e sem campos extras", () => {
  const r = montarPedido({ email: " Pedro@X.com ", nome: "  ", material: "checklist_compra", etapa: "procurando", bairro: "Mooca", boletim: false, origem: "guia" }, "s1");
  expect(r).toEqual({ email: "Pedro@X.com", nome: null, material: "checklist_compra", etapa: "procurando", bairro: "Mooca", boletim: false, consentimento_versao: "2026-10-27", origem: "guia", sessao: "s1" });
});
it("pedido repetido do mesmo e-mail conta como entregue", async () => {
  mockInsert.mockResolvedValueOnce({ error: { code: "23505" } });
  expect(await registrarPedido(r)).toBe("duplicado");
});
it("o texto do consentimento não promete prazo nem diagnóstico", () => { expect(TEXTO_CONSENTIMENTO_MATERIAL).not.toMatch(/24 horas|diagnóstico gratuito/i); });
```
`pedidoMaterial.test.tsx` (render): sem e-mail o botão não envia; com e-mail válido e `registrarPedido` mockado em `"ok"` aparece o link para `/guia/checklist`; em `"erro"` aparece a mensagem de erro com o mesmo link; a caixa do boletim começa desmarcada.

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/lib/__tests__/pedidosMaterial.test.ts src/test/pedidoMaterial.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implementar** migration, lib e componente conforme a interface (inputs `min-h-[44px] text-base`, tokens do escopo `estudo`, `aria-live="polite"` no estado). Colocar `<PedidoMaterial material="checklist_compra" origem="guia" />` no fim dos temas `checklist` e `escolha-do-ativo` em `GuiaTema.tsx` (dentro de `ClientOnly` se a página for pré-renderizada estaticamente, para a hidratação coincidir), `origem="comparar"` em `CompararBairros.tsx` e `origem="bairro"` com `bairro={nome}` em `IntelligenceBairroDetail.tsx`, sempre depois da primeira resposta útil, nunca cobrindo a tela.

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/lib/__tests__/pedidosMaterial.test.ts src/test/pedidoMaterial.test.tsx src/lib/__tests__/tomGuia.test.ts src/lib/__tests__/seo.test.ts`. Expected: PASS. `npm run build` sem erro de hidratação no console do `vite preview` em `/guia/checklist`.

- [ ] **Step 5: AGENTS.md e commit**

`AGENTS.md`: "Pedido de material (checklist) grava em `radar_pedidos_material` (anon só INSERT por coluna; leitura e status só admin; um pedido por e-mail e material); entrega na tela via `MATERIAIS[...].caminho` enquanto não há provedor de e-mail (`enviarMaterial` é o ponto de entrada). Nunca e-mail em evento de marketing. Por quê: captura sem senha nem WhatsApp, com consentimento registrado (LGPD)."

```bash
git add supabase/migrations/20261027130000_radar_pedidos_material.sql src/lib/pedidosMaterial.ts src/lib/__tests__/pedidosMaterial.test.ts src/components/captacao/PedidoMaterial.tsx src/test/pedidoMaterial.test.tsx src/pages/GuiaTema.tsx src/pages/CompararBairros.tsx src/pages/IntelligenceBairroDetail.tsx AGENTS.md src/AGENTS.md
git commit -m "feat(captação): pedido de checklist por e-mail, sem senha"
```

---

### Task 7: Entrega ao comercial — aba Pedidos no admin (P0.7)

**Files:**
- Create: `src/pages/AdminPedidos.tsx` (React.lazy + `AdminRoute` em `src/App.tsx`; entrada em `src/components/admin/AdminTabs.tsx`)
- Create: `src/lib/pedidosAdmin.ts` + `src/lib/__tests__/pedidosAdmin.test.ts`
- Modify: `src/data/seoRoutes.json` / `robots.txt` só se `/admin/pedidos` não estiver coberto pelo prefixo privado `/admin` (conferir `privatePrefixes`; normalmente já está)
- Modify: `AGENTS.md`

**Interfaces:**
- `pedidosAdmin.ts`:
  - `export type StatusComercial = "novo" | "qualificado" | "oportunidade" | "perdido" | "fora_do_perfil"` (os mesmos valores do CHECK da Tarefa 6).
  - `export type PedidoAdmin = { id: string; created_at: string; email: string; nome: string | null; material: Material; etapa: Momento | null; bairro: string | null; boletim: boolean; origem: OrigemPedido; status_comercial: StatusComercial; responsavel: string | null; motivo_perda: string | null; atualizado_em: string }`.
  - `export async function listarPedidos(params: { status?: StatusComercial | null; desde?: Date | null }, pagina: { apos?: { created_at: string; id: string } }): Promise<PedidoAdmin[]>` — `order("created_at", desc).order("id", desc).limit(200)` (paginação estável, cap de 1.000 do PostgREST).
  - `export async function atualizarStatus(id: string, patch: { status_comercial: StatusComercial; responsavel?: string | null; motivo_perda?: string | null }): Promise<boolean>` — exige `motivo_perda` quando status é `perdido` ou `fora_do_perfil` (validação pura `patchValido`).
  - `export function pedidosParaCsv(linhas: PedidoAdmin[]): string` — ponto e vírgula + BOM, mesmo formato de `demandaParaCsv`.
  - `export function resumoPedidos(linhas: PedidoAdmin[]): { total: number; porStatus: Record<StatusComercial, number>; boletim: number }`.
  - `export async function enviarAoCrm(_p: PedidoAdmin): Promise<"sem_crm">` — por D4, ponto de entrada documentado, sem integração.
- `AdminPedidos.tsx`: tabela (e-mail, nome, material, etapa, bairro, origem, boletim, data, status, responsável) com filtro de status, campo de responsável, seletor de status com motivo obrigatório nos dois status negativos, botão "Exportar CSV", resumo no topo; estados carregando/vazio/erro; sem medição (rota `/admin/*`).

- [ ] **Step 1: Testes que falham**

```ts
it("patch de perda exige motivo", () => { expect(patchValido({ status_comercial: "perdido" })).toBe(false); expect(patchValido({ status_comercial: "perdido", motivo_perda: "fora de SP" })).toBe(true); expect(patchValido({ status_comercial: "qualificado" })).toBe(true); });
it("CSV com cabeçalho, ponto e vírgula e BOM", () => { const csv = pedidosParaCsv([linha]); expect(csv.charCodeAt(0)).toBe(0xfeff); expect(csv.split("\n")[0]).toBe("data;e-mail;nome;material;etapa;bairro;origem;boletim;status;responsável;motivo"); });
it("resumo conta por status e boletim", () => { expect(resumoPedidos([novo, qualificado, novoBoletim])).toEqual({ total: 3, porStatus: { novo: 2, qualificado: 1, oportunidade: 0, perdido: 0, fora_do_perfil: 0 }, boletim: 1 }); });
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/lib/__tests__/pedidosAdmin.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implementar** lib, página e rota (modelo visual de `AdminDemanda.tsx`/`AdminLeads.tsx`, mesmos componentes shadcn).

- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/lib/__tests__/pedidosAdmin.test.ts src/lib/__tests__/seo.test.ts src/lib/__tests__/navegacao.test.ts`; `npx tsc --noEmit -p tsconfig.app.json`. Expected: PASS, sem erros novos.

- [ ] **Step 5: AGENTS.md e commit**

Linha: "/admin/pedidos lista `radar_pedidos_material` (paginação por `created_at, id`), status comercial com motivo obrigatório na perda, responsável e CSV; `enviarAoCrm` é o ponto de integração futuro. Por quê: lead = contato válido que pediu algo; conta e boletim são categorias distintas."

```bash
git add src/pages/AdminPedidos.tsx src/lib/pedidosAdmin.ts src/lib/__tests__/pedidosAdmin.test.ts src/App.tsx src/components/admin/AdminTabs.tsx AGENTS.md
git commit -m "feat(admin): aba Pedidos com status comercial e CSV"
```

---

### Task 8: Verificação do conjunto e registro

**Files:**
- Modify: `docs/superpowers/plans/2026-10-27-pacote-p0-captacao-e-conversao.md` (marcar o que ficou pendente por decisão)
- Create: `docs/pacote-p0-2026-10-27.md` (registro curto: o que entrou, migrations a aplicar, decisões D1–D6, pendências)

- [ ] **Step 1: Suíte completa** — `npx vitest run`. Expected: todos passando (≥ 572 + os novos).
- [ ] **Step 2: Tipos e lint** — `npx tsc --noEmit -p tsconfig.app.json` (só os 4 erros pré-existentes de `MapaRadar.tsx`); `npx eslint .` com 0 erros.
- [ ] **Step 3: Build e pré-render** — `npm run build`; conferir `dist/` com `/projecao`, `/guia/checklist`, `/comparar`, `/bairro/mooca` e `/metodologia`; abrir no `vite preview` a 320, 414 e 1280 px sem scroll horizontal e sem erro de hidratação no console.
- [ ] **Step 4: Registro** — escrever `docs/pacote-p0-2026-10-27.md` com: migrations `20261027120000` e `20261027130000` a aplicar; decisões D1–D6 e o que cada "não" muda; pendências (provedor de e-mail, CRM, referência vigente de reforma, texto LGPD, teste de ponta a ponta do pedido no site publicado).
- [ ] **Step 5: Commit e PR**

```bash
git add docs/pacote-p0-2026-10-27.md docs/superpowers
git commit -m "docs: registro do pacote P0 (captação, conversão e medição)"
```

PR para a `main` com base nos commits das tarefas; não publicar.
