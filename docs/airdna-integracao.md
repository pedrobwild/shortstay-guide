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

## ⚠️ Antes de ativar: licença

Os termos gerais da AirDNA (https://www.airdna.co/terms-of-service) limitam o dado a **uso interno** (§1.3), proíbem **distribuir/divulgar** (§1.3(i)), tratam o dado como confidencial (§3.1) e proíbem **expor o conteúdo a sistemas de IA** (§1.3(x) e §5.4). Exibir no site público e passar ao chat do Radar só é possível se o contrato Enterprise disser o contrário — confirmar por escrito com a AirDNA (api@airdna.co) antes de inserir a fonte `airdna`.

## Pontos da API a confirmar no primeiro teste com o token

- Caminho de métricas de **submercado**: a função usa `/market/{id}/metrics/*` com o id do submercado; a doc lista endpoints próprios de submercado sem expor o caminho no texto.
- `currency: "brl"` aceito (doc só cita ISO 4217 com exemplos usd/eur).
- A API não aceita data inicial: pede 12–60 meses e o período é filtrado por mês na função.
- Percentis (quartis de diária) existem como parâmetro, mas o formato da resposta não está documentado — por isso a prévia não traz quartis.

## Pendências conhecidas

- Telas que ainda leem a reserva offline (`getBairroCurado`) — mapa de bairros, ranking e detalhe da inteligência — continuam mostrando a estimativa até migrarem para `useBairroData`/`radar_bairro_atual`. Isso já acontece hoje com novas coletas GuestFavorites.
- Conferir no contrato da AirDNA se a licença permite **exibir publicamente** os números no site.
