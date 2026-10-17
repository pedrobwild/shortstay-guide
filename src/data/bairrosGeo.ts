/**
 * Posição de cada bairro do Radar no mapa: centro aproximado (lat/lng) e o lado
 * do rótulo para não sobrepor os vizinhos. Só geografia para desenhar o mapa —
 * não é dado de mercado. Origem: centros já usados no mapa (mapaBairrosData) e,
 * para Brooklin, Vila Olímpia, Liberdade e Perdizes, centro aproximado do bairro.
 */
export type LadoRotulo = "direita" | "esquerda" | "abaixo" | "acima";
export interface GeoBairro {
  lat: number;
  lng: number;
  lado: LadoRotulo;
}

export const GEO_BAIRROS: Record<string, GeoBairro> = {
  "Bela Vista": { lat: -23.558, lng: -46.6442, lado: "abaixo" },
  Brooklin: { lat: -23.6119, lng: -46.6975, lado: "direita" },
  "Consolação": { lat: -23.553, lng: -46.6562, lado: "acima" },
  "Itaim Bibi": { lat: -23.5863, lng: -46.6762, lado: "direita" },
  "Jardim Paulista": { lat: -23.5636, lng: -46.6682, lado: "esquerda" },
  Liberdade: { lat: -23.5585, lng: -46.6345, lado: "direita" },
  Moema: { lat: -23.6013, lng: -46.6662, lado: "direita" },
  Pinheiros: { lat: -23.5613, lng: -46.6917, lado: "esquerda" },
  "República": { lat: -23.543, lng: -46.643, lado: "direita" },
  "Vila Mariana": { lat: -23.589, lng: -46.635, lado: "direita" },
  "Vila Olímpia": { lat: -23.596, lng: -46.6865, lado: "esquerda" },
  Mooca: { lat: -23.5555, lng: -46.598, lado: "abaixo" },
  Perdizes: { lat: -23.5365, lng: -46.679, lado: "direita" },
};

const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const POR_NOME = new Map(Object.entries(GEO_BAIRROS).map(([nome, g]) => [norm(nome), g]));

/** Centro do bairro pelo nome (ignora acento e caixa); undefined se o bairro não tem posição. */
export function geoBairro(nome: string): GeoBairro | undefined {
  return POR_NOME.get(norm(nome));
}
