/**
 * Premissas de escrita dos textos do Radar (decisão do Pedro, 18/11/2026: os artigos seguem a
 * skill ux-writing-blog). Aqui ficam só as que dá para conferir no texto; as de processo
 * (volume de busca das variantes, link de volta conferido no ar, visual próprio, conferência
 * da página publicada) estão no passo a passo de docs/conteudos-por-pr.md.
 *
 * Cada aviso impede publicar (pelo formulário do admin ou pelo teste dos arquivos do
 * repositório), mas não impede salvar rascunho. É triagem de texto: não substitui a leitura.
 */
import { avisosEditoriais, type AvisoEditorial, type ConteudoRadar } from "@/lib/conteudosRadar";

/** H1 com o termo principal inteiro, sem diluir (vai inteiro para o headline do dado estruturado). */
export const H1_MAX = 70;
/** Título de busca mostrado sem corte: acima disso, preencher o título de busca. */
export const TITULO_BUSCA_MAX = 56;

/** Aberturas e fórmulas que anunciam em vez de responder. */
export const ABERTURAS_VAZIAS = [
  "no mundo atual", "nos dias de hoje", "você já parou para pensar", "voce ja parou para pensar",
  "neste artigo vamos", "neste artigo, vamos", "neste post vamos", "transformar sonhos em realidade",
];
/** Rótulos de H2 que não dizem o que a seção responde. */
export const H2_GENERICOS = ["introdução", "introducao", "conclusão", "conclusao", "considerações finais", "consideracoes finais", "resumo", "por onde começar", "por onde comecar", "saiba mais", "entenda"];
/** Telas do Radar que um texto pode indicar como próximo passo no corpo. */
const LINK_RADAR = /\]\((https:\/\/radarbewild\.com\.br)?\/(ranking|mapa|comparar|mercado|bairro\/[a-z0-9-]+|projecao|ferramentas|eventos|metodologia|reformar|operar|empreendimentos)(?:[?#][^)]*)?\)/;

export type CodigoEstrutura =
  | "h1_longo" | "titulo_busca_longo" | "resumo_pergunta" | "abertura_vazia" | "sem_abertura"
  | "primeiro_h2_nao_pergunta" | "resposta_direta" | "h2_generico" | "sem_link_radar" | "jargao_interno"
  | "rotulos_em_sequencia" | "palavra_chave_ausente" | "palavra_chave_com_marca"
  | "tabela_sem_titulo" | "tabela_colunas" | "tabela_cabecalho_vazio" | "tabela_colada";
export interface AvisoEstrutura { codigo: CodigoEstrutura; mensagem: string }

const PALAVRAS_VAZIAS = new Set(["a", "o", "as", "os", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "para", "por", "com", "e", "um", "uma", "ao", "aos", "que"]);
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Raízes das palavras: singular e plural contam como a mesma ("studio" e "studios", "bairro" e "bairros"). */
const raizes = (t: string) => semAcento(t).split(/[^a-z0-9]+/).filter((p) => p && !PALAVRAS_VAZIAS.has(p)).map((p) => p.replace(/(es|s)$/, ""));
/** O termo aparece no trecho? Todas as palavras de conteúdo do termo, em qualquer flexão de número. */
export function contemTermo(trecho: string, termo: string): boolean {
  const alvo = new Set(raizes(trecho));
  const partes = raizes(termo);
  return partes.length > 0 && partes.every((p) => alvo.has(p));
}

/** Frases de um parágrafo (ponto, interrogação ou exclamação seguidos de espaço ou fim). */
export const frases = (t: string) => t.trim().split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9"“(])/).filter((f) => f.trim().length > 0);

interface Bloco { tipo: "h2" | "h3" | "p" | "tabela"; texto: string }
/** Até cinco colunas por tabela (skill ux-writing-blog): acima disso, dividir. */
export const TABELA_COLUNAS_MAX = 5;
const LINHA_SEPARADORA = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const celulas = (linha: string) => linha.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
/** Divide o Markdown em títulos e parágrafos (listas, citações e tabelas contam como parágrafo). */
export function blocosDoCorpo(corpo: string): Bloco[] {
  return corpo.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => {
    const h = b.match(/^(#{1,6})\s+(.+)$/);
    if (h && !b.includes("\n")) return { tipo: h[1].length <= 2 ? "h2" : "h3", texto: h[2].trim() } as Bloco;
    const linhas = b.split("\n");
    if (/^\s*\|/.test(linhas[0]) && linhas[1] !== undefined && LINHA_SEPARADORA.test(linhas[1])) return { tipo: "tabela", texto: b } as Bloco;
    return { tipo: "p", texto: b } as Bloco;
  });
}

type Texto = Pick<ConteudoRadar, "tipo" | "titulo" | "resumo" | "corpo" | "seo_titulo"> & { palavra_chave?: string | null };

/**
 * Confere a estrutura pedida pela skill: abertura que responde, primeiro H2 com a pergunta da
 * busca e resposta direta de duas ou três frases, H2 que dizem o que respondem, H1 e título de
 * busca curtos, resumo que abre com o achado, próximo passo no Radar e, nos textos do
 * repositório, a palavra-chave de foco no título de busca, no H1, na abertura e no primeiro H2.
 */
export function avisosDeEstrutura(c: Texto): AvisoEstrutura[] {
  const avisos: AvisoEstrutura[] = [];
  const blocos = blocosDoCorpo(c.corpo);
  const iPrimeiroH2 = blocos.findIndex((b) => b.tipo === "h2");
  const abertura = (iPrimeiroH2 < 0 ? blocos : blocos.slice(0, iPrimeiroH2)).filter((b) => b.tipo === "p");
  const primeiroH2 = iPrimeiroH2 >= 0 ? blocos[iPrimeiroH2] : null;
  const respostaDireta = primeiroH2 ? blocos.slice(iPrimeiroH2 + 1).find((b) => b.tipo !== "h3") : undefined;
  const h2s = blocos.filter((b) => b.tipo === "h2");
  const tituloBusca = c.seo_titulo || c.titulo;
  const tudo = semAcento([c.resumo, c.corpo].join("\n"));

  if (c.titulo.length > H1_MAX) avisos.push({ codigo: "h1_longo", mensagem: `O título tem ${c.titulo.length} caracteres. Deixe em até ${H1_MAX}, com o termo principal da busca.` });
  if (tituloBusca.length > TITULO_BUSCA_MAX) avisos.push({ codigo: "titulo_busca_longo", mensagem: `O título de busca tem ${tituloBusca.length} caracteres. Preencha um título de busca de até ${TITULO_BUSCA_MAX}.` });
  if (frases(c.resumo)[0]?.trim().endsWith("?")) avisos.push({ codigo: "resumo_pergunta", mensagem: "O resumo abre com pergunta. Abra com o achado ou a resposta." });
  const vazia = ABERTURAS_VAZIAS.find((a) => tudo.includes(semAcento(a)));
  if (vazia) avisos.push({ codigo: "abertura_vazia", mensagem: `“${vazia}” anuncia em vez de responder. Comece pela situação do leitor e pela resposta.` });
  if (!abertura.length) avisos.push({ codigo: "sem_abertura", mensagem: "O texto começa por um subtítulo. Abra com um ou dois parágrafos com a resposta e o recorte." });
  if (!primeiroH2 || !primeiroH2.texto.trim().endsWith("?")) {
    avisos.push({ codigo: "primeiro_h2_nao_pergunta", mensagem: "O primeiro subtítulo (##) precisa ser a pergunta do leitor nas palavras da busca, terminando com “?”." });
  } else {
    const n = respostaDireta?.tipo === "p" ? frases(respostaDireta.texto).length : 0;
    if (n < 2 || n > 3) avisos.push({ codigo: "resposta_direta", mensagem: `Logo depois do primeiro subtítulo vai a resposta direta em duas ou três frases (hoje: ${n}).` });
  }
  const genericos = h2s.filter((h) => H2_GENERICOS.includes(semAcento(h.texto).replace(/[.:!?]+$/, "").trim()));
  if (genericos.length) avisos.push({ codigo: "h2_generico", mensagem: `Subtítulo que não diz o que responde: “${genericos[0].texto}”. Use uma pergunta ou a conclusão da seção.` });
  if (!LINK_RADAR.test(c.corpo)) avisos.push({ codigo: "sem_link_radar", mensagem: "O corpo não leva a nenhuma tela do Radar (bairro, ranking, simulador…). Inclua o próximo passo com link." });
  if (/\bleads?\b/.test(tudo)) avisos.push({ codigo: "jargao_interno", mensagem: "“Lead” é termo interno. Diga “pessoas” ou quem elas são, sem trocar o sentido." });
  let seguidos = 0;
  for (const b of blocos) {
    seguidos = b.tipo === "p" && /^\*\*[^*]+\*\*/.test(b.texto) ? seguidos + 1 : 0;
    if (seguidos >= 3) { avisos.push({ codigo: "rotulos_em_sequencia", mensagem: "Três ou mais parágrafos seguidos começam com rótulo em negrito. Transforme em lista ou em prosa." }); break; }
  }
  // Tabelas: título no parágrafo "Tabela: …" logo antes, até cinco colunas, cabeçalho preenchido.
  blocos.forEach((b, i) => {
    if (b.tipo === "p" && b.texto.split("\n").some((l, k) => k > 0 && LINHA_SEPARADORA.test(l))) {
      avisos.push({ codigo: "tabela_colada", mensagem: "Há uma tabela colada no parágrafo de cima. Deixe uma linha em branco entre o título e a tabela." });
    }
    if (b.tipo !== "tabela") return;
    const cabecalho = celulas(b.texto.split("\n")[0]);
    const anterior = blocos[i - 1];
    if (anterior?.tipo !== "p" || !/^Tabela(\s+\d+)?\s*[:.–-]/.test(anterior.texto)) {
      avisos.push({ codigo: "tabela_sem_titulo", mensagem: "Toda tabela leva título: um parágrafo “Tabela: …” logo antes dela." });
    }
    if (cabecalho.length > TABELA_COLUNAS_MAX) avisos.push({ codigo: "tabela_colunas", mensagem: `Uma tabela tem ${cabecalho.length} colunas. Use até ${TABELA_COLUNAS_MAX}, com uma medida por tabela.` });
    if (cabecalho.some((t) => !t)) avisos.push({ codigo: "tabela_cabecalho_vazio", mensagem: "Uma tabela tem coluna sem título no cabeçalho." });
  });
  if (c.palavra_chave !== undefined) {
    const termo = (c.palavra_chave ?? "").trim();
    const onde: [string, string | undefined][] = [["título de busca", tituloBusca], ["título (H1)", c.titulo], ["primeiro parágrafo", abertura[0]?.texto], ["primeiro subtítulo", primeiroH2?.texto]];
    const faltando = termo ? onde.filter(([, t]) => !t || !contemTermo(t, termo)).map(([nome]) => nome) : ["todos (palavra-chave vazia)"];
    if (faltando.length) avisos.push({ codigo: "palavra_chave_ausente", mensagem: `A palavra-chave de foco${termo ? ` “${termo}”` : ""} falta em: ${faltando.join(", ")}.` });
    if (termo && c.tipo !== "release" && /\b(bewild|bwild|radar)\b/.test(semAcento(termo))) {
      avisos.push({ codigo: "palavra_chave_com_marca", mensagem: "A palavra-chave de foco leva a marca. Use a consulta que o leitor faria sem conhecer o Radar; a marca entra ao lado dela." });
    }
  }
  return avisos;
}

/** Todos os avisos que impedem publicar: regras do Radar (marca, termos, promessa, fonte) + estrutura da skill. */
export function avisosDoTexto(c: Texto): (AvisoEditorial | AvisoEstrutura)[] {
  return [...avisosEditoriais([c.titulo, c.resumo, c.corpo].join("\n\n")), ...avisosDeEstrutura(c)];
}
