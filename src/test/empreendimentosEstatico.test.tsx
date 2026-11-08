import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CatalogoEmpreendimentosEstatico, EmpreendimentoEstatico } from "@/components/empreendimentos/EmpreendimentosEstatico";
import { bairrosReserva } from "@/lib/radarBase";
import { bairroNaBase, type Empreendimento } from "@/lib/empreendimentos";
import type { BairroBase } from "@/lib/radarUi";

const base: Empreendimento = {
  id: "1", slug: "studio-gama-brooklin", nome: "Studio Gama Brooklin", bairro: "Brooklin", endereco: "Rua Exemplo, 200", incorporadora: null,
  tipologias: "studios de 25 m²", situacao: "pronto", entrega: null, resumo: "Torre de studios.", diferenciais: ["Coworking"],
  fonte_url: "https://exemplo.com.br/gama", fonte_titulo: "Portal imobiliário", fonte_consultada_em: "2026-10-30", foto_url: null,
  foto_alt: null, foto_credito: null, selo_bewild: true, status: "publicado",
};
const reserva = bairrosReserva() as BairroBase[];

describe("HTML estático dos empreendimentos (pré-renderização)", () => {
  it("página do prédio: conteúdo, fonte e aproximação, sem número de bairro", () => {
    const html = renderToStaticMarkup(<EmpreendimentoEstatico e={base} naBase={bairroNaBase("Brooklin", reserva)} />);
    expect(html).toContain("<h1>Studio Gama Brooklin</h1>");
    expect(html).toContain("Conforme Portal imobiliário, consultada em 30/10/2026.");
    expect(html).toContain("Brooklin: aproximação pelo Itaim Bibi");
    expect(html).toContain('href="/bairro/brooklin"');
    expect(html).not.toMatch(/R\$|\d+%/);
  });

  it("bairro fora da base e sem fonte: diz que não há dado e não cita fonte", () => {
    const html = renderToStaticMarkup(<EmpreendimentoEstatico e={{ ...base, bairro: "Vila Clementino", fonte_url: null }} naBase={null} />);
    expect(html).toContain("Vila Clementino ainda não está entre os bairros da base do Radar");
    expect(html).not.toContain("Conforme");
  });

  it("catálogo: links para as páginas de cada prédio, em ordem alfabética, com o aviso", () => {
    const html = renderToStaticMarkup(
      <CatalogoEmpreendimentosEstatico h1="Empreendimentos em destaque" descricao="Descrição." lista={[{ ...base, slug: "zeta", nome: "Zeta" }, { ...base, slug: "alfa", nome: "Alfa" }]} />,
    );
    expect(html.indexOf('href="/empreendimentos/alfa"')).toBeLessThan(html.indexOf('href="/empreendimentos/zeta"'));
    expect(html).toContain("Não é recomendação de compra");
  });
});
