import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Search, ShieldCheck, Users } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import SituacaoBadge from "@/components/admin/SituacaoBadge";
import UsuarioDetalhe from "@/components/admin/UsuarioDetalhe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { formatDecimal } from "@/lib/numberFormat";
import {
  FILTROS_USUARIOS, POR_PAGINA, dataBR, dataHoraBR, listarUsuarios, mensagemErro, nomeExibicao, resumoUsuarios, situacaoUsuario,
  type FiltroUsuarios, type UsuarioAdmin,
} from "@/lib/adminUsuarios";

const inteiro = (n: number) => formatDecimal(n, 0);

/** Espera a pessoa parar de digitar antes de buscar no banco. */
function useAtrasado<T>(valor: T, ms = 300): T {
  const [v, setV] = useState(valor);
  useEffect(() => { const t = window.setTimeout(() => setV(valor), ms); return () => window.clearTimeout(t); }, [valor, ms]);
  return v;
}

/** /admin/usuarios: contas cadastradas no Radar, papel de admin e bloqueio de acesso. */
export default function AdminUsuarios() {
  const { user } = useAuth();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltroBruto] = useState<FiltroUsuarios>("todos");
  const [pagina, setPagina] = useState(0);
  const [selecionado, setSelecionado] = useState<UsuarioAdmin | null>(null);
  const buscaAtrasada = useAtrasado(busca);
  // A página volta para a primeira junto com a troca de critério (sem uma busca a mais com o offset antigo).
  const [criterio, setCriterio] = useState(buscaAtrasada);
  if (criterio !== buscaAtrasada) { setCriterio(buscaAtrasada); setPagina(0); }
  const setFiltro = (f: FiltroUsuarios) => { setFiltroBruto(f); setPagina(0); };

  const resumo = useQuery({ queryKey: ["admin-usuarios-resumo"], queryFn: resumoUsuarios });
  const lista = useQuery({
    queryKey: ["admin-usuarios", buscaAtrasada, filtro, pagina],
    queryFn: () => listarUsuarios({ busca: buscaAtrasada, filtro, pagina }),
    placeholderData: keepPreviousData,
  });

  const total = lista.data?.total ?? 0;
  // Página ficou vazia depois de uma ação (ex.: o último bloqueado da página foi desbloqueado): volta uma.
  useEffect(() => {
    if (!lista.isFetching && !lista.isError && pagina > 0 && lista.data && lista.data.usuarios.length === 0) setPagina((p) => Math.max(0, p - 1));
  }, [lista.isFetching, lista.isError, lista.data, pagina]);
  // O painel lê o usuário da lista atual (dado novo após recarregar), não a cópia do clique.
  const atual = selecionado ? (lista.data?.usuarios.find((u) => u.id === selecionado.id) ?? selecionado) : null;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const usuarios = lista.data?.usuarios ?? [];
  const inicio = total ? pagina * POR_PAGINA + 1 : 0;
  const fim = Math.min(total, (pagina + 1) * POR_PAGINA);

  const cartoes: { rotulo: string; valor: number | undefined; filtro?: FiltroUsuarios }[] = [
    { rotulo: "Usuários cadastrados", valor: resumo.data?.total, filtro: "todos" },
    { rotulo: "Novos em 7 dias", valor: resumo.data?.novos_7d },
    { rotulo: "Entraram em 30 dias", valor: resumo.data?.ativos_30d },
    { rotulo: "Administradores", valor: resumo.data?.admins, filtro: "admins" },
    { rotulo: "E-mail não confirmado", valor: resumo.data?.nao_confirmados, filtro: "nao_confirmados" },
    { rotulo: "Bloqueados", valor: resumo.data?.bloqueados, filtro: "bloqueados" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <AdminTabs />
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground">Contas criadas no Radar. Dê ou remova acesso de administrador e bloqueie contas; cada ação fica no histórico da conta.</p>
        </div>

        <section aria-label="Resumo dos usuários" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {cartoes.map((c) => {
            const conteudo = (
              <>
                <span className="block text-xs text-muted-foreground">{c.rotulo}</span>
                <span className="mt-1 block font-display text-2xl font-semibold tabular-nums text-foreground">
                  {resumo.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Carregando" /> : resumo.isError ? "—" : inteiro(c.valor ?? 0)}
                </span>
              </>
            );
            return c.filtro ? (
              <button
                key={c.rotulo}
                type="button"
                onClick={() => setFiltro(c.filtro!)}
                aria-pressed={filtro === c.filtro}
                className={`min-h-[44px] rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary ${filtro === c.filtro ? "border-primary" : "border-border"}`}
              >
                {conteudo}
              </button>
            ) : (
              <div key={c.rotulo} className="rounded-lg border border-border bg-card p-3">{conteudo}</div>
            );
          })}
        </section>
        {resumo.isError && <p className="text-sm text-destructive-text">Não foi possível carregar o resumo: {mensagemErro(resumo.error)}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Buscar por e-mail ou nome</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por e-mail ou nome" className="min-h-[44px] pl-9 text-base" maxLength={120} />
          </label>
          <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroUsuarios)}>
            <SelectTrigger className="min-h-[44px] text-base sm:w-[240px]" aria-label="Filtrar usuários"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FILTROS_USUARIOS.map((f) => <SelectItem key={f.id} value={f.id}>{f.rotulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {lista.isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Carregando usuários…</div>
        ) : lista.isError ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive-border bg-destructive-light p-4 text-sm text-destructive-text">
            <p className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />Não foi possível carregar os usuários: {mensagemErro(lista.error)}</p>
            <Button variant="outline" className="min-h-[44px]" onClick={() => void lista.refetch()}>Tentar de novo</Button>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Users className="h-6 w-6" aria-hidden="true" />
            <p>{buscaAtrasada || filtro !== "todos" ? "Nenhum usuário com esses critérios." : "Ainda não há usuários cadastrados."}</p>
            {(buscaAtrasada || filtro !== "todos") && <Button variant="link" className="min-h-[44px]" onClick={() => { setBusca(""); setFiltro("todos"); }}>Limpar busca e filtro</Button>}
          </div>
        ) : (
          <>
            <ul className={`divide-y divide-border overflow-hidden rounded-lg border border-border bg-card ${lista.isFetching ? "opacity-70" : ""}`} aria-busy={lista.isFetching}>
              <li className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,1fr)] gap-4 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground lg:grid" aria-hidden="true">
                <span>Usuário</span><span>Cadastro</span><span>Último acesso</span><span>Projetos</span><span>Situação</span>
              </li>
              {usuarios.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => setSelecionado(u)}
                    className="grid min-h-[56px] w-full grid-cols-1 gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,1fr)] lg:items-center lg:gap-4"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <span className="truncate">{nomeExibicao(u)}</span>
                        {u.admin && <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Administrador" />}
                        {u.id === user?.id && <span className="shrink-0 text-xs font-normal text-muted-foreground">(você)</span>}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">{u.email}</span>
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground lg:text-foreground"><span className="lg:hidden">Cadastro: </span>{dataBR(u.criado_em)}</span>
                    <span className="text-sm tabular-nums text-muted-foreground lg:text-foreground"><span className="lg:hidden">Último acesso: </span>{u.ultimo_acesso ? dataHoraBR(u.ultimo_acesso) : "Nunca entrou"}</span>
                    <span className="text-sm tabular-nums text-muted-foreground lg:text-foreground"><span className="lg:hidden">Projetos: </span>{inteiro(u.projetos)}</span>
                    <span><SituacaoBadge situacao={situacaoUsuario(u)} /></span>
                  </button>
                </li>
              ))}
            </ul>

            <nav aria-label="Páginas da lista de usuários" className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
              <p className="tabular-nums">{inteiro(inicio)}–{inteiro(fim)} de {inteiro(total)}</p>
              <div className="flex gap-2">
                <Button variant="outline" className="min-h-[44px]" disabled={pagina === 0 || lista.isFetching} onClick={() => setPagina((p) => Math.max(0, p - 1))}><ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />Anterior</Button>
                <Button variant="outline" className="min-h-[44px]" disabled={pagina + 1 >= paginas || lista.isFetching} onClick={() => setPagina((p) => p + 1)}>Próxima<ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Button>
              </div>
            </nav>
          </>
        )}
      </main>
      {atual && <UsuarioDetalhe usuario={atual} totalAdmins={resumo.data?.admins} onFechar={() => setSelecionado(null)} />}
    </div>
  );
}
