/**
 * "Pular para o conteúdo": primeiro elemento focável da página (o mesmo papel do
 * `.bwa-skip` do bewild.com.br). Invisível até receber foco pelo teclado; leva ao
 * <main id="conteudo" tabIndex={-1}> de cada página pública.
 */
export const ID_CONTEUDO = "conteudo";

export default function SkipLink() {
  return (
    <a
      href={`#${ID_CONTEUDO}`}
      className="sr-only z-[100] rounded-md bg-primary px-4 py-3 font-body text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      Pular para o conteúdo
    </a>
  );
}
