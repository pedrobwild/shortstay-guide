# Publicar um texto no Radar por PR

Todo texto do Radar segue as premissas da skill **ux-writing-blog** (decisão do Pedro em
18/11/2026), pelos dois caminhos de publicação. As regras que dá para conferir no texto estão em
`src/lib/conteudosEscrita.ts` e bloqueiam publicar; as de processo estão no portão abaixo.

Decisão do Pedro em 18/11/2026: além do formulário do admin (`/admin/noticias`), artigos,
releases e estudos podem ser publicados por PR, como arquivo no repositório. Os dois caminhos
geram as mesmas páginas (`/conteudos/<endereço>`), entram no mesmo índice, sitemap, feed RSS e
`llms.txt`, e seguem as mesmas regras.

## Passo a passo

0. Antes de escrever, carregar a skill ux-writing-blog e fechar a tarefa editorial: leitor,
   decisão que ele precisa tomar, pergunta do texto, palavra-chave de foco (a consulta sem
   marca), volume das variantes do termo principal, textos irmãos no Radar e no bewild.com.br
   (para o recorte e os links de ida e volta) e os dois ou três achados que alguém repetiria.
1. Criar `src/content/conteudos/<endereço>.md`. O nome do arquivo é o endereço da página:
   só letras minúsculas sem acento, números e hífens (`radar-abre-dados-28-bairros`).
   Não usar `artigos`, `releases`, `estudos`, `rss`, `pagina` nem `imagens`.
2. Se houver capa, colocar a imagem em `public/conteudos/imagens/<nome>.webp` (JPG, PNG ou
   WebP, 16:9, só imagem que a Bewild tem direito de usar) e preencher `capa` e `capa_alt`.
3. Rodar `npm test`. O teste `conteudosRepositorio.test.ts` recusa cabeçalho incompleto, campo
   desconhecido, capa sem arquivo ou sem descrição e qualquer aviso editorial (marca escrita
   errada, expressão barrada, promessa de resultado, número de mercado sem link de fonte no
   mesmo parágrafo).
4. Abrir o PR contra a `main`. O Pedro revisa e mescla.
5. Publicar o site no Lovable ("Publish"). O texto entra no ar já em HTML estático, no sitemap,
   no feed e no `llms.txt`. Depois, rodar o IndexNow.

## Modelo

```markdown
---
tipo: release
titulo: "Título com o termo principal, até 70 caracteres"
resumo: "Abre com o achado, não com pergunta. Aparece sob o título, na lista e no Google."
palavra_chave: termo da busca sem a marca
publicado_em: 2026-11-18
destino: /ranking
# Opcionais:
# atualizado_em: 2026-11-20
# status: rascunho
# autor: Nome de quem escreveu (sem isso, assina a Bewild)
# capa: /conteudos/imagens/nome-da-imagem.webp
# capa_alt: Descrição da imagem em uma frase
# seo_titulo: Título de busca até 60 caracteres
# seo_descricao: Descrição de busca até 160 caracteres
# canonical_externo: https://bewild.com.br/conteudos/... (só se o mesmo texto já está no site)
---

Um ou dois parágrafos de abertura: a situação do leitor, a resposta (o veredito, em texto de
comparação) e o recorte. Todo número de mercado leva o link da fonte no mesmo parágrafo
([GuestFavorites](https://www.guestfavorites.com/...)).

## Pergunta do leitor nas palavras da busca, com a palavra-chave?

Resposta direta em duas ou três frases, que se sustenta sozinha.

## Subtítulos seguintes como perguntas ou conclusões

Desenvolvimento: condição, efeito e o que muda na escolha. No corpo, o próximo passo leva a
uma tela do Radar ([simule o seu bairro](/projecao)).
```

## Campos

| Campo | Obrigatório | Regra |
|---|---|---|
| `tipo` | sim | `artigo`, `release` ou `estudo` |
| `titulo` | sim | é o H1: até 70 caracteres, com o termo principal |
| `resumo` | sim | 40 a 600 caracteres; abre com o achado, nunca com pergunta |
| `palavra_chave` | sim | a consulta que o leitor faria sem conhecer o Radar (sem marca, salvo em release); precisa aparecer no título de busca, no H1, no primeiro parágrafo e no primeiro `##` (singular e plural valem) |
| `publicado_em` | sim | `AAAA-MM-DD`; é a data mostrada e a do sitemap |
| `destino` | sim | página de dados relacionada: `/ranking`, `/mercado`, `/bairro/<bairro>` ou `/guia/<tema>` |
| `atualizado_em` | não | `AAAA-MM-DD`, igual ou depois de `publicado_em`; trocar só em edição real |
| `status` | não | `publicado` (padrão) ou `rascunho` (fica fora de tudo) |
| `autor`, `capa`, `capa_alt`, `seo_titulo`, `seo_descricao`, `canonical_externo` | não | mesmas regras do formulário do admin |

Valores ocupam uma linha. Aspas em volta são opcionais; use-as quando o valor tiver `:` ou `#`.

## Regras que valem

- O endereço não pode repetir outro texto. Se o mesmo endereço existir no banco, o arquivo do
  repositório prevalece; o formulário do admin não aceita endereço já usado por arquivo.
- Texto do repositório não tem categoria (o filtro por categoria mostra só os do banco).
- Para tirar um texto do ar: `status: rascunho` ou apagar o arquivo, por PR. O endereço some do
  sitemap na publicação seguinte.

## Premissas de escrita conferidas pelo teste (skill ux-writing-blog)

O teste `conteudosEscrita.test.ts` cobre as regras; `conteudosRepositorio.test.ts` aplica todas
a cada arquivo da pasta. O formulário do admin aplica as mesmas, menos a palavra-chave (o banco
não tem esse campo).

- H1 até 70 caracteres; título de busca (`seo_titulo`, ou o título) até 56.
- Resumo abre com o achado, não com pergunta.
- Sem aberturas que anunciam ("No mundo atual", "Neste artigo vamos"…).
- O texto começa por parágrafo de abertura; o primeiro `##` é uma pergunta e é seguido da
  resposta direta em duas ou três frases.
- Nenhum `##` genérico ("Conclusão", "Introdução", "Por onde começar"…).
- O corpo leva a pelo menos uma tela do Radar (bairro, ranking, simulador, comparador…).
- Sem jargão interno ("leads") e sem três parágrafos seguidos abertos por rótulo em negrito.
- Palavra-chave de foco no título de busca, no H1, no primeiro parágrafo e no primeiro `##`.
- E as regras do Radar: marca "Bewild", sem expressões de venda, sem promessa de resultado,
  número de mercado com link de fonte no mesmo parágrafo.

## Portão de publicação (vai preenchido no corpo do PR)

| # | Ponto | Como se confere no Radar |
|---|---|---|
| 1 | Título de busca, H1, palavra-chave, abertura e primeiro H2 com o mesmo termo | teste |
| 2 | H1 até cerca de 70 caracteres | teste |
| 3 | Maioria dos H2 é pergunta ou conclusão nas palavras da busca | teste barra os genéricos; o resto, na revisão |
| 4 | H2 de pergunta com resposta direta antes do contexto | teste |
| 5 | Capa com espaço reservado | template (proporção 16:9 e dimensões declaradas) |
| 6 | "Atualizado em" visível em alteração de dia posterior | template, a partir de `atualizado_em` |
| 7 | CTA para a ferramenta no corpo, além do orçamento | teste exige link para tela do Radar; orçamento e "Dados relacionados" vêm do template |
| 8 | Volume das variantes do termo consultado antes de fechar o H1 | no PR: volumes e fonte, ou "não verificado" |
| 9 | Link de volta conferido no ar (textos irmãos, bewild.com.br) | depois de publicar: conferir e registrar |

Além do portão, quando o texto tem dado próprio: planejar o gráfico e a imagem de
compartilhamento desde o início (a capa é a imagem de compartilhamento da página) e registrar o
que foi avaliado e descartado. Depois de publicar: conferir o HTML do servidor (título,
descrição, H1, H2, dado estruturado, datas, capa), o celular e o desktop; conferir o sitemap;
registrar os números de partida e marcar a releitura para cerca de quatro semanas depois.

Ponto que não deu para verificar vai no PR como "não verificado", nunca como atendido.
