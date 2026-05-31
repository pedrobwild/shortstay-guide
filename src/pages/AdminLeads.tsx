import { useEffect, useMemo, useState } from "react";
import AppNavbar from "@/components/AppNavbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  MessageCircle,
  Flame,
  Users,
  AlertCircle,
} from "lucide-react";
import { useLeadScores, type ScoredLead } from "@/hooks/useLeadScores";
import { TIER_META, type LeadTier } from "@/lib/leadScore";
import { whatsappHref, fmtBRL, fmtDate } from "@/lib/adminFormat";
import LeadDetailSheet from "@/components/admin/LeadDetailSheet";

type SortKey = "name" | "neighborhood" | "score" | "property_value" | "event_count" | "created_at";
type SortDir = "asc" | "desc";

interface Filters {
  search: string;
  tier: LeadTier | "all";
  onlyAccount: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
}

const FILTERS_KEY = "bwild_admin_leads_filters";

const DEFAULT_FILTERS: Filters = {
  search: "",
  tier: "all",
  onlyAccount: false,
  sortKey: "score",
  sortDir: "desc",
};

function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

export default function AdminLeads() {
  const { data, isLoading, isError } = useLeadScores();
  const [filters, setFilters] = useState<Filters>(loadFilters);
  const [selected, setSelected] = useState<ScoredLead | null>(null);

  // Filtros salvos (persistem entre sessões — pedido god-mode do T3).
  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
    } catch {
      // storage indisponível — segue sem persistir
    }
  }, [filters]);

  const leads = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const by = { quente: 0, morno: 0, frio: 0 } as Record<LeadTier, number>;
    for (const l of leads) by[l.scoring.tier]++;
    return { total: leads.length, ...by };
  }, [leads]);

  const rows = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    const filtered = leads.filter((l) => {
      if (filters.tier !== "all" && l.scoring.tier !== filters.tier) return false;
      if (filters.onlyAccount && !l.has_account) return false;
      if (term) {
        const hay = `${l.name} ${l.whatsapp} ${l.neighborhood ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    const dir = filters.sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => dir * compare(a, b, filters.sortKey));
  }, [leads, filters]);

  const setSort = (key: SortKey) =>
    setFilters((f) =>
      f.sortKey === key
        ? { ...f, sortDir: f.sortDir === "asc" ? "desc" : "asc" }
        : { ...f, sortKey: key, sortDir: key === "name" || key === "neighborhood" ? "asc" : "desc" },
    );

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Leads por prontidão
          </h1>
          <p className="text-sm text-muted-foreground">
            Priorização comercial: ataque primeiro os leads mais quentes, calculados a partir de
            engajamento, simulações e conta criada.
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total" value={stats.total} />
          <StatCard icon={Flame} label="Quentes" value={stats.quente} tone="text-primary" />
          <StatCard icon={Flame} label="Mornos" value={stats.morno} tone="text-amber-600" />
          <StatCard icon={Flame} label="Frios" value={stats.frio} tone="text-muted-foreground" />
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            placeholder="Buscar por nome, WhatsApp ou bairro…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="sm:max-w-xs"
          />
          <Select
            value={filters.tier}
            onValueChange={(v) => setFilters((f) => ({ ...f, tier: v as Filters["tier"] }))}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tiers</SelectItem>
              <SelectItem value="quente">Quentes</SelectItem>
              <SelectItem value="morno">Mornos</SelectItem>
              <SelectItem value="frio">Frios</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Switch
              checked={filters.onlyAccount}
              onCheckedChange={(v) => setFilters((f) => ({ ...f, onlyAccount: v }))}
            />
            Só com conta
          </label>
          <span className="text-xs text-muted-foreground sm:ml-auto">
            {rows.length} de {stats.total}
          </span>
        </div>

        {/* Tabela densa */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando leads…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm gap-2">
            <AlertCircle className="h-5 w-5" />
            Não foi possível carregar os leads.
          </div>
        ) : rows.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Nenhum lead corresponde aos filtros.
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-[70vh] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                  <TableRow>
                    <SortHead label="Score" col="score" filters={filters} onSort={setSort} className="w-24" />
                    <SortHead label="Nome" col="name" filters={filters} onSort={setSort} />
                    <SortHead label="Bairro" col="neighborhood" filters={filters} onSort={setSort} />
                    <SortHead
                      label="Valor imóvel"
                      col="property_value"
                      filters={filters}
                      onSort={setSort}
                      className="text-right"
                    />
                    <SortHead
                      label="Eventos"
                      col="event_count"
                      filters={filters}
                      onSort={setSort}
                      className="text-right"
                    />
                    <SortHead label="Capturado" col="created_at" filters={filters} onSort={setSort} />
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((lead) => (
                    <TableRow
                      key={lead.lead_id}
                      onClick={() => setSelected(lead)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <Badge variant="outline" className={`tabular-nums ${TIER_META[lead.scoring.tier].className}`}>
                          {lead.scoring.score}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex flex-col">
                          <span>{lead.name}</span>
                          <span className="text-xs text-muted-foreground">{lead.whatsapp}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.neighborhood ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {lead.property_value ? fmtBRL(lead.property_value) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {lead.event_count}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {fmtDate(lead.created_at)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                          <a
                            href={whatsappHref(lead.whatsapp)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Contatar ${lead.name} no WhatsApp`}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>

      <LeadDetailSheet lead={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function compare(a: ScoredLead, b: ScoredLead, key: SortKey): number {
  switch (key) {
    case "score":
      return a.scoring.score - b.scoring.score;
    case "name":
      return a.name.localeCompare(b.name, "pt-BR");
    case "neighborhood":
      return (a.neighborhood ?? "").localeCompare(b.neighborhood ?? "", "pt-BR");
    case "property_value":
      return (a.property_value ?? 0) - (b.property_value ?? 0);
    case "event_count":
      return a.event_count - b.event_count;
    case "created_at":
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
}

function SortHead({
  label,
  col,
  filters,
  onSort,
  className,
}: {
  label: string;
  col: SortKey;
  filters: Filters;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = filters.sortKey === col;
  const Icon = !active ? ArrowUpDown : filters.sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
          className?.includes("text-right") ? "flex-row-reverse" : ""
        } ${active ? "text-foreground" : ""}`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "text-foreground",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-card">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
