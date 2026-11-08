import { supabase } from "@/integrations/supabase/client";
import { carregarAcessos, type EventoAcesso } from "@/lib/analyticsAcessos";
import { SEO_BAIRROS, slugifyBairro } from "@/lib/seo";

export type InteresseBairro = { bairro: string; publicados: number; visitas: number };
type ImovelContagem = { bairro: string; publicado: boolean };

export function resumirInteresseBairros(imoveis: ImovelContagem[], eventos: EventoAcesso[], nomes: readonly string[] = SEO_BAIRROS): InteresseBairro[] {
  const mapa = new Map<string, InteresseBairro>();
  const incluir = (bairro: string) => {
    const nome = bairro.trim() || "Sem bairro informado";
    const chave = slugifyBairro(nome);
    if (!mapa.has(chave)) mapa.set(chave, { bairro: nome, publicados: 0, visitas: 0 });
    return mapa.get(chave);
  };
  nomes.forEach(incluir);
  for (const imovel of imoveis) {
    if (!imovel.publicado) continue;
    const linha = incluir(imovel.bairro);
    if (linha) linha.publicados += 1;
  }
  for (const evento of eventos) {
    if (evento.event_type !== "page_view" || !evento.page) continue;
    const slug = /^\/bairro\/([^/?#]+)\/?$/.exec(evento.page)?.[1];
    if (!slug) continue;
    const linha = mapa.get(slug);
    if (linha) linha.visitas += 1;
  }
  return [...mapa.values()].sort((a, b) => b.visitas - a.visitas || b.publicados - a.publicados || a.bairro.localeCompare(b.bairro, "pt-BR"));
}

export async function carregarInteresseBairros(dias: number) {
  const carregarPublicados = async () => {
    const linhas: ImovelContagem[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from("radar_imoveis").select("bairro,publicado")
        .eq("publicado", true).order("id").range(offset, offset + 999);
      if (error) throw error;
      linhas.push(...(data ?? []));
      if ((data?.length ?? 0) < 1000) return linhas;
    }
  };
  const [imoveis, eventos] = await Promise.all([carregarPublicados(), carregarAcessos(dias)]);
  return resumirInteresseBairros(imoveis, eventos);
}