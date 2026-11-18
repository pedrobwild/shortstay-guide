import type { ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import { TEXTO_NOVA_ABA } from "@/components/NovaAba";

/**
 * Corpo do texto em Markdown (artigos, releases e estudos). HTML cru não é interpretado
 * (o react-markdown o trata como texto) e só passam links http(s), mailto e caminhos do
 * próprio Radar. Os títulos descem um nível: o H1 da página é o título do texto.
 * Componente puro: o mesmo HTML sai no app e na pré-renderização do build.
 * Tabela em Markdown não é interpretada (pede a extensão remark-gfm, que não está no projeto).
 */
const ehExterno = (href: string) => /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?radarbewild\.com\.br(\/|$)/i.test(href);

/** Só http(s), mailto e caminhos internos; o resto (javascript:, data: etc.) vira texto sem link. */
export function urlSegura(url: string): string {
  const limpa = defaultUrlTransform(url);
  return /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(limpa) ? limpa : "";
}

function Link({ href, children }: { href?: string; children?: ReactNode }) {
  if (!href) return <span>{children}</span>;
  if (!ehExterno(href)) return <a href={href} className="e-link">{children}</a>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="e-link">
      {children}
      <span className="sr-only">{TEXTO_NOVA_ABA}</span>
    </a>
  );
}

const COMPONENTES: Components = {
  h1: ({ children }) => <h2 className="e-h2 mt-12 max-w-[720px] scroll-mt-20 text-balance lg:mt-14">{children}</h2>,
  h2: ({ children }) => <h2 className="e-h2 mt-12 max-w-[720px] scroll-mt-20 text-balance lg:mt-14">{children}</h2>,
  h3: ({ children }) => <h3 className="e-h3 mt-8 max-w-[720px] text-balance">{children}</h3>,
  h4: ({ children }) => <h4 className="e-corpo mt-6 max-w-[720px] font-semibold">{children}</h4>,
  p: ({ children }) => <p className="e-corpo mt-4 max-w-[720px] text-pretty">{children}</p>,
  ul: ({ children }) => <ul className="e-corpo mt-4 max-w-[720px] list-disc space-y-2 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="e-corpo mt-4 max-w-[720px] list-decimal space-y-2 pl-5">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="my-8 max-w-[720px] border-l-[3px] border-border pl-4 text-tinta-78">{children}</blockquote>,
  a: ({ href, children }) => <Link href={href}>{children}</Link>,
  // Imagem dentro do texto: sempre com descrição; sem ela, não entra.
  img: ({ src, alt }) => (src && alt ? <img src={src} alt={alt} loading="lazy" decoding="async" className="my-6 h-auto w-full max-w-[880px] rounded-sm" /> : null),
  hr: () => <hr className="my-10 max-w-[720px] border-border" />,
  code: ({ children }) => <code className="rounded-sm bg-muted px-1 py-0.5 text-[0.9em]">{children}</code>,
};

export default function CorpoConteudo({ corpo }: { corpo: string }) {
  return <ReactMarkdown components={COMPONENTES} urlTransform={urlSegura} skipHtml>{corpo}</ReactMarkdown>;
}
