import { useState } from "react";
import { Copy, Check, ArrowUpRight } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { urlCanonica } from "@/lib/seo";

const PAGINAS = [
  { nome: "Radar Bewild", caminho: "/" },
  { nome: "Ranking de bairros", caminho: "/ranking" },
  { nome: "Mercado", caminho: "/mercado" },
  { nome: "Vila Olímpia", caminho: "/bairro/vila-olimpia" },
];

export default function AdminGoogle() {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(url);
      toast({ title: "Endereço copiado" });
    } catch {
      setCopiado(null);
      toast({ title: "Não foi possível copiar", description: "Selecione o endereço para copiar manualmente.", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <AdminTabs />
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Google · Radar Bewild</h1>
          <Button asChild variant="outline" className="min-h-[44px]">
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
              Search Console<ArrowUpRight className="ml-2 h-4 w-4" /><span className="sr-only"> (abre em nova aba)</span>
            </a>
          </Button>
        </header>
        <section aria-label="Endereços públicos do Radar" className="divide-y divide-border border-y border-border">
          {PAGINAS.map(({ nome, caminho }) => {
            const url = urlCanonica(caminho);
            const selecionado = copiado === url;
            return (
              <div key={caminho} className="flex min-w-0 flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <h2 className="font-display text-lg font-semibold text-foreground">{nome}</h2>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-block min-h-[44px] max-w-full break-all py-2 text-sm text-primary underline underline-offset-4">
                    {url}<span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </div>
                <Button variant="outline" onClick={() => copiar(url)} aria-label={`Copiar endereço de ${nome}`} className="min-h-[44px] shrink-0 self-start sm:self-center">
                  {selecionado ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {selecionado ? "Copiado" : "Copiar endereço"}
                </Button>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}