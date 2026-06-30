# SeeFood 🌭

> "It's like Shazam, but for food." — Jian-Yang, *Silicon Valley*

Upload a photo of any dish and SeeFood tells you **what it is**, gives you
**estimated nutrition facts**, lists **likely ingredients**, and links you to
**recipes**. Built with Angular + a Netlify serverless function that proxies
Google's **Gemini** vision model.

(And yes — it correctly identifies a hotdog. It also handles *not* hotdog.)

## How it works

```
Browser (Angular)  ──image──▶  Netlify Function  ──▶  Gemini API
   upload UI                   /api/analyze            (vision + JSON)
        ◀──── structured nutrition JSON ────────────────────┘
```

The Gemini API key lives **only** in the Netlify function (server-side), so it
never ships to the browser. The function asks Gemini for a strict JSON schema,
so the frontend always gets clean, typed data back.

## Prerequisites

- Node 18+ and npm
- A free Gemini API key → https://aistudio.google.com/apikey

## Local development

```bash
npm install
npm install -g netlify-cli      # one-time, for running functions locally

cp .env.example .env            # then paste your GEMINI_API_KEY into .env
netlify dev                     # serves the app + /api/analyze together
```

Open the URL Netlify prints (usually http://localhost:8888).

> Running plain `ng serve` works for the UI, but `/api/analyze` won't exist —
> use `netlify dev` so the function is available.

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from Git**, pick the repo.
3. Build settings are read automatically from [`netlify.toml`](./netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist/seefood/browser`
   - Functions directory: `netlify/functions`
4. **Site settings → Environment variables**, add:
   - `GEMINI_API_KEY` = your key
   - *(optional)* `GEMINI_MODEL` = `gemini-2.5-flash`
5. Deploy. Done.

## Project layout

| Path | What |
| --- | --- |
| `netlify/functions/analyze.mjs` | Secure Gemini proxy, structured-output schema |
| `src/app/core/services/seefood.service.ts` | Frontend client for `/api/analyze` (+ image downscaling) |
| `src/app/core/models/food-result.model.ts` | Typed result shape |
| `src/app/features/food-analyzer/` | Upload UI, preview, and results card |
| `src/app/app.component.*` | App shell (branding + hosts the feature) |
| `netlify.toml` | Build, functions, dev, and SPA redirect config |

## Notes

- Nutrition values are AI **estimates** — fun and useful, not medical advice.
- Recipe links open a recipe search (not a single hard-coded URL), so they
  don't break and always reflect real results.
