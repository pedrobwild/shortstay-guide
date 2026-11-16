# Auditoria contra o guia mestre — rodada 1 (16/11/2026)

Registro das mudanças aprovadas pelo Pedro em 16/11/2026 depois da auditoria de eventos, reforma e contas. O relatório completo está nos documentos do projeto (auditoria-guia-mestre-2026-11-16).

## Banco (SQL direto, aprovado)

Tabela `radar_evento_efeitos`, recorte `ate_1_quarto`:

1. **Sinal mais fraco:** `publicavel = false` em 17 linhas com p entre 1% e 5% que não passam na correção de Benjamini-Hochberg a 5% sobre os 135 testes do recorte, incluídas as 4 do Carnaval. Linhas publicáveis de bairro: de 66 para 49 (38 com p abaixo de 1% e 11 sinais mais fracos).
   - BTS no MorumBIS: Barra Funda, Lapa.
   - Carnaval: Bom Retiro, República, Santa Cecília, Sé.
   - GP São Paulo de F1: Liberdade, Morumbi, Sé.
   - Hospitalar: Bela Vista, Jardim Paulista, Pinheiros, República, Tatuapé.
   - Lollapalooza Brasil: Bela Vista, Jardim Paulista, Moema.
2. **Mediana da cidade:** 5 linhas novas com `bairro = 'São Paulo'`, `p_placebo` nulo e `publicavel = true`, uma por edição de 2026: mediana do efeito entre os 27 bairros lidos. Carnaval 2,7; Lollapalooza 6,0; Hospitalar 6,7; BTS 30,2; GP 17,5.

Nenhum efeito de bairro foi alterado. As linhas retiradas continuam no banco, visíveis ao admin.

## Código

- `eventosRadar.ts`: `BAIRRO_CIDADE`, `efeitoDaCidade`, campo `cidade` em `eventosComReferencia` e `eventosDoBairro`; a linha da cidade nunca entra em lista, filtro ou conta de bairro.
- `/eventos` e seção de eventos da página do bairro: tag "Calculado", mediana da cidade ao lado do efeito, texto de método atualizado.
- `Natureza.tsx` e `/metodologia`: "Observado" explicado como publicado pela fonte para o próprio bairro, não transação verificada.
- Simulador (`/projecao`) e `/resumo`: com nível de decoração acima do básico e diária não ajustada, aparece o resultado também com a média do bairro (`resultadoMediaBairro` no hook, componente `ComparacaoDecoracao`); a tag da diária passa a "Hipótese" nesse caso.

## Mantido por decisão

Referência "no mesmo local" (U2 com BTS, The Town com Lollapalooza) continua abrindo a conta com o acréscimo da referência.
