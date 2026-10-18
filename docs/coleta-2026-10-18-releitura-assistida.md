# Releitura assistida de 18/10/2026 — primeira rodada da coleta assistida

Primeira execução da Edge Function `coletar-guestfavorites` a partir de /admin/coletas (sessão admin), em 18/10/2026: 27 páginas lidas (26 bairros com fonte GuestFavorites + São Paulo), 10 propostas, 17 sem mudança, 0 erros. As 10 propostas foram aprovadas pelo Pedro em /admin/coletas ("sim para tudo", 18/10/2026), uma a uma, pela RPC `admin_aprovar_coleta_pendente` → `admin_registrar_coleta_radar` (coletas anteriores desativadas, histórico preservado).

Os 16 bairros carregados em 18/10 (coleta dos novos bairros + correção dos 6 lidos em cache) não mudaram — confirmação de que a correção ao vivo estava certa.

## Valores aprovados (jan–set/2026, coleta 18/10/2026)

| Bairro | Antes (13/10) | Depois (18/10) |
|---|---|---|
| Pinheiros | 62% · R$ 300 · 171/232/301 · 2.424 | **63% · R$ 299** · 171/232/301 · **2.452** |
| Bela Vista | 64% · R$ 237 · 140/198/256 · 1.983 | 64% · R$ 237 · 140/198/256 · **1.991** |
| Itaim Bibi | 59% · R$ 359 · 180/279/404 · 3.884 | **60%** · R$ 359 · 180/279/404 · **3.880** |
| Jardim Paulista | 62% · R$ 319 · 183/251/327 · 3.147 | 62% · R$ 319 · 183/251/327 · **3.168** |
| Liberdade (era jan–jul) | 61% · R$ 230 · 132/195/251 · 553 | 61% · **R$ 229 · 138/196/252 · 556** |
| República (era jan–jul) | 63% · R$ 203 · 117/166/210 · 3.079 | 63% · R$ 203 · **121**/166/210 · **3.120** |
| Vila Mariana | 60% · R$ 226 · 143/194/235 · 2.238 | 60% · R$ 226 · 143/194/235 · **2.272** |
| Mooca | 59% · R$ 241 · 27/195/268 · 85 | **58% · R$ 243** · 27/195/268 · **90** (aviso de amostra pequena continua) |
| Perdizes | 53% · R$ 254 · 174/217/276 · 1.752 | **54%** · R$ 254 · 174/217/276 · **1.803** |
| São Paulo (referência) | 60% · R$ 266 · 34.854 | 60% · **R$ 265 · 35.077** (quartis 138/208/278 só no banco) |

Moema não mudou (segue com a coleta de 13/10/2026). Toda a base passa a cobrir jan–set/2026.

## Consequências aplicadas
- **Aproximação pelo Itaim Bibi** (Brooklin e Vila Olímpia): novas linhas `aproximacao_itaim_bibi` em `radar_observacoes` com coletado_em 18/10/2026 e ocupação 60% (SQL direto, anteriores desativadas), para seguir os números do Itaim Bibi.
- **Reserva offline** (`bairrosCurados.ts`) atualizada com os mesmos números (regra um bairro, um número); `COLETA_GUESTFAVORITES` = 18/10/2026; `SAO_PAULO_REFERENCIA` = 60% / R$ 265 / 35.077.
- **Exemplo de Pinheiros** (calculado da base, premissas padrão do DRE): receita bruta R$ 5.651 → líquido R$ 2.164/mês (antes R$ 5.580 → R$ 2.125).
- **Migration** `20261018070000_radar_observacoes_unica_coletado_em.sql` (aplicada no banco): a chave única de `radar_observacoes` passa a incluir `coletado_em`, pois a fonte revisa números dentro do mesmo rótulo de período — sem isso a primeira aprovação falhava com `duplicate key`.
- Testes que protegem a base aprovada atualizados para os novos valores (391 testes).

## Conta admin
`admin@bewild.com.br` (criada pelo Pedro em 18/10/2026) recebeu o papel `admin` em `user_roles` para operar /admin/coletas; confirmado pelo Pedro ("manter").
