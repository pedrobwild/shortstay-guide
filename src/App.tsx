import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import bwildLogo from "@/assets/bwild-logo.png";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const MapaBairros = lazy(() => import("./pages/MapaBairros"));
const IntelligenceDashboard = lazy(() => import("./pages/IntelligenceDashboard"));
const IntelligenceRanking = lazy(() => import("./pages/IntelligenceRanking"));
const IntelligenceBairroDetail = lazy(() => import("./pages/IntelligenceBairroDetail"));
const IntelligenceListings = lazy(() => import("./pages/IntelligenceListings"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Ferramentas = lazy(() => import("./pages/Ferramentas"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ChatBot = lazy(() => import("./components/ChatBot"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <img src={bwildLogo} alt="Bwild" className="h-10 w-auto opacity-60" />
      <div className="flex items-center gap-2 text-muted-foreground font-body text-sm">
        <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        Carregando...
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/intelligence" element={<IntelligenceDashboard />} />
              <Route path="/intelligence/ranking" element={<IntelligenceRanking />} />
              <Route path="/intelligence/bairro/:bairro" element={<IntelligenceBairroDetail />} />
              <Route path="/intelligence/listings" element={<IntelligenceListings />} />
              <Route path="/mapa-bairros" element={<MapaBairros />} />
              <Route path="/ferramentas" element={<Ferramentas />} />
              <Route path="/projetos" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/projeto/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Suspense fallback={null}>
              <ChatBot />
            </Suspense>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
