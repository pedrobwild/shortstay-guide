import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import OrcamentoButton from "@/components/OrcamentoButton";
import { LogOut, User, FolderOpen, LayoutDashboard, Flame, Menu, BookOpen } from "lucide-react";
import { CAMINHO_AREA_EXCLUSIVA } from "@/data/artigosExclusivos";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { ATALHOS_CELULAR, GRUPOS_MENU, linkAtivo, LINKS_PUBLICOS, type LinkNavegacao } from "@/data/navegacao";
import bwildLogo from "@/assets/bewild-logo.webp";
import bewildSymbol from "@/assets/bewild-symbol.webp";
import { cn } from "@/lib/utils";

const isAtivo = linkAtivo;

const rastrear = (link: LinkNavegacao, section = "navbar") => trackGlobal("cta_clicked", { cta_id: link.id, section });

const ATALHOS = ATALHOS_CELULAR.map((id) => LINKS_PUBLICOS.find((l) => l.id === id)).filter((l): l is LinkNavegacao => Boolean(l));

/**
 * Navbar global do Radar: logo + "Radar", quatro itens por tarefa (Bairros, Simular,
 * Reforma, Guia) e Conteúdos, com o ativo sublinhado em ciano, a conta num menu só (ou "Login") e
 * "Peça seu orçamento". "Admin" só aparece para quem tem o papel de admin.
 * No celular (56px): atalhos Bairros / Simular / Reforma e o menu lateral com todas as
 * telas agrupadas pela tarefa (GRUPOS_MENU), o orçamento no topo e a conta no fim, num
 * bloco rolável só. O menu lateral existe em qualquer largura: é onde ficam as telas
 * secundárias (Mapa, Comparar, Mercado, Financiamento, Posts, Metodologia).
 * Na home, o menu também traz as seções do guia (`menuGuia`) e a barra respeita o
 * trilho do índice (`comTrilhoGuia`). `fixo={false}` deixa a barra rolar com a página.
 */
export default function AppNavbar({
  fixo = true,
  comTrilhoGuia = false,
  menuGuia,
  progressoGuia,
}: {
  fixo?: boolean;
  comTrilhoGuia?: boolean;
  /** Conteúdo extra do menu lateral (seções do guia); recebe a função que fecha o menu. */
  menuGuia?: (fechar: () => void) => ReactNode;
  /** Ex.: "Seção 3 de 17" — mostrado no topo do menu lateral. */
  progressoGuia?: string;
}) {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const fechar = () => setMenuAberto(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Nome do usuário vem do metadata do signup
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <header className={cn(fixo ? "sticky top-0" : "relative", "z-40 w-full border-b border-border bg-card/[0.97] font-body", comTrilhoGuia && "lg:pl-[60px]")}>
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 pl-4 pr-2 sm:gap-3 lg:h-16 lg:gap-4 lg:px-6 xl:gap-5 xl:px-10">
        {/* Logo */}
        <Link to="/" className="flex min-h-[44px] shrink-0 items-center gap-2.5 lg:gap-3" aria-label="Radar Bewild — início">
          <img src={bwildLogo} alt="" className="hidden h-6 w-auto min-[360px]:block lg:h-7" width={77} height={24} />
          <img src={bewildSymbol} alt="" className="h-6 w-6 min-[360px]:hidden" width={24} height={24} />
          <span className="hidden border-l border-border pl-2.5 text-xs font-semibold tracking-[0.02em] text-muted-foreground min-[440px]:inline lg:hidden lg:pl-3 lg:text-[13px] xl:inline" aria-hidden="true">Radar</span>
        </Link>

        {/* Links públicos (desktop): item ativo sublinhado de ponta a ponta da barra */}
        <nav aria-label="Navegação principal" className="ml-1 hidden self-stretch lg:flex lg:gap-0.5 xl:ml-3">
          {LINKS_PUBLICOS.map((link) => {
            const ativo = isAtivo(link, pathname);
            return (
              <Link
                key={link.id}
                to={link.to}
                onClick={() => rastrear(link)}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "inline-flex items-center whitespace-nowrap border-b-2 px-2.5 pt-0.5 text-sm font-medium transition-colors hover:text-foreground 2xl:px-3",
                  ativo ? "border-accent text-foreground" : "border-transparent text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Atalhos do celular: explorar → comparar → simular */}
        <nav aria-label="Atalhos" className="ml-auto flex gap-0.5 lg:hidden">
          {ATALHOS.map((link) => {
            const ativo = isAtivo(link, pathname);
            return (
              <Link
                key={link.id}
                to={link.to}
                onClick={() => rastrear(link, "atalho_celular")}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-2 text-[13px] font-semibold transition-colors min-[400px]:px-2.5",
                  ativo ? "bg-accent-light text-primary" : "text-foreground-medium hover:bg-secondary",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Lado direito */}
        <div className="flex min-w-0 items-center gap-2 lg:ml-auto">
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden min-h-[44px] gap-1.5 lg:inline-flex" aria-label={displayName ? `Conta de ${displayName}` : "Conta"}>
                    <User className="h-4 w-4" />
                    <span className="hidden max-w-[140px] truncate 2xl:inline">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 font-body">
                  <DropdownMenuItem asChild className="min-h-[44px] gap-2"><Link to={CAMINHO_AREA_EXCLUSIVA}><BookOpen className="h-4 w-4" />Área exclusiva</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="min-h-[44px] gap-2"><Link to="/painel"><LayoutDashboard className="h-4 w-4" />Painel</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="min-h-[44px] gap-2"><Link to="/projetos"><FolderOpen className="h-4 w-4" />Meus Projetos</Link></DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem asChild className="min-h-[44px] gap-2"><Link to="/admin"><Flame className="h-4 w-4" />Admin</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => { void handleLogout(); }} className="min-h-[44px] gap-2"><LogOut className="h-4 w-4" />Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" asChild className="hidden min-h-[44px] px-3.5 text-sm font-medium text-primary lg:inline-flex">
                <Link to="/login">Login</Link>
              </Button>
            )
          )}

          <OrcamentoButton
            local="navbar"
            icone={false}
            className="hidden min-h-[44px] whitespace-nowrap px-[18px] text-sm font-semibold sm:inline-flex"
          />

          {/* Menu do celular/tablet */}
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
        <SheetContent side="right" className="flex w-[300px] max-w-[85vw] flex-col gap-0 p-0 font-body">
          <SheetHeader className="space-y-1 border-b border-border px-4 pb-3 pt-5 text-left">
            <SheetTitle className="flex items-center gap-2.5">
              <img src={bwildLogo} alt="Bewild" className="h-7 w-auto" />
              <span className="border-l border-border pl-2.5 text-xs font-semibold tracking-[0.02em] text-muted-foreground">Radar</span>
            </SheetTitle>
            <SheetDescription className="text-xs">{progressoGuia ?? "Guia do investidor em studios para short stay em São Paulo"}</SheetDescription>
          </SheetHeader>
          {/* Um bloco rolável só: orçamento no topo, telas agrupadas pela tarefa, conta no fim. */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="border-b border-border px-4 py-4">
              <OrcamentoButton local="navbar" icone={false} className="w-full min-h-[44px] font-semibold" />
            </div>
            {menuGuia && (
              <div className="border-b border-border px-3 py-3">
                <p className="rotulo-secao px-3 pb-1">Seções do guia</p>
                {menuGuia(fechar)}
              </div>
            )}
            <nav aria-label="Navegação principal" className="flex flex-col px-3 py-3">
              <Link
                to="/"
                onClick={() => { trackGlobal("cta_clicked", { cta_id: "guia", section: "menu_lateral" }); fechar(); }}
                aria-current={pathname === "/" ? "page" : undefined}
                className={cn("flex min-h-[44px] items-center rounded-lg px-3 text-base transition-colors hover:bg-secondary", pathname === "/" ? "bg-accent-light font-semibold text-primary" : "text-foreground")}
              >
                Início
              </Link>
              {GRUPOS_MENU.map((grupo) => (
                <div key={grupo.titulo} className="mt-3">
                  <p className="rotulo-secao px-3 pb-1">{grupo.titulo}</p>
                  {grupo.links.map((link) => {
                    const ativo = isAtivo(link, pathname);
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => { rastrear(link, "menu_lateral"); fechar(); }}
                        aria-current={ativo ? "page" : undefined}
                        className={cn(
                          "flex min-h-[44px] items-center rounded-lg px-3 text-base transition-colors hover:bg-secondary",
                          ativo ? "bg-accent-light font-semibold text-primary" : "text-foreground",
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="border-t border-border px-4 py-4">
              {!loading && (
                user ? (
                  <div className="flex flex-col gap-1">
                    <Link to={CAMINHO_AREA_EXCLUSIVA} onClick={fechar} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary"><BookOpen className="h-4 w-4" />Área exclusiva</Link>
                    <Link to="/painel" onClick={fechar} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary"><LayoutDashboard className="h-4 w-4" />Painel</Link>
                    <Link to="/projetos" onClick={fechar} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary"><FolderOpen className="h-4 w-4" />Meus Projetos</Link>
                    {isAdmin && <Link to="/admin" onClick={fechar} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary"><Flame className="h-4 w-4" />Admin</Link>}
                    <button type="button" onClick={() => { fechar(); void handleLogout(); }} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-secondary"><LogOut className="h-4 w-4" />Sair{displayName ? ` (${displayName})` : ""}</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" asChild className="flex-1 min-h-[44px]"><Link to="/login" onClick={fechar}>Login</Link></Button>
                    <Button variant="ghost" asChild className="flex-1 min-h-[44px]"><Link to="/signup" onClick={fechar}>Criar conta</Link></Button>
                  </div>
                )
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
