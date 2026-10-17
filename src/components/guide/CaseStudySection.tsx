import { useMemo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, MapPin, Ruler, DollarSign, Percent, Award, type LucideIcon } from "lucide-react";
import SectionBlock from "./SectionBlock";
import { useGuideDecision } from "@/hooks/useGuideDecision";
import { loadPendingProvision } from "@/lib/leadProvisioning";
import { selectCaseStudies, type MatchLevel } from "@/data/caseStudies";

/** Banner de relevância: explica por que este case está sendo mostrado ao lead. */
function relevanceCopy(matchLevel: MatchLevel, leadBairro: string | null, region: string | null) {
  switch (matchLevel) {
    case "bairro":
      return {
        label: "No seu bairro",
        text: `Você demonstrou interesse em ${leadBairro}. Veja um case real que a Bewild operou aqui.`,
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

export default function CaseStudySection() {
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
  const isContextual = matchLevel !== "geral";
  const brl = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;
  const cartoes: { icone: LucideIcon; valor: string; rotulo: string }[] = [
    { icone: MapPin, valor: caseData.bairro, rotulo: "Bairro" },
    ...(caseData.metragem != null ? [{ icone: Ruler, valor: `${caseData.metragem}m²`, rotulo: "Metragem" }] : []),
    ...(caseData.ocupacao != null ? [{ icone: Percent, valor: `${caseData.ocupacao}%`, rotulo: `Ocupação ${caseData.ocupacaoContexto ?? "média"}` }] : []),
    ...(caseData.diaria != null ? [{ icone: DollarSign, valor: brl(caseData.diaria), rotulo: `Diária ${caseData.diariaContexto ?? ""}`.trim() }] : []),
    ...(caseData.receitaMensal != null ? [{ icone: DollarSign, valor: `${brl(caseData.receitaMensal)}/mês`, rotulo: "Receita média" }] : []),
    ...(caseData.yieldBruto ? [{ icone: TrendingUp, valor: caseData.yieldBruto, rotulo: "Yield bruto" }] : []),
  ];

  return (
    <SectionBlock
      id="casestudy"
      title={`Case real: studio na ${caseData.bairro}`}
      takeaway="Studio reformado pela Bewild: números publicados no depoimento da cliente."
    >
      {/* Banner de relevância contextual */}
      <div
        className={`flex items-start gap-3 rounded-lg border p-4 mb-6 ${
          isContextual ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"
        }`}
        role="note"
      >
        <MapPin size={18} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <Badge variant={isContextual ? "default" : "secondary"} className="font-body text-xs mb-1">
            {copy.label}
          </Badge>
          <p className="text-sm text-muted-foreground">{copy.text}</p>
        </div>
      </div>

      {caseData.fotos?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {caseData.fotos.map((foto) => (
            <figure key={foto.src} className="overflow-hidden rounded-lg border border-border">
              <img src={foto.src} alt={foto.alt} loading="lazy" className="w-full h-auto object-cover" />
              {foto.label && (
                <figcaption className="px-3 py-2 text-xs font-body text-muted-foreground bg-muted/40">{foto.label}</figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : null}

      {caseData.destaques?.length ? (
        <ul className="mb-6 space-y-2">
          {caseData.destaques.map((d) => (
            <li key={d} className="flex items-start gap-2 text-sm text-foreground"><Award size={16} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />{d}</li>
          ))}
        </ul>
      ) : null}

      {/* Só cartões com dado publicado; campo vazio não aparece (nunca zero). */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {cartoes.map((c) => (
          <Card key={c.rotulo} className="border-border"><CardContent className="p-4 text-center"><c.icone size={18} className="text-primary mx-auto mb-1" aria-hidden="true" /><p className="text-lg font-display font-bold text-foreground">{c.valor}</p><p className="text-xs text-muted-foreground">{c.rotulo}</p></CardContent></Card>
        ))}
      </div>

      {caseData.investimento && (
        <>
          <h3 className="font-display text-xl font-bold text-foreground mb-4">Investimento</h3>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Imóvel</p><p className="font-display font-bold text-foreground">R$ {caseData.investimento.imovel.toLocaleString("pt-BR")}</p></CardContent></Card>
            <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Reforma</p><p className="font-display font-bold text-foreground">R$ {caseData.investimento.reforma.toLocaleString("pt-BR")}</p></CardContent></Card>
            <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Decoração</p><p className="font-display font-bold text-foreground">R$ {caseData.investimento.decoracao.toLocaleString("pt-BR")}</p></CardContent></Card>
          </div>
        </>
      )}

      {caseData.timeline.length > 0 && (
        <>
          <h3 className="font-display text-xl font-bold text-foreground mb-4">Timeline do Projeto</h3>
          <div className="space-y-3">
            {caseData.timeline.map((step, i) => (
              <div key={step.month} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar size={14} className="text-primary" aria-hidden="true" />
                  </div>
                  {i < caseData.timeline.length - 1 && <div className="w-px h-6 bg-border" />}
                </div>
                <div>
                  <Badge variant="secondary" className="font-body text-xs mb-1">{step.month}</Badge>
                  <p className="font-semibold text-foreground text-sm">{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {caseData.depoimentoUrl && (
        <a href={caseData.depoimentoUrl} className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary underline underline-offset-4">
          Ver o depoimento{caseData.cliente ? ` da ${caseData.cliente}` : ""}
        </a>
      )}
    </SectionBlock>
  );
}
