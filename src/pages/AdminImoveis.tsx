import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Pencil, Plus, Save, Trash2 } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { imovelSchema, listarImoveis, removerImovel, salvarImovel, POR_PAGINA_IMOVEIS, type ImovelEntrada, type ImovelRadar } from "@/lib/imoveisRadar";

const vazio: ImovelEntrada = { titulo: "", descricao: "", bairro: "", foto_url: "", anuncio_url: "", publicado: false };
export default function AdminImoveis() {
  const cache = useQueryClient();
  const [pagina, setPagina] = useState(0);
  const [id, setId] = useState<string>();
  const [form, setForm] = useState<ImovelEntrada>(vazio);
  const [erro, setErro] = useState("");
  const consulta = useQuery({ queryKey: ["imoveis_admin", pagina], queryFn: () => listarImoveis(pagina, false) });
  const atualizar = () => { void cache.invalidateQueries({ queryKey: ["imoveis_admin"] }); void cache.invalidateQueries({ queryKey: ["imoveis_publicados"] }); };
  const salvar = useMutation({ mutationFn: () => salvarImovel(form, id), onSuccess: (novo) => { setId(novo); setErro(""); atualizar(); toast({ title: form.publicado ? "Imóvel publicado" : "Imóvel salvo" }); }, onError: () => setErro("Não foi possível salvar. Confira seu acesso e tente novamente.") });
  const remover = useMutation({ mutationFn: removerImovel, onSuccess: () => { setId(undefined); setForm(vazio); atualizar(); toast({ title: "Imóvel removido" }); } });
  const campo = (k: keyof ImovelEntrada) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const r = imovelSchema.safeParse(form);
    if (!r.success) return setErro(r.error.issues[0]?.message ?? "Confira os campos.");
    salvar.mutate();
  }
  function editar(i: ImovelRadar) { setId(i.id); setForm({ titulo: i.titulo, descricao: i.descricao, bairro: i.bairro, foto_url: i.foto_url, anuncio_url: i.anuncio_url, publicado: i.publicado }); setErro(""); }
  return <div className="min-h-screen bg-background">
    <AppNavbar />
    <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <AdminTabs />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Imóveis</h1><p className="mt-2 text-sm text-muted-foreground">Anúncios exibidos em <Link to="/imoveis" className="text-primary underline">/imoveis</Link></p></div>
        <Button variant="outline" onClick={() => { setId(undefined); setForm(vazio); setErro(""); }} className="min-h-[44px]"><Plus className="mr-2 h-4 w-4" />Novo imóvel</Button>
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <section className="min-w-0 space-y-4" aria-label="Imóveis cadastrados">
          {consulta.isPending ? <p role="status">Carregando imóveis…</p> : consulta.isError ? <div role="alert"><p>Não foi possível carregar os imóveis.</p><Button variant="outline" onClick={() => consulta.refetch()}>Tentar novamente</Button></div> : !consulta.data?.imoveis.length ? <p role="status" className="py-8 text-muted-foreground">Nenhum imóvel cadastrado.</p> : <ul className="divide-y divide-border border-y border-border">{consulta.data.imoveis.map((i) => <li key={i.id} className="flex gap-3 py-4">
            <img src={i.foto_url} alt="" className="h-16 w-20 shrink-0 rounded object-cover bg-muted" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{i.publicado ? "Publicado" : "Rascunho"}</Badge>{i.bairro && <span className="text-xs text-muted-foreground">{i.bairro}</span>}</div>
              <h2 className="break-words font-semibold">{i.titulo}</h2>
              <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-[44px]" onClick={() => editar(i)}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button asChild variant="ghost" className="min-h-[44px]"><a href={i.anuncio_url} target="_blank" rel="noopener noreferrer">Anúncio<ArrowUpRight className="ml-2 h-4 w-4" /></a></Button></div>
            </div>
          </li>)}</ul>}
          {(consulta.data?.total ?? 0) > POR_PAGINA_IMOVEIS && <div className="flex justify-between"><Button variant="outline" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</Button><Button variant="outline" disabled={(pagina + 1) * POR_PAGINA_IMOVEIS >= (consulta.data?.total ?? 0)} onClick={() => setPagina(pagina + 1)}>Próxima</Button></div>}
        </section>
        <form onSubmit={enviar} className="min-w-0 space-y-4 rounded-md border border-border p-5" aria-label={id ? "Editar imóvel" : "Novo imóvel"}>
          <h2 className="font-display text-xl font-semibold">{id ? "Editar imóvel" : "Novo imóvel"}</h2>
          <div className="space-y-2"><Label htmlFor="im-titulo">Título</Label><Input id="im-titulo" className="min-h-[44px] text-base" value={form.titulo} onChange={campo("titulo")} maxLength={140} /></div>
          <div className="space-y-2"><Label htmlFor="im-bairro">Bairro</Label><Input id="im-bairro" className="min-h-[44px] text-base" value={form.bairro} onChange={campo("bairro")} maxLength={80} /></div>
          <div className="space-y-2"><Label htmlFor="im-desc">Descrição</Label><Textarea id="im-desc" className="text-base" rows={5} value={form.descricao} onChange={campo("descricao")} maxLength={1200} /></div>
          <div className="space-y-2"><Label htmlFor="im-foto">Endereço da foto (https://)</Label><Input id="im-foto" type="url" className="min-h-[44px] text-base" value={form.foto_url} onChange={campo("foto_url")} />{form.foto_url.startsWith("https://") && <img src={form.foto_url} alt="Prévia da foto" className="aspect-[4/3] w-full max-w-xs rounded object-cover bg-muted" />}</div>
          <div className="space-y-2"><Label htmlFor="im-link">Link do anúncio real (https://)</Label><Input id="im-link" type="url" className="min-h-[44px] text-base" value={form.anuncio_url} onChange={campo("anuncio_url")} /></div>
          <div className="flex min-h-[44px] items-center gap-3"><Switch id="im-pub" checked={form.publicado} onCheckedChange={(v) => setForm({ ...form, publicado: v })} /><Label htmlFor="im-pub">Publicado na página Imóveis</Label></div>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <div className="flex flex-wrap gap-2"><Button type="submit" disabled={salvar.isPending} className="min-h-[44px]"><Save className="mr-2 h-4 w-4" />Salvar</Button>{id && <Button type="button" variant="ghost" disabled={remover.isPending} className="min-h-[44px]" onClick={() => { if (confirm("Remover este imóvel?")) remover.mutate(id); }}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>}</div>
        </form>
      </div>
    </main>
  </div>;
}
