import { lazy, type ComponentType } from "react";

/**
 * Seção de Tendências, carregada sob demanda dentro da home.
 * Na hidratação da home pré-renderizada ela precisa já estar carregada: se o
 * arquivo ainda estiver a caminho quando os dados do banco chegam, o React
 * descarta o HTML pronto dessa parte (erro #421). precarregarTendencias() é
 * chamado por precarregarHome() antes de hidratar; fora disso segue sob demanda.
 */
const carregar = () => import("./TendenciasSection");
let componente: ComponentType = lazy(carregar);

export const secaoTendencias = () => componente;

export async function precarregarTendencias() {
  componente = (await carregar()).default;
}
