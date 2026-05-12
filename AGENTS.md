# AI Agent Instructions

## Project context
- AML Dashboard Design prototype built with React + TypeScript + Vite.
- Project overview and Figma link: [README.md](README.md)

## Key commands
- Install deps: `npm i`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Tests: none configured

## Structure and ownership
- App entry: [src/main.tsx](src/main.tsx) and [src/app/App.tsx](src/app/App.tsx)
- Feature/UI components: [src/app/components/](src/app/components/)
- Shared UI primitives (shadcn/ui): [src/app/components/ui/](src/app/components/ui/)
- Decision logic: [src/app/components/decision-engine.ts](src/app/components/decision-engine.ts)
- Styling: [src/styles/](src/styles/) and [default_shadcn_theme.css](default_shadcn_theme.css)

## Project-specific guidance
- Prefer existing shadcn UI components before adding new UI libraries.
- Keep AML dashboard logic centralized; extend [src/app/components/decision-engine.ts](src/app/components/decision-engine.ts) for new rule logic when possible.
- For UX changes or rationale, review the evaluation notes: [EVALUATION.md](EVALUATION.md)
- Attributions for assets and libraries: [ATTRIBUTIONS.md](ATTRIBUTIONS.md)
- Optional guidelines template (empty unless filled): [guidelines/Guidelines.md](guidelines/Guidelines.md)
