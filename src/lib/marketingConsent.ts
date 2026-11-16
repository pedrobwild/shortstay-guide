export const CONSENT_KEY = "radar_bewild_consent_v1";
export const GA_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY || "G-CE7GKKDG4L";
export const PIXEL_ID = "644216424824915";
export type ConsentChoice = "accepted" | "refused";
type Tracker = ((...args: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...args: unknown[]) => void; loaded?: boolean; version?: string; push?: Tracker };
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Tracker; fbq?: Tracker; _fbq?: Tracker; [key: `ga-disable-${string}`]: boolean | undefined; }
}

export function isMeasurementAllowedPath(path: string) {
  return !/^\/(admin|painel|projetos|projeto|area-exclusiva)(\/|$)/.test(path);
}
export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try { const choice = localStorage.getItem(CONSENT_KEY); return choice === "accepted" || choice === "refused" ? choice : null; } catch { return null; }
}
export function canMeasure() {
  return typeof window !== "undefined" && readConsent() === "accepted" && isMeasurementAllowedPath(window.location.pathname);
}
function gtag(..._args: unknown[]) {
  window.dataLayer ??= [];
  // O gtag consome Arguments, não arrays, na fila do Consent Mode.
  // eslint-disable-next-line prefer-rest-params -- formato oficial da fila gtag
  window.dataLayer.push(arguments);
}
const consentState = (value: "denied" | "granted") => ({
  analytics_storage: value, ad_storage: value, ad_user_data: value, ad_personalization: value,
  functionality_storage: value, personalization_storage: value, security_storage: value,
});
let defaultsSet = false;
let initialized = false;
let lastPage = "";
let simulationSent = false;
export function initializeConsentDefaults() {
  if (typeof window === "undefined" || !isMeasurementAllowedPath(window.location.pathname) || defaultsSet) return;
  window.gtag = gtag;
  gtag("consent", "default", consentState("denied"));
  defaultsSet = true;
}
function loadScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script"); script.id = id; script.async = true; script.src = src;
  document.head.appendChild(script);
}
export function syncMeasurement() {
  if (!isMeasurementAllowedPath(window.location.pathname)) {
    window[`ga-disable-${GA_ID}`] = true;
    if (initialized) { gtag("consent", "update", consentState("denied")); window.fbq?.("consent", "revoke"); }
    lastPage = "";
    return;
  }
  initializeConsentDefaults();
  const allowed = canMeasure();
  window[`ga-disable-${GA_ID}`] = !allowed;
  gtag("consent", "update", consentState(allowed ? "granted" : "denied"));
  if (!allowed) { window.fbq?.("consent", "revoke"); lastPage = ""; return; }
  if (!initialized) {
    gtag("set", "developer_id.dZjgwMW", true);
    gtag("js", new Date());
    gtag("set", "linker", { domains: ["radarbewild.com.br", "bewild.com.br"] });
    gtag("config", GA_ID, { send_page_view: false });
    loadScript("radar-ga4", `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
    const pixel: Tracker = (...args) => { if (pixel.callMethod) pixel.callMethod(...args); else pixel.queue?.push(args); };
    pixel.queue = []; pixel.loaded = true; pixel.version = "2.0"; pixel.push = pixel;
    window.fbq = window._fbq = pixel;
    pixel("consent", "grant"); pixel("init", PIXEL_ID);
    loadScript("radar-meta", "https://connect.facebook.net/en_US/fbevents.js");
    initialized = true;
  } else window.fbq?.("consent", "grant");
}
export function saveConsent(choice: ConsentChoice) {
  try { localStorage.setItem(CONSENT_KEY, choice); } catch { return; }
  syncMeasurement();
  window.dispatchEvent(new Event("radar-consent-change"));
}
/**
 * Parâmetros de URL que podem ir para a medição. O link de uma simulação leva valores
 * da pessoa (valor do imóvel, condomínio, IPTU, reforma, aluguel...): nada disso sai
 * do navegador para GA4 ou Meta (auditoria de 16/11/2026, rodada 2).
 */
const PARAMETRO_MEDIVEL = /^(bairro|b|origem|utm_[a-z_]+|gclid|gbraid|wbraid|fbclid)$/;

/** Endereço da página sem os parâmetros que não são da lista permitida. */
export function urlParaMedicao(loc: { origin: string; pathname: string; search: string; hash: string }): { path: string; location: string; removeuValores: boolean } {
  const entrada = new URLSearchParams(loc.search);
  const saida = new URLSearchParams();
  let removeuValores = false;
  for (const [chave, valor] of entrada) {
    if (PARAMETRO_MEDIVEL.test(chave)) saida.append(chave, valor); else removeuValores = true;
  }
  const query = saida.toString();
  const path = `${loc.pathname}${query ? `?${query}` : ""}${loc.hash}`;
  return { path, location: `${loc.origin}${path}`, removeuValores };
}

/**
 * O Meta Pixel lê o endereço completo da página por conta própria. Enquanto a URL
 * tiver valores fora da lista permitida, nenhum evento vai para ele.
 */
function pixel(...args: unknown[]) {
  if (urlParaMedicao(window.location).removeuValores) return;
  window.fbq?.(...args);
}

export function trackPageView() {
  if (!canMeasure()) return;
  const { path, location } = urlParaMedicao(window.location);
  if (path === lastPage) return;
  lastPage = path;
  // Vale também para os eventos seguintes da mesma página, que herdam o page_location.
  gtag("set", { page_location: location });
  gtag("event", "page_view", { page_path: path, page_location: location });
  pixel("track", "PageView");
}
export function trackBudgetClick(local: string) {
  if (!canMeasure()) return;
  gtag("event", "click_orcamento", { local });
  pixel("trackCustom", "ClickOrcamento", { local });
}
/** Clique em "Ver imóvel" na página Imóveis; só id, título e bairro, nunca dado pessoal. */
export function trackImovelClick(imovel: { id: string; titulo: string; bairro: string }) {
  if (!canMeasure()) return;
  gtag("event", "ver_imovel", { imovel_id: imovel.id, imovel_titulo: imovel.titulo.slice(0, 100), imovel_bairro: imovel.bairro || "sem bairro" });
}
export function trackSimulationUsed() {
  if (!canMeasure() || simulationSent) return;
  simulationSent = true;
  gtag("event", "simulacao_usada");
}
/** Compartilhamento da simulação (aprovado em 13/10/2026); só após consentimento. */
export function trackSimulationShared(canal: string) {
  if (!canMeasure()) return;
  gtag("event", "simulacao_compartilhada", { canal });
}
