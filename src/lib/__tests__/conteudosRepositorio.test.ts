import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ErroConteudo, arquivosDoRepositorio, avisosDoConteudo, conteudoDoArquivo, conteudosDoRepositorio, lerArquivo, slugDoCaminho, slugsDoRepositorio,
} from "@/lib/conteudosRepositorio";
import { juntarItens, itemDeConteudo, listarConteudosPublicos, conteudoDoRepositorio } from "@/lib/conteudosPublicos";
import { capaLocal, SLUGS_RESERVADOS, urlAbsolutaCapa, type ItemLista } from "@/lib/conteudosRadar";
import { conteudoJsonLd } from "@/lib/seoJsonLd";
import { juntarConteudosDoBuild } from "@/entry-server";

// Corpo que segue a estrutura da skill ux-writing-blog (abertura, ## pergunta, resposta direta, link para o Radar).
const CORPO = [
  "Corpo de exemplo: quem escolhe bairro para studio olha primeiro a diária e esquece a amostra. Comece pelo bairro com dado observado.",
  "## Como escolher bairro para studio de short stay?",
  "Comece pelos bairros com dado observado e amostra grande. Depois compare a diária do bairro com a do studio que você pretende montar.",
  "## O que conferir no ranking antes de decidir",
  "Abra o [ranking de bairros](/ranking) e filtre só os dados observados. Texto de apoio com tamanho suficiente para o exemplo.",
].join("\n\n");
const arquivo = (cabecalho: string, corpo = CORPO) => `---\n${cabecalho}\n---\n\n${corpo}\n`;
const BASE = [
  "tipo: release",
  'titulo: "Bairro para studio: \\"como\\" escolher"',
  "palavra_chave: bairro para studio",
  "resumo: Resumo de exemplo com mais de quarenta caracteres para a busca.",
  "publicado_em: 2026-11-18",
  "destino: /ranking",
].join("\n");

describe("arquivo de texto do repositório", () => {
  it("lê cabeçalho e corpo; aspas em volta são opcionais", () => {
    const c = conteudoDoArquivo("radar-dados-abertos", arquivo(BASE));
    expect(c).toMatchObject({ id: "repo:radar-dados-abertos", origem: "repositorio", tipo: "release", titulo: 'Bairro para studio: "como" escolher', palavra_chave: "bairro para studio", status: "publicado", destino: "/ranking", categoria_id: null });
    expect(c.publicado_em).toBe("2026-11-18T12:00:00-03:00");
    expect(c.atualizado_em).toBe(c.publicado_em);
    expect(c.corpo.startsWith("Corpo de exemplo")).toBe(true);
    expect(avisosDoConteudo(c)).toEqual([]);
  });
  it("aceita data de atualização, autor, capa local e campos de busca", () => {
    const c = conteudoDoArquivo("x-y", arquivo(`${BASE}\natualizado_em: 2026-11-20\nautor: Pedro Alves\ncapa: /conteudos/imagens/x-y.webp\ncapa_alt: Sala de um studio\nseo_titulo: Título curto`));
    expect(c).toMatchObject({ autor_nome: "Pedro Alves", capa_url: "/conteudos/imagens/x-y.webp", capa_alt: "Sala de um studio", seo_titulo: "Título curto", atualizado_em: "2026-11-20T12:00:00-03:00" });
  });
  it.each([
    ["sem cabeçalho", "Só o corpo, sem as linhas ---."],
    ["campo desconhecido", arquivo(`${BASE}\ncategoria: mercado`)],
    ["campo repetido", arquivo(`${BASE}\ntipo: artigo`)],
    ["linha fora do formato", arquivo(`${BASE}\nisto não é campo`)],
    ["sem data", arquivo(BASE.replace("publicado_em: 2026-11-18\n", ""))],
    ["data em outro formato", arquivo(BASE.replace("2026-11-18", "18/11/2026"))],
    ["atualização antes da publicação", arquivo(`${BASE}\natualizado_em: 2026-11-01`)],
    ["tipo desconhecido", arquivo(BASE.replace("tipo: release", "tipo: link"))],
    ["capa sem descrição", arquivo(`${BASE}\ncapa: /conteudos/imagens/x.webp`)],
    ["capa fora da pasta", arquivo(`${BASE}\ncapa: https://example.com/x.webp\ncapa_alt: Foto`)],
    ["corpo curto", arquivo(BASE, "curto")],
    ["destino inexistente", arquivo(BASE.replace("/ranking", "/inventado"))],
  ])("recusa %s", (_nome, texto) => {
    expect(() => conteudoDoArquivo("texto-ok", texto)).toThrow(ErroConteudo);
  });
  it("recusa endereço reservado ou fora do padrão (vem do nome do arquivo)", () => {
    for (const slug of ["artigos", "imagens", "rss", "Com-Maiuscula"]) expect(() => conteudoDoArquivo(slug, arquivo(BASE)), slug).toThrow(ErroConteudo);
    expect(SLUGS_RESERVADOS).toContain("imagens");
    expect(slugDoCaminho("/src/content/conteudos/meu-texto.md")).toBe("meu-texto");
  });
  it("ignora linhas em branco e comentários no cabeçalho, e normaliza quebra de linha do Windows", () => {
    const { campos } = lerArquivo(`---\r\n# comentário\r\ntipo: artigo\r\n\r\n---\r\ncorpo`);
    expect(campos).toEqual({ tipo: "artigo" });
  });
});

describe("o que vai ao ar", () => {
  const publicado = arquivo(BASE);
  const comAviso = arquivo(BASE, `${CORPO}\n\nA diária média subiu 20% no ano.`);
  const rascunho = arquivo(`${BASE.replace("tipo: release", "tipo: artigo")}\nstatus: rascunho`);
  const arquivos = {
    "/src/content/conteudos/no-ar.md": publicado,
    "/src/content/conteudos/com-aviso.md": comAviso,
    "/src/content/conteudos/rascunho.md": rascunho,
    "/src/content/conteudos/quebrado.md": "sem cabeçalho",
  };
  it("só o publicado e sem aviso editorial entra; arquivo quebrado fica de fora", () => {
    expect(arquivosDoRepositorio(arquivos).map((c) => c.slug).sort()).toEqual(["com-aviso", "no-ar", "rascunho"]);
    expect(conteudosDoRepositorio(arquivos).map((c) => c.slug)).toEqual(["no-ar"]);
    expect(avisosDoConteudo(conteudoDoArquivo("com-aviso", comAviso)).map((a) => a.codigo)).toContain("numero_sem_fonte");
  });
  it("o admin conhece todos os endereços do repositório, inclusive rascunhos", () => {
    expect([...slugsDoRepositorio(arquivos)].sort()).toEqual(["com-aviso", "no-ar", "quebrado", "rascunho"]);
  });
});

describe("junção com o banco", () => {
  const repo = conteudoDoArquivo("mesmo-endereco", arquivo(BASE));
  const item = (extra: Partial<ItemLista>): ItemLista => ({ id: "b1", tipo: "artigo", titulo: "Do banco", slug: "do-banco", resumo: "", url: null, destino: "/mercado", categoria_id: null, capa_url: null, capa_alt: null, publicado_em: "2026-11-19T12:00:00Z", atualizado_em: "2026-11-19T12:00:00Z", ...extra });
  it("mesmo endereço aparece uma vez só, com o texto do repositório; ordem por data", () => {
    const lista = juntarItens([itemDeConteudo(repo)], [item({}), item({ id: "b2", slug: "mesmo-endereco", titulo: "Duplicado" }), item({ id: "l1", tipo: "link", slug: null, url: "https://bewild.com.br/conteudos/x", publicado_em: null, atualizado_em: "2026-11-01T00:00:00Z" })]);
    expect(lista.map((i) => i.id)).toEqual(["b1", "repo:mesmo-endereco", "l1"]);
  });
  it("no build, o arquivo do repositório prevalece sobre a linha do banco", () => {
    const doBanco = { ...repo, id: "b2", origem: "banco" as const, titulo: "Duplicado" };
    const lista = juntarConteudosDoBuild([doBanco], [repo]);
    expect(lista).toHaveLength(1);
    expect(lista[0].origem).toBe("repositorio");
  });
  it("página do texto do repositório abre sem consulta ao banco", () => {
    expect(conteudoDoRepositorio("mesmo-endereco", [repo])?.titulo).toBe(repo.titulo);
    expect(conteudoDoRepositorio("outro", [repo])).toBeNull();
  });
  it("lista pública: filtro por tipo e por categoria, paginação no navegador", async () => {
    const banco = async () => Array.from({ length: 13 }, (_, n) => item({ id: `b${n}`, slug: `b${n}`, publicado_em: `2026-10-${String(n + 1).padStart(2, "0")}T12:00:00Z` }));
    const p1 = await listarConteudosPublicos(0, undefined, undefined, [repo], banco);
    expect(p1.total).toBe(14);
    expect(p1.itens).toHaveLength(12);
    expect(p1.itens[0].id).toBe("repo:mesmo-endereco");
    expect((await listarConteudosPublicos(1, undefined, undefined, [repo], banco)).itens).toHaveLength(2);
    expect((await listarConteudosPublicos(0, "artigo", undefined, [repo], async () => [])).total).toBe(0);
    expect((await listarConteudosPublicos(0, undefined, "cat", [repo], async () => [])).total).toBe(0);
  });
  it("capa local vira endereço absoluto no compartilhamento e no dado estruturado", () => {
    expect(urlAbsolutaCapa("/conteudos/imagens/a.webp")).toBe("https://radarbewild.com.br/conteudos/imagens/a.webp");
    expect(urlAbsolutaCapa("https://x.supabase.co/storage/v1/object/public/conteudos/a.webp")).toBe("https://x.supabase.co/storage/v1/object/public/conteudos/a.webp");
    expect(conteudoJsonLd({ ...repo, capa_url: "/conteudos/imagens/a.webp" }).image).toEqual(["https://radarbewild.com.br/conteudos/imagens/a.webp"]);
  });
  it("capa local só na pasta de imagens dos conteúdos", () => {
    expect(capaLocal("/conteudos/imagens/a-b.webp")).toBe(true);
    expect(capaLocal("/conteudos/imagens/../x.webp")).toBe(false);
    expect(capaLocal("/outra/a.webp")).toBe(false);
  });
});

describe("arquivos de verdade em src/content/conteudos", () => {
  const pasta = "src/content/conteudos";
  const arquivos = readdirSync(pasta).filter((f) => f.endsWith(".md"));
  it("a pasta só tem textos .md (e o .gitkeep)", () => {
    expect(readdirSync(pasta).filter((f) => !f.endsWith(".md") && f !== ".gitkeep")).toEqual([]);
  });
  it.each(arquivos.length ? arquivos : ["(nenhum)"])("%s é válido, sem aviso editorial e com a capa no site", (nome) => {
    if (nome === "(nenhum)") return;
    const slug = nome.replace(/\.md$/, "");
    const c = conteudoDoArquivo(slug, readFileSync(join(pasta, nome), "utf8"));
    if (c.status === "publicado") expect(avisosDoConteudo(c), nome).toEqual([]);
    if (c.capa_url) expect(existsSync(join("public", c.capa_url)), `${c.capa_url} não está em public/`).toBe(true);
  });
});
