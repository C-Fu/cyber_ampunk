---
last_mapped_commit: 8cc20593b2270e2ce832e7b7b44356705daddec4
last_mapped_at: 2026-11-22
---
# Coding Conventions

**Analysis Date:** 2026-11-22

## Naming Patterns

**Files:**
- camelCase with a `create*` prefix for factory modules: `createWorld.js`, `createRenderLoop.js`, `createCollisionRain.js`, `createAppShell.js`. The factory function inside matches the filename exactly (`createWorld.js` exports `createWorld`).
- Non-factory modules are plain camelCase nouns: `features.js`, `audioState.js`, `bvh.js`, `warmup.js`, `surfaceRain.js`, `meshUtils.js`.
- Co-located CSS files share the component's name: `audioButton.css` next to `createAudioButton.js`, `settingsPanel.css` next to `createSettingsPanel.js`.
- Directories are camelCase by domain: `src/world/weather/`, `src/ui/chrome/`, `src/post/look/`.

**Functions:**
- `createX` for async or sync factories returning a composed object: `createCollisionRain` (`src/world/weather/createCollisionRain.js`), `createWalkControls` (`src/controls/createWalkControls.js`).
- `applyX` for mutation-style entry points: `applyCarSurfaceRain` (`src/world/car/applyCarSurfaceRain.js`), `applyBillboardMaterials` (`src/world/billboards/applyBillboardMaterials.js`), `applyEnvironmentMap` (`src/world/envMap.js`), `applyDevicePerformanceDefaults` (`src/platform/performanceProfile.js`).
- `loadX` for asset loaders: `loadCityModel`, `loadQuadraCar`, `loadBillboards`, `loadEnvironmentMap`.
- `attachX` for optional late-bound wiring: `attachDevAudio`, `attachDevPerf` (`src/debug/createDevAppApi.js`).
- `syncX` / `setX` / `getX` for controller methods: `syncLighting`, `syncCameras`, `setBloomEnabled`, `getStaticPixelRatio`.
- Internal helpers are unexported camelCase functions or arrow consts: `setRainLayer`, `loadTexture` (`src/world/weather/createCollisionRain.js`), `isEditableTarget`, `expLerpFactor` (`src/controls/createWalkControls.js`).

**Variables:**
- SCREAMING_SNAKE_CASE module constants: `MAX_COUNT`, `SPLASH_FRAMES`, `DEFAULT_RAIN_AREA` (`src/world/weather/createCollisionRain.js`), `MOVE_EPSILON`, `KEY_MAP` (`src/controls/createWalkControls.js`), `HASHSCALE3`, `CELL_COUNT` (`src/tsl/rainRipples.js`).
- `u`-prefixed names for TSL uniforms: `uTime`, `uCameraPos`, `uSplashOpacity` (`src/world/weather/createCollisionRain.js`).
- `DEFAULTS` / `DEFAULT_*` objects for tunable parameter blocks merged into factory options (`src/controls/createWalkControls.js`).
- Leading-underscore scratch objects at module scope: `_cameraDirection` (`src/world/weather/createCollisionRain.js`).
- `params` for the mutable runtime-tuning object returned from factories; `settings` for user-facing control config; `performanceProfile` for global perf flags.

**Types:**
- Plain JavaScript, no TypeScript. JSDoc comments carry type hints where ambiguity exists (`src/tsl/boxBlur.js` uses `{@link ...}` reference comments).

## Code Style

**Formatting:**
- No formatter config detected (no `.prettierrc`, `.editorconfig`, or Biome config). Style is consistent by hand:
  - Double quotes for strings throughout.
  - 2-space indentation.
  - Semicolons present.
  - Trailing commas in multi-line literals.
  - Named imports wrapped in braces with one import per module (`import { Fn, If, billboarding, ... } from "three/tsl"`).
- Lines commonly run past 100 chars; no enforced column limit.

**Linting:**
- No ESLint, Biome, or Stylelint config detected. `AGENTS.md` hard constraints substitute for lint rules:
  - Import from `three/webgpu` and `three/tsl` only — never `three`.
  - No custom GLSL under `src/` — prefer TSL `Fn`, node materials, `RenderPipeline`.
  - No CPU raycasts per rain drop.
  - New expensive work must be half-res, frame-skipped, or distance-faded (see `src/platform/performanceProfile.js`).

## Import Organization

**Order:**
1. Side-effect CSS imports first (`import "./audioButton.css";` at top of `src/ui/chrome/createAudioButton.js`; `import "./ui/core/global.css";` first line of `src/main.js`).
2. Package imports (`three/webgpu`, `three/tsl`, `three-mesh-bvh`).
3. Relative imports, roughly depth-ascending (siblings, then `../platform/...`, etc.).

**Path Aliases:**
- None. All internal imports use relative paths with explicit `.js` extensions (`from "../platform/performanceProfile.js"`).

## Error Handling

**Patterns:**
- Top-level async boot wraps everything in `.catch` with user-facing loader failure text plus `console.error` (`src/main.js:51-54`).
- Best-effort subsystems log-and-continue: deferred shader compile warns via `console.warn("[warmup] ...")` (`src/main.js:260-262`), footstep audio warns `console.warn("[audio] Footsteps disabled:", error)` and degrades silently (`src/audio/createWetFootstepAudio.js`).
- Promise-wrapped callbacks for loaders: `loadTexture` in `src/world/weather/createCollisionRain.js` converts `TextureLoader.load` into a `new Promise((resolve, reject) => ...)`.
- Feature-disabled code paths return `null` rather than throwing; callers use optional chaining (`world.rain?.update(...)`, `world.billboards?.userData?...` in `src/runtime/createRenderLoop.js`, `Promise.resolve(null)` placeholders in `src/world/createWorld.js`).
- Defensive optional-call contracts between modules: `requestShadowMapUpdate?.("lighting")` (`src/world/createWorld.js`), `perf.setAoEnabled?.(...)` (`src/platform/performanceProfile.js`), `getAllowAdaptiveSample?.() ?? true` (`src/debug/createPerformanceDevTools.js`).

## Logging

**Framework:** `console` only — no logging library.

**Patterns:**
- Tag-prefixed, bracketed messages: `[warmup]`, `[renderer]`, `[audio]`, `[perf]`, `[smoke]`, `[planes]`, `[CloudSky]`, `[dev]`.
- `console.error` reserved for boot failure; `console.warn` for degraded subsystems; `console.info`/`console.log`/`console.table` for dev-tooling output gated behind `import.meta.env.DEV` (`src/debug/createDevAppApi.js`, `src/debug/createPerformanceDevTools.js:114-116`).
- Runtime A/B debugging happens through `window.__app` / `window.__app.perf` console APIs, never through permanent logs.

## Comments

**When to Comment:**
- Module-header block comments explaining purpose, device caveats, and tuning strategy (`src/world/features.js` strip-order header, `src/platform/performanceProfile.js:1-4` and `:56-62`).
- Inline "why" comments for platform quirks and historical bugs, written in present tense with concrete context: Safari/adaptive-DPR notes in `src/main.js:133-148`, ground-probe rationale in `src/controls/createWalkControls.js:81-83`.
- JSDoc on exported tuning constants where the name alone is insufficient: `/** Standing eye height scale while crouched (toggle with C). */` (`src/controls/createWalkControls.js:9`).

**JSDoc/TSDoc:**
- Used selectively, not exhaustively. Reference credits use `{@link ...}`: box blur reference in `src/tsl/boxBlur.js:57-59`.
- Technique deep-dives live in `docs/techniques/*.md` and are linked from `AGENTS.md` rather than duplicated in source comments.

## Function Design

**Size:** Factories are long (100-500 lines) by design — one module owns one composed subsystem. Keep helpers small and unexported; extract shared helpers to `meshUtils.js`-style utility modules.

**Parameters:**
- Single destructured options object with defaults, including `= null` / `= {}` fallbacks: `createCollisionRain({ scene, renderer, collisionHeight, camera = null, count = DEFAULT_COUNT, ... } = {})` (`src/world/weather/createCollisionRain.js:58-65`).
- Callbacks passed as getter functions to avoid temporal-dead-zone ordering issues: `getSunLight: () => sunLight`, `getWalkControls: () => cameraDirector.walkControls`, `getFinishedIntro: () => appShell?.isFinishedIntro?.() ?? false` (`src/main.js`).

**Return Values:**
- Factories return plain object "controller" bags: mutable `params`, update functions, and named handles (`createWalkControls` returns handlers + state; `createWorld` returns `{ city, billboards, car, ground, rain, smoke, planes, sky, colliders, ... }` — `src/world/createWorld.js:172-189`).
- Optional subsystems return `null` when their feature flag is off; downstream code must use `?.`.
- Small utilities return direct values (`findMeshByName` returns the mesh or `null` — `src/world/loaders/meshUtils.js`).

## Module Design

**Exports:**
- Named exports only; exactly one `export default` exists in the codebase (`src/tsl/edgeChromaticAberration.js:108`), which is the exception (a TSL node class following three.js addon convention). New code should use named exports.
- Two classes exist for three.js-interop reasons: `CollisionHeight` (`src/world/weather/createCollisionHeight.js`) and `EdgeChromaticAberrationNode extends TempNode` (`src/tsl/edgeChromaticAberration.js`). Everything else uses factory functions returning closures — prefer factories.

**Barrel Files:**
- None. Every import targets a specific module file directly.

**Composition pattern (do not break):**
- `src/main.js` builds plain objects — `world`, `pipeline`, `cameraDirector`, `renderLoop`, `appShell` — and wires them by passing options objects with getter callbacks. The render loop (`src/runtime/createRenderLoop.js`) calls world updates in a fixed order, then `post.render()`.
- Global mutable modules are limited to: `performanceProfile` (`src/platform/performanceProfile.js`), `FEATURES` (`src/world/features.js`), audio state store (`src/audio/audioState.js` — pub/sub with `subscribe()`/`notify()` pattern).
- Feature toggles: add a flag to `FEATURES` in `src/world/features.js`; perf budgets: add a flag plus resolution scale to `performanceProfile` in `src/platform/performanceProfile.js` (default off or half-res if costly).
- Dev-only code: gate behind `import.meta.env.DEV` and attach to `window.__app` (see `src/debug/createDevAppApi.js`).

**TSL conventions:**
- Shader logic is built with `Fn(([args]) => ...)` node functions, never GLSL strings (`src/tsl/rainRipples.js`, `src/tsl/surfaceRain.js`).
- Reusable node graphs live in `src/tsl/` and are wired from `src/world/` or `src/post/`; use `uniform()` for per-frame values, `instancedArray()` for GPU buffers, TSL `If`/`Loop` for control flow (`src/world/weather/createCollisionRain.js`).
- Node materials: `MeshStandardNodeMaterial` / `NodeMaterial` from `three/webgpu` with `material.outputNode` / `roughnessNode` / `normalNode` overrides.

---

*Convention analysis: 2026-11-22*
