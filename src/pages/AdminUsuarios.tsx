import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { convidarUsuario, listarUsuarios, mudarPapel } from "@/lib/categoriasRadar";

const emailSchema = z.string().trim().email("Informe um e-mail válido.").max(255);
const data = (v: string | null) => (v ? new Date(v).toLocaleDateString("pt-BR") : "nunca");

export default function AdminUsuarios() {
  const cache = useQueryClient();
  const { user } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<"admin" | "user">("user");
  const [erro, setErro] = useState("");
  const consulta = useQuery({ queryKey: ["admin_usuarios", pagina], queryFn: () => listarUsuarios(pagina) });
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
  return <div className="min-h-screen bg-background">
    <AppNavbar />
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminTabs />
      <header><h1 className="font-display text-3xl font-bold">Usuários</h1><p className="mt-2 text-sm text-muted-foreground">Administradores do Radar e clientes da área logada</p></header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-4" aria-label="Usuários cadastrados">
          {consulta.isPending ? <p role="status">Carregando usuários…</p> : consulta.isError ? <div role="alert" className="space-y-2"><p>{(consulta.error as Error).message}</p><Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button></div> : !consulta.data.usuarios.length ? <p role="status" className="text-muted-foreground">Nenhum usuário nesta página.</p> :
            <ul className="divide-y divide-border border-y border-border">{consulta.data.usuarios.map((u) => <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0"><p className="break-all font-medium">{u.email}</p><p className="text-sm text-muted-foreground">{u.nome || "Sem nome"} · criado em {data(u.criado_em)} · último acesso {data(u.ultimo_acesso)}</p>
                <div className="mt-1 flex flex-wrap gap-2"><Badge variant={u.admin ? "default" : "outline"}>{u.admin ? "Administrador" : "Cliente"}</Badge>{!u.confirmado && <Badge variant="outline">Convite pendente</Badge>}</div></div>
              <Button variant="outline" className="min-h-[44px]" disabled={papelMut.isPending || (u.admin && u.id === user?.id)} onClick={() => { if (u.admin && !window.confirm(`Tirar o acesso de administrador de ${u.email}?`)) return; papelMut.mutate({ id: u.id, admin: !u.admin }); }}>{u.admin ? "Tirar acesso de admin" : "Tornar administrador"}</Button>
            </li>)}</ul>}
          <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" disabled={pagina === 1 || consulta.isFetching} onClick={() => setPagina(pagina - 1)}>Anterior</Button><span className="text-sm text-muted-foreground">Página {pagina}</span><Button variant="outline" disabled={consulta.isFetching || !consulta.data?.temMais} onClick={() => setPagina(pagina + 1)}>Próxima</Button></div>
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
