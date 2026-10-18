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

  it("o @font-face das duas famílias do tailwind.config.ts aponta para arquivos que existem em public/fonts", () => {
    for (const familia of ["DM Sans", "Playfair Display"]) expect(fontsCss).toContain(`font-family: "${familia}"`);
    for (const arquivo of fontsCss.matchAll(/url\("\/fonts\/([^"]+)"\)/g)) {
      expect(existsSync(`public/fonts/${arquivo[1]}`), arquivo[1]).toBe(true);
      expect(indexHtml, `preload de ${arquivo[1]}`).toContain(`href="/fonts/${arquivo[1]}" as="font" type="font/woff2" crossorigin`);
    }
    expect(existsSync("public/fonts/LICENSE-dm-sans.txt")).toBe(true);
    expect(existsSync("public/fonts/LICENSE-playfair-display.txt")).toBe(true);
  });
});
