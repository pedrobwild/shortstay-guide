import { describe, expect, it } from 'vitest';
import { perfilDoMomento } from '@/data/perfisRadar';

describe('destino de quem busca um imóvel para comprar', () => {
  it('abre a página Ferramentas', () => {
    expect(perfilDoMomento('procurando')?.acao.to).toBe('/ferramentas');
  });
});