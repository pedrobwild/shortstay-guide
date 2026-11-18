import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import {
  SLUGS_RESERVADOS, TERMOS_BARRADOS, TIPOS_CONTEUDO_LISTA, avisosEditoriais, caminhoConteudo, caminhoTipo, conteudoSchema, ehIndexavel, ehPublicavel,
  encurtar, foiAtualizado, ordenarConteudos, paginaSeoConteudo, slugificar, tempoLeituraMin, tipoPeloCaminho, type ConteudoRadar,
} from "@/lib/conteudosRadar";
import { rssConteudos } from "@/lib/conteudosFeed";
import { conteudoJsonLd, itemListConteudosJsonLd, tipoDaPagina, trilhaDaPagina, ORG_ID } from "@/lib/seoJsonLd";
import { gerarLlmsTxt } from "@/lib/llmsTxt";
import { SEO_ROUTES, TITULO_VISIVEL_MAX } from "@/lib/seo";
import CorpoConteudo, { dimensoesDaImagem, urlSegura } from "@/components/conteudos/CorpoConteudo";
import ConteudoArtigo from "@/components/conteudos/ConteudoArtigo";
import { GRUPOS_MENU } from "@/data/navegacao";

const CORPO = "Texto de exemplo com tamanho suficiente para passar da validação mínima do cadastro. ".repeat(4);
const entrada = {
  tipo: "artigo" as const, titulo: "Diária em Pinheiros: o que mudou?", slug: "diaria-em-pinheiros-o-que-mudou",
  resumo: "Resumo de exemplo com mais de quarenta caracteres para a busca.", corpo: CORPO, destino: "/ranking", status: "rascunho" as const,
};
const conteudo = (extra: Partial<ConteudoRadar> = {}): ConteudoRadar => ({
  id: "1", tipo: "artigo", titulo: "Diária em Pinheiros: o que mudou?", slug: "diaria-em-pinheiros-o-que-mudou",
  resumo: entrada.resumo, corpo: CORPO, capa_url: null, capa_alt: null, autor_nome: null, seo_titulo: null, seo_descricao: null,
  canonical_externo: null, destino: "/ranking", status: "publicado", categoria_id: null,
  publicado_em: "2026-11-10T13:00:00+00:00", atualizado_em: "2026-11-12T13:00:00+00:00", ...extra,
});
const CAPA = "https://zxdjgifncmkvjbjmrjss.supabase.co/storage/v1/object/public/conteudos/capa-1.webp";

describe("endereço do texto", () => {
  it("monta o slug sem acento, pontuação nem hífen sobrando", () => {
    expect(slugificar("Diária em Pinheiros: o que mudou?")).toBe("diaria-em-pinheiros-o-que-mudou");
    expect(slugificar("  — São Paulo, 2027!  ")).toBe("sao-paulo-2027");
    expect(slugificar("a".repeat(200)).length).toBeLessThanOrEqual(90);
  });
  it("recusa os endereços que já são do Radar e slugs fora do padrão", () => {
    for (const slug of [...SLUGS_RESERVADOS.filter((s) => !s.includes(".")), "Com-Maiuscula", "com espaço", "termina-", "../admin"]) {
      expect(conteudoSchema.safeParse({ ...entrada, slug }).success, slug).toBe(false);
    }
    expect(conteudoSchema.safeParse(entrada).success).toBe(true);
  });
  it("cada tipo tem um índice próprio, que não se confunde com um texto", () => {
    for (const t of TIPOS_CONTEUDO_LISTA) {
      expect(tipoPeloCaminho(caminhoTipo(t).split("/").pop())).toBe(t);
      expect(SEO_ROUTES.some((r) => r.path === caminhoTipo(t) && "tipoConteudo" in r && r.tipoConteudo === t)).toBe(true);
    }
    expect(tipoPeloCaminho("diaria-em-pinheiros")).toBeNull();
  });
});

describe("cadastro do texto", () => {
  it("limita o título e a descrição de busca", () => {
    expect(conteudoSchema.safeParse({ ...entrada, seo_titulo: "a".repeat(TITULO_VISIVEL_MAX + 1) }).success).toBe(false);
    expect(conteudoSchema.safeParse({ ...entrada, seo_descricao: "a".repeat(161) }).success).toBe(false);
  });
  it("só aceita versão original no site Bewild, sem parâmetros", () => {
    for (const url of ["https://example.com/x", "https://bewild.com.br.evil.com/conteudos/x", "https://bewild.com.br/conteudos/x?utm_source=radar", "javascript:alert(1)"]) {
      expect(conteudoSchema.safeParse({ ...entrada, canonical_externo: url }).success, url).toBe(false);
    }
    expect(conteudoSchema.safeParse({ ...entrada, canonical_externo: "https://bewild.com.br/conteudos/original" }).success).toBe(true);
  });
  it("capa só do bucket do Radar e sempre com descrição", () => {
    expect(conteudoSchema.safeParse({ ...entrada, capa_url: "https://example.com/foto.jpg", capa_alt: "Foto" }).success).toBe(false);
    expect(conteudoSchema.safeParse({ ...entrada, capa_url: CAPA }).success).toBe(false);
    expect(conteudoSchema.safeParse({ ...entrada, capa_url: CAPA, capa_alt: "Sala de um studio reformado" }).success).toBe(true);
  });
  it("campos opcionais vazios viram null e o destino precisa ser uma página do Radar", () => {
    const ok = conteudoSchema.parse({ ...entrada, autor_nome: "  ", seo_titulo: "" });
    expect(ok.autor_nome).toBeNull();
    expect(ok.seo_titulo).toBeNull();
    expect(conteudoSchema.safeParse({ ...entrada, destino: "/bairro/inventado" }).success).toBe(false);
  });
  it("texto curto demais e tipo desconhecido são recusados", () => {
    expect(conteudoSchema.safeParse({ ...entrada, corpo: "curto" }).success).toBe(false);
    expect(conteudoSchema.safeParse({ ...entrada, tipo: "link" }).success).toBe(false);
  });
});

describe("avisos editoriais", () => {
  it("aponta marca errada, expressão barrada, promessa e número sem fonte", () => {
    const codigos = avisosEditoriais(`A BWild garante ${["lucro", "garantido"].join(" ")} de 20% ao ano.`).map((a) => a.codigo);
    expect(codigos).toEqual(expect.arrayContaining(["marca", "termo", "promessa", "numero_sem_fonte"]));
    expect(avisosEditoriais("A Bwild entrega.").map((a) => a.codigo)).toContain("marca");
  });
  it("usa as mesmas expressões barradas no código", () => {
    // Montadas em partes para este arquivo não esbarrar no próprio teste de tom (tomGuia.test.ts).
    expect(TERMOS_BARRADOS).toEqual(expect.arrayContaining([["lucro", "garantido"].join(" "), ["máquina", "de", "reservas"].join(" ")]));
  });
  it("número com link de fonte no mesmo parágrafo passa; ano e contagem simples não contam", () => {
    expect(avisosEditoriais("Pinheiros tem ocupação de 63% ([GuestFavorites](https://www.guestfavorites.com/x)).")).toEqual([]);
    expect(avisosEditoriais("Em 2027 a Bewild segue com 3 frentes de trabalho.")).toEqual([]);
    expect(avisosEditoriais("A diária média é R$ 299.\n\nOutro parágrafo, com [link](/ranking).").map((a) => a.codigo)).toEqual(["numero_sem_fonte"]);
  });
});

describe("regras de publicação", () => {
  it("só publicado com endereço seguro vira página; com versão original no site, fica fora do índice", () => {
    expect(ehPublicavel(conteudo())).toBe(true);
    expect(ehPublicavel(conteudo({ status: "rascunho" }))).toBe(false);
    expect(ehPublicavel(conteudo({ status: "arquivado" }))).toBe(false);
    expect(ehPublicavel(conteudo({ slug: "../segredo" }))).toBe(false);
    expect(ehPublicavel(conteudo({ slug: "artigos" }))).toBe(false);
    expect(ehIndexavel(conteudo())).toBe(true);
    expect(ehIndexavel(conteudo({ canonical_externo: "https://bewild.com.br/conteudos/original" }))).toBe(false);
  });
  it("ordena do mais recente para o mais antigo, com empate pelo endereço", () => {
    const lista = [conteudo({ slug: "b", publicado_em: "2026-11-01T00:00:00Z" }), conteudo({ slug: "c", publicado_em: "2026-11-05T00:00:00Z" }), conteudo({ slug: "a", publicado_em: "2026-11-01T00:00:00Z" })];
    expect(ordenarConteudos(lista).map((c) => c.slug)).toEqual(["c", "a", "b"]);
  });
  it("head: título e descrição de busca quando existem; senão, título e resumo cortado em 160", () => {
    expect(paginaSeoConteudo(conteudo())).toMatchObject({ path: "/conteudos/diaria-em-pinheiros-o-que-mudou", title: "Diária em Pinheiros: o que mudou?", h1: "Diária em Pinheiros: o que mudou?" });
    expect(paginaSeoConteudo(conteudo({ seo_titulo: "Diária em Pinheiros", seo_descricao: "Descrição curta." }))).toMatchObject({ title: "Diária em Pinheiros", description: "Descrição curta." });
    const longo = paginaSeoConteudo(conteudo({ resumo: "palavra ".repeat(60) })).description;
    expect(longo.length).toBeLessThanOrEqual(160);
    expect(longo.endsWith("…")).toBe(true);
    expect(encurtar("curto", 160)).toBe("curto");
  });
  it("mostra a atualização só quando caiu em outro dia; leitura mínima de 1 minuto", () => {
    expect(foiAtualizado(conteudo())).toBe(true);
    expect(foiAtualizado(conteudo({ atualizado_em: "2026-11-10T20:00:00+00:00" }))).toBe(false);
    expect(tempoLeituraMin("poucas palavras")).toBe(1);
    expect(tempoLeituraMin("palavra ".repeat(1000))).toBe(5);
    // Endereços de links e imagens com descrição longa não somam minutos.
    expect(tempoLeituraMin(`${"palavra ".repeat(200)}[fonte](https://example.com/a/b/c/d) ![${"descrição ".repeat(400)}](/conteudos/imagens/x.webp "1920x1080")`)).toBe(1);
  });
});

describe("dados estruturados e trilha", () => {
  it("release é NewsArticle; artigo e estudo são Article, com as duas datas no fuso de São Paulo", () => {
    const release = conteudoJsonLd(conteudo({ tipo: "release" }));
    expect(release["@type"]).toBe("NewsArticle");
    expect(release.datePublished).toBe("2026-11-10T10:00:00-03:00");
    expect(release.dateModified).toBe("2026-11-12T10:00:00-03:00");
    expect(conteudoJsonLd(conteudo())["@type"]).toBe("Article");
    expect(conteudoJsonLd(conteudo({ tipo: "estudo" }))["@type"]).toBe("Article");
  });
  it("autor é a Bewild (nó #org) sem nome de pessoa, e a pessoa quando informada; nunca avaliação", () => {
    expect(conteudoJsonLd(conteudo()).author).toEqual({ "@id": ORG_ID });
    expect(conteudoJsonLd(conteudo({ autor_nome: "Pedro Alves" })).author).toEqual({ "@type": "Person", name: "Pedro Alves" });
    expect(JSON.stringify(conteudoJsonLd(conteudo()))).not.toMatch(/Review|AggregateRating/);
  });
  it("usa a capa como imagem e liga o nó à página", () => {
    const no = conteudoJsonLd(conteudo({ capa_url: CAPA, capa_alt: "Sala" }));
    expect(no.image).toEqual([CAPA]);
    expect(no.mainEntityOfPage).toEqual({ "@id": "https://radarbewild.com.br/conteudos/diaria-em-pinheiros-o-que-mudou#webpage" });
  });
  it("trilha passa por Conteúdos e os índices são CollectionPage", () => {
    const p = { ...paginaSeoConteudo(conteudo()) };
    expect(trilhaDaPagina(p).map((t) => t.path)).toEqual(["/", "/conteudos", p.path]);
    expect(tipoDaPagina({ path: "/conteudos", title: "", description: "", h1: "" })).toBe("CollectionPage");
    expect(tipoDaPagina({ path: "/conteudos/releases", title: "", description: "", h1: "" })).toBe("CollectionPage");
    expect(tipoDaPagina(p)).toBe("WebPage");
    expect(itemListConteudosJsonLd([conteudo()], "/conteudos").itemListElement[0]).toMatchObject({ position: 1, url: "https://radarbewild.com.br/conteudos/diaria-em-pinheiros-o-que-mudou" });
  });
});

describe("feed e llms.txt", () => {
  const lista = [
    conteudo({ titulo: "Dados & <fontes>", slug: "dados-e-fontes" }),
    conteudo({ slug: "com-original", canonical_externo: "https://bewild.com.br/conteudos/original" }),
    conteudo({ slug: "rascunho", status: "rascunho" }),
  ];
  it("o feed escapa o texto e só leva o que é indexável", () => {
    const rss = rssConteudos(lista, new Date("2026-11-18T00:00:00Z"));
    expect(rss).toContain("<title>Dados &amp; &lt;fontes&gt;</title>");
    expect(rss).toContain("<link>https://radarbewild.com.br/conteudos/dados-e-fontes</link>");
    expect(rss).not.toContain("com-original");
    expect(rss).not.toContain("rascunho");
    expect(rss.match(/<item>/g)).toHaveLength(1);
  });
  it("feed vazio continua válido", () => {
    const rss = rssConteudos([], new Date("2026-11-18T00:00:00Z"));
    expect(rss).toContain("<channel>");
    expect(rss).not.toContain("<item>");
  });
  it("llms.txt só ganha a seção e o índice por tipo quando há texto", () => {
    const sem = gerarLlmsTxt(undefined, "2026-11-18");
    expect(sem).not.toContain("## Conteúdos");
    expect(sem).not.toContain("/conteudos/releases");
    expect(sem).toContain("](https://radarbewild.com.br/conteudos)");
    const com = gerarLlmsTxt(undefined, "2026-11-18", [{ titulo: "Texto", slug: "texto", resumo: "Resumo.", tipo: "release" }]);
    expect(com).toContain("## Conteúdos");
    expect(com).toContain("- [Texto](https://radarbewild.com.br/conteudos/texto) (release): Resumo.");
    expect(com).toContain("/conteudos/releases");
    expect(com).not.toContain("/conteudos/estudos");
  });
});

describe("corpo do texto", () => {
  const html = (corpo: string) => renderToStaticMarkup(createElement(CorpoConteudo, { corpo }));
  it("não interpreta HTML cru nem link perigoso", () => {
    const saida = html("Antes <script>alert(1)</script> <img src=x onerror=alert(1)> depois.\n\n[ruim](javascript:alert(1)) [dado](data:text/html,x)");
    expect(saida).not.toContain("<script");
    expect(saida).not.toContain("onerror");
    expect(saida).not.toMatch(/href="(javascript|data):/);
    expect(urlSegura("javascript:alert(1)")).toBe("");
    expect(urlSegura("//evil.com")).toBe("");
    expect(urlSegura("/ranking")).toBe("/ranking");
  });
  it("título do corpo desce um nível e link externo avisa que abre em nova aba", () => {
    const saida = html("# Seção\n\n[fora](https://example.com/x) e [dentro](/ranking) e [radar](https://radarbewild.com.br/mapa)");
    expect(saida).not.toContain("<h1");
    expect(saida).toContain("<h2");
    expect(saida).toMatch(/<a href="https:\/\/example\.com\/x" target="_blank" rel="noopener noreferrer"[^>]*>fora<span class="sr-only"> \(abre em nova aba\)<\/span><\/a>/);
    expect(saida).toMatch(/<a href="\/ranking" class="e-link">dentro<\/a>/);
    expect(saida).toMatch(/<a href="https:\/\/radarbewild\.com\.br\/mapa" class="e-link">radar<\/a>/);
  });
  it("tabela vira HTML com título ligado (fora do bloco que rola), cabeçalho de coluna e rolagem no próprio bloco", () => {
    const saida = html("Tabela 1: Diária média por bairro\n\n| Bairro | Diária |\n|---|--:|\n| Pinheiros | R$ 299 |");
    expect(saida).toMatch(/<p id="tabela-1-titulo" class="[^"]*">Diária média por bairro<\/p>/);
    expect(saida).toMatch(/<div role="region" aria-labelledby="tabela-1-titulo" tabindex="0" class="[^"]*overflow-x-auto[^"]*"><table aria-labelledby="tabela-1-titulo"[^>]*><thead>/);
    expect(saida).toContain('<th scope="col"');
    expect(saida).not.toMatch(/Tabela 1:/);
  });
  it("parágrafo que só começa com “Tabela” e não vem antes de tabela fica como parágrafo", () => {
    expect(html("Tabela: sem tabela depois.\n\nOutro parágrafo.")).toMatch(/<p[^>]*>Tabela: sem tabela depois\.<\/p>/);
  });
  it("notas de rodapé em português, com ida e volta", () => {
    const saida = html("Diária com fonte[^1].\n\n[^1]: [GuestFavorites](https://www.guestfavorites.com/x).");
    expect(saida).toContain(">Notas e fontes</h2>");
    expect(saida).not.toMatch(/Footnotes|Back to reference/);
    expect(saida).toMatch(/<a href="#user-content-fn-1" class="e-link" id="user-content-fnref-1" aria-describedby="footnote-label">1<\/a>/);
    expect(saida).toMatch(/<a href="#user-content-fnref-1" class="e-link" aria-label="Voltar à referência 1">/);
  });
  it("riscado e link solto", () => {
    const saida = html("~~antes~~ https://example.com/x");
    expect(saida).toContain("<del>antes</del>");
    expect(saida).toMatch(/<a href="https:\/\/example\.com\/x" target="_blank"/);
  });
  it("imagem sem descrição não entra", () => {
    expect(html("![](https://example.com/a.png)")).not.toContain("<img");
    expect(html("![Planta do studio](https://example.com/a.png)")).toContain('alt="Planta do studio"');
  });
  it("imagem sozinha vira figura com legenda, dimensões e versão de celular", () => {
    const saida = html('![Gráfico da diária](/conteudos/imagens/x/02-grafico.webp "1920x1180 780x1400")\n\nFigura 2: Alta da diária por bairro.\n\nDepois.');
    expect(saida).toMatch(/^<figure class="[^"]*"><picture><source media="\(max-width: 639px\)" srcSet="\/conteudos\/imagens\/x\/02-grafico-m\.webp" width="780" height="1400"\/><img src="\/conteudos\/imagens\/x\/02-grafico\.webp" alt="Gráfico da diária" width="1920" height="1180"[^>]*\/><\/picture><figcaption class="[^"]*">Alta da diária por bairro\.<\/figcaption><\/figure>/);
    expect(saida).not.toContain("Figura 2:");
    expect(saida).not.toMatch(/<p[^>]*><figure/);
    expect(saida).toContain(">Depois.</p>");
  });
  it("dimensões da imagem só valem no formato LxA", () => {
    expect(dimensoesDaImagem("/a.webp", "1200x600")).toEqual({ largura: 1200, altura: 600, celular: null });
    expect(dimensoesDaImagem("/a.webp", "Gráfico")).toBeNull();
    expect(dimensoesDaImagem("/a.webp", "1200x600 grande")).toBeNull();
    expect(dimensoesDaImagem("/a.webp", undefined)).toBeNull();
    const semTitulo = html("![Foto](/a.webp)");
    expect(semTitulo).not.toContain("<picture");
    expect(semTitulo).not.toContain("width=");
  });
  it("a página do texto tem um só h1, a trilha, as datas e a ponte para os dados", () => {
    const saida = renderToStaticMarkup(createElement(ConteudoArtigo, { c: conteudo({ corpo: "# Seção\n\nTexto." }), relacionados: [{ id: "2", slug: "outro", titulo: "Outro texto", resumo: "" }] }));
    expect(saida.match(/<h1/g)).toHaveLength(1);
    expect(saida).toContain('href="/conteudos/artigos"');
    expect(saida).toContain("Publicado em");
    expect(saida).toContain("10 de novembro de 2026");
    expect(saida).toContain("Por Bewild");
    expect(saida).toContain('href="/ranking"');
    expect(saida).toContain('href="/conteudos/outro"');
  });
});

describe("navegação e migration", () => {
  it("o menu Guia leva a /conteudos e nenhuma rota de SEO aponta para /posts", () => {
    const links = GRUPOS_MENU.flatMap((g) => g.links.map((l) => l.to));
    expect(links).toContain("/conteudos");
    expect(links).not.toContain("/posts");
    expect(SEO_ROUTES.some((r) => r.path === "/posts")).toBe(false);
  });
  const sql = readFileSync("supabase/migrations/20261118090000_radar_noticias_conteudos.sql", "utf8");
  it("não cria tabela nem mexe nas policies da tabela: só estende radar_noticias", () => {
    expect(sql).not.toMatch(/CREATE TABLE/i);
    expect(sql).not.toMatch(/POLICY[^;]*ON public\.radar_noticias/i);
    expect(sql).toMatch(/ALTER TABLE public\.radar_noticias\s+ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'link'/);
  });
  it("o banco cobra a forma por tipo, o slug e os reservados, e guarda a data da primeira publicação por trigger", () => {
    expect(sql).toMatch(/radar_noticias_forma_por_tipo/);
    for (const reservado of ["artigos", "releases", "estudos", "rss", "pagina"]) expect(sql).toContain(`'${reservado}'`);
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS radar_noticias_slug_unico/);
    expect(sql).toMatch(/CREATE TRIGGER radar_noticias_publicado_em/);
    expect(sql).toMatch(/SET search_path = public/);
    expect(sql).not.toMatch(/CHECK[^;]*now\(\)/i);
  });
  it("capa só no bucket do Radar, com escrita só do admin", () => {
    expect(sql.match(/bucket_id = 'conteudos' AND public\.has_role\(auth\.uid\(\), 'admin'\)/g)?.length).toBeGreaterThanOrEqual(5);
    expect(sql).toMatch(/capa_url ~ '\^https:\/\/\\S\+\/storage\/v1\/object\/public\/conteudos\//);
  });
});
