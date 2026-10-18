/**
 * Aviso de leitor de tela para links que abrem em outra aba, como no bewild.com.br
 * (NEW_TAB_SUFFIX): o texto visível não muda; quem navega por voz ou teclado sabe
 * que vai sair da página.
 */
export const TEXTO_NOVA_ABA = " (abre em nova aba)";

export default function NovaAba() {
  return <span className="sr-only">{TEXTO_NOVA_ABA}</span>;
}
