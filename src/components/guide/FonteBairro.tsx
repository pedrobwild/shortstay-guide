import { avisoAmostra, fonteBairro, getBairroCurado } from "@/data/bairrosCurados";
import FonteLink from "@/components/guide/FonteLink";

export default function FonteBairro({ nome, inverse = false }: { nome: string; inverse?: boolean }) {
  const bairro = getBairroCurado(nome);
  if (!bairro) return null;
  const aviso = avisoAmostra(bairro);
  return <span className={inverse ? "block text-xs text-primary-foreground [&_a]:text-primary-foreground" : "block text-xs"}>
    {bairro.sourceUrl ? <FonteLink fonte={{ title: fonteBairro(bairro), url: bairro.sourceUrl }} /> : <span>{fonteBairro(bairro)}</span>}
    {aviso && <span className="block font-medium">{aviso}</span>}
  </span>;
}
