import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import NovaAba from "@/components/NovaAba";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGlobalSessionId, trackGlobal } from "@/hooks/useGuideAnalytics";
import { lerMomento, type Momento } from "@/lib/momento";
import {
  MATERIAIS,
  TEXTO_CONSENTIMENTO_MATERIAL,
  emailValido,
  enviarMaterial,
  montarPedido,
  registrarPedido,
  type Material,
  type OrigemPedido,
} from "@/lib/pedidosMaterial";
import { cn } from "@/lib/utils";

const POLITICA_URL = "https://bewild.com.br/privacidade";
const POLITICA_TEXTO = "bewild.com.br/privacidade";

type Estado = "inicial" | "enviando" | "sucesso" | "erro";

/**
 * Oferta de material por e-mail (captura leve): e-mail obrigatório, primeiro nome
 * opcional, boletim em caixa separada e desmarcada, consentimento à vista. Sem
 * provedor de e-mail (D3, 27/10/2026), a tela entrega o link do material depois
 * do registro; pedido repetido e sucesso mostram o mesmo texto. A etapa vem do
 * momento salvo, lido depois da montagem. Mede só material, origem e boletim —
 * nunca o e-mail ou o nome.
 */
export default function PedidoMaterial({ material, origem, bairro = null }: { material: Material; origem: OrigemPedido; bairro?: string | null }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [boletim, setBoletim] = useState(false);
  const [estado, setEstado] = useState<Estado>("inicial");
  const [emailInvalido, setEmailInvalido] = useState(false);
  const [etapa, setEtapa] = useState<Momento | null>(null);
  const enviando = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // localStorage só depois da montagem (o HTML pré-renderizado não conhece o navegador).
  useEffect(() => { setEtapa(lerMomento()); }, []);

  const item = MATERIAIS[material];
  const linkMaterial = <Link to={item.caminho} className="e-link">{item.titulo}</Link>;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando.current) return;
    if (!emailValido(email)) {
      setEmailInvalido(true);
      emailRef.current?.focus();
      return;
    }
    setEmailInvalido(false);
    enviando.current = true;
    setEstado("enviando");
    const registro = montarPedido({ email, nome, material, etapa, bairro, boletim, origem }, getGlobalSessionId());
    const resultado = await registrarPedido(registro);
    enviando.current = false;
    if (resultado === "erro") {
      setEstado("erro");
      return;
    }
    if (resultado === "ok") trackGlobal("material_solicitado", { material, origem, boletim });
    void enviarMaterial(registro);
    setEstado("sucesso");
  }

  const [antesPolitica, depoisPolitica] = TEXTO_CONSENTIMENTO_MATERIAL.split(POLITICA_TEXTO);

  return (
    <div className="e-fina max-w-[720px] border-y py-8">
      <h2 id={`${id}-titulo`} className="e-h3 text-balance">Antes de comprar o studio, confira o que pode mudar a conta.</h2>
      <p className="e-apoio mt-2 text-pretty">Receba um checklist para avaliar o prédio, a unidade, os custos e a preparação para alugar.</p>

      {/* Região sempre presente (sem display:none) para o leitor de tela anunciar o resultado. */}
      <div aria-live="polite">
        {estado === "sucesso" && (
          <p className="e-corpo mt-6">Pedido registrado. O checklist está aqui: {linkMaterial}</p>
        )}
        {estado === "erro" && (
          <p className="e-corpo mt-6">Não foi possível registrar agora; o checklist continua disponível em {linkMaterial}.</p>
        )}
      </div>

      {estado !== "sucesso" && (
        <form noValidate onSubmit={(e) => void enviar(e)} aria-labelledby={`${id}-titulo`} className={cn("grid gap-4", estado === "erro" ? "mt-4" : "mt-6")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor={`${id}-email`} className="text-[15px] font-semibold">E-mail</Label>
              <Input
                ref={emailRef}
                id={`${id}-email`}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => { setEmail(ev.target.value); if (emailInvalido) setEmailInvalido(false); }}
                aria-invalid={emailInvalido}
                aria-describedby={emailInvalido ? `${id}-email-erro` : undefined}
                className="min-h-[44px] text-base md:text-base"
              />
              {emailInvalido && <p id={`${id}-email-erro`} className="e-legenda text-destructive">Informe um e-mail válido para receber o checklist.</p>}
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor={`${id}-nome`} className="text-[15px] font-semibold">Primeiro nome <span className="font-normal text-muted-foreground">(opcional)</span></Label>
              <Input
                id={`${id}-nome`}
                type="text"
                autoComplete="given-name"
                maxLength={80}
                value={nome}
                onChange={(ev) => setNome(ev.target.value)}
                className="min-h-[44px] text-base md:text-base"
              />
            </div>
          </div>

          <div className="flex min-h-[44px] items-center gap-3">
            <Checkbox id={`${id}-boletim`} checked={boletim} onCheckedChange={(v) => setBoletim(v === true)} className="h-5 w-5" />
            <Label htmlFor={`${id}-boletim`} className="cursor-pointer py-2 text-[15px] font-normal leading-snug">
              Quero também receber as próximas análises do Radar Bewild.
            </Label>
          </div>

          <div>
            <Button
              type="submit"
              disabled={estado === "enviando"}
              aria-busy={estado === "enviando"}
              className="min-h-[44px] px-5 text-[15px] font-semibold"
            >
              Receber meu checklist
            </Button>
            <p className="e-legenda mt-3">
              {antesPolitica}
              <a href={POLITICA_URL} target="_blank" rel="noopener noreferrer" className="e-link">{POLITICA_TEXTO}<NovaAba /></a>
              {depoisPolitica}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
