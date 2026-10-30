import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import {
  AVISO_CATALOGO, bairroNaBase, bairrosDoCatalogo, dataBR, descricaoSeo, diferenciaisDoTexto, empreendimentoSchema,
  filtrarEmpreendimentos, linkMapa, ordenarEmpreendimentos, slugEmpreendimento, textoFonte, textoSituacao, TEXTO_SELO_BEWILD,
  type Empreendimento,
} from "@/lib/empreendimentos";

const base: Empreendimento = {
  id: "1", slug: "x", nome: "X", bairro: "Pinheiros", endereco: null, incorporadora: null, tipologias: null, situacao: null,
  entrega: null, resumo: "", diferenciais: [], fonte_url: null, fonte_titulo: null, fonte_consultada_em: null, foto_url: null,
  foto_alt: null, foto_credito: null, selo_bewild: true, status: "publicado",
};
const emp = (p: Partial<Empreendimento>): Empreendimento => ({ ...base, ...p });

describe("empreendimentos — regras puras", () => {
  it("slug sem acento, minúsculo e com hífen", () => {
    expect(slugEmpreendimento("Nex One Vila Nova Conceição")).toBe("nex-one-vila-nova-conceicao");
    expect(slugEmpreendimento("B.Side Faria Lima")).toBe("b-side-faria-lima");
  });

  it("ordem alfabética pt-BR (sem ranking)", () => {
    const l = ordenarEmpreendimentos([emp({ id: "a", nome: "Zip Brooklin" }), emp({ id: "b", nome: "Ária Higienópolis" }), emp({ id: "c", nome: "Brooklin Noventa" })]);
    expect(l.map((e) => e.nome)).toEqual(["Ária Higienópolis", "Brooklin Noventa", "Zip Brooklin"]);
  });

  it("filtra por bairro (slug) e busca sem acento em nome, bairro, incorporadora e endereço", () => {
    const lista = [
      emp({ id: "1", nome: "Do It Pinheiros", bairro: "Pinheiros", incorporadora: "Vitacon" }),
      emp({ id: "2", nome: "The Collection Moema", bairro: "Moema", endereco: "Av. Jurupis" }),
      emp({ id: "3", nome: "Today Saúde", bairro: "Saúde" }),
    ];
    expect(filtrarEmpreendimentos(lista, { bairro: "saude" }).map((e) => e.id)).toEqual(["3"]);
    expect(filtrarEmpreendimentos(lista, { busca: "vitacon" }).map((e) => e.id)).toEqual(["1"]);
    expect(filtrarEmpreendimentos(lista, { busca: "jurupis" }).map((e) => e.id)).toEqual(["2"]);
    expect(filtrarEmpreendimentos(lista, { busca: "SAUDE today" }).map((e) => e.id)).toEqual(["3"]);
    expect(filtrarEmpreendimentos(lista, { bairro: "moema", busca: "do it" })).toEqual([]);
    expect(filtrarEmpreendimentos(lista, {})).toHaveLength(3);
  });

  it("lista os bairros do catálogo com a contagem, em ordem alfabética", () => {
    const b = bairrosDoCatalogo([emp({ bairro: "Pinheiros" }), emp({ bairro: "Brooklin" }), emp({ bairro: "Pinheiros " })]);
    expect(b).toEqual([{ nome: "Brooklin", slug: "brooklin", total: 1 }, { nome: "Pinheiros", slug: "pinheiros", total: 2 }]);
  });

  it("cruza com a base do Radar só pelo mesmo bairro (sem trocar por vizinho)", () => {
    expect(bairroNaBase("Pinheiros", BAIRROS_CURADOS)?.name).toBe("Pinheiros");
    expect(bairroNaBase("Vila Olímpia", BAIRROS_CURADOS)?.name).toBe("Vila Olímpia");
    expect(bairroNaBase("Vila Nova Conceição", BAIRROS_CURADOS)).toBeNull();
    expect(bairroNaBase("Higienópolis", BAIRROS_CURADOS)).toBeNull();
  });

  it("diferenciais um por linha: sem marcadores, vazios nem repetidos", () => {
    expect(diferenciaisDoTexto("- Piscina na cobertura\n\n• coworking\nCoworking\n  Lavanderia  \nx")).toEqual(["Piscina na cobertura", "coworking", "Lavanderia"]);
  });

  it("situação com entrega, data em dd/mm/aaaa e linha da fonte", () => {
    expect(textoSituacao({ situacao: "em_obras", entrega: "dez/2026" })).toBe("Em obras · entrega dez/2026");
    expect(textoSituacao({ situacao: "pronto", entrega: null })).toBe("Pronto");
    expect(textoSituacao({ situacao: "pronto", entrega: "out/2024" })).toBe("Pronto · entregue em out/2024");
    expect(textoSituacao({ situacao: null, entrega: "jul/2026" })).toBe("Entrega jul/2026");
    expect(textoSituacao({ situacao: null, entrega: null })).toBeNull();
    expect(dataBR("2026-10-30")).toBe("30/10/2026");
    expect(textoFonte({ fonte_titulo: "Página oficial — Vitacon", fonte_consultada_em: "2026-10-30" })).toBe("Página oficial — Vitacon, consultada em 30/10/2026");
    expect(textoFonte({ fonte_titulo: null, fonte_consultada_em: null })).toBe("Página do empreendimento");
  });

  it("link do mapa busca pelo endereço (ou pelo nome) no bairro, em São Paulo", () => {
    const url = new URL(linkMapa({ nome: "Do It Pinheiros", endereco: "Rua dos Pinheiros, 100", bairro: "Pinheiros" }));
    expect(url.origin).toBe("https://www.google.com");
    expect(url.searchParams.get("query")).toBe("Rua dos Pinheiros, 100, Pinheiros, São Paulo - SP");
    expect(new URL(linkMapa({ nome: "Zip Brooklin", endereco: null, bairro: "Brooklin" })).searchParams.get("query")).toBe("Zip Brooklin, Brooklin, São Paulo - SP");
  });

  it("descrição de SEO até 160 caracteres", () => {
    expect(descricaoSeo({ nome: "A".repeat(150), bairro: "Pinheiros", incorporadora: "Vitacon" }).length).toBeLessThanOrEqual(160);
  });

  it("formulário: valida slug, links https e data, e limpa campos vazios", () => {
    const ok = empreendimentoSchema.parse({
      nome: "Do It Pinheiros", slug: "do-it-pinheiros", bairro: "Pinheiros", endereco: "", incorporadora: "Vitacon", tipologias: "",
      situacao: null, entrega: "", resumo: "", diferenciais: ["Coworking"], fonte_url: "https://exemplo.com.br/do-it", fonte_titulo: "",
      fonte_consultada_em: "2026-10-30", foto_url: "", foto_alt: "", foto_credito: "", selo_bewild: true, status: "publicado",
    });
    expect(ok.endereco).toBeNull();
    expect(ok.foto_url).toBeNull();
    const ruim = (p: Record<string, unknown>) => empreendimentoSchema.safeParse({ ...ok, ...p }).success;
    expect(ruim({ slug: "Do It" })).toBe(false);
    expect(ruim({ fonte_url: "http://exemplo.com.br" })).toBe(false);
    expect(ruim({ fonte_consultada_em: "30/10/2026" })).toBe(false);
    expect(ruim({ diferenciais: Array.from({ length: 11 }, (_, i) => `item ${i}`) })).toBe(false);
  });
});

describe("empreendimentos — texto e privacidade", () => {
  const arquivos = [
    "src/lib/empreendimentos.ts",
    "src/pages/Empreendimentos.tsx",
    "src/pages/EmpreendimentoDetalhe.tsx",
    "src/components/empreendimentos/CardEmpreendimento.tsx",
    "src/components/empreendimentos/ResumoEmpreendimento.tsx",
    "src/components/empreendimentos/BairroNoRadar.tsx",
  ].map((f) => [f, readFileSync(f, "utf8")] as const);

  it("selo sem contagem de unidades e aviso de que não é recomendação", () => {
    expect(TEXTO_SELO_BEWILD).toBe("A Bewild já atua neste prédio");
    expect(AVISO_CATALOGO).toMatch(/Não é recomendação de compra/);
  });

  it("nenhuma tela fala em cliente, unidade vendida, ranking ou promessa de retorno", () => {
    for (const [f, texto] of arquivos) {
      const visivel = texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
      expect(visivel, f).not.toMatch(/melhores empreendimentos|recomendad[oa]s?\b|valoriza(ção|r) garantid|retorno garantid|unidades? vendidas?/i);
    }
  });

  it("a tabela não tem coluna de cliente nem de unidade", () => {
    const sql = readFileSync("supabase/migrations/20261030090000_empreendimentos.sql", "utf8");
    const tabela = sql.slice(sql.indexOf("CREATE TABLE"), sql.indexOf(");", sql.indexOf("CREATE TABLE")));
    expect(tabela).not.toMatch(/\b(cliente|unidade|contrato|valor|preco)\w*\b/i);
  });
});
