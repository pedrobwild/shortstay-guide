import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DESTINOS_NOTICIAS, noticiaSchema, salvarNoticia, type NoticiaEntrada } from "@/lib/noticiasRadar";
import { listarCategorias } from "@/lib/categoriasRadar";
import { toast } from "@/hooks/use-toast";

export default function EnviarPost({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  const cache = useQueryClient();
  const [form, setForm] = useState<NoticiaEntrada>({ titulo: "", resumo: "", url: "", destino: "/mercado", status: "publicado", categoria_id: null });
  const [erro, setErro] = useState("");
  const categorias = useQuery({ queryKey: ["radar_categorias"], queryFn: listarCategorias });
  const salvar = useMutation({ mutationFn: () => salvarNoticia(form), onSuccess: () => {
    void cache.invalidateQueries({ queryKey: ["noticias_publicadas"] });
    void cache.invalidateQueries({ queryKey: ["noticias_admin"] });
    toast({ title: "Artigo publicado" });
    fechar();
  }, onError: () => setErro("Não foi possível publicar. Confira seu acesso de administrador e tente novamente.") });
  return <Dialog open={aberto} onOpenChange={(v) => { if (!v && !salvar.isPending) fechar(); }}>
    <DialogContent className="z-[110] max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg bg-background">
      <DialogHeader><DialogTitle>Enviar artigo</DialogTitle><DialogDescription>Artigo do Bewild · publicação no Radar</DialogDescription></DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); setErro(""); const resultado = noticiaSchema.safeParse(form); if (!resultado.success) { setErro(resultado.error.issues[0]?.message ?? "Confira os campos."); return; } salvar.mutate(); }}>
        <fieldset disabled={salvar.isPending} className="min-w-0 space-y-4">
          <div className="space-y-2"><Label htmlFor="post-titulo">Título</Label><Input id="post-titulo" required maxLength={180} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="min-h-11 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="post-url">Link do artigo no Bewild</Label><Input id="post-url" required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://bewild.com.br/conteudos/…" className="min-h-11 text-base" /></div>
          <div className="space-y-2"><Label htmlFor="post-resumo">Resumo (opcional)</Label><Textarea id="post-resumo" maxLength={600} value={form.resumo} onChange={(e) => setForm({ ...form, resumo: e.target.value })} className="text-base" /></div>
          <div className="space-y-2"><Label htmlFor="post-destino">Página relacionada do Radar</Label><Select value={form.destino} onValueChange={(destino) => setForm({ ...form, destino })}><SelectTrigger id="post-destino" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent>{DESTINOS_NOTICIAS.map((d) => <SelectItem key={d.caminho} value={d.caminho}>{d.nome}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="post-categoria">Categoria</Label><Select value={form.categoria_id ?? "nenhuma"} onValueChange={(v) => setForm({ ...form, categoria_id: v === "nenhuma" ? null : v })}><SelectTrigger id="post-categoria" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhuma">Sem categoria</SelectItem>{(categorias.data ?? []).filter((c) => c.tipo === "post").map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>{categorias.isError && <p className="text-sm text-muted-foreground">Categorias indisponíveis. Você pode publicar sem categoria.</p>}</div>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" className="min-h-11 w-full"><Send className="mr-2 h-4 w-4" />{salvar.isPending ? "Publicando…" : "Publicar artigo"}</Button>
        </fieldset>
      </form>
    </DialogContent>
  </Dialog>;
}