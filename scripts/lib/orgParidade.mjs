// Comparação da Organization (schema.org) publicada pelo Radar e pelo bewild.com.br.
// Os dois domínios publicam o MESMO nó (@id https://bewild.com.br/#org): uma só Bewild
// para o Google. Funções puras, usadas pelo teste (src/lib/__tests__/orgParidade.test.ts)
// e pela conferência das páginas no ar (scripts/conferir-org.mjs).
import { createHash } from "node:crypto";

export const ORG_ID = "https://bewild.com.br/#org";

/** Mesma estrutura com as chaves em ordem alfabética (a ordem das listas é mantida: ela conta). */
export function ordenar(valor) {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === "object") return Object.fromEntries(Object.keys(valor).sort().map((k) => [k, ordenar(valor[k])]));
  return valor;
}

const semContexto = (no) => { const { "@context": _contexto, ...resto } = no; return resto; };
const texto = (valor) => JSON.stringify(ordenar(valor));

/** SHA-256 do nó (sem @context, chaves ordenadas): o valor travado nos testes dos dois repositórios. */
export function impressaoDigital(no) {
  return createHash("sha256").update(texto(semContexto(no))).digest("hex");
}

/**
 * Nó Organization com o @id oficial dentro do HTML de uma página — num <script> próprio
 * (Radar) ou dentro de um @graph (site). Devolve o nó sem @context, ou null se não houver.
 */
export function extrairOrganization(html, id = ORG_ID) {
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    let dado;
    try { dado = JSON.parse(m[1]); } catch { continue; }
    const nos = Array.isArray(dado) ? dado : Array.isArray(dado?.["@graph"]) ? dado["@graph"] : [dado];
    const org = nos.find((n) => n && n["@type"] === "Organization" && n["@id"] === id);
    if (org) return semContexto(org);
  }
  return null;
}

/** Campos (de primeiro nível) que diferem entre dois nós; lista vazia = idênticos. */
export function camposDiferentes(a, b) {
  const [x, y] = [semContexto(a), semContexto(b)];
  return [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => texto(x[k]) !== texto(y[k])).sort();
}
