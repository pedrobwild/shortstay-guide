# Integração AirDNA (API Enterprise)

**Papel:** cobrir os bairros sem fonte pública — Brooklin, Consolação e Vila Olímpia —, hoje exibidos como estimativa Bewild. Os demais bairros seguem só com GuestFavorites (regra "um bairro, uma fonte, um número").

## Fluxo

1. Admin abre **/admin → Coletas**, bloco "Importar da AirDNA", escolhe bairro e período.
2. A edge function `airdna-importar` (JWT obrigatório + `has_role(admin)`) consulta a AirDNA com o segredo `AIRDNA_API_KEY` e devolve **uma prévia** — não grava nada.
3. O admin confere a área da AirDNA que respondeu (submercado) e os números, e confirma.
4. A gravação usa a mesma RPC auditada das coletas manuais (`admin_registrar_coleta_radar_auditada`): desativa as observações ativas do bairro (a estimativa), insere as novas com `fonte_id = 'airdna'` e registra autor e horário em `radar_coleta_auditoria`.
5. Site e chat leem `radar_bairro_atual` e passam a rotular "AirDNA, período"; o aviso de amostra pequena e de dado desatualizado vale igual à fonte pública.

## Banco

- Migration `20261017030000_airdna_fonte_licenciada.sql` (estrutura): novo tipo de fonte `licenciada`; a view calcula confiança para `publica` e `licenciada` com os mesmos limiares internos; a RPC aceita `airdna` só nos três bairros e com link `airdna.co`.
- **Dado (SQL direto, após aprovação do Pedro):**

```sql
INSERT INTO public.radar_fontes (id, nome, tipo, url, metodologia_declarada, observacao)
VALUES ('airdna', 'AirDNA', 'licenciada', 'https://www.airdna.co', true,
        'API Enterprise (dado licenciado); métricas modeladas pela AirDNA a partir de anúncios públicos; usada só nos bairros sem fonte pública');
```

## Segredo

`AIRDNA_API_KEY` é configurado no Lovable Cloud (Secrets). Nunca vai para o frontend nem para o repositório.

## Licença: conferida em 16/11/2026

Em 16/11/2026 o Pedro conferiu o contrato e confirmou que a licença da AirDNA permite: (1) leitura e processamento dos dados por assistente de IA; (2) guardar as séries no banco do Radar para uso interno; (3) exibir no site os percentuais derivados (efeito de eventos por bairro).

Com isso, a fonte `airdna` foi inserida em `radar_fontes` (tipo `licenciada`) na mesma data. O dado bruto continua restrito: `radar_series_diarias` só é lida por admin; o público só vê linhas de `radar_evento_efeitos` marcadas como publicáveis e de eventos publicados.

Registro anterior (18/10/2026), mantido para referência: os termos gerais da AirDNA (https://www.airdna.co/terms-of-service) limitam o dado a uso interno (§1.3), proíbem distribuir ou divulgar (§1.3(i)), tratam o dado como confidencial (§3.1) e proíbem expor o conteúdo a sistemas de IA (§1.3(x) e §5.4). O que vale para o Radar é o contrato conferido pelo Pedro; se o contrato mudar, esta seção precisa ser revista antes de nova leitura.

## O que está no banco desde 16/11/2026

- `radar_series_diarias`: diária por dia (01/12/2025 a 14/11/2026) e reservas futuras (até 30/04/2027), por bairro, nos recortes `todos` e `ate_1_quarto`; leitura de 16/11/2026, feita pela tela da AirDNA.
- `radar_eventos` e `radar_evento_efeitos`: calendário e efeito medido na diária. Método em `docs/estudo-eventos-2026-11-16.md`.
- A migration `20261017030000_airdna_fonte_licenciada.sql` **não foi aplicada inteira**: ela redefine a view `radar_bairro_atual` e a função de coleta, que mudaram depois. Só a regra de tipo foi aplicada (`20261116100000_radar_fontes_tipo_licenciada.sql`). O uso da AirDNA para diária e ocupação de Brooklin e Vila Olímpia continua pendente e precisa de migration nova, escrita sobre a view e a função atuais.

## Pontos da API a confirmar no primeiro teste com o token

- Caminho de métricas de **submercado**: a função usa `/market/{id}/metrics/*` com o id do submercado; a doc lista endpoints próprios de submercado sem expor o caminho no texto.
- `currency: "brl"` aceito (doc só cita ISO 4217 com exemplos usd/eur).
- A API não aceita data inicial: pede 12–60 meses e o período é filtrado por mês na função.
- Percentis (quartis de diária) existem como parâmetro, mas o formato da resposta não está documentado — por isso a prévia não traz quartis.

## Pendências conhecidas

- Telas que ainda leem a reserva offline (`getBairroCurado`) — mapa de bairros, ranking e detalhe da inteligência — continuam mostrando a estimativa até migrarem para `useBairroData`/`radar_bairro_atual`. Isso já acontece hoje com novas coletas GuestFavorites.
