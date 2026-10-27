import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBairroData } from "@/hooks/useBairroData";
import { supabase } from "@/integrations/supabase/client";
import { baseMudou, linkReabrirSimulacao, premissasDoProjeto } from "@/lib/projetoSimulacao";

/** Linha lida de `project_assumptions`; as três últimas colunas só entram no types.ts gerado depois da migration 20261027120000. */
interface LinhaSimulacao {
  created_at: string;
  neighborhood: string | null;
  area_sqm: string | null;
  premissas_simulador: unknown;
  versao_calculo: string | null;
  base_coletada_em: string | null;
}

/** Guarda de tipo local: a resposta vem de colunas que o types.ts ainda não conhece. */
function ehLinhaSimulacao(v: unknown): v is LinhaSimulacao {
  return !!v && typeof v === "object" && typeof (v as { created_at?: unknown }).created_at === "string";
}

const dataBR = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

type Estado = { fase: "carregando" } | { fase: "erro" } | { fase: "pronto"; linha: LinhaSimulacao | null };

/**
 * Bloco "Simulação guardada" de /projeto/:id: mostra o que a pessoa guardou em
 * "Guardar no Painel" e reabre a mesma conta na /projecao. Deve ficar dentro do BairroProvider
 * (a data da coleta vigente do bairro vem da base já carregada na página).
 */
export default function SimulacaoGuardada({ projectId }: { projectId: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const { bairros, isLoading } = useBairroData();

  useEffect(() => {
    let cancelado = false;
    setEstado({ fase: "carregando" });
    (async () => {
      const { data, error } = await supabase
        .from("project_assumptions")
        .select("created_at, neighborhood, area_sqm, premissas_simulador, versao_calculo, base_coletada_em")
        .eq("project_id", projectId)
        .maybeSingle();
      if (cancelado) return;
      const bruto: unknown = data;
      if (error || (bruto && !ehLinhaSimulacao(bruto))) setEstado({ fase: "erro" });
      else setEstado({ fase: "pronto", linha: (bruto as LinhaSimulacao | null) ?? null });
    })().catch(() => { if (!cancelado) setEstado({ fase: "erro" }); });
    return () => { cancelado = true; };
  }, [projectId]);

  const titulo = <h2 className="text-lg font-semibold text-foreground">Simulação guardada</h2>;

  if (estado.fase === "carregando") {
    return (
      <section aria-busy="true" className="space-y-3">
        {titulo}
        <p className="text-sm text-muted-foreground">Carregando a simulação…</p>
      </section>
    );
  }
  if (estado.fase === "erro") {
    return (
      <section className="space-y-3">
        {titulo}
        <p role="alert" className="text-sm text-muted-foreground">Não foi possível carregar a simulação agora. Recarregue a página em instantes.</p>
      </section>
    );
  }

  const { linha } = estado;
  const temPremissas = linha?.premissas_simulador != null;
  if (!linha || (!temPremissas && !linha.neighborhood)) {
    return (
      <section className="space-y-3">
        {titulo}
        <Card className="border-dashed">
          <CardContent className="py-6 text-sm text-muted-foreground">
            Este projeto não tem simulação guardada; comece uma em{" "}
            <Link to="/projecao" className="font-medium text-foreground underline underline-offset-4">/projecao</Link>.
          </CardContent>
        </Card>
      </section>
    );
  }

  const premissas = premissasDoProjeto(linha);
  const bairro = premissas.bairro;
  const atual = bairro ? bairros.find((b) => b.name === bairro)?.coletadoEm ?? null : null;
  // Sem base conhecida para o bairro, a leitura conservadora é avisar (baseMudou trata null como mudou).
  const mostrarAviso = temPremissas && !isLoading && baseMudou(linha.base_coletada_em, atual);

  return (
    <section className="space-y-3">
      {titulo}
      <Card>
        <CardContent className="space-y-4 py-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Guardada em</dt>
              <dd className="font-medium text-foreground tabular-nums">{new Date(linha.created_at).toLocaleDateString("pt-BR")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bairro</dt>
              <dd className="font-medium text-foreground">{bairro ?? "Não informado"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Faixa de área</dt>
              <dd className="font-medium text-foreground tabular-nums">{premissas.area}</dd>
            </div>
          </dl>
          {!temPremissas && (
            <p className="text-sm text-muted-foreground">
              Este projeto guardou só o bairro e a faixa de área; a simulação reabre com as premissas padrão.
            </p>
          )}
          {mostrarAviso && (
            <p className="text-sm text-muted-foreground">
              A base de diária e ocupação foi atualizada{atual ? ` em ${dataBR(atual)}` : ""}; ao reabrir, a conta é recalculada com a base atual.
            </p>
          )}
          <Button asChild className="min-h-[44px]">
            <Link to={linkReabrirSimulacao(premissas)}>Reabrir na simulação</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
