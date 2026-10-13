import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import RouteSeo from "@/components/RouteSeo";
import { slugifyBairro } from "@/lib/seo";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import bwildLogo from "@/assets/bewild-logo.webp";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import PostLoginProvision from "@/components/PostLoginProvision";

const Index = lazy(() => import("./pages/Index"));
const MapaBairros = lazy(() => import("./pages/MapaBairros"));
const IntelligenceDashboard = lazy(() => import("./pages/IntelligenceDashboard"));
const IntelligenceRanking = lazy(() => import("./pages/IntelligenceRanking"));
const IntelligenceBairroDetail = lazy(() => import("./pages/IntelligenceBairroDetail"));
const IntelligenceListings = lazy(() => import("./pages/IntelligenceListings"));
const Painel = lazy(() => import("./pages/Painel"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const StudioProjection = lazy(() => import("./pages/StudioProjection"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Ferramentas = lazy(() => import("./pages/Ferramentas"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminBairros = lazy(() => import("./pages/AdminBairros"));
const AdminSimulacoes = lazy(() => import("./pages/AdminSimulacoes"));
const AdminColetas = lazy(() => import("./pages/AdminColetas"));
const NotFound = lazy(() => import("./pages/NotFound"));
import ChatBot from "./components/ChatBot";
import ClientOnly from "@/components/ClientOnly";
import CookieConsent from "@/components/CookieConsent";

const queryClient = new QueryClient();

/**
 * Faz o scroll até o elemento referenciado pelo hash da URL (ex.: /#cta-final)
 * após uma navegação do React Router. Como as páginas são lazy-loaded, o alvo
 * pode ainda não existir no DOM no momento da troca de rota — então tentamos
 * por uma janela curta (~2s) via requestAnimationFrame até o conteúdo montar.
 */
function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let raf = 0;
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (attempts++ < 60) raf = requestAnimationFrame(tryScroll);
    };
    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [hash, pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <img src={bwildLogo} alt="Bewild" className="h-10 w-auto opacity-60" />
      <div className="flex items-center gap-2 text-muted-foreground font-body text-sm">
        <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        Carregando...
      </div>
    </div>
  );
}

function LegacyRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}

function LegacyBairroRedirect() {
  const { bairro = "" } = useParams<{ bairro: string }>();
  let name = bairro;
  try { name = decodeURIComponent(bairro); } catch { /* mantém o valor bruto */ }
  return <LegacyRedirect to={`/bairro/${slugifyBairro(name)}`} />;
}

/** Provedores compartilhados entre o app (navegador) e a pré-renderização (build). */
export function AppShell({ children, helmetContext }: { children: React.ReactNode; helmetContext?: object }) {
  return (
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

/** Rotas do app; o roteador (Browser/Static) é fornecido por quem renderiza. */
export function AppRoutes() {
  return (
    <>
      <ScrollToHash />
      <ClientOnly><CookieConsent /></ClientOnly>
      <PostLoginProvision />
      <Suspense fallback={<PageFallback />}>
        <RouteSeo />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/mercado" element={<IntelligenceDashboard />} />
          <Route path="/ranking" element={<IntelligenceRanking />} />
          <Route path="/bairro/:bairro" element={<IntelligenceBairroDetail />} />
          <Route path="/anuncios" element={<IntelligenceListings />} />
          <Route path="/mapa" element={<MapaBairros />} />
          {/* Redirecionamentos das rotas antigas (mantêm ?query e #hash) */}
          <Route path="/intelligence" element={<LegacyRedirect to="/mercado" />} />
          <Route path="/intelligence/ranking" element={<LegacyRedirect to="/ranking" />} />
          <Route path="/intelligence/listings" element={<LegacyRedirect to="/anuncios" />} />
          <Route path="/intelligence/bairro/:bairro" element={<LegacyBairroRedirect />} />
          <Route path="/mapa-bairros" element={<LegacyRedirect to="/mapa" />} />
          <Route path="/ferramentas" element={<Ferramentas />} />
          <Route path="/projecao" element={<StudioProjection />} />
          <Route path="/painel" element={<ProtectedRoute><Painel /></ProtectedRoute>} />
          <Route path="/projetos" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projeto/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/admin/leads" element={<AdminRoute><AdminLeads /></AdminRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/bairros" replace />} />
          <Route path="/admin/bairros" element={<AdminRoute><AdminBairros /></AdminRoute>} />
          <Route path="/admin/simulacoes" element={<AdminRoute><AdminSimulacoes /></AdminRoute>} />
          <Route path="/admin/coletas" element={<AdminRoute><AdminColetas /></AdminRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ClientOnly><ChatBot /></ClientOnly>
      </Suspense>
    </>
  );
}

const App = () => (
  <AppShell>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AppShell>
);

export default App;
