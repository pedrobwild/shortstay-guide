import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

import MapaBairros from "./pages/MapaBairros";
import IntelligenceDashboard from "./pages/IntelligenceDashboard";
import IntelligenceRanking from "./pages/IntelligenceRanking";
import IntelligenceBairroDetail from "./pages/IntelligenceBairroDetail";
import IntelligenceListings from "./pages/IntelligenceListings";
import NotFound from "./pages/NotFound";
import ChatBot from "./components/ChatBot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          <Route path="/intelligence" element={<IntelligenceDashboard />} />
          <Route path="/intelligence/ranking" element={<IntelligenceRanking />} />
          <Route path="/intelligence/bairro/:bairro" element={<IntelligenceBairroDetail />} />
          <Route path="/intelligence/listings" element={<IntelligenceListings />} />
          <Route path="/mapa-bairros" element={<MapaBairros />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatBot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
