import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  loadPendingProvision,
  clearPendingProvision,
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
    (async () => {
      const { projectId } = await provisionProjectForLead(user.id, intent);
      clearPendingProvision();
      if (projectId) {
        navigate(`/projeto/${projectId}`, { replace: true });
      }
    })();
  }, [user, navigate]);

  return null;
}
