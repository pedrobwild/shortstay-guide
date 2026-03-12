import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { isValidIcalUrl } from "@/lib/icalUtils";

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
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (value: string) => {
    setIcalUrl(value);
    // Limpa erro de validação ao digitar
    if (validationError) setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Previne duplo clique
    if (saving) return;

    const trimmedUrl = icalUrl.trim();

    // Validação: campo vazio
    if (!trimmedUrl) {
      setValidationError("Cole a URL do calendário iCal do Airbnb.");
      return;
    }

    // Validação: formato da URL
    if (!isValidIcalUrl(trimmedUrl)) {
      setValidationError("A URL deve ser HTTPS e conter um link iCal válido (ex: .ics).");
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
      setValidationError(null);
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
          onChange={(e) => handleChange(e.target.value)}
          disabled={saving}
          className={`flex-1 ${validationError ? "border-destructive" : ""}`}
          aria-invalid={!!validationError}
        />
        <Button type="submit" disabled={saving || !icalUrl.trim()} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1">{saving ? "Salvando..." : "Adicionar"}</span>
        </Button>
      </div>
      {/* Erro de validação inline */}
      {validationError && (
        <p className="text-xs text-destructive">{validationError}</p>
      )}
      <p className="text-xs text-muted-foreground">
        No Airbnb, vá em Calendário → Exportar calendário → copie o link iCal.
      </p>
    </form>
  );
}
