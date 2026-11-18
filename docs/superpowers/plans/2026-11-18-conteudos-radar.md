# Área de conteúdos do Radar — plano de execução

> **Para quem executa:** seguir tarefa a tarefa (superpowers:executing-plans). Passos com `- [ ]`.

**Objetivo:** publicar artigos, releases e estudos no Radar, com página estática por texto e SEO completo.

**Arquitetura:** a tabela `radar_noticias` ganha tipo, slug e corpo; `src/lib/conteudosRadar.ts` concentra regras e leituras; o build lê os publicados com a chave pública (como os empreendimentos) e gera HTML, sitemap, RSS e llms.txt.

**Stack:** React 18, Vite, Supabase (Lovable Cloud), zod, react-markdown (já instalado), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-18-conteudos-radar-design.md`

## Restrições globais

- Sem tabela nova e sem biblioteca nova. `types.ts`, `client.ts` e `.env` não são editados.
- pt-BR em UI, comentários e commits. Marca visível "Bewild". Só tokens de `src/index.css`.
- Toda página pública nova monta `RodapeRadar`; o build para sem os links de retorno.
- Escrita em `radar_noticias` só por admin. Rascunho nunca entra em build, sitemap ou feed.
- Não publicar o site. PR contra `main`.

## Pontos de atenção na revisão

1. Slug igual a um nome de tipo (`artigos`, `releases`, `estudos`) → recusado no cadastro.
2. Corpo com HTML cru ou `javascript:` em link → não renderiza como HTML nem vira link.
3. Texto com `canonical_externo` → canonical aponta para o site e a página sai do sitemap e do feed.
4. Banco fora do ar no build → build segue sem as páginas de texto, como nos empreendimentos.
5. Linhas antigas (só link) → continuam válidas e listadas, sem slug nem corpo.

## Arquivos

- Criar: `supabase/migrations/20261118090000_radar_noticias_conteudos.sql`
- Criar: `src/lib/conteudosRadar.ts`, `src/lib/conteudosFeed.ts`
- Criar: `src/components/conteudos/CorpoConteudo.tsx`, `ConteudoArtigo.tsx`, `ConteudosEstatico.tsx`
- Criar: `src/components/admin/FormConteudo.tsx`
- Criar: `src/pages/Conteudos.tsx`, `src/pages/ConteudoDetalhe.tsx` (sai `src/pages/Posts.tsx`)
- Alterar: `src/App.tsx`, `src/components/RouteSeo.tsx`, `src/lib/seoJsonLd.ts`, `src/lib/llmsTxt.ts`,
  `src/lib/noticiasRadar.ts`, `src/lib/loginDestino.ts`, `src/lib/orcamento.ts`, `src/data/navegacao.ts`,
  `src/data/seoRoutes.json`, `src/entry-server.tsx`, `scripts/prerender.mjs`, `src/pages/AdminNoticias.tsx`,
  `src/components/admin/AdminTabs.tsx`, `src/components/NoticiasRelacionadas.tsx`, `AGENTS.md`
- Testes: `src/lib/__tests__/conteudosRadar.test.ts`, `conteudosFeed.test.ts`, e ajustes em
  `seoJsonLd.test.ts`, `navegacao.test.ts`, `loginDestino.test.ts`, `passosEstudo.test.ts`, `llmsTxt.test.ts`

## Tarefa 1 — Regras e leituras (`conteudosRadar.ts`)

**Produz:**
- `TIPOS_CONTEUDO: Record<"artigo"|"release"|"estudo", { rotulo; plural; caminho }>` com caminhos `artigos`, `releases`, `estudos`
- `slugificar(titulo: string): string`, `SLUG_CONTEUDO: RegExp`, `SLUGS_RESERVADOS: string[]`
- `conteudoSchema` (zod) e `type ConteudoRadar`
- `caminhoConteudo(slug)`, `caminhoTipo(tipo)`, `tipoPeloCaminho(segmento)`
- `paginaSeoConteudo(c): { path; title; description; h1 }`, `tempoLeituraMin(corpo)`
- `avisosEditoriais(texto): { codigo: "marca"|"termo"|"promessa"|"numero_sem_fonte"; mensagem }[]`
- `ehIndexavel(c)`: publicado, slug válido e sem `canonical_externo`
- `listarConteudosPublicos(pagina, tipo?)`, `buscarConteudo(slug)`, `salvarConteudo(entrada, id?)`

- [ ] Teste: slug de "Diária em Pinheiros: o que mudou?" = `diaria-em-pinheiros-o-que-mudou`; `artigos` recusado;
  `seo_titulo` com 61 caracteres recusado; `canonical_externo` fora de `bewild.com.br` recusado; capa sem `capa_alt` recusada;
  `avisosEditoriais("A BWild garante lucro garantido de 20%")` devolve `marca`, `termo` e `numero_sem_fonte`;
  parágrafo com número e link não gera `numero_sem_fonte`.
- [ ] Implementar e passar.

## Tarefa 2 — Migration

- [ ] `ALTER TABLE radar_noticias`: colunas do spec, `url` aceita nulo, índice único parcial em `slug`,
  CHECK `radar_noticias_forma_por_tipo`, CHECK de slug e reservados, trigger `radar_noticias_publicado_em`
  (SECURITY INVOKER; preenche só na primeira publicação), bucket público `conteudos` (imagem, 5 MB) com
  quatro policies de admin em `storage.objects`.
- [ ] Teste lendo o SQL: sem `CREATE TABLE`; contém o CHECK, o trigger e as policies com `has_role`.

## Tarefa 3 — JSON-LD, head e feed

**Produz:** `conteudoJsonLd(c)` (`Article` | `NewsArticle`), trilha `Início › Conteúdos › texto`, `/conteudos*` como
`CollectionPage`, `itemListConteudosJsonLd(lista, path)`; `Seo` aceita `imagem`, `imagemAlt`, `canonical`, `artigo`;
`rssConteudos(lista, geradoEm): string` em `conteudosFeed.ts`; `gerarLlmsTxt(linhas, geradoEm, conteudos = [])`.

- [ ] Testes: release → `NewsArticle` com `datePublished` e `dateModified`; autor = `#org` sem `autor_nome` e
  `Person` com ele; RSS escapa `&` e `<` e omite texto com `canonical_externo`; llms.txt ganha "## Conteúdos" só com itens.
- [ ] Implementar e passar.

## Tarefa 4 — Páginas públicas

- [ ] `CorpoConteudo` (react-markdown sem HTML cru; títulos rebaixados um nível; link externo em nova aba com aviso;
  só `http(s)`, `mailto` e caminhos internos).
- [ ] `ConteudoArtigo` (apresentação pura, usada no app e no HTML estático).
- [ ] `Conteudos` (índice, com tipo opcional e paginação; links do site Bewild continuam na lista).
- [ ] `ConteudoDetalhe` (`/conteudos/:slug`; segmento de tipo abre o índice; inexistente ou rascunho → 404 com noindex).
- [ ] Rotas em `App.tsx`; `/posts` → `LegacyRedirect`; navegação, `seoRoutes.json`, `loginDestino`, local `conteudos` no orçamento.

## Tarefa 5 — Build

- [ ] `entry-server.tsx`: `COLUNAS_CONTEUDOS_BUILD`, `paginasConteudos(lista)`, `renderConteudoEstatico(c)`,
  `renderIndiceConteudosEstatico(p, lista)`, exportar `rssConteudos`.
- [ ] `prerender.mjs`: leitura dos publicados (função comum com empreendimentos), head de artigo (imagem, datas,
  canonical externo), índices por tipo só com conteúdo, fora do sitemap quando `canonical_externo`, `conteudos/rss.xml`, nav.
- [ ] `npm run build` termina e lista as páginas.

## Tarefa 6 — Admin

- [ ] `FormConteudo` com slug sugerido, pré-visualização, envio de capa, contadores de SEO, avisos (bloqueiam publicar)
  e estado "no ar pelo app" / "em HTML estático" (consulta o `sitemap.xml` publicado).
- [ ] `AdminNoticias`: aba "Conteúdos", botões "Novo link" e "Novo texto", edição pelo tipo da linha.

## Tarefa 7 — Fecho

- [ ] `AGENTS.md` atualizado (regras revertidas e a nova regra de conteúdos).
- [ ] `npm test`, `npx eslint .`, `npm run build`.
- [ ] Commit, push do ramo e PR contra `main`.
