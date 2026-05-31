import { Link } from "react-router-dom";
import {
  Sparkles, ArrowRight, Wallet, TrendingUp, Map, BarChart3, Wrench,
  FolderOpen, CheckCircle2, Circle, LineChart, Building2, Loader2, Compass,
} from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BairroProvider } from "@/hooks/useBairroData";
import { useAuth } from "@/hooks/useAuth";
import { useProjectSummary } from "@/hooks/useProjectSummary";
import type { DealStatus } from "@/lib/dealStatus";
import type { ProjectionSummary } from "@/lib/projectAnalytics";

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

/** Atalhos de exploração comuns ao painel (vazio e populado). */
const SHORTCUTS = [
  { to: "/mapa-bairros", icon: Map, title: "Mapa de bairros", desc: "Compare diárias e ocupação por região." },
  { to: "/intelligence", icon: BarChart3, title: "Inteligência de mercado", desc: "Rankings e dados de listings reais." },
  { to: "/ferramentas", icon: Wrench, title: "Ferramentas do investidor", desc: "Diagnóstico, recomendação e plano de ação." },
  { to: "/projetos", icon: FolderOpen, title: "Meus projetos", desc: "Gerencie e crie novos studios." },
];

/**
 * Painel do cliente unificado — home pós-login.
 * Consolida a projeção do studio, o status da negociação e o próximo passo
 * sugerido, com atalhos para as demais ferramentas. Estado vazio acionável
 * quando o cliente ainda não tem projeto.
 */
export default function Painel() {
  return (
    <BairroProvider>
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <PainelContent />
        </main>
      </div>
    </BairroProvider>
  );
}

function PainelContent() {
  const { user } = useAuth();
  const summary = useProjectSummary();

  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";

  return (
    <>
      <header className="space-y-1">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {displayName ? `Olá, ${displayName}` : "Seu painel"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sua visão única: projeção do studio, status da negociação e próximos passos.
        </p>
      </header>

      {summary.loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Carregando seu painel...
        </div>
      ) : !summary.hasProject ? (
        <EmptyState />
      ) : (
        <PopulatedDashboard summary={summary} />
      )}

      <ShortcutsGrid />
    </>
  );
}

/** Estado vazio acionável: nenhum projeto ainda. */
function EmptyState() {
  return (
    <Card className="border-primary/30 bg-primary/[0.03] shadow-card">
      <CardContent className="p-6 md:p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Comece pela projeção do seu studio
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Em menos de um minuto você vê receita, ocupação e ROI estimados do seu imóvel —
            com base na média de mercado do bairro, sem conectar nenhum calendário.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
          <Button asChild size="lg" className="gap-1.5 w-full sm:w-auto">
            <Link to="/projecao">
              <LineChart className="h-4 w-4" />
              Criar minha projeção
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-1.5 w-full sm:w-auto">
            <Link to="/projetos">
              <FolderOpen className="h-4 w-4" />
              Ver meus projetos
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PopulatedDashboard({ summary }: { summary: ReturnType<typeof useProjectSummary> }) {
  const { project, projection, deal, hasPropertyValue } = summary;
  if (!project || !projection || !deal) return null;

  return (
    <div className="space-y-6">
      {/* Próximo passo — ação primária evidente */}
      <NextStepCard deal={deal} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProjectionCard
          projection={projection}
          hasPropertyValue={hasPropertyValue}
          projectId={project.id}
          projectName={project.name}
        />
        <StatusCard deal={deal} />
      </div>
    </div>
  );
}

/** Card de destaque com o próximo passo sugerido (ação primária). */
function NextStepCard({ deal }: { deal: DealStatus }) {
  return (
    <Card className="border-primary/40 bg-primary/[0.04] shadow-card">
      <CardContent className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-primary font-medium flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5" />
            Próximo passo
          </p>
          <h2 className="font-display text-lg font-semibold text-foreground">{deal.nextStep.label}</h2>
          <p className="text-sm text-muted-foreground max-w-xl">{deal.description}</p>
        </div>
        <Button asChild size="lg" className="gap-1.5 shrink-0 w-full sm:w-auto">
          <Link to={deal.nextStep.to}>
            {deal.nextStep.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Resumo da projeção: receita líquida anual + ROI. */
function ProjectionCard({
  projection, hasPropertyValue, projectId, projectName,
}: {
  projection: ProjectionSummary;
  hasPropertyValue: boolean;
  projectId: string;
  projectName: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Projeção do studio</h3>
          </div>
          <Badge variant="secondary" className="text-[10px] truncate max-w-[40%]">{projectName}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 space-y-0.5">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" /> Receita líquida anual
            </p>
            <p className="text-xl font-semibold text-primary">{brl(projection.annualNetRevenueBrl)}</p>
            <p className="text-[11px] text-muted-foreground">Margem {projection.netMarginPct.toFixed(0)}%</p>
          </div>
          <div className="rounded-lg border border-border p-3 space-y-0.5">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> ROI (cap rate)
            </p>
            {hasPropertyValue ? (
              <>
                <p className="text-xl font-semibold text-foreground">{projection.capRatePct.toFixed(1)}%</p>
                <p className="text-[11px] text-muted-foreground">
                  {projection.paybackYears !== null
                    ? `Payback ~${projection.paybackYears.toFixed(1)} anos`
                    : "ao ano"}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-muted-foreground">—</p>
                <p className="text-[11px] text-muted-foreground">Informe o valor do imóvel</p>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {projection.occupancyPct.toFixed(0)}% ocupação · {brl(projection.adr)}/noite
          </span>
        </div>

        <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
          <Link to={`/projeto/${projectId}`}>
            Ver projeção completa
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Status da negociação: etapa atual + checklist do funil. */
function StatusCard({ deal }: { deal: DealStatus }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">Status da negociação</h3>
          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            {deal.label}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${deal.progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{deal.progressPct}% concluído</p>
        </div>

        <ul className="space-y-2">
          {deal.steps.map((step) => (
            <li key={step.key} className="flex items-center gap-2 text-sm">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className={step.done ? "text-foreground" : "text-muted-foreground"}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Atalhos para as demais ferramentas da plataforma. */
function ShortcutsGrid() {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wide text-muted-foreground">Explorar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SHORTCUTS.map(({ to, icon: Icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-lg border border-border bg-card p-4 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
