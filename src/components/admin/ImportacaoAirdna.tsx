import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { BAIRROS_AIRDNA, coletaSchema } from "@/lib/radarColetas";
import { registrarColetaAuditada } from "@/lib/coletaAuditoria";
import { buscarPreviaAirdna, coletaDaPrevia, type BairroAirdna, type PreviaAirdna } from "@/lib/airdna";
import { formatDecimal } from "@/lib/numberFormat";

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
const inteiro = (v: number) => new Intl.NumberFormat("pt-BR").format(Math.round(v));
const dataBR = (v: string) => v.split("-").reverse().join("/");

/**
 * Busca na AirDNA (via edge function, chave só no backend) e mostra uma prévia.
 * Só grava quando o admin confirma, pela RPC auditada — a mesma das coletas manuais.
 */
export default function ImportacaoAirdna({ utms }: { utms: Record<string, string> }) {
  const qc = useQueryClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const [bairro, setBairro] = useState<BairroAirdna>("Brooklin");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [observacao, setObservacao] = useState("");
  const [previa, setPrevia] = useState<PreviaAirdna | null>(null);
  const [erro, setErro] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const buscar = async () => {
    if (!inicio || !fim || inicio > fim || fim > hoje) { setErro("Informe um período válido (início ≤ fim ≤ hoje)."); return; }
    setErro(""); setPrevia(null); setBuscando(true);
    try { setPrevia(await buscarPreviaAirdna(bairro, inicio, fim)); }
    catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível consultar a AirDNA."); }
    finally { setBuscando(false); }
  };

  const payload = () => previa ? coletaSchema.safeParse(coletaDaPrevia(previa, hoje, observacao)) : null;
  const revisar = () => {
    const p = payload();
    if (!p?.success) { setErro(p ? p.error.issues[0].message : "Busque os dados antes de registrar."); return; }
    setErro(""); setConfirmar(true);
  };
  const salvar = async () => {
    const p = payload(); if (!p?.success) return;
    setSalvando(true);
    try {
      const { error } = await registrarColetaAuditada(p.data, utms);
      if (error) throw error;
      await Promise.all([qc.invalidateQueries({ queryKey: ["radar_bairro_atual"] }), qc.invalidateQueries({ queryKey: ["radar_historico"] })]);
      toast({ title: "Coleta AirDNA registrada", description: `${bairro} passa a usar AirDNA; a estimativa anterior foi desativada e o histórico preservado.` });
      setPrevia(null); setObservacao("");
    } catch (e) { setErro(e && typeof e === "object" && "message" in e ? String(e.message) : "Não foi possível salvar. Tente novamente."); }
    finally { setSalvando(false); setConfirmar(false); }
  };

  return (
    <section aria-labelledby="titulo-airdna" className="space-y-4 rounded-lg border border-border p-4">
      <div className="space-y-1">
        <h2 id="titulo-airdna" className="font-display text-xl font-semibold">Importar da AirDNA</h2>
        <p className="text-sm text-muted-foreground">Só para os bairros sem fonte pública. A busca não grava nada: confira a área e os números antes de registrar.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1 text-sm"><span>Bairro</span>
          <Select value={bairro} onValueChange={(v) => { setBairro(v as BairroAirdna); setPrevia(null); }}>
            <SelectTrigger className="min-h-[44px] text-base"><SelectValue /></SelectTrigger>
            <SelectContent>{BAIRROS_AIRDNA.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
          </Select>
        </label>
        <label className="space-y-1 text-sm"><span>Início do período</span><Input type="date" max={hoje} className="min-h-[44px] text-base" value={inicio} onChange={(e) => { setInicio(e.target.value); setPrevia(null); }} /></label>
        <label className="space-y-1 text-sm"><span>Fim do período</span><Input type="date" max={hoje} className="min-h-[44px] text-base" value={fim} onChange={(e) => { setFim(e.target.value); setPrevia(null); }} /></label>
      </div>
      <Button type="button" variant="outline" className="min-h-[44px]" disabled={buscando} onClick={buscar}>
        {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Buscar prévia na AirDNA
      </Button>
      {buscando && <p role="status" className="text-sm text-muted-foreground">Consultando a AirDNA…</p>}
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      {previa && (
        <div className="space-y-3 rounded-md bg-muted/50 p-3 text-sm">
          <p className="break-words"><strong>Área AirDNA:</strong> {previa.area.nome} ({previa.area.tipo}) · {previa.filtros}</p>
          <p className="text-muted-foreground">{dataBR(previa.periodo_inicio)} — {dataBR(previa.periodo_fim)} · {previa.meses} meses com dado</p>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 tabular-nums">
            <div><dt className="text-muted-foreground">Diária média</dt><dd className="font-semibold">{brl(previa.indicadores.adr_medio_brl)}</dd></div>
            <div><dt className="text-muted-foreground">Ocupação</dt><dd className="font-semibold">{formatDecimal(previa.indicadores.ocupacao_media_pct, 1)}%</dd></div>
            <div><dt className="text-muted-foreground">Anúncios</dt><dd className="font-semibold">{inteiro(previa.amostra_n)}</dd></div>
            {previa.indicadores.receita_anual_brl != null && <div><dt className="text-muted-foreground">Receita anual</dt><dd className="font-semibold">{brl(previa.indicadores.receita_anual_brl)}</dd></div>}
          </dl>
          {previa.amostra_n < 200 && <p className="font-medium">Amostra pequena: o site exibirá o aviso de amostra.</p>}
          <label className="block space-y-1"><span>Observação (opcional)</span><Textarea className="text-base" maxLength={3500} value={observacao} onChange={(e) => setObservacao(e.target.value)} /></label>
          <Button type="button" className="min-h-[44px]" disabled={salvando} onClick={revisar}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Registrar coleta AirDNA
          </Button>
        </div>
      )}
      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir a estimativa de {bairro} pela AirDNA?</AlertDialogTitle>
            <AlertDialogDescription>Os números passam a valer no site e no chat com o rótulo AirDNA. As observações ativas anteriores deste bairro serão desativadas, sem apagar o histórico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={salvando} onClick={(e) => { e.preventDefault(); salvar(); }}>{salvando ? "Salvando…" : "Confirmar coleta"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
