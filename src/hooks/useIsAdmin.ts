import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Checa se o usuário autenticado tem o papel `admin` em `user_roles`.
 * A policy "Users can view own roles" permite ler apenas os próprios papéis,
 * então essa consulta é segura para o cliente.
 */
export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  return {
    isAdmin: query.data ?? false,
    loading: authLoading || (!!user && query.isLoading),
  };
}
