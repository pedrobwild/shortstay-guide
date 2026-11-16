import { supabase } from "@/integrations/supabase/client";

/**
 * Eventos e efeito medido na diária por bairro (decisão do Pedro, 16/11/2026).
 * Regras puras da tela /eventos e as duas leituras públicas: `radar_eventos`
 * (só `publicado`) e `radar_evento_efeitos` (só linhas publicáveis de evento publicado).
 * O efeito vem de uma edição passada do evento; nunca é previsão nem promessa.
 */
export type CategoriaEvento = "festival" | "esporte" | "feira" | "show_estadio" | "feriado" | "cultura";

export interface EventoRadar {
  id: string;
  nome: string;
  categoria: CategoriaEvento;
  local: string | null;
  inicio: string;
  fim: string;
  data_confirmada: boolean;
  fonte_titulo: string | null;
  fonte_url: string | null;
}

export interface EfeitoEvento {
  evento_id: string;
  bairro: string;
  efeito_diaria_pct: number;
  p_placebo: number | null;
  noites: number;
}

/** Efeito "medido": menos de 1% das janelas comuns do bairro têm variação igual ou maior. */
export const P_EFEITO_MEDIDO = 0.01;
/** Sinal mais fraco: menos de 5%. Aparece em texto, fora das contas. */
export const P_SINAL_FRACO = 0.05;
/** Recorte exibido: anúncios de até 1 quarto, o mais próximo do studio. */
export const RECORTE_EVENTOS = "ate_1_quarto";

export const ROTULO_CATEGORIA: Record<CategoriaEvento, string> = {
  festival: "Festival",
  esporte: "Esporte",
  feira: "Feira",
  show_estadio: "Show de estádio",
  feriado: "Feriado",
  cultura: "Cultura",
};

const dia = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Noites entre o início e o fim, contando as duas pontas (19 a 21 = 3 noites). */
export function noitesDoEvento(e: Pick<EventoRadar, "inicio" | "fim">): number {
  return Math.max(1, Math.round((dia(e.fim).getTime() - dia(e.inicio).getTime()) / 86_400_000) + 1);
}

const dd = (iso: string) => iso.slice(8, 10);
const mm = (iso: string) => iso.slice(5, 7);
const aaaa = (iso: string) => iso.slice(0, 4);

/** "19 a 21/03/2027", "28/02 a 02/03/2027" ou "20/03/2027". */
export function periodoDoEvento(e: Pick<EventoRadar, "inicio" | "fim">): string {
  if (e.inicio === e.fim) return `${dd(e.inicio)}/${mm(e.inicio)}/${aaaa(e.inicio)}`;
  if (mm(e.inicio) === mm(e.fim) && aaaa(e.inicio) === aaaa(e.fim)) return `${dd(e.inicio)} a ${dd(e.fim)}/${mm(e.fim)}/${aaaa(e.fim)}`;
  return `${dd(e.inicio)}/${mm(e.inicio)} a ${dd(e.fim)}/${mm(e.fim)}/${aaaa(e.fim)}`;
}

/** Eventos que ainda não terminaram em `hoje` (AAAA-MM-DD), em ordem de data. */
export function eventosFuturos(eventos: EventoRadar[], hoje: string): EventoRadar[] {
  return eventos.filter((e) => e.fim >= hoje).sort((a, b) => a.inicio.localeCompare(b.inicio) || a.id.localeCompare(b.id));
}

export interface Referencia {
  evento: EventoRadar;
  /** `mesma`: edição anterior do mesmo evento. `mesmo_local`: outro evento da mesma categoria no mesmo local. */
  tipo: "mesma" | "mesmo_local";
}

/**
 * Edição passada usada como referência do efeito: a edição anterior mais recente
 * do mesmo evento; se não houver, o evento anterior mais recente da mesma categoria
 * no mesmo local (ex.: outro show no mesmo estádio). Só entra quem tem efeito gravado.
 */
export function edicaoDeReferencia(evento: EventoRadar, todos: EventoRadar[], comEfeito: Set<string>): Referencia | null {
  const anteriores = todos
    .filter((e) => e.id !== evento.id && e.fim < evento.inicio && comEfeito.has(e.id))
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
  const mesma = anteriores.find((e) => e.nome === evento.nome);
  if (mesma) return { evento: mesma, tipo: "mesma" };
  const local = evento.local ? anteriores.find((e) => e.categoria === evento.categoria && e.local === evento.local) : undefined;
  return local ? { evento: local, tipo: "mesmo_local" } : null;
}

/** Separa os bairros com efeito medido (para chips e contas) dos de sinal mais fraco (só texto). */
/**
 * Linha de contexto da cidade em `radar_evento_efeitos`: mediana do efeito entre os
 * bairros lidos na mesma edição (auditoria de 16/11/2026, achado E1). Não é bairro,
 * não tem teste de placebo e nunca entra em lista, filtro ou conta de bairro.
 */
export const BAIRRO_CIDADE = "São Paulo";

/** Mediana da cidade na edição, ou null quando a linha não existe. */
export function efeitoDaCidade(efeitos: EfeitoEvento[]): number | null {
  return efeitos.find((e) => e.bairro === BAIRRO_CIDADE)?.efeito_diaria_pct ?? null;
}

export function separarEfeitos(efeitos: EfeitoEvento[]) {
  const positivos = efeitos.filter((e) => e.bairro !== BAIRRO_CIDADE && e.efeito_diaria_pct > 0 && e.p_placebo != null);
  const ordem = (a: EfeitoEvento, b: EfeitoEvento) => b.efeito_diaria_pct - a.efeito_diaria_pct || a.bairro.localeCompare(b.bairro, "pt-BR");
  return {
    medidos: positivos.filter((e) => (e.p_placebo as number) < P_EFEITO_MEDIDO).sort(ordem),
    fracos: positivos.filter((e) => (e.p_placebo as number) >= P_EFEITO_MEDIDO && (e.p_placebo as number) < P_SINAL_FRACO).sort(ordem),
  };
}

export interface EventoComReferencia {
  evento: EventoRadar;
  referencia: Referencia | null;
  medidos: EfeitoEvento[];
  fracos: EfeitoEvento[];
  /** Mediana do efeito entre os bairros da cidade na edição de referência; null sem a linha. */
  cidade: number | null;
}

/** Próximos eventos com a edição de referência e os efeitos dela, já separados. Usado em /eventos e na página do bairro. */
export function eventosComReferencia(eventos: EventoRadar[], efeitos: EfeitoEvento[], hoje: string): EventoComReferencia[] {
  const porEvento = new Map<string, EfeitoEvento[]>();
  for (const f of efeitos) porEvento.set(f.evento_id, [...(porEvento.get(f.evento_id) ?? []), f]);
  const comEfeito = new Set(porEvento.keys());
  return eventosFuturos(eventos, hoje).map((evento) => {
    const referencia = edicaoDeReferencia(evento, eventos, comEfeito);
    const daReferencia = referencia ? porEvento.get(referencia.evento.id) ?? [] : [];
    return { evento, referencia, ...separarEfeitos(daReferencia), cidade: efeitoDaCidade(daReferencia) };
  });
}

export interface EventoDoBairro {
  evento: EventoRadar;
  referencia: Referencia;
  efeito: EfeitoEvento;
  /** `false` = sinal mais fraco (entre 1% e 5%). */
  medido: boolean;
  cidade: number | null;
}

/** Próximos eventos em que a edição de referência mexeu na diária deste bairro (medido ou sinal mais fraco). */
export function eventosDoBairro(lista: EventoComReferencia[], bairro: string): EventoDoBairro[] {
  const saida: EventoDoBairro[] = [];
  for (const c of lista) {
    if (!c.referencia) continue;
    const m = c.medidos.find((e) => e.bairro === bairro);
    const f = m ? undefined : c.fracos.find((e) => e.bairro === bairro);
    const efeito = m ?? f;
    if (efeito) saida.push({ evento: c.evento, referencia: c.referencia, efeito, medido: !!m, cidade: c.cidade });
  }
  return saida;
}

/**
 * Receita bruta das noites do evento, com e sem o acréscimo na diária. Parte da
 * hipótese de que todas as noites são reservadas; quem chama precisa dizer isso.
 */
export function receitaDasNoites(diaria: number, noites: number, acrescimoPct: number) {
  const n = Math.max(0, Math.round(noites));
  const d = Math.max(0, diaria);
  const sem = d * n;
  const diariaComAcrescimo = d * (1 + acrescimoPct / 100);
  const com = diariaComAcrescimo * n;
  return { sem, com, diferenca: com - sem, diariaComAcrescimo };
}

/** Lê o acréscimo digitado ("11", "11,5"); vazio ou inválido vira null. Limite de −100% a +1.000%. */
export function lerAcrescimo(texto: string): number | null {
  const limpo = texto.trim().replace(",", ".");
  if (!limpo || !/^-?\d+(\.\d+)?$/.test(limpo)) return null;
  const v = Number(limpo);
  return v >= -100 && v <= 1000 ? v : null;
}

const COLUNAS_EVENTO = "id,nome,categoria,local,inicio,fim,data_confirmada,fonte_titulo,fonte_url";

/** Eventos publicados, em ordem de data. O calendário é pequeno; 500 é folga, não paginação. */
export async function listarEventosPublicos(): Promise<EventoRadar[]> {
  const { data, error } = await supabase.from("radar_eventos").select(COLUNAS_EVENTO)
    .eq("status", "publicado").order("inicio").order("id").limit(500);
  if (error) throw error;
  return (data ?? []) as EventoRadar[];
}

/**
 * Efeitos publicáveis dos eventos dados, no recorte de até 1 quarto. Ids em lotes; páginas de 1.000.
 * O filtro `publicavel` é explícito para o admin (que lê todas as linhas pela policy) ver a mesma tela do público.
 */
export async function listarEfeitos(eventoIds: string[]): Promise<EfeitoEvento[]> {
  const saida: EfeitoEvento[] = [];
  for (let i = 0; i < eventoIds.length; i += 50) {
    const lote = eventoIds.slice(i, i + 50);
    for (let de = 0; ; de += 1000) {
      const { data, error } = await supabase.from("radar_evento_efeitos")
        .select("id,evento_id,bairro,efeito_diaria_pct,p_placebo,noites")
        .in("evento_id", lote).eq("recorte", RECORTE_EVENTOS).eq("publicavel", true)
        .order("evento_id").order("id").range(de, de + 999);
      if (error) throw error;
      for (const l of data ?? []) saida.push({ evento_id: l.evento_id, bairro: l.bairro, efeito_diaria_pct: Number(l.efeito_diaria_pct), p_placebo: l.p_placebo == null ? null : Number(l.p_placebo), noites: l.noites });
      if ((data?.length ?? 0) < 1000) break;
    }
  }
  return saida;
}

/** Calendário e efeitos numa leitura só, para a tela. */
export async function carregarEventos() {
  const eventos = await listarEventosPublicos();
  const efeitos = eventos.length ? await listarEfeitos(eventos.map((e) => e.id)) : [];
  return { eventos, efeitos };
}
