import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, ArrowUpRight } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { paginasSeoAdmin } from "@/lib/seoBairrosAdmin";
import { toast } from "@/hooks/use-toast";

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function AdminSeo() {
  const bairros = useMemo(paginasSeoAdmin, []);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(bairros[0]?.nome ?? "");
  const filtrados = bairros.filter((b) => normalizar(b.nome).includes(normalizar(busca)));
  const atual = filtrados.find((b) => b.nome === selecionado) ?? filtrados[0];
  async function copiar() {
    if (!atual) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(atual, null, 2));
      toast({ title: "Metadados copiados" });
    } catch {
      toast({ title: "Não foi possível copiar", description: "Tente novamente.", variant: "destructive" });
    }
  }
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <AdminTabs />
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">SEO do comparador e dos bairros</h1>
            <Badge variant="outline">{bairros.length} páginas</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Metadados atuais · somente consulta · indexação no Google não verificada</p>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="min-w-0 space-y-3" aria-label="Selecionar página">
            <label htmlFor="busca-seo" className="text-sm font-medium">Buscar página</label>
            <Input id="busca-seo" value={busca} onChange={(e) => setBusca(e.target.value)} className="min-h-[44px] text-base" placeholder="Comparador ou bairro" />
            <nav aria-label="Páginas com SEO" className="flex max-h-64 flex-col gap-1 overflow-y-auto lg:max-h-[640px]">
              {filtrados.map((b) => <Button key={b.path} variant={atual?.nome === b.nome ? "secondary" : "ghost"} aria-pressed={atual?.nome === b.nome} onClick={() => setSelecionado(b.nome)} className="min-h-[44px] justify-start whitespace-normal text-left">{b.nome}</Button>)}
            </nav>
          </aside>
          {!atual ? <p role="status" className="py-8 text-muted-foreground">Nenhuma página encontrada.</p> : (
            <section aria-label={`Metadados de ${atual.nome}`} className="min-w-0 space-y-6">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <h2 className="font-display text-xl font-semibold">{atual.nome}</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="min-h-[44px]" onClick={copiar}><Copy className="mr-2 h-4 w-4" />Copiar</Button>
                  <Button asChild className="min-h-[44px]"><Link to={atual.path}>Ver página<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
                </div>
              </header>
              <dl className="space-y-4">
                <div><dt className="text-sm font-medium">Título</dt><dd className="mt-1 break-words text-lg text-foreground">{atual.titulo}</dd><dd className="text-xs text-muted-foreground">{atual.titulo.length} caracteres</dd></div>
                <div><dt className="text-sm font-medium">Descrição</dt><dd className="mt-1 break-words text-sm text-muted-foreground">{atual.description}</dd><dd className="text-xs text-muted-foreground">{atual.description.length} caracteres</dd></div>
                <div><dt className="text-sm font-medium">Título principal · HTML inicial</dt><dd className="mt-1 break-words text-sm text-muted-foreground">{atual.h1}</dd></div>
                <div><dt className="text-sm font-medium">Endereço canônico</dt><dd className="mt-1 break-all text-sm text-primary">{atual.canonical}</dd></div>
              </dl>
              <div className="border-t border-border pt-5">
                <h3 className="mb-3 font-display text-lg font-semibold">Metadados da página</h3>
                <dl className="divide-y divide-border">
                  {atual.tags.map((tag) => <div key={tag.nome} className="grid min-w-0 gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)]"><dt className="break-words font-mono text-xs text-foreground">{tag.nome}</dt><dd className="min-w-0 break-all text-sm text-muted-foreground">{tag.valor}</dd></div>)}
                </dl>
              </div>
              <details className="border-t border-border pt-4">
                <summary className="min-h-[44px] cursor-pointer font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">Dados estruturados · JSON-LD</summary>
                <pre className="max-w-full whitespace-pre-wrap break-all rounded-md bg-muted p-4 font-mono text-xs text-muted-foreground">{JSON.stringify(atual.jsonLd, null, 2)}</pre>
              </details>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}