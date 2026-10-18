/** Referências e redações aprovadas por Pedro para o guia Radar Bewild. */
export const FONTES_GUIA = {
  limpeza: { title: "AHLA/Morning Consult 2020", url: "https://www.hospitalitynet.org/news/4100348.html" },
  preferidos: { title: "Airbnb — Preferidos dos hóspedes", url: "https://www.airbnb.com/help/article/3495" },
  ranking: { title: "Airbnb — ranking de busca", url: "https://www.airbnb.com/help/article/39" },
  qualidade: { title: "Airbnb Global Quality Report 2025", url: "https://news.airbnb.com/airbnb-global-quality-report/" },
  lollapalooza: { title: "Airbnb — Lollapalooza Brasil 2026", url: "https://news.airbnb.com/br/lollapalooza-brasil-2026/" },
  fipezap: { title: "FipeZAP Locação — dez/2025", url: "https://static.poder360.com.br/2026/01/fipezap-202512-residencial-locacao.pdf" },
  fotografia: { title: "Airbnb — fotografia profissional", url: "https://www.airbnb.com/professional_photography" },
  vinilico: { title: "Durafloor — pisos e instalação", url: "https://www.durafloor.com.br/?p=123370" },
  expedia: { title: "Expedia Traveler Value Index 2025", url: "https://ir.expediagroup.com/news-and-events/news/news-details/2025/Travel-Priorities-Reinvented-Expedia-Groups-2025-Traveler-Value-Index-Signals-a-Shift-in-Consumer-Priorities/default.aspx" },
  /** Referência da cidade (SAO_PAULO_REFERENCIA): coleta assistida aprovada em 18/10/2026, citada também no FAQ. */
  guestfavoritesSP: { title: "GuestFavorites", url: "https://www.guestfavorites.com" },
  /**
   * Base de taxas do simulador de financiamento (src/data/taxasFinanciamento.ts):
   * consulta pública às páginas e simuladores dos bancos em 19/07/2026 (decisão do
   * Pedro, 18/10/2026). A tabela completa, com situação de cada taxa, fica em /metodologia.
   */
  taxasFinanciamento: { title: "Taxas dos bancos — consulta de 19/07/2026", url: "/metodologia#financiamento" },
} as const;

/** Data da coleta GuestFavorites em uso (bairros e referência de São Paulo; Moema segue com 13/10/2026). */
export const COLETA_GUESTFAVORITES = "18/10/2026";

export type FonteGuia = { title: string; url: string };

export const FONTES_RESERVAS = [
  { ...FONTES_GUIA.limpeza, detail: "Limpeza como fator de escolha da hospedagem entre viajantes frequentes." },
  { ...FONTES_GUIA.qualidade, detail: "Qualidade e avaliações dos Preferidos dos hóspedes." },
  { ...FONTES_GUIA.ranking, detail: "Fatores considerados no posicionamento dos anúncios." },
  { ...FONTES_GUIA.expedia, detail: "Três em cada quatro viajantes pagariam mais por hospedagem com avaliações melhores." },
];