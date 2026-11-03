import { beforeEach, describe, expect, it, vi } from "vitest";
import { PREMISSAS_SIMULADOR_PADRAO } from "@/lib/simuladorReceita";

const inserts: { tabela: string; linha: Record<string, unknown> }[] = [];
let projetosExistentes: { id: string }[] = [];
/** Erros devolvidos, em ordem, pelos inserts de project_assumptions (vazio = sucesso). */
let errosPremissas: ({ code: string } | null)[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (tabela: string) => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: projetosExistentes, error: null }) }) }) }),
      insert: (linha: Record<string, unknown>) => {
        inserts.push({ tabela, linha });
        const erro = tabela === "project_assumptions" ? (errosPremissas.shift() ?? null) : null;
        return { select: () => ({ single: async () => ({ data: { id: "novo-projeto" }, error: null }) }), then: (r: (v: unknown) => void) => r({ error: erro }) };
      },
      update: () => ({ eq: () => ({ is: async () => ({ error: null }) }) }),
    }),
  },
}));

import { provisionProjectForLead } from "@/lib/leadProvisioning";

beforeEach(() => { inserts.length = 0; errosPremissas = []; projetosExistentes = [{ id: "projeto-antigo" }]; });

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
  it("insert com as colunas novas rejeitado: tenta de novo só com a linha legada e avisa só o código", async () => {
    errosPremissas = [{ code: "PGRST204" }];
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    const premissas = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca" };
    const { projectId } = await provisionProjectForLead("u1", { neighborhood: "Mooca", area_sqm: premissas.area, premissas, versao_calculo: "v", base_coletada_em: "2026-10-18" });
    expect(projectId).toBe("novo-projeto");
    const linhas = inserts.filter((i) => i.tabela === "project_assumptions").map((i) => i.linha);
    expect(linhas).toHaveLength(2);
    expect(Object.keys(linhas[1]).sort()).toEqual(["area_sqm", "neighborhood", "project_id"]);
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(aviso.mock.calls[0])).toContain("PGRST204");
    expect(JSON.stringify(aviso.mock.calls[0])).not.toContain("Mooca");
    aviso.mockRestore();
  });
  it("insert com sucesso na primeira tentativa: exatamente um insert de premissas", async () => {
    const premissas = { ...PREMISSAS_SIMULADOR_PADRAO, bairro: "Mooca" };
    await provisionProjectForLead("u1", { neighborhood: "Mooca", area_sqm: premissas.area, premissas });
    expect(inserts.filter((i) => i.tabela === "project_assumptions")).toHaveLength(1);
  });
});
