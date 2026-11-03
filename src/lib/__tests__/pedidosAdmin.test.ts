import { beforeEach, describe, expect, it, vi } from "vitest";

const { chain, mockFrom } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {} as never;
  for (const m of ["select", "order", "limit", "eq", "gte", "or", "update"]) chain[m] = vi.fn(() => chain);
  // Resolve como uma promise ao ser aguardada.
  (chain as unknown as { then: (f: (v: unknown) => unknown) => unknown }).then = (f) =>
    Promise.resolve({ data: [], error: null }).then(f);
  const mockFrom = vi.fn(() => chain);
  return { chain, mockFrom };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mockFrom } }));

import {
  atualizarStatus,
  enviarAoCrm,
  listarPedidos,
  patchValido,
  pedidosParaCsv,
  resumoPedidos,
  type PedidoAdmin,
} from "@/lib/pedidosAdmin";

const base: PedidoAdmin = {
  id: "00000000-0000-4000-8000-000000000001",
  created_at: "2026-10-27T15:30:00.000Z",
  email: "ana@exemplo.com",
  nome: "Ana",
  material: "checklist_compra",
  etapa: "procurando",
  bairro: "Pinheiros",
  boletim: false,
  origem: "bairro",
  status_comercial: "novo",
  responsavel: null,
  motivo_perda: null,
  atualizado_em: "2026-10-27T15:30:00.000Z",
};
const qualificado: PedidoAdmin = { ...base, id: "2", status_comercial: "qualificado", responsavel: "Carla" };
const novoBoletim: PedidoAdmin = { ...base, id: "3", boletim: true };

beforeEach(() => {
  mockFrom.mockClear();
  for (const k of Object.keys(chain)) if (typeof chain[k]?.mockClear === "function") chain[k].mockClear();
});

describe("patchValido", () => {
  it("patch de perda exige motivo", () => {
    expect(patchValido({ status_comercial: "perdido" })).toBe(false);
    expect(patchValido({ status_comercial: "perdido", motivo_perda: "   " })).toBe(false);
    expect(patchValido({ status_comercial: "fora_do_perfil" })).toBe(false);
    expect(patchValido({ status_comercial: "perdido", motivo_perda: "fora de SP" })).toBe(true);
    expect(patchValido({ status_comercial: "qualificado" })).toBe(true);
  });
  it("atualizarStatus não envia patch inválido", async () => {
    expect(await atualizarStatus("x", { status_comercial: "perdido" })).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe("pedidosParaCsv", () => {
  it("CSV com cabeçalho, ponto e vírgula e BOM", () => {
    const csv = pedidosParaCsv([base]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split("\n")[0].slice(1)).toBe("data;e-mail;nome;material;etapa;bairro;origem;boletim;status;responsável;motivo");
    const linha = csv.split("\n")[1].split(";");
    expect(linha[3]).toBe("Checklist antes de comprar o studio");
    expect(linha[7]).toBe("não");
  });
  it("cita campos com ponto e vírgula, aspas ou quebra de linha", () => {
    const csv = pedidosParaCsv([{ ...base, nome: 'A; "B"', motivo_perda: "x\ny", status_comercial: "perdido" }]);
    expect(csv).toContain('"A; ""B"""');
    expect(csv).toContain('"x\ny"');
  });
});

describe("resumoPedidos", () => {
  it("conta por status e boletim", () => {
    expect(resumoPedidos([base, qualificado, novoBoletim])).toEqual({
      total: 3,
      porStatus: { novo: 2, qualificado: 1, oportunidade: 0, perdido: 0, fora_do_perfil: 0 },
      boletim: 1,
    });
  });
});

describe("listarPedidos", () => {
  it("ordena por created_at e id (desc) e limita a 200", async () => {
    await listarPedidos({}, {});
    expect(mockFrom).toHaveBeenCalledWith("radar_pedidos_material");
    expect(chain.order.mock.calls).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
    expect(chain.limit).toHaveBeenCalledWith(200);
  });
  it("pagina por keyset com desempate por id e aplica filtros validados", async () => {
    await listarPedidos(
      { status: "novo", desde: new Date("2026-10-01T00:00:00.000Z") },
      { apos: { created_at: "2026-10-27T15:30:00.000Z", id: "00000000-0000-4000-8000-000000000001" } },
    );
    expect(chain.eq).toHaveBeenCalledWith("status_comercial", "novo");
    expect(chain.gte).toHaveBeenCalledWith("created_at", "2026-10-01T00:00:00.000Z");
    expect(chain.or).toHaveBeenCalledWith(
      "created_at.lt.2026-10-27T15:30:00.000Z,and(created_at.eq.2026-10-27T15:30:00.000Z,id.lt.00000000-0000-4000-8000-000000000001)",
    );
  });
  it("rejeita cursor malformado em vez de montar filtro", async () => {
    await expect(listarPedidos({}, { apos: { created_at: "x,or(1=1)", id: "y" } })).rejects.toThrow();
  });
});

describe("enviarAoCrm", () => {
  it("sem CRM por enquanto (D4)", async () => {
    await expect(enviarAoCrm(base)).resolves.toBe("sem_crm");
  });
});
