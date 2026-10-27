import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { z } from "zod";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import BairrosSemGuestFavorites from "@/components/admin/BairrosSemGuestFavorites";
import OrganizacaoBairros from "@/components/admin/OrganizacaoBairros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BAIRROS_CURADOS, fonteBairro } from "@/data/bairrosCurados";
import { buscarAjuste, mapaAjustes, useBairroAjustes } from "@/lib/bairroAjustes";

const schema = z.object({
  diaria: z.number().positive("Diária deve ser maior que zero").max(99999),
  ocupacao: z.number().positive("Ocupação deve ser maior que zero").max(100, "Ocupação vai até 100%"),
  fonte: z.string().trim().min(3, "Informe a fonte").max(300),
});

type Rascunho = { diaria: string; ocupacao: string; fonte: string };
const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
const num = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

export default function AdminBairros() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useBairroAjustes();
  const [rascunhos, setRascunhos] = useState<Record<string, Rascunho>>({});
  const [salvando, setSalvando] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const mapa = mapaAjustes(data);
    setRascunhos(Object.fromEntries(BAIRROS_CURADOS.map((b) => {
      const a = buscarAjuste(mapa, b.name);
      return [b.name, {
        diaria: String(a?.diaria ?? b.dailyAvg).replace(".", ","),
        ocupacao: String(a?.ocupacao ?? b.avgOccupancy).replace(".", ","),
        fonte: a?.fonte ?? "",
      }];
    })));
  }, [data]);

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["bairro_ajustes"] });
    qc.invalidateQueries({ queryKey: ["bairro_airbnb_sp"] });
  };

  const salvar = async (bairro: string) => {
    const r = rascunhos[bairro];
    if (!r || !user) return;
    const parsed = schema.safeParse({ diaria: num(r.diaria), ocupacao: num(r.ocupacao), fonte: r.fonte });
    if (!parsed.success) {
      toast({ title: "Revise os campos", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setSalvando(bairro);
    const { error } = await supabase.from("bairro_ajustes").upsert(
      { bairro, diaria: parsed.data.diaria, ocupacao: parsed.data.ocupacao, fonte: parsed.data.fonte, updated_by: user.id },
      { onConflict: "bairro" },
    );
    setSalvando(null);
    if (error) { toast({ title: "Não foi possível salvar", description: "Tente de novo em instantes.", variant: "destructive" }); return; }
    toast({ title: `${bairro} atualizado`, description: "O site já usa os novos números." });
    invalidar();
  };

  const restaurar = async (bairro: string) => {
    setSalvando(bairro);
    const { error } = await supabase.from("bairro_ajustes").delete().eq("bairro", bairro);
    setSalvando(null);
    if (error) { toast({ title: "Não foi possível restaurar", variant: "destructive" }); return; }
    toast({ title: `${bairro} voltou à base aprovada` });
    invalidar();
  };

  const mapa = mapaAjustes(data);
  const set = (b: string, campo: keyof Rascunho, v: string) =>
    setRascunhos((s) => ({ ...s, [b]: { ...s[b], [campo]: v } }));

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <AppNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <AdminTabs />
        <OrganizacaoBairros />
        <BairrosSemGuestFavorites />
        <header className="space-y-1">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Diária e ocupação por bairro</h2>
          <p className="text-sm text-muted-foreground">
            O número salvo aqui substitui o da base aprovada no site. A base aprovada e o case Pinheiros não mudam; use "Restaurar" para voltar.
          </p>
        </header>

        {isLoading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>}
        {isError && (
          <div className="rounded-lg border border-destructive/40 p-4 text-sm">
            Não foi possível carregar os ajustes. <Button variant="link" onClick={() => refetch()}>Tentar de novo</Button>
          </div>
        )}

        {!isLoading && !isError && (
          <ul className="grid gap-4 md:grid-cols-2">
            {BAIRROS_CURADOS.map((b) => {
              const r = rascunhos[b.name];
              const ajuste = buscarAjuste(mapa, b.name);
              if (!r) return null;
              return (
                <li key={b.name} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg font-semibold">{b.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        Base aprovada: {brl(b.dailyAvg)} · {b.avgOccupancy}% · {fonteBairro(b)}
                      </p>
                    </div>
                    <Badge variant={ajuste ? "default" : "outline"}>{ajuste ? "Ajustado" : "Base aprovada"}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-sm space-y-1">
                      <span>Diária (R$)</span>
                      <Input inputMode="decimal" className="text-base" value={r.diaria} onChange={(e) => set(b.name, "diaria", e.target.value)} />
                    </label>
                    <label className="text-sm space-y-1">
                      <span>Ocupação (%)</span>
                      <Input inputMode="decimal" className="text-base" value={r.ocupacao} onChange={(e) => set(b.name, "ocupacao", e.target.value)} />
                    </label>
                  </div>
                  <label className="text-sm space-y-1 block">
                    <span>Fonte (link ou descrição)</span>
                    <Input className="text-base" placeholder="Ex.: AirDNA, coleta de 20/10/2026" value={r.fonte} onChange={(e) => set(b.name, "fonte", e.target.value)} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button className="min-h-[44px]" onClick={() => salvar(b.name)} disabled={salvando === b.name}>
                      {salvando === b.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
                    </Button>
                    {ajuste && (
                      <Button variant="outline" className="min-h-[44px]" onClick={() => restaurar(b.name)} disabled={salvando === b.name}>
                        <RotateCcw className="h-4 w-4" /> Restaurar
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
