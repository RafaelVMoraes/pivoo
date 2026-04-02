# Checklist de CI — Drift de schema Supabase

- [ ] `supabase db reset --local --no-seed` executa com sucesso (migrations replayáveis do zero).
- [ ] `supabase db dump --local --schema public --file supabase/schema.sql` não gera diff (`git diff --exit-code`).
- [ ] `supabase gen types typescript --local --schema public > src/integrations/supabase/types.ts` não gera diff.
- [ ] Mudanças em migrations incluem atualização de `supabase/schema.sql` e `src/integrations/supabase/types.ts`.
