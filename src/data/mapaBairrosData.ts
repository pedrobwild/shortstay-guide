import {
  MapPin, Train, Calendar, Briefcase, Stethoscope, Zap, Music, Trophy, Theater, Ticket,
  Utensils, Wifi, Palette, ShoppingBag, Star, Building2, Plane, Trees, GraduationCap, Heart,
} from "lucide-react";

/* ─── Types ─── */
export interface NeighborhoodMetrics {
  nightlyRate: number;
  occupancy: number;
  estimatedROI: number;
  competitionLevel: "alta" | "média" | "baixa";
}

export interface Neighborhood {
  id: string;
  name: string;
  tags: string[];
  demandProfile: string;
  score: number;
  avgNightly: number;
  avgOccupancy: number;
  coordinates: { x: number; y: number };
  centerLat: number;
  centerLng: number;
  metrics: NeighborhoodMetrics;
}

export interface MetroStation {
  id: number;
  name: string;
  line: string;
  color: string;
  coordinates: { x: number; y: number };
}

export interface CityEvent {
  id: number;
  name: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  impactLevel: "high" | "medium" | "low";
  nearbyNeighborhoods: string[];
}

export interface HeatPoint {
  id: string;
  lat: number;
  lng: number;
  demandScore: number;
  occupancyEstimate: number;
  adrEstimate: number;
  areaName: string;
  coordinates: { x: number; y: number };
}

/* ─── Seed Data ─── */
export const NEIGHBORHOODS: Neighborhood[] = [
  { id: "pinheiros", name: "Pinheiros", tags: ["gastronomia", "turismo", "vida noturna", "coworking", "metro"], demandProfile: "mixed", score: 92, avgNightly: 320, avgOccupancy: 82, coordinates: { x: 28, y: 38 }, centerLat: -23.5613, centerLng: -46.6917, metrics: { nightlyRate: 320, occupancy: 82, estimatedROI: 18.5, competitionLevel: "alta" } },
  { id: "vila-madalena", name: "Vila Madalena", tags: ["turismo", "vida noturna", "arte", "bares"], demandProfile: "tourism", score: 88, avgNightly: 280, avgOccupancy: 78, coordinates: { x: 22, y: 32 }, centerLat: -23.5465, centerLng: -46.6910, metrics: { nightlyRate: 280, occupancy: 78, estimatedROI: 15.2, competitionLevel: "média" } },
  { id: "jardins", name: "Jardins", tags: ["luxo", "compras", "restaurantes", "turismo"], demandProfile: "premium tourism", score: 90, avgNightly: 380, avgOccupancy: 76, coordinates: { x: 42, y: 40 }, centerLat: -23.5636, centerLng: -46.6682, metrics: { nightlyRate: 380, occupancy: 76, estimatedROI: 16.8, competitionLevel: "alta" } },
  { id: "itaim-bibi", name: "Itaim Bibi", tags: ["corporativo", "restaurantes", "negocios"], demandProfile: "business", score: 91, avgNightly: 350, avgOccupancy: 78, coordinates: { x: 38, y: 55 }, centerLat: -23.5863, centerLng: -46.6762, metrics: { nightlyRate: 350, occupancy: 78, estimatedROI: 17.2, competitionLevel: "alta" } },
  { id: "vila-olimpia", name: "Vila Olímpia", tags: ["corporativo", "vida noturna", "tech"], demandProfile: "business", score: 89, avgNightly: 330, avgOccupancy: 79, coordinates: { x: 45, y: 58 }, centerLat: -23.5953, centerLng: -46.6762, metrics: { nightlyRate: 330, occupancy: 79, estimatedROI: 16.1, competitionLevel: "média" } },
  { id: "paulista", name: "Paulista / Consolação", tags: ["turismo", "metro", "cultura", "museus"], demandProfile: "tourism", score: 87, avgNightly: 260, avgOccupancy: 76, coordinates: { x: 48, y: 35 }, centerLat: -23.5613, centerLng: -46.6562, metrics: { nightlyRate: 260, occupancy: 76, estimatedROI: 14.0, competitionLevel: "média" } },
  { id: "bela-vista", name: "Bela Vista", tags: ["turismo", "teatro", "gastronomia"], demandProfile: "tourism", score: 82, avgNightly: 240, avgOccupancy: 74, coordinates: { x: 52, y: 42 }, centerLat: -23.5613, centerLng: -46.6442, metrics: { nightlyRate: 240, occupancy: 74, estimatedROI: 12.5, competitionLevel: "baixa" } },
  { id: "moema", name: "Moema", tags: ["residencial", "aeroporto", "parque"], demandProfile: "mixed", score: 85, avgNightly: 300, avgOccupancy: 77, coordinates: { x: 48, y: 68 }, centerLat: -23.6013, centerLng: -46.6662, metrics: { nightlyRate: 300, occupancy: 77, estimatedROI: 14.8, competitionLevel: "média" } },
  { id: "vila-clementino", name: "Vila Clementino", tags: ["hospitais", "universidades", "saude"], demandProfile: "medical", score: 83, avgNightly: 220, avgOccupancy: 75, coordinates: { x: 55, y: 72 }, centerLat: -23.6013, centerLng: -46.6362, metrics: { nightlyRate: 220, occupancy: 75, estimatedROI: 13.0, competitionLevel: "baixa" } },
  { id: "barra-funda", name: "Barra Funda", tags: ["eventos", "expo", "transporte"], demandProfile: "events", score: 80, avgNightly: 200, avgOccupancy: 70, coordinates: { x: 32, y: 18 }, centerLat: -23.5265, centerLng: -46.6810, metrics: { nightlyRate: 200, occupancy: 70, estimatedROI: 11.0, competitionLevel: "baixa" } },
  { id: "brooklin", name: "Brooklin", tags: ["corporativo", "business district"], demandProfile: "business", score: 84, avgNightly: 290, avgOccupancy: 75, coordinates: { x: 42, y: 65 }, centerLat: -23.6113, centerLng: -46.6862, metrics: { nightlyRate: 290, occupancy: 75, estimatedROI: 14.2, competitionLevel: "média" } },
];

export const METRO_STATIONS: MetroStation[] = [
  { id: 1, name: "Faria Lima", line: "Linha 4 - Amarela", color: "#FFD700", coordinates: { x: 32, y: 48 } },
  { id: 2, name: "Pinheiros", line: "Linha 4 - Amarela", color: "#FFD700", coordinates: { x: 26, y: 40 } },
  { id: 3, name: "Consolação", line: "Linha 2 - Verde", color: "#00A651", coordinates: { x: 46, y: 36 } },
  { id: 4, name: "Trianon-Masp", line: "Linha 2 - Verde", color: "#00A651", coordinates: { x: 44, y: 38 } },
  { id: 5, name: "Brigadeiro", line: "Linha 2 - Verde", color: "#00A651", coordinates: { x: 48, y: 42 } },
  { id: 6, name: "Vila Madalena", line: "Linha 2 - Verde", color: "#00A651", coordinates: { x: 20, y: 30 } },
  { id: 7, name: "Fradique Coutinho", line: "Linha 4 - Amarela", color: "#FFD700", coordinates: { x: 24, y: 36 } },
  { id: 8, name: "Oscar Freire", line: "Linha 4 - Amarela", color: "#FFD700", coordinates: { x: 38, y: 38 } },
  { id: 9, name: "Moema", line: "Linha 5 - Lilás", color: "#9B59B6", coordinates: { x: 46, y: 66 } },
  { id: 10, name: "Eucaliptos", line: "Linha 5 - Lilás", color: "#9B59B6", coordinates: { x: 50, y: 70 } },
  { id: 11, name: "Palmeiras-Barra Funda", line: "Linha 3 - Vermelha", color: "#EE3124", coordinates: { x: 30, y: 16 } },
  { id: 12, name: "Brooklin", line: "Linha 5 - Lilás", color: "#9B59B6", coordinates: { x: 40, y: 62 } },
];

export const EVENTS: CityEvent[] = [
  { id: 1, name: "São Paulo Fashion Week", category: "Culture", location: "Bienal do Ibirapuera", startDate: "2026-04-14", endDate: "2026-04-19", impactLevel: "high", nearbyNeighborhoods: ["Moema", "Vila Clementino", "Jardins"] },
  { id: 2, name: "Web Summit Rio → SP Side Events", category: "Business", location: "Vários locais", startDate: "2026-05-05", endDate: "2026-05-08", impactLevel: "high", nearbyNeighborhoods: ["Pinheiros", "Vila Olímpia", "Itaim Bibi"] },
  { id: 3, name: "Lollapalooza Brasil", category: "Music", location: "Autódromo de Interlagos", startDate: "2026-03-27", endDate: "2026-03-29", impactLevel: "high", nearbyNeighborhoods: ["Moema", "Brooklin", "Vila Olímpia"] },
  { id: 4, name: "APAS Show", category: "Expo", location: "Expo Center Norte", startDate: "2026-05-11", endDate: "2026-05-14", impactLevel: "medium", nearbyNeighborhoods: ["Barra Funda", "Pinheiros"] },
  { id: 5, name: "Festival de Teatro de São Paulo", category: "Culture", location: "Vários teatros", startDate: "2026-08-10", endDate: "2026-08-24", impactLevel: "medium", nearbyNeighborhoods: ["Bela Vista", "Paulista / Consolação"] },
  { id: 6, name: "HOSPITALAR", category: "Expo", location: "São Paulo Expo", startDate: "2026-05-19", endDate: "2026-05-22", impactLevel: "medium", nearbyNeighborhoods: ["Vila Clementino", "Moema"] },
  { id: 7, name: "GP Brasil de F1", category: "Sports", location: "Autódromo de Interlagos", startDate: "2026-11-06", endDate: "2026-11-08", impactLevel: "high", nearbyNeighborhoods: ["Moema", "Brooklin", "Itaim Bibi"] },
  { id: 8, name: "Virada Cultural", category: "Culture", location: "Centro Histórico", startDate: "2026-06-20", endDate: "2026-06-21", impactLevel: "medium", nearbyNeighborhoods: ["Bela Vista", "Paulista / Consolação", "Pinheiros"] },
  { id: 9, name: "Fecomercio SP", category: "Business", location: "FIESP", startDate: "2026-09-15", endDate: "2026-09-18", impactLevel: "low", nearbyNeighborhoods: ["Paulista / Consolação", "Jardins", "Itaim Bibi"] },
  { id: 10, name: "Comic Con Experience (CCXP)", category: "Culture", location: "São Paulo Expo", startDate: "2026-12-03", endDate: "2026-12-06", impactLevel: "high", nearbyNeighborhoods: ["Vila Clementino", "Moema", "Brooklin"] },
];

export const HEAT_POINTS: HeatPoint[] = [
  { id: "hp1", lat: -23.56, lng: -46.69, demandScore: 95, occupancyEstimate: 82, adrEstimate: 320, areaName: "Pinheiros Centro", coordinates: { x: 28, y: 38 } },
  { id: "hp2", lat: -23.55, lng: -46.69, demandScore: 85, occupancyEstimate: 78, adrEstimate: 280, areaName: "Vila Madalena", coordinates: { x: 22, y: 32 } },
  { id: "hp3", lat: -23.56, lng: -46.67, demandScore: 90, occupancyEstimate: 76, adrEstimate: 380, areaName: "Jardins", coordinates: { x: 42, y: 40 } },
  { id: "hp4", lat: -23.59, lng: -46.68, demandScore: 92, occupancyEstimate: 78, adrEstimate: 350, areaName: "Itaim Bibi", coordinates: { x: 38, y: 55 } },
  { id: "hp5", lat: -23.60, lng: -46.68, demandScore: 88, occupancyEstimate: 79, adrEstimate: 330, areaName: "Vila Olímpia", coordinates: { x: 45, y: 58 } },
  { id: "hp6", lat: -23.56, lng: -46.66, demandScore: 80, occupancyEstimate: 76, adrEstimate: 260, areaName: "Paulista", coordinates: { x: 48, y: 35 } },
  { id: "hp7", lat: -23.56, lng: -46.64, demandScore: 68, occupancyEstimate: 74, adrEstimate: 240, areaName: "Bela Vista", coordinates: { x: 52, y: 42 } },
  { id: "hp8", lat: -23.60, lng: -46.67, demandScore: 78, occupancyEstimate: 77, adrEstimate: 300, areaName: "Moema", coordinates: { x: 48, y: 68 } },
  { id: "hp9", lat: -23.60, lng: -46.64, demandScore: 72, occupancyEstimate: 75, adrEstimate: 220, areaName: "Vila Clementino", coordinates: { x: 55, y: 72 } },
  { id: "hp10", lat: -23.53, lng: -46.68, demandScore: 60, occupancyEstimate: 70, adrEstimate: 200, areaName: "Barra Funda", coordinates: { x: 32, y: 18 } },
  { id: "hp11", lat: -23.61, lng: -46.69, demandScore: 75, occupancyEstimate: 75, adrEstimate: 290, areaName: "Brooklin", coordinates: { x: 42, y: 65 } },
  // extra heat points for density
  { id: "hp12", lat: -23.57, lng: -46.70, demandScore: 70, occupancyEstimate: 72, adrEstimate: 250, areaName: "Alto de Pinheiros", coordinates: { x: 18, y: 42 } },
  { id: "hp13", lat: -23.55, lng: -46.66, demandScore: 65, occupancyEstimate: 70, adrEstimate: 230, areaName: "Higienópolis", coordinates: { x: 50, y: 28 } },
  { id: "hp14", lat: -23.58, lng: -46.66, demandScore: 82, occupancyEstimate: 76, adrEstimate: 310, areaName: "Paraíso", coordinates: { x: 52, y: 50 } },
  { id: "hp15", lat: -23.59, lng: -46.70, demandScore: 55, occupancyEstimate: 68, adrEstimate: 210, areaName: "Butantã", coordinates: { x: 15, y: 55 } },
];

export const DEMAND_FILTERS = [
  { key: "tourism", label: "Turismo", icon: MapPin },
  { key: "business", label: "Corporativo", icon: Briefcase },
  { key: "events", label: "Eventos", icon: Calendar },
  { key: "medical", label: "Hospitais", icon: Stethoscope },
  { key: "mixed", label: "Misto", icon: Zap },
  { key: "metro", label: "Próximo ao metrô", icon: Train },
];

export const EVENT_ICONS: Record<string, typeof Music> = {
  Music, Sports: Trophy, Culture: Theater, Business: Briefcase, Expo: Ticket,
};

export const IMPACT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "bg-destructive/10", text: "text-destructive", label: "Alta demanda" },
  medium: { bg: "bg-amber-100 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", label: "Média demanda" },
  low: { bg: "bg-muted", text: "text-muted-foreground", label: "Baixa demanda" },
};

export const TAG_ICONS: Record<string, typeof MapPin> = {
  gastronomia: Utensils, turismo: MapPin, "vida noturna": Music, coworking: Wifi, metro: Train,
  arte: Palette, bares: Music, luxo: Star, compras: ShoppingBag, restaurantes: Utensils,
  corporativo: Briefcase, negocios: Briefcase, tech: Zap, cultura: Theater, museus: Theater,
  teatro: Theater, residencial: Building2, aeroporto: Plane, parque: Trees, hospitais: Stethoscope,
  universidades: GraduationCap, saude: Heart, eventos: Calendar, expo: Ticket, transporte: Train,
  "business district": Building2,
};

export const INVESTOR_INSIGHTS = [
  { icon: Train, text: "Studios próximos ao metrô tendem a ter +10% ocupação média." },
  { icon: Utensils, text: "Áreas com alta densidade de restaurantes aumentam diária média em até 15%." },
  { icon: Briefcase, text: "Eventos corporativos aumentam demanda em bairros business em até 25%." },
  { icon: Music, text: "Festivais de música geram picos de até 40% na demanda local." },
  { icon: Building2, text: "Bairros com score acima de 88 têm payback médio abaixo de 3 anos." },
];

export const DEMAND_PROFILE_LABELS: Record<string, { label: string; emoji: string }> = {
  "mixed": { label: "Misto", emoji: "⚡" },
  "tourism": { label: "Turismo", emoji: "🎭" },
  "premium tourism": { label: "Turismo Premium", emoji: "✨" },
  "business": { label: "Corporativo", emoji: "💼" },
  "medical": { label: "Hospitalar", emoji: "🏥" },
  "events": { label: "Eventos", emoji: "🎪" },
};

export const fmt = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export function scoreColor(score: number) {
  if (score >= 88) return "bg-emerald-500";
  if (score >= 84) return "bg-amber-500";
  return "bg-muted-foreground/40";
}

export function scoreBorder(score: number) {
  if (score >= 88) return "border-emerald-500/40";
  if (score >= 84) return "border-amber-500/40";
  return "border-border";
}
