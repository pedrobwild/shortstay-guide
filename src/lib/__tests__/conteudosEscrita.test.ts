import { describe, expect, it } from "vitest";
import { avisosDeEstrutura, avisosDoTexto, blocosDoCorpo, contemTermo, frases, H1_MAX, TITULO_BUSCA_MAX } from "@/lib/conteudosEscrita";

const CORPO_OK = [
  "Quem compra studio para short stay em Pinheiros paga mais caro e não leva, por isso, a diária do bairro. O que decide é o studio que você monta.",
  "## Vale a pena comprar studio em Pinheiros para Airbnb?",
  "Vale quando o studio fica entre os mais caros do bairro. A diária média descreve esse studio, não o típico.",
  "## A diária média descreve o studio mais caro do bairro",
  "Compare a mediana e a média na [página de Pinheiros](/bairro/pinheiros) antes de simular. Texto de apoio do exemplo.",
].join("\n\n");
const ok = { tipo: "artigo" as const, titulo: "Studio em Pinheiros para Airbnb: vale a pena?", seo_titulo: null, resumo: "A diária média de Pinheiros descreve um studio entre os mais caros do bairro.", corpo: CORPO_OK, palavra_chave: "studio em Pinheiros" };
const codigos = (extra: Partial<typeof ok>) => avisosDeEstrutura({ ...ok, ...extra }).map((a) => a.codigo);

describe("estrutura pedida pela skill ux-writing-blog", () => {
  it("o texto modelo passa sem aviso", () => {
    expect(avisosDeEstrutura(ok)).toEqual([]);
  });
  it("H1 até 70 caracteres e título de busca até 56 (com título de busca curto, o H1 pode ser maior que 56)", () => {
    expect(codigos({ titulo: "Studio em Pinheiros " + "x".repeat(H1_MAX) })).toContain("h1_longo");
    const longo = "Studio em Pinheiros para Airbnb: vale a pena em 2027 e com reforma?";
    expect(longo.length).toBeGreaterThan(TITULO_BUSCA_MAX);
    expect(codigos({ titulo: longo })).toContain("titulo_busca_longo");
    expect(codigos({ titulo: longo, seo_titulo: "Studio em Pinheiros para Airbnb: vale a pena?" })).not.toContain("titulo_busca_longo");
  });
  it("resumo abre com o achado, não com pergunta", () => {
    expect(codigos({ resumo: "Vale a pena? Depende do studio que você monta." })).toContain("resumo_pergunta");
  });
  it("abertura que anuncia em vez de responder", () => {
    expect(codigos({ corpo: CORPO_OK.replace("Quem compra", "No mundo atual, quem compra") })).toContain("abertura_vazia");
  });
  it("começa com parágrafo; o primeiro ## é a pergunta e vem seguido da resposta em duas ou três frases", () => {
    expect(codigos({ corpo: CORPO_OK.split("\n\n").slice(1).join("\n\n") })).toContain("sem_abertura");
    expect(codigos({ corpo: CORPO_OK.replace("## Vale a pena comprar studio em Pinheiros para Airbnb?", "## Vale a pena comprar studio em Pinheiros") })).toContain("primeiro_h2_nao_pergunta");
    expect(codigos({ corpo: CORPO_OK.replace(" A diária média descreve esse studio, não o típico.", "") })).toContain("resposta_direta");
    expect(codigos({ corpo: CORPO_OK.replace("não o típico.", "não o típico. Uma. Duas.") })).toContain("resposta_direta");
  });
  it("subtítulo genérico, falta de próximo passo no Radar, jargão interno e rótulos em sequência", () => {
    expect(codigos({ corpo: `${CORPO_OK}\n\n## Conclusão\n\nTexto.` })).toContain("h2_generico");
    expect(codigos({ corpo: CORPO_OK.replace("[página de Pinheiros](/bairro/pinheiros)", "página de Pinheiros") })).toContain("sem_link_radar");
    expect(codigos({ corpo: CORPO_OK.replace("(/bairro/pinheiros)", "(https://radarbewild.com.br/projecao?bairro=pinheiros)") })).not.toContain("sem_link_radar");
    expect(codigos({ corpo: `${CORPO_OK}\n\nOs leads chegam por indicação.` })).toContain("jargao_interno");
    expect(codigos({ corpo: `${CORPO_OK}\n\n**Um:** a.\n\n**Dois:** b.\n\n**Três:** c.` })).toContain("rotulos_em_sequencia");
  });
  it("palavra-chave de foco no título de busca, no H1, no primeiro parágrafo e no primeiro ##; singular e plural valem", () => {
    expect(codigos({ palavra_chave: "studios em Pinheiros" })).not.toContain("palavra_chave_ausente");
    const falta = avisosDeEstrutura({ ...ok, palavra_chave: "simulador de Airbnb" }).find((a) => a.codigo === "palavra_chave_ausente");
    expect(falta?.mensagem).toMatch(/título de busca.*título \(H1\).*primeiro parágrafo.*primeiro subtítulo/);
    expect(codigos({ palavra_chave: "" })).toContain("palavra_chave_ausente");
    expect(codigos({ palavra_chave: undefined })).not.toContain("palavra_chave_ausente");
  });
  it("palavra-chave sem a marca, salvo em release", () => {
    expect(codigos({ palavra_chave: "radar bewild" })).toContain("palavra_chave_com_marca");
    expect(codigos({ tipo: "release" as never, palavra_chave: "radar bewild" })).not.toContain("palavra_chave_com_marca");
  });
  it("junta as regras do Radar (marca, promessa, fonte) com as de estrutura", () => {
    const todos = avisosDoTexto({ ...ok, corpo: `${CORPO_OK}\n\nA BWild garante retorno certo.` }).map((a) => a.codigo);
    expect(todos).toEqual(expect.arrayContaining(["marca", "promessa"]));
  });
});

describe("tabelas (skill: título, até cinco colunas, cabeçalho preenchido)", () => {
  const TABELA = "Tabela: Diária média por bairro ([GuestFavorites](https://www.guestfavorites.com/x), jan–set/2026)\n\n| Bairro | Diária média |\n|---|--:|\n| Pinheiros | R$ 299 |";
  it("tabela com título e fonte passa", () => {
    expect(avisosDoTexto({ ...ok, corpo: `${CORPO_OK}\n\n${TABELA}` })).toEqual([]);
  });
  it("sem título, com mais de cinco colunas, com cabeçalho vazio ou colada no parágrafo", () => {
    expect(codigos({ corpo: `${CORPO_OK}\n\n${TABELA.split("\n\n")[1]}` })).toContain("tabela_sem_titulo");
    expect(codigos({ corpo: `${CORPO_OK}\n\nTabela: Seis\n\n| a | b | c | d | e | f |\n|---|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 | 6 |` })).toContain("tabela_colunas");
    expect(codigos({ corpo: `${CORPO_OK}\n\nTabela: Vazio\n\n| Bairro |  |\n|---|---|\n| a | b |` })).toContain("tabela_cabecalho_vazio");
    expect(codigos({ corpo: `${CORPO_OK}\n\nTabela: Colada\n| a | b |\n|---|---|\n| 1 | 2 |` })).toContain("tabela_colada");
  });
  it("tabela com número precisa de fonte no título ou na linha logo depois", () => {
    const semFonte = `${CORPO_OK}\n\nTabela: Diária média por bairro\n\n| Bairro | Diária média |\n|---|--:|\n| Pinheiros | R$ 299 |`;
    expect(avisosDoTexto({ ...ok, corpo: semFonte }).map((a) => a.codigo)).toContain("numero_sem_fonte");
    expect(avisosDoTexto({ ...ok, corpo: `${semFonte}\n\nFonte: [GuestFavorites](https://www.guestfavorites.com/x).` }).map((a) => a.codigo)).not.toContain("numero_sem_fonte");
  });
  it("nota de rodapé com link conta como fonte; sem link, não", () => {
    const comNota = `${CORPO_OK}\n\nA diária média de Pinheiros é R$ 299[^1].\n\n[^1]: [GuestFavorites](https://www.guestfavorites.com/x), jan–set/2026.`;
    expect(avisosDoTexto({ ...ok, corpo: comNota }).map((a) => a.codigo)).not.toContain("numero_sem_fonte");
    expect(avisosDoTexto({ ...ok, corpo: comNota.replace("[GuestFavorites](https://www.guestfavorites.com/x)", "GuestFavorites") }).map((a) => a.codigo)).toContain("numero_sem_fonte");
  });
});

describe("leitura do texto", () => {
  it("separa frases sem quebrar valores e datas", () => {
    expect(frases("A diária é R$ 1.234,56 em jan–set/2026. Isso vale para studio. Fim!")).toHaveLength(3);
  });
  it("título de uma linha é título; # conta como subtítulo (o corpo rebaixa um nível)", () => {
    expect(blocosDoCorpo("# Um\n\n### Dois\n\nTexto\ncom quebra").map((b) => b.tipo)).toEqual(["h2", "h3", "p"]);
  });
  it("termo com flexão de número e sem acento", () => {
    expect(contemTermo("Bairros para Studios em São Paulo", "bairro para studio em sao paulo")).toBe(true);
    expect(contemTermo("Studio em Moema", "studio em Pinheiros")).toBe(false);
  });
});
