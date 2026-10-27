import { beforeEach, describe, expect, it, vi } from "vitest";
import { PREMISSAS_SIMULADOR_PADRAO } from "@/lib/simuladorReceita";

const inserts: { tabela: string; linha: Record<string, unknown> }[] = [];
let projetosExistentes: { id: string }[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (tabela: string) => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: projetosExistentes, error: null }) }) }) }),
      insert: (linha: Record<string, unknown>) => {
        inserts.push({ tabela, linha });
        return { select: () => ({ single: async () => ({ data: { id: "novo-projeto" }, error: null }) }), then: (r: (v: unknown) => void) => r({ error: null }) };
      },
      update: () => ({ eq: () => ({ is: async () => ({ error: null }) }) }),
    }),
  },
}));

import { provisionProjectForLead } from "@/lib/leadProvisioning";

beforeEach(() => { inserts.length = 0; projetosExistentes = [{ id: "projeto-antigo" }]; });

describe("provisionProjectForLead", () => {
  it("simulação guardada vira projeto novo mesmo quando a pessoa já tem projeto", async () => {
    const premissas = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca", diaria: 310 };
    const { projectId } = await provisionProjectForLead("u1", { neighborhood: "Mooca", area_sqm: premissas.area, premissas, versao_calculo: "v", base_coletada_em: "2026-10-18" });
    expect(projectId).toBe("novo-projeto");
    const linha = inserts.find((i) => i.tabela === "project_assumptions")!.linha;
    expect(linha.project_id).toBe("novo-projeto");
    expect(linha.premissas_simulador).toEqual(premissas);
    expect(linha.versao_calculo).toBe("v");
    expect(linha.base_coletada_em).toBe("2026-10-18");
  });
  it("intenção legada, só bairro e faixa, reaproveita o projeto mais recente", async () => {
    const { projectId } = await provisionProjectForLead("u1", { neighborhood: "Mooca", area_sqm: "26–35 m²" });
    expect(projectId).toBe("projeto-antigo");
    expect(inserts).toHaveLength(0);
  });
});
