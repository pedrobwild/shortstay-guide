import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import AirbnbEventsList from "./AirbnbEventsList";

/**
 * Lista as conexões Airbnb iCal de um projeto.
 * Permite sincronizar e remover conexões.
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
  /** Incrementado externamente para forçar reload */
  refreshKey?: number;
}

/** Mapeia status para variante do Badge */
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

  // Busca conexões do projeto
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

  // Sincronizar uma conexão via Edge Function
  const handleSync = async (connectionId: string) => {
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
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }

      // Recarrega lista para atualizar status e last_synced_at
      await fetchConnections();
    } catch (err: any) {
      toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
      await fetchConnections();
    } finally {
      setSyncingId(null);
    }
  };

  // Remover conexão
  const handleDelete = async (connectionId: string) => {
    setDeletingId(connectionId);
    try {
      const { error } = await supabase
        .from("ota_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      toast({ title: "Conexão removida" });
      await fetchConnections();
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

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
        return (
        <div
          key={conn.id}
          className="rounded-lg border border-border bg-card overflow-hidden"
        >
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground capitalize">{conn.provider}</span>
                <Badge variant={statusVariant(conn.status)} className="text-xs">
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

            {/* Ações */}
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedId(isExpanded ? null : conn.id)}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="ml-1 text-xs hidden sm:inline">Eventos</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSync(conn.id)}
                disabled={syncingId === conn.id}
              >
                {syncingId === conn.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-1 hidden sm:inline">
                  {syncingId === conn.id ? "Sincronizando..." : "Sincronizar"}
                </span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(conn.id)}
                disabled={deletingId === conn.id}
                className="text-destructive hover:text-destructive"
              >
                {deletingId === conn.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Eventos expandidos */}
          {isExpanded && (
            <div className="border-t border-border px-4 py-3 bg-muted/30">
              <AirbnbEventsList connectionId={conn.id} />
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
