import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Download, Loader2, Search } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { convidarUsuario, exportarUsuarios, listarUsuarios, mudarPapel } from "@/lib/categoriasRadar";
import { contasCsv, dataHora, descricaoProjeto, rotuloOrigemCadastro, type ContaRadar, type TipoConta } from "@/lib/usuariosAdmin";
import { formatDecimal } from "@/lib/numberFormat";

const emailSchema = z.string().trim().email("Informe um e-mail válido.").max(255);
const TIPOS: { valor: TipoConta; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todas as contas" },
  { valor: "clientes", rotulo: "Só clientes" },
  { valor: "admins", rotulo: "Só administradores" },
];

/** Espera a pessoa parar de digitar antes de buscar. */
function useAtrasado<T>(valor: T, ms = 350): T {
  const [v, setV] = useState(valor);
  useEffect(() => { const t = setTimeout(() => setV(valor), ms); return () => clearTimeout(t); }, [valor, ms]);
  return v;
}

function baixarCsv(conteudo: string, nome: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Contas do Radar: quem criou conta no site (área exclusiva ou simulador) e quem foi
 * convidado pelo admin, com os dados de cadastro (nome, e-mail, como entrou, datas e
 * projetos do simulador). Busca, filtro por tipo, exportação em CSV, convite e papel.
 * Tudo passa pela Edge Function admin-usuarios (JWT + has_role); a senha nunca aparece.
 */
export default function AdminUsuarios() {
  const cache = useQueryClient();
  const { user } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [tipo, setTipo] = useState<TipoConta>("todos");
  const [buscaDigitada, setBuscaDigitada] = useState("");
  const busca = useAtrasado(buscaDigitada.trim());
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<"admin" | "user">("user");
  const [erro, setErro] = useState("");
  useEffect(() => { setPagina(1); }, [tipo, busca]);

  const consulta = useQuery({ queryKey: ["admin_usuarios", pagina, tipo, busca], queryFn: () => listarUsuarios(pagina, tipo, busca), placeholderData: keepPreviousData });
  const exportar = useMutation({
    mutationFn: () => exportarUsuarios(tipo, busca),
    onSuccess: ({ usuarios }) => {
      const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
      baixarCsv(contasCsv(usuarios), `contas-radar-${tipo}-${hoje}.csv`);
      toast({ title: "CSV gerado", description: `${formatDecimal(usuarios.length, 0)} contas exportadas.` });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });
  const convidar = useMutation({
    mutationFn: () => convidarUsuario(email, nome, papel),
    onSuccess: () => { setEmail(""); setNome(""); setErro(""); toast({ title: "Convite enviado", description: "A pessoa recebe um e-mail para criar a senha." }); void cache.invalidateQueries({ queryKey: ["admin_usuarios"] }); },
    onError: (e: Error) => setErro(e.message),
  });
  const papelMut = useMutation({
    mutationFn: (v: { id: string; admin: boolean }) => mudarPapel(v.id, v.admin),
    onSuccess: () => { toast({ title: "Acesso atualizado" }); void cache.invalidateQueries({ queryKey: ["admin_usuarios"] }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const resumo = consulta.data?.resumo;
  return <div className="min-h-screen bg-background">
    <AppNavbar />
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminTabs />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold">Usuários</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Quem criou conta no site (área exclusiva ou simulador) e quem foi convidado, com os dados de cadastro. A senha fica só no sistema de login e nunca aparece aqui.</p>
        </div>
        <Button variant="outline" className="min-h-[44px]" disabled={exportar.isPending || !consulta.data?.encontrados} onClick={() => exportar.mutate()}>
          {exportar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
          Exportar CSV{consulta.data ? ` (${formatDecimal(consulta.data.encontrados, 0)})` : ""}
        </Button>
      </header>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Resumo das contas">
        {[
          { rotulo: "Contas", valor: resumo?.total },
          { rotulo: "Clientes", valor: resumo?.clientes },
          { rotulo: "Administradores", valor: resumo?.admins },
          { rotulo: "Novas em 7 dias", valor: resumo?.ultimos7dias },
        ].map((i) => (
          <div key={i.rotulo} className="rounded-lg border border-border bg-card p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{i.rotulo}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{i.valor == null ? "–" : formatDecimal(i.valor, 0)}</dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-4" aria-label="Contas cadastradas">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-2">
              <Label htmlFor="busca-usuario">Buscar por nome ou e-mail</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="busca-usuario" type="search" autoComplete="off" value={buscaDigitada} onChange={(e) => setBuscaDigitada(e.target.value)} className="min-h-[44px] pl-9 text-base" placeholder="ex.: maria ou @gmail" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo-usuario">Mostrar</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoConta)}>
                <SelectTrigger id="tipo-usuario" className="min-h-[44px]"><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS.map((t) => <SelectItem key={t.valor} value={t.valor}>{t.rotulo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {consulta.isPending ? <p role="status" className="py-6 text-muted-foreground">Carregando contas…</p>
            : consulta.isError ? <div role="alert" className="space-y-2 py-6"><p>{(consulta.error as Error).message}</p><Button variant="outline" className="min-h-[44px]" onClick={() => consulta.refetch()}>Tentar novamente</Button></div>
            : !consulta.data.usuarios.length ? <p role="status" className="py-6 text-muted-foreground">{busca || tipo !== "todos" ? "Nenhuma conta com esse filtro." : "Nenhuma conta criada ainda."}</p>
            : <>
              <p className="text-sm text-muted-foreground" role="status">{formatDecimal(consulta.data.encontrados, 0)} {consulta.data.encontrados === 1 ? "conta encontrada" : "contas encontradas"}, da mais recente para a mais antiga{consulta.isFetching ? " · atualizando…" : ""}.</p>
              <ul className="divide-y divide-border border-y border-border">
                {consulta.data.usuarios.map((u) => <LinhaConta key={u.id} u={u} euMesmo={u.id === user?.id} ocupado={papelMut.isPending} onPapel={() => {
                  if (u.admin && !window.confirm(`Tirar o acesso de administrador de ${u.email}?`)) return;
                  if (!u.admin && !window.confirm(`Dar acesso de administrador a ${u.email}? A pessoa passa a ver todo o admin, inclusive estes dados.`)) return;
                  papelMut.mutate({ id: u.id, admin: !u.admin });
                }} />)}
              </ul>
            </>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" className="min-h-[44px]" disabled={pagina === 1 || consulta.isFetching} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
            <span className="text-sm text-muted-foreground">Página {pagina}</span>
            <Button variant="outline" className="min-h-[44px]" disabled={consulta.isFetching || !consulta.data?.temMais} onClick={() => setPagina(pagina + 1)}>Próxima</Button>
          </div>
        </section>

        <form aria-label="Convidar usuário" className="min-w-0 space-y-4 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); const r = emailSchema.safeParse(email); if (!r.success) { setErro(r.error.issues[0].message); return; } convidar.mutate(); }}>
          <h2 className="font-display text-xl font-semibold">Cadastrar usuário</h2>
          <fieldset disabled={convidar.isPending} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email-usuario">E-mail</Label><Input id="email-usuario" type="email" autoComplete="off" required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-[44px] text-base" /></div>
            <div className="space-y-2"><Label htmlFor="nome-usuario">Nome (opcional)</Label><Input id="nome-usuario" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} className="min-h-[44px] text-base" /></div>
            <div className="space-y-2"><Label htmlFor="papel-usuario">Acesso</Label><Select value={papel} onValueChange={(v) => setPapel(v as "admin" | "user")}><SelectTrigger id="papel-usuario" className="min-h-[44px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">Cliente da área logada</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent></Select></div>
            {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="min-h-[44px] w-full">{convidar.isPending ? "Enviando…" : "Enviar convite"}</Button>
            <p className="text-xs text-muted-foreground">A pessoa recebe um e-mail do Radar Bewild com o link para criar a própria senha.</p>
          </fieldset>
        </form>
      </div>
    </main>
  </div>;
}

function LinhaConta({ u, euMesmo, ocupado, onPapel }: { u: ContaRadar; euMesmo: boolean; ocupado: boolean; onPapel: () => void }) {
  const origem = u.origem === "convite" ? "Convite do admin" : `Cadastro no site${u.origem_cadastro ? ` · ${rotuloOrigemCadastro(u.origem_cadastro)}` : ""}`;
  return <li className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
    <div className="min-w-0">
      <p className="font-semibold">{u.nome || <span className="font-normal italic text-muted-foreground">Sem nome</span>}</p>
      <p className="break-all text-sm">{u.email}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge variant={u.admin ? "default" : "outline"}>{u.admin ? "Administrador" : "Cliente"}</Badge>
        <Badge variant="secondary">{origem}</Badge>
        {!u.confirmado && <Badge variant="outline">{u.origem === "convite" ? "Convite pendente" : "E-mail não confirmado"}</Badge>}
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-1.5"><dt className="text-muted-foreground">Cadastro:</dt><dd className="tabular-nums">{dataHora(u.criado_em) || "–"}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted-foreground">Último acesso:</dt><dd className="tabular-nums">{dataHora(u.ultimo_acesso) || "nunca"}</dd></div>
        <div className="flex gap-1.5"><dt className="text-muted-foreground">E-mail confirmado:</dt><dd className="tabular-nums">{dataHora(u.confirmado_em) || "não"}</dd></div>
        <div className="flex min-w-0 gap-1.5 sm:col-span-2"><dt className="shrink-0 text-muted-foreground">Projetos:</dt><dd className="min-w-0">{u.projetos.length ? u.projetos.map(descricaoProjeto).join(" | ") : "nenhum"}</dd></div>
      </dl>
    </div>
    <Button variant="outline" className="min-h-[44px] justify-self-start" disabled={ocupado || (u.admin && euMesmo)} onClick={onPapel}>{u.admin ? "Tirar acesso de admin" : "Tornar administrador"}</Button>
  </li>;
}
