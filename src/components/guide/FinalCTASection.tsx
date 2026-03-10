import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackGlobal } from "@/hooks/useGuideAnalytics";
import { useBairroData } from "@/hooks/useBairroData";
import { toast } from "sonner";
import SectionBlock from "./SectionBlock";

export default function FinalCTASection() {
  const { bairros } = useBairroData();
  const [form, setForm] = useState({ name: "", whatsapp: "", neighborhood: "", area_sqm: "", objective: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
      });
      if (error) throw error;
      trackGlobal("lead_submitted", { source: "cta_final", bairro: form.neighborhood });
      setSubmitted(true);
      toast.success("Solicitação enviada! Entraremos em contato em breve.");
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SectionBlock id="cta-final" title="Diagnóstico Solicitado" takeaway="Recebemos seus dados.">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-8 text-center">
            <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
            <p className="font-display text-2xl font-bold text-foreground mb-2">Obrigado, {form.name}!</p>
            <p className="text-muted-foreground font-body">Entraremos em contato pelo WhatsApp em até 24h com seu diagnóstico personalizado.</p>
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
