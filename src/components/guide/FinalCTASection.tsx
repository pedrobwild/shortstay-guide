import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle2, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackGlobal, getGlobalSessionId } from "@/hooks/useGuideAnalytics";
import { useBairroData } from "@/hooks/useBairroData";
import { toast } from "sonner";
import SectionBlock from "./SectionBlock";
import {
  provisionProjectForLead,
  savePendingProvision,
  type LeadIntent,
} from "@/lib/leadProvisioning";

type Phase = "form" | "access" | "done";

export default function FinalCTASection() {
  const { bairros } = useBairroData();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", whatsapp: "", neighborhood: "", area_sqm: "", objective: "" });
  const [phase, setPhase] = useState<Phase>("form");
  const [loading, setLoading] = useState(false);

  // Acesso exclusivo
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const leadIntent = (): LeadIntent => ({
    name: form.name,
    whatsapp: form.whatsapp,
    neighborhood: form.neighborhood || undefined,
    area_sqm: form.area_sqm || undefined,
    objective: form.objective || undefined,
  });

  const handleSubmit = async () => {
    if (!form.name || !form.whatsapp) {
      toast.error("Preencha nome e WhatsApp.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("guide_leads").insert({
        name: form.name,
        whatsapp: form.whatsapp,
        neighborhood: form.neighborhood || null,
        area_sqm: form.area_sqm || null,
        objective: form.objective || null,
        source: "guide_cta_final",
        // Vincula o lead à sessão de telemetria para o score de prontidão.
        session_id: getGlobalSessionId(),
      });
      if (error) throw error;
      trackGlobal("lead_submitted", { source: "cta_final", bairro: form.neighborhood });
      // Em vez de encerrar, oferece criar o acesso exclusivo no mesmo fluxo.
      setPhase("access");
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: form.name },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        toast.error("Este email já tem acesso. Faça login para ver sua proposta.");
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    const intent = leadIntent();
    trackGlobal("lead_access_created", { source: "cta_final", bairro: form.neighborhood });

    if (data.session && data.user) {
      // Confirmação de email desativada: provisiona e entra direto na proposta.
      const { projectId } = await provisionProjectForLead(data.user.id, intent);
      setLoading(false);
      navigate(projectId ? `/projeto/${projectId}` : "/projetos");
      return;
    }

    // Confirmação de email exigida: guarda a intenção para concluir no retorno.
    savePendingProvision(intent);
    setNeedsConfirmation(true);
    setPhase("done");
    setLoading(false);
  };

  const skipAccess = () => {
    setNeedsConfirmation(false);
    setPhase("done");
  };

  if (phase === "done") {
    return (
      <SectionBlock
        id="cta-final"
        title={needsConfirmation ? "Acesso quase pronto" : "Diagnóstico Solicitado"}
        takeaway={needsConfirmation ? "Confirme seu email para abrir sua proposta." : "Recebemos seus dados."}
        className="[&_h2]:text-primary-foreground [&_>div>p:first-of-type]:text-primary-foreground/80"
      >
        <Card className="border-primary-foreground/20 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
            {needsConfirmation ? (
              <>
                <p className="font-display text-2xl font-bold text-foreground mb-2">
                  Seu acesso exclusivo está quase pronto
                </p>
                <p className="text-muted-foreground font-body">
                  Enviamos um link de confirmação para <strong>{email}</strong>. Confirme e sua
                  proposta personalizada já estará montada quando você voltar.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl font-bold text-foreground mb-2">Obrigado, {form.name}!</p>
                <p className="text-muted-foreground font-body">
                  Entraremos em contato pelo WhatsApp em até 24h com seu diagnóstico personalizado.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </SectionBlock>
    );
  }

  if (phase === "access") {
    return (
      <SectionBlock
        id="cta-final"
        title="Seu acesso exclusivo BWild"
        takeaway="Crie seu acesso e veja agora sua proposta personalizada."
        className="[&_h2]:text-primary-foreground [&_>div>p:first-of-type]:text-primary-foreground/80"
      >
        <Card className="border-border/30 bg-card/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4 text-foreground">
              <Lock size={18} className="text-primary" />
              <p className="font-display font-bold">
                Desbloqueie a projeção{form.neighborhood ? ` para ${form.neighborhood}` : ""}
              </p>
            </div>
            <form onSubmit={handleCreateAccess} className="space-y-4">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-body min-h-[48px] text-base"
              />
              <Input
                type="password"
                placeholder="Crie uma senha (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="font-body min-h-[48px] text-base"
              />
              <Button type="submit" disabled={loading} className="w-full font-body min-h-[48px]" size="lg">
                <Mail size={16} className="mr-2" />
                {loading ? "Criando acesso..." : "Criar meu acesso exclusivo"}
              </Button>
            </form>
            <div className="mt-4 text-center space-y-1">
              <button
                type="button"
                onClick={skipAccess}
                className="text-sm text-muted-foreground hover:underline font-body"
              >
                Prefiro só falar com a equipe
              </button>
              <p className="text-sm text-muted-foreground font-body">
                Já tem acesso?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </SectionBlock>
    );
  }

  return (
    <SectionBlock id="cta-final" title="Solicitar Diagnóstico Gratuito" takeaway="Análise personalizada do potencial do seu studio em short stay." className="[&_h2]:text-primary-foreground [&_>div>p:first-of-type]:text-primary-foreground/80">
      <Card className="border-border/30 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="font-body min-h-[48px] text-base" />
            <Input placeholder="WhatsApp (com DDD)" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="font-body min-h-[48px] text-base" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={form.neighborhood} onValueChange={(v) => setForm({ ...form, neighborhood: v })}>
              <SelectTrigger className="font-body min-h-[48px] text-base"><SelectValue placeholder="Bairro (opcional)" /></SelectTrigger>
              <SelectContent>
                {bairros.map((b) => (
                  <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.area_sqm} onValueChange={(v) => setForm({ ...form, area_sqm: v })}>
              <SelectTrigger className="font-body min-h-[48px] text-base"><SelectValue placeholder="Metragem (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="20-25">20–25 m²</SelectItem>
                <SelectItem value="26-35">26–35 m²</SelectItem>
                <SelectItem value="36-50">36–50 m²</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.objective} onValueChange={(v) => setForm({ ...form, objective: v })}>
              <SelectTrigger className="font-body min-h-[48px] text-base"><SelectValue placeholder="Objetivo (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="comprar">Comprar studio</SelectItem>
                <SelectItem value="reformar">Reformar studio</SelectItem>
                <SelectItem value="decorar">Decorar studio</SelectItem>
                <SelectItem value="operar">Iniciar operação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full font-body min-h-[48px]" size="lg">
            <Send size={16} className="mr-2" />
            {loading ? "Enviando..." : "Solicitar diagnóstico gratuito"}
          </Button>
          <p className="text-xs text-muted-foreground text-center font-body">Seus dados são confidenciais. Resposta em até 24h via WhatsApp.</p>
        </CardContent>
      </Card>
    </SectionBlock>
  );
}
