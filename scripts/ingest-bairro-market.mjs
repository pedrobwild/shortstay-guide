#!/usr/bin/env node
/**
 * Ingestão de inteligência de mercado Airbnb por bairro → tabela `bairro_airbnb_sp`.
 *
 * Fonte: a skill `airbnb-market-intel-sp` produz um CSV estruturado (1 linha por
 * bairro/período). Este script valida, coage tipos e faz UPSERT idempotente
 * (onConflict em bairro+cidade+período — ver migration da constraint UNIQUE).
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/ingest-bairro-market.mjs <caminho-do-csv> [--dry-run]
 *
 *   npm run ingest:bairro -- ./mercado.csv
 *   npm run ingest:bairro -- ./mercado.csv --dry-run   # valida sem gravar
 *
 * Variáveis de ambiente:
 *   SUPABASE_URL                 URL do projeto (mesmo valor de VITE_SUPABASE_URL).
 *   SUPABASE_SERVICE_ROLE_KEY    Service role key (NUNCA commitar; bypassa RLS).
 *
 * O contrato de colunas do CSV está em scripts/bairro-market-template.csv e
 * documentado em scripts/README-bairro-ingest.md.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const CONFLICT_TARGET = "bairro,cidade,periodo_inicio,periodo_fim";

// Tipo de cada coluna aceita da tabela bairro_airbnb_sp. Colunas fora desta
// lista no CSV são ignoradas (com aviso). `id` e `data_atualizacao` são
// gerenciados pelo banco e ignorados de propósito.
const COLUMN_TYPES = {
  bairro: "text",
  cidade: "text",
  periodo_inicio: "date",
  periodo_fim: "date",
  n_listings_total: "int",
  n_listings_studio_1q: "int",
  pct_studio_1q: "fraction",
  adr_medio_studio: "numeric",
  ocupacao_media_studio: "fraction",
  receita_anual_media_studio: "numeric",
  estadia_media_noites: "numeric",
  porcentagem_reservas_30d_plus: "fraction",
  rating_medio: "numeric",
  percentual_superhost: "fraction",
  media_reviews_por_listing: "numeric",
  pct_politica_flexivel: "fraction",
  pct_politica_moderada: "fraction",
  pct_politica_rigida: "fraction",
  preco_m2_residencial_medio: "numeric",
  aluguel_mensal_long_term_medio: "numeric",
  dias_medio_venda_imovel: "int",
  numero_transacoes_imobiliarias_ano: "int",
  indice_criminalidade: "numeric",
  grau_saturacao_index: "numeric",
  risco_regulatorio: "fraction",
  risco_condominio: "fraction",
  area_media_estudio: "numeric",
  yield_bruto_airbnb: "fraction",
  yield_bruto_long_term: "fraction",
  delta_yield: "fraction",
  score_rentabilidade: "numeric",
  score_liquidez: "numeric",
  score_crescimento_potencial: "numeric",
  nivel_confianca_dados: "text",
  fonte_primaria: "text",
};

// NOT NULL sem default no schema → obrigatórios no CSV.
const REQUIRED = [
  "bairro",
  "periodo_inicio",
  "periodo_fim",
  "n_listings_total",
  "n_listings_studio_1q",
  "pct_studio_1q",
  "nivel_confianca_dados",
];

const VALID_CONFIANCA = new Set(["alta", "media", "média", "baixa"]);

/** Parser CSV mínimo com suporte a aspas, vírgulas e quebras de linha em campos. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  // Normaliza CRLF e remove BOM.
  const s = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  // Último campo/linha (se o arquivo não terminar com \n).
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // Remove linhas totalmente vazias.
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function coerce(column, raw, rowNum, warnings) {
  const type = COLUMN_TYPES[column];
  const v = raw.trim();
  if (v === "") return null; // célula vazia → NULL (validação de obrigatórios é à parte)

  if (type === "text") {
    if (column === "nivel_confianca_dados" && !VALID_CONFIANCA.has(v.toLowerCase())) {
      warnings.push(`linha ${rowNum}: nivel_confianca_dados="${v}" fora de {alta,media,baixa}`);
    }
    return v;
  }
  if (type === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) fail(`linha ${rowNum}: ${column}="${v}" não é uma data ISO (YYYY-MM-DD)`);
    return v;
  }
  const num = Number(v.replace(",", "."));
  if (!Number.isFinite(num)) fail(`linha ${rowNum}: ${column}="${v}" não é numérico`);
  if (type === "int") {
    if (!Number.isInteger(num)) fail(`linha ${rowNum}: ${column}="${v}" deve ser inteiro`);
    return num;
  }
  if (type === "fraction" && num > 1) {
    // O schema usa NUMERIC(5,4) → fração 0–1. Provável percentual: convertemos e avisamos.
    warnings.push(`linha ${rowNum}: ${column}=${num} > 1 — interpretado como percentual e convertido para ${(num / 100).toFixed(4)}`);
    return num / 100;
  }
  return num;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const csvPath = args.find((a) => !a.startsWith("--"));
  if (!csvPath) fail("informe o caminho do CSV. Ex.: node scripts/ingest-bairro-market.mjs ./mercado.csv [--dry-run]");

  let raw;
  try {
    raw = readFileSync(csvPath, "utf8");
  } catch {
    fail(`não foi possível ler o arquivo: ${csvPath}`);
  }

  const rows = parseCsv(raw);
  if (rows.length < 2) fail("CSV precisa de um cabeçalho e ao menos uma linha de dados");

  const header = rows[0].map((h) => h.trim());
  const unknown = header.filter((h) => !(h in COLUMN_TYPES));
  if (unknown.length) console.warn(`⚠ colunas ignoradas (não existem em bairro_airbnb_sp): ${unknown.join(", ")}`);

  const missingRequired = REQUIRED.filter((c) => !header.includes(c));
  if (missingRequired.length) fail(`colunas obrigatórias ausentes no cabeçalho: ${missingRequired.join(", ")}`);

  const warnings = [];
  const records = rows.slice(1).map((cols, idx) => {
    const rowNum = idx + 2; // +1 cabeçalho, +1 base-1
    const rec = {};
    header.forEach((col, i) => {
      if (!(col in COLUMN_TYPES)) return;
      const value = coerce(col, cols[i] ?? "", rowNum, warnings);
      if (value !== null) rec[col] = value;
    });
    for (const req of REQUIRED) {
      if (rec[req] === undefined) fail(`linha ${rowNum}: campo obrigatório "${req}" vazio`);
    }
    rec.data_atualizacao = new Date().toISOString();
    return rec;
  });

  warnings.forEach((w) => console.warn(`⚠ ${w}`));
  console.log(`✓ ${records.length} linha(s) válida(s) para ${[...new Set(records.map((r) => r.bairro))].length} bairro(s).`);

  if (dryRun) {
    console.log("— dry-run: nada gravado. Amostra do primeiro registro:");
    console.log(JSON.stringify(records[0], null, 2));
    return;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) fail("defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente para gravar (ou use --dry-run)");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error, count } = await supabase
    .from("bairro_airbnb_sp")
    .upsert(records, { onConflict: CONFLICT_TARGET, count: "exact" });
  if (error) fail(`falha no upsert: ${error.message}`);

  console.log(`✓ upsert concluído (${count ?? records.length} linha(s)) em bairro_airbnb_sp.`);
}

main().catch((err) => fail(err?.message ?? String(err)));
