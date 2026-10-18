import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppNavbar from "@/components/AppNavbar";
import RodapeRadar from "@/components/RodapeRadar";
import { Button } from "@/components/ui/button";

/** Caminhos de volta para quem chegou num endereço que não existe (mesmo papel da NotFoundPage do bewild.com.br). */
const CAMINHOS = [
  { to: "/ranking", rotulo: "Ranking de bairros" },
  { to: "/mapa", rotulo: "Mapa de bairros" },
  { to: "/projecao", rotulo: "Simular meu studio" },
  { to: "/metodologia", rotulo: "Metodologia e dados abertos" },
];

/**
 * Página não encontrada. O head (noindex) vem do RouteSeo; a pré-renderização grava
 * um 404.html equivalente para hospedagens que o servem. O servidor da SPA responde
 * 200 com a home, então o noindex é o que impede a indexação do endereço errado.
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: endereço inexistente:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppNavbar fixo={false} />
      <main id="conteudo" tabIndex={-1} className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center px-5 py-16 font-body lg:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-muted-foreground">Erro 404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground lg:text-4xl">Página não encontrada</h1>
        <p className="mt-3 text-base text-muted-foreground">
          O endereço <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">{location.pathname}</code> não existe no Radar Bewild. Confira o link ou siga por um destes caminhos.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {CAMINHOS.map((c) => (
            <li key={c.to}>
              <Button asChild variant="outline" className="min-h-[44px]"><Link to={c.to}>{c.rotulo}</Link></Button>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm">
          <Link to="/" className="inline-flex min-h-[44px] items-center font-semibold text-primary underline underline-offset-4">Voltar ao guia do investidor</Link>
        </p>
      </main>
      <RodapeRadar />
    </div>
  );
};

export default NotFound;
