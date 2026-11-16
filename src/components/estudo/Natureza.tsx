import type { BairroCurado } from "@/data/bairrosCurados";
import { ajusteManual, naturezaBairro, type BairroBase } from "@/lib/radarUi";
import { avisoAmostraBairro } from "@/lib/radarUi";
import { temAmostraPequena } from "@/lib/estudo";
import { cn } from "@/lib/utils";

/**
 * Natureza do dado, sempre identificada (princípio 4): tag "Observado" (ciano),
 * "Aproximação" (neutra, tracejada), "Ajuste manual", "Hipótese" (pontilhada) e
 * "Calculado" (conta do Radar sobre dado de fonte, como o efeito de evento).
 * "Observado" quer dizer publicado pela fonte para o próprio bairro, não transação verificada.
 * O significado não depende só da cor: a borda muda junto e o texto diz.
 */
export type TipoTag = "observado" | "aproximacao" | "ajuste" | "estimativa" | "hipotese" | "calculado";

const TEXTO: Record<TipoTag, string> = {
  observado: "Observado",
  aproximacao: "Aproximação",
  ajuste: "Ajuste manual",
  estimativa: "Estimativa Bewild",
  hipotese: "Hipótese",
  calculado: "Calculado",
};

const CLASSE: Record<TipoTag, string> = {
  observado: "e-tag-observado",
  aproximacao: "e-tag-aproximacao",
  ajuste: "e-tag-ajuste",
  estimativa: "e-tag-aproximacao",
  hipotese: "e-tag-hipotese",
  // Conta do Radar sobre dado de fonte: mesma borda cheia e neutra do ajuste, sem o ciano do dado da fonte.
  calculado: "e-tag-ajuste",
};

export function Tag({ tipo, children, className, titulo }: { tipo: TipoTag; children?: string; className?: string; titulo?: string }) {
  return <span className={cn("e-tag", CLASSE[tipo], className)} title={titulo}>{children ?? TEXTO[tipo]}</span>;
}

/** Tipo de tag de um bairro da base. */
export function tipoTagBairro(b: BairroBase): TipoTag {
  if (ajusteManual(b)) return "ajuste";
  const n = naturezaBairro(b);
  return n === "observado" ? "observado" : n === "aproximacao" ? "aproximacao" : "estimativa";
}

const TITULO: Record<TipoTag, string> = {
  observado: "Publicado pela fonte para o próprio bairro (GuestFavorites); não é transação verificada",
  aproximacao: "Aproximação pelo Itaim Bibi: distrito que inclui a Vila Olímpia e parte do Brooklin, sem dado público por bairro",
  ajuste: "Ajuste manual da Bewild sobre a base",
  estimativa: "Estimativa Bewild, sem fonte pública",
  hipotese: "Hipótese editável, não é dado de mercado",
  calculado: "Calculado pelo Radar sobre dado de fonte",
};

export function TagBairro({ b, className }: { b: BairroBase; className?: string }) {
  const tipo = tipoTagBairro(b);
  return <Tag tipo={tipo} className={className} titulo={TITULO[tipo]} />;
}

/** Nota em itálico magenta para amostra pequena (menos de 200 anúncios). Nada quando a amostra é suficiente. */
export function NotaAmostra({ b, className, curta = false }: { b: BairroCurado; className?: string; curta?: boolean }) {
  if (!temAmostraPequena(b)) return null;
  const texto = avisoAmostraBairro(b);
  return <span className={cn("e-amostra text-[13px] leading-5", className)}>{curta ? "amostra pequena" : `${texto?.charAt(0).toUpperCase()}${texto?.slice(1)}: leia com cautela.`}</span>;
}

/** Linha de explicação das aproximações, para legendas de figura e tabela. */
export const TEXTO_APROXIMACAO =
  "Brooklin e Vila Olímpia usam os números do distrito Itaim Bibi (aproximação, desenho tracejado): não há dado público por bairro.";
