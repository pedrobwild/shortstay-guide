import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Mesma regra do fonts.test.ts do bewild.com.br: fontes do próprio site, sem Google Fonts. */
describe("fontes servidas pelo próprio site", () => {
  const indexCss = readFileSync("src/index.css", "utf8");
  const fontsCss = readFileSync("src/fonts.css", "utf8");
  const indexHtml = readFileSync("index.html", "utf8");

  it("nenhum arquivo carrega fontes do Google (fonts.googleapis.com / fonts.gstatic.com)", () => {
    for (const [nome, conteudo] of [["src/index.css", indexCss], ["src/fonts.css", fontsCss], ["index.html", indexHtml]]) {
      expect(conteudo, nome).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    }
  });

  it("cada @font-face aponta para um arquivo que existe em public/fonts, com a licença ao lado", () => {
    for (const familia of ["Source Serif 4", "DM Sans", "Playfair Display"]) expect(fontsCss).toContain(`font-family: "${familia}"`);
    for (const arquivo of fontsCss.matchAll(/url\("\/fonts\/([^"]+)"\)/g)) {
      expect(existsSync(`public/fonts/${arquivo[1]}`), arquivo[1]).toBe(true);
    }
    expect(existsSync("public/fonts/LICENSE-source-serif-4.txt")).toBe(true);
    expect(existsSync("public/fonts/LICENSE-dm-sans.txt")).toBe(true);
    expect(existsSync("public/fonts/LICENSE-playfair-display.txt")).toBe(true);
  });

  it("a fonte das telas públicas (Source Serif 4, normal) tem preload; as do admin e o itálico das fórmulas não", () => {
    expect(indexHtml).toContain('href="/fonts/source-serif-4-latin-variavel.woff2" as="font" type="font/woff2" crossorigin');
    for (const sem of ["dm-sans-latin-variavel", "playfair-display-latin-variavel", "source-serif-4-italico-latin-variavel"]) {
      expect(indexHtml, sem).not.toContain(`href="/fonts/${sem}.woff2" as="font"`);
    }
  });

  it("o index.html sai com a classe do Estudo aberto (telas públicas pré-renderizadas herdam)", () => {
    expect(indexHtml).toMatch(/<html lang="pt-BR" class="estudo">/);
  });
});
