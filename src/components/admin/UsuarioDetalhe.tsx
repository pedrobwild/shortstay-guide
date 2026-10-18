import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, ShieldOff, Lock, LockOpen } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ROTULO_ACAO, ROTULO_SITUACAO, alterarBloqueio, dataBR, dataHoraBR, definirAdmin, historicoUsuario, mensagemErro, nomeExibicao,
  podeAlterarAdmin, podeBloquear, situacaoUsuario, type UsuarioAdmin,
} from "@/lib/adminUsuarios";
import SituacaoBadge from "@/components/admin/SituacaoBadge";

type Acao = "promover" | "remover" | "bloquear" | "desbloquear";

const TEXTO_ACAO: Record<Acao, { titulo: string; descricao: string; botao: string }> = {
  promover: { titulo: "Dar acesso de administrador?", descricao: "A pessoa passa a ver e alterar coletas, bairros, leads e usuários.", botao: "Dar acesso" },
  remover: { titulo: "Remover o acesso de administrador?", descricao: "A conta continua ativa, sem acesso ao admin.", botao: "Remover acesso" },
  bloquear: { titulo: "Bloquear esta conta?", descricao: "A pessoa não consegue mais entrar. Uma sessão já aberta termina quando expirar (normalmente em até 1 hora). Os projetos dela são mantidos.", botao: "Bloquear" },
  desbloquear: { titulo: "Desbloquear esta conta?", descricao: "A pessoa volta a poder entrar com o mesmo e-mail e senha.", botao: "Desbloquear" },
};

/** Painel lateral com os dados da conta, as ações de admin/bloqueio e o histórico de ações. */
export default function UsuarioDetalhe({ usuario, totalAdmins, onFechar }: { usuario: UsuarioAdmin | null; totalAdmins: number | undefined; onFechar: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [acao, setAcao] = useState<Acao | null>(null);
  const [motivo, setMotivo] = useState("");

  const historico = useQuery({
    queryKey: ["admin-usuarios-historico", usuario?.id],
    enabled: !!usuario,
    queryFn: () => historicoUsuario(usuario!.id),
  });

  const executar = useMutation({
    mutationFn: async (a: Acao): Promise<boolean> => {
      if (!usuario) return false;
      if (a === "promover" || a === "remover") return definirAdmin(usuario.id, a === "promover", motivo);
      return alterarBloqueio(usuario.id, a === "bloquear", motivo);
    },
    onSuccess: async (mudou, a) => {
      if (mudou) toast({ title: { promover: "Acesso de administrador concedido", remover: "Acesso de administrador removido", bloquear: "Conta bloqueada", desbloquear: "Conta desbloqueada" }[a] });
      else toast({ title: "Nada mudou", description: "Esta conta já estava assim — outra pessoa pode ter alterado antes. A lista foi atualizada." });
      setAcao(null);
      setMotivo("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-usuarios"] }),
        qc.invalidateQueries({ queryKey: ["admin-usuarios-resumo"] }),
        qc.invalidateQueries({ queryKey: ["admin-usuarios-historico", usuario?.id] }),
      ]);
      if (mudou) onFechar();
    },
    onError: (e) => toast({ title: "Não foi possível concluir", description: mensagemErro(e), variant: "destructive" }),
  });

  if (!usuario) return null;
  const situacao = situacaoUsuario(usuario);
  const permAdmin = podeAlterarAdmin(usuario, user?.id, totalAdmins);
  const permBloqueio = podeBloquear(usuario, user?.id);
  const bloqueado = situacao === "bloqueado";
  const souEu = usuario.id === user?.id;

  const linhas: [string, string][] = [
    ["E-mail", usuario.email ?? "—"],
    ["Cadastro", dataBR(usuario.criado_em)],
    ["Último acesso", usuario.ultimo_acesso ? dataHoraBR(usuario.ultimo_acesso) : "Nunca entrou"],
    ["E-mail confirmado", usuario.email_confirmado ? "Sim" : "Não"],
    ["Papel", usuario.admin ? "Administrador" : "Usuário"],
    ["Projetos", String(usuario.projetos)],
    ["Lead vinculado", usuario.lead_criado_em ? `${usuario.lead_bairro ?? "Sem bairro"} · ${dataBR(usuario.lead_criado_em)}` : "Nenhum"],
  ];
  if (bloqueado) linhas.splice(4, 0, ["Situação", ROTULO_SITUACAO.bloqueado]);

  const botoes: { a: Acao; rotulo: string; icone: JSX.Element; perm: { pode: boolean; motivo?: string }; destrutivo?: boolean }[] = [
    usuario.admin
      ? { a: "remover", rotulo: "Remover acesso de admin", icone: <ShieldOff className="h-4 w-4" aria-hidden="true" />, perm: permAdmin }
      : { a: "promover", rotulo: "Dar acesso de admin", icone: <ShieldCheck className="h-4 w-4" aria-hidden="true" />, perm: permAdmin },
    bloqueado
      ? { a: "desbloquear", rotulo: "Desbloquear conta", icone: <LockOpen className="h-4 w-4" aria-hidden="true" />, perm: permBloqueio }
      : { a: "bloquear", rotulo: "Bloquear conta", icone: <Lock className="h-4 w-4" aria-hidden="true" />, perm: permBloqueio, destrutivo: true },
  ];

  return (
    <Sheet open onOpenChange={(aberto) => { if (!aberto) onFechar(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-xl break-words">{nomeExibicao(usuario)}{souEu && <span className="ml-2 text-sm font-normal text-muted-foreground">(você)</span>}</SheetTitle>
          <SheetDescription className="break-all">{usuario.email}</SheetDescription>
          <div><SituacaoBadge situacao={situacao} /></div>
        </SheetHeader>

        <dl className="mt-6 divide-y divide-border text-sm">
          {linhas.map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="min-w-0 break-words text-right font-medium tabular-nums text-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-6 space-y-3" aria-labelledby="acoes-usuario">
          <h2 id="acoes-usuario" className="text-sm font-semibold text-foreground">Ações</h2>
          {botoes.map((b) => (
            <div key={b.a} className="space-y-1">
              <Button
                variant={b.destrutivo ? "destructive" : "outline"}
                className="min-h-[44px] w-full justify-start gap-2"
                disabled={!b.perm.pode || executar.isPending}
                onClick={() => { setMotivo(""); setAcao(b.a); }}
              >
                {b.icone}{b.rotulo}
              </Button>
              {!b.perm.pode && b.perm.motivo && <p className="text-xs text-muted-foreground">{b.perm.motivo}</p>}
            </div>
          ))}
        </section>

        <section className="mt-8 space-y-2" aria-labelledby="historico-usuario">
          <h2 id="historico-usuario" className="text-sm font-semibold text-foreground">Histórico de ações</h2>
          {historico.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Carregando…</p>
          ) : historico.isError ? (
            <p className="text-sm text-destructive-text">Não foi possível carregar o histórico. <button type="button" className="min-h-[44px] underline" onClick={() => void historico.refetch()}>Tentar de novo</button></p>
          ) : !historico.data?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma ação de administração nesta conta.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {historico.data.map((h) => (
                <li key={h.id} className="rounded-md border border-border bg-card p-3">
                  <p className="font-medium text-foreground">{ROTULO_ACAO[h.acao]}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">{dataHoraBR(h.feito_em)}{h.feito_por === user?.id ? " · por você" : ""}</p>
                  {h.motivo && <p className="mt-1 break-words text-muted-foreground">Motivo: {h.motivo}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>

        <AlertDialog open={acao !== null} onOpenChange={(aberto) => { if (!aberto && !executar.isPending) setAcao(null); }}>
          <AlertDialogContent>
            {acao && (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>{TEXTO_ACAO[acao].titulo}</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="block break-all font-medium text-foreground">{usuario.email}</span>
                    <span className="mt-2 block">{TEXTO_ACAO[acao].descricao}</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <label className="block space-y-1 text-sm">
                  <span>Motivo (opcional, fica no histórico)</span>
                  <Textarea value={motivo} maxLength={300} onChange={(e) => setMotivo(e.target.value)} className="min-h-[88px] text-base" />
                </label>
                <AlertDialogFooter>
                  <AlertDialogCancel className="min-h-[44px]" disabled={executar.isPending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className={acao === "bloquear" ? "min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90" : "min-h-[44px]"}
                    disabled={executar.isPending}
                    onClick={(e) => { e.preventDefault(); executar.mutate(acao); }}
                  >
                    {executar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}{TEXTO_ACAO[acao].botao}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
