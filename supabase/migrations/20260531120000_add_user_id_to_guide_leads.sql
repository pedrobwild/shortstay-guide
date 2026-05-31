-- Unifica captura de lead + acesso exclusivo.
-- Vincula um lead (guide_leads) à conta criada (auth.users) para que o
-- pós-login caia direto na proposta personalizada, não num cadastro genérico.

alter table public.guide_leads
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists guide_leads_user_id_idx
  on public.guide_leads (user_id);

-- Permite que o usuário recém-criado vincule o próprio lead à sua conta.
-- Só é possível assumir um lead ainda sem dono (user_id null) e o registro
-- resultante precisa apontar para o próprio usuário (with check).
drop policy if exists "Users can link own lead" on public.guide_leads;
create policy "Users can link own lead"
  on public.guide_leads
  for update
  to authenticated
  using (user_id is null or user_id = auth.uid())
  with check (user_id = auth.uid());
