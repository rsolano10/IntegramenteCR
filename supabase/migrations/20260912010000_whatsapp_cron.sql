-- Programa whatsapp-notify-tick cada 10 minutos vía pg_cron + pg_net. El
-- secreto compartido (que el edge function valida contra CRON_SECRET) vive
-- en Supabase Vault, nunca en texto plano en una migración — el valor real
-- se fija por separado con `select vault.update_secret(...)` (no versionado
-- en git) después de aplicar esta migración. El placeholder de acá solo
-- crea el registro; sin actualizarlo, el cron llamaría con un secreto
-- incorrecto y el edge function respondería 401 hasta que se corrija.
select vault.create_secret('pending-set-real-value', 'whatsapp_cron_secret', 'Secreto compartido para autenticar la llamada de pg_cron a whatsapp-notify-tick.');

select cron.schedule(
  'whatsapp-notify-tick',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://vamjqcmklwrkjcgzwsnm.supabase.co/functions/v1/whatsapp-notify-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'whatsapp_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
