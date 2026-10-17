import { type AuditoriaColeta, rotuloUtms } from "@/lib/coletaAuditoria";

export default function ColetaAuditoria({ auditoria }: { auditoria: AuditoriaColeta | null }) {
  if (!auditoria) return <p className="text-xs text-muted-foreground">Autoria e horário de registro não disponíveis para esta coleta.</p>;
  const horario = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(auditoria.registrado_em));
  return <div className="space-y-1 text-xs text-muted-foreground">
    <p>Registrada por <span className="font-semibold text-foreground">{auditoria.autor_nome}</span> · {horario} (Brasília)</p>
    <p className="break-all">{rotuloUtms(auditoria.utms)}</p>
  </div>;
}