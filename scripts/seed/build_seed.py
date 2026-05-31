#!/usr/bin/env python3
"""
Converte os CSVs exportados (bwild_dados_completos) nas duas tabelas de
inteligencia de mercado em artefatos prontos para carga:

  1) SQL idempotente (INSERT ... ON CONFLICT DO UPDATE) para o SQL Editor
     do Supabase Studio. Inclui a constraint UNIQUE de bairro_airbnb_sp com
     guarda IF NOT EXISTS, entao roda mesmo que a migration ainda nao tenha
     sido aplicada no banco remoto.

  2) Bodies JSON do claude-bridge ({"op":"insert","table":...,"rows":[...]}),
     ja tipados (numeros como numero, boolean como bool, amenities como array,
     vazio como null) para POST direto no endpoint quando houver rede.

Uso:
  python3 scripts/seed/build_seed.py <dir_com_csvs> <dir_saida>
"""
import csv, json, sys, os

# ---- mapas de tipo por coluna (a partir do schema em supabase/migrations) ----
RAW_INT = {"bedrooms", "beds", "capacidade_hospedes", "min_noites", "max_noites",
           "disponibilidade_30d", "disponibilidade_90d", "disponibilidade_365d", "n_reviews"}
RAW_NUM = {"latitude", "longitude", "bathrooms", "area_m2", "preco_noite_atual",
           "ocupacao_estimada", "receita_anual_estimada", "adr_estimado",
           "estadia_media_noites", "rating_geral"}
RAW_BOOL = {"is_superhost"}
RAW_JSON = {"amenities"}

BAIRRO_INT = {"n_listings_total", "n_listings_studio_1q", "dias_medio_venda_imovel",
              "numero_transacoes_imobiliarias_ano"}
# qualquer coluna nao listada como int/str/date/ts em bairro vira numeric
BAIRRO_STR = {"bairro", "cidade", "nivel_confianca_dados", "fonte_primaria"}
BAIRRO_DATE = {"periodo_inicio", "periodo_fim"}
BAIRRO_TS = {"data_atualizacao"}

RAW_STR = {"listing_id", "url", "titulo", "descricao_resumida", "bairro", "cidade",
           "unit_type", "moeda", "politica_cancelamento", "regras_casa_texto", "fonte"}
RAW_DATE = {"data_primeira_reserva"}
RAW_TS = {"data_coleta"}


def sql_lit(v):
    """Literal SQL: vazio -> NULL; senao string entre aspas (Postgres faz o cast)."""
    if v is None or v == "":
        return "NULL"
    return "'" + v.replace("'", "''") + "'"


def json_val(col, v, table):
    """Converte uma celula CSV para o tipo JSON correto para o bridge."""
    if v is None or v == "":
        return None
    if table == "raw_listings":
        if col in RAW_INT:
            return int(float(v))
        if col in RAW_NUM:
            return float(v)
        if col in RAW_BOOL:
            return v.strip().lower() in ("t", "true", "1", "yes")
        if col in RAW_JSON:
            try:
                return json.loads(v)
            except Exception:
                return v
        return v  # string/date/ts ficam como string
    else:  # bairro_airbnb_sp
        if col in BAIRRO_INT:
            return int(float(v))
        if col in BAIRRO_STR or col in BAIRRO_DATE or col in BAIRRO_TS:
            return v
        return float(v)  # demais sao numeric


def build(table, csv_path, out_dir, drop_cols, conflict_cols):
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    header = [c for c in rows[0].keys() if c not in drop_cols]

    # ---------- SQL ----------
    lines = []
    if table == "bairro_airbnb_sp":
        lines += [
            "-- Garante a chave unica idempotente (no-op se ja existir)",
            "DO $$ BEGIN",
            "  ALTER TABLE public.bairro_airbnb_sp",
            "    ADD CONSTRAINT bairro_airbnb_sp_bairro_periodo_key",
            "    UNIQUE (bairro, cidade, periodo_inicio, periodo_fim);",
            "EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;",
            "",
        ]
    update_cols = [c for c in header if c not in conflict_cols]
    set_clause = ", ".join(f"{c} = EXCLUDED.{c}" for c in update_cols)
    lines.append(f"INSERT INTO public.{table} ({', '.join(header)}) VALUES")
    value_rows = []
    for r in rows:
        vals = ", ".join(sql_lit(r[c]) for c in header)
        value_rows.append(f"  ({vals})")
    lines.append(",\n".join(value_rows))
    lines.append(f"ON CONFLICT ({', '.join(conflict_cols)}) DO UPDATE SET")
    lines.append("  " + set_clause + ";")
    sql_path = os.path.join(out_dir, f"seed_{table}.sql")
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    # ---------- JSON bridge ----------
    payload = {"op": "insert", "table": table,
               "rows": [{c: json_val(c, r[c], table) for c in header} for r in rows]}
    json_path = os.path.join(out_dir, f"bridge_{table}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    return len(rows), sql_path, json_path


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    specs = [
        ("bairro_airbnb_sp", os.path.join(src, "bairro_airbnb_sp.csv"),
         {"id"}, ["bairro", "cidade", "periodo_inicio", "periodo_fim"]),
        ("raw_listings", os.path.join(src, "raw_listings.csv"),
         set(), ["listing_id"]),
    ]
    for table, path, drop, conflict in specs:
        n, sqlp, jsonp = build(table, path, out, drop, conflict)
        print(f"{table}: {n} linhas -> {sqlp} | {jsonp}")


if __name__ == "__main__":
    main()
