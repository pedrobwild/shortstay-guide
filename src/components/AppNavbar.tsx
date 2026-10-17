import { useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import OrcamentoButton from "@/components/OrcamentoButton";
import { LogOut, User, FolderOpen, LayoutDashboard, Flame, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { ATALHOS_CELULAR, LINKS_PUBLICOS, type LinkNavegacao } from "@/data/navegacao";
import bwildLogo from "@/assets/bewild-logo.webp";
import bewildSymbol from "@/assets/bewild-symbol.webp";
import { cn } from "@/lib/utils";

/** Link ativo: "/" só na home; demais rotas pelo prefixo; âncoras nunca ficam ativas. */
function isAtivo(link: LinkNavegacao, pathname: string) {
  if (link.to.includes("#")) return false;
  if (link.to === "/") return pathname === "/";
  return pathname === link.to || pathname.startsWith(`${link.to}/`);
}

const rastrear = (link: LinkNavegacao, section = "navbar") => trackGlobal("cta_clicked", { cta_id: link.id, section });

/** Links que só cabem na barra a partir de 1280px (antes disso ficam no menu lateral). */
const SO_TELA_LARGA = new Set(["ranking", "ferramentas"]);
const ATALHOS = ATALHOS_CELULAR.map((id) => LINKS_PUBLICOS.find((l) => l.id === id)).filter((l): l is LinkNavegacao => Boolean(l));

/**
 * Navbar global do Radar (direção Híbrida): logo + "Radar", links públicos com o
 * item ativo sublinhado em ciano, "Entrar" e "Solicitar orçamento".
 * No celular (56px): atalhos Mapa / Comparar / Simular e o menu lateral com todos
 * os links, o orçamento e a conta. Na home, o menu também traz as seções do guia
 * (`menuGuia`) e a barra respeita o trilho do índice (`comTrilhoGuia`).
 * `fixo={false}` deixa a barra rolar com a página — usado nas telas de dados
 * que já têm abas fixas no topo, para as duas barras não se sobreporem.
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
                  "inline-flex items-center whitespace-nowrap border-b-2 px-2.5 pt-0.5 text-sm font-medium transition-colors hover:text-foreground xl:px-3",
                  ativo ? "border-accent text-foreground" : "border-transparent text-muted-foreground",
                  // Entre 1024 e 1279px, Ranking e Ferramentas ficam no menu lateral para a barra caber.
                  SO_TELA_LARGA.has(link.id) && "hidden xl:inline-flex",
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
              <div className="hidden lg:flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
                  <Link to="/painel" className="gap-1.5" aria-label="Painel">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden xl:inline">Painel</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
                  <Link to="/projetos" className="gap-1.5" aria-label="Meus Projetos">
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden xl:inline">Meus Projetos</span>
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
                    <Link to="/admin" className="gap-1.5" aria-label="Admin">
                      <Flame className="h-4 w-4" />
                      <span className="hidden xl:inline">Admin</span>
                    </Link>
                  </Button>
                )}
                <span className="hidden 2xl:flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {displayName}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="min-h-[44px]" aria-label="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" asChild className="hidden min-h-[44px] px-3.5 text-sm font-medium text-primary lg:inline-flex">
                <Link to="/login">Entrar</Link>
              </Button>
            )
          )}

          <OrcamentoButton
            local="navbar"
            rotulo="Solicitar orçamento"
            icone={false}
            className="hidden min-h-[44px] whitespace-nowrap px-[18px] text-sm font-semibold sm:inline-flex"
          />

          {/* Menu do celular/tablet */}
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px] xl:hidden"
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
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {menuGuia && (
              <div className="border-b border-border px-3 py-3">
                <p className="rotulo-secao px-3 pb-1">Seções do guia</p>
                {menuGuia(fechar)}
              </div>
            )}
            <nav aria-label="Navegação principal" className="flex flex-col gap-0.5 px-3 py-3">
              <p className="rotulo-secao px-3 pb-1">Explorar o Radar</p>
              {LINKS_PUBLICOS.map((link) => {
                const ativo = isAtivo(link, pathname);
                return (
                  <Link
                    key={link.id}
                    to={link.to}
                    onClick={() => { rastrear(link, menuGuia ? "menu_celular" : "navbar"); fechar(); }}
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
            </nav>
          </div>
          <div className="space-y-3 border-t border-border px-4 py-4">
            <OrcamentoButton local="navbar" rotulo="Solicitar orçamento" icone={false} className="w-full min-h-[44px] font-semibold" />
            {!loading && (
              user ? (
                <div className="flex flex-col gap-1">
                  <Link to="/painel" onClick={fechar} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary"><LayoutDashboard className="h-4 w-4" />Painel</Link>
                  <Link to="/projetos" onClick={fechar} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary"><FolderOpen className="h-4 w-4" />Meus Projetos</Link>
                  {isAdmin && <Link to="/admin" onClick={fechar} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm hover:bg-secondary"><Flame className="h-4 w-4" />Admin</Link>}
                  <button type="button" onClick={() => { fechar(); void handleLogout(); }} className="flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-secondary"><LogOut className="h-4 w-4" />Sair{displayName ? ` (${displayName})` : ""}</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" asChild className="flex-1 min-h-[44px]"><Link to="/login" onClick={fechar}>Entrar</Link></Button>
                  <Button variant="ghost" asChild className="flex-1 min-h-[44px]"><Link to="/signup" onClick={fechar}>Criar conta</Link></Button>
                </div>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
