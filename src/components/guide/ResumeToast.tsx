import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, X } from "lucide-react";
import { Link } from "react-router-dom";
import { lerUltimaSimulacao, lerUltimoBairro, type UltimaSimulacao, type UltimoBairro } from "@/lib/retomada";
import { SECTIONS } from "@/data/guide-data";
import type { ReadingProgress } from "@/hooks/useReadingProgress";

interface Props {
  data: ReadingProgress | null;
  onDismiss: () => void;
}

export default function ResumeToast({ data, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  // Última simulação e último bairro vistos (localStorage, até 30 dias). Só no navegador.
  const [extras, setExtras] = useState<{ simulacao: UltimaSimulacao | null; bairro: UltimoBairro | null }>({ simulacao: null, bairro: null });
  useEffect(() => {
    if (window.location.hash || window.location.search) return;
    const simulacao = lerUltimaSimulacao(), bairro = lerUltimoBairro();
    if (simulacao || bairro) setExtras({ simulacao, bairro });
  }, []);
  const temExtras = Boolean(extras.simulacao || extras.bairro);

  useEffect(() => {
    if (!data && !temExtras) return;
    // Small delay so it doesn't flash on load
    const t1 = setTimeout(() => setVisible(true), 800);
    const t2 = setTimeout(() => { setVisible(false); onDismiss(); }, 10800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [data, onDismiss, temExtras]);

  if (!data && !temExtras) return null;

  const section = data ? SECTIONS.find((s) => s.id === data.activeSection) : undefined;
  const sectionName = data ? section?.label ?? data.activeSection : "";

  const handleContinue = () => {
    if (!data) return;
    const el = document.getElementById(data.activeSection);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setVisible(false);
    onDismiss();
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-x-0 top-2 lg:top-3 z-50 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-4 flex items-start gap-3"
        >
          <BookOpen size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-semibold text-foreground mb-1">
              Bem-vindo de volta!
            </p>
            {data && (
              <p className="text-xs text-muted-foreground font-body">
                Você parou em <strong className="text-foreground">{sectionName}</strong>. Continuar?
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {data && (
                <Button size="sm" onClick={handleContinue} className="min-h-[44px] text-xs font-body">
                  Continuar a leitura
                </Button>
              )}
              {extras.simulacao && (
                <Button size="sm" variant={data ? "outline" : "default"} asChild className="min-h-[44px] text-xs font-body">
                  <Link to={extras.simulacao.caminho} onClick={handleDismiss}>Retomar simulação de {extras.simulacao.bairro}</Link>
                </Button>
              )}
              {extras.bairro && (
                <Button size="sm" variant="outline" asChild className="min-h-[44px] text-xs font-body">
                  <Link to={`/bairro/${extras.bairro.slug}`} onClick={handleDismiss}>Voltar a {extras.bairro.nome}</Link>
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="min-h-[44px] text-xs font-body text-muted-foreground">
                Agora não
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} aria-label="Fechar" className="inline-flex h-11 w-11 -mr-2 -mt-2 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
