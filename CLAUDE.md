# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Card Leader — a free, installable PWA that scans business cards in the browser and saves structured contacts to Google Sheets. React 19 + Vite + TypeScript frontend, two Netlify Functions as serverless proxies, and a Google Apps Script web app as the actual datastore writer. UI strings are Korean; the app handles Korean/English/Vietnamese cards.

## Commands

```bash
npm run dev      # Vite only — Netlify Functions do NOT run, so AI scan + Sheets save are broken
npx netlify-cli dev   # Run Vite + Functions together; required to test AI scan and Sheets save
npm run build    # tsc -b (typecheck) then vite build → dist/
npm run preview  # Serve the production build
npm run lint     # ESLint (flat config in eslint.config.js)
```

There is **no test runner wired up**. `@playwright/test` is a devDependency but there is no Playwright config or `test` script — don't assume `npm test` works.

## Critical dev gotcha

`npm run dev` serves the static app but **not** `/.netlify/functions/*`. Both AI scan (`gemini-card`) and every Sheets operation (`save-contact`) call those endpoints, so they fail silently under plain Vite. Use `npx netlify-cli dev` whenever touching those paths.

## Architecture & data flow

A single-screen app (`src/App.tsx` holds essentially all UI state). The pipeline:

1. **Image in** → `src/lib/imageProcessing.ts`. `preprocessImage` (for OCR) downscales to 1800px, applies grayscale + contrast + thresholding on a canvas to help Tesseract; `createPreviewImage` (for display/Gemini) downscales to 1400px. Both honor a manual rotation in 90° steps.
2. **Text out** — two independent paths, with different privacy properties:
   - **Local OCR** (`readBusinessCard`): dynamically imports `tesseract.js` with `['eng','kor','vie']` worker. Image **never leaves the browser**.
   - **Gemini AI** (`src/lib/gemini.ts` → `readBusinessCardWithAi`): sends the image to the `gemini-card` Function. Image **does** go to the server.
3. **Parse** → `src/lib/contactParser.ts`. Rule-based, score-driven extraction (`parseBusinessCard`) into a `Contact`. It scores each line for name/company/position/phone/address using bilingual keyword lists and heuristics (uppercase ratio, email-domain match, Korean/Vietnamese place patterns). Also computes a `confidence` and `isPossibleDuplicate`. The Gemini path bypasses this — Gemini returns already-structured fields.
4. **Persist** → `src/lib/sheets.ts`. `saveToGoogleSheet`/`deleteFromGoogleSheet` POST to the `save-contact` Function (action `upsert`/`delete`), which relays to the Apps Script web app. Contacts are also cached in `localStorage` (`src/lib/storage.ts`).

The `Contact` shape is defined once in `src/types.ts` and shared across frontend, the Gemini schema, and the Apps Script header order — **keep these three in sync** when adding a field.

## The serverless / backend split

- `netlify/functions/gemini-card.mjs` — proxies to the Gemini API. Reads `GEMINI_API_KEY` and `GEMINI_MODEL` (default `gemini-2.5-flash`) from env. Uses `responseJsonSchema` + `responseMimeType: application/json` to force structured output matching `contactSchema`.
- `netlify/functions/save-contact.mjs` — proxies to the Apps Script URL the user configured. Re-validates the endpoint (`https://script.google.com/.../macros/s/...`) before forwarding, and only reports success when Apps Script returns `{ ok: true }`.
- `apps-script/Code.gs` — **the real datastore logic, deployed separately inside Google Apps Script, not run by this repo.** Creates/migrates a `contacts` sheet, handles `upsert` (find-by-id then update or append) and `delete`, guarded by a script lock. The column/header order here is authoritative.

`SHEET_ID` appears in **two places** that must match: `src/lib/sheets.ts` (`DEFAULT_SHEET_ID`, used to generate the copy-paste Apps Script template) and the deployed `Code.gs`. The in-app Settings panel lets a user override both the Sheet ID and the Apps Script URL at runtime (stored in `localStorage`).

## Security boundary (do not break)

`GEMINI_API_KEY` must live **only** in Netlify Function env vars. Never put it in frontend code or any `VITE_`-prefixed variable — those get bundled into shipped JS and leak. The Functions exist primarily to keep this secret server-side. `.env` (gitignored) is for local Function dev; only `.env.example` is committed.

## Conventions

- localStorage keys are versioned (`card-leader.*.v1`) with fallback reads of legacy `card-ledger.*` keys — preserve this migration pattern when changing storage.
- Apps Script `Code.gs` uses trailing-underscore naming (`ensureContactsSheet_`) for private helpers, per GAS convention.
- PWA: `public/service-worker.js` is network-first with cache fallback; bump `CACHE_NAME` when changing cached assets. Registered in `src/main.tsx`.

## Deploy

Netlify (`netlify.toml`: build `npm run build`, publish `dist`, functions `netlify/functions`). The Apps Script web app is deployed independently in Google's editor (run `setup()` once to authorize, then deploy as a web app with "Anyone" access for a personal MVP).
