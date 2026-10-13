// Pós-build: gera um HTML estático por rota pública (head próprio + H1 e
// descrição já no HTML) e o sitemap.xml. Ao carregar, o React substitui o
// conteúdo de #root e o app segue como SPA normalmente.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { pathToFileURL } from "url";

// Shims mínimos para módulos que tocam storage ao carregar (ex.: cliente de auth).
const memStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } }; };
globalThis.localStorage ??= memStorage();
globalThis.sessionStorage ??= memStorage();
const ssr = await import(pathToFileURL(resolve("dist-ssr/entry-server.js")).href);

const seo = JSON.parse(readFileSync(resolve("src/data/seoRoutes.json"), "utf8"));
const DIST = resolve("dist");
const template = readFileSync(resolve(DIST, "index.html"), "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugify = (n) => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const pages = [
  ...seo.routes,
  ...seo.bairros.map((name) => ({
    path: `/bairro/${slugify(name)}`,
    title: `Studio para Airbnb em ${name}: diária, ocupação e receita | ${seo.siteName}`,
    description: `Diária média, ocupação, receita estimada e score de investimento para studios de short stay em ${name}, São Paulo.`,
    h1: `Studio para Airbnb em ${name}`,
    priority: "0.8",
  })),
];

const nav = [
  ["/", "Guia"], ["/mercado", "Mercado"], ["/ranking", "Ranking de bairros"], ["/mapa", "Mapa"],
  ["/anuncios", "Anúncios"], ["/ferramentas", "Ferramentas"], ["/projecao", "Projeção"],
];

function render(p, ssrHtml) {
  const url = `${seo.siteUrl}${p.path}`;
  const head = [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" data-rh="true" />`,
    `<link rel="canonical" href="${url}" data-rh="true" />`,
    `<meta property="og:title" content="${esc(p.title)}" data-rh="true" />`,
    `<meta property="og:description" content="${esc(p.description)}" data-rh="true" />`,
    `<meta property="og:url" content="${url}" data-rh="true" />`,
    `<meta property="og:site_name" content="${esc(seo.siteName)}" data-rh="true" />`,
    `<meta name="twitter:title" content="${esc(p.title)}" data-rh="true" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" data-rh="true" />`,
    ...(p.jsonLd ? [`<script type="application/ld+json">${JSON.stringify(p.jsonLd).replace(/</g, "\\u003c")}</script>`] : []),
  ].join("\n    ");
  const isBairro = p.path.startsWith("/bairro/");
  const body = `<main><h1>${esc(p.h1)}</h1><p>${esc(p.description)}</p>${
    isBairro ? `<p><a href="/ranking">Ver ranking de bairros</a></p>` : ""
  }<nav aria-label="Radar Bewild"><ul>${nav.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></nav></main>`;

  return template
    .replace(/<title>[\s\S]*?<\/title>\s*/, "")
    .replace(/\s*<meta (name="description"|property="og:(title|description|url|site_name)"|name="twitter:(title|description)")[^>]*>/g, "")
    .replace(/\s*<link rel="canonical"[^>]*>/g, "")
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', ssrHtml ? `<div id="root" data-ssr-path="${p.path}">${ssrHtml}</div>` : `<div id="root">${body}</div>`);
}

// Home: conteúdo completo do guia renderizado com React (hidratado no navegador).
const home = pages.find((p) => p.path === "/");
home.jsonLd = [
  { "@context": "https://schema.org", "@type": "Organization", "@id": `${seo.siteUrl}/#org`, name: "Bewild", url: "https://bewild.com.br" },
  { "@context": "https://schema.org", "@type": "WebSite", "@id": `${seo.siteUrl}/#website`, name: seo.siteName, url: `${seo.siteUrl}/`, inLanguage: "pt-BR", publisher: { "@id": `${seo.siteUrl}/#org` } },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: ssr.FAQ_ITEMS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
];
const { html: homeHtml } = await ssr.render("/");

for (const p of pages) {
  const html = render(p, p.path === "/" ? homeHtml : null);
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

const sitemap = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...pages.map((p) => `  <url>\n    <loc>${seo.siteUrl}${p.path}</loc>\n    <priority>${p.priority}</priority>\n  </url>`),
  `</urlset>`,
].join("\n");
writeFileSync(resolve(DIST, "sitemap.xml"), sitemap);
console.log(`prerender: ${pages.length} páginas + sitemap.xml`);

rmSync(resolve("dist-ssr"), { recursive: true, force: true });
