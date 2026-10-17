import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const assinaturas = new WeakMap<QueryClient, { usuarios: number; fechar: () => void }>();

/** Uma assinatura por cache, apenas enquanto alguma tela de mercado estiver aberta. */
export function useRadarRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    let assinatura = assinaturas.get(qc);
    if (!assinatura) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const atualizar = () => {
        clearTimeout(timer);
        // Uma coleta insere vários indicadores na mesma transação.
        timer = setTimeout(() => {
          for (const chave of ["radar_bairro_atual", "radar_historico", "radar_ultima_coleta_base", "radar_variacoes", "bairro_airbnb_sp"]) {
            void qc.invalidateQueries({ queryKey: [chave] });
          }
        }, 300);
      };
      const channel = supabase.channel("radar-coletas-abertas")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "radar_observacoes", filter: "cidade=eq.São Paulo" }, atualizar)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "radar_observacoes", filter: "cidade=eq.São Paulo" }, atualizar)
        .subscribe((status) => {
          // Reconsulta também ao reconectar, recuperando avisos perdidos.
          if (status === "SUBSCRIBED") atualizar();
        });
      assinatura = { usuarios: 0, fechar: () => { clearTimeout(timer); void supabase.removeChannel(channel); } };
      assinaturas.set(qc, assinatura);
    }
    assinatura.usuarios += 1;
    return () => {
      assinatura.usuarios -= 1;
      if (assinatura.usuarios === 0) {
        assinatura.fechar();
        assinaturas.delete(qc);
      }
    };
  }, [qc]);
}