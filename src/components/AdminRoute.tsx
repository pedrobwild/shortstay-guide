import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Protege rotas exclusivas de admin. Não autenticado → login;
 * autenticado mas sem role admin → painel (sem expor que a rota existe).
 * A segurança real é o RLS/RPC no banco; aqui é só UX de roteamento.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
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
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/painel" replace />;
  }

  return <>{children}</>;
}
