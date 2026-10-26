import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";

import { destinoAposLogin } from "@/lib/loginDestino";
import bwildLogo from "@/assets/bewild-logo.webp";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: validacao, error: userError } = await supabase.auth.getUser();
      if (userError || !validacao.user) throw userError ?? new Error("Não foi possível validar seu acesso.");
      const { data: admin, error: roleError } = await supabase.rpc("has_role", { _user_id: validacao.user.id, _role: "admin" });
      if (roleError) throw new Error("Não foi possível conferir sua permissão. Tente novamente.");
      const from = typeof location.state?.from === "string" ? location.state.from : undefined;
      navigate(destinoAposLogin(admin === true, from), { replace: true });
    } catch (err) {
      toast({ title: "Erro ao entrar", description: (err instanceof Error ? err.message : "Erro inesperado"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex min-h-[44px] items-center mb-4"><img src={bwildLogo} alt="Bewild" className="h-8 w-auto" /></Link>
          <h1 className="font-display text-2xl font-bold text-foreground">Entrar no Radar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesse a área exclusiva com as análises de bairro do Radar.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" className="min-h-[44px] text-base" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" autoComplete="current-password" className="min-h-[44px] text-base" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Entrar
          </Button>
        </form>

        <div className="text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline block">
            Esqueci minha senha
          </Link>
          <p className="text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-primary hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
