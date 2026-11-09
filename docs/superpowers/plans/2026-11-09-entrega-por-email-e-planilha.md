# Entrega por e-mail (Resend) e planilha do comercial — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quem pede o checklist ou o dossiê da simulação no Radar recebe o PDF por e-mail (Resend), o lead cai na planilha do comercial (Apps Script) e qualquer e-mail pode ser cancelado por link — com falhas visíveis e reenviáveis no admin.

**Architecture:** O navegador continua só gravando o pedido (agora com `id` próprio e, no dossiê, as `premissas`); uma Edge Function `enviar-material` lê o pedido com `service_role`, monta o PDF (checklist: arquivo gerado no build; dossiê: `pdf-lib` sobre o motor do simulador), envia pelo Resend com `List-Unsubscribe`, grava `entregue_em`, posta na planilha e grava `planilha_em`. Uma segunda função `descadastrar` zera as flags de todos os pedidos do e-mail a partir do token. O motor do simulador roda na função por **cópia sincronizada** dos módulos puros de `src/` para `supabase/functions/_shared/motor/` (mesmo padrão de `admin-usuarios/lista.ts` × `usuariosAdmin.ts`, guardado por teste de igualdade), porque a Lovable empacota só o que está em `supabase/functions`.

**Tech Stack:** React 18 + Vite + TS (frontend), Supabase Edge Functions (Deno) com `npm:pdf-lib@1.17.1`, Resend REST API, Google Apps Script, Playwright (já no repositório) para o PDF do checklist, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-09-entrega-por-email-e-planilha-design.md`

## Decisões tomadas no plano (além da spec)

| # | Decisão | Por quê |
|---|---|---|
| P1 | Motor na função por **cópia sincronizada** (`scripts/sync-motor.mjs` → `supabase/functions/_shared/motor/*.ts`, imports `@/…` reescritos para `./…ts`), com teste que falha se a cópia divergir. | Não há precedente de função importando `../../../src`; o bundler da Lovable empacota só `supabase/functions`. O repositório já usa cópia com teste de igualdade. |
| P2 | Antes da cópia, extrair para módulos puros o que o motor pega de arquivos impuros: `DECORATION_LEVELS` → `src/data/decoracao.ts`; `DEFAULT_PROJECTION_COSTS` → `src/lib/projectionDefaults.ts`; `AVISO_UNIVERSO`/`AVISO_RECEITA` → `src/data/avisos.ts`; `slugifyBairro` → `src/lib/slug.ts`; `linkReabrirSimulacao` → `src/lib/reabrirSimulacao.ts`. Os arquivos de origem passam a reexportar (nenhum chamador muda). | `guide-data.ts` importa `lucide-react`; `estudo.ts` puxa `radarUi`+`bairrosGeo`; `seo.ts` puxa o JSON de rotas; `projetoSimulacao.ts` puxa `leadProvisioning` (Supabase). |
| P3 | Sem testes Deno (não há Deno no ambiente nem precedente); toda lógica das funções fica em módulos puros testados no Vitest (`supabase/functions/_shared/**/*.test.ts` entra no `include`), e `index.ts` só faz I/O. `npm:pdf-lib@1.17.1` recebe alias para `pdf-lib` no Vitest. | Cobertura real sem depender de runtime ausente. |
| P4 | Estrutura do dossiê (`montarDossie`, dados e textos) separada do desenho (`desenharDossie`, pdf-lib). A estrutura é testada com números (paridade Pinheiros); o desenho é testado por "gera PDF válido (`%PDF`), 2–4 páginas, não lança com todos os textos" — `pdf-lib` não extrai texto, então a conferência de conteúdo fica na estrutura. | Mantém o teste de paridade onde ele é barato e preciso. |

## Global Constraints

- Melhoria contínua: nunca reescrever do zero; sem refatorar fora do escopo (as extrações da P2 são reexportadas, zero mudança em chamadores); sem trocar biblioteca sem confirmação (`pdf-lib` e Resend são as da spec).
- pt-BR em UI, comentários, commits e e-mails; BRL via `numberFormat.ts`; datas dd/mm/aaaa; "Bewild" sempre.
- Nenhum número fora das fontes aprovadas: o dossiê só exibe o que `simuladorReceita.ts`, `dreGuia.ts`, `provasBewild.ts` e a base do bairro produzem; deduções pelo texto único `TEXTO_DRE_PERCENTUAIS`.
- Tom: nunca "24 horas", "diagnóstico gratuito", "garantid", "máquina de reservas", "lucro"; ROI/yield/payback só em nota; rótulos "rentabilidade anual", "prazo estimado de retorno".
- Banco: migration com GRANT por coluna → (RLS já ativa) → sem policy nova (as existentes bastam); funções usam `service_role`; `descadastro_token` nunca chega ao navegador; `anon` nunca lê a tabela.
- Privacidade: nenhum e-mail/nome em `trackGlobal`, GA4/Pixel, URL, log de função ou payload de erro; `envio_erro`/`planilha_erro` ≤ 200 caracteres, só código/mensagem.
- Segredos só em Lovable Cloud: `RESEND_API_KEY`, `PLANILHA_WEBHOOK_URL`, `PLANILHA_SEGREDO`, `SITE_URL`; nunca `VITE_*`.
- Remetente `Radar Bewild <radar@bewild.com.br>`, `reply_to: contato@bewild.com.br`; todo e-mail com `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
- Limite: 5 envios entregues por e-mail por dia → `"limite"`.
- Design: tokens HSL, inputs 16 px, toque ≥ 44 px, estados carregando/vazio/erro; `/descadastro` `noindex` e fora do sitemap (prefixo privado em `seoRoutes.json`); browser lido só em efeitos.
- Verificação por tarefa: `npx vitest run <arquivos>`; ao fim de cada tarefa `npx vitest run`, `npx tsc --noEmit -p tsconfig.app.json` (4 erros pré-existentes em `MapaRadar.tsx`), `npx eslint .`; `npm run build` quando a tarefa mexer em build/pré-render (não commitar `public/sitemap.xml` regenerado; `public/llms.txt` só se o texto mudou). Antes de abrir o PR, conferir se a Lovable tem commits não sincronizados (`git fetch; git log origin/main..`), lição de 08/11.
- A migration é aplicada pelo conector do Lovable (ou pelo Pedro) **antes** do deploy; o push na main não aplica.

## Review Focus

1. Pedido duplicado (23505) de dossiê com as **mesmas** premissas: a pessoa vê "Já enviamos este material" e nada é reenviado; com premissas **diferentes** entra como pedido novo — Tarefa 3 (teste de `premissas_chave`) e Tarefa 8.
2. Resend fora do ar ou chave inválida: o pedido fica gravado com `envio_erro`, a planilha ainda recebe a linha, a tela mostra o material e "vamos reenviar"; o admin vê o erro e reenvia — Tarefas 6 e 9.
3. Pessoa que já cancelou e pede material de novo: recebe o material; `boletim`/`contato_comercial` valem o que marcou agora; nenhuma comunicação além do material — Tarefa 7 (teste de `descadastrar` não impedir novo pedido).
4. Dossiê com bairro de aproximação (Brooklin/Vila Olímpia) ou fora da base: a marcação de referência diz "aproximação pelo Itaim Bibi" / não inventa diária; sem bairro, o PDF não é gerado e a função devolve `"erro_envio"` com código `sem_bairro` — Tarefa 5.
5. Texto com caractere fora do WinAnsi (ex.: emoji no nome): o PDF não pode lançar — a montagem remove caracteres não representáveis antes de desenhar — Tarefa 5 (teste com nome "José 🙂").

---

### Task 1: Módulos puros compartilháveis (P2)

**Files:**
- Create: `src/data/decoracao.ts`, `src/lib/projectionDefaults.ts`, `src/data/avisos.ts`, `src/lib/slug.ts`, `src/lib/reabrirSimulacao.ts`
- Modify: `src/data/guide-data.ts:24-28`, `src/lib/projectAnalytics.ts:745-750`, `src/lib/estudo.ts:15-18`, `src/lib/seo.ts:33-41`, `src/lib/projetoSimulacao.ts` (só reexportar; corpo das funções/constantes muda de arquivo)
- Modify: `src/lib/simuladorReceita.ts:15-19` (importar dos módulos novos)
- Test: `src/lib/__tests__/modulosPuros.test.ts`

**Interfaces:**
- Produces: `DECORATION_LEVELS` (igual, em `@/data/decoracao`); `DEFAULT_PROJECTION_COSTS` (igual, em `@/lib/projectionDefaults`, importando `DRE_GUIA`/`DESPESAS_EXEMPLO` de `@/data/dreGuia`); `AVISO_UNIVERSO`, `AVISO_RECEITA` (iguais, em `@/data/avisos`); `slugifyBairro(name: string): string` (igual, em `@/lib/slug`); `linkReabrirSimulacao(p: PremissasSimulador): string` (igual, em `@/lib/reabrirSimulacao`, importando `premissasParaQuery`/`MARCADOR_REABRIR` de `@/lib/simuladorReceita` e `slugifyBairro` de `@/lib/slug`). Os arquivos antigos reexportam (`export { … } from "…"`).

- [ ] **Step 1: Teste que falha**

```ts
// src/lib/__tests__/modulosPuros.test.ts
import { readFileSync } from "node:fs";
const PUROS = ["src/lib/simuladorReceita.ts","src/data/dreGuia.ts","src/data/provasBewild.ts","src/lib/numberFormat.ts","src/data/bairrosCurados.ts","src/data/decoracao.ts","src/lib/projectionDefaults.ts","src/data/avisos.ts","src/lib/orcamento.ts","src/lib/slug.ts","src/lib/reabrirSimulacao.ts","src/data/fontesGuia.ts"];
it("módulos do motor só importam uns aos outros (sem React, window, Supabase ou JSON)", () => {
  const permitidos = new Set(PUROS.map((p) => p.replace(/^src\//, "@/").replace(/\.ts$/, "")));
  for (const p of PUROS) for (const m of readFileSync(p, "utf8").matchAll(/from "([^"]+)"/g)) expect(permitidos.has(m[1]), `${p} importa ${m[1]}`).toBe(true);
});
it("reexports mantêm os chamadores", async () => {
  const gd = await import("@/data/guide-data"); const dec = await import("@/data/decoracao");
  expect(gd.DECORATION_LEVELS).toBe(dec.DECORATION_LEVELS);
  const est = await import("@/lib/estudo"); const av = await import("@/data/avisos");
  expect(est.AVISO_UNIVERSO).toBe(av.AVISO_UNIVERSO);
  const seo = await import("@/lib/seo"); const slug = await import("@/lib/slug");
  expect(seo.slugifyBairro("Santa Cecília")).toBe(slug.slugifyBairro("Santa Cecília"));
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/lib/__tests__/modulosPuros.test.ts`. Expected: FAIL (módulos inexistentes; `simuladorReceita` importa `@/data/guide-data` e `@/lib/projectAnalytics`).
- [ ] **Step 3: Criar os cinco módulos movendo o código (não copiando); reexportar nos arquivos de origem; trocar os imports em `simuladorReceita.ts`.**
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/lib/__tests__/modulosPuros.test.ts src/lib/__tests__/simuladorReceita.test.ts src/lib/__tests__/projetoSimulacao.test.ts src/lib/__tests__/estudo.test.ts src/lib/__tests__/seo.test.ts`. Expected: PASS. `npx tsc --noEmit -p tsconfig.app.json` sem erro novo.
- [ ] **Step 5: Commit** — `refactor(motor): módulos puros do simulador separados dos impuros (reexportados)`.

---

### Task 2: Cópia sincronizada do motor para a função (P1)

**Files:**
- Create: `scripts/sync-motor.mjs`, `supabase/functions/_shared/motor/*.ts` (gerados e commitados), `supabase/functions/_shared/motor/README.md` (uma frase: gerado, não editar)
- Modify: `package.json` (script `"sync-motor": "node scripts/sync-motor.mjs"`; `"build"` passa a começar por `npm run sync-motor && …`), `vitest.config.ts` (`include` ganha `"supabase/functions/_shared/**/*.test.ts"`; `resolve.alias` ganha `{ find: /^npm:pdf-lib@.*$/, replacement: "pdf-lib" }`), `package.json` devDependency `pdf-lib@1.17.1`
- Test: `src/lib/__tests__/motorSync.test.ts`

**Interfaces:**
- `scripts/sync-motor.mjs`: lê a lista `PUROS` (mesma da Tarefa 1, exportada de `scripts/motor-lista.mjs` para o teste e o script compartilharem), copia cada arquivo para `supabase/functions/_shared/motor/<basename>.ts` reescrevendo `from "@/lib/x"` e `from "@/data/x"` → `from "./x.ts"`; falha (exit 1) se algum import não estiver na lista.
- Produces: `supabase/functions/_shared/motor/{simuladorReceita,dreGuia,provasBewild,numberFormat,bairrosCurados,decoracao,projectionDefaults,avisos,orcamento,slug,reabrirSimulacao,fontesGuia}.ts` — importáveis em Deno (`./x.ts`) e no Vitest.

- [ ] **Step 1: Teste que falha**

```ts
// src/lib/__tests__/motorSync.test.ts
import { readFileSync } from "node:fs"; import { PUROS } from "../../../scripts/motor-lista.mjs";
it("cada módulo copiado é igual à origem com imports reescritos", () => {
  for (const origem of PUROS) {
    const copia = `supabase/functions/_shared/motor/${origem.split("/").pop()}`;
    const esperado = readFileSync(origem, "utf8").replace(/from "@\/(?:lib|data)\/([^"]+)"/g, 'from "./$1.ts"');
    expect(readFileSync(copia, "utf8"), copia).toBe(esperado);
  }
});
it("a cópia roda fora do navegador e dá o case Pinheiros", async () => {
  const m = await import("../../../supabase/functions/_shared/motor/simuladorReceita.ts");
  expect(typeof m.resultadoShortStay).toBe("function");
});
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/lib/__tests__/motorSync.test.ts`. Expected: FAIL (arquivos ausentes).
- [ ] **Step 3: Implementar `scripts/motor-lista.mjs` (export `PUROS`), `scripts/sync-motor.mjs`, rodar `npm run sync-motor`, ajustar `vitest.config.ts` e `package.json`, `npm install --no-package-lock pdf-lib@1.17.1 --save-dev`.** (O `bun.lock` da Lovable será atualizado por ela; registrar no relatório.)
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/lib/__tests__/motorSync.test.ts src/lib/__tests__/modulosPuros.test.ts`; `npm run build` (confirma que o sync roda antes do build). Expected: PASS.
- [ ] **Step 5: Commit** — `feat(funcoes): motor do simulador copiado e sincronizado para as Edge Functions`.

---

### Task 3: Migration + camada de pedidos no navegador

**Files:**
- Create: `supabase/migrations/20261109120000_pedidos_material_envio.sql`
- Modify: `src/lib/pedidosMaterial.ts`, `src/components/captacao/PedidoMaterial.tsx` (só o que a interface pede), `AGENTS.md`
- Test: `src/lib/__tests__/pedidosMaterial.test.ts`, `src/test/pedidoMaterial.test.tsx`

**Interfaces:**
- Migration (ordem: ALTER … → DROP/CREATE índice → GRANT por coluna → COMMENT):
  ```sql
  ALTER TABLE public.radar_pedidos_material
    DROP CONSTRAINT IF EXISTS radar_pedidos_material_material_check,
    ADD CONSTRAINT radar_pedidos_material_material_check CHECK (material IN ('checklist_compra','dossie_simulacao')),
    ADD COLUMN IF NOT EXISTS premissas jsonb,
    ADD COLUMN IF NOT EXISTS premissas_chave text GENERATED ALWAYS AS (coalesce(md5(premissas::text), '')) STORED,
    ADD COLUMN IF NOT EXISTS envio_erro text CHECK (envio_erro IS NULL OR char_length(envio_erro) <= 200),
    ADD COLUMN IF NOT EXISTS planilha_em timestamptz,
    ADD COLUMN IF NOT EXISTS planilha_erro text CHECK (planilha_erro IS NULL OR char_length(planilha_erro) <= 200),
    ADD COLUMN IF NOT EXISTS descadastro_token uuid NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS descadastrado_em timestamptz;
  DROP INDEX IF EXISTS radar_pedidos_material_email_material_uq;
  CREATE UNIQUE INDEX radar_pedidos_material_email_material_premissas_uq ON public.radar_pedidos_material (email_chave, material, premissas_chave);
  CREATE UNIQUE INDEX radar_pedidos_material_descadastro_token_uq ON public.radar_pedidos_material (descadastro_token);
  GRANT INSERT (id, premissas) ON public.radar_pedidos_material TO anon, authenticated;
  ```
  (o CHECK de `material` foi criado inline na coluna em `20261027130000`; o Postgres nomeia esses CHECKs `<tabela>_<coluna>_check`, daí `radar_pedidos_material_material_check`.)
- `pedidosMaterial.ts`:
  - `MATERIAIS` ganha `dossie_simulacao: { titulo: "Dossiê da simulação", caminho: "/projecao" }`.
  - `RegistroPedido` ganha `id: string` e `premissas: PremissasSimulador | null`.
  - `montarPedido(d, sessao)` ganha `d.premissas?: PremissasSimulador | null`; gera `id: crypto.randomUUID()`; para `material === "dossie_simulacao"` exige `premissas` (lança `Error("dossiê exige premissas")`), para checklist força `null`.
  - `registrarPedido(r): Promise<{ status: "ok" | "duplicado" | "erro"; id: string }>`.
  - `export type ResultadoEnvio = "ok" | "ja_entregue" | "limite" | "erro_envio" | "erro_planilha" | "erro"`; `enviarMaterial(pedidoId: string): Promise<ResultadoEnvio>` → `supabase.functions.invoke("enviar-material", { body: { pedido_id } })`; qualquer exceção/rede → `"erro"`.
- `PedidoMaterial.tsx`: prop `premissas?: PremissasSimulador | null`; `Estado` ganha `"enviado" | "ja_entregue" | "limite"`; fluxo: `registrarPedido` → `"duplicado"` ⇒ estado `ja_entregue`; `"ok"` ⇒ `enviarMaterial(id)` ⇒ `ok`→`enviado`, `ja_entregue`/`limite`→ idem, `erro_*`/`erro`→ estado `sucesso` atual com a frase "Não conseguimos enviar o e-mail agora; o material está aqui e vamos reenviar." Textos: `enviado` = "Enviado para {email}. Confira a caixa de entrada (e o spam)."; `ja_entregue` = "Já enviamos este material para {email}."; `limite` = "Já enviamos o máximo de hoje para este e-mail; o material está aqui."; todos com o link do material. Evento `material_solicitado` ganha `entregue: boolean` (true só em `ok`).
- AGENTS.md: substituir na linha do pedido de material "entrega na tela via `MATERIAIS[...].caminho` enquanto não há provedor de e-mail (`enviarMaterial` é o ponto de entrada)" por "o navegador grava o pedido com `id` próprio e chama a Edge Function `enviar-material` (Resend + planilha); `anon` nunca lê a tabela; `descadastro_token` só nas funções".

- [ ] **Step 1: Testes que falham** — em `pedidosMaterial.test.ts`: `montarPedido` gera `id` uuid e `premissas: null` no checklist; dossiê sem premissas lança; dossiê com premissas guarda-as normalizadas; `registrarPedido` devolve `{status:"ok", id}`; `enviarMaterial` mapeia `{ status: "limite" }` → `"limite"` e exceção → `"erro"` (mock de `supabase.functions.invoke`). Em `pedidoMaterial.test.tsx`: `duplicado` → texto "Já enviamos este material"; `ok`+`invoke` `ok` → "Enviado para"; `ok`+`invoke` lança → texto "vamos reenviar" com o link; evento com `entregue: true` só no primeiro caso; nunca e-mail no evento.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar migration, lib, componente, AGENTS.md.**
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/lib/__tests__/pedidosMaterial.test.ts src/test/pedidoMaterial.test.tsx src/lib/__tests__/tomGuia.test.ts`.
- [ ] **Step 5: Commit** — `feat(captação): pedido com id próprio, premissas do dossiê e chamada da função de envio`.

---

### Task 4: Templates de e-mail e payload da planilha (puros)

**Files:**
- Create: `supabase/functions/_shared/emails.ts`, `supabase/functions/_shared/planilha.ts`, `supabase/functions/_shared/emails.test.ts`, `supabase/functions/_shared/planilha.test.ts`
- Create: `docs/planilha-apps-script.gs`, `docs/planilha-apps-script.md`

**Interfaces:**
- `emails.ts`:
  - `export type PedidoEmail = { email: string; nome: string | null; material: "checklist_compra" | "dossie_simulacao"; etapa: "procurando" | "tenho" | "reformar" | null; bairro: string | null; contato_comercial: boolean; descadastro_url: string; site_url: string; resumo?: { bruto: string; liquido: string; rentabilidade: string; reabrir_url: string } }`.
  - `export function montarEmail(p: PedidoEmail): { assunto: string; texto: string; html: string; headers: Record<string,string> }` — assuntos exatos: checklist `"Seu checklist antes de comprar o studio"`; dossiê `` `Sua simulação de studio em ${bairro} — dossiê` ``; `headers = { "List-Unsubscribe": \`<${descadastro_url}>, <mailto:contato@bewild.com.br?subject=cancelar>\`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }`; frase de contato comercial só quando `contato_comercial`; próximo passo por etapa (procurando → `${site_url}/comparar`; tenho → `${site_url}/projecao`; reformar → `orcamentoUrl("dossie"|"guia")`); HTML sem imagem.
  - `export const REMETENTE = "Radar Bewild <radar@bewild.com.br>"`, `export const RESPONDER_PARA = "contato@bewild.com.br"`.
- `planilha.ts`: `export function linhaPlanilha(p: { id: string; created_at: string; nome: string|null; email: string; material: string; bairro: string|null; etapa: string|null; contato_comercial: boolean; boletim: boolean; origem: string }, siteUrl: string, segredo: string): { segredo: string; pedido_id: string; data_hora: string; nome: string; email: string; material: "checklist" | "dossiê"; bairro: string; etapa: string; aceitou_contato: "sim"|"não"; boletim: "sim"|"não"; origem: string; link_admin: string }` — `data_hora` em `America/Sao_Paulo` `dd/mm/aaaa hh:mm`; `link_admin = ${siteUrl}/admin/pedidos?id=${id}`; **nenhuma chave além dessas** (teste verifica `Object.keys`).
- `docs/planilha-apps-script.gs`: `doPost(e)` que valida `segredo` contra `PropertiesService.getScriptProperties().getProperty("SEGREDO")`, deduplica por `pedido_id` na coluna M da aba "Pedidos", anexa A–M na ordem da spec §5, devolve `ContentService` JSON `{ok:true}`/`{ok:false, erro}`. `.md`: passo a passo de publicação (App da Web, executar como o dono, acesso "qualquer pessoa", definir a propriedade SEGREDO, copiar a URL `/exec`) e a fórmula da aba "Para contatar": `=FILTER(Pedidos!A:L; Pedidos!G:G="sim")`.
- `orcamento.ts` (via Tarefa 1 já puro): `OrcamentoLocal` ganha `"dossie"` (modificar `src/lib/orcamento.ts` e rodar `npm run sync-motor`).

- [ ] **Step 1: Testes que falham** — `emails.test.ts`: assuntos exatos; headers `List-Unsubscribe` com a URL; frase de contato só com a flag; sem termos proibidos (`/24 horas|diagnóstico gratuito|garantid|máquina de reservas|lucro/i`) em texto e html; dossiê inclui os três números e `reabrir_url`. `planilha.test.ts`: chaves exatas; `aceitou_contato` sim/não; data em SP (`2026-11-09T03:00:00Z` → `09/11/2026 00:00`); link do admin.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run supabase/functions/_shared/emails.test.ts supabase/functions/_shared/planilha.test.ts src/lib/__tests__/orcamentoUrl.test.ts src/lib/__tests__/motorSync.test.ts`.
- [ ] **Step 5: Commit** — `feat(envio): templates de e-mail, linha da planilha e script do Apps Script`.

---

### Task 5: Dossiê — estrutura e PDF

**Files:**
- Create: `supabase/functions/_shared/dossie.ts`, `supabase/functions/_shared/pdfDossie.ts`, `supabase/functions/_shared/dossie.test.ts`, `supabase/functions/_shared/pdfDossie.test.ts`

**Interfaces:**
- `dossie.ts` (importa só de `./motor/*.ts`):
  - `export type BairroDossie = { nome: string; dailyAvg: number; occupancyPct: number; coletadoEm: string | null; natureza: "observado" | "aproximacao" | "estimativa"; fonteUrl: string | null }` (a função monta a partir de `radar_bairro_atual`; a natureza vem de `naturezaBairro` — como ele está em `radarUi.ts` (impuro), a função recebe `natureza` já resolvida: Brooklin/Vila Olímpia = `"aproximacao"`, lista fixa `BAIRROS_APROXIMACAO = ["Brooklin","Vila Olímpia"]` em `dossie.ts`).
  - `export function montarDossie(e: { premissas: PremissasSimulador; bairro: BairroDossie; versaoCalculo: string; dataEstudo: string; siteUrl: string }): Dossie` onde `Dossie = { titulo: string; cabecalho: Linha[]; premissas: Linha[]; resultado: Linha[]; indicadores: Linha[]; sensibilidade: { cenario: string; liquido: string; rentabilidade: string }[]; confirmar: string[]; avisos: string[]; fontes: { titulo: string; url: string }[]; rodape: { aviso: string; reabrirUrl: string; orcamentoUrl: string } }` e `Linha = { rotulo: string; valor: string; nota?: string }`. Regras: diária/ocupação com nota `"referência GuestFavorites (jan–set/2026, coleta de dd/mm/aaaa)"` quando `premissas.diaria === null`, `"ajustada por você"` quando informada; natureza `"aproximacao"` → nota `"aproximação pelo Itaim Bibi"`; sensibilidade = diária −10 %, ocupação −10 p.p., fixos +10 % via `resultadoShortStay`/`resultadoTradicional`; `confirmar` = lista fixa da spec §4.5; `avisos = [AVISO_UNIVERSO, AVISO_RECEITA, "Hipótese de simulação — não é promessa de resultado."]`; `reabrirUrl = siteUrl + linkReabrirSimulacao({...premissas, bairro: nome})`; `orcamentoUrl = orcamentoUrl("dossie", { bairro: nome, area })`.
  - `export function limparTexto(s: string): string` — remove caracteres fora do WinAnsi (mantém acentos latinos, "²", "–", "—", "R$").
- `pdfDossie.ts`: `export async function desenharDossie(d: Dossie): Promise<Uint8Array>` com `pdf-lib` (A4, Helvetica/Helvetica-Bold, margens 48 pt, quebra de página automática, rodapé em toda página com `d.rodape.aviso` e as duas URLs); aplica `limparTexto` em todo texto desenhado.

- [ ] **Step 1: Testes que falham** — `dossie.test.ts`: paridade Pinheiros (premissas padrão + `{nome:"Pinheiros", dailyAvg:299, occupancyPct:63, coletadoEm:"2026-10-18", natureza:"observado"}`) → `resultado` contém `"R$ 5.651"` e `"R$ 2.164"`; nota "referência GuestFavorites" quando `diaria` nula e "ajustada por você" quando `diaria: 320`; `natureza: "aproximacao"` → nota com "Itaim Bibi"; sensibilidade tem 3 cenários; `reabrirUrl` contém `reabrir=1` e `bairro=pinheiros`; `orcamentoUrl` contém `utm_content=dossie`; `limparTexto("José 🙂 – 30 m²")` → `"José  – 30 m²"`. `pdfDossie.test.ts`: `desenharDossie(montarDossie(...))` devolve `Uint8Array` começando por `%PDF`, com 2–4 páginas (`PDFDocument.load(bytes).getPageCount()`), e não lança com nome `"José 🙂"`.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run supabase/functions/_shared/dossie.test.ts supabase/functions/_shared/pdfDossie.test.ts src/lib/__tests__/rentabilidadeExample.test.ts`.
- [ ] **Step 5: Commit** — `feat(dossie): estrutura e PDF do dossiê da simulação com o motor do simulador`.

---

### Task 6: PDF do checklist no build

**Files:**
- Create: `scripts/pdf-checklist.mjs`, `public/materiais/.gitkeep`
- Modify: `package.json` (`"build"` termina com `&& node scripts/pdf-checklist.mjs`), `.gitignore` (`public/materiais/*.pdf` — gerado no build, não versionado; a Lovable gera no deploy)
- Test: `src/lib/__tests__/pdfChecklist.test.ts`

**Interfaces:**
- **Mover `CHECKLIST_ITEMS` para `src/data/checklistCompra.ts`** (reexportado por `guide-data.ts`, que importa `lucide-react` e por isso não serve ao script; o módulo novo entra em `PUROS` e na cópia do motor). `scripts/pdf-checklist.mjs` importa `CHECKLIST_ITEMS` de `supabase/functions/_shared/motor/checklistCompra.ts` (já sem alias). O script monta HTML A4 (cabeçalho "Radar Bewild · Checklist antes de comprar o studio", um item por linha com "☐ sim ☐ não ☐ conferir" e linha para anotação, rodapé com `ESTUDO_REFORMA_DATA` e `radarbewild.com.br/guia/checklist`) e gera `public/materiais/checklist-compra-studio.pdf` com Playwright (`page.pdf({ format: "A4", printBackground: true })`).
- `pdfChecklist.test.ts`: executa o script (`execFileSync("node", ["scripts/pdf-checklist.mjs"])`) e confere que o arquivo existe, tem > 10 KB e, via `pdf-lib`, 1–2 páginas. Roda sempre (Playwright já é dependência do projeto).

- [ ] **Step 1: Teste que falha.**
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar (mover `CHECKLIST_ITEMS`, script, build, gitignore, `npm run sync-motor`).**
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/lib/__tests__/pdfChecklist.test.ts src/lib/__tests__/modulosPuros.test.ts src/lib/__tests__/motorSync.test.ts src/test/homeRender.test.tsx`; `npm run build` gera o PDF.
- [ ] **Step 5: Commit** — `feat(checklist): PDF do checklist gerado no build`.

---

### Task 7: Edge Functions `enviar-material` e `descadastrar`

**Files:**
- Create: `supabase/functions/enviar-material/index.ts`, `supabase/functions/enviar-material/deno.json` (`{"imports": {"pdf-lib": "npm:pdf-lib@1.17.1"}}`), `supabase/functions/_shared/envio.ts` (lógica pura: validação do corpo, decisão idempotência/limite, montagem do payload do Resend), `supabase/functions/_shared/envio.test.ts`, `supabase/functions/descadastrar/index.ts`, `supabase/functions/_shared/descadastro.ts` + `.test.ts`
- Modify: `supabase/config.toml` (`[functions.enviar-material] verify_jwt = false`, `[functions.descadastrar] verify_jwt = false`), `AGENTS.md`

**Interfaces:**
- `envio.ts`:
  - `export function validarCorpo(b: unknown): { pedido_id: string; forcar: boolean } | null` — `pedido_id` uuid v4 obrigatório; `forcar` só `true` literal.
  - `export function decidirEnvio(p: { entregue_em: string|null }, enviosHoje: number, forcar: boolean): "enviar" | "ja_entregue" | "limite"` — `entregue_em && !forcar` → `ja_entregue`; `enviosHoje >= 5 && !forcar` → `limite`.
  - `export function payloadResend(e: { para: string; email: ReturnType<typeof montarEmail>; anexo: { nome: string; bytes: Uint8Array } }): { from: string; to: string[]; reply_to: string; subject: string; text: string; html: string; headers: Record<string,string>; attachments: { filename: string; content: string }[] }` — `content` em base64.
  - `export function resumirErro(e: unknown): string` — ≤ 200 caracteres, sem `@`.
- `enviar-material/index.ts` (I/O): CORS; `validarCorpo`; se `forcar`, exige `Authorization` + `has_role(admin)` via RPC (padrão de `coletar-guestfavorites`); lê o pedido (`service_role`), conta `enviosHoje`, `decidirEnvio`; checklist → `fetch(${SITE_URL}/materiais/checklist-compra-studio.pdf)`; dossiê → `radar_bairro_atual` do bairro (`dailyAvg`, `occupancyPct`, `coletado_em`, `fonte_url`) → `montarDossie` → `desenharDossie`; sem bairro → `envio_erro = "sem_bairro"`, status `erro_envio`; `POST https://api.resend.com/emails` com `Authorization: Bearer RESEND_API_KEY`; `UPDATE entregue_em` ou `envio_erro`; `POST PLANILHA_WEBHOOK_URL` com `linhaPlanilha(...)` (sem URL configurada → `planilha_erro = "sem_configuracao"`); `UPDATE planilha_em` ou `planilha_erro`; devolve `{ status }`. `descadastro_url = ${SITE_URL}/descadastro?token=${descadastro_token}`.
- `descadastro.ts`: `export function validarToken(b: unknown): string | null` (uuid; aceita JSON `{token}` ou `application/x-www-form-urlencoded` com `token`); `descadastrar/index.ts`: localiza `email_chave` pelo token, `UPDATE … SET boletim=false, contato_comercial=false, descadastrado_em=now() WHERE email_chave=$1`, devolve `{ ok: true }`; token inválido/inexistente → `{ ok: false }` (200).
- AGENTS.md: linha "Envio de material: `enviar-material` (idempotente por `entregue_em`, limite 5/dia por e-mail, Resend + planilha, erros em `envio_erro`/`planilha_erro`); `descadastrar` zera boletim e contato de todos os pedidos do e-mail pelo `descadastro_token`. Segredos `RESEND_API_KEY`, `PLANILHA_WEBHOOK_URL`, `PLANILHA_SEGREDO`, `SITE_URL`. Motor em `_shared/motor` é cópia gerada (`npm run sync-motor`)."

- [ ] **Step 1: Testes que falham** — `envio.test.ts`: `validarCorpo` rejeita não-uuid, `forcar: "true"`; `decidirEnvio` nos três casos (+ `forcar` ignora os dois); `payloadResend` tem `attachments[0].content` base64 de `bytes`, `from === REMETENTE`, headers presentes; `resumirErro("falha para pedro@x.com")` sem `@`. `descadastro.test.ts`: `validarToken` com JSON e form.
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar módulos puros, os dois `index.ts`, `config.toml`, AGENTS.md.** `index.ts` segue o esqueleto de `coletar-guestfavorites/index.ts` (serve, corsHeaders, createClient com `service_role`).
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run supabase/functions/_shared/envio.test.ts supabase/functions/_shared/descadastro.test.ts`. Os módulos puros são tipados pelo Vitest/esbuild; os dois `index.ts` (Deno) não têm checagem local (sem Deno no ambiente) — o implementador os escreve no esqueleto de `coletar-guestfavorites/index.ts` e registra no relatório que a validação final é o deploy da Lovable.
- [ ] **Step 5: Commit** — `feat(funcoes): enviar-material (Resend + planilha) e descadastrar`.

---

### Task 8: Dossiê na /projecao, descadastro no site, admin

**Files:**
- Modify: `src/components/projecao/ProjecaoStudio.tsx` (bloco "Receber esta conta por e-mail" antes da `Secao id="proximo-passo"`: `<PedidoMaterial material="dossie_simulacao" origem="projecao" bairro={bairro?.name ?? null} premissas={{ ...p, bairro: bairro?.name ?? p.bairro }} />`, dentro de `ClientOnly` se a página for estática)
- Create: `src/pages/Descadastro.tsx`, rota `/descadastro` em `src/App.tsx` (pública, lazy), `src/lib/descadastroCliente.ts` (`descadastrar(token): Promise<"ok" | "invalido" | "erro">` via `functions.invoke("descadastrar")`), `src/test/descadastro.test.tsx`
- Modify: `src/data/seoRoutes.json` (`"/descadastro"` em `privatePrefixes`), `src/pages/AdminPedidos.tsx` lê `?id=` da query e destaca/filtra essa linha (é o link que a planilha recebe), `src/lib/pedidosAdmin.ts` (`PedidoAdmin` ganha `entregue_em`, `envio_erro`, `planilha_em`, `planilha_erro`; `reenviar(id): Promise<ResultadoEnvio>` → `functions.invoke("enviar-material", { body: { pedido_id: id, forcar: true } })`; filtro `comErro?: boolean` → `.or("envio_erro.not.is.null,planilha_erro.not.is.null")`; CSV ganha colunas `entregue;planilha`), `src/pages/AdminPedidos.tsx` (colunas "Entregue"/"Planilha" com data ou ícone + texto do erro, botão "Reenviar" por linha, filtro "Com erro")
- Test: `src/test/simuladorRender.test.tsx` (bloco presente), `src/lib/__tests__/pedidosAdmin.test.ts`, `src/lib/__tests__/seo.test.ts`

**Interfaces:**
- `Descadastro.tsx`: lê `token` da query **em efeito** (SSR = hidratação não se aplica, mas a regra vale); estados `processando` → `ok` ("Pronto. Você não receberá mais comunicações do Radar Bewild.") / `invalido` ("Link inválido ou já usado — escreva para contato@bewild.com.br.") / `erro` ("Não foi possível processar agora; tente de novo ou escreva para contato@bewild.com.br."); `Seo noindex`; sem `trackGlobal`.

- [ ] **Step 1: Testes que falham** — render da /projecao contém "Receber esta conta por e-mail"; `descadastro.test.tsx`: os três estados com `invoke` mockado; `pedidosAdmin.test.ts`: `comErro` chama `.or(...)` com a string exata; CSV header `data;e-mail;nome;material;etapa;bairro;origem;boletim;contato comercial;status;responsável;motivo;entregue;planilha`; `seo.test.ts`: `/descadastro` privado (fora do sitemap).
- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar e ver passar** — `npx vitest run src/test/simuladorRender.test.tsx src/test/descadastro.test.tsx src/lib/__tests__/pedidosAdmin.test.ts src/lib/__tests__/seo.test.ts src/lib/__tests__/navegacao.test.ts`; `npm run build`.
- [ ] **Step 5: Commit** — `feat(dossie): pedido na /projecao, página de descadastro e reenvio no admin`.

---

### Task 9: Verificação do conjunto, registro e PR

**Files:**
- Create: `docs/entrega-email-planilha-2026-11.md` (o que entrou, segredos a configurar, DNS do Resend, publicação do Apps Script, roteiro manual, pendências)
- Modify: `docs/pacote-p0-2026-10-27.md` (pendências "provedor de e-mail" e "CRM" → resolvidas/encaminhadas)

- [ ] **Step 1:** `npx vitest run` (tudo verde), `npx tsc --noEmit -p tsconfig.app.json` (só os 4 de MapaRadar), `npx eslint .` (0 erros), `npm run build` (sync-motor + PDF do checklist + pré-render).
- [ ] **Step 2:** Conferência visual headless a 320/414/1280 px: /projecao (bloco do dossiê e estados), /descadastro?token=…, /admin/pedidos (login).
- [ ] **Step 3:** `git fetch origin && git log --oneline HEAD..origin/main` — se a Lovable tiver commits novos, fazer merge da `main` na branch antes do PR.
- [ ] **Step 4:** Escrever o registro; PR para a `main` com a lista do que o Pedro precisa fazer **antes** de publicar: (1) aplicar a migration pelo conector do Lovable; (2) segredos `RESEND_API_KEY`, `SITE_URL`; (3) DNS do Resend para `bewild.com.br`; (4) criar a planilha, colar o `.gs`, publicar e configurar `PLANILHA_WEBHOOK_URL`/`PLANILHA_SEGREDO`; (5) roteiro manual da spec §8.
