import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Protege as regras da migration das séries diárias e dos eventos (16/11/2026):
 * GRANT → RLS → policy em cada tabela, dado licenciado bruto fora do público e
 * efeito por evento só visível quando marcado como publicável.
 */
const sql = readFileSync("supabase/migrations/20261116090000_radar_series_diarias_e_eventos.sql", "utf8");
const semComentarios = sql.replace(/--.*$/gm, "");
const TABELAS = ["radar_series_diarias", "radar_eventos", "radar_evento_efeitos"] as const;

describe("migration das séries diárias e dos eventos", () => {
  it.each(TABELAS)("%s: GRANT vem antes do RLS, que vem antes das policies", (tabela) => {
    const criar = semComentarios.indexOf(`CREATE TABLE IF NOT EXISTS public.${tabela} `);
    const grant = semComentarios.indexOf(`GRANT ALL ON public.${tabela} TO service_role`);
    const rls = semComentarios.indexOf(`ALTER TABLE public.${tabela} ENABLE ROW LEVEL SECURITY`);
    const policy = semComentarios.search(new RegExp(`CREATE POLICY "[^"]+" ON public\\.${tabela}\\s`));
    expect(criar).toBeGreaterThan(-1);
    expect(grant).toBeGreaterThan(criar);
    expect(rls).toBeGreaterThan(grant);
    expect(policy).toBeGreaterThan(rls);
  });

  it("a série diária (dado licenciado bruto) não tem acesso anônimo nem policy pública", () => {
    expect(semComentarios).not.toMatch(/GRANT[^;]*ON public\.radar_series_diarias TO anon/);
    const policies = [...semComentarios.matchAll(/CREATE POLICY "radar_series_diarias_[^"]+" ON public\.radar_series_diarias\s+FOR \w+ TO ([^\n]+)/g)];
    expect(policies.length).toBeGreaterThan(0);
    for (const p of policies) expect(p[1].trim()).toBe("authenticated");
    expect(semComentarios).toMatch(/radar_series_diarias_admin_select[\s\S]*?has_role\(auth\.uid\(\), 'admin'\)/);
  });

  it("o efeito por evento só fica público quando publicável e com o evento publicado", () => {
    expect(semComentarios).toMatch(/publicavel boolean NOT NULL DEFAULT false/);
    expect(semComentarios).toMatch(/radar_evento_efeitos_publicaveis[\s\S]*?USING \(\s*publicavel\s+AND EXISTS[\s\S]*?e\.status = 'publicado'/);
  });

  it("evento com data confirmada ou publicado exige fonte com link e dia da consulta", () => {
    expect(semComentarios).toMatch(/radar_eventos_confirmado_com_fonte[\s\S]*?fonte_url IS NOT NULL AND fonte_consultada_em IS NOT NULL/);
  });

  it("não usa now() em CHECK e fixa o search_path da função", () => {
    const checks = [...semComentarios.matchAll(/CHECK \(([^;]*?)\)[,\n]/g)].map((m) => m[1]);
    for (const c of checks) expect(c).not.toMatch(/now\(\)|CURRENT_DATE/i);
    expect(semComentarios).toMatch(/FUNCTION public\.atualizar_radar_evento\(\)[\s\S]*?SET search_path = public/);
  });

  it("só estrutura: nenhuma linha de dado entra pela migration", () => {
    expect(semComentarios).not.toMatch(/\b(INSERT INTO|UPDATE public|DELETE FROM)\b/i);
  });
});
