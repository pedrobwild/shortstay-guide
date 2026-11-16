import { FOTOS_REFORMAS, linkProjetoPortfolio, PORTFOLIO_URL, urlFotoReforma } from "@/data/fotosReformas";
import { formatDecimal } from "@/lib/numberFormat";
import { cn } from "@/lib/utils";

/**
 * Prova visual da reforma: três fotos de obras entregues pela Bewild (foto, não render),
 * cada uma com o prédio, o bairro e a área, e o link para o projeto no portfólio do site
 * (link de retorno normal: mesma aba, sem UTM). As fotos são verticais: ficam lado a lado em
 * três colunas também no celular (uma embaixo da outra somariam mais de uma tela), com a
 * proporção 3:4 reservada antes de a imagem carregar; carregam sob demanda.
 */
export default function FotosReformas({ className }: { className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:gap-6">
        {FOTOS_REFORMAS.map((f) => (
          <li key={f.slug} className="min-w-0">
            <figure className="m-0">
              <a href={linkProjetoPortfolio(f)} className="block overflow-hidden rounded-[2px] bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ciano focus-visible:ring-offset-2">
                <img
                  src={urlFotoReforma(f, 640)}
                  srcSet={`${urlFotoReforma(f, 240)} 240w, ${urlFotoReforma(f, 480)} 480w, ${urlFotoReforma(f, 640)} 640w, ${urlFotoReforma(f, 960)} 960w`}
                  sizes="(min-width: 1280px) 380px, 33vw"
                  alt={f.alt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/4] h-auto w-full object-cover"
                />
              </a>
              {/* Celular: só o bairro cabe na coluna; o prédio e a área aparecem a partir de sm (e estão no texto alternativo e na página do projeto). */}
              <figcaption className="mt-2 text-[14px] leading-5 sm:text-[15px] sm:leading-[22px]">
                <span className="hidden font-semibold sm:block">{f.predio}</span>
                <span className="font-semibold sm:hidden">{f.bairro}</span>
                <span className="e-legenda hidden sm:block">{f.bairro} · {formatDecimal(f.areaM2, 2)} m²</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <p className="e-legenda mt-3">Fotos de obras entregues pela Bewild, não de projeto 3D.</p>
      <p className="mt-1 text-[15px]">
        <a href={PORTFOLIO_URL} className="e-link inline-flex min-h-[44px] items-center">Ver mais reformas no portfólio da Bewild</a>
      </p>
    </div>
  );
}
