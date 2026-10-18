import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import FonteBairro from "@/components/guide/FonteBairro";
import { VariacaoColetaBairro } from "@/components/guide/VariacaoColeta";
import FaixaQuartisBairro from "@/components/intelligence/FaixaQuartisBairro";
import BlocoReformaBairro from "@/components/intelligence/BlocoReformaBairro";
import ProximoPassoBairro from "@/components/intelligence/ProximoPassoBairro";
import Carimbo from "@/components/radar/Carimbo";
import NaturezaTag from "@/components/radar/NaturezaTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { receitaMensalReferencia } from "@/data/bairrosCurados";
import type { BairroRadar } from "@/lib/radarBase";
import { avisoAmostraBairro, naturezaBairro } from "@/lib/radarUi";
import { formatBRL, formatDecimal, formatPercent } from "@/lib/numberFormat";
import { slugifyBairro } from "@/lib/seo";
import { FOOTER_DISCLAIMER } from "@/lib/uiHelpers";

/**
 * Página de um bairro que existe na base do Radar (radar_bairro_atual) mas ainda não
 * tem a estimativa de mercado — base 2025 (bairro_airbnb_sp: scores, preço do m²,
 * aluguel). Mostra só o que a base tem — diária, ocupação, quartis, amostra, fonte,
 * receita de referência e variação da coleta — e os mesmos próximos passos das
 * outras páginas. Nada é estimado para preencher o que falta.
 */
export default function BairroSomenteRadar({ bairro, seoHead }: { bairro: BairroRadar; seoHead: React.ReactNode }) {
  const natureza = naturezaBairro(bairro);
  const aviso = avisoAmostraBairro(bairro);
  const slug = slugifyBairro(bairro.name);
  const tag = natureza === "observado" ? <NaturezaTag tipo="observado">Observado</NaturezaTag>
    : natureza === "aproximacao" ? <NaturezaTag tipo="aproximacao">Aproximação</NaturezaTag>
    : <NaturezaTag tipo="estimativa">Estimativa Bewild</NaturezaTag>;
  return (
    <div className="min-h-screen bg-background">
      {seoHead}
      <AppNavbar fixo={false} />
      <header className="bg-hero-gradient text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-3 flex items-center gap-1.5 text-xs text-primary-foreground/50">
            <Link to="/mercado" className="transition-colors hover:text-primary-foreground/80">Inteligência de mercado</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/ranking" className="transition-colors hover:text-primary-foreground/80">Ranking</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary-foreground/80">{bairro.name}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold md:text-3xl">{bairro.name}</h1>
            <Link to="/ranking">
              <Button variant="secondary" size="sm" className="min-h-[44px] shadow-lg"><ArrowLeft className="mr-1 h-4 w-4" /> Ranking</Button>
            </Link>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-foreground/80">
            Diária e ocupação observadas na coleta pública; a receita de referência é diária média × 30 × ocupação, antes de custos. Este bairro ainda não tem a estimativa de mercado — base 2025 (scores, preço do m², aluguel), então esta página mostra só o que a base do Radar tem.
          </p>
          <FonteBairro nome={bairro.name} inverse />
        </div>
      </header>

      <main className="container mx-auto space-y-8 px-4 py-6">
        <Carimbo
          titulo={`Base do Radar · ${bairro.name}`}
          tag={tag}
          celulas={[
            { rotulo: "Diária média", valor: formatBRL(bairro.dailyAvg) },
            { rotulo: "Ocupação", valor: formatPercent(bairro.avgOccupancy, 0) },
            { rotulo: aviso ? "Anúncios · amostra pequena" : "Anúncios", valor: bairro.activeListings != null ? formatDecimal(bairro.activeListings, 0) : "—" },
          ]}
          rodape={<FonteBairro nome={bairro.name} rodape />}
        />

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Receita mensal de referência</p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums text-foreground">{formatBRL(receitaMensalReferencia(bairro))}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatBRL(bairro.dailyAvg)} × 30 × {formatPercent(bairro.avgOccupancy, 0)}, antes de custos. Serve para comparar bairros; não é lucro nem garantia de resultado.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="min-h-[44px] font-semibold"><Link to={`/projecao?bairro=${slug}`}>Simular receita em {bairro.name}</Link></Button>
              <Button asChild variant="outline" className="min-h-[44px] font-semibold"><Link to={`/comparar?b=${slug}`}>Comparar com outros bairros</Link></Button>
              <Button asChild variant="ghost" className="min-h-[44px] font-semibold"><Link to={`/mapa?bairro=${slug}`}>Ver no mapa</Link></Button>
            </div>
          </CardContent>
        </Card>

        <FaixaQuartisBairro bairro={bairro.name} />
        <VariacaoColetaBairro bairro={bairro.name} />

        <BlocoReformaBairro bairro={bairro.name} />
        <ProximoPassoBairro bairro={bairro.name} />

        <footer className="border-t border-border/40 pb-2 pt-6 text-center">
          <p className="mx-auto max-w-2xl text-[11px] leading-relaxed text-muted-foreground/70">{FOOTER_DISCLAIMER}</p>
        </footer>
      </main>
    </div>
  );
}
