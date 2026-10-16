/**
 * Atalhos do chat: a partir do texto da resposta, oferece ir ao bairro citado,
 * simular esse bairro ou comparar os bairros citados. Determinístico (sem IA):
 * só reconhece nomes da base do Radar, então nunca aponta para página inexistente.
 */
import { slugifyBairro } from "@/lib/seo";
import { linkSimuladorBairro } from "@/data/navegacao";
import { caminhoComparar, MAX_COMPARAR } from "@/lib/comparar";

export interface AtalhoChat { rotulo: string; para: string; tipo: "bairro" | "simular" | "comparar" }

const semAcento = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const escapar = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Bairros citados no texto, na ordem em que aparecem (comparação sem acento e sem diferenciar maiúsculas). */
export function bairrosCitados(texto: string, nomes: string[]): string[] {
  const alvo = semAcento(texto);
  const achados: { nome: string; pos: number }[] = [];
  for (const nome of nomes) {
    const m = new RegExp(`(^|[^a-z0-9])${escapar(semAcento(nome))}([^a-z0-9]|$)`).exec(alvo);
    if (m) achados.push({ nome, pos: m.index });
  }
  return achados.sort((a, b) => a.pos - b.pos).map((a) => a.nome);
}

export function atalhosDaResposta(texto: string, nomes: string[], max = 2): AtalhoChat[] {
  const citados = bairrosCitados(texto, nomes);
  const atalhos: AtalhoChat[] = [];
  for (const nome of citados.slice(0, max)) {
    const slug = slugifyBairro(nome);
    atalhos.push({ rotulo: `Ver ${nome}`, para: `/bairro/${slug}`, tipo: "bairro" });
    atalhos.push({ rotulo: `Simular ${nome}`, para: linkSimuladorBairro(slug), tipo: "simular" });
  }
  if (citados.length >= 2) {
    const lista = citados.slice(0, MAX_COMPARAR);
    atalhos.push({ rotulo: `Comparar ${lista.join(", ")}`, para: caminhoComparar(lista.map(slugifyBairro)), tipo: "comparar" });
  }
  return atalhos;
}

/** Sugestões iniciais conforme a página aberta. `bairro` = nome do bairro da página, quando houver. */
export function sugestoesDaPagina(pathname: string, bairro: string | null, comparando: string[]): string[] | null {
  if (pathname.startsWith("/bairro/") && bairro) {
    return [
      `Vale a pena um studio em ${bairro}?`,
      `Qual a faixa de diária em ${bairro}?`,
      `Como ${bairro} se compara a outros bairros?`,
      "Quanto custa a reforma completa de um studio?",
    ];
  }
  if (pathname === "/comparar" && comparando.length >= 2) {
    return [
      `Qual a diferença entre ${comparando.slice(0, 2).join(" e ")}?`,
      "Qual desses bairros tem ocupação mais estável?",
      "O que pesa mais: diária ou ocupação?",
    ];
  }
  if (pathname === "/ranking" || pathname === "/mercado" || pathname === "/mapa") {
    return [
      "Como ler diária, ocupação e quartis?",
      "Quais bairros têm amostra pequena?",
      "Compare Pinheiros e Vila Mariana",
    ];
  }
  return null;
}
