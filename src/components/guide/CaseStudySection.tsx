import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, MapPin, Ruler, DollarSign } from "lucide-react";
import SectionBlock from "./SectionBlock";

export default function CaseStudySection() {
  const caseData = {
    bairro: "Pinheiros",
    metragem: 28,
    investimentoTotal: 385000,
    reforma: 32000,
    decoracao: 28000,
    diaria: 380,
    ocupacao: 82,
    receitaMensal: 9348,
    receitaAnual: 112176,
    yieldBruto: "29.1%",
    paybackMeses: 7,
  };

  const timeline = [
    { month: "Mês 1–2", label: "Compra + reforma", desc: "Aquisição, reforma inteligente e marcenaria planejada" },
    { month: "Mês 3", label: "Decoração + fotos", desc: "Design premium, enxoval e sessão fotográfica profissional" },
    { month: "Mês 4", label: "Lançamento", desc: "Anúncio otimizado + preço dinâmico + primeiras reservas" },
    { month: "Mês 5–10", label: "Ramp-up", desc: "Construção de reviews, ajustes de preço, ocupação crescente" },
    { month: "Mês 11+", label: "Cruzeiro", desc: "Operação estável, receita previsível, payback atingido" },
  ];

  return (
    <SectionBlock id="casestudy" title="Case Study: Studio em Pinheiros" takeaway="Jornada real de um investidor — do imóvel à receita recorrente.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card className="border-border"><CardContent className="p-4 text-center"><MapPin size={18} className="text-primary mx-auto mb-1" /><p className="text-lg font-display font-bold text-foreground">{caseData.bairro}</p><p className="text-xs text-muted-foreground">Bairro</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><Ruler size={18} className="text-primary mx-auto mb-1" /><p className="text-lg font-display font-bold text-foreground">{caseData.metragem}m²</p><p className="text-xs text-muted-foreground">Metragem</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><DollarSign size={18} className="text-primary mx-auto mb-1" /><p className="text-lg font-display font-bold text-primary">R$ {caseData.receitaMensal.toLocaleString("pt-BR")}/mês</p><p className="text-xs text-muted-foreground">Receita média</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><TrendingUp size={18} className="text-primary mx-auto mb-1" /><p className="text-lg font-display font-bold text-primary">{caseData.yieldBruto}</p><p className="text-xs text-muted-foreground">Yield bruto</p></CardContent></Card>
      </div>

      <h3 className="font-display text-xl font-bold text-foreground mb-4">Investimento</h3>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Imóvel</p><p className="font-display font-bold text-foreground">R$ {(caseData.investimentoTotal - caseData.reforma - caseData.decoracao).toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Reforma</p><p className="font-display font-bold text-foreground">R$ {caseData.reforma.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card className="border-border"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Decoração</p><p className="font-display font-bold text-foreground">R$ {caseData.decoracao.toLocaleString("pt-BR")}</p></CardContent></Card>
      </div>

      <h3 className="font-display text-xl font-bold text-foreground mb-4">Timeline do Projeto</h3>
      <div className="space-y-3">
        {timeline.map((step, i) => (
          <div key={step.month} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar size={14} className="text-primary" />
              </div>
              {i < timeline.length - 1 && <div className="w-px h-6 bg-border" />}
            </div>
            <div>
              <Badge variant="secondary" className="font-body text-xs mb-1">{step.month}</Badge>
              <p className="font-semibold text-foreground text-sm">{step.label}</p>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}
