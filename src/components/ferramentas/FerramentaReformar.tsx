import { useState } from "react";
import OrcamentoButton from "@/components/OrcamentoButton";
import NovaAba from "@/components/NovaAba";
import Segmentado from "@/components/radar/Segmentado";
import { Tag } from "@/components/estudo/Natureza";
import { TabelaNumerada, TD, TD_NUM, TH } from "@/components/estudo/Figura";
import BarraEmpilhada from "@/components/estudo/graficos/BarraEmpilhada";
import CampoNumero from "@/components/ferramentas/CampoNumero";
import {
  AREA_MEDIANA_M2, CONTRATOS_ANALISADOS, CUSTO_M2_MEDIANO, CUSTO_M2_P25, CUSTO_M2_P75, ESCOPO_REFORMA_COMPLETA,
  ESTUDO_REFORMA_DATA, ESTUDO_REFORMA_URL, ORCAMENTO_MEDIANO, ORCAMENTO_MINIMO_BASE,
} from "@/data/provasBewild";
import { AREA_MAX_M2, AREA_MIN_M2, estimativaReformaCompleta, limitarArea, listaPt } from "@/lib/estudoFerramentas";
import { formatBRL, formatDecimal } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

/**
 * Ferramenta 02 · Vou reformar (/ferramentas#reformar): área (m²) e sacada → faixa de
 * reforma completa (P25, mediana e P75 do R$/m² do estudo Bewild × área, com o piso de
 * R$ 55 mil) e prazo em contrato, com a marcenaria em paralelo. É uma estimativa a
 * partir de 188 contratos, não um orçamento.
 */
export default function FerramentaReformar() {
  const [areaDigitada, setAreaDigitada] = useState<number | null>(AREA_MEDIANA_M2);
  const [sacada, setSacada] = useState<"nao" | "sim">("nao");
  const area = limitarArea(areaDigitada);
  const e = area != null ? estimativaReformaCompleta(area, sacada === "sim") : null;
  const ajustada = area != null && areaDigitada != null && Math.abs(area - areaDigitada) > 0.05;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
      <fieldset className="min-w-0 space-y-6 border-0 p-0">
        <legend className="sr-only">Dados do imóvel</legend>
        <CampoNumero
          rotulo="Área útil (m²)"
          valor={areaDigitada}
          onChange={setAreaDigitada}
          unidade="m²"
          casas={1}
          ajuda={ajustada ? `O estudo cobre de ${AREA_MIN_M2} a ${AREA_MAX_M2} m²: usamos ${formatDecimal(area!, 1)} m².` : `Área mediana do estudo: ${formatDecimal(AREA_MEDIANA_M2, 1)} m².`}
        />
        <div>
          <p className="e-rotulo mb-1.5" id="reforma-sacada">Sacada integrada à sala</p>
          <Segmentado<"nao" | "sim">
            rotulo="Sacada integrada à sala"
            valor={sacada}
            opcoes={[{ valor: "nao", rotulo: "Não" }, { valor: "sim", rotulo: "Sim" }]}
            onChange={setSacada}
            className="w-full max-w-[220px]"
          />
          <p className="e-legenda mt-1">A sacada só muda o prazo em contrato.</p>
        </div>
        <div>
          <p className="e-rotulo">Escopo da reforma completa</p>
          <p className="e-apoio mt-1">{capitalizar(listaPt([...ESCOPO_REFORMA_COMPLETA]))}.</p>
        </div>
      </fieldset>

      <div className="min-w-0" aria-live="polite">
        {!e ? (
          <p className="e-apoio e-fina border-y py-6">Informe a área útil em m² para ver a estimativa.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="e-rotulo">Estimativa para {formatDecimal(area!, 1)} m² · reforma completa</p>
              <Tag tipo="hipotese" titulo="Estimativa a partir do estudo Bewild, não é orçamento">Estimativa, não orçamento</Tag>
            </div>
            <p className="e-numero mt-2">{formatBRL(e.mediana.valor)}</p>
            <p className="e-apoio mt-1">
              Metade dos contratos do estudo ficaria entre <span className="tabular-nums">{formatBRL(e.p25.valor)}</span> e <span className="tabular-nums">{formatBRL(e.p75.valor)}</span> nessa área.
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-foreground pt-4 sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="e-rotulo">Prazo em contrato</dt>
                <dd className="m-0">
                  <span className="e-numero-sm mt-1 block">{e.prazoDiasUteis} dias úteis</span>
                  <span className="e-legenda mt-1 block">{e.acimaDe40 ? "acima de 40 m²: o maior prazo da tabela" : area! <= 30 ? `até 30 m², ${sacada === "sim" ? "com" : "sem"} sacada` : `de 31 a 40 m², ${sacada === "sim" ? "com" : "sem"} sacada`}</span>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="e-rotulo">Marcenaria sob medida</dt>
                <dd className="m-0">
                  <span className="e-numero-sm mt-1 block">{e.marcenaria.total} dias úteis</span>
                  <span className="e-legenda mt-1 block">{e.marcenaria.fabrica} de fábrica + {e.marcenaria.montagem} de montagem, em paralelo com a obra</span>
                </dd>
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <dt className="e-rotulo">Piso do estudo</dt>
                <dd className="m-0">
                  <span className="e-numero-sm mt-1 block">{formatBRL(ORCAMENTO_MINIMO_BASE)}</span>
                  <span className="e-legenda mt-1 block">nenhum contrato do estudo ficou abaixo</span>
                </dd>
              </div>
            </dl>

            {/* Fig.: a obra e a marcenaria no mesmo eixo de dias úteis */}
            <figure className="m-0 mt-8">
              <figcaption className="mb-3">
                <span className="e-rotulo block">Fig. 1</span>
                <span className="e-h3 mt-1 block">A marcenaria corre dentro do prazo da obra</span>
                <span className="e-legenda mt-1 block">Dias úteis desde o início, conforme o contrato.</span>
              </figcaption>
              <div className="space-y-2">
                <LinhaPrazo rotulo="Obra (contrato)" dias={e.prazoDiasUteis} maximo={e.prazoDiasUteis} />
                <BarraEmpilhada
                  segmentos={[
                    { chave: "fabrica", rotulo: "Marcenaria: fábrica", valor: e.marcenaria.fabrica, tom: "--neutro-600" },
                    { chave: "montagem", rotulo: "Marcenaria: montagem", valor: e.marcenaria.montagem, tom: "--neutro-300" },
                  ]}
                  total={e.prazoDiasUteis}
                  formatar={(v) => `${formatDecimal(v, 0)} d`}
                  rotuloAcessivel={`Obra de ${e.prazoDiasUteis} dias úteis; marcenaria de ${e.marcenaria.fabrica} dias de fábrica e ${e.marcenaria.montagem} de montagem, em paralelo.`}
                  alturaBarra={14}
                  marcaReferencia={{ valor: e.prazoDiasUteis, rotulo: "fim da obra" }}
                  legenda={false}
                />
              </div>
              <p className="e-legenda mt-2">
                <span className="mr-3 inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 bg-ciano" />obra</span>
                <span className="mr-3 inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 bg-neutro-600" />marcenaria: fábrica</span>
                <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="inline-block h-3 w-3 bg-neutro-300 outline outline-1 outline-foreground/55" />montagem</span>
              </p>
            </figure>

            <TabelaNumerada
              numero={1}
              className="mt-10"
              titulo="Como a faixa é calculada"
              unidade={`Área × custo por m² do estudo, arredondado a R$ 500; valores abaixo de ${formatBRL(ORCAMENTO_MINIMO_BASE)} sobem para o piso.`}
              nota={
                <>
                  Fonte: estudo Bewild de {ESTUDO_REFORMA_DATA}, {CONTRATOS_ANALISADOS} contratos de reforma completa em São Paulo (mediana de {formatBRL(ORCAMENTO_MEDIANO)} para {formatDecimal(AREA_MEDIANA_M2, 1)} m²).{" "}
                  <a href={ESTUDO_REFORMA_URL} target="_blank" rel="noopener noreferrer" className="e-link">Ver o estudo<NovaAba /></a>
                  {e.algumNoPiso && <span className="e-amostra mt-1 block not-italic">Nessa área a conta fica abaixo de {formatBRL(ORCAMENTO_MINIMO_BASE)} em pelo menos um ponto da faixa: nenhum contrato do estudo ficou abaixo de R$ 55 mil, então o valor sobe para o piso.</span>}
                </>
              }
            >
              <thead>
                <tr>
                  <th scope="col" className={TH}>Ponto da faixa</th>
                  <th scope="col" className={cn(TH, "text-right")}>R$/m²</th>
                  <th scope="col" className={cn(TH, "hidden text-right sm:table-cell")}>Área × R$/m²</th>
                  <th scope="col" className={cn(TH, "text-right")}>Estimativa</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rotulo: "P25 (25% mais baratos)", m2: CUSTO_M2_P25, r: e.p25 },
                  { rotulo: "Mediana", m2: CUSTO_M2_MEDIANO, r: e.mediana },
                  { rotulo: "P75 (25% mais caros)", m2: CUSTO_M2_P75, r: e.p75 },
                ].map((l) => (
                  <tr key={l.rotulo}>
                    <th scope="row" className={cn(TD, "font-normal")}>{l.rotulo}</th>
                    <td className={cn(TD_NUM, "whitespace-nowrap")}>{formatBRL(l.m2)}</td>
                    <td className={cn(TD_NUM, "hidden whitespace-nowrap text-tinta-78 sm:table-cell")}>{formatBRL(area! * l.m2)}</td>
                    <td className={cn(TD_NUM, "whitespace-nowrap font-semibold")}>
                      {formatBRL(l.r.valor)}
                      {l.r.noPiso && <span className="e-amostra block text-[13px] font-normal">no piso</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TabelaNumerada>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <OrcamentoButton local="projecao" rotulo="Solicitar orçamento de reforma" className="h-auto min-h-[44px] px-5 py-2 text-[15px] font-semibold sm:shrink-0" />
              <p className="e-legenda max-w-[380px]">O orçamento parte do projeto do seu imóvel; a faixa acima só mostra onde os contratos do estudo ficaram.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LinhaPrazo({ rotulo, dias, maximo }: { rotulo: string; dias: number; maximo: number }) {
  return (
    <div>
      <p className="e-legenda mb-1">{rotulo}: <span className="tabular-nums">{dias} dias úteis</span></p>
      <div aria-hidden="true" className="h-3.5 bg-ciano outline outline-1 outline-foreground/55" style={{ width: `${(dias / maximo) * 100}%` }} />
    </div>
  );
}

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
