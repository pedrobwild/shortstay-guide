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
export function trackPageView() {
  if (!canMeasure()) return;
  const path = window.location.pathname + window.location.search + window.location.hash;
  if (path === lastPage) return;
  lastPage = path;
  gtag("event", "page_view", { page_path: path, page_location: window.location.href });
  window.fbq?.("track", "PageView");
}
export function trackBudgetClick(local: string) {
  if (!canMeasure()) return;
  gtag("event", "click_orcamento", { local });
  window.fbq?.("trackCustom", "ClickOrcamento", { local });
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
