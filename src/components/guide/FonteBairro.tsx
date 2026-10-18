import { useMemo } from "react";
import { avisoAmostra, getBairroCurado } from "@/data/bairrosCurados";
import FonteLink from "@/components/guide/FonteLink";
import NaturezaTag from "@/components/radar/NaturezaTag";
import { alertasFonteRadar, bairrosReserva, rotuloReferenciaBewild, rotuloFonteRadar, useRadarBase } from "@/lib/radarBase";
import { useBairroData } from "@/hooks/useBairroData";
import { ajusteManual, fonteCurtaBairro } from "@/lib/radarUi";
import { cn } from "@/lib/utils";

const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/**
 * Fonte, período, coleta, n= e selo de confiança calculado no banco (radar_bairro_atual).
 * Estimativas e aproximações usam a legenda do Radar (◌ Estimativa Bewild / ◌ Aproximação).
 * `semNatureza` omite essa etiqueta quando a tela já mostra a natureza do dado ao lado;
 * `carimbo` desenha a fonte como etiqueta cinza (painel do mapa, comparação) e deixa o aviso
 * de amostra para a tela. Na aproximação, a estimativa Bewild anterior aparece só como referência.
 * `rodape` desenha a fonte como rodapé do `Carimbo` (painel do mapa): fonte · período · coleta · confiança.
 */
export default function FonteBairro({
  nome,
  inverse = false,
  semNatureza = false,
  carimbo = false,
  rodape = false,
}: {
  nome: string;
  inverse?: boolean;
  semNatureza?: boolean;
  carimbo?: boolean;
  rodape?: boolean;
}) {
  const { data } = useRadarBase();
  // Números exibidos (com os ajustes do admin): um ajuste manual troca a fonte do carimbo.
  const { bairros: exibidos } = useBairroData();
  const bairro = useMemo(() => (data?.bairros ?? bairrosReserva()).find((b) => norm(b.name) === norm(nome)), [data, nome]);
  const exibido = useMemo(() => exibidos.find((b) => norm(b.name) === norm(nome)), [exibidos, nome]);
  if (!bairro) return null;
  const ajustado = exibido ? ajusteManual(exibido) : false;
  const base = getBairroCurado(nome);
  const alertas = alertasFonteRadar(bairro);
  // Aproximação (Itaim Bibi) tem fonte pública: a do distrito. Só a estimativa pura fica sem fonte.
  const aproximacao = bairro.ocupacaoFonte === "aproximacao" && !ajustado;
  const semFontePublica = alertas.estimativa && !aproximacao;
  const aviso = alertas.amostraPequena ? null : bairro.amostraN != null && bairro.amostraN < 200
    ? `amostra pequena (${bairro.amostraN} anúncios)`
    : base ? avisoAmostra(base) : null;
  // Nas telas que já mostram a etiqueta de natureza, a estimativa diz o que é: sem fonte pública por trás do número.
  const titulo = ajustado
    ? "Ajuste manual da Bewild"
    : (carimbo || semNatureza) && semFontePublica ? "Sem fonte pública atualizada" : rotuloFonteRadar(bairro);
  const url = ajustado ? exibido?.sourceUrl ?? null : bairro.sourceUrl;
  const dataColeta = bairro.coletadoEm ? bairro.coletadoEm.slice(0, 10).split("-").reverse().join("/") : null;
  if (rodape) {
    // A natureza (tag) e o tamanho da amostra ficam no próprio carimbo; aqui só a origem do número.
    const confianca = !ajustado && !semFontePublica && bairro.confianca ? ` · confiança ${bairro.confianca === "media" ? "média" : bairro.confianca}` : "";
    const texto = ajustado ? "Ajuste manual da Bewild" : `${fonteCurtaBairro(bairro)}${confianca}`;
    const linha = "flex min-h-[44px] w-full items-center px-3.5 py-1.5 text-xs text-foreground-medium";
    return (
      <div>
        {alertas.desatualizado && !ajustado && dataColeta && (
          <p className="border-b border-border px-3.5 py-2 text-xs font-semibold text-estimate-text">Dado desatualizado · coleta {dataColeta}</p>
        )}
        {url ? <FonteLink fonte={{ title: texto, url }} className={cn(linha, "no-underline hover:underline")} /> : <p className={linha}>{texto}</p>}
        {aproximacao && bairro.referenciaBewild && (
          <p className="border-t border-border px-3.5 py-2 text-xs text-muted-foreground">{rotuloReferenciaBewild(bairro.referenciaBewild)}</p>
        )}
      </div>
    );
  }
  const selo = inverse
    ? "inline-block rounded-[4px] border border-dashed border-primary-foreground px-2 py-[3px] font-semibold"
    : "";
  return <span className={inverse ? "block text-xs text-primary-foreground [&_a]:text-primary-foreground" : "block text-xs"}>
    {(alertas.estimativa || ajustado) && !semNatureza && (
      inverse
        ? <span className={`mr-1 ${selo}`}>{aproximacao ? "Aproximação" : "Estimativa Bewild"}</span>
        : <NaturezaTag tipo={aproximacao ? "aproximacao" : "estimativa"} className="mr-1 align-middle" />
    )}
    {alertas.amostraPequena && !carimbo && (
      <span className={inverse ? `mb-1 block w-fit ${selo}` : "mb-1 block w-fit rounded-[4px] bg-estimate-light px-2 py-[3px] font-semibold text-estimate-text"}>
        amostra pequena · {bairro.amostraN} anúncios
      </span>
    )}
    {alertas.desatualizado && !ajustado && dataColeta && (
      <span className="mb-1 block font-semibold">
        dado desatualizado · coleta {dataColeta}
      </span>
    )}
    {url
      ? <FonteLink fonte={{ title: titulo, url }} carimbo={carimbo && !inverse} />
      : carimbo && !inverse
        ? <span className="inline-flex min-h-[28px] items-center"><span className="rounded-[4px] bg-background px-2 py-[3px] text-foreground-medium">{titulo}</span></span>
        : <span>{titulo}</span>}
    {aviso && !carimbo && <span className="block font-medium">{aviso}</span>}
    {aproximacao && bairro.referenciaBewild && <span className="block opacity-80">{rotuloReferenciaBewild(bairro.referenciaBewild)}</span>}
  </span>;
}
