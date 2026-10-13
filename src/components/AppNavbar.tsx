import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import OrcamentoButton from "@/components/OrcamentoButton";
import { LogOut, User, FolderOpen, LayoutDashboard, Flame, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { LINKS_PUBLICOS, type LinkNavegacao } from "@/data/navegacao";
import bwildLogo from "@/assets/bewild-logo.webp";

/** Link ativo: "/" só na home; demais rotas pelo prefixo; âncoras nunca ficam ativas. */
function isAtivo(link: LinkNavegacao, pathname: string) {
  if (link.to.includes("#")) return false;
  if (link.to === "/") return pathname === "/";
  return pathname === link.to || pathname.startsWith(`${link.to}/`);
}

const rastrear = (link: LinkNavegacao) => trackGlobal("cta_clicked", { cta_id: link.id, section: "navbar" });

/**
 * Navbar global: logo, links públicos do Radar (Guia, Mercado, Mapa, Ranking,
 * Simular, Ferramentas), pedido de orçamento e acesso à conta.
 * No celular, os links ficam num menu lateral com alvos de 44px.
 * `fixo={false}` deixa a barra rolar com a página — usado nas telas de dados
 * que já têm abas fixas no topo, para as duas barras não se sobreporem.
 */
export default function AppNavbar({ fixo = true }: { fixo?: boolean }) {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Nome do usuário vem do metadata do signup
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <header className={`${fixo ? "sticky top-0" : "relative"} z-40 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60`}>
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between gap-3 px-4">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Radar Bewild — início">
          <img src={bwildLogo} alt="Bewild" className="h-7 w-auto" />
        </Link>

        {/* Links públicos (desktop) */}
        <nav aria-label="Navegação principal" className="hidden lg:flex items-center gap-1">
          {LINKS_PUBLICOS.map((link) => {
            const ativo = isAtivo(link, pathname);
            return (
              <Link
                key={link.id}
                to={link.to}
                onClick={() => rastrear(link)}
                aria-current={ativo ? "page" : undefined}
                className={`inline-flex min-h-[44px] items-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${ativo ? "text-foreground" : "text-muted-foreground"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Lado direito */}
        <div className="flex min-w-0 items-center gap-2">
          <OrcamentoButton local="navbar" size="sm" className="hidden sm:inline-flex min-h-[44px]" />

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
                <span className="hidden xl:flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {displayName}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="min-h-[44px]" aria-label="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild className="min-h-[44px]">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden xl:inline-flex min-h-[44px]">
                  <Link to="/signup">Criar conta</Link>
                </Button>
              </div>
            )
          )}

          {/* Menu do celular/tablet */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden min-h-[44px] min-w-[44px]"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/60">
            <SheetTitle className="flex items-center gap-2">
              <img src={bwildLogo} alt="Bewild" className="h-7 w-auto" />
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Navegação principal" className="flex flex-col gap-1 px-3 py-4">
            {LINKS_PUBLICOS.map((link) => {
              const ativo = isAtivo(link, pathname);
              return (
                <Link
                  key={link.id}
                  to={link.to}
                  onClick={() => { rastrear(link); setMenuAberto(false); }}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex min-h-[44px] items-center rounded-md px-3 text-base transition-colors hover:bg-muted ${ativo ? "bg-muted font-semibold text-foreground" : "text-foreground"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border/60 px-4 py-4 space-y-3">
            <OrcamentoButton local="navbar" className="w-full min-h-[44px]" />
            {!loading && (
              user ? (
                <div className="flex flex-col gap-1">
                  <Link to="/painel" onClick={() => setMenuAberto(false)} className="flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"><LayoutDashboard className="h-4 w-4" />Painel</Link>
                  <Link to="/projetos" onClick={() => setMenuAberto(false)} className="flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"><FolderOpen className="h-4 w-4" />Meus Projetos</Link>
                  {isAdmin && <Link to="/admin" onClick={() => setMenuAberto(false)} className="flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"><Flame className="h-4 w-4" />Admin</Link>}
                  <button type="button" onClick={() => { setMenuAberto(false); void handleLogout(); }} className="flex min-h-[44px] items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-muted"><LogOut className="h-4 w-4" />Sair{displayName ? ` (${displayName})` : ""}</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" asChild className="flex-1 min-h-[44px]"><Link to="/login" onClick={() => setMenuAberto(false)}>Entrar</Link></Button>
                  <Button variant="ghost" asChild className="flex-1 min-h-[44px]"><Link to="/signup" onClick={() => setMenuAberto(false)}>Criar conta</Link></Button>
                </div>
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
