---
last_mapped_commit: 8cc20593b2270e2ce832e7b7b44356705daddec4
last_mapped_at: 2026-11-22
---
# Testing Patterns

**Analysis Date:** 2026-11-22

## Test Framework

**Runner:**
- None. No test framework exists in this project. There is no `jest.config.*`, `vitest.config.*`, or any `*.test.*` / `*.spec.*` file anywhere in the repository.
- `package.json` (`package.json`) contains only: `dev` (vite), `build` (vite build), `preview` (vite preview), `deploy` (vercel --prod). No `test` script.
- Dev dependencies are only `vite` and `@vitejs/plugin-basic-ssl` — no test runner installed.

**Assertion Library:**
- Not applicable.

**Run Commands:**
```bash
npm run build          # Only automated verification gate (type-free bundle build)
npm run dev            # Manual verification (HTTPS dev server, WebGPU context)
npm run preview        # Manual verification of production build
```

## Test File Organization

**Location:**
- Not applicable — no test files exist.

**Naming:**
- Not applicable.

**Structure:**
- Not applicable.

## Test Structure

**Suite Organization:**
- Not applicable — no test suites exist.

**Patterns:**
- Not applicable.

## Mocking

**Framework:**
- None.

**Patterns:**
- Not applicable.

**What to Mock:**
- Not applicable.

**What NOT to Mock:**
- Not applicable.

## Fixtures and Factories

**Test Data:**
- Not applicable. Static assets used by manual verification live in `public/` (e.g. `public/textures/water-splash.webp`, audio files referenced by `DEFAULT_URLS` in `src/ui/chrome/createAudioButton.js`).

**Location:**
- `public/` for runtime assets; no test fixture directory.

## Coverage

**Requirements:** None enforced — no coverage tooling.

**View Coverage:**
```bash
# Not available — no coverage tooling installed
```

## Test Types

**Unit Tests:**
- None exist.

**Integration Tests:**
- None exist.

**E2E Tests:**
- Not used.

## Actual Verification Approach (substitutes for tests)

This project verifies changes through a build gate plus manual checklist plus dev-tooling inspection. `AGENTS.md` defines the canonical **Verification checklist** to run after any shader or pipeline change:

1. `npm run build` succeeds — the only automated check.
2. Dev: WebGPU context requires the HTTPS dev server (`vite.config.js` uses `@vitejs/plugin-basic-ssl`; run `npm run dev`).
3. Rain still collides — drops must not fall through roofs (collision height texture, `src/world/weather/createCollisionHeight.js` + `src/world/weather/createCollisionRain.js`).
4. No rain/sky in the height map — check the hide list in `src/world/weather/collisionHideObjects.js` if new transparent layers were added.
5. Mobile profile: no new full-res passes without a scale knob (budgets live in `src/platform/performanceProfile.js`).

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
- Co-locate as `*.test.js` next to the module (matches existing flat, non-barrel structure — see CONVENTIONS.md "Module Design").
- Pure-logic candidates with no WebGPU dependency: `src/world/loaders/meshUtils.js` (traversal helpers), `src/platform/deviceLayout.js` (UA/layout detection), `src/audio/audioState.js` (pub/sub store), `src/platform/userPreferences.js` (localStorage wrappers).
- TSL node graphs (`src/tsl/`) and pipeline code require a WebGPU context — unit testing them is not practical headlessly; keep verifying those through the AGENTS.md checklist and `window.__app` inspection instead.
- Any test scripts added to `package.json` must not break `npm run build` as the existing verification gate.

## Common Patterns

**Async Testing:**
```javascript
// Not applicable — no tests exist
```

**Error Testing:**
```javascript
// Not applicable — no tests exist
```

---

*Testing analysis: 2026-11-22*
