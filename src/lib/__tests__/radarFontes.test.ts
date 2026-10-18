import { describe, expect, it } from 'vitest';
import { validarValorIndicador } from '@/lib/radarFontes';
describe('edição de observações', () => {
  it('ocupação aceita 100%, mas não 101%', () => { expect(validarValorIndicador('ocupacao_media_pct',100)).toBe(true); expect(validarValorIndicador('ocupacao_media_pct',101)).toBe(false); });
  it('diária média precisa ser maior que zero', () => { expect(validarValorIndicador('adr_medio_brl',300)).toBe(true); expect(validarValorIndicador('adr_medio_brl',0)).toBe(false); });
  it('amostra aceita somente inteiros não negativos', () => { expect(validarValorIndicador('anuncios_ativos',85)).toBe(true); expect(validarValorIndicador('anuncios_ativos',85.5)).toBe(false); expect(validarValorIndicador('anuncios_ativos',-1)).toBe(false); });
});
