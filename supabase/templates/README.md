# Correos de autenticación

Plantillas en español con la identidad de IntegraMente para los correos que
manda Supabase Auth (a través del SMTP de Resend configurado en
`config.toml` → `[auth.email.smtp]`). Las rutas y asuntos están en
`config.toml` → `[auth.email.template.*]`.

## Por qué los enlaces van directo a la app

`confirmation`, `recovery` e `invite` arman el enlace como
`{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=…` en lugar de usar
`{{ .ConfirmationURL }}`. La página de destino (`/confirmar-correo`,
`/restablecer-contrasena`, `/completar-cuenta`) verifica el token con
`supabase.auth.verifyOtp` e inicia sesión directamente — ver
`src/lib/useEmailLinkVerification.ts`. Así:

- confirmar el correo no vuelve a pedir correo y contraseña, y
- los filtros antispam que "abren" los enlaces por adelantado no gastan el
  token de un solo uso antes de que la persona lo toque.

`{{ .RedirectTo }}` es el `emailRedirectTo`/`redirectTo` que manda el código
(`confirmEmailRedirect()` en `src/lib/authErrors.ts`, y
`supabase/functions/admin-accounts`). Si esa URL no está en
`additional_redirect_urls`, Supabase usa el `site_url` y `App.tsx`
(`EmailLinkFallback`) reenvía el token a la página correcta.

## Publicar cambios en producción

```sh
RESEND_API_KEY=… supabase config push
```

`config push` sube **toda** la sección `[auth]` (no solo las plantillas):
revisá el diff que muestra antes de confirmar. Alternativa manual: pegar el
HTML de cada archivo en Dashboard → Authentication → Email Templates.

## Hook de envío (HTML + texto plano)

`supabase/functions/auth-email` manda los mismos correos por la API de
Resend con versión en texto plano y Reply-To. Usa una copia de estas
plantillas: después de editar cualquier `.html`, regenerala con

```sh
python3 scripts/email/generar-plantillas.py
supabase functions deploy auth-email --no-verify-jwt
```

Se activa en Dashboard → Authentication → Hooks → Send Email (HTTPS,
`…/functions/v1/auth-email`) y guardando el secreto generado con
`supabase secrets set SEND_EMAIL_HOOK_SECRET='v1,whsec_…'`. Con el hook
activo, Auth deja de usar el SMTP.
