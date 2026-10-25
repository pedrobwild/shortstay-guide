import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { DESTINOS_NOTICIAS, noticiasPublicadas } from "@/lib/noticiasRadar";

/** Complemento editorial; as citações estáticas e o HTML inicial permanecem intactos. */
export default function NoticiasRelacionadas() {
  const { pathname } = useLocation();
  const permitido = DESTINOS_NOTICIAS.some((d) => d.caminho === pathname);
  const { data } = useQuery({ queryKey: ["noticias_publicadas", pathname], queryFn: () => noticiasPublicadas(pathname), enabled: permitido, refetchInterval: 60000 });
  if (!permitido || !data?.length) return null;
  return <section aria-label="Artigos relacionados do Bewild" className="mx-auto w-full max-w-[1280px] px-5 py-8 lg:px-10">
    <h2 className="font-display text-xl text-foreground">Análises no Bewild</h2>
    <ul className="mt-4 divide-y divide-border border-y border-border">
      {data.map((n) => <li key={n.id} className="py-4">
        <a href={n.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 break-words font-medium text-primary underline underline-offset-4">{n.titulo}<ArrowUpRight aria-label="Abre em nova aba" className="h-4 w-4 shrink-0" /></a>
        {n.resumo && <p className="max-w-3xl break-words text-sm text-muted-foreground">{n.resumo}</p>}
      </li>)}
    </ul>
  </section>;
}