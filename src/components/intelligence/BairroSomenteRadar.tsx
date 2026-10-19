import { Link } from "react-router-dom";
import { ROTULO_ESTIMATIVA_MERCADO } from "@/data/bairrosCurados";

/**
 * Bairro que existe na base do Radar (radar_bairro_atual) mas ainda não tem a
 * estimativa de mercado — base 2025 (bairro_airbnb_sp: scores, preço do m², aluguel).
 * A página do bairro mostra só o que a base tem (diária, ocupação, quartis, amostra,
 * fonte, receita de referência, posição, DRE e histórico) e, no lugar dos critérios
 * internos, este aviso. Nada é estimado para preencher o que falta.
 */
export default function BairroSomenteRadar({ nome }: { nome: string }) {
  return (
    <p className="e-apoio max-w-[720px]">
      {nome} ainda não tem a {ROTULO_ESTIMATIVA_MERCADO.toLowerCase()} (scores internos, preço do m², aluguel e liquidez).
      Esta página mostra só o que a base do Radar tem; nenhum número é estimado para preencher o que falta.
      {" "}<Link to="/ranking#criterios-internos" className="e-link">Ver os bairros com critérios internos</Link>
    </p>
  );
}
