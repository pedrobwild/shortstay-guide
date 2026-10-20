import { useMemo, useEffect, useState } from "react";
import { useRastrearSecao } from "./SectionBlock";
import NovaAba from "@/components/NovaAba";
import { formatBRL } from "@/lib/numberFormat";
import { useGuideDecision } from "@/hooks/useGuideDecision";
import { loadPendingProvision } from "@/lib/leadProvisioning";
import { selectCaseStudies, type MatchLevel } from "@/data/caseStudies";

/** Banner de relevância: explica por que este case está sendo mostrado ao lead. */
function relevanceCopy(matchLevel: MatchLevel, leadBairro: string | null, region: string | null) {
  switch (matchLevel) {
    case "bairro":
      return {
        label: "No seu bairro",
        text: `Você demonstrou interesse em ${leadBairro}. Veja um case real de studio reformado pela Bewild aqui.`,
      };
    case "regiao":
      return {
        label: `Perto de você · ${region}`,
        text: `Ainda não temos um case público em ${leadBairro}, mas este studio fica na mesma região (${region}).`,
      };
    default:
      return {
        label: "Case real Bewild",
        text: leadBairro
          ? `Ainda não temos um case público em ${leadBairro}. Veja um de nossos cases de referência.`
          : "Um studio reformado pela Bewild e o que ele alcançou no Airbnb.",
      };
  }
}

/**
 * Case real da Bewild (prova social contextual), no padrão "Estudo aberto": vive na
 * /projecao. Só números publicados no depoimento (caseStudies.ts); campo sem dado não
 * aparece. O título da seção vem da tela; aqui ficam o contexto, os números e o link.
 */
export default function CaseStudySection() {
  const ref = useRastrearSecao<HTMLDivElement>("casestudy");
  const { selectedBairro, investorProfile } = useGuideDecision();

  // Bairro do lead: seleção em sessão (quiz/recomendação) ou bairro informado
  // na captura do lead (persistido em localStorage). Fallback gracioso quando
  // não há nenhum dos dois.
  // Lido depois da montagem: no HTML pré-renderizado não há localStorage, e ler na
  // renderização faria o texto do servidor e do navegador divergirem (erro de hidratação).
  const [bairroSalvo, setBairroSalvo] = useState<string | null>(null);
  useEffect(() => {
    const salvo = loadPendingProvision()?.neighborhood;
    if (salvo) setBairroSalvo(salvo);
  }, []);
  const selection = useMemo(() => {
    const leadBairro = selectedBairro ?? bairroSalvo ?? null;
    return selectCaseStudies({ bairro: leadBairro, profile: investorProfile });
  }, [selectedBairro, bairroSalvo, investorProfile]);

  const caseData = selection.cases[0];
  if (!caseData) return null;

  const { matchLevel, leadBairro, region } = selection;
  const copy = relevanceCopy(matchLevel, leadBairro, region ?? null);
  const numeros: { valor: string; rotulo: string }[] = [
    { valor: caseData.bairro, rotulo: "Bairro" },
    ...(caseData.metragem != null ? [{ valor: `${caseData.metragem} m²`, rotulo: "Metragem" }] : []),
    ...(caseData.ocupacao != null ? [{ valor: `${caseData.ocupacao}%`, rotulo: `Ocupação ${caseData.ocupacaoContexto ?? "média"}` }] : []),
    ...(caseData.diaria != null ? [{ valor: formatBRL(caseData.diaria), rotulo: `Diária ${caseData.diariaContexto ?? ""}`.trim() }] : []),
    ...(caseData.receitaMensal != null ? [{ valor: `${formatBRL(caseData.receitaMensal)}/mês`, rotulo: "Receita média" }] : []),
    ...(caseData.yieldBruto ? [{ valor: caseData.yieldBruto, rotulo: "Rentabilidade bruta" }] : []),
  ];

  return (
    <div ref={ref} id="casestudy">
      <p className="e-rotulo">{copy.label}</p>
      <p className="e-apoio mt-1 max-w-[720px]">{copy.text}</p>

      {caseData.fotos?.length ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {caseData.fotos.map((foto) => (
            <figure key={foto.src} className="m-0">
              <img src={foto.src} alt={foto.alt} loading="lazy" className="h-auto w-full object-cover" />
              {foto.label && <figcaption className="e-legenda mt-1">{foto.label}</figcaption>}
            </figure>
          ))}
        </div>
      ) : null}

      {/* Só números publicados; campo vazio não aparece (nunca zero). */}
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-foreground pt-4 md:grid-cols-4">
        {numeros.map((c) => (
          <div key={c.rotulo} className="min-w-0">
            <dt className="e-rotulo">{c.rotulo}</dt>
            <dd className="e-numero-sm m-0 mt-1">{c.valor}</dd>
          </div>
        ))}
      </dl>
      <p className="e-legenda mt-3 max-w-[720px]">Números publicados no depoimento da cliente, com o período de cada um: não são média anual nem dado da base do Radar.</p>

      {caseData.destaques?.length ? (
        <ul className="mt-6 space-y-1">
          {caseData.destaques.map((d) => <li key={d} className="e-corpo">{d}</li>)}
        </ul>
      ) : null}

      {caseData.investimento && (
        <dl className="mt-6 grid grid-cols-3 gap-x-6 border-t border-foreground pt-4">
          <div><dt className="e-rotulo">Imóvel</dt><dd className="e-numero-sm m-0 mt-1">{formatBRL(caseData.investimento.imovel)}</dd></div>
          <div><dt className="e-rotulo">Reforma</dt><dd className="e-numero-sm m-0 mt-1">{formatBRL(caseData.investimento.reforma)}</dd></div>
          <div><dt className="e-rotulo">Decoração</dt><dd className="e-numero-sm m-0 mt-1">{formatBRL(caseData.investimento.decoracao)}</dd></div>
        </dl>
      )}

      {caseData.timeline.length > 0 && (
        <ol className="mt-6 border-t border-foreground">
          {caseData.timeline.map((step) => (
            <li key={step.month} className="e-fina grid gap-1 border-b py-3 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6">
              <span className="e-rotulo pt-0.5">{step.month}</span>
              <span><span className="block font-semibold">{step.label}</span><span className="e-apoio block">{step.desc}</span></span>
            </li>
          ))}
        </ol>
      )}

      {caseData.depoimentoUrl && (
        <a href={caseData.depoimentoUrl} target="_blank" rel="noopener noreferrer" className="e-link mt-4 inline-flex min-h-[44px] items-center text-[15px]">
          Ver o depoimento{caseData.cliente ? ` da ${caseData.cliente}` : ""}<NovaAba />
        </a>
      )}
    </div>
  );
}
