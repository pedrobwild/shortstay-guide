import { FONTES_GUIA, type FonteGuia } from "@/data/fontesGuia";
import {
  Home, MapPin, TrendingUp, BarChart3, Paintbrush, ShieldCheck,
  Palette, Ruler, Sparkles, BookOpen, CheckSquare, HelpCircle, Send,
  SprayCan, DoorOpen, Target, Lock, Wifi, Star, Briefcase, Heart,
  GraduationCap, Camera, DollarSign, FileText, Zap, MousePointerClick,
  CalendarCheck, MessageSquare, Trophy, Package, BadgeCheck, Users, Clock, Phone,
  Calculator, Building2, PieChart, Megaphone,
  type LucideIcon,
} from "lucide-react";
import { RESPOSTA_CUSTO_REFORMA, ESTUDO_REFORMA_URL, SELO_REFORMAS, SELO_PROJETOS, SELO_BAIRROS } from "@/data/provasBewild";

/* ─── Phases (4 macro-blocks) ─── */
export const PHASES = [
  { number: 1, label: "Onde investir", description: "Bairros, indicadores e inteligência de dados" },
  { number: 2, label: "Como validar a conta", description: "Escolha do ativo, matemática do investimento e simulação" },
  { number: 3, label: "O que faz um studio performar", description: "Produto, reforma, decoração e operação" },
  { number: 4, label: "Como agir com confiança", description: "Anúncio, precificação, evidências e próximo passo" },
] as const;

/* ─── Bairros: fonte única em src/data/bairrosCurados.ts ─── */
export type { BairroCurado as BairroItem } from "@/data/bairrosCurados";

export const DECORATION_LEVELS = [
  { value: "basico", label: "Básico", multiplier: 1.0 },
  { value: "premium", label: "Premium", multiplier: 1.2 },
  { value: "alto", label: "Alto padrão", multiplier: 1.45 },
] as const;

export const SECTIONS = [
  // Início
  { id: "hero", label: "Início", icon: Home, phase: 0 },
  // Bloco 1 — Onde investir
  { id: "mapa-bairros", label: "Mapa de Bairros", icon: MapPin, phase: 1 },
  { id: "mercado", label: "Mercado e Precificação", icon: DollarSign, phase: 1 },
  { id: "intelligence", label: "Short Stay Intelligence", icon: BarChart3, href: "/mercado", phase: 1 },
  // Bloco 2 — Como validar a conta
  { id: "escolha-ativo", label: "Escolha do Ativo", icon: Building2, phase: 2 },
  { id: "rentabilidade", label: "Matemática do Investimento", icon: PieChart, phase: 2 },
  { id: "simulador", label: "Simulador de Receita", icon: Calculator, phase: 2 },
  // Bloco 3 — O que faz um studio performar
  { id: "reservas", label: "O que move reservas", icon: TrendingUp, phase: 3 },
  { id: "reforma", label: "Reforma inteligente", icon: Paintbrush, phase: 3 },
  { id: "antichecklist", label: "Anti-checklist", icon: ShieldCheck, phase: 3 },
  { id: "decoracao", label: "Decoração estratégica", icon: Palette, phase: 3 },
  { id: "tendencias", label: "Tendências 2026", icon: Sparkles, phase: 3 },
  // Bloco 4 — Como agir com confiança
  { id: "anuncio-pricing", label: "Anúncio e Precificação", icon: Megaphone, phase: 4 },
  { id: "casestudy", label: "Case study", icon: BookOpen, phase: 4 },
  { id: "checklist", label: "Checklist investidor", icon: CheckSquare, phase: 4 },
  { id: "faq", label: "FAQ", icon: HelpCircle, phase: 4 },
  { id: "cta-final", label: "Peça seu orçamento", icon: Send, phase: 4 },
] as const;

export type SectionItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  phase: number;
  href?: string;
};

export const DECISION_DRIVERS = [
  { id: "limpeza", title: "Limpeza", desc: "Em pesquisa da AHLA (2020), limpeza foi o fator mais citado por viajantes frequentes na escolha da hospedagem.", sources: [FONTES_GUIA.limpeza], icon: SprayCan, priority: { executivo: 1, turista: 2, estudante: 3, casal: 2 } },
  { id: "checkin", title: "Check-in sem atrito", desc: "Planeje o acesso com fechadura digital ou key box e instruções claras; confirme como o hóspede poderá entrar em caso de imprevisto.", icon: DoorOpen, priority: { executivo: 2, turista: 3, estudante: 2, casal: 4 } },
  { id: "precisao", title: "Precisão do anúncio", desc: "Fotos reais, descrição honesta e expectativa alinhada. Precisão é uma das notas por categoria que o Airbnb usa para escolher os Preferidos dos hóspedes.", sources: [FONTES_GUIA.preferidos], icon: Target, priority: { executivo: 3, turista: 1, estudante: 4, casal: 3 } },
  { id: "avaliacoes", title: "Avaliações e nota", desc: "Nota e avaliações pesam no posicionamento do Airbnb; os Preferidos dos hóspedes têm nota média de 4,92.", sources: [FONTES_GUIA.ranking, FONTES_GUIA.qualidade], icon: Star, priority: { executivo: 5, turista: 4, estudante: 1, casal: 1 } },
  { id: "seguranca", title: "Segurança e acessibilidade", desc: "Verifique portaria, iluminação e condições de acessibilidade; informe com precisão os recursos disponíveis no anúncio.", sources: [FONTES_GUIA.preferidos], icon: Lock, priority: { executivo: 4, turista: 5, estudante: 5, casal: 5 } },
  { id: "ambiente", title: "Ambiente + trabalho + entretenimento", desc: "Descreva Wi-Fi, mesa de trabalho, smart TV e condições acústicas para que o hóspede avalie a adequação do espaço.", icon: Wifi, priority: { executivo: 6, turista: 6, estudante: 6, casal: 6 } },
];

export type PersonaKey = "executivo" | "turista" | "estudante" | "casal";

export const PERSONAS: { key: PersonaKey; label: string; icon: typeof Briefcase }[] = [
  { key: "executivo", label: "Executivo", icon: Briefcase },
  { key: "turista", label: "Turista", icon: MapPin },
  { key: "estudante", label: "Estudante", icon: GraduationCap },
  { key: "casal", label: "Casal", icon: Heart },
];

export type TrendDifficulty = "easy" | "medium" | "advanced";
export type TrendImpact = "high" | "medium" | "low";

export interface TrendDetails {
  what: string;
  how: string[];
  checklist: string[];
  expectedImpact: string;
}

export interface TrendItem {
  id: number;
  numberLabel: string;
  title: string;
  short: string;
  tags: string[];
  difficulty: TrendDifficulty;
  impact: TrendImpact;
  details: TrendDetails;
  sources?: FonteGuia[];
}

export const TREND_TAG_ICONS: Record<string, typeof Camera> = {
  Fotos: Camera, Design: Palette, Operação: FileText, Precificação: DollarSign,
  "Experiência": Star, Automação: Zap, Escala: BarChart3,
};

export const TREND_TAG_COLORS: Record<string, string> = {
  Fotos: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Design: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  Operação: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Precificação: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Experiência": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  Automação: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  Escala: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

export const TRENDS_2026: TrendItem[] = [
  { id: 1, sources: [FONTES_GUIA.ranking], numberLabel: "#1", title: "Fotografia profissional estratégica", short: "O Airbnb considera a qualidade das fotos no posicionamento do anúncio.", tags: ["Fotos"], difficulty: "medium", impact: "high", details: { what: "Planeje fotos que mostrem os ambientes e os recursos disponíveis.", how: ["Contrate fotógrafo com portfólio de interiores e short stay.", "Fotografe com luz natural e enquadramentos amplos.", "Priorize a foto principal como 'foto de capa'."], checklist: ["Foto de capa forte", "Cozinha/banheiro bem iluminados", "Sequência lógica"], expectedImpact: "Fotos de qualidade ajudam no posicionamento do anúncio, segundo o Airbnb." } },
  { id: 2, sources: [FONTES_GUIA.ranking], numberLabel: "#2", title: "Primeira foto extremamente forte", short: "A foto de capa apresenta o espaço nos resultados da busca.", tags: ["Fotos"], difficulty: "easy", impact: "high", details: { what: "Escolha uma foto de capa que represente o espaço com clareza.", how: ["Use iluminação perfeita e enquadramento amplo.", "Inclua um elemento visual marcante.", "Evite fotos escuras ou muito fechadas."], checklist: ["Capa clara e ampla", "Elemento memorável visível"], expectedImpact: "A qualidade das fotos é um fator de posicionamento considerado pelo Airbnb." } },
  { id: 3, numberLabel: "#3", title: "Identidade visual do apartamento", short: "Um conceito único faz o anúncio se destacar.", tags: ["Design"], difficulty: "medium", impact: "high", details: { what: "Escolha um tema consistente para orientar a composição do espaço.", how: ["Escolha um conceito: industrial, tropical, escandinavo.", "Mantenha paleta de cores consistente.", "Use 1–2 peças 'statement'."], checklist: ["Paleta definida", "Tema aplicado", "Peça marcante"], expectedImpact: "Apresenta a identidade visual do espaço no anúncio." } },
  { id: 4, numberLabel: "#4", title: "Self check-in ultra intuitivo", short: "Acesso autônomo com instruções claras e alternativa de apoio.", tags: ["Operação", "Automação"], difficulty: "medium", impact: "high", details: { what: "Além da fechadura digital, a experiência é guiada.", how: ["Crie vídeo de check-in (30–60s).", "Manual visual com fotos e passos curtos."], checklist: ["Fechadura digital + backup", "Vídeo curto", "Manual visual"], expectedImpact: "Oferece instruções que o hóspede pode consultar antes da chegada." } },
  { id: 5, numberLabel: "#5", title: "Guia digital personalizado da cidade", short: "Reúna orientações de transporte e sugestões do entorno.", tags: ["Experiência"], difficulty: "easy", impact: "medium", details: { what: "Disponibilize informações locais em um guia digital.", how: ["Recomende restaurantes, cafés e coworkings.", "Inclua transporte e turismo."], checklist: ["Top 10 lugares", "Mapa/links", "Dicas por perfil"], expectedImpact: "Permite consultar sugestões locais durante a estadia." } },
  { id: 6, numberLabel: "#6", title: "Wi-Fi extremamente rápido", short: "Informe a conexão disponível para quem pretende trabalhar no studio.", tags: ["Experiência"], difficulty: "easy", impact: "high", details: { what: "Verifique a conexão e a cobertura nos ambientes.", how: ["Instale fibra e roteador premium.", "Use repetidores se necessário."], checklist: ["Fibra ativa", "Roteador bom", "Senha fácil + QR code"], expectedImpact: "Permite avaliar se a conexão atende às necessidades de trabalho remoto." } },
  { id: 7, numberLabel: "#7", title: "Colchão padrão hotel", short: "Priorize conforto e conservação do colchão.", tags: ["Experiência"], difficulty: "medium", impact: "high", details: { what: "Escolha o colchão considerando conforto, conservação e espaço disponível.", how: ["Use queen/king quando possível.", "Pillow top e travesseiros de qualidade."], checklist: ["Colchão premium", "2 tipos de travesseiro", "Protetor impermeável"], expectedImpact: "Oferece uma estrutura de descanso ao hóspede, sem promessa de avaliação." } },
  { id: 8, numberLabel: "#8", title: "Roupa de cama premium", short: "Sensação de hotel com enxoval superior.", tags: ["Experiência"], difficulty: "medium", impact: "medium", details: { what: "Escolha enxoval adequado ao uso e à rotina de reposição.", how: ["Algodão 300+ fios, duvet, várias almofadas.", "Padronize cores e reposição."], checklist: ["Jogo completo reserva", "Toalhas boas"], expectedImpact: "Compõe a experiência de hospedagem; não determina nota ou diária." } },
  { id: 9, numberLabel: "#9", title: "Cortinas blackout", short: "Sono melhor para hóspedes de qualquer fuso.", tags: ["Experiência"], difficulty: "easy", impact: "medium", details: { what: "Avalie cortinas que permitam controlar a entrada de luz.", how: ["Instale trilho e tecido blackout real.", "Evite entrada lateral de luz."], checklist: ["Blackout total", "Vedação lateral"], expectedImpact: "Permite ao hóspede controlar a luminosidade para descansar." } },
  { id: 10, numberLabel: "#10", title: "Iluminação pensada para fotos", short: "Iluminação boa melhora fotos e experiência.", tags: ["Design", "Fotos"], difficulty: "medium", impact: "medium", details: { what: "A luz certa melhora o anúncio e o ambiente.", how: ["Use iluminação indireta e luz quente.", "Inclua luminárias decorativas."], checklist: ["Luz geral + indireta", "Luz de leitura"], expectedImpact: "Fotos mais atrativas." } },
  { id: 11, numberLabel: "#11", title: "Elemento de design único", short: "Um detalhe visual pode compor a identidade do espaço.", tags: ["Design"], difficulty: "medium", impact: "medium", details: { what: "Escolha um elemento visual coerente com a proposta do studio.", how: ["Parede artística, cadeira icônica, painel ripado ou luminária escultural."], checklist: ["1 peça wow", "Visível na capa"], expectedImpact: "Apresenta um elemento de identidade, sem promessa de cliques." } },
  { id: 12, numberLabel: "#12", title: "Smart TV com streaming", short: "Informe quais recursos de TV e streaming estão disponíveis.", tags: ["Experiência"], difficulty: "easy", impact: "medium", details: { what: "Prepare instruções de uso da TV e dos recursos de streaming.", how: ["Smart TV, YouTube, Chromecast.", "Instruções simples."], checklist: ["Streaming pronto", "Guia rápido"], expectedImpact: "Permite consultar como usar os recursos de entretenimento." } },
  { id: 13, sources: [FONTES_GUIA.limpeza, FONTES_GUIA.preferidos], numberLabel: "#13", title: "Limpeza profissional padronizada", short: "Na pesquisa AHLA de 2020, limpeza foi o fator mais citado por viajantes frequentes.", tags: ["Operação"], difficulty: "medium", impact: "high", details: { what: "Defina uma rotina de limpeza e inspeção entre estadias.", how: ["Checklist de limpeza e equipe fixa.", "Inspeção por fotos."], checklist: ["Checklist", "Padrão banheiro", "Reposição controlada"], expectedImpact: "Limpeza é uma das notas por categoria usadas pelo Airbnb nos Preferidos dos hóspedes." } },
  { id: 14, numberLabel: "#14", title: "Checklists operacionais", short: "Documente processos e responsabilidades antes de ampliar a operação.", tags: ["Operação", "Escala"], difficulty: "medium", impact: "high", details: { what: "Organize tarefas em checklists replicáveis.", how: ["Check-in checklist, limpeza checklist, reposição checklist."], checklist: ["Processos documentados", "Responsáveis definidos"], expectedImpact: "Permite acompanhar tarefas e responsabilidades." } },
  { id: 15, numberLabel: "#15", title: "Preço dinâmico automático", short: "Revise preços conforme demanda e limites definidos para a operação.", tags: ["Precificação", "Automação"], difficulty: "medium", impact: "high", details: { what: "Plataformas ajustam preço com base em demanda.", how: ["Use PriceLabs, Beyond ou Wheelhouse.", "Defina piso, teto e regras."], checklist: ["Ferramenta ativa", "Regras por temporada"], expectedImpact: "Permite testar preços; receita e ocupação dependem dos resultados observados." } },
  { id: 16, numberLabel: "#16", title: "Gestão profissional de calendário", short: "Acompanhe eventos e feriados ao planejar o calendário.", tags: ["Precificação", "Operação"], difficulty: "medium", impact: "medium", details: { what: "Hosts monitoram ocupação, eventos e feriados.", how: ["Antecipe datas-chave e ajuste regras."], checklist: ["Datas de pico mapeadas", "Regras de estadia mínima"], expectedImpact: "Orienta testes de preço e disponibilidade em datas relevantes." } },
  { id: 17, numberLabel: "#17", title: "Estratégia de estadia mínima", short: "Teste regras de estadia mínima conforme o calendário.", tags: ["Precificação"], difficulty: "easy", impact: "medium", details: { what: "Mínimo de noites varia por demanda.", how: ["Hipótese de regra: fim de semana com mínimo de 2 noites.", "Hipótese de regra: alta temporada com mínimo de 3 noites."], checklist: ["Regras por temporada"], expectedImpact: "Avalie lacunas no calendário antes de manter ou alterar as regras." } },
  { id: 18, numberLabel: "#18", title: "Automatização de mensagens", short: "Organize mensagens automáticas para os momentos da estadia.", tags: ["Automação", "Operação"], difficulty: "medium", impact: "medium", details: { what: "Mensagens padronizadas e automáticas.", how: ["Pré check-in, guia da casa, pós checkout.", "Use Hospitable ou Guesty."], checklist: ["Templates prontos", "Gatilhos configurados"], expectedImpact: "Padroniza o envio de orientações; acompanhe dúvidas e exceções." } },
  { id: 19, sources: [FONTES_GUIA.ranking], numberLabel: "#19", title: "Reviews estratégicas", short: "Convide o hóspede a avaliar a estadia de forma cordial.", tags: ["Operação"], difficulty: "easy", impact: "medium", details: { what: "Mensagem pós checkout pedindo avaliação.", how: ["Automatize a solicitação e seja cordial."], checklist: ["Mensagem automática"], expectedImpact: "Nota e avaliações pesam no posicionamento do Airbnb; não há garantia de nota." } },
  { id: 20, numberLabel: "#20", title: "Portfólio de unidades", short: "Operadores podem escalar com um padrão replicável.", tags: ["Escala"], difficulty: "advanced", impact: "high", details: { what: "Avalie custos, equipe e resultados antes de ampliar o portfólio.", how: ["Hipótese de expansão: replicar operação e padrão em 3 a 10 unidades."], checklist: ["Padrão replicável", "Equipe e processos"], expectedImpact: "Permite planejar a expansão, sem garantia de receita recorrente." } },
];

export const TREND_ALL_TAGS = ["Fotos", "Design", "Operação", "Precificação", "Experiência", "Automação", "Escala"];

export const TREND_IMPACT_ORDER: Record<TrendImpact, number> = { high: 0, medium: 1, low: 2 };
export const TREND_DIFF_ORDER: Record<TrendDifficulty, number> = { easy: 0, medium: 1, advanced: 2 };
export const trendDiffLabel: Record<TrendDifficulty, string> = { easy: "Fácil", medium: "Médio", advanced: "Avançado" };
export const trendDiffColor: Record<TrendDifficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
export const trendImpactLabel: Record<TrendImpact, string> = { high: "Alto impacto", medium: "Médio impacto", low: "Baixo impacto" };
export const trendImpactColor: Record<TrendImpact, string> = {
  high: "bg-primary/10 text-primary",
  medium: "bg-accent/10 text-accent-foreground",
  low: "bg-muted text-muted-foreground",
};

export type TrendSortMode = "impact" | "easy" | "pro";

export const CHECKLIST_ITEMS = [
  "Localização com demanda comprovada",
  "Condomínio permite short stay",
  "Análise de concorrência feita",
  "Orçamento de reforma definido",
  "Projeção financeira validada",
  "Fotos profissionais planejadas",
  "Mobília funcional selecionada",
  "Plano de precificação dinâmica",
  "Gestão operacional definida",
  "Documentação fiscal em ordem",
];

export const SCORE_TIERS = [
  { min: 0, max: 3, label: "Iniciante", color: "bg-destructive", desc: "Você precisa amadurecer o projeto antes de investir." },
  { min: 4, max: 6, label: "Em progresso", color: "bg-accent", desc: "Bom começo, mas faltam itens críticos. Peça seu orçamento." },
  { min: 7, max: 8, label: "Quase pronto", color: "bg-primary/70", desc: "Falta pouco! Revise os itens pendentes e avance com confiança." },
  { min: 9, max: 10, label: "Pronto para investir", color: "bg-primary", desc: "Excelente! Seu planejamento está sólido. Hora de agir." },
];

export type SavedScenario = {
  id: string;
  name: string;
  bairro: string;
  metragem: number;
  ocupacao: number;
  diariaAtual: string;
  objetivo: string;
  rateBoost: number;
  reformaBudget: string;
  boostedDaily: number;
  receitaMensal: number;
  receitaAnual: number;
  paybackMonths: number | null;
};

export const SCENARIOS_KEY = "bwild_guide_scenarios";

export function loadScenarios(): SavedScenario[] {
  try {
    return JSON.parse(sessionStorage.getItem(SCENARIOS_KEY) || "[]");
  } catch { return []; }
}

export function persistScenarios(scenarios: SavedScenario[]) {
  sessionStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
}

export const fmt = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });

export const TRUST_SIGNALS_DATA = [
  { label: SELO_REFORMAS, icon: Package },
  { label: SELO_PROJETOS, icon: Star },
  { label: "Operação própria", icon: BadgeCheck },
  { label: SELO_BAIRROS, icon: Clock },
];

export const FAQ_DATA = [
  { q: "Quanto custa começar um studio para short stay?", a: RESPOSTA_CUSTO_REFORMA, link: ESTUDO_REFORMA_URL },
  { q: "Qual o retorno médio de um studio em São Paulo?", a: "O retorno depende da diária, ocupação, investimento e custos operacionais. Consulte os dados por bairro e teste suas próprias premissas no simulador." },
  { q: "Preciso de CNPJ para operar no Airbnb?", a: "Não é obrigatório, mas altamente recomendado. Com CNPJ (MEI ou Simples), você pode emitir notas fiscais, ter conta PJ dedicada e otimizar a tributação. Sem CNPJ, a renda deve ser declarada como pessoa física e pode ter alíquota mais alta de IR." },
  { q: "E se o condomínio não permitir short stay?", a: "Verifique a convenção do condomínio antes de comprar. Se já possui o imóvel, consulte um advogado especializado. Muitos condomínios ainda não têm regras claras — nesse caso, é possível operar dentro da legalidade até que haja deliberação formal em assembleia." },
  { q: "A Bewild faz a gestão operacional do studio?", a: "Sim. A Bewild oferece gestão completa: precificação dinâmica, atendimento ao hóspede, limpeza profissional, manutenção e relatórios mensais. O investidor recebe o rendimento líquido sem se envolver na operação diária." },
  { q: "Qual a diferença entre short stay e aluguel tradicional?", a: "Short stay (menos de 90 dias). O aluguel tradicional rende cerca de 6,3% ao ano em São Paulo; o short stay pode render mais, com mais custo operacional e mais risco. Mas envolve custos operacionais maiores e gestão ativa. Aluguel tradicional é mais previsível e passivo. A decisão depende do perfil do investidor e da localização.", source: FONTES_GUIA.fipezap },
];
