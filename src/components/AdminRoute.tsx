import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate, useLocation } from "react-router-dom";
import { DESTINO_PADRAO_CONTA } from "@/lib/loginDestino";
import { Loader2 } from "lucide-react";

/**
 * Protege rotas exclusivas de admin. Não autenticado → login;
 * autenticado mas sem role admin → área exclusiva (sem expor que a rota existe).
 * A segurança real é o RLS/RPC no banco; aqui é só UX de roteamento.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}${location.hash}` }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to={DESTINO_PADRAO_CONTA} replace />;
  }

  return <>{children}</>;
}
