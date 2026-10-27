import { describe, expect, it } from 'vitest';
import { perfilDoMomento } from '@/data/perfisRadar';

describe('destino de quem busca um imóvel para comprar', () => {
  it('abre a página Ferramentas', () => {
    expect(perfilDoMomento('procurando')?.acao.to).toBe('/ferramentas');
  });
});

describe('destinos dedicados por perfil', () => {
  it('reforma abre sua página própria', () => {
    expect(perfilDoMomento('reformar')?.acao.to).toBe('/reformar');
  });
  it('operação abre sua página própria', () => {
    expect(perfilDoMomento('tenho')?.acao.to).toBe('/operar');
  });
});