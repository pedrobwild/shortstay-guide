import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { BAIRROS_CURADOS } from "@/data/bairrosCurados";
import { alternarBairroCategoria, categoriaSchema, excluirCategoria, listarBairroCategorias, listarCategorias, salvarCategoria, type TipoCategoria } from "@/lib/categoriasRadar";

function NovaCategoria({ tipo }: { tipo: TipoCategoria }) {
  const cache = useQueryClient();
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const m = useMutation({ mutationFn: () => salvarCategoria({ nome, tipo }), onSuccess: () => { setNome(""); setErro(""); void cache.invalidateQueries({ queryKey: ["radar_categorias"] }); }, onError: (e: Error) => setErro(e.message) });
  const id = `nova-${tipo}`;
  return <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); const r = categoriaSchema.safeParse({ nome, tipo }); if (!r.success) { setErro(r.error.issues[0].message); return; } m.mutate(); }}>
    <div className="min-w-0 flex-1 space-y-2"><Label htmlFor={id}>Nova categoria</Label><Input id={id} maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} className="min-h-[44px] text-base" /></div>
    <Button type="submit" disabled={m.isPending} className="min-h-[44px]">Adicionar</Button>
    {erro && <p role="alert" className="w-full text-sm text-destructive">{erro}</p>}
  </form>;
}

export default function AdminCategorias() {
  const cache = useQueryClient();
  const cats = useQuery({ queryKey: ["radar_categorias"], queryFn: listarCategorias });
  const ligacoes = useQuery({ queryKey: ["radar_bairro_categorias"], queryFn: listarBairroCategorias });
  const excluir = useMutation({ mutationFn: excluirCategoria, onSuccess: () => { void cache.invalidateQueries({ queryKey: ["radar_categorias"] }); void cache.invalidateQueries({ queryKey: ["radar_bairro_categorias"] }); toast({ title: "Categoria excluída" }); }, onError: () => toast({ title: "Não foi possível excluir.", variant: "destructive" }) });
  const alternar = useMutation({ mutationFn: (v: { bairro: string; id: string; ligar: boolean }) => alternarBairroCategoria(v.bairro, v.id, v.ligar), onSettled: () => cache.invalidateQueries({ queryKey: ["radar_bairro_categorias"] }), onError: () => toast({ title: "Não foi possível salvar.", variant: "destructive" }) });
  const doTipo = (t: TipoCategoria) => (cats.data ?? []).filter((c) => c.tipo === t);
  const lista = (t: TipoCategoria) => !doTipo(t).length ? <p className="text-sm text-muted-foreground">Nenhuma categoria ainda.</p> :
    <ul className="divide-y divide-border border-y border-border">{doTipo(t).map((c) => <li key={c.id} className="flex items-center justify-between gap-2 py-2"><span className="break-words">{c.nome}</span><Button variant="ghost" aria-label={`Excluir ${c.nome}`} className="min-h-[44px]" disabled={excluir.isPending} onClick={() => { if (window.confirm(`Excluir a categoria "${c.nome}"? Os posts ficam sem categoria.`)) excluir.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>;
  const bairroCats = doTipo("bairro");
  return <div className="min-h-screen bg-background">
    <AppNavbar />
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminTabs />
      <header><h1 className="font-display text-3xl font-bold">Categorias</h1><p className="mt-2 text-sm text-muted-foreground">Organize os posts (links do Bewild) e os bairros do Radar</p></header>
      {cats.isPending ? <p role="status">Carregando categorias…</p> : cats.isError ? <div role="alert"><p>Não foi possível carregar as categorias.</p><Button variant="outline" onClick={() => cats.refetch()}>Tentar novamente</Button></div> : <>
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="min-w-0 space-y-4"><h2 className="font-display text-xl font-semibold">Categorias de posts</h2>{lista("post")}<NovaCategoria tipo="post" /></section>
          <section className="min-w-0 space-y-4"><h2 className="font-display text-xl font-semibold">Categorias de bairros</h2>{lista("bairro")}<NovaCategoria tipo="bairro" /></section>
        </div>
        <section className="space-y-4" aria-label="Bairros por categoria">
          <h2 className="font-display text-xl font-semibold">Bairros por categoria</h2>
          {!bairroCats.length ? <p className="text-sm text-muted-foreground">Crie uma categoria de bairro para marcar os bairros.</p> : ligacoes.isError ? <p role="alert">Não foi possível carregar as marcações.</p> :
            <ul className="divide-y divide-border border-y border-border">{BAIRROS_CURADOS.map((b) => <li key={b.name} className="space-y-2 py-3"><p className="font-medium">{b.name}</p><div className="flex flex-wrap gap-x-4 gap-y-2">{bairroCats.map((c) => { const marcado = !!ligacoes.data?.some((l) => l.bairro === b.name && l.categoria_id === c.id); const id = `${b.name}-${c.id}`; return <label key={c.id} htmlFor={id} className="inline-flex min-h-[44px] items-center gap-2 text-sm"><Checkbox id={id} checked={marcado} disabled={alternar.isPending || ligacoes.isPending} onCheckedChange={(v) => alternar.mutate({ bairro: b.name, id: c.id, ligar: v === true })} />{c.nome}</label>; })}</div></li>)}</ul>}
        </section>
      </>}
    </main>
  </div>;
}
