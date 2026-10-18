import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import ExploradorBairros from "@/components/mapa/ExploradorBairros";
import LeiturasComplementares from "@/components/mapa/LeiturasComplementares";
import { BairroProvider, useBairroData } from "@/hooks/useBairroData";
import { DEMAND_FILTERS, NEIGHBORHOODS, type CityEvent } from "@/data/mapaBairrosData";
import { temPerfil } from "@/lib/leiturasBairros";
import { slugifyBairro } from "@/lib/seo";

/**
 * /mapa — explorar bairros geograficamente e seguir para a comparação ou a
 * simulação. Seleção (?bairro=) e comparação (?b=) ficam na URL. Abaixo do
 * explorador seguem as leituras do mapa anterior (ranking interno, perfis de
 * demanda e eventos, que destacam bairros no mapa).
 */
export default function MapaBairros() {
  return (
    <BairroProvider>
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <MapaConteudo />
      </div>
    </BairroProvider>
  );
}

function MapaConteudo() {
  const { bairros } = useBairroData();
  const [, setParams] = useSearchParams();
  const [evento, setEvento] = useState<CityEvent | null>(null);
  const [perfis, setPerfis] = useState<string[]>([]);
  const [pedidoCentralizar, setPedidoCentralizar] = useState<{ nome: string; n: number } | null>(null);
  const nomesBase = new Set(bairros.map((b) => b.name));

  // Destaque no mapa: o evento escolhido ou, sem evento, os bairros do perfil de demanda (só os da base).
  const nomesPerfil = perfis.length ? NEIGHBORHOODS.filter((n) => temPerfil(n, perfis)).map((n) => n.name) : [];
  const rotulosPerfil = DEMAND_FILTERS.filter((f) => perfis.includes(f.key)).map((f) => f.label).join(", ");
  const destaque = (evento ? evento.nearbyNeighborhoods : nomesPerfil).filter((n) => nomesBase.has(n));
  const rotuloDestaque = evento ? `Perto de: ${evento.name}` : perfis.length ? `Perfil: ${rotulosPerfil}` : undefined;
  const limparDestaque = () => { if (evento) setEvento(null); else setPerfis([]); };

  const selecionarNoMapa = (nome: string) => {
    if (!nomesBase.has(nome)) return;
    setParams((atual) => { const p = new URLSearchParams(atual); p.set("bairro", slugifyBairro(nome)); return p; }, { replace: true });
    setPedidoCentralizar((c) => ({ nome, n: (c?.n ?? 0) + 1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main id="conteudo" tabIndex={-1}>
      <ExploradorBairros
        destaque={destaque}
        rotuloDestaque={rotuloDestaque}
        onLimparDestaque={limparDestaque}
        pedidoCentralizar={pedidoCentralizar}
      />
      <div className="border-t border-border">
        <LeiturasComplementares
          eventoAtivo={evento}
          onEvento={setEvento}
          perfis={perfis}
          onPerfis={setPerfis}
          onSelecionarBairro={selecionarNoMapa}
        />
      </div>
      <RodapeRadar />
    </main>
  );
}
