import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, ImagePlus, Pencil, Plus, Save, Trash2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import FotoPredio from "@/components/empreendimentos/FotoPredio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { toast } from "@/hooks/use-toast";
import {
  caminhoEmpreendimento, diferenciaisDoTexto, empreendimentoSchema, enviarFotoEmpreendimento, filtrarEmpreendimentos,
  listarEmpreendimentosAdmin, mensagemErroSalvar, salvarEmpreendimento, slugEmpreendimento, SITUACOES, STATUS_EMPREENDIMENTO,
  TIPOS_FOTO, type Empreendimento, type StatusEmpreendimento,
} from "@/lib/empreendimentos";

type Form = {
  nome: string; slug: string; bairro: string; endereco: string; incorporadora: string; tipologias: string;
  situacao: string; entrega: string; resumo: string; diferenciais: string; fonte_url: string; fonte_titulo: string;
  fonte_consultada_em: string; foto_url: string; foto_alt: string; foto_credito: string; selo_bewild: boolean; status: StatusEmpreendimento;
};

const SEM_SITUACAO = "nao_informada";
const vazio: Form = {
  nome: "", slug: "", bairro: "", endereco: "", incorporadora: "", tipologias: "", situacao: SEM_SITUACAO, entrega: "",
  resumo: "", diferenciais: "", fonte_url: "", fonte_titulo: "", fonte_consultada_em: "", foto_url: "", foto_alt: "",
  foto_credito: "", selo_bewild: true, status: "rascunho",
};

function paraForm(e: Empreendimento): Form {
  return {
    nome: e.nome, slug: e.slug, bairro: e.bairro, endereco: e.endereco ?? "", incorporadora: e.incorporadora ?? "",
    tipologias: e.tipologias ?? "", situacao: e.situacao ?? SEM_SITUACAO, entrega: e.entrega ?? "", resumo: e.resumo,
    diferenciais: e.diferenciais.join("\n"), fonte_url: e.fonte_url ?? "", fonte_titulo: e.fonte_titulo ?? "",
    fonte_consultada_em: e.fonte_consultada_em ?? "", foto_url: e.foto_url ?? "", foto_alt: e.foto_alt ?? "",
    foto_credito: e.foto_credito ?? "", selo_bewild: e.selo_bewild, status: e.status,
  };
}

function paraEntrada(f: Form) {
  return {
    ...f,
    situacao: f.situacao === SEM_SITUACAO ? null : (f.situacao as keyof typeof SITUACOES),
    diferenciais: diferenciaisDoTexto(f.diferenciais),
  };
}

/**
 * /admin/empreendimentos — cadastro do catálogo público (/empreendimentos). Só o
 * prédio: nunca nome de cliente, unidade, contrato ou valores. Fotos só com direito
 * de uso (da Bewild ou cedidas pela incorporadora); sem foto, o site mostra uma
 * ilustração neutra.
 */
export default function AdminEmpreendimentos() {
  const cache = useQueryClient();
  const [filtro, setFiltro] = useState<"todos" | StatusEmpreendimento>("todos");
  const [busca, setBusca] = useState("");
  const [id, setId] = useState<string>();
  const [form, setForm] = useState<Form>(vazio);
  const [slugManual, setSlugManual] = useState(false);
  const [erro, setErro] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const consulta = useQuery({ queryKey: ["empreendimentos_admin"], queryFn: listarEmpreendimentosAdmin });
  const todos = useMemo(() => consulta.data ?? [], [consulta.data]);
  const lista = useMemo(
    () => filtrarEmpreendimentos(todos.filter((e) => filtro === "todos" || e.status === filtro), { busca }),
    [todos, filtro, busca],
  );
  const contagem = useMemo(() => {
    const c: Record<string, number> = { todos: todos.length };
    for (const e of todos) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [todos]);
  const sugestoesBairro = useMemo(
    () => [...new Set([...BAIRROS_CURADOS.map((b) => b.name), ...todos.map((e) => e.bairro)])].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [todos],
  );

  const salvar = useMutation({
    mutationFn: () => salvarEmpreendimento(paraEntrada(form), id),
    onSuccess: (novoId) => {
      setId(novoId);
      setErro("");
      void cache.invalidateQueries({ queryKey: ["empreendimentos_admin"] });
      void cache.invalidateQueries({ queryKey: ["empreendimentos_publicos"] });
      void cache.invalidateQueries({ queryKey: ["empreendimento"] });
      toast({ title: form.status === "publicado" ? "Empreendimento publicado no Radar" : "Empreendimento salvo" });
    },
    onError: (e) => setErro(mensagemErroSalvar(e)),
  });

  const campo = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const mudarNome = (nome: string) => setForm((f) => ({ ...f, nome, slug: slugManual ? f.slug : slugEmpreendimento(nome) }));

  function editar(e: Empreendimento) {
    setId(e.id);
    setForm(paraForm(e));
    setSlugManual(true);
    setErro("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function novo() {
    setId(undefined);
    setForm(vazio);
    setSlugManual(false);
    setErro("");
  }

  async function escolherFoto(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    const slug = form.slug || slugEmpreendimento(form.nome);
    if (!slug) { setErro("Informe o nome antes de enviar a foto."); return; }
    setEnviandoFoto(true);
    setErro("");
    try {
      const url = await enviarFotoEmpreendimento(f, slug);
      campo("foto_url", url);
      toast({ title: "Foto enviada", description: "Salve o empreendimento para a foto aparecer no site." });
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  const ocupado = salvar.isPending || enviandoFoto;
  const previa = { nome: form.nome || "Empreendimento", bairro: form.bairro || "bairro", foto_url: /^https:\/\//.test(form.foto_url) ? form.foto_url : null, foto_alt: form.foto_alt || null, foto_credito: form.foto_credito || null };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <AdminTabs />
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Empreendimentos</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Catálogo público em <Link to="/empreendimentos" className="text-primary underline underline-offset-2">/empreendimentos</Link>. Só o prédio: nunca nome de cliente, número de unidade ou valores. Diferenciais e situação seguem a fonte (página oficial ou portal), com a data da consulta.
            </p>
          </div>
          <Button variant="outline" disabled={ocupado} onClick={novo} className="min-h-[44px]"><Plus className="mr-2 h-4 w-4" />Novo empreendimento</Button>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section className="min-w-0 space-y-4" aria-label="Empreendimentos cadastrados">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="filtro-empreendimentos">Status</Label>
                <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
                  <SelectTrigger id="filtro-empreendimentos" className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos ({contagem.todos ?? 0})</SelectItem>
                    {Object.entries(STATUS_EMPREENDIMENTO).map(([k, v]) => <SelectItem key={k} value={k}>{v} ({contagem[k] ?? 0})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="busca-empreendimentos">Buscar</Label>
                <Input id="busca-empreendimentos" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, bairro ou incorporadora" className="min-h-[44px] text-base" />
              </div>
            </div>
            {consulta.isPending ? <p role="status">Carregando empreendimentos…</p>
              : consulta.isError ? <div role="alert" className="space-y-2"><p>Não foi possível carregar os empreendimentos.</p><Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button></div>
              : !lista.length ? <p role="status" className="py-8 text-muted-foreground">Nenhum empreendimento {filtro === "todos" ? "cadastrado" : "neste status"}{busca ? " com essa busca" : ""}.</p>
              : (
                <ul className="divide-y divide-border border-y border-border">
                  {lista.map((e) => (
                    <li key={e.id} className="space-y-2 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={e.status === "publicado" ? "default" : "outline"}>{STATUS_EMPREENDIMENTO[e.status]}</Badge>
                        <span className="text-xs text-muted-foreground">{e.bairro}</span>
                        {!e.foto_url && <span className="text-xs text-muted-foreground">· sem foto</span>}
                        {!e.fonte_url && <span className="text-xs text-destructive">· sem fonte</span>}
                      </div>
                      <h2 className="break-words font-display text-lg font-semibold">{e.nome}</h2>
                      {e.incorporadora && <p className="break-words text-sm text-muted-foreground">{e.incorporadora}</p>}
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="min-h-[44px]" disabled={ocupado} onClick={() => editar(e)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
                        {e.status === "publicado" && (
                          <Button asChild variant="ghost" className="min-h-[44px]"><Link to={caminhoEmpreendimento(e.slug)}>Ver no site</Link></Button>
                        )}
                        {e.fonte_url && (
                          <Button asChild variant="ghost" className="min-h-[44px]"><a href={e.fonte_url} target="_blank" rel="noopener noreferrer">Fonte<ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </section>

          <form
            ref={formRef}
            aria-label="Editar empreendimento"
            className="min-w-0 scroll-mt-24 space-y-5 border-t border-border pt-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              const r = empreendimentoSchema.safeParse(paraEntrada(form));
              if (!r.success) { setErro(r.error.issues[0]?.message ?? "Confira os campos."); return; }
              salvar.mutate();
            }}
          >
            <h2 className="font-display text-xl font-semibold">{id ? "Editar empreendimento" : "Novo empreendimento"}</h2>
            <fieldset disabled={ocupado} className="min-w-0 space-y-5">
              <div className="space-y-2"><Label htmlFor="emp-nome">Nome do empreendimento</Label><Input id="emp-nome" required maxLength={120} value={form.nome} onChange={(e) => mudarNome(e.target.value)} className="min-h-[44px] text-base" /></div>
              <div className="space-y-2">
                <Label htmlFor="emp-slug">Endereço da página</Label>
                <Input id="emp-slug" required maxLength={120} value={form.slug} onChange={(e) => { setSlugManual(true); campo("slug", e.target.value.toLowerCase()); }} className="min-h-[44px] text-base" />
                <p className="text-xs text-muted-foreground">radarbewild.com.br/empreendimentos/{form.slug || "…"}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="emp-bairro">Bairro</Label><Input id="emp-bairro" required list="emp-bairros" maxLength={80} value={form.bairro} onChange={(e) => campo("bairro", e.target.value)} className="min-h-[44px] text-base" /><datalist id="emp-bairros">{sugestoesBairro.map((b) => <option key={b} value={b} />)}</datalist></div>
                <div className="space-y-2"><Label htmlFor="emp-incorporadora">Incorporadora</Label><Input id="emp-incorporadora" maxLength={120} value={form.incorporadora} onChange={(e) => campo("incorporadora", e.target.value)} className="min-h-[44px] text-base" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="emp-endereco">Endereço (rua e número, se públicos)</Label><Input id="emp-endereco" maxLength={160} value={form.endereco} onChange={(e) => campo("endereco", e.target.value)} className="min-h-[44px] text-base" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emp-situacao">Situação</Label>
                  <Select value={form.situacao} onValueChange={(v) => campo("situacao", v)}>
                    <SelectTrigger id="emp-situacao" className="min-h-[44px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SEM_SITUACAO}>Não informada</SelectItem>
                      {Object.entries(SITUACOES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="emp-entrega">Entrega (ex.: dez/2026)</Label><Input id="emp-entrega" maxLength={40} value={form.entrega} onChange={(e) => campo("entrega", e.target.value)} className="min-h-[44px] text-base" /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="emp-tipologias">Unidades (ex.: studios de 24 a 35 m²)</Label><Input id="emp-tipologias" maxLength={160} value={form.tipologias} onChange={(e) => campo("tipologias", e.target.value)} className="min-h-[44px] text-base" /></div>
              <div className="space-y-2"><Label htmlFor="emp-resumo">Resumo (1 a 2 frases, sem promessa de renda)</Label><Textarea id="emp-resumo" maxLength={600} value={form.resumo} onChange={(e) => campo("resumo", e.target.value)} className="text-base" /></div>
              <div className="space-y-2">
                <Label htmlFor="emp-diferenciais">Diferenciais (um por linha, até 10)</Label>
                <Textarea id="emp-diferenciais" rows={6} value={form.diferenciais} onChange={(e) => campo("diferenciais", e.target.value)} className="text-base" />
                <p className="text-xs text-muted-foreground">{diferenciaisDoTexto(form.diferenciais).length} de 10 · escreva com suas palavras, sem copiar o texto da incorporadora.</p>
              </div>

              <fieldset className="min-w-0 space-y-4 border-t border-border pt-4">
                <legend className="font-display text-base font-semibold">Fonte</legend>
                <div className="space-y-2"><Label htmlFor="emp-fonte-url">Link da fonte (página oficial ou portal)</Label><Input id="emp-fonte-url" type="url" value={form.fonte_url} onChange={(e) => campo("fonte_url", e.target.value)} placeholder="https://" className="min-h-[44px] text-base" /></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="emp-fonte-titulo">Título da fonte</Label><Input id="emp-fonte-titulo" maxLength={120} value={form.fonte_titulo} onChange={(e) => campo("fonte_titulo", e.target.value)} placeholder="Página oficial — Incorporadora" className="min-h-[44px] text-base" /></div>
                  <div className="space-y-2"><Label htmlFor="emp-fonte-data">Consultada em</Label><Input id="emp-fonte-data" type="date" value={form.fonte_consultada_em} onChange={(e) => campo("fonte_consultada_em", e.target.value)} className="min-h-[44px] text-base" /></div>
                </div>
              </fieldset>

              <fieldset className="min-w-0 space-y-4 border-t border-border pt-4">
                <legend className="font-display text-base font-semibold">Foto do prédio</legend>
                <p className="text-xs text-muted-foreground">Só fotos com direito de uso: da Bewild ou cedidas pela incorporadora. JPG, PNG ou WebP; o envio reduz para até 1.600 px.</p>
                <FotoPredio e={previa} className="max-w-sm" />
                <div className="flex flex-wrap gap-2">
                  <input ref={arquivo} type="file" accept={TIPOS_FOTO.join(",")} className="sr-only" onChange={escolherFoto} tabIndex={-1} aria-hidden="true" />
                  <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => arquivo.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />{enviandoFoto ? "Enviando…" : form.foto_url ? "Trocar foto" : "Enviar foto"}</Button>
                  {form.foto_url && <Button type="button" variant="ghost" className="min-h-[44px]" onClick={() => campo("foto_url", "")}><Trash2 className="mr-2 h-4 w-4" />Tirar foto</Button>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="emp-foto-alt">Descrição da foto</Label><Input id="emp-foto-alt" maxLength={200} value={form.foto_alt} onChange={(e) => campo("foto_alt", e.target.value)} placeholder="Fachada do prédio vista da rua" className="min-h-[44px] text-base" /></div>
                  <div className="space-y-2"><Label htmlFor="emp-foto-credito">Crédito</Label><Input id="emp-foto-credito" maxLength={120} value={form.foto_credito} onChange={(e) => campo("foto_credito", e.target.value)} placeholder="Bewild" className="min-h-[44px] text-base" /></div>
                </div>
              </fieldset>

              <div className="flex min-h-[44px] items-center gap-3 border-t border-border pt-4">
                <Switch id="emp-selo" checked={form.selo_bewild} onCheckedChange={(v) => campo("selo_bewild", v)} />
                <Label htmlFor="emp-selo">Mostrar o selo "A Bewild já atua neste prédio"</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-status">Publicação</Label>
                <Select value={form.status} onValueChange={(v) => campo("status", v as StatusEmpreendimento)}>
                  <SelectTrigger id="emp-status" className="min-h-[44px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_EMPREENDIMENTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
              <Button type="submit" className="min-h-[44px]"><Save className="mr-2 h-4 w-4" />{salvar.isPending ? "Salvando…" : "Salvar empreendimento"}</Button>
            </fieldset>
          </form>
        </div>
      </main>
    </div>
  );
}
