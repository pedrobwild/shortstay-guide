import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, MapPin, Ruler, Target, Loader2, Activity } from "lucide-react";
import { TIER_META } from "@/lib/leadScore";
import { useLeadEvents, type ScoredLead } from "@/hooks/useLeadScores";
import { whatsappHref, fmtBRL, fmtDateTime, EVENT_LABELS } from "@/lib/adminFormat";

export default function LeadDetailSheet({
  lead,
  onClose,
}: {
  lead: ScoredLead | null;
  onClose: () => void;
}) {
  const events = useLeadEvents(lead?.session_id ?? null);

  return (
    <Sheet open={!!lead} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        {lead && (
          <div className="flex flex-col h-full">
            <SheetHeader className="p-5 pb-4 space-y-2 text-left">
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="font-display text-xl">{lead.name}</SheetTitle>
                <Badge variant="outline" className={TIER_META[lead.scoring.tier].className}>
                  {lead.scoring.score} · {TIER_META[lead.scoring.tier].label}
                </Badge>
              </div>
              <SheetDescription className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {lead.neighborhood && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {lead.neighborhood}
                  </span>
                )}
                {lead.area_sqm && (
                  <span className="inline-flex items-center gap-1">
                    <Ruler className="h-3 w-3" /> {lead.area_sqm} m²
                  </span>
                )}
                {lead.objective && (
                  <span className="inline-flex items-center gap-1">
                    <Target className="h-3 w-3" /> {lead.objective}
                  </span>
                )}
              </SheetDescription>
              <Button asChild size="sm" className="gap-1.5 w-full mt-1">
                <a href={whatsappHref(lead.whatsapp)} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Contatar no WhatsApp
                </a>
              </Button>
            </SheetHeader>

            <Separator />

            <div className="p-5 space-y-5">
              {/* Composição do score */}
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                  Composição do score
                </h3>
                <ul className="space-y-1.5">
                  {lead.scoring.factors.map((f) => (
                    <li key={f.key} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className={f.points > 0 ? "text-foreground" : "text-muted-foreground"}>
                          {f.label}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {f.points}/{f.max}
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(f.points / f.max) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Premissas simuladas */}
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                  Premissas simuladas
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Valor do imóvel" value={lead.property_value ? fmtBRL(lead.property_value) : "—"} />
                  <Metric label="ADR simulada" value={lead.assumption_adr ? fmtBRL(lead.assumption_adr) : "—"} />
                  <Metric label="Projetos" value={String(lead.project_count)} />
                  <Metric label="Conta criada" value={lead.has_account ? "Sim" : "Não"} />
                </div>
              </section>

              {/* Timeline de eventos */}
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Eventos da sessão
                </h3>
                {!lead.session_id ? (
                  <p className="text-xs text-muted-foreground">
                    Lead capturado antes do rastreio de sessão — sem timeline.
                  </p>
                ) : events.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando eventos…
                  </div>
                ) : (events.data?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum evento registrado.</p>
                ) : (
                  <ScrollArea className="h-56 pr-3">
                    <ol className="space-y-2 border-l border-border pl-3">
                      {events.data!.map((e) => (
                        <li key={e.id} className="text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">
                              {EVENT_LABELS[e.event_type] ?? e.event_type}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              {fmtDateTime(e.created_at)}
                            </span>
                          </div>
                          <EventDetail data={e.event_data} />
                        </li>
                      ))}
                    </ol>
                  </ScrollArea>
                )}
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function EventDetail({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") return null;
  const entries = Object.entries(data as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length === 0) return null;
  return (
    <p className="text-muted-foreground truncate">
      {entries.map(([k, v]) => `${k}: ${String(v)}`).join(" · ")}
    </p>
  );
}
