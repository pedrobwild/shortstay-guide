# Publicar um texto no Radar por PR

Decisão do Pedro em 18/11/2026: além do formulário do admin (`/admin/noticias`), artigos,
releases e estudos podem ser publicados por PR, como arquivo no repositório. Os dois caminhos
geram as mesmas páginas (`/conteudos/<endereço>`), entram no mesmo índice, sitemap, feed RSS e
`llms.txt`, e seguem as mesmas regras.

## Passo a passo

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
titulo: "Título do texto, como aparece na página"
resumo: "Duas frases que aparecem sob o título, na lista e, sem descrição de busca, no Google."
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

## Primeiro subtítulo

Texto em Markdown. Todo número de mercado leva o link da fonte no mesmo parágrafo
([GuestFavorites](https://www.guestfavorites.com/...)).
```

## Campos

| Campo | Obrigatório | Regra |
|---|---|---|
| `tipo` | sim | `artigo`, `release` ou `estudo` |
| `titulo` | sim | 3 a 180 caracteres |
| `resumo` | sim | 40 a 600 caracteres |
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
