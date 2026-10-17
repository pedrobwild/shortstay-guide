import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Teste de guarda da Onda 4 (design system): toda cor sai dos tokens HSL de
 * src/index.css e nenhum texto fica abaixo de 12 px. Componentes gerados do
 * shadcn (src/components/ui) e arquivos gerados do Supabase ficam de fora.
 */
const RAIZ = path.resolve(__dirname, "../..");
const IGNORAR_PASTAS = new Set(["ui", "integrations", "__tests__", "test"]);

function arquivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return IGNORAR_PASTAS.has(d.name) ? [] : arquivos(p);
    return /\.(tsx?|css)$/.test(d.name) ? [p] : [];
  });
}

const TODOS = arquivos(RAIZ);
const rel = (f: string) => path.relative(RAIZ, f);

function ocorrencias(re: RegExp, filtro: (f: string) => boolean = () => true): string[] {
  const achados: string[] = [];
  for (const f of TODOS.filter(filtro)) {
    readFileSync(f, "utf8").split("\n").forEach((linha, i) => {
      const m = linha.match(re);
      if (m) achados.push(`${rel(f)}:${i + 1} → ${m[0]}`);
    });
  }
  return achados;
}

const PALETA =
  "red|green|blue|yellow|amber|emerald|slate|gray|zinc|neutral|stone|orange|rose|sky|indigo|violet|purple|teal|lime|cyan|pink|fuchsia";

// Cores oficiais das linhas do Metrô de SP: identidade externa, não cor de interface.
const CORES_METRO = /line: "Linha \d/;

describe("design system — tokens obrigatórios", () => {
  it("não usa a paleta padrão do Tailwind (use success/warning/danger/info/cat-1…4)", () => {
    const re = new RegExp(`(?:^|[\\s"'\`{(!:])(?:[a-z]+(?:-[a-z]+)?)-(?:${PALETA})-\\d{2,3}\\b`);
    expect(ocorrencias(re)).toEqual([]);
  });

  it("não usa cor crua (hex, rgb ou hsl com números) fora dos tokens", () => {
    const hex = /["'`(]#[0-9a-fA-F]{3,8}\b/;
    const funcao = /\b(?:rgba?|hsla?)\(\s*\d/;
    // corToken.ts converte os tokens para o MapLibre (único lugar que monta hsla()).
    const foraDoConversor = (f: string) => !f.endsWith(".css") && !f.endsWith("corToken.ts");
    const achados = [
      ...ocorrencias(hex, foraDoConversor),
      ...ocorrencias(funcao, foraDoConversor),
    ].filter((a) => !/rgba\(0,\s*0,\s*0,/.test(a)); // sombras neutras
    const fora = achados.filter((a) => {
      const [arq, linha] = a.split(" → ")[0].split(":");
      const texto = readFileSync(path.join(RAIZ, arq), "utf8").split("\n")[Number(linha) - 1];
      return !CORES_METRO.test(texto);
    });
    expect(fora).toEqual([]);
  });

  it("não tem texto abaixo de 12 px (classes, recharts e mapa)", () => {
    expect(ocorrencias(/text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/)).toEqual([]);
    expect(ocorrencias(/fontSize[=:]\s*\{?\s*(?:[0-9]|1[01])\b/)).toEqual([]);
    expect(ocorrencias(/"text-size":\s*(?:[0-9]|1[01])\b/)).toEqual([]);
  });

  it("todo token semântico tem par no tema escuro", () => {
    const css = readFileSync(path.join(RAIZ, "index.css"), "utf8");
    const [claro, escuro] = css.split(/\.dark\s*\{/);
    const nomes = [...claro.matchAll(/--((?:success|warning|danger|info|cat-\d)(?:-strong|-soft)?):/g)].map((m) => m[1]);
    expect(nomes.length).toBeGreaterThanOrEqual(24);
    for (const n of nomes) expect(escuro, `--${n} sem par .dark`).toContain(`--${n}:`);
  });

  it("respeita a preferência de reduzir movimento", () => {
    const app = readFileSync(path.join(RAIZ, "App.tsx"), "utf8");
    expect(app).toMatch(/<MotionConfig reducedMotion="user">/);
    expect(readFileSync(path.join(RAIZ, "index.css"), "utf8")).toMatch(/prefers-reduced-motion: reduce/);
  });
});
