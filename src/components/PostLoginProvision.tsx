import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  loadPendingProvision,
  clearPendingProvision,
  savePendingProvision,
  provisionProjectForLead,
} from "@/lib/leadProvisioning";

/**
 * Conclui o auto-provisionamento quando o usuário chega autenticado e havia uma
 * intenção pendente (caso o signup exija confirmação de email). Garante que o
 * pós-login caia direto na proposta personalizada, não num estado vazio.
 */
export default function PostLoginProvision() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (!user || handled.current) return;
    const intent = loadPendingProvision();
    if (!intent) return;

    handled.current = true;
    // Limpa antes do await: outra aba que receba a sessão (link de confirmação por e-mail) não relê a mesma intenção
    // e não cria projeto em duplicidade. Se o provisionamento falhar, a intenção volta para o próximo login.
    clearPendingProvision();
    (async () => {
      const { projectId } = await provisionProjectForLead(user.id, intent);
      if (projectId) {
        navigate(`/projeto/${projectId}`, { replace: true });
      } else {
        savePendingProvision(intent);
      }
    })();
  }, [user, navigate]);

  return null;
}
