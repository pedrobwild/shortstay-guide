import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Plus, Loader2, FolderOpen, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Meus Projetos</h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo projeto
          </Button>
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
          <div className="text-center py-12 space-y-2 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto opacity-40" />
            <p className="text-sm">Nenhum projeto ainda.</p>
            <p className="text-xs">Clique em "Novo projeto" para começar.</p>
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
