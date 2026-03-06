// src/data/districtMetrics.ts

// Seed inicial (distritos oficiais) para o "Mapa de Bairros Rentáveis — São Paulo".
// ✅ NÚMEROS IGUAIS AO MOCK (screenshot): Pinheiros, Itaim Bibi, Jardim Paulista.
// ⚠️ Os demais distritos abaixo estão com valores plausíveis como placeholders (marcados com TODO)
// para você substituir quando plugar a base real (AirDNA/InsideAirbnb/etc).

export type DemandProfile =
  | "tourism"
  | "business"
  | "events"
  | "medical"
  | "mixed"
  | "premium tourism";

export type CompetitionLevel = "low" | "medium" | "high";

export type DistrictMetric = {
  districtName: string; // MUST match GeoJSON properties.name exactly
  tags: string[];
  demandProfile: DemandProfile;
  profitabilityScore: number;
  metrics: {
    estimatedROI: number;
    nightlyRate: number;
    occupancy: number;
    revenueMonth: number;
    adrRange: string;
    listingsCount: number;
    competitionLevel: CompetitionLevel;
    sourceLabel: string;
  };
  recommendation: {
    bestStudioType: string;
    whyItWorks: string;
    tips: string[];
    risks: string[];
  };
};

export const districtMetrics: DistrictMetric[] = [
  // #1 — MOCK MATCH ✅
  {
    districtName: "Pinheiros",
    tags: ["misto", "turismo", "gastronomia", "vida noturna", "coworking", "metro"],
    demandProfile: "mixed",
    profitabilityScore: 92,
    metrics: {
      estimatedROI: 19.2,
      nightlyRate: 410,
      occupancy: 75,
      revenueMonth: 9225,
      adrRange: "R$340–R$480",
      listingsCount: 3200,
      competitionLevel: "high",
      sourceLabel: "Bwild/AirDNA 2025",
    },
    recommendation: {
      bestStudioType: "Compacto premium + home office",
      whyItWorks:
        "Alta demanda mista (turismo + corporativo), forte oferta gastronômica e boa mobilidade.",
      tips: [
        "Capriche na foto de capa e em um detalhe de design memorável.",
        "Garanta Wi-Fi excelente e mesa confortável (nômades digitais).",
        "Automatize check-in e mensagens para escalar sem fricção.",
      ],
      risks: [
        "Alta competição: fotos, reviews e operação precisam ser impecáveis.",
        "Atenção a ruído (noite) e regras de condomínio.",
      ],
    },
  },
  // #2 — MOCK MATCH ✅
  {
    districtName: "Itaim Bibi",
    tags: ["corporativo", "negocios", "restaurantes", "tech", "misto"],
    demandProfile: "business",
    profitabilityScore: 91,
    metrics: {
      estimatedROI: 18.1,
      nightlyRate: 440,
      occupancy: 73,
      revenueMonth: 9636,
      adrRange: "R$360–R$520",
      listingsCount: 2600,
      competitionLevel: "high",
      sourceLabel: "Bwild/AirDNA 2025",
    },
    recommendation: {
      bestStudioType: "Business studio (hotel feel)",
      whyItWorks:
        "Público corporativo valoriza previsibilidade, conforto e operação profissional.",
      tips: [
        "Invista em enxoval premium, blackout e padrão de hotel.",
        "Check-in ultra intuitivo + guia digital objetivo.",
        "Precificação dinâmica para capturar picos de demanda corporativa.",
      ],
      risks: [
        "Pode ter sazonalidade corporativa (dias úteis mais fortes).",
        "Condomínios podem ter restrições operacionais.",
      ],
    },
  },
  // #3 — MOCK MATCH ✅
  {
    districtName: "Jardim Paulista",
    tags: ["turismo premium", "compras", "restaurantes", "luxo", "cultura"],
    demandProfile: "premium tourism",
    profitabilityScore: 87,
    metrics: {
      estimatedROI: 17.4,
      nightlyRate: 440,
      occupancy: 70,
      revenueMonth: 9240,
      adrRange: "R$360–R$520",
      listingsCount: 2800,
      competitionLevel: "high",
      sourceLabel: "Bwild/AirDNA 2025",
    },
    recommendation: {
      bestStudioType: "Premium aesthetic (instagramável)",
      whyItWorks:
        "Região premium com forte apelo turístico e alta disposição a pagar por conforto/estética.",
      tips: [
        "Crie identidade visual clara (paleta + 1 peça 'wow').",
        "Iluminação em camadas (indireta + decorativa) para fotos perfeitas.",
        "Amenities e experiência de hotel elevam ADR e reviews.",
      ],
      risks: [
        "Competição alta: diferenciação estética e fotos profissionais são obrigatórias.",
        "Custo de montagem tende a ser maior para manter padrão premium.",
      ],
    },
  },
  // ----------------------------
  // PLACEHOLDERS (TODO ajustar)
  // ----------------------------
  {
    districtName: "Consolação",
    tags: ["turismo", "metro", "cultura", "paulista", "misto"],
    demandProfile: "tourism",
    profitabilityScore: 86,
    metrics: {
      estimatedROI: 16.6,
      nightlyRate: 390,
      occupancy: 74,
      revenueMonth: 8660,
      adrRange: "R$320–R$470",
      listingsCount: 2400,
      competitionLevel: "high",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Turismo funcional + fácil mobilidade",
      whyItWorks: "Muita busca por localização e acesso rápido a pontos turísticos e metrô.",
      tips: [
        "Check-in autônomo e instruções visuais (alto giro de hóspedes).",
        "Otimize o layout para mala + cozinha compacta completa.",
      ],
      risks: ["Micro-localização importa muito (ruas podem variar bastante)."],
    },
  },
  {
    districtName: "Bela Vista",
    tags: ["turismo", "teatro", "gastronomia", "cultura", "metro"],
    demandProfile: "tourism",
    profitabilityScore: 82,
    metrics: {
      estimatedROI: 15.4,
      nightlyRate: 360,
      occupancy: 72,
      revenueMonth: 7776,
      adrRange: "R$290–R$430",
      listingsCount: 2100,
      competitionLevel: "high",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Turismo acessível (alto volume)",
      whyItWorks: "Boa demanda turística e cultural; tende a performar bem com preço competitivo.",
      tips: [
        "Foco em limpeza impecável e operação rápida (troca frequente).",
        "Blackout + acústica básica para evitar reviews por ruído.",
      ],
      risks: ["Ruído e variação de segurança percebida por micro-região."],
    },
  },
  {
    districtName: "Moema",
    tags: ["misto", "parque", "aeroporto", "restaurantes", "familia"],
    demandProfile: "mixed",
    profitabilityScore: 85,
    metrics: {
      estimatedROI: 15.8,
      nightlyRate: 380,
      occupancy: 70,
      revenueMonth: 7980,
      adrRange: "R$310–R$460",
      listingsCount: 1800,
      competitionLevel: "medium",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Conforto + estadias médias",
      whyItWorks: "Atrai perfis variados (lazer, família, deslocamentos) e tende a ter boa recorrência.",
      tips: [
        "Inclua kit de boas-vindas e 'hotel feel' (enxoval bom).",
        "Mesa para trabalho remoto aumenta estadias mais longas.",
      ],
      risks: ["Dependência de mobilidade (considere proximidade de metrô/rotas)."],
    },
  },
  {
    districtName: "Vila Mariana",
    tags: ["hospitais", "universidades", "misto", "metro"],
    demandProfile: "medical",
    profitabilityScore: 83,
    metrics: {
      estimatedROI: 15.2,
      nightlyRate: 350,
      occupancy: 71,
      revenueMonth: 7455,
      adrRange: "R$280–R$420",
      listingsCount: 1600,
      competitionLevel: "medium",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Funcional (estadia média) + cozinha completa",
      whyItWorks:
        "Demanda recorrente por saúde/universidades: hóspedes valorizam praticidade e conforto.",
      tips: [
        "Cozinha bem equipada + lavanderia (se possível).",
        "Ambiente silencioso e cama confortável (público sensível ao descanso).",
      ],
      risks: ["Menos picos de ADR; performance vem de ocupação consistente."],
    },
  },
  {
    districtName: "Barra Funda",
    tags: ["eventos", "expo", "transporte", "shows"],
    demandProfile: "events",
    profitabilityScore: 80,
    metrics: {
      estimatedROI: 14.8,
      nightlyRate: 340,
      occupancy: 68,
      revenueMonth: 6936,
      adrRange: "R$260–R$420",
      listingsCount: 1200,
      competitionLevel: "medium",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Eventos (flexível) + operação eficiente",
      whyItWorks: "Região performa muito em picos de calendário; boa para estratégia de preço dinâmico.",
      tips: [
        "Ative smart pricing e regras de estadia mínima em datas fortes.",
        "Check-in autônomo para alto volume de entrada/saída em eventos.",
      ],
      risks: ["Sazonalidade por eventos; precisa de calendário bem gerido."],
    },
  },
  {
    districtName: "Campo Belo",
    tags: ["corporativo", "misto", "negocios", "conforto"],
    demandProfile: "business",
    profitabilityScore: 84,
    metrics: {
      estimatedROI: 15.0,
      nightlyRate: 370,
      occupancy: 69,
      revenueMonth: 7659,
      adrRange: "R$300–R$460",
      listingsCount: 1100,
      competitionLevel: "medium",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Business + estadia média",
      whyItWorks: "Atrai viagens de trabalho e estadias mais longas com conforto e previsibilidade.",
      tips: [
        "Roupa de cama premium + blackout + Wi-Fi excelente.",
        "Espaço de trabalho e tomadas/USB bem posicionadas.",
      ],
      risks: ["Sem metrô perto em alguns trechos: micro-localização importa."],
    },
  },
  {
    districtName: "Itaquera",
    tags: ["eventos", "transporte"],
    demandProfile: "events",
    profitabilityScore: 78,
    metrics: {
      estimatedROI: 13.2,
      nightlyRate: 260,
      occupancy: 62,
      revenueMonth: 4836,
      adrRange: "R$190–R$320",
      listingsCount: 450,
      competitionLevel: "low",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Eventos pontuais + baixo custo",
      whyItWorks: "Pode performar em datas específicas; bom para estratégia oportunística.",
      tips: ["Use calendário de eventos e preço dinâmico.", "Operação enxuta e eficiente."],
      risks: ["Demanda menos constante fora de eventos."],
    },
  },
  {
    districtName: "Santana",
    tags: ["misto", "familia", "eventos", "transporte"],
    demandProfile: "mixed",
    profitabilityScore: 81,
    metrics: {
      estimatedROI: 14.0,
      nightlyRate: 310,
      occupancy: 66,
      revenueMonth: 6138,
      adrRange: "R$240–R$390",
      listingsCount: 900,
      competitionLevel: "medium",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Funcional (misto) + boa operação",
      whyItWorks: "Demanda diversificada e potencial com boa micro-localização e oferta local.",
      tips: ["Foque em limpeza e check-in sem atrito.", "Garanta bom Wi-Fi."],
      risks: ["Variação por micro-região e acessos."],
    },
  },
  {
    districtName: "República",
    tags: ["turismo", "centro", "cultura", "metro"],
    demandProfile: "tourism",
    profitabilityScore: 79,
    metrics: {
      estimatedROI: 13.6,
      nightlyRate: 300,
      occupancy: 67,
      revenueMonth: 6030,
      adrRange: "R$230–R$380",
      listingsCount: 1900,
      competitionLevel: "high",
      sourceLabel: "Seed (substituir por dados reais)",
    },
    recommendation: {
      bestStudioType: "Turismo econômico + alta rotatividade",
      whyItWorks: "Boa procura por localização central e acesso ao metrô.",
      tips: ["Invista em segurança percebida (iluminação/entrada clara).", "Manual de check-in ultra visual."],
      risks: ["Micro-localização é crítica; avaliar entorno com muito cuidado."],
    },
  },
];

// helpers
export const districtMetricByName = new Map(
  districtMetrics.map((d) => [d.districtName, d]),
);

export const districtNames = districtMetrics.map((d) => d.districtName);
