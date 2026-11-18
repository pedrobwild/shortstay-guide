import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CorpoConteudo from "@/components/conteudos/CorpoConteudo";
import { toast } from "@/hooks/use-toast";
import { listarCategorias } from "@/lib/categoriasRadar";
import { DESTINOS_NOTICIAS, STATUS_NOTICIA } from "@/lib/noticiasRadar";
import {
  DESCRICAO_SEO_MAX, TIPOS_CONTEUDO, TIPOS_CONTEUDO_LISTA, caminhoConteudo, conteudoSchema, encurtar, enviarCapa,
  salvarConteudo, slugificar, type ConteudoEntrada,
} from "@/lib/conteudosRadar";
import { SITE_URL, TITULO_VISIVEL_MAX, tituloComMarca } from "@/lib/seo";
import { slugsDoRepositorio } from "@/lib/conteudosRepositorio";
import { avisosDoTexto } from "@/lib/conteudosEscrita";

export const CONTEUDO_VAZIO: ConteudoEntrada = {
  tipo: "artigo", titulo: "", slug: "", resumo: "", corpo: "", capa_url: null, capa_alt: null, autor_nome: null,
  seo_titulo: null, seo_descricao: null, canonical_externo: null, destino: "/mercado", status: "rascunho", categoria_id: null,
};

/** O endereço consta no sitemap publicado? É o sinal de que o texto já tem HTML estático no ar. */
async function estaNoSitemap(slug: string): Promise<boolean> {
  const r = await fetch("/sitemap.xml", { cache: "no-store" });
  if (!r.ok) throw new Error("sitemap indisponível");
  return (await r.text()).includes(`<loc>${SITE_URL}${caminhoConteudo(slug)}</loc>`);
}

/**
 * Formulário de artigo, release ou estudo. O endereço é sugerido a partir do título e trava
 * depois da primeira publicação (endereço publicado não muda). Os avisos editoriais não
 * impedem salvar o rascunho, mas impedem publicar.
 */
export default function FormConteudo({ id, inicial, jaPublicado, aoSalvar }: { id?: string; inicial: ConteudoEntrada; jaPublicado: boolean; aoSalvar: (id: string) => void }) {
  const cache = useQueryClient();
  const [form, setForm] = useState<ConteudoEntrada>(inicial);
  const [slugManual, setSlugManual] = useState(Boolean(id));
  const [erro, setErro] = useState("");
  const [previa, setPrevia] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const categorias = useQuery({ queryKey: ["radar_categorias"], queryFn: listarCategorias });
  // Regras do Radar + estrutura da skill ux-writing-blog (conteudosEscrita.ts). Sem campo de palavra-chave no banco.
  const avisos = useMemo(() => avisosDoTexto({ tipo: form.tipo, titulo: form.titulo, resumo: form.resumo, corpo: form.corpo, seo_titulo: form.seo_titulo ?? null }), [form.tipo, form.titulo, form.resumo, form.corpo, form.seo_titulo]);
  const noAr = useQuery({ queryKey: ["conteudo_no_sitemap", form.slug], queryFn: () => estaNoSitemap(form.slug), enabled: jaPublicado && Boolean(form.slug), staleTime: 60_000, retry: false });

  const mudar = (parte: Partial<ConteudoEntrada>) => setForm((f) => ({ ...f, ...parte }));
  const salvar = useMutation({
    mutationFn: () => salvarConteudo(form, id),
    onSuccess: (novoId) => {
      setErro("");
      void cache.invalidateQueries({ queryKey: ["noticias_admin"] });
      void cache.invalidateQueries({ queryKey: ["noticias_publicadas"] });
      void cache.invalidateQueries({ queryKey: ["conteudo"] });
      toast({ title: form.status === "publicado" ? "Texto publicado no Radar" : "Texto salvo" });
      aoSalvar(novoId);
    },
    onError: (e) => setErro(e instanceof Error ? e.message : "Não foi possível salvar."),
  });
  const capa = useMutation({
    mutationFn: (f: File) => enviarCapa(f, form.slug),
    onSuccess: (url) => { mudar({ capa_url: url }); setErro(""); },
    onError: (e) => setErro(e instanceof Error ? e.message : "Não foi possível enviar a imagem."),
  });

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const resultado = conteudoSchema.safeParse(form);
    if (!resultado.success) { setErro(resultado.error.issues[0]?.message ?? "Confira os campos."); return; }
    if (slugsDoRepositorio().has(form.slug)) { setErro("Este endereço já é de um texto publicado por PR (no repositório). Escolha outro."); return; }
    if (form.status === "publicado" && avisos.length) { setErro("Resolva os avisos do texto antes de publicar, ou salve como rascunho."); return; }
    salvar.mutate();
  }

  const tituloBusca = tituloComMarca(form.seo_titulo || form.titulo);
  const descricaoBusca = form.seo_descricao || encurtar(form.resumo, DESCRICAO_SEO_MAX);
  const ocupado = salvar.isPending || capa.isPending;

  return (
    <form aria-label="Editar texto" className="min-w-0 space-y-5 border-t border-border pt-4" onSubmit={enviar}>
      <h2 className="font-display text-xl font-semibold">{id ? "Editar texto" : "Novo texto"}</h2>
      <fieldset disabled={ocupado} className="min-w-0 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="tipo-conteudo">Tipo</Label>
          <Select value={form.tipo} onValueChange={(v) => mudar({ tipo: v as ConteudoEntrada["tipo"] })}>
            <SelectTrigger id="tipo-conteudo" className="min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>{TIPOS_CONTEUDO_LISTA.map((t) => <SelectItem key={t} value={t}>{TIPOS_CONTEUDO[t].rotulo}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="titulo-conteudo">Título</Label>
          <Input id="titulo-conteudo" required maxLength={180} value={form.titulo} className="min-h-[44px] text-base"
            onChange={(e) => mudar({ titulo: e.target.value, ...(slugManual ? {} : { slug: slugificar(e.target.value) }) })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug-conteudo">Endereço</Label>
          <Input id="slug-conteudo" required maxLength={90} value={form.slug} disabled={jaPublicado} className="min-h-[44px] text-base"
            onChange={(e) => { setSlugManual(true); mudar({ slug: e.target.value }); }} aria-describedby="slug-ajuda" />
          <p id="slug-ajuda" className="break-all text-sm text-muted-foreground">{SITE_URL}{caminhoConteudo(form.slug || "…")}{jaPublicado ? " · endereço publicado não muda" : ""}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resumo-conteudo">Resumo</Label>
          <Textarea id="resumo-conteudo" required maxLength={600} value={form.resumo} onChange={(e) => mudar({ resumo: e.target.value })} className="text-base" aria-describedby="resumo-ajuda" />
          <p id="resumo-ajuda" className="text-sm text-muted-foreground">Aparece abaixo do título, na lista e, sem descrição de busca, no Google.</p>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="corpo-conteudo">Texto (Markdown)</Label>
            <Button type="button" variant="ghost" className="min-h-[44px]" aria-pressed={previa} onClick={() => setPrevia(!previa)}>{previa ? "Voltar a editar" : "Ver como fica"}</Button>
          </div>
          {previa
            ? <div className="min-w-0 rounded-sm border border-border bg-background p-4" aria-label="Pré-visualização do texto"><CorpoConteudo corpo={form.corpo || "*Sem texto ainda.*"} /></div>
            : <Textarea id="corpo-conteudo" required rows={18} value={form.corpo} onChange={(e) => mudar({ corpo: e.target.value })} className="font-mono text-base" aria-describedby="corpo-ajuda" />}
          <p id="corpo-ajuda" className="text-sm text-muted-foreground">Use ## para subtítulos, - para listas e [texto](endereço) para links; tabela ainda não é aceita. Todo número de mercado precisa do link da fonte no mesmo parágrafo.</p>
        </div>
        {avisos.length > 0 && (
          <div role="status" className="space-y-2 rounded-sm border border-destructive/40 p-3">
            <p className="text-sm font-semibold">Antes de publicar, confira:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">{avisos.map((a) => <li key={a.codigo}>{a.mensagem}</li>)}</ul>
            <p className="text-sm text-muted-foreground">Estrutura pedida: um ou dois parágrafos com a resposta, depois um ## com a pergunta da busca e a resposta direta em duas ou três frases.</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="capa-conteudo">Imagem de capa (opcional)</Label>
          <input ref={arquivo} id="capa-conteudo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) capa.mutate(f); e.target.value = ""; }} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => arquivo.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />{capa.isPending ? "Enviando…" : form.capa_url ? "Trocar imagem" : "Enviar imagem"}</Button>
            {form.capa_url && <Button type="button" variant="ghost" className="min-h-[44px]" onClick={() => mudar({ capa_url: null, capa_alt: null })}>Tirar a capa</Button>}
          </div>
          {form.capa_url && <img src={form.capa_url} alt="" className="aspect-video w-full max-w-sm rounded-sm object-cover" />}
          <p className="text-sm text-muted-foreground">JPG, PNG ou WebP, até 5 MB, na proporção 16:9. Só imagem que a Bewild tem o direito de usar.</p>
        </div>
        {form.capa_url && (
          <div className="space-y-2">
            <Label htmlFor="capa-alt-conteudo">Descrição da imagem</Label>
            <Input id="capa-alt-conteudo" required maxLength={200} value={form.capa_alt ?? ""} onChange={(e) => mudar({ capa_alt: e.target.value })} className="min-h-[44px] text-base" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="autor-conteudo">Autor (opcional)</Label>
          <Input id="autor-conteudo" maxLength={80} value={form.autor_nome ?? ""} onChange={(e) => mudar({ autor_nome: e.target.value })} className="min-h-[44px] text-base" aria-describedby="autor-ajuda" />
          <p id="autor-ajuda" className="text-sm text-muted-foreground">Em branco, o texto é assinado pela Bewild. Use só o nome de quem escreveu.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="destino-conteudo">Página de dados relacionada</Label>
          <Select value={form.destino} onValueChange={(v) => mudar({ destino: v })}>
            <SelectTrigger id="destino-conteudo" className="min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>{DESTINOS_NOTICIAS.map((d) => <SelectItem key={d.caminho} value={d.caminho}>{d.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoria-conteudo">Categoria</Label>
          <Select value={form.categoria_id ?? "nenhuma"} onValueChange={(v) => mudar({ categoria_id: v === "nenhuma" ? null : v })}>
            <SelectTrigger id="categoria-conteudo" className="min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="nenhuma">Sem categoria</SelectItem>{(categorias.data ?? []).filter((c) => c.tipo === "post").map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <fieldset className="min-w-0 space-y-4 rounded-sm border border-border p-3">
          <legend className="px-1 text-sm font-semibold">Busca (Google)</legend>
          <div className="space-y-2">
            <Label htmlFor="seo-titulo-conteudo">Título de busca (opcional)</Label>
            <Input id="seo-titulo-conteudo" maxLength={TITULO_VISIVEL_MAX} value={form.seo_titulo ?? ""} onChange={(e) => mudar({ seo_titulo: e.target.value })} className="min-h-[44px] text-base" />
            <p className="text-sm tabular-nums text-muted-foreground">{(form.seo_titulo || form.titulo).length} de {TITULO_VISIVEL_MAX} caracteres{(form.seo_titulo || form.titulo).length > TITULO_VISIVEL_MAX ? " · o Google corta títulos longos; escreva um título de busca mais curto" : ""}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-descricao-conteudo">Descrição de busca (opcional)</Label>
            <Textarea id="seo-descricao-conteudo" maxLength={DESCRICAO_SEO_MAX} value={form.seo_descricao ?? ""} onChange={(e) => mudar({ seo_descricao: e.target.value })} className="text-base" />
            <p className="text-sm tabular-nums text-muted-foreground">{(form.seo_descricao ?? "").length} de {DESCRICAO_SEO_MAX} caracteres</p>
          </div>
          <div className="min-w-0 rounded-sm bg-muted p-3" aria-label="Como aparece na busca">
            <p className="break-all text-xs text-muted-foreground">{SITE_URL}{caminhoConteudo(form.slug || "…")}</p>
            <p className="break-words font-medium text-primary">{tituloBusca || "Título do texto"}</p>
            <p className="break-words text-sm text-muted-foreground">{descricaoBusca || "O resumo aparece aqui."}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="canonical-conteudo">Versão original no site Bewild (opcional)</Label>
            <Input id="canonical-conteudo" type="url" value={form.canonical_externo ?? ""} onChange={(e) => mudar({ canonical_externo: e.target.value })} placeholder="https://bewild.com.br/conteudos/…" className="min-h-[44px] text-base" aria-describedby="canonical-ajuda" />
            <p id="canonical-ajuda" className="text-sm text-muted-foreground">Preencha só se o mesmo texto já está no site. O Google passa a considerar a versão do site, e esta página sai do sitemap do Radar.</p>
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="status-conteudo">Publicação</Label>
          <Select value={form.status} onValueChange={(v) => mudar({ status: v as ConteudoEntrada["status"] })}>
            <SelectTrigger id="status-conteudo" className="min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(STATUS_NOTICIA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          {jaPublicado && form.status === "publicado" && (
            <p role="status" className="text-sm text-muted-foreground">
              {noAr.isPending ? "Conferindo o site…"
                : noAr.isError ? "No ar pelo app. Não foi possível conferir o HTML estático agora."
                : noAr.data ? "No ar pelo app e em HTML estático (consta no sitemap publicado)."
                : form.canonical_externo ? "No ar pelo app. Fica fora do sitemap porque a versão original está no site Bewild."
                : "No ar pelo app. O HTML estático e o sitemap entram na próxima publicação do site."}
            </p>
          )}
        </div>
        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        <Button type="submit" className="min-h-[44px]"><Save className="mr-2 h-4 w-4" />{salvar.isPending ? "Salvando…" : form.status === "publicado" ? "Salvar e publicar" : "Salvar texto"}</Button>
      </fieldset>
    </form>
  );
}
