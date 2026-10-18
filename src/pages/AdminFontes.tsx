import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Check, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppNavbar from '@/components/AppNavbar';
import AdminTabs from '@/components/admin/AdminTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useRadarRealtime } from '@/hooks/useRadarRealtime';
import { buscarObservacoes, validarValorIndicador, versaoObservacao, type ObservacaoFonte } from '@/lib/radarFontes';
import { indicadoresColeta, numeroColeta } from '@/lib/radarColetas';
import { toast } from '@/hooks/use-toast';
const dataBR = (v: string | null) => v ? v.split('-').reverse().join('/') : 'Não informado';
const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const indicador = (k: string) => indicadoresColeta.find(([id]) => id === k)?.[1] ?? (k === 'anuncios_ativos' ? 'Anúncios ativos' : k);
export default function AdminFontes() {
  useRadarRealtime();
  const qc = useQueryClient();
  const [bairro, setBairro] = useState('todos');
  const [fonte, setFonte] = useState('todas');
  const [status, setStatus] = useState('todos');
  const [pagina, setPagina] = useState(0);
  const [linha, setLinha] = useState<ObservacaoFonte | null>(null);
  const [modo, setModo] = useState<'editar' | 'ativar'>('editar');
  const [form, setForm] = useState({ valor: '', url: '', observacao: '' });
  const [erro, setErro] = useState('');
  const [saving, setSaving] = useState(false);
  const consulta = useQuery({ queryKey: ['radar_historico', 'fontes', bairro, fonte, status, pagina], queryFn: () => buscarObservacoes(bairro, fonte, status, pagina) });
  const opcoes = useQuery({ queryKey: ['radar_historico', 'fontes-opcoes'], queryFn: async () => {
    const f = await supabase.from('radar_fontes').select('id,nome').order('nome');
    if (f.error) throw f.error;
    const bairros = new Set<string>();
    for (let inicio = 0; ; inicio += 1000) {
      const r = await supabase.from('radar_observacoes').select('id,bairro').eq('cidade', 'São Paulo').order('id').range(inicio, inicio + 999);
      if (r.error) throw r.error;
      r.data?.forEach(v => bairros.add(v.bairro));
      if ((r.data?.length ?? 0) < 1000) break;
    }
    return { fontes: f.data ?? [], bairros: [...bairros].sort((a,b) => a.localeCompare(b,'pt-BR')) };
  } });
  const abrir = (r: ObservacaoFonte, m: 'editar' | 'ativar') => {
    setLinha(r); setModo(m); setErro('');
    setForm({ valor: String(r.valor).replace('.', ','), url: r.url_origem ?? '', observacao: r.observacao ?? '' });
  };
  const salvar = async () => {
    if (!linha) return;
    const valor = numeroColeta(form.valor);
    if (modo === 'editar' && (!form.valor.trim() || !validarValorIndicador(linha.indicador, valor))) { setErro('Valor fora da faixa do indicador.'); return; }
    if (modo === 'editar' && (form.url.length > 2000 || (form.url && !/^https:\/\/[^\s]+$/.test(form.url)) || form.observacao.length > 4000)) { setErro('Revise o link HTTPS e a observação.'); return; }
    setSaving(true); setErro('');
    try {
      const r = modo === 'ativar' ? await supabase.rpc('admin_ativar_coleta_radar', { p_id: linha.id }) : await supabase.rpc('admin_editar_observacao_radar', { p_id: linha.id, p_valor: valor, p_url: form.url, p_observacao: form.observacao, p_esperado: versaoObservacao(linha) });
      if (r.error) throw r.error;
      await Promise.all(['radar_historico','radar_bairro_atual','radar_variacoes','radar_ultima_coleta_base','bairro_airbnb_sp'].map(k => qc.invalidateQueries({ queryKey: [k] })));
      setLinha(null); toast({ title: modo === 'editar' ? 'Observação salva' : 'Coleta ativada' });
    } catch (e) { setErro(e && typeof e === 'object' && 'message' in e ? String(e.message) : 'Não foi possível salvar. Tente novamente.'); }
    finally { setSaving(false); }
  };
  const seletor = (label: string, v: string, mudar: (v: string) => void, itens: { id: string; nome: string }[]) => <label className="min-w-0 space-y-1 text-sm"><span>{label}</span><Select value={v} onValueChange={v => { mudar(v); setPagina(0); }}><SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent>{itens.map(i => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent></Select></label>;
  return <div className="min-h-screen bg-background"><AppNavbar /><main className="mx-auto max-w-6xl space-y-6 px-4 py-8"><AdminTabs />
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold">Fontes e observações</h1><Button asChild variant="outline"><Link to="/admin/coletas">Registrar nova coleta</Link></Button></div>
    <div className="grid gap-4 sm:grid-cols-3">
      {seletor('Bairro', bairro, setBairro, [{ id: 'todos', nome: 'Todos os bairros' }, ...(opcoes.data?.bairros ?? []).map(b => ({ id: b, nome: b }))])}
      {seletor('Fonte', fonte, setFonte, [{ id: 'todas', nome: 'Todas as fontes' }, ...(opcoes.data?.fontes ?? [])])}
      {seletor('Status', status, setStatus, [{ id: 'todos', nome: 'Todos' }, { id: 'ativa', nome: 'Ativa' }, { id: 'substituida', nome: 'Substituída' }])}
    </div>
    {consulta.isLoading && <p role="status">Carregando observações…</p>}
    {(consulta.isError || opcoes.isError) && <p role="alert" className="text-destructive">Não foi possível carregar. <Button variant="link" onClick={() => { void consulta.refetch(); void opcoes.refetch(); }}>Tentar novamente</Button></p>}
    {consulta.data?.total === 0 && <p className="text-muted-foreground">Nenhuma observação encontrada.</p>}
    <ul className="divide-y divide-border">{consulta.data?.linhas.map(r => <li key={r.id} className="grid gap-3 py-4 lg:grid-cols-[1fr_1fr_auto]">
      <div className="min-w-0 space-y-1"><h2 className="font-semibold">{r.bairro} <span className={r.ativo ? 'text-primary' : 'text-muted-foreground'}>· {r.ativo ? 'Ativa' : 'Substituída'}</span></h2><p className="text-sm">{indicador(r.indicador)}: <strong className="tabular-nums">{numero.format(r.valor)}</strong></p><p className="break-words text-sm text-muted-foreground">{r.radar_fontes?.nome ?? r.fonte_id}</p></div>
      <div className="min-w-0 space-y-1 text-sm text-muted-foreground"><p>Período: {dataBR(r.periodo_inicio)} — {dataBR(r.periodo_fim)}</p><p>Coleta: {dataBR(r.coletado_em)} · Amostra: {r.amostra_n === null ? 'não informada' : numero.format(r.amostra_n)}</p>{r.url_origem?.startsWith('https://') && <a className="text-primary underline" href={r.url_origem} target="_blank" rel="noopener noreferrer">Consultar fonte</a>}{r.observacao && <p className="break-words">{r.observacao}</p>}</div>
      <div className="flex flex-wrap items-start gap-2"><Button variant="outline" aria-label={`Editar ${indicador(r.indicador)} de ${r.bairro}`} onClick={() => abrir(r,'editar')}><Pencil className="h-4 w-4" />Editar</Button>{!r.ativo && <Button variant="outline" onClick={() => abrir(r,'ativar')}><Check className="h-4 w-4" />Ativar coleta</Button>}</div>
    </li>)}</ul>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{consulta.data?.total ?? 0} observações · Página {pagina + 1}</p><div className="flex gap-2"><Button variant="outline" aria-label="Página anterior" disabled={pagina === 0 || consulta.isFetching} onClick={() => setPagina(p => p-1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" aria-label="Próxima página" disabled={!consulta.data || (pagina+1)*30 >= consulta.data.total || consulta.isFetching} onClick={() => setPagina(p => p+1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
    <Dialog open={!!linha} onOpenChange={v => { if (!v && !saving) setLinha(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{modo === 'editar' ? 'Editar observação' : 'Ativar coleta'} — {linha?.bairro}</DialogTitle><DialogDescription>{modo === 'editar' ? 'O valor anterior fica no histórico privado.' : `Todos os indicadores desta fonte e período serão ativados juntos. A coleta anterior ficará substituída, sem apagar o histórico. A estimativa Bewild permanece separada.`}</DialogDescription></DialogHeader>
      {modo === 'ativar' && <p className="text-sm">{linha?.radar_fontes?.nome ?? linha?.fonte_id} · {dataBR(linha?.periodo_inicio ?? null)} — {dataBR(linha?.periodo_fim ?? null)}</p>}
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void salvar(); }}>{modo === 'editar' && <><label className="block space-y-1 text-sm">{linha ? indicador(linha.indicador) : 'Valor'}<Input required className="text-base" inputMode="decimal" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} /></label><label className="block space-y-1 text-sm">Link da fonte<Input type="url" className="text-base" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} /></label><label className="block space-y-1 text-sm">Observação<Textarea className="text-base" maxLength={4000} value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} /></label></>}{erro && <p role="alert" className="text-destructive">{erro}</p>}<div className="flex gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setLinha(null)}>Cancelar</Button><Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? 'Salvando…' : modo === 'editar' ? 'Salvar alteração' : 'Confirmar ativação'}</Button></div></form>
    </DialogContent></Dialog>
  </main></div>;
}
