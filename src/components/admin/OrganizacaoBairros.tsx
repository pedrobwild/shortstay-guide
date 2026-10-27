import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRadarBase } from "@/lib/radarBase";
import { bairroPath, SEO_BAIRROS } from "@/lib/seo";
import { listarCategorias, listarBairroCategorias } from "@/lib/categoriasRadar";

const MapaRadar = lazy(() => import("@/components/mapa/MapaRadar"));
const camadas = { poligonos: true, calor: false, clusters: false, metro: false, pois: [] };
const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function OrganizacaoBairros() {
  const base = useRadarBase();
  const categorias = useQuery({ queryKey: ["radar_categorias"], queryFn: listarCategorias });
  const ligacoes = useQuery({ queryKey: ["radar_bairro_categorias"], queryFn: listarBairroCategorias });
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [centralizar, setCentralizar] = useState<{ nome: string; n: number } | null>(null);
  const nomes = useMemo(() => [...new Set([...SEO_BAIRROS, ...(base.data?.bairros.map(b => b.name) ?? [])])].sort((a, b) => a.localeCompare(b, "pt-BR")), [base.data]);
  const filtrados = nomes.filter(nome => normalizar(nome).includes(normalizar(busca)) && (categoria === "todas" || ligacoes.data?.some(l => l.bairro === nome && l.categoria_id === categoria)));
  const visiveis = new Set(filtrados);
  const selecionar = (nome: string) => { setSelecionado(nome); setCentralizar(s => ({ nome, n: (s?.n ?? 0) + 1 })); };
  const falhou = base.isError || categorias.isError || ligacoes.isError;
  return <section className="space-y-4" aria-label="Organização dos bairros">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-display text-2xl font-bold">Bairros do Radar</h1><p className="text-sm text-muted-foreground">{filtrados.length} de {nomes.length} bairros</p></div>
      <Button variant="outline" asChild><Link to="/admin/categorias">Organizar categorias <ArrowUpRight className="h-4 w-4" /></Link></Button>
    </header>
    <div className="grid gap-3 sm:grid-cols-2">
      <Input aria-label="Buscar bairro" placeholder="Buscar bairro" value={busca} onChange={e => setBusca(e.target.value)} className="min-h-11 text-base" />
      <Select value={categoria} onValueChange={setCategoria}><SelectTrigger aria-label="Categoria de bairro" className="min-h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as categorias</SelectItem>{categorias.data?.filter(c => c.tipo === "bairro").map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
    </div>
    {falhou && <div role="alert" className="text-sm text-destructive">Não foi possível carregar todos os bairros e categorias. <Button variant="link" onClick={() => { void base.refetch(); void categorias.refetch(); void ligacoes.refetch(); }}>Tentar novamente</Button></div>}
    {base.data?.offline && <p className="text-sm text-muted-foreground">Mapa usando a base de reserva; dados atuais indisponíveis.</p>}
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="relative h-[420px] min-w-0 overflow-hidden border border-border bg-muted sm:h-[520px]" aria-label="Mapa dos bairros">
        {base.isPending ? <p role="status" className="flex items-center gap-2 p-4"><Loader2 className="h-4 w-4 animate-spin" />Carregando mapa…</p> : <Suspense fallback={<p role="status" className="p-4">Carregando mapa…</p>}><MapaRadar bairros={base.data?.bairros ?? []} selecionado={selecionado} visiveis={visiveis} camadas={camadas} onSelecionar={selecionar} centralizar={centralizar} compacto /></Suspense>}
      </div>
      <div className="min-w-0 space-y-3">
        {selecionado && <div className="border-b border-border pb-3"><h2 className="font-display text-lg font-semibold break-words">{selecionado}</h2><Button variant="link" asChild className="min-h-11 px-0"><Link to={bairroPath(selecionado)}>Abrir página do bairro <ArrowUpRight className="h-4 w-4" /></Link></Button></div>}
        {!filtrados.length && <p className="text-sm text-muted-foreground">Nenhum bairro encontrado.</p>}
        <ul className="max-h-[520px] overflow-y-auto divide-y divide-border border-y border-border">
          {filtrados.map(nome => <li key={nome} className="flex min-w-0 items-center gap-1 py-2">
            <Button variant={nome === selecionado ? "secondary" : "ghost"} className="min-h-11 min-w-0 flex-1 justify-start whitespace-normal text-left" onClick={() => selecionar(nome)} aria-pressed={nome === selecionado}><MapPin className="h-4 w-4 shrink-0" /><span className="break-words">{nome}</span></Button>
            <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" asChild><Link to={bairroPath(nome)} aria-label={`Abrir ${nome}`} title={`Abrir ${nome}`}><ArrowUpRight className="h-4 w-4" /></Link></Button>
          </li>)}
        </ul>
      </div>
    </div>
  </section>;
}