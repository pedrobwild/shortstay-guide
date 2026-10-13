import { avisoAmostra, fonteBairro, getBairroCurado } from "@/data/bairrosCurados";
import FonteLink from "@/components/guide/FonteLink";

export default function FonteBairro({ nome }: { nome: string }) {
  const bairro = getBairroCurado(nome);
  if (!bairro) return null;
  const aviso = avisoAmostra(bairro);
  return <span className="block text-xs">
    {bairro.sourceUrl ? <FonteLink fonte={{ title: fonteBairro(bairro), url: bairro.sourceUrl }} /> : <span>{fonteBairro(bairro)}</span>}
    {aviso && <span className="block text-warning">{aviso}</span>}
  </span>;
}
