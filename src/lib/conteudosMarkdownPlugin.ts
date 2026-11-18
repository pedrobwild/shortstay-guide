import { readFile } from "node:fs/promises";
import type { Plugin } from "vite";

/** Somente configuração do Vite: o cabeçalho editorial nunca é JavaScript. */
export function conteudosMarkdownPlugin(): Plugin {
  return {
    name: "radar-conteudos-markdown",
    enforce: "pre",
    async load(id) {
      const caminho = id.split("?", 1)[0];
      if (!/\/src\/content\/conteudos\/[^/]+\.md$/.test(caminho)) return null;
      const texto = await readFile(caminho, "utf8");
      return { code: `export default ${JSON.stringify(texto)};`, map: null };
    },
  };
}