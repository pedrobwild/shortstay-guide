import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Expressões que não combinam com o tom consultivo do Radar (sem promessa, sem jargão de venda). */
const BANIDOS = ["máquina de reservas", "maquina de reservas", "máquina de dinheiro", "garantia de retorno", "lucro garantido"];
const SELF = "tomGuia.test.ts";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|json)$/.test(f) && !p.endsWith(SELF) ? [p] : [];
  });
}

describe("tom do guia", () => {
  it.each(BANIDOS)("'%s' não aparece em src/ nem na função do chat", (termo) => {
    const achados = [...files("src"), "supabase/functions/chat/index.ts"].filter((f) => readFileSync(f, "utf8").toLowerCase().includes(termo));
    expect(achados).toEqual([]);
  });
});
