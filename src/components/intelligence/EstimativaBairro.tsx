import { TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import { Tag } from "@/components/estudo/Natureza";
import { rotuloEstimativa, fmtPct } from "@/hooks/useIntelligenceData";
import {
  getBairroProfile, buildHeaderNarrative, buildLeigosResumo, buildExplicaResultado, buildPontosAtencao,
  buildShortVsLongNarrative, buildInvestorProfile, SECTION_MICROCOPY,
} from "@/lib/intelligenceInsights";
import { buildBairroStoryBlocks } from "@/lib/storytelling";
import { calculateInvestmentScore, calculateTrueYield, PILLARS } from "@/lib/investmentScore";
import { FOOTER_DISCLAIMER, SCORES_DISCLAIMER } from "@/lib/uiHelpers";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";
import type { BairroAirbnb } from "@/types/intelligence";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
/** Fatores mensais fixos do modelo ilustrativo de sazonalidade (hipótese, não série observada). */
const SAZONAL_DIARIA = [0.92, 0.88, 0.95, 0.97, 0.93, 0.90, 1.02, 1.00, 1.05, 1.08, 1.12, 1.18];
const SAZONAL_OCUPACAO = [0.95, 0.90, 0.93, 0.96, 0.92, 0.88, 1.04, 1.02, 1.06, 1.10, 1.12, 1.14];

function Lista({ titulo, itens }: { titulo: string; itens: string[] }) {
  if (!itens.length) return null;
  return (
    <div className="min-w-0">
      <h4 className="e-rotulo">{titulo}</h4>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 marker:text-tinta-70">
        {itens.map((t) => <li key={t} className="e-apoio">{t}</li>)}
      </ul>
    </div>
  );
}

function TabelaMetricas({ numero, titulo, linhas }: { numero: number; titulo: string; linhas: [string, string][] }) {
  return (
    <TabelaNumerada numero={numero} titulo={titulo} unidade="Estimativa de mercado — base 2025">
      <tbody>
        {linhas.map(([rotulo, valor]) => (
          <tr key={rotulo}>
            <th scope="row" className={cn(TD, "font-normal text-tinta-78")}>{rotulo}</th>
            <td className={cn(TD_NUM, "font-semibold")}>{valor}</td>
          </tr>
        ))}
      </tbody>
    </TabelaNumerada>
  );
}

/**
 * Leitura da estimativa de mercado — base 2025 (bairro_airbnb_sp) de um bairro: os
 * critérios internos da Bewild (score, perfil, pilares), a leitura consultiva e as
 * métricas brutas (preço do m², aluguel, liquidez, risco). É uma base à parte da coleta
 * pública: tudo aqui fica rotulado e recolhido abaixo dos números observados.
 * `numeroInicial` continua a numeração das tabelas da página.
 */
export default function EstimativaBairro({ b, todos, numeroInicial = 2 }: { b: BairroAirbnb; todos: BairroAirbnb[]; numeroInicial?: number }) {
  const perfil = getBairroProfile(b, todos);
  const score = calculateInvestmentScore(b, todos);
  const trueYield = calculateTrueYield(b);
  const historias = buildBairroStoryBlocks(b, todos);
  const precoEstudio = Number(b.preco_m2_residencial_medio) * Number(b.area_media_estudio);
  const adr = Number(b.adr_medio_studio), occ = Number(b.ocupacao_media_studio);
  let n = numeroInicial;

  return (
    <div className="space-y-12">
      <div>
        <p className="flex flex-wrap items-center gap-2">
          <Tag tipo="estimativa">Critério interno</Tag>
          <span className="e-legenda">{rotuloEstimativa(b)}</span>
        </p>
        <dl className="mt-6 grid gap-8 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <div>
            <dt className="e-rotulo">Score de investimento (0–100)</dt>
            <dd className="m-0">
              <span className="e-numero mt-1 block">{formatDecimal(score.score, 1)}</span>
              <span className="e-legenda block">Nota {score.grade} · {score.gradeLabel} · perfil {perfil.label.toLowerCase()}</span>
            </dd>
          </div>
          <div>
            <dt className="e-rotulo">Leitura</dt>
            <dd className="m-0 mt-1">
              <p className="e-corpo">{buildHeaderNarrative(b, perfil)}</p>
              <p className="e-apoio mt-2">{perfil.description} {perfil.interpretation}</p>
            </dd>
          </div>
        </dl>
      </div>

      <TabelaNumerada numero={n++} titulo="Pilares do score" unidade="Nota de 0 a 100 relativa aos bairros da estimativa; peso de cada pilar no score. Critério interno, não estatística de mercado.">
        <thead>
          <tr>
            <th scope="col" className={TH}>Pilar</th>
            <th scope="col" className={cn(TH, "text-right")}>Peso (%)</th>
            <th scope="col" className={cn(TH, "text-right")}>Nota</th>
          </tr>
        </thead>
        <tbody>
          {PILLARS.map((p, i) => (
            <tr key={p.key}>
              <td className={TD}>{p.label}<span className="e-legenda block">{p.friendlyName}</span></td>
              <td className={TD_NUM}>{formatDecimal(p.weight * 100, 0)}</td>
              <td className={cn(TD_NUM, "font-semibold")}>{formatDecimal(score.pillars[i].normalized, 0)}</td>
            </tr>
          ))}
        </tbody>
      </TabelaNumerada>
      <p className="e-legenda -mt-8">{score.narrative} {SCORES_DISCLAIMER}</p>

      <div className="grid gap-10 md:grid-cols-2">
        <Lista titulo="Em linguagem simples" itens={buildLeigosResumo(b, perfil)} />
        <Lista titulo="O que explica esse resultado" itens={buildExplicaResultado(b)} />
        <Lista titulo="Pontos de atenção" itens={buildPontosAtencao(b, todos)} />
        <Lista titulo={`Para quem ${b.bairro} faz sentido`} itens={buildInvestorProfile(perfil)} />
      </div>

      {historias.length > 0 && (
        <div>
          <h4 className="e-rotulo">Leitura comparativa</h4>
          <dl className="mt-3 grid gap-6 md:grid-cols-2">
            {historias.map((h) => (
              <div key={h.title} className="e-fina min-w-0 border-t pt-3">
                <dt className="text-[15px] font-semibold">{h.title}</dt>
                <dd className="e-apoio m-0 mt-1">{h.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <TabelaMetricas numero={n++} titulo="Short stay e aluguel tradicional" linhas={[
            ["Rentabilidade bruta anual no Airbnb", fmtPct(b.yield_bruto_airbnb)],
            ["Rentabilidade bruta anual no aluguel", fmtPct(b.yield_bruto_long_term)],
            ["Diferença entre as duas", fmtPct(b.delta_yield)],
            ["Conta direta: diária × ocupação × 365 ÷ preço do studio", `${formatDecimal(trueYield.trueYield * 100, 2)}%`],
          ]} />
          <p className="e-legenda mt-3">Rentabilidade bruta anual é o que a literatura chama de yield bruto; a diferença, de delta yield. {buildShortVsLongNarrative(b)} {trueYield.comparison} {SECTION_MICROCOPY.true_yield?.message}</p>
        </div>
        <TabelaMetricas numero={n++} titulo="Preço e liquidez do imóvel" linhas={[
          ["Preço do m² residencial", formatBRL(Number(b.preco_m2_residencial_medio))],
          ["Preço estimado do studio", formatBRL(precoEstudio)],
          ["Aluguel tradicional por mês", formatBRL(Number(b.aluguel_mensal_long_term_medio))],
          ["Dias médios de venda", `${formatDecimal(Number(b.dias_medio_venda_imovel), 0)} dias`],
          ["Transações imobiliárias por ano", formatDecimal(Number(b.numero_transacoes_imobiliarias_ano), 0)],
        ]} />
        <TabelaMetricas numero={n++} titulo="Anúncios e operação" linhas={[
          ["Anúncios no total", formatDecimal(Number(b.n_listings_total), 0)],
          ["Studios e 1 quarto", formatDecimal(Number(b.n_listings_studio_1q), 0)],
          ["Studios e 1 quarto (%)", fmtPct(b.pct_studio_1q)],
          ["Estadia média", `${formatDecimal(Number(b.estadia_media_noites), 1)} noites`],
          ["Reservas de 30 dias ou mais", fmtPct(b.porcentagem_reservas_30d_plus)],
          ["Receita anual média (estimativa)", formatBRL(Number(b.receita_anual_media_studio))],
        ]} />
        <TabelaMetricas numero={n++} titulo="Reputação e risco" linhas={[
          ["Avaliação média", formatDecimal(Number(b.rating_medio), 2)],
          ["Superhosts", fmtPct(b.percentual_superhost)],
          ["Avaliações por anúncio", formatDecimal(Number(b.media_reviews_por_listing), 1)],
          ["Índice de criminalidade", formatDecimal(Number(b.indice_criminalidade), 2)],
          ["Saturação", fmtPct(b.grau_saturacao_index)],
          ["Risco regulatório", fmtPct(b.risco_regulatorio)],
          ["Risco de condomínio", fmtPct(b.risco_condominio)],
        ]} />
      </div>

      <div>
        <TabelaNumerada
          numero={n++}
          titulo="Sazonalidade ilustrativa: modelo, não dado observado"
          unidade="Fatores mensais fixos aplicados à diária e à ocupação do bairro. Não há série mensal observada."
        >
          <thead>
            <tr>
              <th scope="col" className={TH}>Mês</th>
              <th scope="col" className={cn(TH, "text-right")}>Diária (R$)</th>
              <th scope="col" className={cn(TH, "text-right")}>Ocupação (%)</th>
              <th scope="col" className={cn(TH, "text-right")}>R$/mês</th>
            </tr>
          </thead>
          <tbody>
            {MESES.map((m, i) => {
              const d = Math.round(adr * SAZONAL_DIARIA[i]);
              const o = occ * SAZONAL_OCUPACAO[i];
              return (
                <tr key={m}>
                  <td className={TD}>{m}</td>
                  <td className={TD_NUM}>{formatBRL(d)}</td>
                  <td className={TD_NUM}>{formatDecimal(o * 100, 1)}</td>
                  <td className={TD_NUM}>{formatBRL(adr * SAZONAL_DIARIA[i] * 30 * o)}</td>
                </tr>
              );
            })}
          </tbody>
        </TabelaNumerada>
        <p className="mt-3"><Tag tipo="hipotese" /></p>
      </div>

      <p className="e-legenda max-w-[720px]">{FOOTER_DISCLAIMER}</p>
    </div>
  );
}
