import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, FlaskConical, Sparkles } from "lucide-react";
import AirbnbEventsList from "./AirbnbEventsList";

interface OtaConnection {
  id: string;
  provider: string;
  connection_type: string;
  ical_url: string | null;
  status: string;
  last_synced_at: string | null;
  created_at: string;
  is_test: boolean;
}

interface AirbnbConnectionsListProps {
  projectId: string;
  refreshKey?: number;
  onDataChanged?: () => void;
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
  onDataChanged,
}: AirbnbConnectionsListProps) {
  const [connections, setConnections] = useState<OtaConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [eventsRefreshKey, setEventsRefreshKey] = useState(0);
  const [creatingDemo, setCreatingDemo] = useState(false);

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

  const handleSync = async (connectionId: string) => {
    if (syncingId) return;
    setSyncingId(connectionId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-airbnb-ical", {
        body: { connectionId },
      });

      if (error) throw error;

      if (data?.success) {
        const testLabel = data.isTest ? " (dados de teste)" : "";
        toast({
          title: "Sincronização concluída!",
          description: `${data.eventsImported} evento(s) importado(s)${testLabel}.`,
        });
        setExpandedId(connectionId);
        setEventsRefreshKey((k) => k + 1);
      } else {
        throw new Error(data?.error || "Erro desconhecido");
      }

      await fetchConnections();
      onDataChanged?.();
    } catch (err: any) {
      toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
      await fetchConnections();
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (connectionId: string) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja remover esta conexão? Todos os eventos importados serão apagados."
    );
    if (!confirmed) return;

    setDeletingId(connectionId);
    try {
      await supabase
        .from("ota_calendar_events")
        .delete()
        .eq("connection_id", connectionId);

      const { error } = await supabase
        .from("ota_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      toast({ title: "Conexão removida" });
      if (expandedId === connectionId) setExpandedId(null);
      await fetchConnections();
      onDataChanged?.();
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateDemoConnection = async () => {
    if (creatingDemo) return;
    setCreatingDemo(true);
    try {
      const { data: conn, error: connErr } = await supabase
        .from("ota_connections")
        .insert({
          project_id: projectId,
          provider: "airbnb",
          connection_type: "ical",
          ical_url: null,
          status: "active",
          is_test: true,
        })
        .select("id")
        .single();
      if (connErr || !conn) throw connErr || new Error("Falha ao criar conexão demo");

      const { data: syncData, error: syncErr } = await supabase.functions.invoke(
        "sync-airbnb-ical",
        { body: { connectionId: conn.id } },
      );
      if (syncErr) throw syncErr;
      if (!syncData?.success) throw new Error(syncData?.error || "Erro na sincronização");

      toast({
        title: "Dados demo gerados!",
        description: `${syncData.eventsImported} eventos fictícios importados.`,
      });

      await fetchConnections();
      onDataChanged?.();
    } catch (err: any) {
      toast({ title: "Erro ao gerar demo", description: err.message, variant: "destructive" });
    } finally {
      setCreatingDemo(false);
    }
  };

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
      <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-5 space-y-3 text-center">
        <Sparkles className="h-8 w-8 mx-auto text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">Nenhuma conexão Airbnb ainda</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Conecte um calendário iCal acima ou gere ~18 meses de dados fictícios para explorar
            todas as análises antes de conectar uma conta real.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleCreateDemoConnection}
          disabled={creatingDemo}
          className="bg-primary text-primary-foreground"
        >
          {creatingDemo ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1" />
          )}
          {creatingDemo ? "Gerando dados..." : "Gerar dados de demonstração"}
        </Button>
      </div>
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
            className={`rounded-lg border bg-card overflow-hidden ${
              conn.is_test ? "border-dashed border-muted-foreground/30" : "border-border"
            }`}
          >
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground capitalize">{conn.provider}</span>
                  <Badge variant={statusVariant(conn.status)} className="text-xs">
                    {conn.status === "error" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {statusLabel(conn.status)}
                  </Badge>
                  {conn.is_test && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <FlaskConical className="h-3 w-3" />
                      Teste
                    </Badge>
                  )}
                </div>

                {!conn.is_test && conn.ical_url && (
                  <p className="text-xs text-muted-foreground truncate max-w-md" title={conn.ical_url}>
                    <ExternalLink className="inline h-3 w-3 mr-1 -mt-0.5" />
                    {conn.ical_url}
                  </p>
                )}

                {conn.is_test && (
                  <p className="text-xs text-muted-foreground italic">
                    Conexão de teste — gera eventos fictícios ao sincronizar.
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
