# Entrega por e-mail (Resend) e planilha do comercial — desenho

*Radar Bewild · 09/11/2026 · decisões do Pedro: Resend como provedor, remetente `radar@bewild.com.br`; planilha nova no Google Sheets alimentada por Apps Script, consumida por alguém do comercial; escopo "checklist + dossiê da simulação", ambos em PDF anexado; sem double opt-in nesta rodada.*

Continuação do pacote P0 (`docs/pacote-p0-2026-10-27.md`) e do documento "Plano completo de melhorias" (27/10/2026, dias 16–30: "dossiê inicial, captura simples, confirmação de entrega e encaminhamento").

## 1. Objetivo e critérios de sucesso

Fechar o ciclo da captura: quem pede recebe algo de verdade por e-mail (PDF), e o comercial recebe o lead onde trabalha (planilha), sem depender do admin do Radar.

Sucesso, medido no site publicado:
1. Pedido de checklist → e-mail com PDF em até 1 minuto; linha na planilha; `entregue_em` e `planilha_em` preenchidos no admin.
2. Pedido de dossiê na /projecao → e-mail com PDF da **mesma conta** da tela (paridade com o simulador) e link para reabri-la.
3. Clique em "cancelar" no e-mail → nenhuma comunicação futura para aquele e-mail (as duas flags zeradas em todos os pedidos).
4. Falha de envio ou de planilha fica visível no `/admin/pedidos` e é reenviável com um clique.
5. Nenhum dado pessoal em evento de marketing, URL pública, log ou PDF de terceiros.

Fora desta rodada: double opt-in; boletim como envio recorrente; sincronizar o status da planilha de volta ao admin; PDF do dossiê com o visual completo do site; CRM.

## 2. Dados (migration `20261109…_pedidos_material_envio.sql`)

Tabela `public.radar_pedidos_material` (criada em 20261027130000, aceite em 20261103120000):

| Mudança | Detalhe |
|---|---|
| `material` | CHECK passa a aceitar `'checklist_compra'` e `'dossie_simulacao'`. |
| `premissas jsonb` (nova) | `PremissasSimulador` íntegra da conta pedida (só números e escolhas; `normalizarPremissasSimulador` na leitura). NULL para checklist. GRANT INSERT por coluna a `anon, authenticated`. |
| `premissas_chave text` (nova, gerada) | `GENERATED ALWAYS AS (coalesce(md5(premissas::text), '')) STORED`. |
| Índice único | o atual `(email_chave, material)` é substituído por `(email_chave, material, premissas_chave)`: mesmo e-mail pode pedir dossiês de contas diferentes; nunca o mesmo duas vezes; checklist continua um por e-mail. |
| `entregue_em timestamptz` | já existe; passa a ser gravado pela função ao confirmar o envio. |
| `envio_erro text` (nova) | último erro do envio: código/mensagem curta, sem PII, ≤ 200 caracteres. |
| `planilha_em timestamptz`, `planilha_erro text` (novas) | idem para a planilha. |
| `descadastro_token uuid NOT NULL DEFAULT gen_random_uuid()` (nova) | único por pedido; índice único. |
| `descadastrado_em timestamptz` (nova) | gravado pela função de descadastro. |

Privilégios: `anon`/`authenticated` só INSERT por coluna (acrescenta `premissas`); SELECT/UPDATE continuam só admin via `has_role`; as funções usam `service_role`. O `descadastro_token` **nunca** é lido pelo navegador: só a função de envio (para montar o link) e a de descadastro (para localizar o pedido).

Abuso: a função de envio recusa quando o e-mail já tem **5 envios entregues no dia** (contagem em `radar_pedidos_material` por `email_chave` e `entregue_em >= now() - interval '1 day'`) e devolve `"limite"`; o navegador mostra o material na tela e a frase "já enviamos o máximo de hoje para este e-mail".

## 3. Fluxo de envio

```
navegador                     Edge Function enviar-material                 externos
─────────                     ────────────────────────────                  ────────
registrarPedido() ──INSERT──▶ (banco)
invoke("enviar-material",
  { pedido_id }) ───────────▶ 1 lê o pedido (service_role)
                              2 idempotência: entregue_em? → "ja_entregue"
                              3 limite diário do e-mail? → "limite"
                              4 monta PDF (checklist: lê /materiais/*.pdf;
                                dossiê: pdf-lib com o motor do simulador)
                              5 Resend: e-mail + anexo + List-Unsubscribe ──▶ Resend
                              6 UPDATE entregue_em (ou envio_erro)
                              7 POST Apps Script {segredo, pedido…} ────────▶ Google Sheets
                              8 UPDATE planilha_em (ou planilha_erro)
◀── { status: "ok" | "ja_entregue" | "limite" | "erro_envio" | "erro_planilha" }
```

- Passos 5–6 e 7–8 são independentes: falha num não impede o outro; cada um grava seu erro.
- `verify_jwt = false` (chamada anônima); o corpo aceita **só** `{ pedido_id: uuid }` (validação estrita) ou, para o reenvio pelo admin, `{ pedido_id, forcar: true }` com JWT válido + `has_role(admin)` — sem isso `forcar` é ignorado.
- Segredos (Lovable Cloud): `RESEND_API_KEY`, `PLANILHA_WEBHOOK_URL`, `PLANILHA_SEGREDO`, `SITE_URL` (`https://radarbewild.com.br`). Nada disso chega ao frontend.
- Logs da função: `pedido_id`, status e código do erro; nunca e-mail, nome ou conteúdo.

### Frontend
- `PedidoMaterial` ganha o material `dossie_simulacao` e a prop `premissas?: PremissasSimulador` (obrigatória para o dossiê); após `registrarPedido() === "ok" | "duplicado"` chama `enviarMaterial(pedidoId)` (hoje um stub) → `functions.invoke`.
- Estados novos: "Enviado para <e-mail>" (sucesso), "Já enviamos este material para <e-mail>" (`ja_entregue`), "Já enviamos o máximo de hoje para este e-mail" (`limite`), e para `erro_*`/falha de rede o estado atual (material na tela + "não conseguimos enviar agora; vamos reenviar").
- `/projecao`: bloco "Receber esta conta por e-mail" abaixo do resultado e antes da ponte de orçamento, usando `PedidoMaterial material="dossie_simulacao" origem="projecao" premissas={p}` (com `bairro: bairro.name`).
- **Id do pedido gerado no navegador** (`crypto.randomUUID()`, enviado no INSERT — a coluna `id` entra no GRANT INSERT por coluna): assim `registrarPedido` devolve `{ status, id }` sem precisar de SELECT para o `anon`. No caso `duplicado` (erro 23505) o navegador não conhece o pedido existente e **não** chama a função: mostra "Já enviamos este material para <e-mail>" com o material na tela (a função nunca aceita busca por e-mail).
- Telemetria: `material_solicitado` ganha `entregue: boolean`; nunca e-mail.
- `/admin/pedidos`: colunas "Entregue" (data ou ícone de erro com `envio_erro`) e "Planilha" (idem), botão "Reenviar" (chama a função com `forcar: true`), filtro "Com erro".

## 4. Os dois PDFs

### Checklist (conteúdo fixo) — gerado no build
- `scripts/pdf-checklist.mjs` roda após o `vite build` (ao lado do `prerender.mjs`): renderiza com Playwright uma página HTML montada a partir do **mesmo conteúdo** de `ChecklistSection` — os 10 itens já vivem em `CHECKLIST_ITEMS` (`src/data/guide-data.ts`), que o script importa; nada é duplicado e salva `public/materiais/checklist-compra-studio.pdf` (A4, cabeçalho "Radar Bewild · Checklist antes de comprar o studio", cada item com caixas "☐ sim ☐ não ☐ conferir" e linha para anotação, rodapé com data e `radarbewild.com.br/guia/checklist`).
- A função anexa esse arquivo lendo `${SITE_URL}/materiais/checklist-compra-studio.pdf` (fetch) — evita embutir binário na função.
- Teste: `scripts/__tests__`/Vitest verifica que o PDF existe após o build e contém o título e ≥ número de itens do checklist (via `pdf-parse` ou contagem de texto com `pdf-lib`).

### Dossiê (por pessoa) — gerado na função com `pdf-lib`
Módulo puro `supabase/functions/_shared/dossie.ts` (testável em Vitest, sem Deno-only APIs), que recebe `{ premissas, bairro: BairroRadar | null, coletadoEm, versaoCalculo, data }` e devolve a **estrutura** do dossiê (seções, linhas, números já formatados em pt-BR); `pdfDossie.ts` desenha essa estrutura com `pdf-lib` (Helvetica embutida, A4, 2–3 páginas). Seções:
1. Cabeçalho: bairro, faixa de área, finalidade (`modo`), data do estudo, `versao_calculo`.
2. Premissas: diária e ocupação com a marcação "referência GuestFavorites (jan–set/2026, coleta de dd/mm/aaaa)" **ou** "ajustada por você"; decoração; valor do imóvel, reforma (sugerida ou informada), condomínio, IPTU, ITBI se marcado; deduções com `TEXTO_DRE_PERCENTUAIS` (fonte única `dreGuia.ts`).
3. Resultado: receita bruta → deduções em % e em reais → resultado líquido mensal; investimento total, rentabilidade anual e prazo estimado de retorno (rótulos acessíveis; "ROI/payback" só em nota).
4. Sensibilidade (hipóteses, sem probabilidade): diária −10%; ocupação −10 p.p.; custos fixos +10% — recalculadas com `resultadoShortStay`/`resultadoTradicional`/`indicadores`.
5. "O que ainda falta confirmar": condomínio real, IPTU, convenção/regras do prédio para short stay, prazo das chaves, custo de reforma por orçamento; `AVISO_UNIVERSO`; fontes com título e link (`fontesGuia.ts`).
6. Rodapé em toda página: "Hipótese de simulação — não é promessa de resultado", link para reabrir (`linkReabrirSimulacao`, com `reabrir=1`), link de orçamento (`orcamentoUrl("dossie", { bairro, area })` — novo local `dossie`).

**Reaproveitamento do motor:** a função importa por caminho relativo os módulos puros `src/lib/simuladorReceita.ts`, `src/data/dreGuia.ts`, `src/data/provasBewild.ts`, `src/lib/estudo.ts` (AVISO), `src/lib/numberFormat.ts`, `src/lib/orcamento.ts`, `src/lib/projetoSimulacao.ts`. Verificado em 09/11: esses módulos só importam uns aos outros (`estudo.ts` também importa `radarUi.ts`, puro); nenhum importa React, `window` ou `@/integrations`. O plano confirma isso com um teste que carrega os módulos em Node sem jsdom. Alias `@/` não existe em Deno → os módulos compartilhados usam imports relativos ou a função declara um `import_map`/`deno.json` com `"@/": "../../../src/"`.

**Paridade:** teste com as premissas padrão de Pinheiros (base de 18/10/2026) → o dossiê mostra R$ 5.651 bruto e R$ 2.164 líquido/mês (`rentabilidadeExample.test.ts` é a referência).

## 5. Planilha (Google Sheets + Apps Script)

- Planilha nova "Radar Bewild — Pedidos" (Pedro cria e compartilha com o comercial). Abas: **Pedidos** (todas as linhas, escritas pelo script) e **Para contatar** (`=FILTER(Pedidos!A:L; Pedidos!G:G="sim")`, só leitura).
- Colunas de Pedidos: A data/hora (America/Sao_Paulo) · B nome · C e-mail · D material (checklist / dossiê) · E bairro · F etapa · G aceitou contato (sim/não) · H boletim (sim/não) · I origem · J link do pedido no admin (`${SITE_URL}/admin/pedidos?id=…`) · K status (livre para o comercial) · L observações (livre) · M pedido_id (oculta, para dedupe).
- Script `doPost(e)` (entregue em `docs/planilha-apps-script.gs`, com instruções): valida `segredo` (igual a `PLANILHA_SEGREDO`), rejeita sem `pedido_id`, **deduplica** por `pedido_id` (coluna M), anexa a linha, devolve `{ ok: true }`. Publicar como App da Web: executar como o dono, acesso "qualquer pessoa"; a URL `/exec` vira `PLANILHA_WEBHOOK_URL`.
- A função envia só os campos acima (nenhum dado além dos que o comercial precisa; nada de `sessao`, token ou premissas).
- Status da planilha e `status_comercial` do admin são independentes nesta rodada.

## 6. Descadastro

- Rota pública `/descadastro?token=<uuid>` (`noindex`, fora do sitemap, sem telemetria além do consentido). Página mínima no visual `estudo`: estados "processando", "Pronto. Você não receberá mais comunicações do Radar Bewild." e "Link inválido ou já usado — escreva para contato@bewild.com.br".
- Edge Function `descadastrar` (`verify_jwt = false`): corpo `{ token: uuid }`; localiza o pedido; `UPDATE radar_pedidos_material SET boletim=false, contato_comercial=false, descadastrado_em=now() WHERE email_chave = (…)` para **todos** os pedidos daquele e-mail; devolve `{ ok: true }` ou `{ ok: false }` — nunca o e-mail. Token inexistente → `ok: false` (sem distinguir "nunca existiu" de "já usado").
- Todo e-mail leva o cabeçalho `List-Unsubscribe: <${SITE_URL}/descadastro?token=…>, <mailto:contato@bewild.com.br?subject=cancelar>` e `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (a função trata também o POST one-click do Gmail/Outlook na rota `/functions/v1/descadastrar` com `token` no corpo de formulário).
- Pessoa descadastrada que pede material de novo: o pedido é aceito e o material enviado (foi ela que pediu), mas `boletim`/`contato_comercial` só valem o que ela marcar no novo pedido — e o comercial vê na planilha a linha nova.

## 7. E-mails

Templates em `supabase/functions/_shared/emails.ts` (texto puro + HTML mínimo, sem imagem rastreadora), remetente `Radar Bewild <radar@bewild.com.br>`, `reply_to: contato@bewild.com.br`.

| Material | Assunto | Corpo (resumo) |
|---|---|---|
| Checklist | "Seu checklist antes de comprar o studio" | o que é; PDF em anexo; link `/guia/checklist`; uma linha de próximo passo pela etapa (`procurando` → comparar bairros; `tenho` → simular; `reformar` → pedir orçamento); descadastro. |
| Dossiê | "Sua simulação de studio em {bairro} — dossiê" | três números (bruto, líquido, rentabilidade anual) com "hipótese de simulação"; PDF em anexo; link para reabrir a conta; descadastro. |

Quem marcou `contato_comercial` recebe a frase: "A Bewild pode entrar em contato sobre a reforma do seu studio; se preferir não receber, cancele pelo link abaixo." Textos passam pelo teste de tom (barra "24 horas", "diagnóstico gratuito", "garantid", "máquina de reservas", "lucro", "ROI/yield/payback" como rótulo).

Do lado do Pedro: chave no Resend (já há conta), registros DNS do domínio `bewild.com.br` que o Resend exibir (DKIM, SPF/return-path, DMARC) — o plano lista os nomes exatos quando a chave for criada.

## 8. Testes e verificação

- **Vitest (como hoje):** `dossie.ts` (estrutura, marcação referência/ajustada, sensibilidade, paridade Pinheiros R$ 5.651 → R$ 2.164), `emails.ts` (assuntos, frases, tom), `pedidosMaterial.ts` (id gerado no navegador, `premissas` só no dossiê, estados), `PedidoMaterial` render (botão do dossiê, estados `ok`/`ja_entregue`/`limite`/erro), `pedidosAdmin` (colunas e filtro "Com erro"), descadastro (página e estados), build do PDF do checklist (arquivo existe, título e itens).
- **Deno test** nas funções: validação do corpo, idempotência (`entregue_em` → `ja_entregue`), limite diário, montagem do payload da planilha (sem campos extras), `descadastrar` com token inválido — Resend, Supabase e fetch mockados.
- **Roteiro manual no site publicado (Pedro):** pedir checklist e dossiê com um e-mail próprio; ver os dois PDFs; clicar no cancelamento; conferir a linha na planilha e `/admin/pedidos`; forçar um erro (segredo da planilha errado em preview) e ver o botão "Reenviar".

## 9. Dependências e ordem

1. Migration (seção 2) aplicada **pelo conector do Lovable antes do deploy** (o push na main não aplica migrations — lição de 08/11).
2. Segredos no Lovable Cloud: `RESEND_API_KEY`, `SITE_URL`; `PLANILHA_WEBHOOK_URL` e `PLANILHA_SEGREDO` quando o Apps Script estiver publicado (até lá a função grava `planilha_erro = "sem_configuracao"` e segue).
3. DNS do Resend verificado antes do primeiro envio real (em preview, Resend aceita envio só para o e-mail da conta).
4. Build gera o PDF do checklist; sem ele o build falha.

## 10. Riscos

- **Paridade do dossiê com a tela:** mitigado por reaproveitar o motor e pelo teste de paridade; qualquer mudança no simulador quebra o teste do dossiê de propósito.
- **Fontes em pdf-lib:** Helvetica embutida não tem todos os glifos (ex.: "²" em "m²" e "–" existem no WinAnsi; emojis não). Evitar símbolos fora do WinAnsi; teste de geração com todos os textos.
- **Apps Script "qualquer pessoa":** protegido só pelo segredo; a URL não aparece no frontend. Rotacionar o segredo troca dois lugares (script e Lovable Cloud).
- **Entregabilidade:** DKIM/SPF/DMARC corretos e `List-Unsubscribe` reduzem risco de spam; volume baixo.
