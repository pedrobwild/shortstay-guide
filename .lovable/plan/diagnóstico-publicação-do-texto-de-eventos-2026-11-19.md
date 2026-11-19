# Diagnóstico: publicação do texto de eventos

## Situação agora (conferido 18/11/2026, 14:16 UTC)
radarbewild.com.br/conteudos/eventos-que-mais-sobem-diaria-airbnb-sao-paulo já serve a versão nova:
- 11 H2, incluindo "Como o Radar mediu a alta da diária em cada evento?" e "Quanto as noites de evento rendem a mais num studio?"
- "Leitura de 15 min"
- Cabeçalho `cache-control: no-cache, must-revalidate, max-age=0`, então não há cache antigo preso na borda.
- radarbewild.lovable.app serve o mesmo conteúdo; o domínio aponta para a publicação atual.

## Respostas
1. Logs das publicações das 07:31 e 09:50: não tenho acesso ao histórico nem aos logs de build das publicações. Não consigo copiar mensagem de erro nem dizer em qual etapa algo parou.
2. Build: o site no ar contém o texto do PR #87, então a última publicação incluiu o conteúdo e o pré-render rodou com os links de retorno. Nada indica falha em fc58657 (o plugin só atua no servidor de desenvolvimento e na leitura do .md) nem em linksDeRetornoAusentes. Isso é inferência, não leitura de log.
3. Causa provável do HTML antigo visto antes: a publicação leva alguns minutos para terminar, ou foi aceita a partir de um commit anterior a 78fd8a1 (a sincronização da main com o Lovable chegou depois do pedido). Não consegui confirmar qual das duas.

## Correção proposta
Nenhuma alteração de código é necessária. Para próximas vezes:
- Depois de publicar, confira `x-deployment-id` e um trecho novo da página (ex.: "Leitura de 15 min").
- Peça a publicação só depois que o commit aparecer no histórico do Lovable.
