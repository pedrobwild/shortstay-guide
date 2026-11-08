# Empreendimentos em destaque — carga de 30/10/2026

Catálogo público em `/empreendimentos` (decisão do Pedro, 30/10/2026: banco + admin, só o selo "A Bewild já atua neste prédio", fotos autorizadas enviadas pelo admin). A tabela guarda só dados públicos do prédio: **nada dos projetos da Bewild (quem, qual apartamento, quanto) entra no banco nem neste registro.**

Este repositório é público. O registro completo da conferência (o motivo de cada rascunho) fica no Projeto Radar Bewild, fora do repositório; aqui ficam só o processo e as regras.

## Como os dados foram levantados

- Lista interna dos prédios onde a Bewild atua: 76 empreendimentos distintos.
- Pesquisa na web em 30/10/2026, com bairro, endereço, incorporadora, situação, entrega, unidades e até 6 diferenciais reescritos (sem copiar texto nem imagem). Fonte de cada linha em `fonte_url`: páginas oficiais de incorporadora e portais (apto.vc, MySide, QuintoAndar, Lopes, imprensa). Datas de entrega e metragens divergem entre portais em vários casos; vale a fonte indicada.
- Carga por SQL direto (dados, fora das migrations), com `ON CONFLICT (slug) DO NOTHING`.
- Incorporadora divergente entre portais: o campo fica vazio.

## Situação em 30/10/2026

- **56 publicados em 24 bairros** e **20 em rascunho**, a conferir no `/admin/empreendimentos`.
- Ficam em rascunho até a confirmação do Pedro:
  - prédio que a pesquisa não identificou com segurança (nome que bate com mais de um prédio, bairro desconhecido, uma fonte só ou tipologia que não combina com o que a Bewild faz);
  - prédio com unidades HIS/HMP ou do Minha Casa Minha Vida: em São Paulo, a locação por curta temporada é proibida em unidades HIS e HMP ([SEHAB — fiscalização de anúncios de moradias sociais](https://prefeitura.sp.gov.br/web/habitacao/w/fiscalização-da-sehab-leva-plataformas-digitais-a-remover-anúncios-irregulares-de-moradias-sociais); Decretos 63.130/2024 e 64.244/2025). Um guia de short stay não mostra esses prédios com o selo.

## Regras

- **Publicar exige** link da fonte, data da consulta e bairro confirmado (nunca "A confirmar"). A regra está no formulário (`empreendimentoSchema`) e no banco (CHECK `empreendimentos_publicado_com_fonte`, migration `20261030120000`). Sem fonte, a tela não diz "conforme".
- **Foto** só pelo envio do admin, para o bucket `empreendimentos` (CHECK `empreendimentos_foto_do_bucket`); nunca link externo nem imagem copiada da incorporadora. Foto trocada ou retirada sai do bucket. Sem foto, ilustração neutra.
- Ordem alfabética, sem ranking nem "recomendado"; aviso fixo de que não é recomendação de compra nem anúncio de venda.
- Números do bairro só quando o bairro está na base do Radar (mesmos números de `/bairro/*`, com a natureza do dado e o aviso de amostra). Brooklin e Vila Olímpia aparecem como aproximação pelo distrito Itaim Bibi, nunca como dado próprio. Bairro fora da base não recebe número de bairro vizinho.
- Páginas `/empreendimentos/<slug>` pré-renderizadas no build a partir dos publicados (leitura pública do banco); sem rede no build, o app abre a página normalmente.
