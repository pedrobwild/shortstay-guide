# Comparação de fontes de mercado

## Funções implantadas
- `coletar-airdna`: POST autenticado por administrador. Consulta somente leitura da API Enterprise; não altera observações ou propostas de aprovação.
- `coletar-airbnb`: POST autenticado por administrador. Retorna 501 enquanto não existe integração autorizada de dados de mercado; não é um coletor Airbnb funcional.

Entrada de ambas:
```json
{"bairro":"Pinheiros","periodo_inicio":"2026-01-01","periodo_fim":"2026-09-30"}
```
Somente meses completos e encerrados, bairro cadastrado, no máximo os últimos 60 meses. Campos adicionais são recusados.

## Metodologia
AirDNA: imóvel inteiro, todos os tamanhos; não declarar exclusividade Airbnb. Diária em BRL ponderada pelas noites reservadas, ocupação = noites reservadas / noites disponíveis × 100. Campos ausentes, meses incompletos ou duplicados impedem o cálculo; não converter taxas de unidade desconhecida. A amostra é média mensal de anúncios ativos, não total de anúncios distintos. Comparar diferenças apenas quando os períodos GuestFavorites coincidirem; o recorte das duas fontes ainda precisa ser conferido. Não devolver auditoria privada.

## Verificação em 18/10/2026
12 testes e lint passaram. POST sem autenticação: 401. Com sessão admin: AirDNA retornou erro do provedor 401 invalid_credentials (função retorna 502 com provider_status); Airbnb retornou 501 com indicadores nulos. Nenhuma gravação de mercado realizada.

O formato das séries AirDNA reaproveita o contrato do coletor existente; ainda não foi validado com resposta real bem-sucedida. A documentação pública do provedor bloqueou a consulta automatizada. Próximo passo: substituir a credencial AirDNA por uma credencial Enterprise válida e confirmar o pacote de métricas contratado; depois conferir campos e resultados reais antes de utilizar a comparação.
