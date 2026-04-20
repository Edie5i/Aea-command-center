# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Is

A full-stack platform for **Auto Escuela Americana**, a driving school in Mexico City. It handles course scheduling, student management, an AI-powered chatbot, Google Calendar integration, WhatsApp notifications, and PDF generation for student progress notes.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit (TypeScript checking without build)
```

> Note: `next.config.js` silences TypeScript and ESLint errors during `build`. Use `typecheck` and `lint` explicitly to surface issues.

## Architecture

**Stack**: Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Google Genkit (Gemini) · Firebase App Hosting

### Key directories

| Path | Purpose |
|------|---------|
| `src/app/` | Pages and API routes (Next.js App Router) |
| `src/ai/` | Genkit AI setup and flows (chatbot, calendar event creation, student queries) |
| `src/services/` | Google Calendar and course data integrations (server-only) |
| `src/lib/` | Static knowledge bases: `bot-data.ts` (chatbot context), `course-data.ts` (curriculum), `reglamento-transito-data.ts` |
| `src/components/ui/` | shadcn/ui component library |

### App pages

- `/` — Landing page with Google Maps, testimonials
- `/agenda` — Lesson scheduling (form → Google Calendar event)
- `/chatbot` — Genkit-powered AI assistant (Gemini 1.5 Flash)
- `/evaluacion`, `/examen-teorico` — Student self-assessment and theory exam
- `/notas-alumno` — Student progress notes with jsPDF export
- `/admin` — Admin dashboard: calendar management and student list
- `/catalogo`, `/programa`, `/english-course` — Course info pages
- `/api/whatsapp` — WhatsApp webhook handler

### AI / Genkit

Flows live in `src/ai/flows/`. The chatbot passes the full knowledge base (`bot-data.ts`) as a JSON string to avoid vector indexing timeouts — it's a context-stuffing approach, not RAG. The `create-calendar-event.ts` flow is called from the agenda form to book lessons on Google Calendar.

### Google Calendar integration

`src/services/calendarService.ts` is server-only. It uses a service account whose JSON is stored base64-encoded in the `CALENDAR_KEY` secret. Timezone is always `America/Mexico_City`.

### Forms

React Hook Form + Zod validation throughout. Key forms: agenda booking, student notes (`notas-alumno`), satisfaction survey (`encuesta-satisfaccion`).

## Environment Variables

Injected via Firebase App Hosting secrets — no `.env.local` file in production. For local dev, create `.env.local` with:

```
GOOGLE_GENERATIVE_AI_API_KEY=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
GOOGLE_CALENDAR_ID=
CALENDAR_KEY=          # base64-encoded Google service account JSON
```

## Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
