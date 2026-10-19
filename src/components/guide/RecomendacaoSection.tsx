import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import OrcamentoButton from "@/components/OrcamentoButton";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRastrearSecao } from "./SectionBlock";
import { TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import { useGuideDecision } from "@/hooks/useGuideDecision";
import { useBairrosData, fmtPct, rotuloFonteDiariaOcupacao } from "@/hooks/useIntelligenceData";
import { generateRecommendations, type Recommendation } from "@/lib/investorQuiz";
import { getBairroProfile } from "@/lib/intelligenceInsights";
import { linkProjecaoBairro } from "@/data/navegacao";
import { bairroPath, slugifyBairro } from "@/lib/seo";
import { cn } from "@/lib/utils";
import type { BairroAirbnb } from "@/types/intelligence";

/**
 * Recomendação personalizada (/ferramentas#recomendacao), no padrão "Estudo aberto":
 * os três bairros mais aderentes ao perfil numa tabela numerada, com motivos e
 * cuidados em texto. Os scores são critério interno da Bewild sobre a estimativa de
 * mercado (base 2025); diária e ocupação seguem a base do Radar.
 */
export default function RecomendacaoSection() {
  const { investorProfile, hasProfile, unitScore } = useGuideDecision();
  const { data: bairros, isLoading, isError, refetch } = useBairrosData();
  const ref = useRastrearSecao<HTMLDivElement>("recomendacao");

  const recommendations = useMemo(() => {
    if (!bairros?.length || !investorProfile) return [];
    return generateRecommendations(bairros, investorProfile).slice(0, 3);
  }, [bairros, investorProfile]);

  if (!hasProfile) {
    return (
      <div ref={ref} className="e-fina border-y py-6">
        <p className="e-apoio max-w-[620px]">Responda a autoavaliação acima para ver os três bairros mais aderentes ao seu perfil.</p>
        <Button asChild variant="outline" className="mt-4 min-h-[44px] px-5 text-[15px] font-semibold">
          <a href="#diagnostico">Ir para a autoavaliação</a>
        </Button>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <p className="e-apoio max-w-[720px]">
        Perfil <strong className="font-semibold text-foreground">{investorProfile!.name}</strong>. Pesos: retorno {Math.round(investorProfile!.weights.retorno * 100)}% · demanda {Math.round(investorProfile!.weights.demanda * 100)}% · operação {Math.round(investorProfile!.weights.operacao * 100)}% · futuro {Math.round(investorProfile!.weights.futuro * 100)}%.
      </p>

      {isLoading && <p className="e-apoio mt-6" aria-busy="true">Carregando os bairros…</p>}
      {isError && (
        <p className="e-apoio mt-6">
          A estimativa de mercado não carregou agora.{" "}
          <button type="button" onClick={() => void refetch()} className="e-link inline-flex min-h-[44px] items-center">Tentar novamente</button>
        </p>
      )}
      {!isLoading && !isError && !recommendations.length && <p className="e-apoio mt-6">Não há bairros com dados suficientes para recomendar agora.</p>}

      {recommendations.length > 0 && (
        <TabelaNumerada
          numero={1}
          className="mt-8"
          titulo={`${recommendations[0].bairro.bairro} é o bairro mais aderente ao seu perfil`}
          unidade="Pontuação personalizada (0–100, critério interno); diária e ocupação da base do Radar; rentabilidade bruta da estimativa de mercado."
          nota={<p>{rotuloFonteDiariaOcupacao(recommendations[0].bairro)}</p>}
        >
          <thead>
            <tr>
              <th scope="col" className={cn(TH, "w-10 text-right")}>Pos.</th>
              <th scope="col" className={TH}>Bairro</th>
              <th scope="col" className={cn(TH, "text-right")}>Pontos</th>
              <th scope="col" className={cn(TH, "text-right")}>Diária média</th>
              <th scope="col" className={cn(TH, "text-right")}>Ocupação</th>
              <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}>Rentab. bruta</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((rec, i) => <LinhaRecomendacao key={rec.bairro.bairro} rec={rec} rank={i + 1} bairros={bairros!} />)}
          </tbody>
        </TabelaNumerada>
      )}

      {recommendations.length > 0 && (
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {recommendations.map((rec, i) => <MotivosBairro key={rec.bairro.bairro} rec={rec} rank={i + 1} />)}
        </ol>
      )}

      {unitScore && unitScore.total > 0 && (
        <div className="mt-8 border-t border-foreground pt-4">
          <p className="e-rotulo">Perfil × unidade avaliada</p>
          <p className="e-apoio mt-1 max-w-[720px]">
            {unitScore.pct >= 80
              ? "A unidade que você avaliou tem score alto. Combinada com os bairros recomendados, o cenário é favorável para avançar."
              : unitScore.pct >= 50
              ? "A unidade tem pontos positivos, mas alguns critérios precisam de atenção. Revise os itens pendentes antes de decidir."
              : "A unidade avaliada tem gaps importantes. Considere buscar uma unidade com melhor aderência ao perfil de short stay."}
          </p>
          <p className="e-legenda mt-1 tabular-nums">Score da unidade: {unitScore.total}/{unitScore.max} (critério interno)</p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button asChild variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold">
          <Link to="/mercado">Ver o mercado completo</Link>
        </Button>
        {recommendations[0] && (
          <Button asChild variant="outline" className="min-h-[44px] px-5 text-[15px] font-semibold">
            <Link to={linkProjecaoBairro(slugifyBairro(recommendations[0].bairro.bairro))}>Simular {recommendations[0].bairro.bairro}</Link>
          </Button>
        )}
        <OrcamentoButton local="recomendacao" className="min-h-[44px] px-5 text-[15px] font-semibold" />
      </div>
    </div>
  );
}

function LinhaRecomendacao({ rec, rank, bairros }: { rec: Recommendation; rank: number; bairros: BairroAirbnb[] }) {
  const perfil = getBairroProfile(rec.bairro, bairros);
  return (
    <tr>
      <td className={cn(TD_NUM, "text-tinta-70")}>{rank}</td>
      <td className={TD}>
        <Link to={bairroPath(rec.bairro.bairro)} className="font-semibold underline-offset-4 hover:underline">{rec.bairro.bairro}</Link>
        <span className="e-legenda block">{perfil.label} · nota {rec.grade}</span>
      </td>
      <td className={cn(TD_NUM, "font-semibold")}>{formatDecimal(rec.personalizedScore, 0)}</td>
      <td className={TD_NUM}>{formatBRL(Number(rec.bairro.adr_medio_studio))}</td>
      <td className={TD_NUM}>{fmtPct(rec.bairro.ocupacao_media_studio)}</td>
      <td className={cn(TD_NUM, "hidden sm:table-cell")}>{fmtPct(rec.bairro.yield_bruto_airbnb)}</td>
    </tr>
  );
}

function MotivosBairro({ rec, rank }: { rec: Recommendation; rank: number }) {
  return (
    <li className="min-w-0 border-t border-foreground pt-3">
      <p className="e-rotulo"><span className="tabular-nums">{rank}</span> · {rec.bairro.bairro}</p>
      {rec.reasons.length > 0 && (
        <ul className="mt-2 space-y-1">
          {rec.reasons.slice(0, 3).map((r) => <li key={r} className="e-apoio">{r}</li>)}
        </ul>
      )}
      {rec.cautions.length > 0 && (
        <ul className="mt-3 space-y-1">
          {rec.cautions.map((c) => <li key={c} className="text-[15px] leading-[22px] text-magenta-700">Atenção: {c}</li>)}
        </ul>
      )}
    </li>
  );
}
