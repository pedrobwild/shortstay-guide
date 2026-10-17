import { lazy, type ComponentType } from "react";
import { precarregarTendencias } from "@/components/guide/tendenciasCarga";

/**
 * Componente da rota "/" (home).
 * A home é pré-renderizada e hidratada. Se o arquivo da página ainda estiver
 * carregando durante a hidratação, qualquer atualização vinda de cima (login,
 * consulta de dados) cai numa parte ainda não hidratada e o React descarta o
 * HTML pronto (erro #421). Por isso main.tsx chama precarregarHome() antes de
 * hidratar: a rota passa a usar o módulo já carregado, sem suspender.
 * Nas demais entradas (navegação no app, SSR) continua carregando sob demanda.
 */
const carregar = () => import("./pages/Index");
let componente: ComponentType = lazy(carregar);

export const rotaHome = () => componente;

export async function precarregarHome() {
  // A página e a seção sob demanda dentro dela (Tendências) chegam juntas antes de hidratar.
  const [pagina] = await Promise.all([carregar(), precarregarTendencias()]);
  componente = pagina.default;
}
