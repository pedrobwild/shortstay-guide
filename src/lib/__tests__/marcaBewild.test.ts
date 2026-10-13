import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) return nome === "__tests__" ? [] : arquivos(p);
    return /\.(ts|tsx)$/.test(nome) ? [p] : [];
  });
}
const FONTES = [...arquivos("src"), "supabase/functions/chat/index.ts", "index.html"];

describe("marca Bewild no Radar", () => {
  it("texto escreve Bewild, nunca BWild nem Bwild como palavra solta", () => {
    for (const f of FONTES) expect(readFileSync(f, "utf8"), f).not.toMatch(/\bB[Ww]ild\b/);
  });

  it("usa a mesma logo do site (a antiga bwild-logo.png saiu)", () => {
    const usos = FONTES.filter((f) => readFileSync(f, "utf8").includes("bwild-logo.png"));
    expect(usos).toEqual([]);
  });
});
