import { useEffect, useMemo, useState, createContext, useContext, startTransition } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener FIRST, then getSession
    // As atualizações vão como transição: chegam logo após a carga, muitas vezes antes de
    // a home pré-renderizada terminar de hidratar. Como atualização urgente, o React
    // descartaria o HTML pronto da página (erro #421); como transição, espera a hidratação.
    const aplicar = (s: Session | null) => startTransition(() => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => aplicar(session));

    supabase.auth.getSession().then(({ data: { session } }) => aplicar(session));

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useMemo(() => async () => { await supabase.auth.signOut(); }, []);

  // Valor estável: só muda quando o login muda (evita re-render de toda a árvore à toa).
  const valor = useMemo(() => ({ user, session, loading, signOut }), [user, session, loading, signOut]);

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}
