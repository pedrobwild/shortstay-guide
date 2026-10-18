import { supabase } from '@/integrations/supabase/client';
export function validarValorIndicador(k: string, v: number) {
  return Number.isFinite(v) && v >= 0 && (k !== 'adr_medio_brl' || v > 0) && (k !== 'ocupacao_media_pct' || v <= 100) && (k !== 'anuncios_ativos' || Number.isInteger(v));
}
export async function buscarObservacoes(bairro: string, fonte: string, status: string, pagina: number) {
  let q = supabase.from('radar_observacoes').select('*,radar_fontes(nome),radar_observacao_revisoes(registrado_em)', { count: 'exact' }).eq('cidade', 'São Paulo');
  if (bairro !== 'todos') q = q.eq('bairro', bairro);
  if (fonte !== 'todas') q = q.eq('fonte_id', fonte);
  if (status !== 'todos') q = q.eq('ativo', status === 'ativa');
  const { data, error, count } = await q.order('coletado_em', { ascending: false }).order('bairro').order('id').range(pagina * 30, pagina * 30 + 29);
  if (error) throw error;
  return { linhas: data ?? [], total: count ?? 0 };
}
export type ObservacaoFonte = Awaited<ReturnType<typeof buscarObservacoes>>['linhas'][number];
export function versaoObservacao(r: ObservacaoFonte) {
  return r.radar_observacao_revisoes.reduce((v, h) => h.registrado_em > v ? h.registrado_em : v, r.created_at);
}
