---
last_mapped_at: 2026-11-23
last_mapped_commit: de9d95337071737e9086c6a2a1c25d16e8454a48
---
# Coding Conventions

**Analysis Date:** 2026-11-23

## Naming Patterns

**Files:**
- camelCase with a `create*` prefix for factory modules: `createWorld.js`, `createRenderLoop.js`, `createCollisionRain.js`, `createAppShell.js`. The factory function inside matches the filename exactly (`createWorld.js` exports `createWorld`).
- Non-factory modules are plain camelCase nouns: `features.js`, `audioState.js`, `i18n.js`, `bvh.js`, `warmup.js`, `surfaceRain.js`, `meshUtils.js`.
- Co-located CSS files share the component's name: `audioButton.css` next to `createAudioButton.js`, `settingsPanel.css` next to `createSettingsPanel.js`.
- Directories are camelCase by domain: `src/world/weather/`, `src/ui/chrome/`, `src/post/look/`, `src/i18n/`.

**Functions:**
- `createX` for async or sync factories returning a composed object: `createCollisionRain` (`src/world/weather/createCollisionRain.js`), `createWalkControls` (`src/controls/createWalkControls.js`).
- `applyX` for mutation-style entry points: `applyCarSurfaceRain` (`src/world/car/applyCarSurfaceRain.js`), `applyBillboardMaterials` (`src/world/billboards/applyBillboardMaterials.js`), `applyEnvironmentMap` (`src/world/envMap.js`), `applyDevicePerformanceDefaults` (`src/platform/performanceProfile.js`), `applyStaticHead` (`src/i18n/staticHead.js`).
- `loadX` for asset loaders: `loadCityModel`, `loadQuadraCar`, `loadBillboards`, `loadEnvironmentMap`.
- `attachX` for optional late-bound wiring: `attachDevAudio`, `attachDevPerf` (`src/debug/createDevAppApi.js`).
- `syncX` / `setX` / `getX` for controller methods: `syncLighting`, `syncCameras`, `setBloomEnabled`, `getStaticPixelRatio`; i18n: `getLanguage` / `setLanguage` (`src/i18n/i18n.js`).
- `t(key, vars)` — the dictionary lookup function (short name, exported from `src/i18n/i18n.js`); used inline in template literals and inside `syncText` handlers.
- `syncText` — the reserved name for the language-refresh callback passed to `subscribe()` in every copy-bearing UI factory (`src/ui/chrome/createHeader.js:39`, `src/ui/chrome/createAboutPanel.js:93`, `src/ui/walk/createWalkPrompt.js:43`, `src/ui/walk/createWalkControlsHint.js:143`).
- `unsubscribeLanguage` — reserved name for the return value of `subscribe(syncText)` (an unsubscribe closure); `unsubscribeWalk` / `unsubscribeState` / `unsubscribeLayout` follow for other stores.
- Internal helpers are unexported camelCase functions or arrow consts: `setRainLayer`, `loadTexture` (`src/world/weather/createCollisionRain.js`), `interpolate` (`src/i18n/i18n.js:36`), `isEditableTarget` (`src/controls/createWalkControls.js`).

**Variables:**
- SCREAMING_SNAKE_CASE module constants: `MAX_COUNT`, `SPLASH_FRAMES`, `DEFAULT_RAIN_AREA` (`src/world/weather/createCollisionRain.js`), `MOVE_EPSILON`, `KEY_MAP` (`src/controls/createWalkControls.js`), `HASHSCALE3`, `CELL_COUNT` (`src/tsl/rainRipples.js`), `DICTIONARIES` (`src/i18n/i18n.js:14`), `SELECTOR_MAP` (`src/i18n/staticHead.js:17`), `LANGUAGE_KEY` (`src/platform/userPreferences.js:3`).
- `u`-prefixed names for TSL uniforms: `uTime`, `uCameraPos`, `uSplashOpacity` (`src/world/weather/createCollisionRain.js`).
- `DEFAULTS` / `DEFAULT_*` objects for tunable parameter blocks merged into factory options (`src/controls/createWalkControls.js`).
- Leading-underscore scratch objects at module scope: `_cameraDirection` (`src/world/weather/createCollisionRain.js`).
- `params` for the mutable runtime-tuning object returned from factories; `settings` for user-facing control config; `performanceProfile` for global perf flags; `currentLanguage` + `listeners` for the i18n module state.

**Types:**
- Plain JavaScript, no TypeScript. JSDoc comments carry type hints and decision references where ambiguity exists (`src/i18n/i18n.js:9-13` annotates the pub/sub shape with D-01/D-02 decision IDs; `src/tsl/boxBlur.js` uses `{@link ...}` reference comments).

## Code Style

**Formatting:**
- No formatter config detected (no `.prettierrc`, `.editorconfig`, or Biome config). Style is consistent by hand:
  - Double quotes for strings throughout.
  - 2-space indentation.
  - Semicolons present.
  - Trailing commas in multi-line literals.
  - Named imports wrapped in braces with one import per module (`import { t, subscribe } from "../../i18n/i18n.js"`).
- Lines commonly run past 100 chars; no enforced column limit.

**Linting:**
- No ESLint, Biome, or Stylelint config detected. `AGENTS.md` hard constraints substitute for lint rules:
  - Import from `three/webgpu` and `three/tsl` only — never `three`.
  - No custom GLSL under `src/` — prefer TSL `Fn`, node materials, `RenderPipeline`.
  - No CPU raycasts per rain drop.
  - New expensive work must be half-res, frame-skipped, or distance-faded (see `src/platform/performanceProfile.js`).
  - **No hardcoded user-facing copy** — all strings come from `src/i18n/dictionaries/`; parity is machine-checked (`npm run check:i18n`).

## i18n Conventions (mandatory for all UI copy)

The project is bilingual: BM (Bahasa Melayu) is the default/boot language, EN is the secondary. All conventions live around `src/i18n/`.

**Dictionary lookup (`t()`):**
- Import `{ t }` from `src/i18n/i18n.js`. Flat dot-notation keys (`"walkControls.calloutSprintTitle"`) — dots are cosmetic namespacing, there is no path traversal (`src/i18n/i18n.js:44-61`).
- `{var}` interpolation via the second argument: `t("loader.ariaLoading", { percent, status })`.
- Missing key: `console.warn("[i18n] missing key: ...")` in dev, key string returned in all environments (`src/i18n/i18n.js:52-58`). EN is the silent fallback for any key missing in the active dictionary.

**Subscription pattern (`syncText` + `unsubscribeLanguage`):**
- Build initial markup with `t()` in template literals, then register a refresh handler:
  ```javascript
  function syncText() {
    labelEl.textContent = t("header.about");
    button.setAttribute("aria-label", t("header.aboutAria"));
  }
  const unsubscribeLanguage = subscribe(syncText);
  ```
  (`subscribe` fires immediately with `{ language }`, so `syncText` also runs once at construction — `src/i18n/i18n.js:78-82`.)
- `syncText` must use **`textContent` and `setAttribute` only — never `innerHTML`** (innerHTML would destroy listeners and re-parse markup).
- Factories with a `destroy()` must call `unsubscribeLanguage?.()` in it (`src/ui/walk/createWalkPrompt.js:124`, `src/ui/walk/createWalkControlsHint.js:245`); page-lifetime factories (e.g. `src/ui/chrome/createHeader.js:50`) store the unsubscribe but deliberately never release it.

**data-i18n walker (bulk copy blocks):**
- For elements whose whole body is a translated string, tag them in the template with `data-i18n="key"` (text content) or `data-i18n-aria="key"` (aria-label), pre-fill with `${t("key")}`, and walk them in `syncText`:
  ```javascript
  for (const el of root.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of root.querySelectorAll("[data-i18n-aria]")) {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  }
  ```
  Pattern: `src/ui/chrome/createAboutPanel.js:36-72, 93-102`.

**Dictionaries:**
- `src/i18n/dictionaries/bm.js` and `src/i18n/dictionaries/en.js` — flat objects, one key per line, **alphabetically ordered, append-only** (EN values are the pre-localization strings verbatim).
- Both files MUST carry identical key sets — enforced by `scripts/check-i18n-parity.mjs` (`npm run check:i18n`).
- Brand string "THREEJS-PUNK" / "BY ADRI 'C-FU'" stays hardcoded in both languages (deliberate, see comment in `src/ui/chrome/createAboutPanel.js`).

**Static head / BM baseline:**
- `index.html` is a **BM static baseline**: `<html lang="ms">` with hardcoded BM copy. Head meta is swapped at boot and on language change by `applyStaticHead()` (`src/i18n/staticHead.js`) using a SELECTOR_MAP (not `data-i18n` — the head is ~20 stable nodes). `setLanguage()` maps BM → `"ms"`, EN → `"en"` on `document.documentElement` (`src/i18n/i18n.js:73`).
- `og:locale` values: `ms_MY` / `en_US` (`src/i18n/staticHead.js:43-47`).
- `src/i18n/i18n.js` and `staticHead.js` call each other only at runtime, never at module-eval time (import-cycle safety).
- Language persistence: `localStorage["threejs-punk-language"]` via `getStoredLanguage`/`setStoredLanguage` (`src/platform/userPreferences.js:46-64`); the stored `"en"` restore path runs at i18n module eval, before any listener registers.

## Import Organization

**Order:**
1. Side-effect CSS imports first (`import "./audioButton.css";` at top of `src/ui/chrome/createAudioButton.js`; `import "./ui/core/global.css";` first line of `src/main.js`).
2. Package imports (`three/webgpu`, `three/tsl`, `three-mesh-bvh`).
3. Relative imports, roughly depth-ascending (siblings, then `../platform/...`, `../../i18n/i18n.js`, etc.).

**Path Aliases:**
- None. All internal imports use relative paths with explicit `.js` extensions (`from "../platform/performanceProfile.js"`).

## Error Handling

**Patterns:**
- Top-level async boot wraps everything in `.catch` with user-facing loader failure text plus `console.error` (`src/main.js:51-54`).
- Best-effort subsystems log-and-continue: deferred shader compile warns via `console.warn("[warmup] ...")` (`src/main.js:260-262`), footstep audio warns `console.warn("[audio] Footsteps disabled:", error)` and degrades silently (`src/audio/createWetFootstepAudio.js`).
- Promise-wrapped callbacks for loaders: `loadTexture` in `src/world/weather/createCollisionRain.js` converts `TextureLoader.load` into a `new Promise((resolve, reject) => ...)`.
- Feature-disabled code paths return `null` rather than throwing; callers use optional chaining (`world.rain?.update(...)`, `world.billboards?.userData?...` in `src/runtime/createRenderLoop.js`, `Promise.resolve(null)` placeholders in `src/world/createWorld.js`).
- Defensive optional-call contracts between modules: `requestShadowMapUpdate?.("lighting")` (`src/world/createWorld.js`), `perf.setAoEnabled?.(...)` (`src/platform/performanceProfile.js`), `getAllowAdaptiveSample?.() ?? true` (`src/debug/createPerformanceDevTools.js`).
- i18n degradation: missing keys warn in dev and return the key string; missing head selectors warn and skip (`src/i18n/staticHead.js:33-36`); `localStorage` access wrapped in try/catch with silent fallback (`src/platform/userPreferences.js`).

## Logging

**Framework:** `console` only — no logging library.

**Patterns:**
- Tag-prefixed, bracketed messages: `[warmup]`, `[renderer]`, `[audio]`, `[perf]`, `[smoke]`, `[planes]`, `[CloudSky]`, `[i18n]`, `[dev]`.
- `console.error` reserved for boot failure and the parity script; `console.warn` for degraded subsystems (including missing i18n keys/selectors); `console.info`/`console.log`/`console.table` for dev-tooling output gated behind `import.meta.env.DEV` (`src/debug/createDevAppApi.js`, `src/debug/createPerformanceDevTools.js:114-116`).
- Runtime A/B debugging happens through `window.__app` / `window.__app.perf` console APIs, never through permanent logs.

## Comments

**When to Comment:**
- Module-header block comments explaining purpose, device caveats, and tuning strategy (`src/world/features.js` strip-order header, `src/i18n/staticHead.js:1-13` selector-map rationale + cycle-safety note).
- Inline "why" comments referencing decision IDs for planned work: D-01..D-08 markers in `src/i18n/i18n.js` (`// Dormant EN restore path (D-05)`, `// D-06`), research references like `// Page-lifetime subscription (research A4)` (`src/ui/chrome/createHeader.js:47-49`).
- JSDoc on exported functions where the name alone is insufficient: `t()` missing-key behavior (`src/i18n/i18n.js:44-48`), `/** Standing eye height scale while crouched (toggle with C). */` (`src/controls/createWalkControls.js:9`).

**JSDoc/TSDoc:**
- Used selectively, not exhaustively. Reference credits use `{@link ...}`: box blur reference in `src/tsl/boxBlur.js:57-59`.
- Technique deep-dives live in `docs/techniques/*.md` and are linked from `AGENTS.md` rather than duplicated in source comments.

## Function Design

**Size:** Factories are long (100-500 lines) by design — one module owns one composed subsystem. Keep helpers small and unexported; extract shared helpers to `meshUtils.js`-style utility modules.

**Parameters:**
- Single destructured options object with defaults, including `= null` / `= {}` fallbacks: `createCollisionRain({ scene, renderer, collisionHeight, camera = null, count = DEFAULT_COUNT, ... } = {})` (`src/world/weather/createCollisionRain.js`); `t(key, vars = {})` (`src/i18n/i18n.js:49`).
- Callbacks passed as getter functions to avoid temporal-dead-zone ordering issues: `getSunLight: () => sunLight`, `getWalkControls: () => cameraDirector.walkControls`, `getFinishedIntro: () => appShell?.isFinishedIntro?.() ?? false` (`src/main.js`).

**Return Values:**
- Factories return plain object "controller" bags: mutable `params`, update functions, and named handles (`createWalkControls` returns handlers + state; `createWorld` returns `{ city, billboards, car, ground, rain, smoke, planes, sky, colliders, ... }` — `src/world/createWorld.js`).
- Optional subsystems return `null` when their feature flag is off; downstream code must use `?.`.
- `subscribe()` returns an unsubscribe closure (`() => listeners.delete(listener)` — `src/i18n/i18n.js:81`); `t()` always returns a string (the translation, an interpolated value, or the key itself).
- Small utilities return direct values (`findMeshByName` returns the mesh or `null` — `src/world/loaders/meshUtils.js`).

## Module Design

**Exports:**
- Named exports only; exactly one `export default` exists in the codebase (`src/tsl/edgeChromaticAberration.js`), which is the exception (a TSL node class following three.js addon convention). New code should use named exports.
- Two classes exist for three.js-interop reasons: `CollisionHeight` (`src/world/weather/createCollisionHeight.js`) and `EdgeChromaticAberrationNode extends TempNode` (`src/tsl/edgeChromaticAberration.js`). Everything else uses factory functions returning closures — prefer factories.
- Store modules export a function group: `src/i18n/i18n.js` exports `t`, `getLanguage`, `setLanguage`, `subscribe`; `src/audio/audioState.js` follows the same shape.

**Barrel Files:**
- None. Every import targets a specific module file directly.

**Composition pattern (do not break):**
- `src/main.js` builds plain objects — `world`, `pipeline`, `cameraDirector`, `renderLoop`, `appShell` — and wires them by passing options objects with getter callbacks. The render loop (`src/runtime/createRenderLoop.js`) calls world updates in a fixed order, then `post.render()`.
- Global mutable modules are limited to: `performanceProfile` (`src/platform/performanceProfile.js`), `FEATURES` (`src/world/features.js`), audio state store (`src/audio/audioState.js`), and the i18n language store (`src/i18n/i18n.js` — all three follow the pub/sub `subscribe()`/`notify()` pattern).
- Feature toggles: add a flag to `FEATURES` in `src/world/features.js`; perf budgets: add a flag plus resolution scale to `performanceProfile` in `src/platform/performanceProfile.js` (default off or half-res if costly).
- Copy changes: add keys to both dictionaries alphabetically, then run `npm run check:i18n` — never hardcode UI strings.
- Dev-only code: gate behind `import.meta.env.DEV` and attach to `window.__app` (see `src/debug/createDevAppApi.js`).

**TSL conventions:**
- Shader logic is built with `Fn(([args]) => ...)` node functions, never GLSL strings (`src/tsl/rainRipples.js`, `src/tsl/surfaceRain.js`).
- Reusable node graphs live in `src/tsl/` and are wired from `src/world/` or `src/post/`; use `uniform()` for per-frame values, `instancedArray()` for GPU buffers, TSL `If`/`Loop` for control flow (`src/world/weather/createCollisionRain.js`).
- Node materials: `MeshStandardNodeMaterial` / `NodeMaterial` from `three/webgpu` with `material.outputNode` / `roughnessNode` / `normalNode` overrides.

---

*Convention analysis: 2026-11-23*
