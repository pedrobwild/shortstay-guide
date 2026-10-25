import { SEO_BAIRROS, bairroPath, urlCanonica } from "@/lib/seo";

/** Endereços finais sem parâmetros; a medição dos anúncios fica no Google Ads. */
export function linksCompartilhamento() {
  return [
    { nome: "Comparador de preços · Ranking", tipo: "Comparador", url: urlCanonica("/ranking") },
    { nome: "Comparar até três bairros", tipo: "Comparador", url: urlCanonica("/comparar") },
    ...[...SEO_BAIRROS].sort((a,b) => a.localeCompare(b,"pt-BR")).map((nome) => ({ nome, tipo: "Bairro", url: urlCanonica(bairroPath(nome)) })),
  ];
}