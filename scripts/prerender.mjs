// Pós-build: gera um HTML estático por rota pública (head próprio, JSON-LD e conteúdo
// já no HTML), o sitemap.xml (com lastmod e changefreq), o llms.txt, os dados abertos
// e a página 404. Ao carregar, o React substitui o conteúdo de #root (ou hidrata, na
// home) e o app segue como SPA normalmente. As regras de SEO (título com a marca,
// JSON-LD, llms.txt) vivem em TypeScript (src/lib/seo*.ts, llmsTxt.ts) e chegam aqui
// pelo entry-server; este script só monta arquivos.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { pathToFileURL } from "url";
import { execFileSync } from "child_process";

// Shims mínimos para módulos que tocam storage ao carregar (ex.: cliente de auth).
const memStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } }; };
globalThis.localStorage ??= memStorage();
globalThis.sessionStorage ??= memStorage();
const ssr = await import(pathToFileURL(resolve("dist-ssr/entry-server.js")).href);

const seo = JSON.parse(readFileSync(resolve("src/data/seoRoutes.json"), "utf8"));
const DIST = resolve("dist");
const PUBLIC = resolve("public");
const template = readFileSync(resolve(DIST, "index.html"), "utf8");
const HOJE = ssr.isoSaoPaulo(new Date());

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (n) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ---------- Datas de alteração (lastmod / dateModified) ----------
// Como no bewild.com.br (gitLastmod): data do último commit dos arquivos que compõem a
// página. Sem git no ambiente de build, vale a data já publicada no sitemap versionado;
// sem ela, a data do build.
const sitemapAnterior = new Map();
try {
  const xml = readFileSync(resolve(PUBLIC, "sitemap.xml"), "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) sitemapAnterior.set(m[1], m[2]);
} catch { /* sem sitemap anterior */ }

let gitOk = true;
function git(args) {
  if (!gitOk) return null;
  try { return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null; }
  catch { gitOk = false; return null; }
}
// Num clone raso (shallow), o commit de borda carrega a data de tudo que é mais antigo
// que ele: essa data não vale, e a página cai para a data já publicada no sitemap.
const COMMITS_DE_BORDA = new Set((() => { try { return readFileSync(resolve(".git/shallow"), "utf8").split("\n").filter(Boolean); } catch { return []; } })());
const dataConfiavel = (linha) => { if (!linha) return null; const [hash, data] = linha.split(" "); return COMMITS_DE_BORDA.has(hash) ? null : data; };
const gitUltimoCommit = (arquivos) => dataConfiavel(git(["log", "-1", "--format=%H %cI", "--", ...arquivos]));
const gitPrimeiroCommit = (arquivo) => { const s = git(["log", "--diff-filter=A", "--format=%H %cI", "--", arquivo]); return dataConfiavel(s ? s.split("\n").pop() : null); };
const maisRecente = (...datas) => datas.filter(Boolean).map((d) => ssr.isoSaoPaulo(d)).sort().pop() ?? null;

const BASE_DADOS = ["src/data/bairrosCurados.ts", "src/data/seoRoutes.json"];
const SECOES_GUIA = {
  hospede: "src/components/guide/ReservasSection.tsx",
  "anti-checklist": "src/components/guide/AntiChecklistSection.tsx",
  decoracao: "src/components/guide/DecoracaoSection.tsx",
  tendencias: "src/components/guide/TendenciasSection.tsx",
  "anuncio-e-precificacao": "src/components/guide/AnuncioPrecificacaoSection.tsx",
};
function arquivosDaPagina(p) {
  if (p.bairro) return ["src/pages/IntelligenceBairroDetail.tsx", "src/components/PreRenderMercado.tsx", ...BASE_DADOS];
  if (p.path.startsWith("/guia/")) return ["src/pages/GuiaTema.tsx", SECOES_GUIA[p.path.slice("/guia/".length)], "src/data/seoRoutes.json"].filter(Boolean);
  switch (p.path) {
    case "/": return ["src/pages/Index.tsx", "src/components/guide", "src/data", "src/lib/rentabilidadeExample.ts", "src/lib/simuladorReceita.ts"];
    case "/mercado": return ["src/pages/IntelligenceDashboard.tsx", "src/components/intelligence", "src/components/PreRenderMercado.tsx", ...BASE_DADOS];
    case "/ranking": return ["src/pages/IntelligenceRanking.tsx", "src/components/PreRenderMercado.tsx", ...BASE_DADOS];
    case "/anuncios": return ["src/pages/IntelligenceListings.tsx", ...BASE_DADOS];
    case "/comparar": return ["src/pages/CompararBairros.tsx", "src/lib/comparar.ts", ...BASE_DADOS];
    case "/mapa": return ["src/pages/MapaBairros.tsx", "src/components/mapa", ...BASE_DADOS];
    case "/ferramentas": return ["src/pages/Ferramentas.tsx", "src/data/seoRoutes.json"];
    case "/projecao": return ["src/pages/StudioProjection.tsx", "src/components/projecao", "src/lib/simuladorReceita.ts", ...BASE_DADOS];
    case "/metodologia": return ["src/pages/Metodologia.tsx", "src/lib/dadosAbertos.ts", "src/lib/historicoRadar.ts", ...BASE_DADOS];
    default: return ["src/data/seoRoutes.json"];
  }
}
function datasDaPagina(p) {
  const doCodigo = gitUltimoCommit(arquivosDaPagina(p));
  const daColeta = p.coletadoEm ? `${p.coletadoEm}T12:00:00-03:00` : null;
  const anterior = sitemapAnterior.get(`${seo.siteUrl}${p.path}`) ?? null;
  const dateModified = maisRecente(doCodigo, daColeta) ?? anterior ?? HOJE;
  // Article: publicado quando a página do tema passou a existir (GuiaTema.tsx) ou, para um
  // tema criado depois, quando a seção dele entrou — o que for mais recente.
  const secao = p.path.startsWith("/guia/") ? SECOES_GUIA[p.path.slice("/guia/".length)] : null;
  const datePublished = secao ? (maisRecente(gitPrimeiroCommit("src/pages/GuiaTema.tsx"), gitPrimeiroCommit(secao)) ?? anterior ?? dateModified) : undefined;
  return { dateModified, datePublished };
}

// ---------- Páginas ----------
const changefreq = (p) => (p.path === "/" || ["/mercado", "/ranking", "/mapa"].includes(p.path) ? "weekly" : "monthly");
const reserva = new Map(ssr.bairrosReserva().map((b) => [slugify(b.name), b]));

const pages = [
  ...seo.routes,
  ...seo.bairros.map((name) => ({
    path: `/bairro/${slugify(name)}`,
    title: ssr.bairroTitle(name),
    description: ssr.bairroDescription(name),
    h1: ssr.bairroH1(name),
    bairro: name,
    coletadoEm: reserva.get(slugify(name))?.coletadoEm ?? null,
    priority: "0.8",
  })),
];

// Links internos do HTML estático: todas as páginas públicas, para robôs e leitores sem JavaScript.
const nav = [
  ["/", "Guia"], ["/mercado", "Mercado"], ["/ranking", "Ranking de bairros"], ["/mapa", "Mapa"], ["/comparar", "Comparar bairros"],
  ["/anuncios", "Anúncios"], ["/projecao", "Simulador"], ["/ferramentas", "Ferramentas"],
  ...seo.routes.filter((r) => r.path.startsWith("/guia/")).map((r) => [r.path, r.h1]),
  ["/metodologia", "Metodologia e dados abertos"],
];
const navHtml = `<nav aria-label="Radar Bewild"><ul>${nav.map(([h, l]) => `<li><a href="${h}">${esc(l)}</a></li>`).join("")}</ul></nav>`;

const jsonLdScript = (no) => `<script type="application/ld+json">${JSON.stringify(no).replace(/</g, "\\u003c")}</script>`;

/** Remove do modelo as tags que cada página redefine (as globais — og:locale, dimensões da imagem, ícones — ficam). */
function limparHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/\s*<meta (name="(description|keywords|robots)"|property="og:(type|title|description|url|site_name|image|image:alt)"|name="twitter:(title|description|image|image:alt)")[^>]*>/g, "")
    .replace(/\s*<link rel="(canonical|alternate)"[^>]*>/g, "");
}

function headDaPagina(p, { noindex = false, extras = [], jsonLd = [] } = {}) {
  const url = `${seo.siteUrl}${ssr.caminhoCanonico(p.path)}`;
  const titulo = ssr.tituloComMarca(p.title);
  const ogType = p.path.startsWith("/guia/") ? "article" : "website";
  const linhas = [
    `<title>${esc(titulo)}</title>`,
    `<meta name="description" content="${esc(p.description)}" data-rh="true" />`,
    p.keywords ? `<meta name="keywords" content="${esc(p.keywords)}" data-rh="true" />` : null,
    `<meta name="robots" content="${noindex ? ssr.ROBOTS_NOINDEX : ssr.ROBOTS_INDEXAVEL}" data-rh="true" />`,
    noindex ? null : `<link rel="canonical" href="${url}" data-rh="true" />`,
    noindex ? null : `<link rel="alternate" hreflang="pt-BR" href="${url}" data-rh="true" />`,
    noindex ? null : `<link rel="alternate" hreflang="x-default" href="${url}" data-rh="true" />`,
    `<meta property="og:type" content="${ogType}" data-rh="true" />`,
    `<meta property="og:title" content="${esc(titulo)}" data-rh="true" />`,
    `<meta property="og:description" content="${esc(p.description)}" data-rh="true" />`,
    `<meta property="og:url" content="${url}" data-rh="true" />`,
    `<meta property="og:site_name" content="${esc(seo.siteName)}" data-rh="true" />`,
    noindex ? null : `<meta property="og:image" content="${ssr.OG_IMAGEM}" data-rh="true" />`,
    noindex ? null : `<meta property="og:image:alt" content="${esc(ssr.OG_IMAGEM_ALT)}" data-rh="true" />`,
    noindex ? null : `<meta name="twitter:image" content="${ssr.OG_IMAGEM}" data-rh="true" />`,
    noindex ? null : `<meta name="twitter:image:alt" content="${esc(ssr.OG_IMAGEM_ALT)}" data-rh="true" />`,
    `<meta name="twitter:title" content="${esc(titulo)}" data-rh="true" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" data-rh="true" />`,
    ...extras,
    ...jsonLd.map(jsonLdScript),
  ].filter(Boolean);
  return linhas.join("\n    ");
}

/** Imagem principal da home (fetchpriority="high" no HTML renderizado) ganha preload no head, como no bewild.com.br. */
function preloadDaImagemPrincipal(html) {
  const img = html.match(/<img\b[^>]*\bfetchpriority="high"[^>]*>/i)?.[0];
  const src = img?.match(/\bsrc="([^"]+)"/)?.[1];
  return src ? [`<link rel="preload" as="image" href="${esc(src)}" fetchpriority="high" />`] : [];
}

function render(p, ssrHtml, estatico) {
  const datas = datasDaPagina(p);
  p.lastmod = datas.dateModified;
  const jsonLd = ssr.jsonLdDaPagina(p, datas, p.jsonLd ?? []);
  const head = headDaPagina(p, { extras: ssrHtml ? preloadDaImagemPrincipal(ssrHtml) : [], jsonLd });
  const body = `<main><h1>${esc(p.h1)}</h1><p>${esc(p.description)}</p>${
    p.bairro ? `<p><a href="/ranking">Ver ranking de bairros</a></p>` : ""
  }${navHtml}</main>`;

  return limparHead(template)
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', ssrHtml ? `<div id="root" data-ssr-path="${p.path}">${ssrHtml}</div>` : `<div id="root">${estatico ? estatico.replace(/<\/main>$/, `${navHtml}</main>`) : body}</div>`);
}

// Home: conteúdo completo do guia renderizado com React (hidratado no navegador).
const home = pages.find((p) => p.path === "/");
home.jsonLd = [
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: ssr.FAQ_ITEMS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
];
// Dataset schema.org (Google Dataset Search) nas páginas que apresentam a base; ItemList dos bairros nas tabelas.
const dataset = ssr.datasetJsonLd(seo.siteUrl);
const nomesBase = ssr.bairrosReserva().map((b) => b.name);
for (const p of pages) {
  if (p.path === "/metodologia" || p.path === "/ranking") p.jsonLd = [...(p.jsonLd ?? []), dataset];
  if (p.path === "/ranking" || p.path === "/mercado") p.jsonLd = [...(p.jsonLd ?? []), ssr.itemListBairrosJsonLd(nomesBase, p.path)];
}
const { html: homeHtml } = await ssr.render("/");

for (const p of pages) {
  const html = render(p, p.path === "/" ? homeHtml : null, p.path === "/" ? null : ssr.renderEstatico(p));
  if (p.path === "/") {
    writeFileSync(resolve(DIST, "index.html"), html);
    continue;
  }
  const rel = p.path.slice(1);
  const dirFile = resolve(DIST, rel, "index.html");
  mkdirSync(dirname(dirFile), { recursive: true });
  writeFileSync(dirFile, html);
  writeFileSync(resolve(DIST, `${rel}.html`), html);
}

// 404: noindex, em pt-BR, com caminhos de volta (hospedagens que servem 404.html usam este arquivo).
const naoEncontrada = { path: "/404", title: "Página não encontrada", description: "Esta página não existe no Radar Bewild.", h1: "Página não encontrada" };
writeFileSync(resolve(DIST, "404.html"), limparHead(template)
  .replace("</head>", `    ${headDaPagina(naoEncontrada, { noindex: true })}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root"><main><h1>${naoEncontrada.h1}</h1><p>${naoEncontrada.description} Confira o endereço ou siga por um destes caminhos.</p>${navHtml}</main></div>`));

// Dados abertos: a base aprovada (reserva offline = mesmos números do banco) em CSV e JSON.
mkdirSync(resolve(DIST, "dados"), { recursive: true });
writeFileSync(resolve(DIST, "dados/bairros.csv"), ssr.csvDadosAbertos());
writeFileSync(resolve(DIST, "dados/bairros.json"), ssr.jsonDadosAbertos());

// Sitemap (loc, lastmod, changefreq, priority) e llms.txt: gravados em dist/ e também em
// public/, para a cópia versionada ficar igual à publicada (regra do bewild.com.br).
const sitemap = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...pages.map((p) => `  <url>\n    <loc>${seo.siteUrl}${p.path}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n    <changefreq>${changefreq(p)}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`),
  `</urlset>`,
  ``,
].join("\n");
const llms = ssr.gerarLlmsTxt();
for (const base of [DIST, PUBLIC]) {
  writeFileSync(resolve(base, "sitemap.xml"), sitemap);
  for (const caminho of ssr.LLMS_TXT_CAMINHOS) {
    const alvo = resolve(base, caminho.slice(1));
    mkdirSync(dirname(alvo), { recursive: true });
    writeFileSync(alvo, llms);
  }
}
console.log(`prerender: ${pages.length} páginas + 404.html + sitemap.xml + llms.txt${gitOk ? "" : " (sem git: lastmod do sitemap anterior)"}`);

if (existsSync(resolve("dist-ssr"))) rmSync(resolve("dist-ssr"), { recursive: true, force: true });
