import { useEffect, useState } from "react";
import { loadPendingProvision } from "@/lib/leadProvisioning";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Vindo do simulador: mostra o que será guardado (bairro e m² da intenção pendente).
  const [simulacao, setSimulacao] = useState<{ bairro?: string; m2?: string } | null>(null);
  useEffect(() => {
    if (params.get("origem") !== "simulador") return;
    const intent = loadPendingProvision();
    if (intent?.neighborhood) setSimulacao({ bairro: intent.neighborhood, m2: intent.area_sqm });
  }, [params]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast({ title: "Conta criada!", description: "Você já pode acessar a plataforma." });
      navigate("/painel");
    } catch (err) {
      toast({ title: "Erro ao criar conta", description: (err instanceof Error ? err.message : "Erro inesperado"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Seu acesso exclusivo Bewild</h1>
          <p className="text-sm text-muted-foreground mt-1">Crie seu acesso e desbloqueie sua proposta personalizada</p>
          {simulacao && (
            <p className="mt-3 rounded-lg border border-primary/20 bg-secondary/60 px-3 py-2 text-sm text-foreground" role="status">
              Sua simulação de {simulacao.bairro}{simulacao.m2 ? ` (${simulacao.m2} m²)` : ""} vira um projeto no Painel assim que a conta for criada.
            </p>
          )}
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Criar conta
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
