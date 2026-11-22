---
last_mapped_at: 2026-11-23
last_mapped_commit: de9d95337071737e9086c6a2a1c25d16e8454a48
---
# Testing Patterns

**Analysis Date:** 2026-11-23

## Test Framework

**Runner:**
- None. No test framework exists in this project. There is no `jest.config.*`, `vitest.config.*`, or any `*.test.*` / `*.spec.*` file anywhere in the repository.
- Verification is done through **automated script gates** plus manual checklist plus dev-tooling inspection.
- `package.json` scripts: `dev` (vite), `build` (vite build), `check:i18n` (node scripts/check-i18n-parity.mjs), `preview` (vite preview), `deploy` (vercel --prod). No `test` script.
- Dev dependencies are only `vite` and `@vitejs/plugin-basic-ssl` — no test runner installed.

**Assertion Library:**
- Not applicable for unit tests. `scripts/check-i18n-parity.mjs` performs its own key-set comparison with `Set` operations and `process.exit(1)` on failure.

**Run Commands:**
```bash
npm run build          # Primary automated gate — type-free bundle build
npm run check:i18n     # BM/EN dictionary key-set parity gate (LANG-03); exits 1 on mismatch
npm run dev            # Manual verification (HTTPS dev server, WebGPU context)
npm run preview        # Manual verification of production build
```

## Test File Organization

**Location:**
- No test files. The closest analog is `scripts/check-i18n-parity.mjs` — a standalone Node-native ESM script (zero dependencies), registered as the `check:i18n` npm script.

**Naming:**
- Verification scripts live in `scripts/` as `check-<topic>.mjs` (pattern: `check-i18n-parity.mjs`).

**Structure:**
- Each gate script imports the modules under test directly (`src/i18n/dictionaries/bm.js`, `en.js`), compares invariants, prints a bracketed-tag diagnostic (`[i18n] parity OK: ...` / `[i18n] keys missing in en.js: ...`), and exits non-zero on failure.

## Test Structure

**Suite Organization:**
- Not applicable — no suites. The parity gate is a single linear script with two failure branches (`scripts/check-i18n-parity.mjs:13-28`).

**Patterns:**
- Gate script pattern: import real source modules (no mocking needed — dictionaries are plain data) → diff key sets → `console.error` each missing-key list → `process.exit(1)` if any list is non-empty → success message with key count.

## Mocking

**Framework:**
- None.

**Patterns:**
- Not applicable. Gate scripts operate on real modules; manual verification operates on the running app.

**What to Mock:**
- Not applicable today. If Vitest is introduced, mock WebGPU/browser globals (`navigator.gpu`, `localStorage`) — never the TSL graphs themselves.

**What NOT to Mock:**
- Dictionary data modules (`src/i18n/dictionaries/*.js`) — the parity gate must run against the real files or it verifies nothing.

## Fixtures and Factories

**Test Data:**
- Not applicable. Static assets used by manual verification live in `public/` (e.g. `public/textures/water-splash.webp`, audio files referenced by `DEFAULT_URLS` in `src/ui/chrome/createAudioButton.js`). Dictionary keys (~81, identical sets in `src/i18n/dictionaries/bm.js` and `en.js`) serve as the de facto test data for the parity gate.

**Location:**
- `public/` for runtime assets; `scripts/` for gate scripts; no test fixture directory.

## Coverage

**Requirements:** None enforced — no coverage tooling.

**View Coverage:**
```bash
# Not available — no coverage tooling installed
```

## Test Types

**Unit Tests:**
- None exist. `npm run check:i18n` is the only automated content check.

**Integration Tests:**
- None exist.

**E2E Tests:**
- Not used. Browser verification is manual (dev server + visual checks per the AGENTS.md checklist).

## Actual Verification Approach (substitutes for tests)

This project verifies changes through build/parity gates plus a manual checklist plus dev-tooling inspection. The canonical **verification commands** to run after any change:

```bash
npm run build          # bundle gate — must succeed
npm run check:i18n     # dictionary parity — must print "[i18n] parity OK: bm.js and en.js both carry N keys"
```

`AGENTS.md` defines the manual **Verification checklist** for shader or pipeline changes:

1. `npm run build` succeeds — automated.
2. Dev: WebGPU context requires the HTTPS dev server (`vite.config.js` uses `@vitejs/plugin-basic-ssl`; run `npm run dev`).
3. Rain still collides — drops must not fall through roofs (collision height texture, `src/world/weather/createCollisionHeight.js` + `src/world/weather/createCollisionRain.js`).
4. No rain/sky in the height map — check the hide list in `src/world/weather/collisionHideObjects.js` if new transparent layers were added.
5. Mobile profile: no new full-res passes without a scale knob (budgets live in `src/platform/performanceProfile.js`).

**i18n verification additions (Phase 1):**

- Any dictionary edit requires `npm run check:i18n` to pass — BM and EN key sets must be identical (`scripts/check-i18n-parity.mjs`).
- Copy/UI changes: verify both languages render — the boot language is BM (`index.html` static baseline, `<html lang="ms">`); EN is dormant (no UI writes `setStoredLanguage` yet), so EN-state checking is done by temporarily calling `setLanguage("en")` / setting `localStorage["threejs-punk-language"] = "en"` in dev.
- Head/meta swaps: confirm `document.title`, the 8 mapped meta nodes, `og:locale` (`ms_MY`/`en_US`), and `<html lang>` change on `setLanguage` (`src/i18n/staticHead.js`); missed selectors warn `[i18n] head selector missed: ...` in dev.
- Missing keys warn `[i18n] missing key: ...` in dev (`src/i18n/i18n.js:52-58`) — watch the dev console when adding new UI.

**Grep-gate culture (manual, in lieu of lint rules):** conventions that have no lint enforcement are checked by grep before review:

- Hardcoded user-facing copy: grep UI factories for literal strings that should be `t("key")` — all user-visible text must come from the dictionaries.
- `innerHTML` in i18n paths: language refresh handlers (`syncText`) must use `textContent`/`setAttribute` only; grep for `innerHTML` inside `syncText` bodies (initial template construction with `t()` interpolation is the accepted pattern — `src/ui/chrome/createHeader.js:12-27`).
- Subscription leaks: every `subscribe(syncText)` should have a matching `unsubscribeLanguage?.()` in `destroy()` where a destroy exists (`src/ui/walk/createWalkPrompt.js`, `src/ui/walk/createWalkControlsHint.js`); page-lifetime factories (`src/ui/chrome/createHeader.js`) are the documented exception.
- Dictionary order: `bm.js`/`en.js` keys are alphabetical, one per line, append-only.
- GLSL under `src/`, `reflector()` in TSL `PassNode` graphs, CPU raycasts per drop, and `three` imports (instead of `three/webgpu` / `three/tsl`) — all banned, all grep-checkable per AGENTS.md hard constraints.

**Runtime inspection tooling (in lieu of assertions):**

- `window.__app` dev API (`src/debug/createDevAppApi.js`, gated by `import.meta.env.DEV`): exposes `scene`, `city`, `quadraCar`, `ground`, `rain`, `smoke`, `planes`, `sky`, plus `listObjectNames()` (console.table of scene objects) and `dumpCamera()` (JSON camera pose).
- `window.__app.perf` FPS A/B API (`src/debug/createPerformanceDevTools.js`): `__app.perf.set('groundReflection', false)`, `getFps()`, `getAdaptiveDpr()`, `printHelp()` — used to manually measure perf impact of `performanceProfile` flags.
- Feature toggles for manual matrix testing: `FEATURES` in `src/world/features.js` (strip order documented there and in `STRIP.md`).
- Device behavior testing: `src/platform/performanceProfile.js` (`applyDevicePerformanceDefaults` for mobile/Safari/Apple-mobile paths) and `src/platform/deviceLayout.js` — Safari and mobile devices are explicit manual-test targets per `AGENTS.md` hard constraints.
- Post-effect verification entry: `src/post/postprocessing.js` (`buildBeautyInput` / look composites) — checked visually via dev server.
- Inspector: three.js inspector session attachable in Development Mode (`src/debug/setupInspector.js`, `src/debug/createInspectorSession.js`).

**Perf A/B methodology** (from `src/platform/performanceProfile.js:1-4`): defaults favor optimized settings; flip individual flags in dev via `window.__app.perf` to A/B test FPS impact. This is the project's substitute for performance regression tests.

## Guidance for Adding Tests

If tests are introduced:

- Runner: Vitest is the natural fit (project is already Vite-based, ESM, `type: module`).
- Co-locate as `*.test.js` next to the module (matches existing flat, non-barrel structure — see CONVENTIONS.md "Module Design"); cross-cutting gate scripts go in `scripts/` as Node ESM (pattern: `scripts/check-i18n-parity.mjs`).
- Pure-logic candidates with no WebGPU dependency: `src/i18n/i18n.js` (`t()` lookup, interpolation, missing-key fallback, subscribe/unsubscribe contract), `src/i18n/dictionaries/*.js` (key parity, alphabetical order — extend beyond the current script), `src/world/loaders/meshUtils.js` (traversal helpers), `src/platform/deviceLayout.js` (UA/layout detection), `src/audio/audioState.js` (pub/sub store), `src/platform/userPreferences.js` (localStorage wrappers — needs a localStorage mock).
- TSL node graphs (`src/tsl/`) and pipeline code require a WebGPU context — unit testing them is not practical headlessly; keep verifying those through the AGENTS.md checklist and `window.__app` inspection instead.
- Any test scripts added to `package.json` must not break `npm run build` and `npm run check:i18n` as the existing verification gates.

## Common Patterns

**Gate script (the project's test analog):**
```javascript
// scripts/check-i18n-parity.mjs (abridged)
import { bm } from "../src/i18n/dictionaries/bm.js";
import { en } from "../src/i18n/dictionaries/en.js";

const missingInEn = [...new Set(Object.keys(bm))].filter((key) => !(key in en));
// ...same for missingInBm...
if (missingInEn.length || missingInBm.length) {
  console.error(`[i18n] keys missing in en.js: ${missingInEn.join(", ")}`);
  process.exit(1);
}
console.log(`[i18n] parity OK: bm.js and en.js both carry ${bmKeys.length} keys`);
```

**Async Testing:**
```javascript
// Not applicable — no async tests exist
```

**Error Testing:**
```javascript
// Not applicable — no tests exist; error paths verified manually (dev console warnings: [i18n], [warmup], [audio])
```

---

*Testing analysis: 2026-11-23*
