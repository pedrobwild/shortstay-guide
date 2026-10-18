import AppNavbar from "@/components/AppNavbar";
import AdminTabs from "@/components/admin/AdminTabs";
import DemandaBuscaSection from "@/components/admin/DemandaBuscaSection";

/** /admin/demanda — perfil anônimo de quem simula financiamento enquanto procura imóvel (só admin). */
export default function AdminDemanda() {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <AdminTabs />
        <header className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Demanda de quem busca imóvel</h1>
          <p className="text-sm text-muted-foreground">
            Simulações de financiamento feitas em /ferramentas por quem ainda procura imóvel, gravadas só com autorização e
            agregadas por bairro.
          </p>
        </header>
        <DemandaBuscaSection />
      </main>
    </div>
  );
}
