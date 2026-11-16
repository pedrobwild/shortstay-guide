import { useEffect, useState } from "react";
import { trackGlobal } from "@/hooks/useGuideAnalytics";

interface Item { id: string; rotulo: string }

const iguais = (a: Item[], b: Item[]) => a.length === b.length && a.every((x, i) => x.id === b[i].id && x.rotulo === b[i].rotulo);

/**
 * Índice "Nesta página" das telas longas (auditoria de UX de 16/11/2026: /bairro e
 * /projecao passam de 9 telas no celular e só 6% das sessões chegam ao fim). Lê as
 * seções da própria página (`Secao` com id e rótulo de texto marca `data-indice`) depois
 * da montagem, então o HTML pré-renderizado sai sem ele. Uma linha só, com rolagem
 * lateral dentro do componente; a página não rola de lado.
 */
export default function NestaPagina() {
  const [itens, setItens] = useState<Item[]>([]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const ler = () => {
      const lidos = [...main.querySelectorAll<HTMLElement>("section[id][data-indice]")]
        .map((s) => ({ id: s.id, rotulo: s.dataset.indice ?? "" }))
        .filter((s) => s.rotulo);
      setItens((atual) => (iguais(atual, lidos) ? atual : lidos));
    };
    ler();
    // As seções entram conforme os dados chegam: relê quando a página muda, no máximo uma vez por quadro.
    let quadro = 0;
    const observador = new MutationObserver(() => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(ler); });
    observador.observe(main, { childList: true, subtree: true });
    return () => { observador.disconnect(); cancelAnimationFrame(quadro); };
  }, []);

  if (itens.length < 3) return null;
  return (
    <nav aria-label="Nesta página" className="border-y border-border">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-[72px]">
        <p className="e-rotulo shrink-0">Nesta página</p>
        <ul className="m-0 flex min-w-0 flex-1 list-none gap-1 overflow-x-auto p-0 [scrollbar-width:thin]">
          {itens.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                onClick={() => trackGlobal("cta_clicked", { cta_id: `indice_${s.id}`, section: "nesta_pagina" })}
                className="e-link inline-flex min-h-[44px] items-center whitespace-nowrap px-2 text-sm"
              >
                {s.rotulo}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
