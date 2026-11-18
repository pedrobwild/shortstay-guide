import type { ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { TEXTO_NOVA_ABA } from "@/components/NovaAba";

/**
 * Corpo do texto em Markdown (artigos, releases e estudos). HTML cru não é interpretado
 * (o react-markdown o trata como texto) e só passam links http(s), mailto e caminhos do
 * próprio Radar. Os títulos descem um nível: o H1 da página é o título do texto.
 * Componente puro: o mesmo HTML sai no app e na pré-renderização do build.
 * Markdown do GitHub (remark-gfm, decisão do Pedro de 18/11/2026): tabelas, notas de rodapé
 * (para fontes), riscado e links soltos. Tabela leva título: o parágrafo "Tabela: …" logo
 * antes dela vira o título ligado à tabela (legendaDeTabela). Regras de tabela em conteudosEscrita.ts.
 * Imagem sozinha no parágrafo vira figura, com a legenda "Figura: …" logo depois (figuraDeImagem).
 */
const ehExterno = (href: string) => /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?radarbewild\.com\.br(\/|$)/i.test(href);

/** Só http(s), mailto e caminhos internos; o resto (javascript:, data: etc.) vira texto sem link. */
export function urlSegura(url: string): string {
  const limpa = defaultUrlTransform(url);
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(limpa) ? limpa : "";
}

/** Atributos que as notas de rodapé usam para ligar chamada e nota (ida e volta, leitor de tela). */
type AtributosNota = { id?: string; "aria-label"?: string; "aria-describedby"?: string };

function Link({ href, children, nota }: { href?: string; children?: ReactNode; nota?: AtributosNota }) {
  if (!href) return <span>{children}</span>;
  if (!ehExterno(href)) return <a href={href} className="e-link" {...nota}>{children}</a>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="e-link">
      {children}
      <span className="sr-only">{TEXTO_NOVA_ABA}</span>
    </a>
  );
}

const COMPONENTES: Components = {
  h1: ({ children }) => <h2 className="e-h2 mt-12 max-w-[720px] scroll-mt-20 text-balance lg:mt-14">{children}</h2>,
  h2: ({ children, id }) => id === "footnote-label"
    ? <h2 id={id} className="e-h3 max-w-[720px]">{children}</h2>
    : <h2 className="e-h2 mt-12 max-w-[720px] scroll-mt-20 text-balance lg:mt-14">{children}</h2>,
  h3: ({ children }) => <h3 className="e-h3 mt-8 max-w-[720px] text-balance">{children}</h3>,
  h4: ({ children }) => <h4 className="e-corpo mt-6 max-w-[720px] font-semibold">{children}</h4>,
  p: ({ children, id, ...resto }) => "data-titulo-tabela" in resto
    ? <p id={id} className="e-legenda mt-8 max-w-[720px] font-semibold text-foreground">{children}</p>
    : <p className="e-corpo mt-4 max-w-[720px] text-pretty">{children}</p>,
  ul: ({ children }) => <ul className="e-corpo mt-4 max-w-[720px] list-disc space-y-2 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="e-corpo mt-4 max-w-[720px] list-decimal space-y-2 pl-5">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="my-8 max-w-[720px] border-l-[3px] border-border pl-4 text-tinta-78">{children}</blockquote>,
  a: ({ href, children, id, ...resto }) => (
    <Link href={href} nota={{ id, "aria-label": resto["aria-label"] as string | undefined, "aria-describedby": resto["aria-describedby"] as string | undefined }}>{children}</Link>
  ),
  // Imagem dentro do texto: sempre com descrição; sem ela, não entra. O título da imagem
  // pode trazer as dimensões ("1920x1180") e as da versão de celular ("1920x1180 780x1400");
  // com a segunda, o arquivo "-m" ao lado vale abaixo de 640px (dimensoesDaImagem).
  img: ({ src, alt, title }) => {
    if (!src || !alt) return null;
    const d = dimensoesDaImagem(src, title);
    const img = <img src={src} alt={alt} width={d?.largura} height={d?.altura} loading="lazy" decoding="async" className="h-auto w-full rounded-sm" />;
    return d?.celular
      ? <picture><source media="(max-width: 639px)" srcSet={d.celular.src} width={d.celular.largura} height={d.celular.altura} />{img}</picture>
      : img;
  },
  figure: ({ children }) => <figure className="my-8 max-w-[880px]">{children}</figure>,
  figcaption: ({ children }) => <figcaption className="e-legenda mt-2 max-w-[720px]">{children}</figcaption>,
  hr: () => <hr className="my-10 max-w-[720px] border-border" />,
  table: ({ children, ...resto }) => (
    <div role="region" aria-labelledby={resto["aria-labelledby"] as string | undefined} aria-label={resto["aria-labelledby"] ? undefined : "Tabela"} tabIndex={0} className="mb-6 mt-2 max-w-[880px] overflow-x-auto rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
      <table aria-labelledby={resto["aria-labelledby"] as string | undefined} className="e-apoio w-full border-collapse text-left tabular-nums">{children}</table>
      {/* Aviso visível só no celular, onde a tabela costuma passar da largura da tela. */}
      <p aria-hidden="true" className="e-legenda sticky left-0 mt-2 sm:hidden">Deslize a tabela para o lado para ver todas as colunas.</p>
    </div>
  ),
  caption: ({ children }) => <caption className="e-legenda mb-2 text-left font-semibold text-foreground">{children}</caption>,
  th: ({ children, style }) => <th scope="col" style={style} className="border-b border-foreground/40 px-3 py-2 align-bottom font-semibold text-foreground">{children}</th>,
  td: ({ children, style }) => <td style={style} className="whitespace-nowrap border-b border-border px-3 py-2 align-top">{children}</td>,
  section: ({ children, ...props }) => ("data-footnotes" in props ? <section aria-label="Notas e fontes" className="e-apoio mt-12 max-w-[720px] border-t border-border pt-4">{children}</section> : <section>{children}</section>),
  code: ({ children }) => <code className="rounded-sm bg-muted px-1 py-0.5 text-[0.9em]">{children}</code>,
};

// ---------- Título da tabela ----------
type NoHast = { type: string; tagName?: string; value?: string; children?: NoHast[]; properties?: Record<string, unknown> };
const PREFIXO_TABELA = /^Tabela(\s+\d+)?\s*[:.–-]\s*/;
const textoDe = (n: NoHast): string => n.type === "text" ? n.value ?? "" : (n.children ?? []).map(textoDe).join("");

/**
 * Plugin do rehype: o parágrafo "Tabela: título" (ou "Tabela 1. título") logo antes de uma
 * tabela vira o título dela, sem o prefixo, ligado à tabela por aria-labelledby. O título fica
 * fora do bloco que rola no celular (uma <caption> rolaria junto e seria cortada), e a tabela
 * continua com nome acessível para leitor de tela, buscadores e assistentes de IA.
 */
export function legendaDeTabela() {
  return (arvore: NoHast) => {
    let n = 0;
    const visitar = (pai: NoHast) => {
      const filhos = pai.children ?? [];
      for (let i = 0; i < filhos.length; i++) {
        const no = filhos[i];
        if (no.type !== "element" || no.tagName !== "p" || !PREFIXO_TABELA.test(textoDe(no))) continue;
        let j = i + 1;
        while (j < filhos.length && filhos[j].type === "text" && !(filhos[j].value ?? "").trim()) j++;
        const tabela = filhos[j];
        if (tabela?.type !== "element" || tabela.tagName !== "table") continue;
        const conteudo = [...(no.children ?? [])];
        const primeiro = conteudo[0];
        if (primeiro?.type === "text") conteudo[0] = { ...primeiro, value: (primeiro.value ?? "").replace(PREFIXO_TABELA, "") };
        const id = `tabela-${++n}-titulo`;
        no.children = conteudo;
        no.properties = { ...(no.properties ?? {}), id, dataTituloTabela: "" };
        tabela.properties = { ...(tabela.properties ?? {}), ariaLabelledBy: id };
      }
      filhos.forEach((f) => f.children && visitar(f));
    };
    visitar(arvore);
  };
}

// ---------- Figura ----------
const DIMENSAO = /^(\d{2,5})x(\d{2,5})$/;

/**
 * Dimensões declaradas no título da imagem: "LxA" da versão larga e, opcional, "LxA" da
 * versão de celular, que é o mesmo caminho com "-m" antes da extensão. Sem título válido,
 * a imagem entra sem dimensões (e sem versão de celular).
 */
export function dimensoesDaImagem(src: string, titulo?: string | null) {
  const partes = (titulo ?? "").trim().split(/\s+/).map((p) => p.match(DIMENSAO));
  const [larga, celular] = partes;
  if (!larga || partes.length > 2 || (partes.length === 2 && !celular)) return null;
  const m = celular ? src.match(/^(.+)(\.[a-z0-9]+)$/i) : null;
  return {
    largura: Number(larga[1]), altura: Number(larga[2]),
    celular: celular && m ? { src: `${m[1]}-m${m[2]}`, largura: Number(celular[1]), altura: Number(celular[2]) } : null,
  };
}

const PREFIXO_FIGURA = /^Figura(\s+\d+)?\s*[:.–-]\s*/;
const soImagem = (p: NoHast) => {
  const filhos = (p.children ?? []).filter((f) => !(f.type === "text" && !(f.value ?? "").trim()));
  return filhos.length === 1 && filhos[0].type === "element" && filhos[0].tagName === "img";
};

/**
 * Plugin do rehype: parágrafo só com uma imagem vira <figure>, e o parágrafo "Figura: …" logo
 * depois vira a legenda dela (<figcaption>), sem o prefixo. Evita <figure> dentro de <p>.
 */
export function figuraDeImagem() {
  return (arvore: NoHast) => {
    const visitar = (pai: NoHast) => {
      const filhos = pai.children ?? [];
      for (let i = 0; i < filhos.length; i++) {
        const no = filhos[i];
        if (no.type !== "element" || no.tagName !== "p" || !soImagem(no)) continue;
        no.tagName = "figure";
        let j = i + 1;
        while (j < filhos.length && filhos[j].type === "text" && !(filhos[j].value ?? "").trim()) j++;
        const legenda = filhos[j];
        if (legenda?.type !== "element" || legenda.tagName !== "p" || !PREFIXO_FIGURA.test(textoDe(legenda))) continue;
        const conteudo = [...(legenda.children ?? [])];
        if (conteudo[0]?.type === "text") conteudo[0] = { ...conteudo[0], value: (conteudo[0].value ?? "").replace(PREFIXO_FIGURA, "") };
        no.children = [...(no.children ?? []), { type: "element", tagName: "figcaption", properties: {}, children: conteudo }];
        filhos.splice(i + 1, j - i);
      }
      filhos.forEach((f) => f.children && visitar(f));
    };
    visitar(arvore);
  };
}

/** Rótulos das notas de rodapé em português (o padrão do remark é em inglês). */
const OPCOES_NOTAS = { footnoteLabel: "Notas e fontes", footnoteBackLabel: (n: number) => `Voltar à referência ${n + 1}`, footnoteLabelTagName: "h2" };

export default function CorpoConteudo({ corpo }: { corpo: string }) {
  return (
    <ReactMarkdown components={COMPONENTES} urlTransform={urlSegura} skipHtml
      remarkPlugins={[remarkGfm]} rehypePlugins={[legendaDeTabela, figuraDeImagem]} remarkRehypeOptions={OPCOES_NOTAS}>
      {corpo}
    </ReactMarkdown>
  );
}
