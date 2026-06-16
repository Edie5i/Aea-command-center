# Aea Command Center

Plataforma de gestión para **Auto Escuela Americana** (CDMX). Chatbot de ventas (Luz), agendamiento de clases, panel admin, y seguimiento de leads por WhatsApp.

## Stack

Next.js 14 · TypeScript · Tailwind CSS · Firebase App Hosting · Google Genkit (Gemini) · Firestore · WhatsApp Business API

## Comandos

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run lint       # ESLint
npm run typecheck  # TypeScript sin build
```

## Deploy

```bash
firebase deploy --only apphosting
```

> El backend de App Hosting es `studio`. No usar `--only hosting` ni `--only functions`.

## Variables de entorno

En producción se inyectan desde Firebase Secret Manager. Para desarrollo local crea `.env.local`:

```
GOOGLE_GENERATIVE_AI_API_KEY=
META_WHATSAPP_TOKEN=
META_PHONE_NUMBER_ID=
META_VERIFY_TOKEN=
GOOGLE_CALENDAR_ID=
CALENDAR_KEY=          # JSON de service account en base64
ADMIN_NOTIFICATION_PHONE=  # ej. 525634433212
```

## Cloud Scheduler — Follow-ups automáticos

El cron de follow-ups corre cada hora y procesa leads que no han respondido.

**Job:** `cron-followups-aea` · Proyecto: `aea-25-85385059-83402` · Región: `us-central1`

### Crear el job (primera vez)

```bash
TOKEN=$(gcloud auth print-access-token) && curl -s -X POST \
  "https://cloudscheduler.googleapis.com/v1/projects/aea-25-85385059-83402/locations/us-central1/jobs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "projects/aea-25-85385059-83402/locations/us-central1/jobs/cron-followups-aea",
    "schedule": "0 * * * *",
    "timeZone": "America/Mexico_City",
    "httpTarget": {
      "uri": "https://app.autoescuelaamericana.com/api/cron/advance-chat-states?token=aea_webhook_2026",
      "httpMethod": "GET"
    }
  }'
```

### Probar manualmente

```bash
curl "https://app.autoescuelaamericana.com/api/cron/advance-chat-states?token=aea_webhook_2026"
```

### Secuencia de follow-ups

| Tiempo sin respuesta | Acción |
|---|---|
| 2h | Luz manda mensaje personalizado con nombre y curso |
| 24h | Luz manda mensaje de prueba social + aviso al admin |
| 72h | Último intento automático de Luz + aviso al admin |
| 7d | Lead pasa a `frio`, notificación al admin |

### Ver en Cloud Console

[console.cloud.google.com/cloudscheduler?project=aea-25-85385059-83402](https://console.cloud.google.com/cloudscheduler?project=aea-25-85385059-83402)

## Logs de producción

```bash
gcloud logging read 'resource.type="cloud_run_revision"' \
  --project=aea-25-85385059-83402 \
  --limit=50 \
  --format="value(timestamp,textPayload)"
```
