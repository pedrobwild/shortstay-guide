// Confere, nas páginas NO AR, se o Radar e o bewild.com.br publicam a mesma Organization
// (schema.org, @id https://bewild.com.br/#org) e o mesmo sameAs — e se ambas são o arquivo
// versionado src/data/orgBewild.json. Uma só Bewild para o Google nos dois domínios.
// Uso: npm run conferir-org   (ou: node scripts/conferir-org.mjs)
//   ORG_PAGINAS="https://a/,https://b/x" troca as páginas conferidas.
// Sai com código ≠ 0 quando alguma página diverge ou não responde — o workflow
// .github/workflows/conferir-org.yml roda toda segunda-feira e sob demanda, porque o Radar
// só é publicado quando o Pedro aciona o Lovable (rode depois de cada publicação).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { camposDiferentes, extrairOrganization, impressaoDigital } from "./lib/orgParidade.mjs";

const PAGINAS = (process.env.ORG_PAGINAS ?? [
  "https://bewild.com.br/",
  "https://bewild.com.br/indice-de-custo-de-reforma",
  "https://radarbewild.com.br/",
  "https://radarbewild.com.br/guia/checklist",
  "https://radarbewild.com.br/bairro/pinheiros",
].join(",")).split(",").map((u) => u.trim()).filter(Boolean);

const oficial = JSON.parse(readFileSync(resolve("src/data/orgBewild.json"), "utf8"));
console.log(`Organization oficial (src/data/orgBewild.json): ${impressaoDigital(oficial)}`);

let falhas = 0;
for (const url of PAGINAS) {
  let html;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30_000), headers: { "user-agent": "radar-bewild-conferir-org" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    html = await r.text();
  } catch (err) {
    falhas += 1;
    console.error(`✗ ${url} — não respondeu (${err instanceof Error ? err.message : String(err)})`);
    continue;
  }
  const org = extrairOrganization(html);
  if (!org) {
    falhas += 1;
    console.error(`✗ ${url} — sem nó Organization com o @id oficial no HTML`);
    continue;
  }
  const campos = camposDiferentes(oficial, org);
  if (campos.length) {
    falhas += 1;
    console.error(`✗ ${url} — diverge do arquivo em: ${campos.join(", ")}`);
  } else {
    console.log(`✓ ${url} — idêntica (sameAs com ${org.sameAs?.length ?? 0} perfis)`);
  }
}

if (falhas) {
  console.error(`\n${falhas} de ${PAGINAS.length} páginas fora do padrão. Se o site mudou a Organization, atualize src/data/orgBewild.json e a impressão digital nos dois repositórios; se foi o Radar, publique a versão atual.`);
  process.exit(1);
}
console.log(`\nOrganization e sameAs idênticos nas ${PAGINAS.length} páginas.`);
