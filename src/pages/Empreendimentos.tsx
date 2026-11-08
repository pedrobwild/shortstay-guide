import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { CabecalhoTela, Container, PaginaEstudo } from "@/components/estudo/Estrutura";
import CardEmpreendimento from "@/components/empreendimentos/CardEmpreendimento";
import ResumoEmpreendimento from "@/components/empreendimentos/ResumoEmpreendimento";
import AvisoBase from "@/components/radar/AvisoBase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BairroProvider } from "@/hooks/useBairroData";
import {
  AVISO_CATALOGO, bairrosDoCatalogo, filtrarEmpreendimentos, listarEmpreendimentosPublicos, type Empreendimento,
} from "@/lib/empreendimentos";
import { formatDecimal } from "@/lib/numberFormat";

const TODOS = "todos";
const n = (v: number) => formatDecimal(v, 0);

/**
 * /empreendimentos — catálogo dos prédios onde a Bewild já atua (decisão do Pedro,
 * 30/10/2026): filtro por bairro (?bairro= na URL, para compartilhar) e busca por
 * nome; o card abre um resumo (modal) e o resumo leva à página completa do prédio.
 * Ordem alfabética, sem ranking. Pré-renderizada só com título e descrição; a lista
 * vem do banco ao abrir.
 */
export default function Empreendimentos() {
  return (
    <BairroProvider>
      <PaginaEstudo>
        <Catalogo />
      </PaginaEstudo>
    </BairroProvider>
  );
}

function Catalogo() {
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  // O último aberto continua montado ao fechar (animação de saída); o foco volta ao card de origem.
  const [selecionado, setSelecionado] = useState<Empreendimento | null>(null);
  const [aberto, setAberto] = useState(false);
  const origem = useRef<HTMLElement | null>(null);
  const abrir = (e: Empreendimento, el: HTMLElement) => { origem.current = el; setSelecionado(e); setAberto(true); };
  const consulta = useQuery({ queryKey: ["empreendimentos_publicos"], queryFn: listarEmpreendimentosPublicos, staleTime: 5 * 60 * 1000 });
  const lista = useMemo(() => consulta.data ?? [], [consulta.data]);
  const bairros = useMemo(() => bairrosDoCatalogo(lista), [lista]);

  const bairroUrl = params.get("bairro");
  const bairro = bairroUrl && bairros.some((b) => b.slug === bairroUrl) ? bairroUrl : null;
  const nomeBairro = bairros.find((b) => b.slug === bairro)?.nome ?? null;
  const filtrados = useMemo(() => filtrarEmpreendimentos(lista, { bairro, busca }), [lista, bairro, busca]);
  const filtrando = Boolean(bairro || busca.trim());

  const escolherBairro = (valor: string) => {
    setParams((p) => {
      const novo = new URLSearchParams(p);
      if (valor === TODOS) novo.delete("bairro");
      else novo.set("bairro", valor);
      return novo;
    }, { replace: true, preventScrollReset: true });
  };
  const limpar = () => { setBusca(""); escolherBairro(TODOS); };

  return (
    <>
      <CabecalhoTela
        rotulo="Empreendimentos · São Paulo"
        titulo="Empreendimentos em destaque"
        lead="Prédios de São Paulo onde a Bewild já atua. Veja onde ficam, o que oferecem e, quando o bairro está na base, os números dele no Radar."
      >
        {consulta.data && lista.length > 0 && (
          <p className="e-legenda">
            {n(lista.length)} {lista.length === 1 ? "empreendimento" : "empreendimentos"} em {n(bairros.length)} {bairros.length === 1 ? "bairro" : "bairros"}
          </p>
        )}
      </CabecalhoTela>

      <Container className="space-y-8 pb-12">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)] sm:items-end lg:max-w-[880px]">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="catalogo-bairro">Bairro</Label>
            <Select value={bairro ?? TODOS} onValueChange={escolherBairro} disabled={!bairros.length}>
              <SelectTrigger id="catalogo-bairro" className="min-h-[44px] text-base"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos os bairros</SelectItem>
                {bairros.map((b) => <SelectItem key={b.slug} value={b.slug}>{b.nome} ({n(b.total)})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="catalogo-busca">Buscar por nome ou incorporadora</Label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-70" />
              <Input
                id="catalogo-busca"
                type="search"
                inputMode="search"
                autoComplete="off"
                value={busca}
                onChange={(ev) => setBusca(ev.target.value)}
                placeholder="Ex.: Nex One, Vitacon"
                className="min-h-[44px] pl-9 text-base"
              />
            </div>
          </div>
        </div>

        <p className="e-legenda max-w-[760px]">{AVISO_CATALOGO}</p>

        {consulta.isPending ? (
          <p role="status" className="e-apoio py-12" aria-busy="true">Carregando os empreendimentos…</p>
        ) : consulta.isError ? (
          <AvisoBase tom="erro" onTentar={() => void consulta.refetch()}>Não foi possível carregar os empreendimentos agora.</AvisoBase>
        ) : lista.length === 0 ? (
          <p role="status" className="e-apoio py-12">Nenhum empreendimento publicado ainda.</p>
        ) : filtrados.length === 0 ? (
          <div role="status" className="space-y-4 py-12">
            <p className="e-apoio">
              Nenhum empreendimento {nomeBairro ? `em ${nomeBairro}` : ""}{busca.trim() ? ` com "${busca.trim()}"` : ""}.
            </p>
            <Button variant="outline" className="min-h-[44px]" onClick={limpar}><X aria-hidden="true" className="mr-2 h-4 w-4" />Limpar filtros</Button>
          </div>
        ) : (
          <>
            {/* Contagem só com filtro: sem filtro, o total já está no cabeçalho (cada número uma vez). */}
            <div className="flex flex-wrap items-center justify-between gap-3" aria-live="polite">
              {filtrando && (
                <>
                  <p className="e-legenda">{nomeBairro ? `${nomeBairro}: ` : ""}{n(filtrados.length)} de {n(lista.length)} empreendimentos</p>
                  <Button variant="ghost" className="min-h-[44px] px-3" onClick={limpar}><X aria-hidden="true" className="mr-2 h-4 w-4" />Limpar filtros</Button>
                </>
              )}
            </div>
            <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-3">
              {filtrados.map((e) => (
                <li key={e.id} className="min-w-0">
                  <CardEmpreendimento e={e} abrir={abrir} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Container>

      <ResumoEmpreendimento e={selecionado} aberto={aberto} fechar={() => setAberto(false)} devolverFoco={() => origem.current?.focus()} />
    </>
  );
}
