import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useGuideAnalytics, setGlobalTrack, setGlobalSessionId } from "@/hooks/useGuideAnalytics";

/**
 * Telemetria interna (guide_events) de toda rota pública: registra o trackGlobal
 * e um page_view a cada troca de caminho. O consentimento e as rotas privadas
 * (/admin, /painel…) são barrados em trackEvent, via canMeasure.
 */
export default function MedicaoGlobal(): null {
  const { pathname } = useLocation();
  const { trackEvent, sessionId } = useGuideAnalytics({ page: pathname });

  useEffect(() => {
    setGlobalTrack(trackEvent);
    setGlobalSessionId(sessionId);
    return () => {
      setGlobalTrack(null);
      setGlobalSessionId(null);
    };
  }, [trackEvent, sessionId]);

  useEffect(() => {
    trackEvent("page_view", { referrer: document.referrer, ua: navigator.userAgent });
  }, [trackEvent, pathname]);

  return null;
}
