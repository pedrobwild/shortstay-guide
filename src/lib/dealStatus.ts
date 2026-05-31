/**
 * Deriva o "status da negociação" do cliente a partir dos sinais disponíveis no
 * funil — projeto criado, projeção configurada, valor do imóvel informado,
 * calendário conectado e dados reais sincronizados. Não há um campo de status
 * explícito no banco: a etapa é inferida do progresso real, o que mantém o
 * painel e o próximo passo sempre coerentes com o estado do projeto.
 */

export type DealStage = "projecao" | "valor" | "conexao" | "operando";

export interface DealStep {
  key: string;
  label: string;
  done: boolean;
}

export interface NextStep {
  label: string;
  to: string;
}

export interface DealStatus {
  stage: DealStage;
  /** Rótulo curto exibido como status da negociação. */
  label: string;
  description: string;
  steps: DealStep[];
  progressPct: number;
  nextStep: NextStep;
}

export interface DealInput {
  projectId: string;
  hasNeighborhood: boolean;
  hasPropertyValue: boolean;
  hasConnection: boolean;
  hasRealEvents: boolean;
}

export function deriveDeal(input: DealInput): DealStatus {
  const { projectId, hasNeighborhood, hasPropertyValue, hasConnection, hasRealEvents } = input;
  const to = `/projeto/${projectId}`;

  const steps: DealStep[] = [
    { key: "projecao", label: "Projeção configurada", done: hasNeighborhood },
    { key: "valor", label: "Valor do imóvel informado", done: hasPropertyValue },
    { key: "conexao", label: "Calendário conectado", done: hasConnection },
    { key: "operando", label: "Dados reais em análise", done: hasRealEvents },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((doneCount / steps.length) * 100);

  let stage: DealStage;
  let label: string;
  let description: string;
  let nextStep: NextStep;

  if (!hasNeighborhood) {
    stage = "projecao";
    label = "Projeção em rascunho";
    description = "Escolha o bairro e a faixa de área para ver a projeção do seu studio.";
    nextStep = { label: "Configurar projeção", to };
  } else if (!hasPropertyValue) {
    stage = "valor";
    label = "Projeção pronta";
    description = "Informe o valor do imóvel para liberar ROI, cap rate e payback.";
    nextStep = { label: "Informar valor do imóvel", to };
  } else if (!hasConnection) {
    stage = "conexao";
    label = "Pronto para conectar";
    description = "Conecte o calendário do Airbnb para acompanhar a ocupação real.";
    nextStep = { label: "Conectar calendário", to };
  } else {
    stage = "operando";
    label = hasRealEvents ? "Operando" : "Calendário conectado";
    description = hasRealEvents
      ? "Seu calendário está sincronizado e gerando análises reais."
      : "Aguardando a primeira sincronização de reservas do seu calendário.";
    nextStep = { label: "Ver análises do projeto", to };
  }

  return { stage, label, description, steps, progressPct, nextStep };
}
