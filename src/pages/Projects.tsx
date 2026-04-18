import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Loader2, FolderOpen, ArrowRight, Sparkles } from "lucide-react";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProjects((data as Project[]) || []);
    } catch (err: any) {
      toast({ title: "Erro ao carregar projetos", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from("projects")
        .insert({ name: trimmed, user_id: user!.id });
      if (error) throw error;
      toast({ title: "Projeto criado!" });
      setNewName("");
      setShowForm(false);
      await fetchProjects();
    } catch (err: any) {
      toast({ title: "Erro ao criar projeto", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateDemo = async () => {
    if (creatingDemo || !user) return;
    setCreatingDemo(true);
    try {
      const { data: project, error: projErr } = await supabase
        .from("projects")
        .insert({ name: "Demo — Studio Pinheiros", user_id: user.id })
        .select("id")
        .single();
      if (projErr || !project) throw projErr || new Error("Falha ao criar projeto");

      const { data: conn, error: connErr } = await supabase
        .from("ota_connections")
        .insert({
          project_id: project.id,
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
        title: "Projeto demo pronto!",
        description: `${syncData.eventsImported} eventos fictícios gerados.`,
      });

      navigate(`/projeto/${project.id}`);
    } catch (err: any) {
      toast({ title: "Erro ao criar projeto demo", description: err.message, variant: "destructive" });
    } finally {
      setCreatingDemo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">Meus Projetos</h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleCreateDemo}
              disabled={creatingDemo || creating}
              className="bg-primary text-primary-foreground"
            >
              {creatingDemo ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              {creatingDemo ? "Gerando..." : "Criar projeto demo"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo projeto
            </Button>
          </div>
        </div>

        {/* Formulário inline */}
        {showForm && (
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="Nome do projeto"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={creating}
              autoFocus
              className="flex-1"
            />
            <Button type="submit" disabled={creating || !newName.trim()} size="sm">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
            </Button>
          </form>
        )}

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Carregando...
          </div>
        ) : projects.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8 space-y-2 text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto opacity-40" />
              <p className="text-sm">Nenhum projeto ainda.</p>
              <p className="text-xs">Clique em "Novo projeto" para começar.</p>
            </div>
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Quer ver como fica com o iCal conectado?</p>
              </div>
              <p className="text-xs text-muted-foreground">
                O botão <strong>Criar projeto demo</strong> gera um projeto com ~18 meses de reservas fictícias e
                todas as análises já populadas — sem precisar conectar uma conta real do Airbnb.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/projeto/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-accent/10 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Criado em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
