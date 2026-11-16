# Séries diárias, eventos e efeito por bairro — registro de 16/11/2026

Decisões do Pedro em 15 e 16/11/2026:

- As decisões do Radar devem se apoiar em dados e análise estatística; o projeto também é fonte de inteligência.
- A receita por evento usa o acréscimo **observado** na diária por evento e bairro (no lugar de um acréscimo único), e os bairros de influência são os que têm **efeito medido** (no lugar de uma regra de distância).
- As séries diárias ficam guardadas em tabela própria.
- A conferência do contrato da AirDNA sobre exibição pública fica com o Pedro. Até lá, nenhum número da AirDNA aparece no site.

## O que esta migration cria (`20261116090000_radar_series_diarias_e_eventos.sql`)

| Tabela | Conteúdo | Quem lê |
| --- | --- | --- |
| `radar_series_diarias` | diária, reservados e disponíveis por bairro, data, recorte e dia da leitura | só admin |
| `radar_eventos` | calendário com local, datas e fonte | público, só `publicado` |
| `radar_evento_efeitos` | efeito na diária por evento e bairro, com teste de placebo | público só com `publicavel = true` e evento publicado |

Só estrutura. Os dados entram por SQL direto, com aprovação do Pedro.

## Método do efeito

Diária de cada noite do evento ÷ mediana da diária do mesmo dia da semana nas 4 semanas anteriores e 4 posteriores (sem noites de outros eventos nem festas de fim de ano). O efeito do evento é a média das noites. `p_placebo` é a parcela das janelas comuns do bairro com efeito igual ou maior.

## Limites conhecidos

- Uma edição por evento na janela de 12 meses.
- Mede a diária, não a ocupação: a tela da fonte só traz ocupação por mês no passado.
- A série futura muda a cada leitura; por isso `lido_em` faz parte da chave.

## Correções feitas em seguida (16/11/2026)

- `EVENTS` em `src/data/mapaBairrosData.ts`: Lollapalooza 2026 corrigido para 20 a 22/03 (estava 27 a 29/03).
- `public/geo/pois.geojson`: São Paulo Expo reposicionado para a Rodovia dos Imigrantes, km 1,5 (lat −23,6451, lng −46,6301; fonte: tradefairdates.com), bairro de referência Jabaquara.
