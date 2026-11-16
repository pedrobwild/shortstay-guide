/**
 * Fotos de reformas entregues pela Bewild, usadas como prova visual na home e em /reformar.
 *
 * Origem: portfólio público do site (bewild.com.br/portfolio), só projetos com o status
 * "Obra pronta" e só a foto principal de cada um — nunca render 3D. O Pedro liberou o uso das
 * fotos do portfólio no Radar em 15/11/2026. As imagens continuam hospedadas no armazenamento
 * do site (o Radar não guarda cópia): se a foto sair de lá, troque a entrada aqui.
 *
 * Só o prédio, o bairro e a área, como estão na página pública do projeto: nunca nome de
 * cliente nem número de unidade. Área e bairro conferidos na página do projeto em 15/11/2026.
 */
export interface FotoReforma {
  /** Slug do projeto em bewild.com.br/portfolio/<slug>. */
  slug: string;
  /** Nome do empreendimento, como no portfólio. */
  predio: string;
  bairro: string;
  /** Área em m², como publicada no portfólio. */
  areaM2: number;
  /** Caminho da foto no armazenamento público do site (sem parâmetros de tamanho). */
  caminho: string;
  /** Texto alternativo: o que a foto mostra. */
  alt: string;
}

const BASE = "https://aamlnkmqvjcowixdgqii.supabase.co/storage/v1/render/image/public/project-images/bewild";

export const PORTFOLIO_URL = "https://bewild.com.br/portfolio";

export const FOTOS_REFORMAS: FotoReforma[] = [
  {
    slug: "vc-terrae",
    predio: "Terrae",
    bairro: "Pinheiros",
    areaM2: 24.67,
    caminho: "vc-terrae/1790361282190-1.png",
    alt: "Foto de studio reformado no Terrae, em Pinheiros: entrada com piso amadeirado, cozinha azul à direita, divisória vertical e cama ao fundo.",
  },
  {
    slug: "tb-latitude-campo-belo",
    predio: "Latitude Campo Belo",
    bairro: "Campo Belo",
    areaM2: 27.75,
    caminho: "tb-latitude-campo-belo/1790360638521-1.png",
    alt: "Foto de studio reformado no Latitude Campo Belo: cama em primeiro plano, mesa redonda diante da janela e banco com assento claro ao fundo.",
  },
  {
    slug: "fg",
    predio: "Nurban Vila Madalena",
    bairro: "Vila Madalena",
    areaM2: 26.36,
    caminho: "fg/1790361766300-img-1081.jpg",
    alt: "Foto de studio reformado no Nurban Vila Madalena: cozinha escura, cama à direita, mesa ao fundo e linha de iluminação no teto.",
  },
];

/**
 * URL da foto numa largura (o armazenamento do site redimensiona pela query). `resize=contain`
 * é obrigatório: só com `width`, o serviço mantém a altura original e devolve uma tira central
 * recortada (640 × 2048, conferido em 15/11/2026). As três fotos são verticais (2:3).
 */
export const urlFotoReforma = (f: FotoReforma, largura: number) => `${BASE}/${f.caminho}?width=${largura}&quality=70&resize=contain`;

export const linkProjetoPortfolio = (f: FotoReforma) => `${PORTFOLIO_URL}/${f.slug}`;
