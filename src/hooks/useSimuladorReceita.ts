import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBairroData } from "@/hooks/useBairroData";
import { DECORATION_LEVELS, type BairroItem } from "@/data/guide-data";
import {
  PREMISSAS_SIMULADOR_PADRAO, aluguelReferencia, armazenamentoLocal, indicadores, lerPremissasDaQuery, lerRascunho, normalizarPremissasSimulador,
  premissasParaQuery, resultadoShortStay, resultadoTradicional, salvarRascunho, type PremissasSimulador, type Resultado,
} from "@/lib/simuladorReceita";
import { slugifyBairro } from "@/lib/seo";

const BAIRRO_PADRAO = "Pinheiros";

export interface SimuladorReceita {
  p: PremissasSimulador;
  atualizar: (parcial: Partial<PremissasSimulador>) => void;
  /** Troca o bairro e volta diária e ocupação para os números dele. */
  escolherBairro: (nome: string) => void;
  bairros: BairroItem[];
  bairro: BairroItem | undefined;
  /** Diária base do bairro × nível de decoração (sem o ajuste da pessoa). */
  diariaBase: number;
  diaria: number;
  ocupacao: number;
  diariaAjustada: boolean;
  ocupacaoAjustada: boolean;
  aluguel: number;
  resultadoShortStay: Resultado | null;
  resultadoTradicional: Resultado;
  /** Resultado do modo ativo. */
  resultado: Resultado | null;
  indicadores: ReturnType<typeof indicadores>;
  /** Premissas chegaram por um link compartilhado (além do bairro). */
  recebidaPorLink: boolean;
  /** Query string das premissas atuais (para o link e o rascunho de retomada). */
  query: string;
  /** Carrega um conjunto completo de premissas (cenário salvo). */
  carregar: (p: PremissasSimulador) => void;
}

/**
 * Estado único do simulador, compartilhado pela seção da home (#simulador) e pela
 * página /projecao: rascunho no navegador, premissas vindas da URL (link compartilhado
 * ou ?bairro= do mapa) e os resultados dos dois modelos.
 * O primeiro render usa só os padrões (o HTML pré-renderizado precisa bater); o
 * rascunho e a URL entram num efeito, no navegador.
 */
export function useSimuladorReceita(): SimuladorReceita {
  const { bairros } = useBairroData();
  const [p, setP] = useState<PremissasSimulador>(PREMISSAS_SIMULADOR_PADRAO);
  const [recebidaPorLink, setRecebidaPorLink] = useState(false);
  const carregado = useRef(false);
  const aplicouUrl = useRef(false);

  // 1) rascunho do navegador, uma vez
  useEffect(() => {
    if (carregado.current) return;
    carregado.current = true;
    setP(lerRascunho(armazenamentoLocal()));
  }, []);

  // 2) premissas da URL, uma vez, quando a lista de bairros já tem o slug pedido
  useEffect(() => {
    if (aplicouUrl.current || typeof window === "undefined") return;
    const { slugBairro, premissas, veioAlgo } = lerPremissasDaQuery(window.location.search);
    if (!slugBairro && !veioAlgo) { aplicouUrl.current = true; return; }
    const alvo = slugBairro ? bairros.find((b) => slugifyBairro(b.name) === slugifyBairro(slugBairro)) : undefined;
    if (slugBairro && !alvo) return; // base ainda carregando (ou bairro fora dela): tenta de novo quando mudar
    aplicouUrl.current = true;
    setP((atual) => normalizarPremissasSimulador({ ...atual, ...premissas, ...(alvo ? { bairro: alvo.name } : {}) }));
    if (veioAlgo) setRecebidaPorLink(true);
  }, [bairros]);

  // 3) rascunho salvo a cada mudança (depois do carregamento)
  useEffect(() => { if (carregado.current) salvarRascunho(p, armazenamentoLocal()); }, [p]);

  const atualizar = useCallback((parcial: Partial<PremissasSimulador>) => setP((atual) => ({ ...atual, ...parcial })), []);
  const escolherBairro = useCallback((nome: string) => setP((atual) => ({ ...atual, bairro: nome, diaria: null, ocupacao: null })), []);
  const carregar = useCallback((novo: PremissasSimulador) => setP(normalizarPremissasSimulador(novo)), []);

  const bairro = bairros.find((b) => b.name === p.bairro) ?? bairros.find((b) => b.name === BAIRRO_PADRAO) ?? bairros[0];
  const decLevel = DECORATION_LEVELS.find((d) => d.value === p.decoracao) ?? DECORATION_LEVELS[0];
  const diariaBase = bairro ? Math.round(bairro.dailyAvg * decLevel.multiplier) : 0;
  const diaria = p.diaria ?? diariaBase;
  const ocupacao = p.ocupacao ?? bairro?.avgOccupancy ?? 0;
  const aluguel = p.aluguel ?? aluguelReferencia(p.imovel.valorImovel);

  const rSS = useMemo(() => (bairro ? resultadoShortStay({ diaria, ocupacaoPct: ocupacao }, p.imovel, p.shortStay) : null), [bairro, diaria, ocupacao, p.imovel, p.shortStay]);
  const rTrad = useMemo(() => resultadoTradicional(p.imovel, { ...p.tradicional, aluguel }), [p.imovel, p.tradicional, aluguel]);
  const resultado = p.modo === "short_stay" ? rSS : rTrad;
  const ind = resultado ? indicadores(resultado, p.imovel.valorImovel, p.reforma) : null;
  const query = premissasParaQuery(p, bairro ? slugifyBairro(bairro.name) : null);

  return {
    p, atualizar, escolherBairro, carregar, bairros, bairro, diariaBase, diaria, ocupacao,
    diariaAjustada: p.diaria != null && p.diaria !== diariaBase,
    ocupacaoAjustada: p.ocupacao != null && bairro != null && p.ocupacao !== bairro.avgOccupancy,
    aluguel, resultadoShortStay: rSS, resultadoTradicional: rTrad, resultado, indicadores: ind, recebidaPorLink, query,
  };
}
