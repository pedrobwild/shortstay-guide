import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, FolderOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import bwildLogo from "@/assets/bwild-logo.png";

/**
 * Navbar global com logo, nome do usuário e logout.
 * Mostra login/signup quando não autenticado.
 */
export default function AppNavbar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Nome do usuário vem do metadata do signup
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={bwildLogo} alt="Bwild" className="h-7 w-auto" />
        </Link>

        {/* Right side */}
        {!loading && (
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{displayName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">Sair</span>
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Criar conta</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
