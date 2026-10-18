import { resumirColetasGuestFavorites, type ObservacaoGuestFavorites } from "@/lib/resumoColetasGuestFavorites";

/** Sugestão até o último mês encerrado, não o período publicado pela fonte. */
export function planejarGuestFavorites(linhas: ObservacaoGuestFavorites[], bairros: string[], hoje: string) {
  const data = new Date(`${hoje}T12:00:00Z`);
  const fim = new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), 0)).toISOString().slice(0, 10);
  return resumirColetasGuestFavorites(linhas, bairros).cobertura.filter((r) => r.status !== "ativa")
    .map((r) => ({ ...r, periodoInicio: `${fim.slice(0, 4)}-01-01`, periodoFim: fim }));
}
