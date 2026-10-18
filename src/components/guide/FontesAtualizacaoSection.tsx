import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import NaturezaTag from "@/components/radar/NaturezaTag";
import { useBairroData } from "@/hooks/useBairroData";
import { textosFontes } from "@/lib/radarUi";

/**
 * Legenda única do Radar: os três tipos de número, com a origem montada a partir da base
 * exibida. A aproximação (números de um distrito vizinho com fonte) fica junto do dado
 * observado, com a própria etiqueta.
 */
export default function FontesAtualizacaoSection() {
  const { bairros } = useBairroData();
  const textos = textosFontes(bairros);
  const colunas = [
    { tipo: "observado" as const, texto: textos.observado, extra: textos.aproximacao },
    { tipo: "estimativa" as const, texto: textos.estimativa, extra: null },
    { tipo: "hipotese" as const, rotulo: "Hipótese de simulação", texto: textos.hipotese, extra: null },
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
            {c.extra && (
              <div className="mt-4">
                <NaturezaTag tipo="aproximacao" tamanho="sm" />
                <p className="mt-2 text-[15px] leading-[1.55] text-foreground-medium">{c.extra}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <Link to="/metodologia" className="mt-8 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4">
        Metodologia completa, registro de atualizações e dados abertos<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
