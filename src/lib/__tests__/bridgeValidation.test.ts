import { describe, expect, it } from 'vitest';
import { bridgeTable, validateRows, validateSelect } from '../../../supabase/functions/claude-bridge/validation';

const bairro = { bairro: 'Pinheiros', periodo_inicio: '2026-01-01', periodo_fim: '2026-09-30', nivel_confianca_dados: 'alta', n_listings_total: 100, n_listings_studio_1q: 50, pct_studio_1q: 0.5 };
const listing = { listing_id: 'exemplo', bairro: 'Pinheiros', fonte: 'Airbnb', url: 'https://www.airbnb.com/rooms/123' };
describe('validação das importações do bridge', () => {
  it('aceita somente as duas tabelas previstas, não propriedades herdadas', () => {
    expect(bridgeTable('raw_listings')).toBe(true);
    expect(bridgeTable('user_roles')).toBe(false);
    expect(bridgeTable('__proto__')).toBe(false);
  });
  it('preserva coletas válidas e rejeita id e campos desconhecidos', () => {
    expect(validateRows('bairro_airbnb_sp', [bairro])).toEqual([bairro]);
    expect(validateRows('raw_listings', [listing])).toEqual([listing]);
    expect(() => validateRows('bairro_airbnb_sp', [{ ...bairro, id: 123 }])).toThrow();
    expect(() => validateRows('raw_listings', [{ ...listing, role: 'admin' }])).toThrow();
  });
  it('recusa campos faltantes, strings numéricas, valores negativos e ocupação inválida', () => {
    expect(() => validateRows('raw_listings', [{}])).toThrow();
    expect(() => validateRows('raw_listings', [{ ...listing, preco_noite_atual: '100' }])).toThrow();
    expect(() => validateRows('raw_listings', [{ ...listing, preco_noite_atual: -1 }])).toThrow();
    expect(() => validateRows('raw_listings', [{ ...listing, ocupacao_estimada: 1.1 }])).toThrow();
  });
  it('recusa datas impossíveis, períodos invertidos e contagens inconsistentes', () => {
    expect(() => validateRows('bairro_airbnb_sp', [{ ...bairro, periodo_inicio: '2026-02-30' }])).toThrow();
    expect(() => validateRows('bairro_airbnb_sp', [{ ...bairro, periodo_inicio: '2026-10-01' }])).toThrow();
    expect(() => validateRows('bairro_airbnb_sp', [{ ...bairro, n_listings_studio_1q: 101 }])).toThrow();
  });
  it('recusa URLs inseguras e limita a quantidade a 1000 linhas', () => {
    expect(() => validateRows('raw_listings', [{ ...listing, url: 'javascript:alert(1)' }])).toThrow();
    expect(() => validateRows('raw_listings', [])).toThrow();
    expect(validateRows('raw_listings', Array(1000).fill(listing))).toHaveLength(1000);
    expect(() => validateRows('raw_listings', Array(1001).fill(listing))).toThrow();
  });
  it('restringe seleção e filtros aos campos conhecidos e limita consultas a 500', () => {
    expect(validateSelect('raw_listings', { columns: 'bairro,fonte', limit: 500, filters: { bairro: 'Mooca' } }).limit).toBe(500);
    expect(() => validateSelect('raw_listings', { columns: 'user_roles(*)' })).toThrow();
    expect(() => validateSelect('raw_listings', { filters: { admin: true } })).toThrow();
    expect(() => validateSelect('raw_listings', { limit: 501 })).toThrow();
  });
});