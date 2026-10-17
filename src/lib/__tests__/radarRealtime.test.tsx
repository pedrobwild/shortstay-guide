import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useRadarRealtime } from "@/hooks/useRadarRealtime";

const mocks = vi.hoisted(() => ({ callbacks: [] as Array<() => void>, remove: vi.fn(), channel: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  channel: mocks.channel,
  removeChannel: mocks.remove,
} }));

function Assinante() { useRadarRealtime(); return null; }

describe("avisos de coletas", () => {
  it("compartilha assinatura, atualiza o histórico sem recarga e encerra ao sair", async () => {
    vi.useFakeTimers();
    const channel = {
      on: vi.fn((_event, _filter, callback: () => void) => { mocks.callbacks.push(callback); return channel; }),
      subscribe: vi.fn(() => channel),
    };
    mocks.channel.mockReturnValue(channel);
    mocks.callbacks.length = 0;
    const qc = new QueryClient();
    const invalidar = vi.spyOn(qc, "invalidateQueries").mockResolvedValue();
    const container = document.createElement("div");
    const root = createRoot(container);
    try {
      await act(async () => root.render(<QueryClientProvider client={qc}><Assinante /><Assinante /></QueryClientProvider>));
      expect(mocks.channel).toHaveBeenCalledTimes(1);
      expect(channel.on.mock.calls.map((call) => call[1].event)).toEqual(["INSERT", "UPDATE"]);
      await act(async () => {
        mocks.callbacks[0]?.();
        mocks.callbacks[1]?.();
        vi.advanceTimersByTime(300);
      });
      expect(invalidar).toHaveBeenCalledWith({ queryKey: ["radar_historico"] });
      expect(invalidar).toHaveBeenCalledWith({ queryKey: ["radar_bairro_atual"] });
      expect(invalidar).toHaveBeenCalledTimes(5);
      await act(async () => root.unmount());
      expect(mocks.remove).toHaveBeenCalledWith(channel);
    } finally {
      qc.clear();
      vi.useRealTimers();
    }
  });
});