import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { DEDUCOES_PADRAO_PCT, resultadoLiquidoMensal } from "@/lib/bairroAjustes";

type Sim = { id: string; created_at: string; device_type: string | null; bairro: string; metragem: string; decoracao: string; bruto: number | null; liquido: number | null };

const brl = (v: number | null) => v == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
const data = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

async function carregar(): Promise<Sim[]> {
  const { data: rows, error } = await supabase
    .from("guide_events")
    .select("id, created_at, device_type, event_data")
    .eq("event_type", "simulator_used")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (rows ?? []).map((r) => {
    const d = (r.event_data ?? {}) as Record<string, unknown>;
    const bruto = typeof d.resultado === "number" ? d.resultado : null;
    const liquido = typeof d.resultado_liquido === "number" ? d.resultado_liquido : bruto != null ? resultadoLiquidoMensal(bruto) : null;
    return {
      id: r.id,
      created_at: r.created_at ?? "",
      device_type: r.device_type,
      bairro: String(d.bairro ?? "—"),
      metragem: d.metragem ? `${d.metragem} m²` : "—",
      decoracao: typeof d.decoracao === "string" ? d.decoracao : "Não registrada",
      bruto,
      liquido,
    };
  });
}

export default function AdminSimulacoes() {
  const { data: sims, isLoading, isError, refetch } = useQuery({ queryKey: ["admin_simulacoes"], queryFn: carregar });

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <AdminTabs />
        <header className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Simulações dos visitantes</h1>
          <p className="text-sm text-muted-foreground">
            Só aparecem visitantes que aceitaram os cookies; sem nome ou contato. Resultado líquido = receita mensal menos {DEDUCOES_PADRAO_PCT}% de custos padrão (estimativa). Últimas 500.
          </p>
        </header>

        {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>}
        {isError && <div className="rounded-lg border border-destructive/40 p-4 text-sm">Não foi possível carregar. <Button variant="link" onClick={() => refetch()}>Tentar de novo</Button></div>}
        {sims && sims.length === 0 && <p className="rounded-lg border border-border p-6 text-sm text-muted-foreground">Nenhuma simulação registrada ainda.</p>}

        {sims && sims.length > 0 && (
          <>
            <ul className="space-y-3 lg:hidden">
              {sims.map((s) => (
                <li key={s.id} className="rounded-lg border border-border bg-card p-4 text-sm space-y-1">
                  <div className="flex justify-between gap-2"><strong>{s.bairro}</strong><span className="text-muted-foreground">{data(s.created_at)}</span></div>
                  <div>{s.metragem} · {s.decoracao}</div>
                  <div className="tabular-nums">Bruto {brl(s.bruto)} · <strong>Líquido {brl(s.liquido)}</strong></div>
                </li>
              ))}
            </ul>
            <div className="hidden lg:block rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>Bairro</TableHead><TableHead>Metragem</TableHead>
                    <TableHead>Decoração</TableHead><TableHead className="text-right">Receita mensal</TableHead>
                    <TableHead className="text-right">Resultado líquido</TableHead><TableHead>Aparelho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sims.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{data(s.created_at)}</TableCell><TableCell>{s.bairro}</TableCell><TableCell>{s.metragem}</TableCell>
                      <TableCell>{s.decoracao}</TableCell>
                      <TableCell className="text-right tabular-nums">{brl(s.bruto)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{brl(s.liquido)}</TableCell>
                      <TableCell>{s.device_type ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


