import { useCallback, useEffect, useMemo, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { MATERIAIS } from "@/lib/pedidosMaterial";
import {
  ROTULO_STATUS,
  STATUS_COMERCIAL,
  TAMANHO_PAGINA,
  atualizarStatus,
  exigeMotivo,
  listarPedidos,
  patchValido,
  pedidosParaCsv,
  resumoPedidos,
  statusValido,
  type PedidoAdmin,
  type StatusComercial,
} from "@/lib/pedidosAdmin";

const PERIODOS = [
  { valor: "todos", rotulo: "Todo o período", dias: null },
  { valor: "7", rotulo: "Últimos 7 dias", dias: 7 },
  { valor: "30", rotulo: "Últimos 30 dias", dias: 30 },
  { valor: "90", rotulo: "Últimos 90 dias", dias: 90 },
] as const;

const dataBR = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

/** Linha da tabela: status inline, responsável (salva ao sair do campo ou Enter) e motivo nos status negativos. */
function LinhaPedido({ pedido, onSalvo }: { pedido: PedidoAdmin; onSalvo: (p: PedidoAdmin) => void }) {
  const [status, setStatus] = useState<StatusComercial>(pedido.status_comercial);
  const [responsavel, setResponsavel] = useState(pedido.responsavel ?? "");
  const [motivo, setMotivo] = useState(pedido.motivo_perda ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const pendente = status !== pedido.status_comercial;
  const precisaMotivo = exigeMotivo(status);

  const salvar = async (alvo: StatusComercial, resp: string, mot: string) => {
    const patch = {
      status_comercial: alvo,
      responsavel: resp.trim() || null,
      motivo_perda: exigeMotivo(alvo) ? mot.trim() || null : null,
    };
    if (!patchValido(patch)) {
      setErro("Informe o motivo para marcar como perdido ou fora do perfil.");
      return;
    }
    setSalvando(true);
    setErro(null);
    const ok = await atualizarStatus(pedido.id, patch);
    setSalvando(false);
    if (!ok) {
      setErro("Não foi possível salvar. Tente novamente.");
      return;
    }
    onSalvo({ ...pedido, ...patch, atualizado_em: new Date().toISOString() });
  };

  const mudarStatus = (v: string) => {
    if (!statusValido(v)) return;
    setStatus(v);
    setErro(null);
    // Status negativo espera o motivo; os demais salvam na hora.
    if (!exigeMotivo(v)) void salvar(v, responsavel, motivo);
  };

  const salvarResponsavel = () => {
    if ((responsavel.trim() || null) === pedido.responsavel) return;
    void salvar(pendente && !precisaMotivo ? status : pedido.status_comercial, responsavel, pedido.motivo_perda ?? "");
  };

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">{pedido.email}</TableCell>
      <TableCell>{pedido.nome ?? "—"}</TableCell>
      <TableCell>{MATERIAIS[pedido.material]?.titulo ?? pedido.material}</TableCell>
      <TableCell>{pedido.etapa ?? "—"}</TableCell>
      <TableCell>{pedido.bairro ?? "—"}</TableCell>
      <TableCell>{pedido.origem}</TableCell>
      <TableCell>{pedido.boletim ? <Badge variant="secondary">Boletim</Badge> : "—"}</TableCell>
      <TableCell>{pedido.contato_comercial ? <Badge variant="secondary">Aceitou</Badge> : <Badge variant="outline">Não contatar</Badge>}</TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">{dataBR.format(new Date(pedido.created_at))}</TableCell>
      <TableCell className="min-w-[200px] space-y-2">
        <Select value={status} onValueChange={mudarStatus} disabled={salvando}>
          <SelectTrigger className="min-h-[44px]" aria-label={`Status de ${pedido.email}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_COMERCIAL.map((s) => (
              <SelectItem key={s} value={s}>
                {ROTULO_STATUS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {precisaMotivo && (
          <div className="flex gap-2">
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void salvar(status, responsavel, motivo)}
              placeholder="Motivo (obrigatório)"
              aria-label={`Motivo para ${pedido.email}`}
              maxLength={200}
              className="min-h-[44px] text-base"
            />
            {pendente && (
              <Button size="sm" className="min-h-[44px]" disabled={salvando} onClick={() => void salvar(status, responsavel, motivo)}>
                Salvar
              </Button>
            )}
          </div>
        )}
        {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
      </TableCell>
      <TableCell className="min-w-[160px]">
        <Input
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          onBlur={salvarResponsavel}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder="Responsável"
          aria-label={`Responsável por ${pedido.email}`}
          maxLength={80}
          disabled={salvando}
          className="min-h-[44px] text-base"
        />
      </TableCell>
    </TableRow>
  );
}

/** /admin/pedidos — pedidos de material por e-mail, entregues ao comercial (só admin, sem medição). */
export default function AdminPedidos() {
  const [status, setStatus] = useState<StatusComercial | "todos">("todos");
  const [periodo, setPeriodo] = useState<string>("todos");
  // Por padrão só entram (tabela e CSV) quem aceitou o contato comercial.
  const [soContato, setSoContato] = useState(true);
  const [linhas, setLinhas] = useState<PedidoAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [haMais, setHaMais] = useState(false);

  const params = useMemo(() => {
    const dias = PERIODOS.find((p) => p.valor === periodo)?.dias ?? null;
    return {
      status: status === "todos" ? null : status,
      soContato,
      desde: dias ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000) : null,
    };
  }, [status, periodo, soContato]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const pagina = await listarPedidos(params, {});
      setLinhas(pagina);
      setHaMais(pagina.length === TAMANHO_PAGINA);
    } catch {
      setErro("Não foi possível carregar os pedidos.");
    } finally {
      setCarregando(false);
    }
  }, [params]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const carregarMais = async () => {
    const ultimo = linhas[linhas.length - 1];
    if (!ultimo) return;
    setCarregandoMais(true);
    try {
      const pagina = await listarPedidos(params, { apos: { created_at: ultimo.created_at, id: ultimo.id } });
      setLinhas((atual) => [...atual, ...pagina]);
      setHaMais(pagina.length === TAMANHO_PAGINA);
    } catch {
      setErro("Não foi possível carregar mais pedidos.");
    } finally {
      setCarregandoMais(false);
    }
  };

  const exportar = () => {
    const blob = new Blob([pedidosParaCsv(linhas)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-material-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const atualizarLinha = (p: PedidoAdmin) => setLinhas((atual) => atual.map((l) => (l.id === p.id ? p : l)));
  const resumo = useMemo(() => resumoPedidos(linhas), [linhas]);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <AdminTabs />
        <header className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Pedidos de material</h1>
          <p className="text-sm text-muted-foreground">
            Quem pediu o material por e-mail. Acompanhe o status comercial e o responsável; o resumo conta os pedidos carregados.
          </p>
        </header>

        <section aria-label="Resumo" className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="tabular-nums">Total: {resumo.total}</Badge>
          {STATUS_COMERCIAL.map((s) => (
            <Badge key={s} variant="outline" className="tabular-nums">
              {ROTULO_STATUS[s]}: {resumo.porStatus[s]}
            </Badge>
          ))}
          <Badge variant="secondary" className="tabular-nums">Querem o boletim: {resumo.boletim}</Badge>
          <Badge variant="secondary" className="tabular-nums">aceitaram contato: {resumo.contatoComercial}</Badge>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={status} onValueChange={(v) => setStatus(statusValido(v) ? v : "todos")}>
            <SelectTrigger className="w-[200px] min-h-[44px]" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_COMERCIAL.map((s) => (
                <SelectItem key={s} value={s}>
                  {ROTULO_STATUS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px] min-h-[44px]" aria-label="Filtrar por período">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.valor} value={p.valor}>
                  {p.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex min-h-[44px] items-center gap-2">
            <Checkbox id="so-contato" checked={soContato} onCheckedChange={(v) => setSoContato(v === true)} className="h-5 w-5" />
            <label htmlFor="so-contato" className="cursor-pointer py-2 text-sm leading-snug">Só quem aceitou contato comercial</label>
          </div>
          <Button variant="outline" className="min-h-[44px] ml-auto" onClick={exportar} disabled={linhas.length === 0}>
            <Download className="h-4 w-4 mr-2" aria-hidden /> Exportar CSV
          </Button>
        </div>

        {carregando ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Carregando pedidos…
          </div>
        ) : erro && linhas.length === 0 ? (
          <div role="alert" className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
            <p className="text-sm text-muted-foreground">{erro}</p>
            <Button variant="outline" className="min-h-[44px]" onClick={() => void carregar()}>
              Tentar de novo
            </Button>
          </div>
        ) : linhas.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{soContato ? "Nenhum pedido de quem aceitou contato comercial. Desmarque o filtro para ver os demais." : "Nenhum pedido ainda."}</p>
        ) : (
          <>
            {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Boletim</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((p) => (
                    <LinhaPedido key={`${p.id}-${p.atualizado_em}`} pedido={p} onSalvo={atualizarLinha} />
                  ))}
                </TableBody>
              </Table>
            </div>
            {haMais && (
              <div className="flex justify-center">
                <Button variant="outline" className="min-h-[44px]" onClick={() => void carregarMais()} disabled={carregandoMais}>
                  {carregandoMais && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden />} Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
