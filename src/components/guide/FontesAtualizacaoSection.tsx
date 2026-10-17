import NaturezaTag from "@/components/radar/NaturezaTag";
import { useBairroData } from "@/hooks/useBairroData";
import { textosFontes } from "@/lib/radarUi";

/** Legenda única do Radar: os três tipos de número, com a origem montada a partir da base exibida. */
export default function FontesAtualizacaoSection() {
  const { bairros } = useBairroData();
  const textos = textosFontes(bairros);
  const colunas = [
    { tipo: "observado" as const, texto: textos.observado },
    { tipo: "estimativa" as const, texto: textos.estimativa },
    { tipo: "hipotese" as const, rotulo: "Hipótese de simulação", texto: textos.hipotese },
  ];
  return (
    <section id="fontes" aria-labelledby="fontes-titulo" className="scroll-mt-24 py-14 lg:py-[72px]">
      <p className="rotulo-secao mb-2.5">Fontes e atualização</p>
      <h2 id="fontes-titulo" className="mb-8 max-w-[720px] font-display text-[28px] font-bold leading-[1.15] text-foreground md:text-[36px]">
        Três tipos de número, sempre identificados
      </h2>
      <div className="grid gap-8 border-t border-foreground pt-6 md:grid-cols-3 md:gap-10">
        {colunas.map((c) => (
          <div key={c.tipo} className="min-w-0">
            <NaturezaTag tipo={c.tipo}>{c.rotulo}</NaturezaTag>
            <p className="mt-3 text-[15px] leading-[1.55] text-foreground-medium">{c.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
