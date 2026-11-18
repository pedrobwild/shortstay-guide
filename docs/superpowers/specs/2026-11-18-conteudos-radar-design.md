# Área de conteúdos do Radar — desenho (18/11/2026)

Status: aguardando aprovação do Pedro. Nada construído.

## Intenção

O Radar passa a publicar textos próprios — artigos, releases de imprensa e estudos —
com página por texto, feita para ser encontrada no Google e citada por imprensa e
sistemas de IA. Hoje `/posts` é só uma vitrine de links para `bewild.com.br/conteudos`.

Proposta de linha editorial (chamada minha, o Pedro não respondeu): o Radar publica
conteúdo de dados e imprensa (leituras de mercado, estudos periódicos, releases); os
guias práticos de reforma continuam no site da Bewild. É o que o guia mestre chama de
"guia editorial", "estudo periódico" e "pauta de imprensa" (módulo 07).

## Objetivos

- O time publica sem mexer em código, pelo admin.
- Cada texto publicado tem HTML estático, metadados completos e entra no sitemap.
- Os links para artigos do site Bewild continuam funcionando na mesma lista.
- As regras do Radar (número com fonte, marca, termos proibidos, sem promessa) valem
  para o texto publicado.

## Fora do escopo

Comentários, newsletter, agendamento de publicação, migração dos dois artigos da área
exclusiva, mudanças no site bewild.com.br, editor visual (o corpo é Markdown).

## O que seria um fracasso

- Os dois domínios disputando a mesma busca com o mesmo texto.
- Texto publicado com número sem fonte ou promessa de resultado.
- Rascunho visível para o público ou para o Google.
- Quebrar os links de `/posts` já distribuídos ou o bloco de notícias relacionadas.

## Restrições

- Sem tabela nova: a tabela `radar_noticias` é estendida por migration (só ALTER).
- Sem biblioteca nova: `react-markdown` já está no projeto.
- `types.ts` é gerado; não é editado à mão.
- Publicar o site continua sendo decisão do Pedro.
- Autor: Organização Bewild (nó `#org`) por padrão; nome de pessoa só quando real.

## Caminhos considerados

- **A. Texto no banco, admin publica (escolhido pelo Pedro em 18/11/2026).**
  Reaproveita `radar_noticias`, categorias e o build que já lê publicados do banco.
  Custo: o texto novo só vira HTML estático na publicação seguinte do site.
- B. Texto em arquivos Markdown no repositório. Sempre estático, mas publicar depende
  de PR.
- C. Híbrido. Duas infraestruturas para manter.

## Desenho

### Dados (uma migration, só ALTER em `radar_noticias`)

Colunas novas: `tipo` (`link` padrão | `artigo` | `release` | `estudo`), `slug` (único,
nulo para link), `corpo` (Markdown), `capa_url`, `capa_alt`, `autor_nome`,
`publicado_em`, `seo_titulo`, `seo_descricao`, `canonical_externo`.
`url` passa a aceitar nulo. Regra por CHECK imutável: `link` exige `url`; os outros
tipos exigem `slug` e `corpo`. `publicado_em` é preenchido por trigger na primeira vez
que o status vira `publicado` e não muda depois; `atualizado_em` só muda em edição real.
Antes da migration: conferir a RLS atual da tabela (ela foi criada pelo Lovable e não
está nas migrations do repositório) para garantir que anônimo só lê `publicado`.

### Endereços

- `/conteudos` — índice de tudo, paginado.
- `/conteudos/artigos`, `/conteudos/releases`, `/conteudos/estudos` — índice por tipo;
  só entram no sitemap e no HTML estático quando têm pelo menos um texto.
- `/conteudos/<slug>` — página do texto. Os três nomes de tipo são slugs reservados.
- `/posts` redireciona para `/conteudos` mantendo query e hash.
- Slug: minúsculas, sem acento, hífens; não muda depois de publicado.

### Página do texto

Trilha (Início › Conteúdos › tipo), tipo e data, título, resumo, autor, capa com
dimensões fixas (sem salto de layout), corpo, bloco "Dados relacionados" com link para
o bairro ou tema (`destino`, que já existe), CTA de orçamento com local `conteudos`,
"Leia também" com até três textos do mesmo tipo. Datas visíveis: publicado em e, se
diferente, atualizado em. Markdown sem HTML cru; links externos com `NovaAba`.

### SEO

- HTML estático por texto no build (mesma leitura que os empreendimentos usam).
- `title` com `tituloComMarca`, descrição até 160, canonical, hreflang, robots.
- Open Graph `article` com `published_time`, `modified_time`, imagem e alt.
- JSON-LD: `Article` (artigo e estudo) ou `NewsArticle` (release), com `headline`,
  `datePublished`, `dateModified`, `author`, `publisher` = `#org`, `image`,
  `mainEntityOfPage` e trilha; índices como `CollectionPage` com `ItemList`.
- Sitemap com `lastmod` = `atualizado_em`; feed RSS em `/conteudos/rss.xml`;
  seção "Conteúdos" no `llms.txt`; envio ao IndexNow pelo fluxo que já existe.
- `canonical_externo`: quando o mesmo texto existe no site Bewild, o canonical aponta
  para lá e a página fica fora do sitemap. É a trava contra disputa entre domínios.
- Rascunho e arquivado: fora do build, do sitemap e do feed; a rota responde 404.

### Admin (`/admin/noticias`, renomeada na aba para "Conteúdos")

Mesmo formulário, com seletor de tipo. Para artigo, release e estudo aparecem slug
(sugerido a partir do título), corpo com pré-visualização, capa (envio no padrão do
bucket de empreendimentos), autor, título e descrição de SEO com contador, e canonical
externo. Avisos na tela, que não bloqueiam o salvar como rascunho mas bloqueiam
publicar: marca escrita errada, termo proibido (mesma lista dos testes), promessa de
resultado, número de mercado sem link de fonte no mesmo parágrafo.
Depois de publicar, o admin mostra o estado: "no ar pelo app" ou "também em HTML
estático" (confere se o endereço consta no sitemap publicado).

### Publicação e HTML estático

Um texto publicado abre na hora pelo app, com metadados via `RouteSeo`. O HTML
estático chega na publicação seguinte do site. Não encontrei no repositório um gatilho
de publicação do Lovable; por isso não há botão "publicar no site" nesta rodada.
Correção ao que eu disse antes na conversa.

### Navegação

No menu Guia, "Posts" vira "Conteúdos" e aponta para `/conteudos`. `seoRoutes.json`,
`robots.txt`, a navegação estática do build e os testes de navegação acompanham.

### Regras do repositório que mudam

O `AGENTS.md` registra hoje "o Radar fornece ferramentas, a Bewild fornece análise" e
"sem hospedar artigos". Este desenho reverte as duas regras por decisão do Pedro; o
`AGENTS.md` é atualizado no mesmo PR. Continua valendo: toda página pública nova monta
o `RodapeRadar` com os links de retorno (o build para se faltarem) e a escrita em
`radar_noticias` segue só para admin.

### Testes

Schema e regras por tipo, slug e reservados, JSON-LD por tipo, RSS, páginas geradas
pelo build, redirecionamento de `/posts`, avisos editoriais, texto proibido.

## Chamadas minhas (para o Pedro conferir)

1. Linha editorial: dados e imprensa no Radar, guias de reforma no site.
2. Estender `radar_noticias` em vez de criar tabela.
3. Endereço `/conteudos` e renomear "Posts" para "Conteúdos".
4. Avisos editoriais bloqueiam publicar, não bloqueiam rascunho.
5. Sem botão de publicar o site nesta rodada.

## Fica para quem constrói

Layout fino da página e dos cartões, tamanho de página do índice, texto exato dos
avisos, forma do componente de pré-visualização.
