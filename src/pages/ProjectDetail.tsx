import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppNavbar } from "@/components/AppNavbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Ruler, TrendingUp, Sparkles } from "lucide-react";

interface Project {
  id: string;
  name: string;
  neighborhood: string | null;
  area_sqm: number | null;
  created_at: string;
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) return;

    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (error || !data) {
        toast.error("Projeto não encontrado");
        navigate("/projetos", { replace: true });
      } else {
        setProject(data as Project);
      }
      setLoading(false);
    };

    fetchProject();
  }, [user, projectId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary/40 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/projetos")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Meus projetos
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-body uppercase tracking-wide">
              Sua proposta exclusiva BWild
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold">{project.name}</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="py-6 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground font-body">Bairro</p>
                <p className="text-lg font-display font-semibold">
                  {project.neighborhood || "A definir"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 flex items-center gap-3">
              <Ruler className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground font-body">Metragem</p>
                <p className="text-lg font-display font-semibold">
                  {project.area_sqm ? `${project.area_sqm} m²` : "A definir"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Projeção personalizada
            </CardTitle>
            <CardDescription className="font-body">
              Estamos montando o estudo de rentabilidade com base no seu bairro e
              metragem. Nossa equipe complementa os números e fala com você pelo
              WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/projetos")} variant="outline">
              Ver todos os meus projetos
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
