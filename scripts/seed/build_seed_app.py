#!/usr/bin/env python3
"""
Gera LOVABLE_SEED_APP_DATA.md para as tabelas operacionais do app que vieram
no export bwild_dados_completos mas NAO estao no whitelist do bridge:
  - guide_leads          (sem FK)
  - projects             (FK -> auth.users)
  - ota_calendar_events  (FK -> ota_connections, que NAO veio no export)

Diferente das tabelas de mercado, aqui ha dependencias de FK. O .md gerado
deixa cada pre-requisito explicito e reconstroi ota_connections com premissa
declarada (todas ligadas ao projeto demo), para o usuario ajustar se preciso.

Uso: python3 scripts/seed/build_seed_app.py <dir_csvs> <arquivo_md_saida>
"""
import csv, sys, os

DEMO_PROJECT_ID = "87c629cc-19f3-4341-8ebf-c22f82311ee7"  # "Demo — Studio Pinheiros"


def lit(v):
    if v is None or v == "":
        return "NULL"
    return "'" + v.replace("'", "''") + "'"


def read(path):
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def insert_block(table, rows, conflict_col, update=True):
    if not rows:
        return f"-- (sem linhas para {table})\n"
    cols = list(rows[0].keys())
    out = [f"INSERT INTO public.{table} ({', '.join(cols)}) VALUES"]
    out.append(",\n".join("  (" + ", ".join(lit(r[c]) for c in cols) + ")" for r in rows))
    upd = [c for c in cols if c != conflict_col]
    if update:
        out.append(f"ON CONFLICT ({conflict_col}) DO UPDATE SET")
        out.append("  " + ", ".join(f"{c} = EXCLUDED.{c}" for c in upd) + ";")
    else:
        out.append(f"ON CONFLICT ({conflict_col}) DO NOTHING;")
    return "\n".join(out) + "\n"


def main():
    src, out_md = sys.argv[1], sys.argv[2]
    leads = read(os.path.join(src, "guide_leads.csv"))
    projects = read(os.path.join(src, "projects.csv"))
    events = read(os.path.join(src, "ota_calendar_events.csv"))

    conn_ids = sorted({e["connection_id"] for e in events})
    conn_rows = [{
        "id": cid, "project_id": DEMO_PROJECT_ID, "provider": "airbnb",
        "connection_type": "ical", "external_listing_id": f"reconstruido-{cid[:8]}",
        "ical_url": "", "status": "active",
    } for cid in conn_ids]
    user_ids = sorted({p["user_id"] for p in projects})

    md = f"""# Carga de dados do app — `guide_leads`, `projects`, `ota_calendar_events`

> **Como usar no Lovable:** cole este arquivo inteiro no chat do Lovable e peça
> *"rode esta migration SQL no meu Supabase exatamente como está"*. Todo o SQL é
> **idempotente** (`ON CONFLICT`). Dados originados do export `bwild_dados_completos`.

## ⚠️ Leia antes de rodar — dependências de chave estrangeira

Diferente das tabelas de mercado, estas têm FK e **não rodam em qualquer ordem**:

1. **`projects.user_id` → `auth.users(id)`** — as 3 linhas pertencem ao usuário
   `{user_ids[0]}`. Esse usuário **precisa existir** no `auth.users` do banco de
   destino, senão o INSERT falha. Se for o seu próprio login no app, ele já existe;
   num banco novo, crie/convide o usuário antes (Auth → Users) e, se o UUID for
   outro, troque o `user_id` abaixo.
2. **`ota_calendar_events.connection_id` → `ota_connections(id)`** — os eventos
   apontam para {len(conn_ids)} conexões que **não vieram no export**. A Seção C
   **reconstrói** essas `ota_connections` antes dos eventos. ⚠️ **Premissa:** liguei
   todas ao projeto demo `{DEMO_PROJECT_ID}` ("Demo — Studio Pinheiros") e deixei
   `ical_url` vazio. Ajuste `project_id`/`ical_url` se o mapeamento real for outro.

Ordem de execução: **A → B → C** (a Seção C depende de B e do projeto demo).

---

## Seção A — `guide_leads` ({len(leads)} linha) · sem dependências

```sql
{insert_block("guide_leads", leads, "id")}```

---

## Seção B — `projects` ({len(projects)} linhas) · requer o usuário em `auth.users`

```sql
-- Pré-checagem: confirma que o dono existe (aborta com mensagem clara se não).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '{user_ids[0]}') THEN
    RAISE EXCEPTION 'Usuario % nao existe em auth.users — crie-o antes (Auth > Users) ou troque o user_id.', '{user_ids[0]}';
  END IF;
END $$;

{insert_block("projects", projects, "id")}```

---

## Seção C — `ota_connections` (reconstruído) + `ota_calendar_events` ({len(events)} linhas)

```sql
-- C.1 — ota_connections reconstruídas (NAO vieram no export; premissa: projeto demo)
{insert_block("ota_connections", conn_rows, "id", update=False)}
-- C.2 — ota_calendar_events ({len(events)} linhas). raw_payload fica NULL (nao exportado).
{insert_block("ota_calendar_events", events, "id")}```

---

## Conferência pós-carga

```sql
SELECT 'guide_leads' AS tabela, count(*) FROM public.guide_leads
UNION ALL SELECT 'projects', count(*) FROM public.projects
UNION ALL SELECT 'ota_connections', count(*) FROM public.ota_connections
UNION ALL SELECT 'ota_calendar_events', count(*) FROM public.ota_calendar_events;
```

Esperado desta carga: guide_leads **{len(leads)}**, projects **{len(projects)}**,
ota_connections **{len(conn_rows)}**, ota_calendar_events **{len(events)}**.
"""
    with open(out_md, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"OK -> {out_md}")
    print(f"  guide_leads={len(leads)} projects={len(projects)} "
          f"ota_connections={len(conn_rows)} ota_calendar_events={len(events)}")


if __name__ == "__main__":
    main()
