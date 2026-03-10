import { useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type EventPayload = {
  event_type: string;
  event_data: Record<string, unknown>;
  session_id: string;
  device_type: string;
  page: string;
  created_at: string;
};

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w <= 1024) return "tablet";
  return "desktop";
}

export function useGuideAnalytics() {
  const sessionId = useRef(crypto.randomUUID());
  const buffer = useRef<EventPayload[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval>>();

  const flush = useCallback(async () => {
    if (buffer.current.length === 0) return;
    const batch = buffer.current.splice(0);
    try {
      await supabase.from("guide_events").insert(batch as any);
    } catch {
      // silently fail — analytics should never break UX
    }
  }, []);

  useEffect(() => {
    flushTimer.current = setInterval(flush, 5000);
    return () => {
      clearInterval(flushTimer.current);
      flush();
    };
  }, [flush]);

  const trackEvent = useCallback(
    (eventType: string, eventData: Record<string, unknown> = {}) => {
      buffer.current.push({
        event_type: eventType,
        event_data: eventData,
        session_id: sessionId.current,
        device_type: getDeviceType(),
        page: "guide",
        created_at: new Date().toISOString(),
      });
    },
    []
  );

  return { trackEvent, sessionId: sessionId.current };
}

// Singleton for cross-component tracking (ChatBot, etc.)
let globalTrack: ((type: string, data?: Record<string, unknown>) => void) | null = null;

export function setGlobalTrack(fn: typeof globalTrack) {
  globalTrack = fn;
}

export function trackGlobal(type: string, data?: Record<string, unknown>) {
  globalTrack?.(type, data);
}
