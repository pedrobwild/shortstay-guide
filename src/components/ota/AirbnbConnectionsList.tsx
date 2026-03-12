import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import AirbnbEventsList from "./AirbnbEventsList";

/**
 * Lista as conexões Airbnb iCal de um projeto.
 * Melhorias: confirmação de exclusão, proteção contra duplo clique,
 * disable de sync durante operações, expand de eventos após sync.
 */
interface OtaConnection {
  id: string;
  provider: string;
  connection_type: string;
  ical_url: string | null;
  status: string;
  last_synced_at: string | null;
  created_at: string;
}

interface AirbnbConnectionsListProps {
  projectId: string;
  refreshKey?: number;
}

function statusVariant(status: string) {
  switch (status) {
    case "active": return "default" as const;
    case "error": return "destructive" as const;
    default: return "secondary" as const;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "active": return "Ativo";
    case "inactive": return "Inativo";
    case "error": return "Erro";
    default: return status;
  }
}

export default function AirbnbConnectionsList({
  projectId,
  refreshKey = 0,
}: AirbnbConnectionsListProps) {
  const [connections, setConnections] = useState<OtaConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Incrementado após sync para forçar reload de eventos no AirbnbEventsList
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ota_connections")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConnections((data as OtaConnection[]) || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar conexões", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections, refreshKey]);

  // Sincronizar — protegido contra duplo clique
  const handleSync = async (connectionId: string) => {
    if (syncingId) return; // Já sincronizando outra
    setSyncingId(connectionId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-airbnb-ical", {
        body: { connectionId },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Sincronização concluída!",
          description: `${data.eventsImported} evento(s) importado(s).`,
        });
        // Expande eventos automaticamente após sync bem-sucedido
        setExpandedId(connectionId);
        setEventsRefreshKey((k) => k + 1);
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }

      await fetchConnections();
    } catch (err: any) {
      toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
      await fetchConnections();
    } finally {
      setSyncingId(null);
    }
  };

  // Remover — com confirmação
  const handleDelete = async (connectionId: string) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja remover esta conexão? Todos os eventos importados serão apagados."
    );
    if (!confirmed) return;

    setDeletingId(connectionId);
    try {
      const { error } = await supabase
        .from("ota_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      toast({ title: "Conexão removida" });
      // Limpa expand se era esta conexão
      if (expandedId === connectionId) setExpandedId(null);
      await fetchConnections();
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // Qualquer operação em andamento desabilita ações
  const isBusy = !!syncingId || !!deletingId;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando conexões...
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhuma conexão Airbnb cadastrada neste projeto.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((conn) => {
        const isExpanded = expandedId === conn.id;
        const isSyncing = syncingId === conn.id;
        const isDeleting = deletingId === conn.id;
        return (
        <div
          key={conn.id}
          className="rounded-lg border border-border bg-card overflow-hidden"
        >
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground capitalize">{conn.provider}</span>
                <Badge variant={statusVariant(conn.status)} className="text-xs">
                  {conn.status === "error" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {statusLabel(conn.status)}
                </Badge>
              </div>

              {conn.ical_url && (
                <p className="text-xs text-muted-foreground truncate max-w-md" title={conn.ical_url}>
                  <ExternalLink className="inline h-3 w-3 mr-1 -mt-0.5" />
                  {conn.ical_url}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                {conn.last_synced_at
                  ? `Última sync: ${new Date(conn.last_synced_at).toLocaleString("pt-BR")}`
                  : "Nunca sincronizado"}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedId(isExpanded ? null : conn.id)}
                disabled={isBusy}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="ml-1 text-xs hidden sm:inline">Eventos</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSync(conn.id)}
                disabled={isBusy}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">
                  {isSyncing ? "Sincronizando..." : "Sincronizar"}
                </span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(conn.id)}
                disabled={isBusy}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="border-t border-border px-4 py-3 bg-muted/30">
              <AirbnbEventsList connectionId={conn.id} key={`${conn.id}-${eventsRefreshKey}`} />
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
