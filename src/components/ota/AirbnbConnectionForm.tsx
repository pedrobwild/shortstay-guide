import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

/**
 * Formulário para cadastrar uma conexão Airbnb via iCal.
 * Salva a URL do calendário iCal na tabela ota_connections.
 */
interface AirbnbConnectionFormProps {
  projectId: string;
  onConnectionCreated: () => void;
}

export default function AirbnbConnectionForm({
  projectId,
  onConnectionCreated,
}: AirbnbConnectionFormProps) {
  const [icalUrl, setIcalUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = icalUrl.trim();
    if (!trimmedUrl) {
      toast({ title: "URL obrigatória", description: "Cole a URL do calendário iCal do Airbnb.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("ota_connections").insert({
        project_id: projectId,
        provider: "airbnb",
        connection_type: "ical",
        ical_url: trimmedUrl,
        status: "active",
      });

      if (error) throw error;

      toast({ title: "Conexão salva!", description: "A URL iCal do Airbnb foi cadastrada com sucesso." });
      setIcalUrl("");
      onConnectionCreated();
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4 space-y-3">
      <Label htmlFor="ical-url" className="text-sm font-medium text-foreground">
        URL do calendário iCal (Airbnb)
      </Label>
      <div className="flex gap-2">
        <Input
          id="ical-url"
          type="url"
          placeholder="https://www.airbnb.com/calendar/ical/..."
          value={icalUrl}
          onChange={(e) => setIcalUrl(e.target.value)}
          disabled={saving}
          className="flex-1"
        />
        <Button type="submit" disabled={saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1">{saving ? "Salvando..." : "Adicionar"}</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        No Airbnb, vá em Calendário → Exportar calendário → copie o link iCal.
      </p>
    </form>
  );
}
