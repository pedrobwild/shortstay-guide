import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, FlaskConical } from "lucide-react";
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
    if (validationError) setValidationError(null);
  };

  // ---------- Criar conexão REAL (com URL iCal) ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const trimmedUrl = icalUrl.trim();

    if (!trimmedUrl) {
      setValidationError("Cole a URL do calendário iCal do Airbnb.");
      return;
    }

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
        is_test: false,
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

  // ---------- Criar conexão de TESTE (sem URL) ----------
  const handleCreateTest = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("ota_connections").insert({
        project_id: projectId,
        provider: "airbnb",
        connection_type: "ical",
        ical_url: null,
        status: "active",
        is_test: true,
      });

      if (error) throw error;

      toast({
        title: "Conexão de teste criada!",
        description: "Clique em Sincronizar para gerar eventos de exemplo.",
      });
      onConnectionCreated();
    } catch (err: any) {
      toast({ title: "Erro ao criar teste", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Formulário para conexão real */}
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
        {validationError && (
          <p className="text-xs text-destructive">{validationError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          No Airbnb, vá em Calendário → Exportar calendário → copie o link iCal.
        </p>
      </form>

      {/* Botão para conexão de teste */}
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Modo teste</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Ainda não tem um anúncio no Airbnb? Crie uma conexão de teste para gerar eventos fictícios e continuar desenvolvendo.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCreateTest}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FlaskConical className="h-4 w-4 mr-1" />}
          Criar conexão de teste
        </Button>
      </div>
    </div>
  );
}
