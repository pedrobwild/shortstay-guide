import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import {
  HardHat, CheckCircle2, Loader2, CircleDashed, Hammer,
  CalendarDays, ImageIcon, Sparkles, Camera,
} from "lucide-react";

type PhaseRow = Database["public"]["Tables"]["project_phases"]["Row"];
type UpdateRow = Database["public"]["Tables"]["project_updates"]["Row"];

interface ProjectTimelineProps {
  projectId: string;
}

type PhaseStatus = "planned" | "in_progress" | "completed";

/** Configuração visual por status — status nunca é comunicado só por cor:
 * sempre acompanha ícone + rótulo textual (acessibilidade). */
const STATUS_CONFIG: Record<PhaseStatus, {
  label: string;
  Icon: typeof CheckCircle2;
  badgeClass: string;
  dotClass: string;
}> = {
  planned: {
    label: "Planejado",
    Icon: CircleDashed,
    badgeClass: "bg-muted text-muted-foreground border-border",
    dotClass: "bg-muted-foreground/40",
  },
  in_progress: {
    label: "Em andamento",
    Icon: Hammer,
    badgeClass: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  completed: {
    label: "Concluído",
    Icon: CheckCircle2,
    badgeClass: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
};

const asStatus = (s: string): PhaseStatus =>
  s === "in_progress" || s === "completed" ? s : "planned";

const fmtDate = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : null;

const fmtRange = (a: string | null, b: string | null) => {
  const fa = fmtDate(a);
  const fb = fmtDate(b);
  if (fa && fb) return `${fa} → ${fb}`;
  return fa || fb || "Datas a definir";
};

export default function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const { toast } = useToast();
  const [phases, setPhases] = useState<PhaseRow[]>([]);
  const [updates, setUpdates] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: ph, error: phErr }, { data: up, error: upErr }] = await Promise.all([
        supabase
          .from("project_phases")
          .select("*")
          .eq("project_id", projectId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("project_updates")
          .select("*")
          .eq("project_id", projectId)
          .order("update_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);
      if (phErr) throw phErr;
      if (upErr) throw upErr;
      setPhases(ph ?? []);
      setUpdates(up ?? []);
    } catch (err) {
      console.error("ProjectTimeline load error", err);
      setPhases([]);
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Progresso físico-financeiro consolidado (média simples das fases).
  const overall = useMemo(() => {
    if (phases.length === 0) return { physical: 0, financial: 0, completed: 0 };
    const sum = phases.reduce(
      (acc, p) => ({
        physical: acc.physical + Number(p.physical_pct ?? 0),
        financial: acc.financial + Number(p.financial_pct ?? 0),
        completed: acc.completed + (asStatus(p.status) === "completed" ? 1 : 0),
      }),
      { physical: 0, financial: 0, completed: 0 },
    );
    return {
      physical: Math.round(sum.physical / phases.length),
      financial: Math.round(sum.financial / phases.length),
      completed: sum.completed,
    };
  }, [phases]);

  // Seed manual (MVP): cria um cronograma de exemplo para o projeto.
  // RLS garante que só o dono do projeto consegue inserir.
  const handleSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const today = new Date();
      const iso = (offsetDays: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().slice(0, 10);
      };

      const seedPhases: Database["public"]["Tables"]["project_phases"]["Insert"][] = [
        {
          project_id: projectId, name: "Projeto e aprovações", sort_order: 1,
          status: "completed", physical_pct: 100, financial_pct: 100,
          description: "Levantamento, projeto executivo e orçamento aprovado.",
          planned_start: iso(-60), planned_end: iso(-40), actual_start: iso(-60), actual_end: iso(-42),
        },
        {
          project_id: projectId, name: "Demolição e infraestrutura", sort_order: 2,
          status: "completed", physical_pct: 100, financial_pct: 95,
          description: "Remoção de revestimentos, ajustes hidráulicos e elétricos.",
          planned_start: iso(-40), planned_end: iso(-20), actual_start: iso(-39), actual_end: iso(-18),
        },
        {
          project_id: projectId, name: "Acabamentos", sort_order: 3,
          status: "in_progress", physical_pct: 45, financial_pct: 50,
          description: "Pisos, pintura, marcenaria e louças/metais.",
          planned_start: iso(-18), planned_end: iso(15),
        },
        {
          project_id: projectId, name: "Mobiliário e decoração", sort_order: 4,
          status: "planned", physical_pct: 0, financial_pct: 10,
          description: "Montagem do enxoval, mobília e ambientação para anúncio.",
          planned_start: iso(15), planned_end: iso(30),
        },
        {
          project_id: projectId, name: "Entrega e publicação do anúncio", sort_order: 5,
          status: "planned", physical_pct: 0, financial_pct: 0,
          description: "Vistoria final, fotos profissionais e go-live nas OTAs.",
          planned_start: iso(30), planned_end: iso(37),
        },
      ];

      const { data: insertedPhases, error: phErr } = await supabase
        .from("project_phases")
        .insert(seedPhases)
        .select("id, name");
      if (phErr) throw phErr;

      const findPhase = (name: string) => insertedPhases?.find((p) => p.name === name)?.id ?? null;

      const seedUpdates: Database["public"]["Tables"]["project_updates"]["Insert"][] = [
        {
          project_id: projectId, phase_id: findPhase("Demolição e infraestrutura"),
          title: "Infraestrutura concluída", update_date: iso(-18),
          body: "Nova tubulação e quadro elétrico finalizados. Tudo pronto para os acabamentos.",
          image_url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=60",
        },
        {
          project_id: projectId, phase_id: findPhase("Acabamentos"),
          title: "Pintura em andamento", update_date: iso(-5),
          body: "Paredes niveladas e primeira demão aplicada. Marcenaria chega na próxima semana.",
          image_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=60",
        },
        {
          project_id: projectId, phase_id: findPhase("Acabamentos"),
          title: "Piso instalado", update_date: iso(-1),
          body: "Porcelanato assentado em toda a área social. Rejunte em finalização.",
          image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=60",
        },
      ];

      const { error: upErr } = await supabase.from("project_updates").insert(seedUpdates);
      if (upErr) throw upErr;

      toast({
        title: "Timeline de exemplo criada",
        description: `${seedPhases.length} fases e ${seedUpdates.length} atualizações adicionadas.`,
      });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Erro ao criar timeline", description: message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-3">
        <TimelineHeader />
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Carregando timeline...
        </div>
      </section>
    );
  }

  // Estado vazio acionável
  if (phases.length === 0) {
    return (
      <section className="space-y-3">
        <TimelineHeader />
        <Card className="border-dashed border-primary/40 bg-primary/5">
          <CardContent className="py-12 text-center space-y-3">
            <HardHat className="h-10 w-10 mx-auto text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Nenhuma fase cadastrada ainda</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Acompanhe a evolução físico-financeira da sua reforma aqui. Crie um cronograma de
                exemplo para visualizar como a BWild reporta cada etapa da obra.
              </p>
            </div>
            <Button type="button" size="sm" onClick={handleSeed} disabled={seeding} className="gap-1.5">
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {seeding ? "Criando..." : "Criar timeline de exemplo"}
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const allCompleted = overall.completed === phases.length;

  return (
    <section className="space-y-5">
      <TimelineHeader />

      {/* Resumo do progresso consolidado */}
      <Card className={allCompleted ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-primary/20 bg-primary/[0.02]"}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {allCompleted
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                : <Hammer className="h-4 w-4 text-primary" />}
              <h3 className="text-sm font-medium text-foreground">
                {allCompleted ? "Reforma concluída" : "Andamento da reforma"}
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {overall.completed}/{phases.length} fases concluídas
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProgressMeter label="Avanço físico" value={overall.physical} />
            <ProgressMeter label="Avanço financeiro" value={overall.financial} />
          </div>
        </CardContent>
      </Card>

      {/* Fases do cronograma */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Cronograma</h3>
        <Accordion type="multiple" className="space-y-2">
          {phases.map((phase) => {
            const status = asStatus(phase.status);
            const cfg = STATUS_CONFIG[status];
            return (
              <AccordionItem
                key={phase.id}
                value={phase.id}
                className="rounded-lg border border-border bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-start gap-3 text-left w-full pr-2">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dotClass}`} aria-hidden />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{phase.name}</span>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${cfg.badgeClass}`}>
                          <cfg.Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {fmtRange(phase.actual_start ?? phase.planned_start, phase.actual_end ?? phase.planned_end)}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="pl-[22px] space-y-3">
                    {phase.description && (
                      <p className="text-xs text-muted-foreground">{phase.description}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <ProgressMeter label="Físico" value={Number(phase.physical_pct ?? 0)} compact />
                      <ProgressMeter label="Financeiro" value={Number(phase.financial_pct ?? 0)} compact />
                    </div>
                    {(phase.planned_start || phase.planned_end) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                        <span>Planejado: {fmtRange(phase.planned_start, phase.planned_end)}</span>
                        {(phase.actual_start || phase.actual_end) && (
                          <span>Realizado: {fmtRange(phase.actual_start, phase.actual_end)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Atualizações de andamento (ordem cronológica decrescente) */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5" />
          Atualizações da obra
        </h3>
        {updates.length === 0 ? (
          <Card className="border-dashed border-muted-foreground/30">
            <CardContent className="py-8 text-center">
              <ImageIcon className="h-7 w-7 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">
                Ainda não há registros de andamento. As fotos e atualizações da obra aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {updates.map((u) => (
              <UpdateCard key={u.id} update={u} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TimelineHeader() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <HardHat className="h-4 w-4 text-primary" />
        Timeline da reforma
      </h2>
      <p className="text-sm text-muted-foreground mt-0.5">
        Acompanhe cada etapa da obra — cronograma físico-financeiro, marcos e fotos de andamento.
      </p>
    </div>
  );
}

function ProgressMeter({ label, value, compact }: { label: string; value: number; compact?: boolean }) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
      <Progress
        value={pct}
        className={compact ? "h-1.5" : "h-2"}
        aria-label={`${label}: ${pct}%`}
      />
    </div>
  );
}

function UpdateCard({ update }: { update: UpdateRow }) {
  const [imgError, setImgError] = useState(false);
  const date = fmtDate(update.update_date);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {update.image_url && !imgError && (
          <div className="sm:w-44 shrink-0 bg-muted">
            <img
              src={update.image_url}
              alt={update.title ? `Foto: ${update.title}` : "Foto de andamento da obra"}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-40 w-full object-cover sm:h-full"
            />
          </div>
        )}
        <CardContent className="p-4 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            {update.title && <p className="text-sm font-medium text-foreground">{update.title}</p>}
            {date && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                <CalendarDays className="h-3 w-3" />
                {date}
              </span>
            )}
          </div>
          {update.body && <p className="text-xs text-muted-foreground">{update.body}</p>}
        </CardContent>
      </div>
    </Card>
  );
}
