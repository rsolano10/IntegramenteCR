# IntegraMente en Casa

Estimulación cognitiva y acompañamiento domiciliario. Una plataforma, tres modalidades (Autoguiado, Orientado, Clínico), tres roles (familiar administrador, persona participante, profesional).

This is the working baseline for the real product: a fully responsive (phone/tablet/desktop) React app implementing the landing page, the sales funnel, the full adaptive onboarding conversation, and the three role-based app experiences (familiar, participante, profesional). There's no backend yet — everything runs against an in-memory Zustand store and mock data — but the routing, component structure, data model, and rules engine are meant to be the real foundation, not a throwaway prototype.

## Status

🚧 Pre-alpha / no backend. All data is seeded mock data and resets on page reload or logout. Auth is unvalidated (any password works; role is inferred from the email prefix). Treat this as the UI/UX and architecture baseline the real backend and auth will be built against.

## Features

- **Landing page** — marketing site, plan-selection funnel (`/planes/:plan`), forgot-password flow, legal pages (`/legal/:doc`).
- **Onboarding** — a long, fully adaptive, one-question-per-screen conversational flow (role-based branching, diagnosis-conditional modules), backed by an internal clinical scoring engine that computes five independent severity profiles (never shown to the family user).
- **Familiar app** — Hoy (today's activity + registro), Plan (list and calendar views, multiple tasks per day), Actividades (filterable content library), Dudas (chat assistant with keyword-based safety escalation).
- **Participante app** — a single-focus, large-touch-target flow for the person receiving care (no navigation, no risk screens).
- **Profesional app** — patient panel, ficha, plan editor, alert triage — responsive down to a stacked-card mobile layout.
- **Safety screens** — dedicated full-screen flows for caída, ideación, maltrato, extravío, cambio agudo, and rechazo repetido, reachable from their natural in-flow triggers.

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [React Router v6](https://reactrouter.com/) — one real URL per screen, nested layouts for the familiar/participante shells
- [Zustand](https://github.com/pmndrs/zustand) — session, onboarding answers, plan/registro, chat and audit-log state (`src/lib/store.ts`)
- [Tailwind CSS v4](https://tailwindcss.com/) — design tokens defined in the `@theme` block in `src/index.css`

## Getting started

Requires **Node 20+**.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build (tsc + vite build)
npm run preview   # preview the production build locally
```

### Demo accounts (`/app/login`, any password works)

| Email | Lands as |
|---|---|
| `familiar@test.com` | Marcela — organiza el cuidado de Rosa |
| `paciente@test.com` | Rosa — vista simplificada de participante |
| `clinica@test.com` | Dra. Guiselle Solano — panel clínico |

## Project structure

```
src/
  lib/
    store.ts             Zustand store (session, onboarding answers, plan, chat, audit log)
    onboardingSchema.ts   the ~50-screen adaptive onboarding conversation, as data
    clinicalEngine.ts     internal 5-profile severity scoring (never shown to the user)
    chatbot.ts             Dudas chat: keyword classification + safety escalation
    mockData.ts             seed data (participant, plan, library, clinic patients, plan tiers...)
    rules.ts                 semáforo presentation lookup, rechazo-trigger helper, audit entries
  components/
    ui/                    design-system component catalog (Button, Modal, SemaforoChip, ...)
    layout/                AppHeader, FamiliarShell + FamiliarNav, ParticipantShell
  pages/
    onboarding/            the adaptive onboarding screen renderer
    familiar/               Hoy, Plan, Actividades, Asistente, Revision, Resumen
    participante/            Gustos, Hoy, Pasos, Ayuda
    profesional/             Panel, Ficha, Editor, Alerta
    alertas/                  the 6 safety/urgency screens
    estados/                   empty and offline states
    Landing.tsx, Login.tsx, Consent.tsx, ForgotPassword.tsx, PlanCheckout.tsx, LegalPage.tsx
```

## Non-negotiable product rules

Carried over from the product handoff this baseline was built from:

- No screen diagnoses, interprets clinical tests, or suggests medication changes.
- Safety is evaluated before content is ever shown.
- Status is always communicated as dot + word, never color alone — and the internal clinical profiles are never surfaced to the family/participant, only used to personalize content.
- Body text is ≥16px everywhere; the participant view is ≥20px with 44px+ touch targets.
- `prefers-reduced-motion` disables transitions; alert/urgency screens never animate.

## Contributing

This is currently a single-owner baseline, not yet open for outside contributions. If that changes, add a `CONTRIBUTING.md` with the branching/PR conventions at that point.

## License

Proprietary — all rights reserved. No license is granted for reuse until this repository's visibility/licensing is explicitly decided.
