# Catalyst Discovery MVP (AI-for-Bharat)

Reaction-aware catalyst discovery UI with multi-agent orchestration, pathway simulation, and visualization.

## Local development

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

## Build and run locally

```bash
npm run build
npm run preview
```

Preview serves the production build from `dist/`.

## Lint

```bash
npm run lint
```

## Deploy on Vercel

This repo is directly deployable on Vercel as a Vite static app.

### Option A — Vercel Dashboard
1. Import this Git repository into Vercel.
2. Framework preset: **Vite**.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Install command: `npm install`
### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

## Useful commands summary

- `npm install` — install dependencies (peer-conflict safe via `.npmrc` legacy setting)
- `npm run dev` — start local dev server
- `npm run build` — create production build
- `npm run preview` — run built app locally
- `npm run lint` — run lint checks
