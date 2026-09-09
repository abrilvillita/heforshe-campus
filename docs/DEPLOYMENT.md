# Despliegue en dominio propio

Estado: base implementada y probada localmente; no desplegar con datos reales hasta completar SECURITY.md.

## Recursos

1. Cuenta responsable en Cloudflare. Crear D1 y bucket R2 privado para este proyecto; revisar tarifas y límites antes.
2. Copiar `wrangler.example.jsonc` a `wrangler.jsonc` y sustituir los marcadores por identificadores reales. Este archivo local se ignora en Git.
3. Configurar el dominio en Workers. Mantener desactivados workers.dev y previews alternativos para no crear accesos secundarios.
4. Preparar Access para `/admin`, `/admin/*` y `/api/admin/*` dentro de una aplicación con su audiencia. Incluir solo las cinco cuentas reales. Exigir MFA en aplicación/política, sin bypass. Configurar sesiones cortas y recuperación.
5. Poner ACCESS_TEAM_DOMAIN, ACCESS_AUD, SITE_ORIGIN, EDITOR_EMAILS y PUBLISHER_EMAILS. SITE_ORIGIN debe coincidir exactamente con el origen público, sin barra final. Usar solo las cuentas autorizadas.
6. Configurar Turnstile para el dominio. Su site key puede ser pública. Guardar TURNSTILE_SECRET y RATE_LIMIT_SECRET como secretos de Worker; nunca en código, README ni archivos públicos. RATE_LIMIT_SECRET debe ser aleatorio y de alta entropía.

## Construcción y migración

```bash
npm ci
npm test
npm run typecheck
npm run build:standalone
npx wrangler d1 migrations apply heforshe-campus --remote --config wrangler.jsonc
npx wrangler deploy --config wrangler.jsonc
```

Estos comandos de despliegue no se han ejecutado en una cuenta real. La configuración de ejemplo tiene marcadores deliberadamente inválidos. La autorización para preparar código no implica contratar recursos de pago.

El build normal `npm run build` conserva la compatibilidad del proyecto original con Sites. Para el dominio propio se usa `build:standalone` más `worker/index.ts`; no se debe desplegar un frontend suelto en GitHub Pages esperando que la base de datos funcione.

## Verificación obligatoria

- Sin sesión: abrir portada, leer solo contenido publicado, no acceder a /admin ni a APIs editoriales.
- Cuenta editora: crear borrador; no publicar ni alterar un artículo publicado.
- Cuenta publicadora: publicar, editar, mandar a papelera y restaurar como borrador.
- Dos sesiones: intentar guardar una versión antigua; debe aparecer conflicto y no sobrescribir.
- Desde otro dispositivo: comprobar publicaciones y bienvenida compartidas.
- Subir archivo válido e inválido; probar video, permisos de archivo no publicado y límites.
- Probar Turnstile válido, expirado y exceso de mensajes; comprobar que el buzón no es público.
- Confirmar limpieza programada, backups de D1/R2 y recuperación.
- Revisar advisories de dependencias y resolver exposición antes de abrir al público.

## Límites actuales

El editor no es un lienzo libre. Los medios admitidos son PNG, JPEG, WebP, MP4 y WebM hasta 15 MB; la demo HTML admite hasta 2 MB por archivo y depende de la cuota local del navegador. No existe carga pública de archivos. El API de video necesita probar seek/rangos en el hosting final. No hay antivirus/transcodificación ni cuotas de almacenamiento por cuenta todavía.

Instagram/TikTok automáticos, OAuth Canva, push y calendario por suscripción no están implementados. No configurar un cron de sincronización suponiendo que ya existen sus adaptadores: el scheduled handler actual únicamente elimina mensajes antiguos y claves de limitación.

## Crecimiento

Antes de un piloto grande, sustituir la descarga completa de contenido por paginación, usar referencias indexadas para medios, implementar cuotas, cachear solo contenido público e incorporar URLs editoriales individuales y sitemap. El esquema usa un control global de revisión para seguridad de concurrencia en el piloto; a mayor escala conviene revisión por documento y permisos por campus.
