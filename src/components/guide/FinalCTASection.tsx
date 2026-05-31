import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Send, CheckCircle2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useGuideAnalytics } from "@/hooks/useGuideAnalytics";
import { toast } from "sonner";
import {
  provisionProjectForLead,
  savePendingProvision,
  type LeadIntent,
} from "@/lib/leadProvisioning";

const NEIGHBORHOODS = [
  "Pinheiros", "Vila Madalena", "Itaim Bibi", "Jardins", "Vila Olímpia",
  "Moema", "Brooklin", "Vila Mariana", "Consolação", "Higienópolis",
];

const OBJECTIVES = [
  "Investir para renda passiva",
  "Comprar para morar e viajar",
  "Diversificar patrimônio",
  "Ainda estou avaliando",
];

type Phase = "form" | "access" | "done";

/** Conta apenas dígitos para validar o WhatsApp (DDD + número). */
function isValidWhatsapp(value: string) {
  return value.replace(/\D/g, "").length >= 10;
}

export function FinalCTASection() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [area, setArea] = useState("");
  const [objective, setObjective] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");

  // Acesso exclusivo
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const navigate = useNavigate();
  const { trackEvent } = useGuideAnalytics();

  const leadIntent = (): LeadIntent => ({
    name,
    whatsapp,
    neighborhood: neighborhood || undefined,
    area_sqm: area ? parseFloat(area) : null,
    objective: objective || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidWhatsapp(whatsapp)) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("guide_leads").insert({
      name,
      whatsapp,
      neighborhood: neighborhood || null,
      area_sqm: area ? parseFloat(area) : null,
      objective: objective || null,
      source: "guide_final_cta",
    });

    if (error) {
      console.error("Erro ao enviar lead:", error);
      toast.error("Não foi possível enviar. Tente novamente.");
    } else {
      trackEvent("lead_captured", { source: "final_cta", neighborhood });
      // Pré-popula o email com nada; segue para a oferta de acesso exclusivo.
      setPhase("access");
    }
    setLoading(false);
  };

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
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
    trackEvent("lead_access_created", { source: "final_cta", neighborhood });

    if (data.session && data.user) {
      // Confirmação de email desativada: provisiona e entra direto.
      const { projectId } = await provisionProjectForLead(data.user.id, intent);
      setLoading(false);
      if (projectId) {
        navigate(`/projeto/${projectId}`);
      } else {
        navigate("/projetos");
      }
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
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
            {needsConfirmation ? (
              <>
                <h2 className="text-3xl font-display font-bold mb-4">
                  Seu acesso exclusivo está quase pronto
                </h2>
                <p className="text-lg text-muted-foreground font-body mb-2">
                  Enviamos um link de confirmação para <strong>{email}</strong>.
                  Confirme e sua proposta personalizada já estará montada.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-display font-bold mb-4">
                  Recebemos seu interesse!
                </h2>
                <p className="text-lg text-muted-foreground font-body mb-2">
                  Nossa equipe entrará em contato em breve pelo WhatsApp.
                </p>
              </>
            )}
          </motion.div>
        </div>
      </section>
    );
  }

  if (phase === "access") {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-display font-bold mb-3">
              Seu acesso exclusivo BWild
            </h2>
            <p className="text-muted-foreground font-body">
              Crie seu acesso e veja agora a proposta personalizada
              {neighborhood ? ` para ${neighborhood}` : ""}.
            </p>
          </div>

          <form onSubmit={handleCreateAccess} className="space-y-4">
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Crie uma senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                "Criando acesso..."
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Criar meu acesso exclusivo
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
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
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Receba uma análise personalizada
          </h2>
          <p className="text-lg text-muted-foreground font-body">
            Preencha e nossa equipe prepara um estudo do seu investimento
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              placeholder="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
          </div>

          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Bairro de interesse</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <Input
            type="number"
            placeholder="Metragem desejada (m²)"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />

          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Seu objetivo</option>
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              "Enviando..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Quero minha análise
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
