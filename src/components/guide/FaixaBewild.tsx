import { TRUST_SIGNALS_DATA } from "@/data/guide-data";
import { trackGlobal } from "@/hooks/useGuideAnalytics";

const BEWILD_URL = "https://bewild.com.br";

/**
 * Apresentação curta da Bewild logo depois dos dados: quem produz o Radar e as
 * provas oficiais (provasBewild.ts, via TRUST_SIGNALS_DATA). As evidências
 * detalhadas continuam junto do tema (reforma perto do orçamento, case perto da
 * análise); aqui é só o contexto da autoridade. Link simples, sem UTM.
 */
export default function FaixaBewild() {
  return (
    <section aria-labelledby="faixa-bewild-titulo" className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1280px] gap-5 px-5 py-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16 lg:px-10">
        <div className="min-w-0">
          <h2 id="faixa-bewild-titulo" className="font-display text-[22px] font-bold leading-[1.2] text-foreground md:text-[26px]">Inteligência de mercado com experiência prática em studios</h2>
          <p className="mt-2 max-w-[640px] text-[15px] leading-[1.55] text-muted-foreground">
            O Radar é produzido pela Bewild, que projeta, reforma e prepara studios compactos para locação em São Paulo. Os dados vêm de fontes públicas identificadas; a experiência de obra, dos contratos entregues.{" "}
            <a href={BEWILD_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackGlobal("cta_clicked", { cta_id: "faixa_bewild_site", section: "faixa_bewild" })} className="font-semibold text-primary underline underline-offset-4">Conheça a atuação da Bewild</a>
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-foreground-medium">
          {TRUST_SIGNALS_DATA.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <s.icon size={16} className="shrink-0 text-primary" aria-hidden="true" />
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
