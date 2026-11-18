import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { conteudosMarkdownPlugin } from "@/lib/conteudosMarkdownPlugin";

describe("compilação dos textos Markdown", () => {
  const plugin = conteudosMarkdownPlugin();
  const carregar = async (id: string) => {
    if (typeof plugin.load !== "function") throw new Error("Carregador ausente");
    return plugin.load.call({} as never, id);
  };

  it.each(readdirSync("src/content/conteudos").filter((nome) => nome.endsWith(".md")))(
    "%s exporta o texto íntegro mesmo sem ?raw",
    async (nome) => {
      const caminho = resolve("src/content/conteudos", nome);
      const texto = readFileSync(caminho, "utf8");
      for (const sufixo of ["", "?raw", "?raw&import"]) {
        const resultado = await carregar(caminho + sufixo);
        if (!resultado || typeof resultado === "string") throw new Error("Módulo ausente");
        const exportado = new Function(resultado.code.replace(/^export default /, "return "))();
        expect(exportado).toBe(texto);
      }
    },
  );

  it("não intercepta código nem Markdown fora da pasta editorial", async () => {
    expect(await carregar(resolve("src/lib/conteudosRepositorio.ts"))).toBeNull();
    expect(await carregar(resolve("README.md"))).toBeNull();
  });
});