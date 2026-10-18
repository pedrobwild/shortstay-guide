# SEO do Radar em paridade com o bewild.com.br — 18/10/2026

Levantamento do que o site bewild.com.br (TanStack Start com SSR, hospedagem Lovable/Cloudflare) implementa para SEO e rankeamento, e o que foi trazido para o Radar (SPA React pré-renderizada no build, hospedagem Lovable). O que depende de servidor (301, cabeçalhos HTTP, 404 real, painel `/admin/seo`) não se aplica à SPA e fica registrado no fim.

## O que entrou (branch `claude/seo-paridade-site-bewild`)

| Área | Site bewild.com.br | Radar (agora) |
|---|---|---|
| Head global | theme-color, CSP mínimo, og:locale, dimensões e alt da imagem OG, geo.region/placename, manifest, verificações | `index.html`: tudo isso (verificações pendentes, ver abaixo); preconnect ao Supabase; preload das fontes |
| Head por rota | `seoHead()`: robots com `max-*`, canonical limpo, hreflang pt-BR + x-default, og:type, image alt, keywords | `Seo` em `RouteSeo.tsx` com as mesmas tags; `seoRoutes.json` ganhou `keywords`; `caminhoCanonico()` tira query, hash e barra final |
| Título | `brandTitle`: " \| Bewild" só se o total cabe em 60 caracteres | `tituloComMarca()` em `seo.ts`; os títulos de `seoRoutes.json` ficam sem o sufixo e o teste barra sufixo e títulos > 60 |
| Descrição | `clampDescription` em 160 | teste cobra 50–160 caracteres (a de /metodologia foi encurtada) |
| JSON-LD | Um `<script>` por nó; WebPage/CollectionPage com `BreadcrumbList` aninhada; Article nos posts; ItemList nas coleções; Dataset; nada de Review/AggregateRating | `src/lib/seoJsonLd.ts`: WebPage/CollectionPage + trilha em toda página (fora a home), Article nos `/guia/*` (autor = Organization Bewild, datas no fuso -03:00 vindas do git), ItemList dos bairros em /ranking e /mercado, `about: Place` na página de bairro; Organization continua o nó `#org` do site |
| Sitemap | lastmod (git), changefreq, priority; gerado no prebuild e versionado | `prerender.mjs`: lastmod = último commit dos arquivos da página (bairro: também a `coletadoEm`); num clone raso o commit de borda não vale e cai para a data já publicada; gravado em `dist/` **e** `public/` (a cópia versionada fica igual à publicada) |
| llms.txt | `/llms.txt` + cópia em `/.well-known/`, blocos gerados | `src/lib/llmsTxt.ts` (páginas, 28 bairros com número, natureza e aviso, dados abertos, "Sobre a Bewild" com o aviso de não garantia); teste de igualdade das duas cópias e do gerador |
| robots.txt | privados fora, robôs de IA liberados, assets liberados | mesmo desenho com todos os `privatePrefixes`; **não** bloqueia AhrefsBot/SemrushBot (o Pedro usa as duas ferramentas no Radar) |
| Fontes | próprias, woff2, preload, sem Google Fonts | `public/fonts/` (DM Sans e Playfair Display variáveis, latin, OFL) + `src/fonts.css` + preload; `fontes.test.ts` barra googleapis |
| LCP | preload da imagem principal com fetchpriority | o prerender injeta `<link rel="preload" as="image">` do `<img fetchpriority="high">` da home |
| 404 | página própria, noindex, links de volta | `NotFound.tsx` em pt-BR com navbar, rodapé e caminhos; `/guia/<inexistente>` vira 404 (antes ia para a home); `dist/404.html` gerado |
| URL canônica | 301 para minúsculas sem barra final | `NormalizarCaminho` (cliente): barra final e maiúsculas → canônico, mantendo query e hash; ids e admin ficam de fora |
| Acessibilidade | skip link, `<main id="main">`, "(abre em nova aba)" | `SkipLink` + `<main id="conteudo" tabIndex={-1}>` nas públicas; `NovaAba` em `OrcamentoButton`, `FonteLink` e rodapé |
| Links internos | mapa do site no SSR | a `<nav>` do HTML estático lista todas as públicas (entraram /comparar, /guia/* e /metodologia) |
| IndexNow | chave em `public/`, script, workflow no push | `public/<chave>.txt`, `scripts/submit-indexnow.mjs` (`npm run indexnow`), workflow semanal + manual lendo o sitemap **publicado** (o Radar não publica a cada push) |
| Testes | sitemapParidade, jsonLdIntegridade, llmsTxt, fonts… | `seo.test.ts`, `seoJsonLd.test.ts`, `llmsTxt.test.ts`, `fontes.test.ts` |

## Pendências para o Pedro
1. **Verificações de domínio**: a tag `google-site-verification` e a `facebook-domain-verification` são por domínio; as do site não valem para radarbewild.com.br. Pegar os tokens no Search Console e no Meta Business e acrescentar em `index.html` (ou verificar por DNS).
2. **Ícone 512 px** para o manifest: só existe fonte de 200 px (`bewild-symbol.webp`); hoje o manifest usa 180 e 192.
3. **Vila Nova Conceição** está em `seoRoutes.bairros` sem estar na base de 28: a página pré-renderizada sai sem número (o app mostra a estimativa 2025 de `bairro_airbnb_sp`). Manter ou tirar do sitemap?
4. Rodar o workflow IndexNow (Actions → IndexNow → Run workflow) depois de cada publicação.
5. As instruções do projeto no claude.ai ainda listam Pinheiros 62% / R$ 300 / 2.424; a `main` já tem a rodada de 18/10 (63% / R$ 299 / 2.452) — o llms.txt e os dados abertos saem com a base atual.

## O que não se aplica à SPA (fica como está)
- 301 no servidor (host canônico, minúsculas, rotas antigas): a hospedagem da SPA responde 200 com a home; o canonical, o noindex e o `NormalizarCaminho` fazem o papel.
- Cabeçalhos HTTP de cache/segurança e 404 real: dependem do servidor. O site também não tem os de segurança; só o CSP por meta, replicado.
- Painel `/admin/seo`, edge functions `search-console-stats`, `index-tracker`, `seo-audit`, `gbp-sync`: do site; o Radar lê os números pelas ferramentas conectadas (Ahrefs/Semrush) quando precisar.
- Imagem OG por página: só há uma imagem de compartilhamento no Radar.
