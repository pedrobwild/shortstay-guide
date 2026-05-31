# Carga de dados do app — `guide_leads`, `projects`, `ota_calendar_events`

> **Como usar no Lovable:** cole este arquivo inteiro no chat do Lovable e peça
> *"rode esta migration SQL no meu Supabase exatamente como está"*. Todo o SQL é
> **idempotente** (`ON CONFLICT`). Dados originados do export `bwild_dados_completos`.

## ⚠️ Leia antes de rodar — dependências de chave estrangeira

Diferente das tabelas de mercado, estas têm FK e **não rodam em qualquer ordem**:

1. **`projects.user_id` → `auth.users(id)`** — as 3 linhas pertencem ao usuário
   `637e48cf-8d95-4363-9ff8-4b7662c3932b`. Esse usuário **precisa existir** no `auth.users` do banco de
   destino, senão o INSERT falha. Se for o seu próprio login no app, ele já existe;
   num banco novo, crie/convide o usuário antes (Auth → Users) e, se o UUID for
   outro, troque o `user_id` abaixo.
2. **`ota_calendar_events.connection_id` → `ota_connections(id)`** — os eventos
   apontam para 3 conexões que **não vieram no export**. A Seção C
   **reconstrói** essas `ota_connections` antes dos eventos. ⚠️ **Premissa:** liguei
   todas ao projeto demo `87c629cc-19f3-4341-8ebf-c22f82311ee7` ("Demo — Studio Pinheiros") e deixei
   `ical_url` vazio. Ajuste `project_id`/`ical_url` se o mapeamento real for outro.

Ordem de execução: **A → B → C** (a Seção C depende de B e do projeto demo).

---

## Seção A — `guide_leads` (1 linha) · sem dependências

```sql
INSERT INTO public.guide_leads (id, name, whatsapp, neighborhood, objective, area_sqm, source, created_at) VALUES
  ('4ed835e5-ae36-4775-9d1e-25d4271ad412', 'Matheus', '21989362122', 'Brooklin', 'decorar', '36-50', 'guide_cta_final', '2026-03-10 23:31:59.743762+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, whatsapp = EXCLUDED.whatsapp, neighborhood = EXCLUDED.neighborhood, objective = EXCLUDED.objective, area_sqm = EXCLUDED.area_sqm, source = EXCLUDED.source, created_at = EXCLUDED.created_at;
```

---

## Seção B — `projects` (3 linhas) · requer o usuário em `auth.users`

```sql
-- Pré-checagem: confirma que o dono existe (aborta com mensagem clara se não).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '637e48cf-8d95-4363-9ff8-4b7662c3932b') THEN
    RAISE EXCEPTION 'Usuario % nao existe em auth.users — crie-o antes (Auth > Users) ou troque o user_id.', '637e48cf-8d95-4363-9ff8-4b7662c3932b';
  END IF;
END $$;

INSERT INTO public.projects (id, user_id, name, created_at) VALUES
  ('80cae7fd-d5a9-4052-9541-be674c30242d', '637e48cf-8d95-4363-9ff8-4b7662c3932b', 'Studio Pinheiros 101', '2026-03-12 09:10:11.500233+00'),
  ('d87a5911-5859-4e95-8216-3674ec10c38e', '637e48cf-8d95-4363-9ff8-4b7662c3932b', 'Vivian', '2026-04-14 16:57:37.513601+00'),
  ('87c629cc-19f3-4341-8ebf-c22f82311ee7', '637e48cf-8d95-4363-9ff8-4b7662c3932b', 'Demo — Studio Pinheiros', '2026-04-18 17:27:46.593112+00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id, name = EXCLUDED.name, created_at = EXCLUDED.created_at;
```

---

## Seção C — `ota_connections` (reconstruído) + `ota_calendar_events` (196 linhas)

```sql
-- C.1 — ota_connections reconstruídas (NAO vieram no export; premissa: projeto demo)
INSERT INTO public.ota_connections (id, project_id, provider, connection_type, external_listing_id, ical_url, status) VALUES
  ('1cd22275-2b60-4b63-a525-f8cee25db6a7', '87c629cc-19f3-4341-8ebf-c22f82311ee7', 'airbnb', 'ical', 'reconstruido-1cd22275', NULL, 'active'),
  ('4047fe21-99df-499c-8503-12beaafdf2fe', '87c629cc-19f3-4341-8ebf-c22f82311ee7', 'airbnb', 'ical', 'reconstruido-4047fe21', NULL, 'active'),
  ('98cfaba7-6530-4191-be59-9fa094552bbf', '87c629cc-19f3-4341-8ebf-c22f82311ee7', 'airbnb', 'ical', 'reconstruido-98cfaba7', NULL, 'active')
ON CONFLICT (id) DO NOTHING;

-- C.2 — ota_calendar_events (196 linhas). raw_payload fica NULL (nao exportado).
INSERT INTO public.ota_calendar_events (id, connection_id, external_event_uid, start_date, end_date, summary, synced_at) VALUES
  ('650e7d56-1452-4d0f-8488-52a91aa44f9e', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0093', '2026-10-12', '2026-10-16', 'Reserved — Julia', '2026-05-08 00:37:35.099+00'),
  ('79dac61e-59c7-482e-97ff-0d4b1a36ff00', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0096', '2026-10-28', '2026-11-03', 'Reserved — Lucas', '2026-05-08 00:37:35.099+00'),
  ('8d683798-b621-4fa3-a58b-f1de14b2cef4', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0092', '2026-10-05', '2026-10-10', 'Reserved — Eduardo', '2026-05-08 00:37:35.099+00'),
  ('761ce2af-4693-4d70-9cc0-81381a83ff16', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0095', '2026-10-22', '2026-10-27', 'Reserved — Gabriel', '2026-05-08 00:37:35.099+00'),
  ('2b7c4f97-401a-4f52-b291-93f635a8b4fb', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0001', '2025-05-11', '2025-05-12', 'Reserved — Camila', '2026-05-08 00:37:35.099+00'),
  ('5d8a798c-6888-4818-b4ce-6393fc50e960', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0002', '2025-05-12', '2025-05-26', 'Reserved — Thiago', '2026-05-08 00:37:35.099+00'),
  ('ac091c10-dd7b-42ab-b9ee-23899c358227', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0003', '2025-05-26', '2025-05-29', 'Reserved — Bruno', '2026-05-08 00:37:35.099+00'),
  ('6923de8d-0f93-413d-9369-4f5d0a99dda0', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0004', '2025-05-29', '2025-05-30', 'Reserved — Camila', '2026-05-08 00:37:35.099+00'),
  ('034dda19-f2b3-47a9-ba08-97c8d10e492c', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0005', '2025-05-30', '2025-06-02', 'Reserved — Raquel', '2026-05-08 00:37:35.099+00'),
  ('1d5a479f-8e81-4d0b-97bd-1484ff2b10e9', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0006', '2025-06-03', '2025-06-10', 'Reserved — Igor', '2026-05-08 00:37:35.099+00'),
  ('2a6320ed-be2f-4fe0-99db-91c965ac7216', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0007', '2025-06-13', '2025-06-15', 'Reserved — Igor', '2026-05-08 00:37:35.099+00'),
  ('7b8b43b5-9ea7-4eed-a001-edde35c49186', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0008', '2025-06-18', '2025-06-22', 'Reserved — Arthur', '2026-05-08 00:37:35.099+00'),
  ('bae6902f-59ef-49f5-84a2-a4fac2c16da2', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0009', '2025-06-22', '2025-06-26', 'Reserved — Fernanda', '2026-05-08 00:37:35.099+00'),
  ('35289220-9873-4767-a933-8015ae8b00d3', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0010', '2025-06-27', '2025-07-04', 'Reserved — Bruno', '2026-05-08 00:37:35.099+00'),
  ('3f6c5750-1412-4a37-b693-40e89b13212d', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0011', '2025-07-04', '2025-07-07', 'Reserved — Diana', '2026-05-08 00:37:35.099+00'),
  ('1721a86c-0a6a-486a-8e86-2b44e02da5b0', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0012', '2025-07-08', '2025-07-13', 'Reserved — Nicolas', '2026-05-08 00:37:35.099+00'),
  ('eeaac5e9-ba61-4f59-8c58-ed56f14a4df2', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0013', '2025-07-14', '2025-07-16', 'Reserved — Bruno', '2026-05-08 00:37:35.099+00'),
  ('f65805c7-43a0-4f87-9e00-2058c6b6c454', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0014', '2025-07-16', '2025-07-18', 'Reserved — Mariana', '2026-05-08 00:37:35.099+00'),
  ('c6be7e72-2031-4343-98f6-a091959d5abf', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0015', '2025-07-20', '2025-07-23', 'Reserved — Camila', '2026-05-08 00:37:35.099+00'),
  ('462aaba4-60ce-498b-99a5-a1662fb104ab', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0016', '2025-07-25', '2025-07-28', 'Reserved — Arthur', '2026-05-08 00:37:35.099+00'),
  ('4c2562d3-f2c2-4ed4-b2e4-0fbdf1422a00', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0017', '2025-07-28', '2025-08-02', 'Reserved — Gabriel', '2026-05-08 00:37:35.099+00'),
  ('29486898-2a29-4964-96d3-47e08932221a', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0018', '2025-08-05', '2025-08-07', 'Reserved — Pedro', '2026-05-08 00:37:35.099+00'),
  ('20045395-f39d-4b54-82bd-10dd8de34440', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0019', '2025-08-09', '2025-08-12', 'Reserved — Vitor', '2026-05-08 00:37:35.099+00'),
  ('82b7a978-06de-418f-a041-0bd734eab775', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0020', '2025-08-12', '2025-08-19', 'Reserved — Bruno', '2026-05-08 00:37:35.099+00'),
  ('19352336-d9c5-4b2a-9bcc-34bd5d829928', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0021', '2025-08-20', '2025-08-23', 'Reserved — Ana', '2026-05-08 00:37:35.099+00'),
  ('f5a9fdbe-e789-427b-aa6a-4e101b62a344', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0022', '2025-08-24', '2025-08-29', 'Reserved — Igor', '2026-05-08 00:37:35.099+00'),
  ('9bf397ee-e911-49bb-bdf6-47f37ab43229', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0023', '2025-08-30', '2025-09-20', 'Reserved — Daniel', '2026-05-08 00:37:35.099+00'),
  ('4282d7b0-2a4c-4c42-8c19-1fc62c080fe3', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0024', '2025-09-21', '2025-09-24', 'Reserved — Vitor', '2026-05-08 00:37:35.099+00'),
  ('cf8b9f67-d3f8-432a-9461-77e5deb10d1a', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0025', '2025-09-29', '2025-10-02', 'Reserved — Nicolas', '2026-05-08 00:37:35.099+00'),
  ('0ce17f7f-ddfe-4e6c-8c01-d18c4b89acf0', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0026', '2025-10-03', '2025-10-05', 'Not available', '2026-05-08 00:37:35.099+00'),
  ('131f8a60-5d65-4a9f-bb10-c6eff02d0e91', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0027', '2025-10-06', '2025-10-10', 'Blocked — Limpeza profunda', '2026-05-08 00:37:35.099+00'),
  ('82b0c9ed-0c3f-48b1-af0d-4914f20e780c', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0028', '2025-10-11', '2025-10-13', 'Reserved — Ana', '2026-05-08 00:37:35.099+00'),
  ('dc4fab62-a2d7-446b-afae-2a0d7216d60e', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0029', '2025-10-17', '2025-10-20', 'Reserved — Fernanda', '2026-05-08 00:37:35.099+00'),
  ('738cb360-138d-4fb0-ac1b-37d4ec2f0e68', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0030', '2025-10-20', '2025-10-23', 'Reserved — Helena', '2026-05-08 00:37:35.099+00'),
  ('73f17ba7-90e2-4998-a0a1-4e37db649282', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0031', '2025-10-24', '2025-10-28', 'Reserved — Daniel', '2026-05-08 00:37:35.099+00'),
  ('be4abf62-5f6a-4ec7-b4a1-b78e4d2b0928', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0032', '2025-10-30', '2025-11-13', 'Reserved — Daniel', '2026-05-08 00:37:35.099+00'),
  ('7f9365dd-ad7f-4c55-9568-0fd83bcf9bcd', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0033', '2025-11-13', '2025-11-15', 'Reserved — Caio', '2026-05-08 00:37:35.099+00'),
  ('7fca9424-76c8-41b9-93e4-9bd48dc691c9', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0034', '2025-11-16', '2025-11-20', 'Blocked — Limpeza profunda', '2026-05-08 00:37:35.099+00'),
  ('d0d1c593-8f28-4530-b3f5-1aa5fb62ab31', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0035', '2025-11-22', '2025-11-25', 'Reserved — Pedro', '2026-05-08 00:37:35.099+00'),
  ('1b8f1290-216f-4925-a0a7-d79523a35023', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0036', '2025-11-26', '2025-11-30', 'Reserved — Raquel', '2026-05-08 00:37:35.099+00'),
  ('c2e0e0b0-b9f5-4182-a99f-0decd9cee6a7', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0037', '2025-12-01', '2025-12-07', 'Blocked — Uso pessoal', '2026-05-08 00:37:35.099+00'),
  ('88fd4208-838a-4241-b65b-ee6cb460e26d', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0038', '2025-12-07', '2025-12-11', 'Reserved — Olivia', '2026-05-08 00:37:35.099+00'),
  ('e1486272-752f-468f-8180-fbc71010e607', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0039', '2025-12-11', '2025-12-13', 'Reserved — Ana', '2026-05-08 00:37:35.099+00'),
  ('77f35041-23a5-4062-9c96-046d1df3d7d0', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0040', '2025-12-13', '2025-12-17', 'Reserved — Caio', '2026-05-08 00:37:35.099+00'),
  ('5ceac8fe-820c-4735-a0de-3262c1d2ba66', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0041', '2025-12-18', '2025-12-21', 'Reserved — Bruno', '2026-05-08 00:37:35.099+00'),
  ('013f1a7a-a271-4cc9-ae39-f30ae6b43f13', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0042', '2025-12-21', '2025-12-24', 'Reserved — Beatriz', '2026-05-08 00:37:35.099+00'),
  ('028d3d43-679a-4501-afad-70e982fbe552', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0043', '2025-12-24', '2025-12-25', 'Reserved — Eduardo', '2026-05-08 00:37:35.099+00'),
  ('babfd653-d292-4fc3-bb8a-d32f3837052d', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0044', '2025-12-25', '2025-12-30', 'Reserved — Fernanda', '2026-05-08 00:37:35.099+00'),
  ('2b69c226-7bf6-4a10-a438-19e05e033975', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0045', '2026-01-01', '2026-01-03', 'Reserved — Raquel', '2026-05-08 00:37:35.099+00'),
  ('9dbd19f4-3bc3-48e8-9859-68bcd3547a02', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0046', '2026-01-04', '2026-01-07', 'Reserved — Olivia', '2026-05-08 00:37:35.099+00'),
  ('98ef2b5b-040c-4202-8c6d-56da58aa4850', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0047', '2026-01-07', '2026-01-10', 'Reserved — Bruno', '2026-05-08 00:37:35.099+00'),
  ('4c0b8090-c354-477b-88a4-4e071dc46dec', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0048', '2026-01-11', '2026-01-17', 'Reserved — Ana', '2026-05-08 00:37:35.099+00'),
  ('6191889c-4b53-427e-8511-b5b74e99813e', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0049', '2026-01-18', '2026-01-24', 'Reserved — Beatriz', '2026-05-08 00:37:35.099+00'),
  ('38214422-a2ff-461a-9f43-963997d30ee4', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0050', '2026-01-25', '2026-01-27', 'Reserved — Gabriel', '2026-05-08 00:37:35.099+00'),
  ('6deb715f-2fc8-4cc9-aed5-08584040a4a8', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0051', '2026-01-30', '2026-02-02', 'Reserved — Igor', '2026-05-08 00:37:35.099+00'),
  ('66c85563-e792-4d0c-96b3-c336dab4eeda', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0052', '2026-02-07', '2026-02-12', 'Reserved — Daniel', '2026-05-08 00:37:35.099+00'),
  ('d1255315-a4c6-404d-ad20-5958ffeff4d2', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0053', '2026-02-18', '2026-02-21', 'Reserved — Lucas', '2026-05-08 00:37:35.099+00'),
  ('b305255e-a5d0-4982-ac58-89e9c21cd75f', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0054', '2026-02-22', '2026-02-26', 'Reserved — Mariana', '2026-05-08 00:37:35.099+00'),
  ('713c9c56-8082-42e3-b26f-497842fcb541', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0055', '2026-03-01', '2026-03-03', 'Reserved — Olivia', '2026-05-08 00:37:35.099+00'),
  ('256cdc87-fbc4-4708-90e9-0295c9b92ae9', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0056', '2026-03-05', '2026-03-12', 'Reserved — Helena', '2026-05-08 00:37:35.099+00'),
  ('1c041aee-e8d6-42de-b569-e7f052be52ac', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0057', '2026-03-13', '2026-03-18', 'Reserved — Julia', '2026-05-08 00:37:35.099+00'),
  ('c9f02834-5373-4658-815e-2d67eb3597c7', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0058', '2026-03-21', '2026-03-24', 'Reserved — Sofia', '2026-05-08 00:37:35.099+00'),
  ('40eb32b6-d7c9-49a1-89d1-a3858e256c1d', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0059', '2026-03-25', '2026-03-29', 'Reserved — Helena', '2026-05-08 00:37:35.099+00'),
  ('6eb6fece-d234-449e-b96e-2e769a0b3e63', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0060', '2026-04-01', '2026-04-03', 'Reserved — Lucas', '2026-05-08 00:37:35.099+00'),
  ('0281d47f-8778-42cb-acc5-270e4e3358b5', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0061', '2026-04-04', '2026-04-06', 'Reserved — Thiago', '2026-05-08 00:37:35.099+00'),
  ('17e538da-049c-4036-86f1-217df13e3985', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0062', '2026-04-07', '2026-04-10', 'Reserved — Raquel', '2026-05-08 00:37:35.099+00'),
  ('4f61b85b-1605-49a4-b900-cbc55e61c653', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0063', '2026-04-11', '2026-04-15', 'Reserved — Sofia', '2026-05-08 00:37:35.099+00'),
  ('3331456b-14b7-4d73-aa0a-73d1ebf77404', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0064', '2026-04-16', '2026-04-20', 'Reserved — Pedro', '2026-05-08 00:37:35.099+00'),
  ('384fb8e5-970a-4145-a9d5-7e9815ea7d33', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0065', '2026-04-23', '2026-05-03', 'Reserved — Julia', '2026-05-08 00:37:35.099+00'),
  ('5a0299d3-989c-48b1-b1bb-25b68503c47a', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0066', '2026-05-07', '2026-05-14', 'Reserved — Camila', '2026-05-08 00:37:35.099+00'),
  ('d806c081-6aa4-47c2-b719-45ad6b932d6b', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0067', '2026-05-15', '2026-05-25', 'Reserved — Camila', '2026-05-08 00:37:35.099+00'),
  ('aabcb5e8-b966-467c-8f02-7d2d4473be47', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0068', '2026-05-26', '2026-06-05', 'Reserved — Thiago', '2026-05-08 00:37:35.099+00'),
  ('d26f86ec-fb02-4ee5-bd41-32146b4e1401', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0069', '2026-06-05', '2026-06-08', 'Not available', '2026-05-08 00:37:35.099+00'),
  ('1f465e26-5594-4cf6-bb9f-ead2271ad82b', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0070', '2026-06-08', '2026-06-13', 'Reserved — Nicolas', '2026-05-08 00:37:35.099+00'),
  ('be75ef7e-da07-4351-ac54-9e823e1db74c', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0071', '2026-06-14', '2026-06-17', 'Reserved — Caio', '2026-05-08 00:37:35.099+00'),
  ('dc7e0bfe-7ebc-4e7b-979a-bc9c2c3c24e6', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0072', '2026-06-18', '2026-06-21', 'Reserved — Sofia', '2026-05-08 00:37:35.099+00'),
  ('f0b13261-13a0-4c5f-b660-e48b5b1db117', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0073', '2026-06-23', '2026-06-30', 'Reserved — Vitor', '2026-05-08 00:37:35.099+00'),
  ('09b60961-8d66-4ff6-9509-92d9744415f2', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0074', '2026-07-01', '2026-07-04', 'Reserved — Julia', '2026-05-08 00:37:35.099+00'),
  ('cf4a64ef-87de-4b93-8f62-9f32289fbed8', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0075', '2026-07-04', '2026-07-09', 'Reserved — Helena', '2026-05-08 00:37:35.099+00'),
  ('b226b990-47ea-4bd1-81fd-4f70215f120d', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0076', '2026-07-10', '2026-07-24', 'Reserved — Lucas', '2026-05-08 00:37:35.099+00'),
  ('1915bd03-1374-445c-816e-fe380d44302f', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0077', '2026-07-25', '2026-07-29', 'Reserved — Caio', '2026-05-08 00:37:35.099+00'),
  ('854c6680-9cde-418d-901f-29c04376239c', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0078', '2026-07-30', '2026-08-02', 'Reserved — Lucas', '2026-05-08 00:37:35.099+00'),
  ('52beaf79-7885-499e-a7df-1f6f51f21dd0', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0079', '2026-08-02', '2026-08-05', 'Blocked — Limpeza profunda', '2026-05-08 00:37:35.099+00'),
  ('2052c415-0e48-4eb1-8cde-da25c7f9e73f', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0080', '2026-08-06', '2026-08-09', 'Reserved — Bruno', '2026-05-08 00:37:35.099+00'),
  ('2321cebd-af2d-4f6e-ad13-05bf8066254e', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0081', '2026-08-11', '2026-08-15', 'Reserved — Julia', '2026-05-08 00:37:35.099+00'),
  ('c6547ae2-1b58-4f2f-9cac-49baa82f557b', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0082', '2026-08-17', '2026-08-19', 'Reserved — Igor', '2026-05-08 00:37:35.099+00'),
  ('1eb8b85a-74bb-4538-bd76-24dd45976d93', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0083', '2026-08-24', '2026-08-27', 'Reserved — Thiago', '2026-05-08 00:37:35.099+00'),
  ('623caf70-715c-41c8-a33a-4e9b3df9c61e', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0084', '2026-08-27', '2026-08-31', 'Blocked — Limpeza profunda', '2026-05-08 00:37:35.099+00'),
  ('da7a2312-4758-4f1f-aa48-4baff156d6b0', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0085', '2026-09-01', '2026-09-04', 'Reserved — Diana', '2026-05-08 00:37:35.099+00'),
  ('3d244ed6-5860-4611-9e5e-b2ff9d0c7c7a', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0086', '2026-09-05', '2026-09-11', 'Reserved — Sofia', '2026-05-08 00:37:35.099+00'),
  ('1abede58-b193-42ab-87a8-213ff31e5fc3', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0087', '2026-09-12', '2026-09-19', 'Reserved — Igor', '2026-05-08 00:37:35.099+00'),
  ('9d240d59-5725-4330-ae8c-d67d00d34846', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0088', '2026-09-20', '2026-09-24', 'Reserved — Igor', '2026-05-08 00:37:35.099+00'),
  ('1ce58741-52cf-44d6-b651-3916b6988b98', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0089', '2026-09-25', '2026-09-29', 'Reserved — Sofia', '2026-05-08 00:37:35.099+00'),
  ('39718cbb-654c-43e9-b72b-605d6b02885d', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0090', '2026-09-30', '2026-10-02', 'Reserved — Ana', '2026-05-08 00:37:35.099+00'),
  ('308a570c-4909-4eef-a875-a457849a9536', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0091', '2026-10-02', '2026-10-05', 'Reserved — Raquel', '2026-05-08 00:37:35.099+00'),
  ('57bd4bbd-f344-4ec3-a06d-a0efc872affd', '4047fe21-99df-499c-8503-12beaafdf2fe', 'demo-0094', '2026-10-17', '2026-10-19', 'Reserved — Olivia', '2026-05-08 00:37:35.099+00'),
  ('f37dfd82-ab37-4824-bfdb-654e5408063c', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0094', '2026-10-07', '2026-10-09', 'Blocked — Manutenção', '2026-04-18 17:27:47.732+00'),
  ('df75c7a4-e03d-46db-8b4a-7119d457980d', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0001', '2025-04-20', '2025-04-22', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('2d51da88-3fef-4c96-91c7-1caf9cecef6a', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0002', '2025-04-22', '2025-04-24', 'Reserved — Olivia', '2026-04-18 17:27:47.732+00'),
  ('896cabc1-1e94-4bda-9abc-343c1d2e4fe7', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0003', '2025-04-28', '2025-04-30', 'Reserved — Vitor', '2026-04-18 17:27:47.732+00'),
  ('735b728f-cfe3-46f4-adc5-faa1197f694a', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0004', '2025-05-04', '2025-05-07', 'Reserved — Pedro', '2026-04-18 17:27:47.732+00'),
  ('f7ccd662-1aa0-4ed6-89d9-8b28a0787c74', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0005', '2025-05-08', '2025-05-10', 'Blocked — Manutenção', '2026-04-18 17:27:47.732+00'),
  ('4d42ade5-713a-4949-afbb-aa5597924166', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0006', '2025-05-13', '2025-05-15', 'Blocked — Uso pessoal', '2026-04-18 17:27:47.732+00'),
  ('f2f52c5f-35e2-4143-95cf-8c37fdd0840b', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0007', '2025-05-18', '2025-05-20', 'Not available', '2026-04-18 17:27:47.732+00'),
  ('90d01d20-85ab-42e7-a82d-a1d48cb9d197', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0008', '2025-05-22', '2025-05-25', 'Not available', '2026-04-18 17:27:47.732+00'),
  ('dce05fa4-187c-437a-ae81-4e704d856104', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0009', '2025-05-29', '2025-06-01', 'Reserved — Raquel', '2026-04-18 17:27:47.732+00'),
  ('bbabe106-4028-419b-9504-66cf24c55719', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0010', '2025-06-01', '2025-06-04', 'Reserved — Vitor', '2026-04-18 17:27:47.732+00'),
  ('76d618c6-2695-4487-9920-8daf5f21bb98', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0011', '2025-06-04', '2025-06-11', 'Blocked — Uso pessoal', '2026-04-18 17:27:47.732+00'),
  ('0f599179-b577-45f5-a3fa-fae9f4a913a7', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0012', '2025-06-11', '2025-06-12', 'Reserved — Yasmin', '2026-04-18 17:27:47.732+00'),
  ('a8133693-7941-4708-8873-0d1d631ff57f', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0013', '2025-06-14', '2025-06-17', 'Reserved — Fernanda', '2026-04-18 17:27:47.732+00'),
  ('9fd64777-a929-402e-b25c-2385c252f72c', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0014', '2025-06-17', '2025-06-21', 'Reserved — Olivia', '2026-04-18 17:27:47.732+00'),
  ('3835adbb-9e89-4cfb-b25f-3ec702b87066', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0015', '2025-06-21', '2025-06-27', 'Reserved — Daniel', '2026-04-18 17:27:47.732+00'),
  ('59ba8e59-ec0b-41d0-b61c-05cbc65f55dc', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0016', '2025-06-28', '2025-07-03', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('6cfd5f6a-d371-4692-9533-bbf7cd67fbae', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0017', '2025-07-05', '2025-07-09', 'Reserved — Fernanda', '2026-04-18 17:27:47.732+00'),
  ('6296cc28-1b08-4b35-a104-36d01b17d5da', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0018', '2025-07-10', '2025-07-14', 'Reserved — Daniel', '2026-04-18 17:27:47.732+00'),
  ('56cb3ce2-e0dc-468c-a00a-ad3c9981c092', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0019', '2025-07-16', '2025-07-17', 'Reserved — Pedro', '2026-04-18 17:27:47.732+00'),
  ('1160b056-3a05-4c05-91d3-8b144d40a0a0', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0020', '2025-07-18', '2025-07-21', 'Reserved — Gabriel', '2026-04-18 17:27:47.732+00'),
  ('746d3275-f3d2-41eb-9c3f-b98fb92c4f6d', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0021', '2025-07-25', '2025-07-28', 'Reserved — Daniel', '2026-04-18 17:27:47.732+00'),
  ('54cc9ce9-4ede-4681-9187-a079422bc05c', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0022', '2025-07-29', '2025-07-31', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('8eed813b-8279-4413-946f-dece32167416', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0023', '2025-07-31', '2025-08-04', 'Reserved — Arthur', '2026-04-18 17:27:47.732+00'),
  ('bc6e035d-22bd-4ec6-a09e-5d9f871e74a8', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0024', '2025-08-05', '2025-08-08', 'Reserved — Gabriel', '2026-04-18 17:27:47.732+00'),
  ('f4c35113-c8f4-4545-8f52-cd030cb5045c', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0025', '2025-08-09', '2025-08-12', 'Reserved — Olivia', '2026-04-18 17:27:47.732+00'),
  ('5d8a186d-714b-4096-9ee1-16617bf2d6bb', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0026', '2025-08-13', '2025-08-17', 'Reserved — Mariana', '2026-04-18 17:27:47.732+00'),
  ('d4f614fb-0551-4429-8cf0-bd3c5d496e47', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0027', '2025-08-19', '2025-08-23', 'Reserved — Bruno', '2026-04-18 17:27:47.732+00'),
  ('537edb9c-7624-4a47-8371-cd9338f8a8a3', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0028', '2025-08-25', '2025-08-29', 'Reserved — Arthur', '2026-04-18 17:27:47.732+00'),
  ('5c7e451c-c5cf-4fae-bc82-a019fb924d16', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0029', '2025-08-31', '2025-09-02', 'Reserved — Olivia', '2026-04-18 17:27:47.732+00'),
  ('efa44537-202c-4a9a-b24e-0843932cc0a2', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0030', '2025-09-04', '2025-09-08', 'Reserved — Fernanda', '2026-04-18 17:27:47.732+00'),
  ('046658b3-75ea-41da-9b5c-c440f0d7d255', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0031', '2025-09-10', '2025-10-01', 'Reserved — Camila', '2026-04-18 17:27:47.732+00'),
  ('1cc29df0-2511-44a7-8f9c-c791604e4476', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0032', '2025-10-01', '2025-10-05', 'Reserved — Sofia', '2026-04-18 17:27:47.732+00'),
  ('69003400-2eca-4c51-841a-b02b65050618', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0033', '2025-10-08', '2025-10-10', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('9e4e537f-efec-46da-9fcf-7c94835776af', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0034', '2025-10-16', '2025-10-19', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('9938e4b8-cbde-42a6-8ec4-7a9a29788790', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0035', '2025-10-20', '2025-10-23', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('29006390-3061-4c7d-a9e1-636b2196d570', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0036', '2025-10-25', '2025-10-28', 'Blocked — Manutenção', '2026-04-18 17:27:47.732+00'),
  ('160e948b-0e43-462a-b716-c8421a3fa8ac', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0037', '2025-10-30', '2025-11-03', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('df18101c-fc83-4272-884e-7866723d8ba5', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0038', '2025-11-03', '2025-11-06', 'Not available', '2026-04-18 17:27:47.732+00'),
  ('1d550c98-1bfa-4f62-89de-674cf8e474ab', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0039', '2025-11-07', '2025-11-11', 'Reserved — Gabriel', '2026-04-18 17:27:47.732+00'),
  ('a4bea6dc-c4e8-4604-8859-542f2d5de886', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0040', '2025-11-11', '2025-11-15', 'Reserved — Caio', '2026-04-18 17:27:47.732+00'),
  ('88207d0c-d986-4a30-bb6f-506d7a4daa0b', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0041', '2025-11-19', '2025-11-22', 'Reserved — Ana', '2026-04-18 17:27:47.732+00'),
  ('c7147267-01f1-4fe2-b754-1c2b64b15c57', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0042', '2025-11-24', '2025-11-26', 'Reserved — Nicolas', '2026-04-18 17:27:47.732+00'),
  ('59299a55-842d-4607-9867-a9c83220fb22', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0043', '2025-11-28', '2025-11-30', 'Reserved — Eduardo', '2026-04-18 17:27:47.732+00'),
  ('7ae8bcdd-352a-4523-89d2-726616e29634', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0044', '2025-12-01', '2025-12-06', 'Reserved — Diana', '2026-04-18 17:27:47.732+00'),
  ('72d6be20-7d12-4c4d-987a-f379422418e9', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0045', '2025-12-06', '2025-12-10', 'Reserved — Gabriel', '2026-04-18 17:27:47.732+00'),
  ('c7482118-1983-4db7-99fd-b718e84c7aff', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0046', '2025-12-11', '2025-12-16', 'Reserved — Camila', '2026-04-18 17:27:47.732+00'),
  ('3258e20f-a5b0-4069-a805-f9233c8a833f', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0047', '2025-12-18', '2025-12-22', 'Reserved — Bruno', '2026-04-18 17:27:47.732+00'),
  ('22fafd0d-9fa7-4e97-8b6d-e2d67f94e34b', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0048', '2025-12-23', '2025-12-28', 'Reserved — Nicolas', '2026-04-18 17:27:47.732+00'),
  ('ca899732-8a86-41dc-9dd4-4b3c60458b5b', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0049', '2025-12-28', '2026-01-07', 'Reserved — Yasmin', '2026-04-18 17:27:47.732+00'),
  ('abe44954-a3dc-470d-a680-e3334d442996', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0050', '2026-01-07', '2026-01-09', 'Reserved — Eduardo', '2026-04-18 17:27:47.732+00'),
  ('675d72c0-d51f-4def-8419-806782175461', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0051', '2026-01-11', '2026-01-13', 'Reserved — Caio', '2026-04-18 17:27:47.732+00'),
  ('3048627e-2840-42fd-bef8-64b19dc8b248', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0052', '2026-01-15', '2026-01-18', 'Reserved — Gabriel', '2026-04-18 17:27:47.732+00'),
  ('255f21fa-4d9e-45b4-bc87-156982b6d0d9', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0053', '2026-01-19', '2026-01-20', 'Blocked — Uso pessoal', '2026-04-18 17:27:47.732+00'),
  ('486f418b-cd1e-422f-b6e5-238dd2218fcf', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0054', '2026-01-21', '2026-01-24', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('403796cb-0107-47a1-b50a-d28a71f0c3ce', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0055', '2026-01-25', '2026-01-27', 'Blocked — Limpeza profunda', '2026-04-18 17:27:47.732+00'),
  ('90cd372d-3b16-4224-be8c-85d424e68340', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0056', '2026-01-30', '2026-02-06', 'Reserved — Mariana', '2026-04-18 17:27:47.732+00'),
  ('ca2c169b-6174-4508-8962-121ff5e1f956', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0057', '2026-02-06', '2026-02-08', 'Reserved — Yasmin', '2026-04-18 17:27:47.732+00'),
  ('2ce6b6e0-d7ac-4f9c-8753-f988e1479504', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0058', '2026-02-10', '2026-02-13', 'Reserved — Pedro', '2026-04-18 17:27:47.732+00'),
  ('bf8b2e10-6b27-4d48-a5f5-3297b8aa2384', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0059', '2026-02-16', '2026-02-18', 'Reserved — Ana', '2026-04-18 17:27:47.732+00'),
  ('a354c88e-c9d6-4e2a-82c8-57cdabb3f76f', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0060', '2026-02-18', '2026-02-25', 'Reserved — Fernanda', '2026-04-18 17:27:47.732+00'),
  ('2200b9ed-b95d-4220-a52c-753ad6b62120', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0061', '2026-02-27', '2026-03-02', 'Reserved — Beatriz', '2026-04-18 17:27:47.732+00'),
  ('cde9f9e8-c657-456d-831b-aa56ff43fe34', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0062', '2026-03-03', '2026-03-05', 'Reserved — Yasmin', '2026-04-18 17:27:47.732+00'),
  ('a5ca808d-94ab-489b-8198-776b0622854d', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0063', '2026-03-11', '2026-03-21', 'Reserved — Sofia', '2026-04-18 17:27:47.732+00'),
  ('4c7bf74e-7f3e-4f41-90cc-1c80f5cd9039', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0064', '2026-03-22', '2026-03-24', 'Reserved — Helena', '2026-04-18 17:27:47.732+00'),
  ('1e2e50af-dfc9-49c6-8988-7be46b3389a2', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0065', '2026-03-24', '2026-03-27', 'Blocked — Manutenção', '2026-04-18 17:27:47.732+00'),
  ('80609d95-9564-474f-8f71-c2667e66091f', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0066', '2026-03-28', '2026-03-30', 'Blocked — Manutenção', '2026-04-18 17:27:47.732+00'),
  ('f8f8ec7e-7dd3-42b3-8ef3-3f7c15b79588', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0067', '2026-04-02', '2026-04-06', 'Reserved — Yasmin', '2026-04-18 17:27:47.732+00'),
  ('04ddeb8e-87d1-4742-97b0-e508ffee69ca', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0068', '2026-04-08', '2026-04-11', 'Reserved — Igor', '2026-04-18 17:27:47.732+00'),
  ('434cb769-ae8c-474d-b0c5-3d7e1305281c', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0069', '2026-04-15', '2026-04-18', 'Reserved — Beatriz', '2026-04-18 17:27:47.732+00'),
  ('95e63540-9cf0-4fcd-9c2d-d97fb056929d', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0070', '2026-04-19', '2026-04-21', 'Reserved — Fernanda', '2026-04-18 17:27:47.732+00'),
  ('e5abb9fb-fbf3-4c21-8fa0-4a34a3d2ea02', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0071', '2026-04-21', '2026-04-25', 'Reserved — Vitor', '2026-04-18 17:27:47.732+00'),
  ('8da04eff-8cd6-4235-9479-918eba3f64da', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0072', '2026-04-26', '2026-04-28', 'Reserved — Lucas', '2026-04-18 17:27:47.732+00'),
  ('6bf1eada-906d-474b-84fc-e9a14f59c9e3', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0073', '2026-04-29', '2026-05-03', 'Reserved — Arthur', '2026-04-18 17:27:47.732+00'),
  ('77114f5f-07a8-487f-9f8b-52d48aa2c158', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0074', '2026-05-04', '2026-05-10', 'Reserved — Igor', '2026-04-18 17:27:47.732+00'),
  ('78179dea-158e-478c-9110-4a1a74f39e8d', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0075', '2026-05-22', '2026-05-29', 'Reserved — Arthur', '2026-04-18 17:27:47.732+00'),
  ('ecf6c99a-681b-49ae-ac89-a1195af35a8e', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0076', '2026-05-31', '2026-06-07', 'Reserved — Bruno', '2026-04-18 17:27:47.732+00'),
  ('47020f49-b1f1-49fb-a7ea-7674cf69df1d', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0077', '2026-06-07', '2026-06-09', 'Blocked — Uso pessoal', '2026-04-18 17:27:47.732+00'),
  ('ad9524ae-98e1-4bb7-9a1e-dfabd2f59524', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0078', '2026-06-12', '2026-06-15', 'Reserved — Arthur', '2026-04-18 17:27:47.732+00'),
  ('a54cf6ab-b52b-489c-9280-1e4feaf28b0d', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0079', '2026-06-15', '2026-06-21', 'Reserved — Sofia', '2026-04-18 17:27:47.732+00'),
  ('aebe08de-82d8-4afc-aa4b-f9e33322d7de', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0080', '2026-06-22', '2026-07-02', 'Reserved — Bruno', '2026-04-18 17:27:47.732+00'),
  ('2a2b6ce8-b588-48c0-a526-c0718a4a20bc', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0081', '2026-07-02', '2026-07-12', 'Reserved — Mariana', '2026-04-18 17:27:47.732+00'),
  ('a6443fc4-3269-4e9a-81a5-4f78aeae2197', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0082', '2026-07-13', '2026-07-17', 'Reserved — Daniel', '2026-04-18 17:27:47.732+00'),
  ('f262fbcb-ed0f-4aa0-beb5-1c07eb2d28cb', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0083', '2026-07-19', '2026-07-25', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('9777c069-104a-4d46-8b77-3d905dc7a9af', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0084', '2026-07-26', '2026-08-02', 'Reserved — Nicolas', '2026-04-18 17:27:47.732+00'),
  ('8f20a05f-5741-4200-b2c5-1b77ccab7c12', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0085', '2026-08-03', '2026-08-06', 'Reserved — Caio', '2026-04-18 17:27:47.732+00'),
  ('1e84027e-cd13-46a8-95f3-a132f3bdc58c', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0086', '2026-08-06', '2026-08-08', 'Reserved — Sofia', '2026-04-18 17:27:47.732+00'),
  ('d7ad1cfb-cb47-4ea2-9353-9b0cbbf11fb9', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0087', '2026-08-09', '2026-08-10', 'Reserved — Ana', '2026-04-18 17:27:47.732+00'),
  ('caa9741e-9ae8-4599-b31e-b478d6f4fe99', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0088', '2026-08-10', '2026-08-17', 'Reserved — Mariana', '2026-04-18 17:27:47.732+00'),
  ('9607edad-949f-4a2c-a14b-a53a8ca8eaf4', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0089', '2026-08-24', '2026-09-07', 'Reserved — Raquel', '2026-04-18 17:27:47.732+00'),
  ('19b91de5-471b-412a-a879-72326affc492', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0090', '2026-09-07', '2026-09-21', 'Reserved — Ana', '2026-04-18 17:27:47.732+00'),
  ('320c73e9-217d-4c08-9c47-4902a8490697', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0091', '2026-09-23', '2026-09-30', 'Reserved — Thiago', '2026-04-18 17:27:47.732+00'),
  ('ccac85e5-74e5-4b36-a94a-19802322c7cf', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0092', '2026-10-01', '2026-10-03', 'Reserved — Caio', '2026-04-18 17:27:47.732+00'),
  ('0b44af3e-debd-4534-801c-3697b76f8ca4', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0093', '2026-10-05', '2026-10-07', 'Reserved — Bruno', '2026-04-18 17:27:47.732+00'),
  ('6be30147-1797-4712-8b97-7c022061db06', '98cfaba7-6530-4191-be59-9fa094552bbf', 'demo-0095', '2026-10-09', '2026-10-12', 'Reserved — Sofia', '2026-04-18 17:27:47.732+00'),
  ('0fac6712-347f-4828-a117-5e30d09163dc', '1cd22275-2b60-4b63-a525-f8cee25db6a7', 'mock-reserva-001', '2026-03-17', '2026-03-20', 'Reserva Teste 1 — Hóspede fictício', '2026-03-12 10:09:05.594+00'),
  ('fd4a2b22-9e4c-4e55-ad26-2a16147bdd59', '1cd22275-2b60-4b63-a525-f8cee25db6a7', 'mock-bloqueio-002', '2026-05-01', '2026-05-03', 'Bloqueio Teste — Uso pessoal', '2026-03-12 10:09:05.594+00'),
  ('829bcc21-23d7-475f-a42c-02651a9bff36', '1cd22275-2b60-4b63-a525-f8cee25db6a7', 'mock-reserva-003', '2026-04-16', '2026-04-21', 'Reserva Teste 3 — Estadia longa', '2026-03-12 10:09:05.594+00'),
  ('705e2a3d-bf9e-40be-823a-e4d12bc4f0e8', '1cd22275-2b60-4b63-a525-f8cee25db6a7', 'mock-bloqueio-001', '2026-04-06', '2026-04-08', 'Bloqueio Teste — Manutenção', '2026-03-12 10:09:05.594+00'),
  ('897769c9-9a71-4e07-8e34-0528f38e3697', '1cd22275-2b60-4b63-a525-f8cee25db6a7', 'mock-reserva-002', '2026-03-27', '2026-03-29', 'Reserva Teste 2 — Estadia curta', '2026-03-12 10:09:05.594+00')
ON CONFLICT (id) DO UPDATE SET
  connection_id = EXCLUDED.connection_id, external_event_uid = EXCLUDED.external_event_uid, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, summary = EXCLUDED.summary, synced_at = EXCLUDED.synced_at;
```

---

## Conferência pós-carga

```sql
SELECT 'guide_leads' AS tabela, count(*) FROM public.guide_leads
UNION ALL SELECT 'projects', count(*) FROM public.projects
UNION ALL SELECT 'ota_connections', count(*) FROM public.ota_connections
UNION ALL SELECT 'ota_calendar_events', count(*) FROM public.ota_calendar_events;
```

Esperado desta carga: guide_leads **1**, projects **3**,
ota_connections **3**, ota_calendar_events **196**.
