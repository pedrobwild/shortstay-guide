import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CIDADE, type BairroRadar, type Confianca } from "@/lib/radarBase";

export const CONFIANCAS: Confianca[] = ["alta", "media", "baixa"];
export const NOMES_CONFIANCA = { alta: "Alta", media: "Média", baixa: "Baixa" };
export const TAMANHO_HISTORICO = 20;

/** Uma contagem por bairro; a referência da cidade não entra no gráfico. */
export function resumirConfianca(bairros: BairroRadar[]) {
  return CONFIANCAS.map((confianca) => ({
    confianca,
    nome: NOMES_CONFIANCA[confianca],
    quantidade: new Set(bairros.filter((b) => b.name !== CIDADE && b.confianca === confianca).map((b) => b.name)).size,
  }));
}

/** Uma linha de diária representa cada coleta, sem repetir seus indicadores. */
export function useHistoricoMercado(bairro: string, pagina: number) {
  return useQuery({
    queryKey: ["radar_historico", "monitoramento", bairro, pagina],
    queryFn: async () => {
      let consulta = supabase.from("radar_observacoes")
        .select("id,bairro,valor,coletado_em,publicado_em,periodo_inicio,periodo_fim,amostra_n,ativo,fonte_id,url_origem,observacao,radar_fontes(nome),radar_coleta_auditoria(autor_nome,registrado_em,utms)", { count: "exact" })
        .eq("cidade", CIDADE).eq("indicador", "adr_medio_brl");
      if (bairro !== "todos") consulta = consulta.eq("bairro", bairro);
      const { data, error, count } = await consulta.order("coletado_em", { ascending: false }).order("id", { ascending: true })
        .range(pagina * TAMANHO_HISTORICO, (pagina + 1) * TAMANHO_HISTORICO - 1);
      if (error) throw error;
      return { linhas: data ?? [], total: count ?? 0 };
    },
    staleTime: 60_000,
    retry: 1,
  });
}