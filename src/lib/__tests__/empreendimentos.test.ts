import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import {
  AVISO_CATALOGO, bairroNaBase, bairrosDoCatalogo, caminhoFotoNoBucket, dataBR, descricaoSeo, diferenciaisDoTexto, empreendimentoSchema,
  filtrarEmpreendimentos, fotoDoBucket, linkMapa, mensagemErroSalvar, ordenarEmpreendimentos, slugEmpreendimento, textoFonte, textosBairroNoRadar,
  textoSituacao, TEXTO_SELO_BEWILD, type Empreendimento,
} from "@/lib/empreendimentos";

const FOTO_BUCKET = "https://abc.supabase.co/storage/v1/object/public/empreendimentos/edificio-alfa/1730.webp";

const base: Empreendimento = {
  id: "1", slug: "x", nome: "X", bairro: "Pinheiros", endereco: null, incorporadora: null, tipologias: null, situacao: null,
  entrega: null, resumo: "", diferenciais: [], fonte_url: null, fonte_titulo: null, fonte_consultada_em: null, foto_url: null,
  foto_alt: null, foto_credito: null, selo_bewild: true, status: "publicado",
};
const emp = (p: Partial<Empreendimento>): Empreendimento => ({ ...base, ...p });

describe("empreendimentos — regras puras", () => {
  it("slug sem acento, minúsculo e com hífen", () => {
    expect(slugEmpreendimento("Edifício Ômega Vila Nova Conceição")).toBe("edificio-omega-vila-nova-conceicao");
    expect(slugEmpreendimento("B.Side Faria Lima")).toBe("b-side-faria-lima");
  });

  it("ordem alfabética pt-BR (sem ranking)", () => {
    const l = ordenarEmpreendimentos([emp({ id: "a", nome: "Zip Brooklin" }), emp({ id: "b", nome: "Ária Higienópolis" }), emp({ id: "c", nome: "Brooklin Noventa" })]);
    expect(l.map((e) => e.nome)).toEqual(["Ária Higienópolis", "Brooklin Noventa", "Zip Brooklin"]);
  });

  it("filtra por bairro (slug) e busca sem acento em nome, bairro, incorporadora e endereço", () => {
    const lista = [
      emp({ id: "1", nome: "Edifício Alfa Pinheiros", bairro: "Pinheiros", incorporadora: "Vitacon" }),
      emp({ id: "2", nome: "Residencial Beta Moema", bairro: "Moema", endereco: "Av. Jurupis" }),
      emp({ id: "3", nome: "Studio Gama Saúde", bairro: "Saúde" }),
    ];
    expect(filtrarEmpreendimentos(lista, { bairro: "saude" }).map((e) => e.id)).toEqual(["3"]);
    expect(filtrarEmpreendimentos(lista, { busca: "vitacon" }).map((e) => e.id)).toEqual(["1"]);
    expect(filtrarEmpreendimentos(lista, { busca: "jurupis" }).map((e) => e.id)).toEqual(["2"]);
    expect(filtrarEmpreendimentos(lista, { busca: "SAUDE gama" }).map((e) => e.id)).toEqual(["3"]);
    expect(filtrarEmpreendimentos(lista, { bairro: "moema", busca: "alfa" })).toEqual([]);
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
    expect(textoFonte({ fonte_url: "https://exemplo.com.br", fonte_titulo: "Página oficial — Vitacon", fonte_consultada_em: "2026-10-30" })).toBe("Página oficial — Vitacon, consultada em 30/10/2026");
    expect(textoFonte({ fonte_url: "https://exemplo.com.br", fonte_titulo: null, fonte_consultada_em: null })).toBe("Página do empreendimento");
    // Sem link de fonte, nada de "conforme": a tela não inventa uma fonte.
    expect(textoFonte({ fonte_url: null, fonte_titulo: "Página oficial", fonte_consultada_em: "2026-10-30" })).toBeNull();
  });

  it("link do mapa busca pelo endereço (ou pelo nome) no bairro, em São Paulo", () => {
    const url = new URL(linkMapa({ nome: "Edifício Alfa Pinheiros", endereco: "Rua dos Pinheiros, 100", bairro: "Pinheiros" }));
    expect(url.origin).toBe("https://www.google.com");
    expect(url.searchParams.get("query")).toBe("Rua dos Pinheiros, 100, Pinheiros, São Paulo - SP");
    expect(new URL(linkMapa({ nome: "Zip Brooklin", endereco: null, bairro: "Brooklin" })).searchParams.get("query")).toBe("Zip Brooklin, Brooklin, São Paulo - SP");
  });

  it("descrição de SEO até 160 caracteres, e só promete números quando o bairro está na base", () => {
    expect(descricaoSeo({ nome: "A".repeat(150), bairro: "Pinheiros", incorporadora: "Vitacon" }, true).length).toBeLessThanOrEqual(160);
    expect(descricaoSeo({ nome: "Edifício Alfa", bairro: "Pinheiros", incorporadora: null }, true)).toContain("os números do bairro");
    expect(descricaoSeo({ nome: "Edifício Alfa", bairro: "Vila Clementino", incorporadora: null }, false)).not.toContain("números");
  });

  it("bloco do bairro: Brooklin e Vila Olímpia como aproximação pelo Itaim Bibi, nunca como dado próprio", () => {
    const aprox = textosBairroNoRadar("Brooklin", "aproximacao");
    expect(aprox.titulo).toBe("Brooklin: aproximação pelo Itaim Bibi");
    expect(aprox.media).toContain("distrito Itaim Bibi");
    expect(aprox.media).not.toContain("do bairro");
    expect(aprox.aproximacao).toMatch(/não tem dado público por bairro/);
    expect(aprox.aproximacao).not.toMatch(/tracejad/);
    const observado = textosBairroNoRadar("Pinheiros", "observado");
    expect(observado.aproximacao).toBeNull();
    expect(observado.media).toBe("Média dos anúncios do bairro no Airbnb, não deste prédio.");
    expect(textosBairroNoRadar("Pinheiros", "estimativa").media).toMatch(/Estimativa Bewild/);
    expect(textosBairroNoRadar("Vila Clementino", null).foraDaBase).toMatch(/^Vila Clementino ainda não está entre os bairros da base/);
  });

  it("foto só do bucket do Radar; caminho para apagar a foto antiga", () => {
    expect(fotoDoBucket(FOTO_BUCKET)).toBe(true);
    expect(fotoDoBucket("https://incorporadora.com.br/fachada.jpg")).toBe(false);
    expect(caminhoFotoNoBucket(FOTO_BUCKET)).toBe("edificio-alfa/1730.webp");
    expect(caminhoFotoNoBucket("https://incorporadora.com.br/fachada.jpg")).toBeNull();
    expect(caminhoFotoNoBucket(null)).toBeNull();
  });

  it("formulário: valida slug, links https e data, e limpa campos vazios", () => {
    const ok = empreendimentoSchema.parse({
      nome: "Edifício Alfa", slug: "edificio-alfa", bairro: "Pinheiros", endereco: "", incorporadora: "Vitacon", tipologias: "",
      situacao: null, entrega: "", resumo: "", diferenciais: ["Coworking"], fonte_url: "https://exemplo.com.br/alfa", fonte_titulo: "",
      fonte_consultada_em: "2026-10-30", foto_url: "", foto_alt: "", foto_credito: "", selo_bewild: true, status: "publicado",
    });
    expect(ok.endereco).toBeNull();
    expect(ok.foto_url).toBeNull();
    const ruim = (p: Record<string, unknown>) => empreendimentoSchema.safeParse({ ...ok, ...p }).success;
    expect(ruim({ slug: "Edifício Alfa" })).toBe(false);
    expect(ruim({ fonte_url: "http://exemplo.com.br" })).toBe(false);
    expect(ruim({ fonte_consultada_em: "30/10/2026" })).toBe(false);
    expect(ruim({ diferenciais: Array.from({ length: 11 }, (_, i) => `item ${i}`) })).toBe(false);
    expect(ruim({ foto_url: "https://incorporadora.com.br/fachada.jpg" })).toBe(false);
    expect(ruim({ foto_url: FOTO_BUCKET })).toBe(true);
  });

  it("publicar exige fonte com data e bairro confirmado (rascunho não); mensagens em português", () => {
    const entrada = {
      nome: "Edifício Alfa", slug: "edificio-alfa", bairro: "Pinheiros", endereco: "", incorporadora: "", tipologias: "", situacao: null,
      entrega: "", resumo: "", diferenciais: [], fonte_url: "", fonte_titulo: "", fonte_consultada_em: "", foto_url: "", foto_alt: "",
      foto_credito: "", selo_bewild: true, status: "publicado" as const,
    };
    const semFonte = empreendimentoSchema.safeParse(entrada);
    expect(semFonte.success).toBe(false);
    expect(semFonte.error?.issues.map((i) => i.message)).toEqual(["Para publicar, informe o link da fonte.", "Para publicar, informe a data da consulta à fonte."]);
    expect(empreendimentoSchema.safeParse({ ...entrada, status: "rascunho" }).success).toBe(true);
    const aConfirmar = empreendimentoSchema.safeParse({ ...entrada, bairro: "A confirmar", fonte_url: "https://exemplo.com.br", fonte_consultada_em: "2026-10-30" });
    expect(aConfirmar.error?.issues[0]?.message).toBe("Para publicar, confirme o bairro.");
    const longo = empreendimentoSchema.safeParse({ ...entrada, status: "rascunho", diferenciais: ["x".repeat(121)] });
    expect(longo.error?.issues[0]?.message).toBe("Cada diferencial pode ter até 120 caracteres.");
    expect(mensagemErroSalvar(semFonte.error)).toBe("Para publicar, informe o link da fonte.");
    expect(mensagemErroSalvar({ code: "23514" })).toMatch(/^Para publicar/);
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

  it("o registro versionado (repositório público) não cita pastas de clientes, contratos nem quantos clientes há por prédio", () => {
    const doc = readFileSync("docs/empreendimentos-2026-10-30.md", "utf8");
    expect(doc).not.toMatch(/pastas?\s+(de clientes\s+)?\d|contrato|grafias da pasta|\bunidade é\b|\bcliente\b/i);
  });

  it("o banco tem a mesma regra de publicação e de foto do formulário", () => {
    const sql = readFileSync("supabase/migrations/20261030120000_empreendimentos_regras_publicacao.sql", "utf8");
    expect(sql).toMatch(/empreendimentos_publicado_com_fonte[\s\S]*fonte_url IS NOT NULL AND fonte_consultada_em IS NOT NULL AND btrim\(bairro\) <> 'A confirmar'/);
    expect(sql).toMatch(/empreendimentos_foto_do_bucket[\s\S]*\/storage\/v1\/object\/public\/empreendimentos\//);
    expect(sql.replace(/--.*$/gm, "")).not.toMatch(/now\(\)/i);
  });

  it("a tabela não tem coluna de cliente nem de unidade", () => {
    const sql = readFileSync("supabase/migrations/20261030090000_empreendimentos.sql", "utf8");
    const tabela = sql.slice(sql.indexOf("CREATE TABLE"), sql.indexOf(");", sql.indexOf("CREATE TABLE")));
    expect(tabela).not.toMatch(/\b(cliente|unidade|contrato|valor|preco)\w*\b/i);
  });
});
