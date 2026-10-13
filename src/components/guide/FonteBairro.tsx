import { useMemo } from "react";
import { avisoAmostra, getBairroCurado } from "@/data/bairrosCurados";
import FonteLink from "@/components/guide/FonteLink";
import { bairrosReserva, rotuloFonteRadar, useRadarBase } from "@/lib/radarBase";

const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** Fonte, período, coleta, n= e selo de confiança calculado no banco (radar_bairro_atual). */
export default function FonteBairro({ nome, inverse = false }: { nome: string; inverse?: boolean }) {
  const { data } = useRadarBase();
  const bairro = useMemo(() => (data?.bairros ?? bairrosReserva()).find((b) => norm(b.name) === norm(nome)), [data, nome]);
  if (!bairro) return null;
  const base = getBairroCurado(nome);
  const aviso = bairro.amostraN != null && bairro.amostraN < 200
    ? `amostra pequena (${bairro.amostraN} anúncios)`
    : base ? avisoAmostra(base) : null;
  const titulo = rotuloFonteRadar(bairro);
  return <span className={inverse ? "block text-xs text-primary-foreground [&_a]:text-primary-foreground" : "block text-xs"}>
    {bairro.estimativa && (
      <span className={inverse ? "mr-1 inline-block rounded border border-primary-foreground px-1.5 py-0.5 font-semibold uppercase tracking-wide" : "mr-1 inline-block rounded border border-warning bg-warning/10 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-foreground"}>
        estimativa
      </span>
    )}
    {bairro.sourceUrl ? <FonteLink fonte={{ title: titulo, url: bairro.sourceUrl }} /> : <span>{titulo}</span>}
    {aviso && <span className="block font-medium">{aviso}</span>}
  </span>;
}
