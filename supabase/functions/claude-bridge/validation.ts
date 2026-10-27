type Rule = (value: unknown) => boolean;
const text = (max = 200): Rule => (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const number = (min = 0, max = 1_000_000_000): Rule => (v) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const integer = (max = 10_000_000): Rule => (v) => number(0, max)(v) && Number.isInteger(v);
const date: Rule = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const timestamp: Rule = (v) => typeof v === 'string' && v.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
const url: Rule = (v) => {
  if (typeof v !== 'string' || v.length > 2000) return false;
  try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
};
const optional = (rule: Rule): Rule => (v) => v === null || rule(v);
const fields = (names: string, rule: Rule) => Object.fromEntries(names.split(' ').map((name) => [name, optional(rule)]));

// Campos explícitos de coleta; id e atributos desconhecidos nunca chegam à escrita.
const bairroRules: Record<string, Rule> = {
  bairro: text(), cidade: text(), periodo_inicio: date, periodo_fim: date,
  nivel_confianca_dados: (v) => typeof v === 'string' && ['alta', 'media', 'baixa'].includes(v),
  n_listings_total: integer(), n_listings_studio_1q: integer(), pct_studio_1q: number(0, 1),
  area_media_estudio: number(1, 10000), data_atualizacao: timestamp, fonte_primaria: optional(text(1000)),
  ...fields('adr_medio_studio aluguel_mensal_long_term_medio preco_m2_residencial_medio receita_anual_media_studio estadia_media_noites media_reviews_por_listing', number()),
  ...fields('dias_medio_venda_imovel numero_transacoes_imobiliarias_ano', integer()),
  ...fields('ocupacao_media_studio pct_politica_flexivel pct_politica_moderada pct_politica_rigida percentual_superhost porcentagem_reservas_30d_plus yield_bruto_airbnb yield_bruto_long_term grau_saturacao_index risco_condominio risco_regulatorio', number(0, 1)),
  ...fields('score_crescimento_potencial score_liquidez score_rentabilidade indice_criminalidade', number(0, 100)),
  delta_yield: optional(number(-1, 1)), rating_medio: optional(number(0, 5)),
};
const rawRules: Record<string, Rule> = {
  listing_id: text(), bairro: text(), cidade: text(), fonte: text(), url,
  unit_type: text(100), moeda: (v) => typeof v === 'string' && /^[A-Z]{3}$/.test(v),
  data_coleta: timestamp, data_primeira_reserva: optional(date),
  ...fields('titulo descricao_resumida regras_casa_texto', text(10000)), politica_cancelamento: optional(text()),
  ...fields('bedrooms beds capacidade_hospedes min_noites max_noites n_reviews', integer()),
  ...fields('bathrooms area_m2 preco_noite_atual receita_anual_estimada adr_estimado estadia_media_noites', number()),
  disponibilidade_30d: optional(integer(30)), disponibilidade_90d: optional(integer(90)), disponibilidade_365d: optional(integer(365)),
  ocupacao_estimada: optional(number(0, 1)), rating_geral: optional(number(0, 5)),
  latitude: optional(number(-90, 90)), longitude: optional(number(-180, 180)),
  is_superhost: optional((v) => typeof v === 'boolean'),
  amenities: optional((v) => Array.isArray(v) && v.length <= 200 && v.every(text(200))),
};
export const BRIDGE_RULES = { bairro_airbnb_sp: bairroRules, raw_listings: rawRules };
export type BridgeTable = keyof typeof BRIDGE_RULES;
export function bridgeTable(value: unknown): value is BridgeTable {
  return typeof value === 'string' && Object.hasOwn(BRIDGE_RULES, value);
}
export function validateRows(table: BridgeTable, value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 1000) throw new Error('Envie entre 1 e 1000 linhas.');
  const rules = BRIDGE_RULES[table];
  const required = table === 'raw_listings'
    ? ['listing_id', 'bairro', 'fonte', 'url']
    : ['bairro', 'periodo_inicio', 'periodo_fim', 'nivel_confianca_dados', 'n_listings_total', 'n_listings_studio_1q', 'pct_studio_1q'];
  return value.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Linha inválida.');
    const input = row as Record<string, unknown>;
    if (required.some((key) => !Object.hasOwn(input, key))) throw new Error('Campos obrigatórios ausentes.');
    const clean: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(input)) {
      if (!Object.hasOwn(rules, key) || !rules[key](v)) throw new Error('Campo não permitido ou valor inválido.');
      clean[key] = v;
    }
    if (table === 'bairro_airbnb_sp' && (String(clean.periodo_inicio) > String(clean.periodo_fim) || Number(clean.n_listings_studio_1q) > Number(clean.n_listings_total))) throw new Error('Período ou contagem inválida.');
    return clean;
  });
}
export function validateSelect(table: BridgeTable, payload: Record<string, unknown>) {
  const allowed = BRIDGE_RULES[table];
  const columns = payload.columns ?? '*';
  if (typeof columns !== 'string' || (columns !== '*' && !columns.split(',').every((c) => Object.hasOwn(allowed, c.trim()) || (table === 'bairro_airbnb_sp' && c.trim() === 'id')))) throw new Error('Colunas inválidas.');
  const limit = payload.limit ?? 100;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Limite inválido (1 a 500).');
  const filters = payload.filters ?? {};
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) throw new Error('Filtros inválidos.');
  for (const [key, value] of Object.entries(filters)) {
    if (!Object.hasOwn(allowed, key) || !allowed[key](value)) throw new Error('Filtro não permitido.');
  }
  return { columns, limit, filters: filters as Record<string, unknown> };
}