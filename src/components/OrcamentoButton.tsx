import { useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight } from "lucide-react";
import { orcamentoUrl, type ContextoOrcamento, type OrcamentoLocal } from "@/lib/orcamento";
import { readConsent, trackBudgetClick } from "@/lib/marketingConsent";
import { formatBRL } from "@/lib/numberFormat";

type Props = Omit<ComponentProps<typeof Button>, "asChild" | "children" | "onClick"> & {
  local: OrcamentoLocal;
  /** Texto do botão; o padrão é o CTA oficial "Peça seu orçamento". */
  rotulo?: string;
  /** Seta de link externo ao lado do texto. */
  icone?: boolean;
  /** Resumo da simulação: abre a confirmação antes de seguir para o canal de orçamento. */
  contexto?: ContextoOrcamento;
};

/**
 * Única entrada de lead do Radar: o pedido de orçamento da Bewild (bewild.com.br/orcamento
 * com UTM do local). O clique só é medido com consentimento (trackBudgetClick). Com
 * `contexto`, um diálogo mostra os dados da simulação antes de sair; eles só seguem no link
 * do pedido quando a pessoa aceitou a medição (marketingConsent).
 */
export default function OrcamentoButton({ local, rotulo = "Peça seu orçamento", icone = true, contexto, ...props }: Props) {
  const [aberto, setAberto] = useState(false);
  const classe = `max-w-full whitespace-normal text-center ${props.className ?? ""}`;
  const conteudo = <>{rotulo}{icone && <ArrowUpRight size={16} className="ml-2 shrink-0" aria-hidden="true" />}</>;

  if (!contexto) {
    return <Button {...props} className={classe} asChild onClick={() => trackBudgetClick(local)}><a href={orcamentoUrl(local)} target="_blank" rel="noopener noreferrer">{conteudo}</a></Button>;
  }

  // Lido a cada render (o diálogo reabre com a escolha atual do banner de cookies).
  const comContexto = readConsent() === "accepted";
  const resumo = [
    { k: "Bairro", v: contexto.bairro ?? "—" },
    { k: "Faixa de área", v: contexto.area ?? "—" },
    { k: "Valor do imóvel", v: contexto.valorImovel ? formatBRL(contexto.valorImovel) : "Não informado" },
    { k: "Resultado líquido simulado", v: contexto.resultadoLiquido !== undefined ? `${formatBRL(contexto.resultadoLiquido)} / 12 meses` : "—" },
  ];

  return (
    <>
      <Button {...props} className={classe} onClick={() => setAberto(true)} aria-haspopup="dialog">{conteudo}</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-[480px] gap-0 p-7 font-body">
          <DialogTitle className="mb-2 pr-6 font-display text-[26px] font-bold leading-[1.2]">Solicitar orçamento de reforma</DialogTitle>
          <DialogDescription className="mb-[18px] text-[15px] leading-normal text-muted-foreground">
            {comContexto
              ? "Você segue para o canal de orçamento da Bewild. Estes dados da simulação vão no link do pedido:"
              : "Você segue para o canal de orçamento da Bewild. Tenha à mão os dados desta simulação para informar no pedido:"}
          </DialogDescription>
          <dl className="mb-5 border-t border-foreground">
            {resumo.map((r) => (
              <div key={r.k} className="flex justify-between gap-4 border-b border-border py-2.5 text-[15px]">
                <dt className="text-muted-foreground">{r.k}</dt>
                <dd className="text-right font-semibold tabular-nums">{r.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mb-5 text-xs text-muted-foreground">
            Simulação é hipótese, não retorno garantido. A Bewild orça a reforma a partir do seu imóvel.
            {!comContexto && " Os dados só vão no link do pedido quando você aceita os cookies de medição."}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="min-h-[44px] text-[15px] font-semibold" onClick={() => setAberto(false)}>Voltar</Button>
            <Button asChild className="min-h-[44px] text-[15px] font-semibold">
              <a href={orcamentoUrl(local, comContexto ? contexto : undefined)} target="_blank" rel="noopener noreferrer" onClick={() => { trackBudgetClick(local); setAberto(false); }}>
                Continuar para o orçamento<ArrowUpRight size={16} className="ml-1 shrink-0" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
