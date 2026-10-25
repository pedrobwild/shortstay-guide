import { describe,expect,it } from "vitest";
import { precoImovelSchema,valorReferenciaImovel } from "@/lib/precosImoveis";
const base={bairro:"Mooca",preco_m2:10000,fonte_nome:"Fonte imobiliária de teste",url_origem:"https://example.com/relatorio",periodo_inicio:"2026-01-01",periodo_fim:"2026-09-30",coletado_em:"2026-10-18",amostra_n:200,observacao:""};
describe("preço por metro quadrado",()=>{
  it("calcula valor pela área, não pela diária",()=>{expect(valorReferenciaImovel(10000,30)).toBe(300000);});
  it("exige preço e amostra positivos",()=>{expect(precoImovelSchema.safeParse(base).success).toBe(true);expect(precoImovelSchema.safeParse({...base,preco_m2:0}).success).toBe(false);expect(precoImovelSchema.safeParse({...base,amostra_n:0}).success).toBe(false);});
  it("não aceita a GuestFavorites como fonte de compra",()=>{expect(precoImovelSchema.safeParse({...base,url_origem:"https://www.guestfavorites.com/bairro"}).success).toBe(false);});
  it("recusa período posterior à coleta",()=>{expect(precoImovelSchema.safeParse({...base,periodo_fim:"2026-11-01"}).success).toBe(false);});
  it("sem área válida não inventa valor total",()=>{expect(valorReferenciaImovel(10000,0)).toBeNull();});
});