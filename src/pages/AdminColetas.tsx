import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { coletaSchema, indicadoresColeta, numeroColeta } from "@/lib/radarColetas";
import { useRadarBase } from "@/lib/radarBase";
import { useLocation } from "react-router-dom";
import { registrarColetaAuditada, rotuloUtms, utmsAcessoColeta } from "@/lib/coletaAuditoria";
import ColetaAuditoria from "@/components/admin/ColetaAuditoria";
import ImportacaoAirdna from "@/components/admin/ImportacaoAirdna";
import ColetasPendentes from "@/components/admin/ColetasPendentes";
import HistoricoGuestFavorites from "@/components/admin/HistoricoGuestFavorites";
import ComparacaoFontes from "@/components/admin/ComparacaoFontes";

const inicial = () => ({ bairro: "Mooca", fonte_id: "guestfavorites" as const, periodo_inicio: "", periodo_fim: "", coletado_em: new Date().toISOString().slice(0, 10), publicado_em: "", amostra_n: "", url_origem: "", observacao: "" });
const dataBR = (v: string | null) => v ? v.split("-").reverse().join("/") : "Sem período";
export default function AdminColetas() {
  const qc = useQueryClient();
  const radar = useRadarBase();
  const { search } = useLocation();
  const utms = utmsAcessoColeta(search);
  const [form, setForm] = useState(inicial);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const historico = useQuery({ queryKey: ["radar_historico", form.bairro], queryFn: async () => {
    const { data, error } = await supabase.from("radar_observacoes").select("id,coletado_em,periodo_inicio,periodo_fim,amostra_n,ativo,fonte_id,observacao,radar_coleta_auditoria(autor_nome,registrado_em,utms)").eq("bairro", form.bairro).eq("cidade", "São Paulo").eq("indicador", "adr_medio_brl").order("coletado_em", { ascending: false }).order("id").limit(100);
    if (error) throw error;
    return data;
  } });
  const payload = () => coletaSchema.safeParse({ ...form, amostra_n: form.amostra_n.trim() ? numeroColeta(form.amostra_n) : NaN, indicadores: Object.fromEntries(indicadoresColeta.filter(([k]) => valores[k]?.trim()).map(([k]) => [k, numeroColeta(valores[k])])) });
  const revisar = () => { const p = payload(); if (!p.success) { setErro(p.error.issues[0].message); return; } setErro(""); setConfirmar(true); };
  const salvar = async () => {
    const p = payload(); if (!p.success) return;
    setSaving(true);
    try {
      const { error } = await registrarColetaAuditada(p.data, utms);
      if (error) throw error;
      await Promise.all([qc.invalidateQueries({ queryKey: ["radar_bairro_atual"] }), qc.invalidateQueries({ queryKey: ["radar_historico"] }), qc.invalidateQueries({ queryKey: ["bairro_airbnb_sp"] })]);
      toast({ title: "Coleta registrada", description: "As anteriores foram desativadas e o histórico foi preservado." });
      setForm((f) => ({ ...inicial(), bairro: f.bairro })); setValores({}); setErro("");
    } catch (e) { setErro(e && typeof e === "object" && "message" in e ? String(e.message) : "Não foi possível salvar. Tente novamente."); }
    finally { setSaving(false); setConfirmar(false); }
  };
  const campo = (key: keyof ReturnType<typeof inicial>, label: string, type = "text") => <label className="block space-y-1 text-sm"><span>{label}</span><Input required={!["publicado_em", "observacao"].includes(key)} type={type} className="text-base min-h-[44px]" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} /></label>;
  return <div className="min-h-screen bg-background"><AppNavbar /><main className="mx-auto max-w-5xl px-4 py-8 space-y-6"><AdminTabs />
    <h1 className="font-display text-2xl font-bold">Coletas de mercado</h1>
    <HistoricoGuestFavorites />
    <p className="break-all text-sm text-muted-foreground">UTMs deste acesso: {rotuloUtms(utms)}</p>
    <ColetasPendentes />
    <ComparacaoFontes />
    <ImportacaoAirdna utms={utms} />
    <h2 className="font-display text-xl font-semibold">Coleta manual GuestFavorites</h2>
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); revisar(); }}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm"><span>Bairro / referência</span><Select value={form.bairro} onValueChange={(bairro) => setForm((f) => ({ ...f, bairro }))}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{[...BAIRROS_CURADOS.map((b) => b.name), "São Paulo"].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></label>
        <label className="space-y-1 text-sm"><span>Fonte</span><Input value="GuestFavorites · pública" readOnly className="text-base min-h-[44px]" /></label>
        {campo("periodo_inicio", "Início do período", "date")}{campo("periodo_fim", "Fim do período", "date")}
        {campo("coletado_em", "Data da coleta", "date")}{campo("publicado_em", "Data da publicação (opcional)", "date")}
        {campo("amostra_n", "Amostra (número de anúncios)")}{campo("url_origem", "Link da página GuestFavorites", "url")}
        {indicadoresColeta.map(([key, label], i) => <label key={key} className="space-y-1 text-sm"><span>{label}{i > 1 ? " (opcional)" : ""}</span><Input required={i < 2} className="text-base min-h-[44px]" inputMode="decimal" value={valores[key] ?? ""} onChange={(e) => setValores((v) => ({ ...v, [key]: e.target.value }))} /></label>)}
      </div>
      <label className="block space-y-1 text-sm"><span>Observação</span><Textarea className="text-base" maxLength={4000} value={form.observacao} onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))} /></label>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <Button disabled={saving} className="min-h-[44px]" type="submit">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Registrar nova coleta</Button>
    </form>
    <section className="space-y-3 border-t border-border pt-5"><h2 className="font-display text-xl font-semibold">Histórico — {form.bairro}</h2>
      {historico.isLoading && <p role="status">Carregando…</p>}
      {historico.isError && <p role="alert">Não foi possível carregar. <Button variant="link" onClick={() => historico.refetch()}>Tentar novamente</Button></p>}
      {historico.data?.length === 0 && <p className="text-muted-foreground">Nenhuma coleta registrada.</p>}
      <ul className="space-y-3">{historico.data?.map((r) => <li key={r.id} className="rounded-md border border-border p-3 text-sm space-y-1"><p className="font-semibold">{r.fonte_id} · {dataBR(r.coletado_em)} · {r.ativo ? "Ativa" : "Inativa"}</p><p className="text-muted-foreground">{dataBR(r.periodo_inicio)} — {dataBR(r.periodo_fim)} · n={r.amostra_n ?? "não informado"}</p><ColetaAuditoria auditoria={r.radar_coleta_auditoria} />{r.observacao && <p className="break-words">{r.observacao}</p>}</li>)}</ul>
      {radar.data?.offline && <p className="text-destructive">A consulta de mercado está indisponível; o site está usando a reserva offline.</p>}
    </section>
    <AlertDialog open={confirmar} onOpenChange={setConfirmar}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Substituir a coleta de {form.bairro}?</AlertDialogTitle><AlertDialogDescription>Os novos números passam a valer na base compartilhada. Todas as observações ativas anteriores deste bairro serão desativadas, sem apagar o histórico. Indicadores opcionais vazios não serão reaproveitados da coleta anterior.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={(e) => { e.preventDefault(); salvar(); }}>{saving ? "Salvando…" : "Confirmar coleta"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main></div>;
}