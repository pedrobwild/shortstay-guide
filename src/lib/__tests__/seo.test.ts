import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PREFIXOS_PRIVADOS, SEO_BAIRROS, SEO_ROUTES, TITULO_VISIVEL_MAX, bairroTitle, caminhoCanonico, slugifyBairro, tituloComMarca, urlCanonica } from "@/lib/seo";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { TEMAS_GUIA } from "@/data/temasGuia";
import { caminhoNormalizado } from "@/components/NormalizarCaminho";

const rotasApp = readFileSync("src/App.tsx", "utf8");
const indexHtml = readFileSync("index.html", "utf8");
const robots = readFileSync("public/robots.txt", "utf8");

describe("título com a marca (regra brandTitle do bewild.com.br)", () => {
  it("acrescenta ' | Radar Bewild' só quando o título inteiro cabe em 60 caracteres", () => {
    expect(tituloComMarca("Comparador de bairros para Airbnb em SP")).toBe("Comparador de bairros para Airbnb em SP | Radar Bewild");
    expect(tituloComMarca("Mercado de short stay em São Paulo: dados por bairro")).toBe("Mercado de short stay em São Paulo: dados por bairro");
    expect(tituloComMarca("Radar Bewild: guia do investidor")).toBe("Radar Bewild: guia do investidor");
  });

  it("nenhum título de seoRoutes.json já traz o sufixo (quem decide é tituloComMarca)", () => {
    for (const r of SEO_ROUTES) expect(r.title, r.path).not.toMatch(/\|\s*Radar Bewild$/);
  });

  it("títulos sem a marca têm no máximo 60 caracteres visíveis, exceto os que já citam a marca", () => {
    for (const r of SEO_ROUTES) {
      if (r.title.includes("Radar Bewild")) continue;
      expect(r.title.length, `${r.path}: "${r.title}"`).toBeLessThanOrEqual(TITULO_VISIVEL_MAX);
    }
  });
});

describe("rotas públicas em seoRoutes.json", () => {
  it("títulos e descrições únicos; descrição entre 50 e 160 caracteres (clampDescription do site); h1 e keywords presentes", () => {
    const titulos = new Set<string>();
    const descricoes = new Set<string>();
    for (const r of SEO_ROUTES) {
      expect(titulos.has(r.title), `título repetido: ${r.title}`).toBe(false);
      expect(descricoes.has(r.description), `descrição repetida: ${r.path}`).toBe(false);
      titulos.add(r.title);
      descricoes.add(r.description);
      expect(r.description.length, r.path).toBeGreaterThanOrEqual(50);
      expect(r.description.length, r.path).toBeLessThanOrEqual(160);
      expect(r.h1, r.path).toBeTruthy();
      expect(r.keywords, `${r.path} sem keywords`).toBeTruthy();
    }
  });

  it("toda rota do SEO existe em App.tsx, e todo tema do guia tem rota de SEO", () => {
    for (const r of SEO_ROUTES) {
      const caminho = r.path.startsWith("/guia/") ? "/guia/:tema" : r.path;
      expect(rotasApp, r.path).toContain(`path="${caminho}"`);
    }
    for (const t of TEMAS_GUIA) expect(SEO_ROUTES.some((r) => r.path === `/guia/${t.slug}`), t.slug).toBe(true);
  });

  it("todo bairro da base aprovada tem página de bairro no SEO (sitemap e pré-renderização)", () => {
    const seo = new Set(SEO_BAIRROS.map(slugifyBairro));
    for (const b of BAIRROS_CURADOS) expect(seo.has(slugifyBairro(b.name)), b.name).toBe(true);
  });

  it("título de bairro não depende da marca: ela só entra quando o conjunto cabe em 60 caracteres", () => {
    expect(bairroTitle("Pinheiros")).toBe("Studio para Airbnb em Pinheiros: diária, ocupação e receita");
    for (const nome of SEO_BAIRROS) {
      const titulo = tituloComMarca(bairroTitle(nome));
      expect(titulo.length <= TITULO_VISIVEL_MAX || titulo === bairroTitle(nome), nome).toBe(true);
    }
  });
});

describe("canonical e normalização de caminho", () => {
  it("canonical sem query, hash nem barra final; a raiz fica '/'", () => {
    expect(caminhoCanonico("/projecao?bairro=pinheiros#simulador")).toBe("/projecao");
    expect(caminhoCanonico("/ranking/")).toBe("/ranking");
    expect(caminhoCanonico("/")).toBe("/");
    expect(urlCanonica("/mapa/")).toBe("https://radarbewild.com.br/mapa");
  });

  it("barra final e maiúsculas viram o canônico; caminho já canônico não redireciona", () => {
    expect(caminhoNormalizado("/Ranking/")).toBe("/ranking");
    expect(caminhoNormalizado("/bairro/Pinheiros")).toBe("/bairro/pinheiros");
    expect(caminhoNormalizado("/ranking")).toBeNull();
    // Codificação percentual não gera redirecionamento (nem laço): decodificado, o caminho já é o canônico; o slug sem acento é tarefa da página de bairro.
    expect(caminhoNormalizado("/bairro/s%C3%A9")).toBeNull();
    expect(caminhoNormalizado("/bairro/S%C3%A9/")).toBe("/bairro/sé");
    expect(caminhoNormalizado("/projeto/ABC-123")).toBeNull();
    expect(caminhoNormalizado("/admin/Coletas")).toBeNull();
  });
});

describe("head global (index.html) e robots.txt", () => {
  it("index.html tem as tags globais do site: robots, og:locale, dimensões da imagem, manifest, theme-color e preload das fontes", () => {
    for (const trecho of [
      'name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"',
      'property="og:locale" content="pt_BR"',
      'property="og:image:width" content="1200"',
      'property="og:image:height" content="630"',
      'property="og:image:alt"',
      'rel="manifest" href="/site.webmanifest"',
      'name="theme-color"',
      'name="geo.region" content="BR-SP"',
      'rel="preload" href="/fonts/dm-sans-latin-variavel.woff2" as="font"',
      'rel="preload" href="/fonts/playfair-display-latin-variavel.woff2" as="font"',
      "viewport-fit=cover",
    ]) expect(indexHtml).toContain(trecho);
  });

  it("robots.txt bloqueia todos os prefixos privados e aponta o sitemap", () => {
    for (const p of PREFIXOS_PRIVADOS) expect(robots, p).toMatch(new RegExp(`^Disallow: ${p.replace(/\//g, "\\/")}`, "m"));
    expect(robots).toContain("Sitemap: https://radarbewild.com.br/sitemap.xml");
    expect(robots).not.toMatch(/Disallow:\s*\/\s*$/m);
  });

  it("manifest e chave do IndexNow existem em public/", () => {
    const manifest = JSON.parse(readFileSync("public/site.webmanifest", "utf8"));
    expect(manifest.short_name).toBe("Radar Bewild");
    expect(manifest.lang).toBe("pt-BR");
    const chave = readFileSync("scripts/submit-indexnow.mjs", "utf8").match(/const KEY = "([a-f0-9]{32})"/)?.[1];
    expect(chave).toBeTruthy();
    expect(readFileSync(`public/${chave}.txt`, "utf8")).toBe(chave);
  });
});
