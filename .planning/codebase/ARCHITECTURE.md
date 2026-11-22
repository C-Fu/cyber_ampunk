---
last_mapped_at: 2026-11-23
last_mapped_commit: de9d95337071737e9086c6a2a1c25d16e8454a48
---
<!-- refreshed: 2026-11-23 -->
# Architecture

**Analysis Date:** 2026-11-23

## System Overview

```text
┌───────────────────────────────────────────────────────────────────────┐
│                        Entry / Composition Root                       │
│  index.html → src/main.js (`init`) — wires ALL factories together     │
├────────────────┬───────────────────┬──────────────────┬───────────────┤
│  Bootstrap     │   World           │   Post           │   Runtime     │
│  createCamera  │   createWorld     │   postprocessing │   createRender│
│  createRenderer│   features.js     │   cyberpunkLook  │   Loop        │
│  `src/boot-    │   `src/world/`    │   `src/post/`    │   CameraDirec-│
│   strap/`      │                   │                  │   tor, warmup │
├────────────────┴───────────────────┴──────────────────┴───────────────┤
│                       Shared Node Library                             │
│  TSL building blocks: `src/tsl/` (surfaceRain, rainRipples, rainGlass,│
│  boxBlur, edgeChromaticAberration) — consumed by world AND post       │
├───────────────────────────────────────────────────────────────────────┤
│                       Platform / Cross-Cutting                        │
│  `src/platform/` (performanceProfile, deviceLayout, adaptiveDpr,      │
│  userPreferences) · `src/i18n/` (BM/EN dictionary pub/sub store) ·    │
│  `src/ui/` · `src/audio/` · `src/debug/`                              │
├───────────────────────────────────────────────────────────────────────┤
│                       Output: WebGPU canvas                           │
│  RenderPipeline in `src/post/postprocessing.js` → renderer canvas     │
└───────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| init (composition root) | Boots device defaults, builds camera/renderer/world/pipeline/UI, wires render loop, runs intro | `src/main.js` |
| createRenderer | WebGPU renderer init, pixel-ratio caps, shadow update scheduling, resize | `src/bootstrap/createRenderer.js` |
| createCamera | Perspective camera + layout params (FOV per device, walk eye height) | `src/bootstrap/createCamera.js` |
| createWorld | Parallel-loads city/billboards/car/env, assembles scene graph, returns plain `world` object of nullable features | `src/world/createWorld.js` |
| createScene | Scene, fog, sun light, static-transform freeze, addModel helper | `src/world/scene.js` |
| createCollisionHeight | Orthographic top-down RT storing `positionWorld` per texel (rain "hit" map) | `src/world/weather/createCollisionHeight.js` |
| createCollisionRain | GPU particle rain + splash billboards reading the height RT | `src/world/weather/createCollisionRain.js` |
| collisionHideObjects | Collects rain/sky/smoke/planes to hide during height-pass render | `src/world/weather/collisionHideObjects.js` |
| createGround | Wet pavement PBR + rain ripples + manual mirror-camera planar reflection RT | `src/world/ground/createGround.js` |
| applyCarSurfaceRain | Drives car `MeshStandardNodeMaterial` roughness/normal from TSL drop graph | `src/world/car/applyCarSurfaceRain.js` |
| createPostProcessing | `RenderPipeline` assembly: AO pre-pass, scene MRT pass, bloom, DoF, lensflare, SMAA, rain-glass intro, look composite | `src/post/postprocessing.js` |
| cyberpunkLook | Color-grade presets (neutral, neonNoir, magentaRain, tealDusk, silentHill, sinCity) | `src/post/look/cyberpunkLook.js` |
| createRenderLoop | Per-frame update order + `post.render()` via `renderer.setAnimationLoop` | `src/runtime/createRenderLoop.js` |
| createCameraDirector | Orbit ↔ walk mode switching, DoF focus point, gsap focus tweens | `src/runtime/createCameraDirector.js` |
| createWalkControls | First-person walk input with BVH capsule collision | `src/controls/createWalkControls.js` |
| bvh | `three-mesh-bvh` install + per-model BVH build | `src/world/bvh.js` |
| warmup | Startup lighting finalize + deferred shader compile (Safari compiles pre-loop) | `src/runtime/warmup.js` |
| createAppShell | Aggregates all UI chrome + audio + HUD; owns `revealAppUi`, `onWalkModeChange` | `src/app/createAppShell.js` |
| createIntroFlow | Loader → rain-glass intro → UI reveal sequence | `src/app/createIntroFlow.js` |
| i18n store | BM/EN dictionary lookup (`t`), language switch (`setLanguage`), pub/sub (`subscribe`) — module singleton shaped like `audioState` | `src/i18n/i18n.js` |
| staticHead | Swaps `document.title`, meta content, `og:locale`, `documentElement.lang` via selector map | `src/i18n/staticHead.js` |
| check-i18n-parity | Node script gate: BM and EN dictionaries must carry identical key sets (exit 1 on mismatch) | `scripts/check-i18n-parity.mjs` |
| performanceProfile | Mutable singleton of perf knobs + device-specific defaults (Safari/mobile) | `src/platform/performanceProfile.js` |
| FEATURES | Static feature flags + strip order for cutting scene layers | `src/world/features.js` |
| adaptiveDpr | FPS-driven pixel-ratio controller with `onForcedLow` degradation cascade | `src/platform/adaptiveDpr.js` |
| createDevAppApi | `window.__app` dev console API (scene, world, audio, perf) | `src/debug/createDevAppApi.js` |

## Pattern Overview

**Overall:** Composition-root factory pattern (functional, no classes, no DI framework)

**Key Characteristics:**
- Every module exports a `createX(...)` factory returning a plain object of functions and nullable references — wire factories together in `src/main.js`
- Features are optional: disabled features return `null`, callers use optional chaining (`world.rain?.update(...)`, `world.billboards?.userData?...`)
- Plain-object data flow: `world`, `pipeline`, `cameraDirector`, `appShell` are bags of references, not class instances
- TSL (`Fn`, node materials, `RenderPipeline`) replaces GLSL; imports come from `three/webgpu` and `three/tsl`
- Cross-cutting config via module singletons: `FEATURES` (what exists), `performanceProfile` (how expensive it runs), and `i18n` (what language the UI copy is in — pub/sub store)
- All user-facing DOM copy flows through the i18n dictionary store; UI factories subscribe with a `syncText` callback and re-apply text via `textContent` / `setAttribute` on language change

## Layers

**Entry / Composition Root:**
- Purpose: single boot sequence, dependency wiring, no business logic
- Location: `src/main.js`
- Contains: `init(loaderOverlay)` — device defaults → camera → renderer → world → lighting → post → UI shell → director → render loop → warmup → intro; also calls `applyStaticHead()` at boot (`src/main.js:62`)
- Depends on: every other layer
- Used by: `index.html` (module script)

**Bootstrap:**
- Purpose: raw Three.js primitives (renderer, camera) with platform caps applied
- Location: `src/bootstrap/`
- Depends on: `src/platform/` (pixel-ratio caps)
- Used by: `src/main.js`

**World (scene content):**
- Purpose: everything rendered into the 3D scene — city, car, ground, weather, sky, billboards, effects, loaders
- Location: `src/world/` (subfolders: `city/`, `car/`, `ground/`, `weather/`, `billboards/`, `effects/`, `loaders/`)
- Depends on: `src/tsl/` (node graphs), `src/platform/performanceProfile.js`
- Used by: `src/runtime/createRenderLoop.js` (update calls), `src/main.js`

**TSL node library:**
- Purpose: reusable shader graphs shared between world materials and the post stack
- Location: `src/tsl/` — `surfaceRain.js`, `rainRipples.js`, `rainGlass.js`, `boxBlur.js`, `edgeChromaticAberration.js`
- Depends on: `three/tsl` only
- Used by: `src/world/` (car, ground) and `src/post/` (intro, DoF, look)

**Post:**
- Purpose: `RenderPipeline` passes and color grading
- Location: `src/post/`, look presets in `src/post/look/`
- Depends on: `src/tsl/`, `src/platform/`
- Used by: `src/runtime/createRenderLoop.js` (`post.render()`), `src/main.js`, `src/debug/`

**Runtime:**
- Purpose: frame loop, camera mode direction, startup warmup
- Location: `src/runtime/`
- Depends on: world, pipeline, platform
- Used by: `src/main.js`

**Platform:**
- Purpose: device detection, perf budgets, DPR adaptation, persisted user prefs
- Location: `src/platform/` — `performanceProfile.js`, `deviceLayout.js`, `adaptiveDpr.js`, `userPreferences.js` (localStorage: look preset, dev mode, language via `getStoredLanguage`/`setStoredLanguage`)
- Depends on: nothing project-internal (leaf layer)
- Used by: nearly everything

**i18n (localization):**
- Purpose: bilingual (BM = Bahasa Melayu default, EN) UI copy without any i18n dependency
- Location: `src/i18n/` — `i18n.js` (store), `staticHead.js` (head/meta swap), `dictionaries/bm.js` + `dictionaries/en.js` (flat alphabetical maps, ~81 keys)
- Depends on: `src/platform/userPreferences.js` (stored language), DOM only
- Used by: `src/ui/*` factories (header, settings, about, walk prompt, walk controls hint, move hint, HUD, audio button, intro/performance notice), `src/main.js` (boot head swap), `scripts/check-i18n-parity.mjs` (dictionaries)

**UI / App shell:**
- Purpose: DOM chrome (header, settings, about), intro overlay, walk HUD/joystick, audio buttons
- Location: `src/app/` (shells/flows), `src/ui/` (`core/`, `chrome/`, `intro/`, `walk/`), `src/intro/` (rain-glass intro effect)
- Depends on: platform, post (look presets), `src/i18n/i18n.js` (`t` + `subscribe` in every copy-bearing factory)
- Used by: `src/main.js`

**Debug:**
- Purpose: `window.__app` dev API, perf devtools, Three.js inspector session
- Location: `src/debug/`
- Depends on: renderer/pipeline/world wiring from main
- Used by: developers at runtime (Development Mode toggle in settings)

## Data Flow

### Primary Request Path (startup)

1. `index.html` loads module script → `src/main.js` (HTML itself is a **BM static baseline**: `<html lang="ms">` with hardcoded BM copy — dictionaries are the source of truth after hydration)
2. `applyDevicePerformanceDefaults()` + `syncLayoutClass()` — caps must be set before `createRenderer` (`src/main.js:58`)
3. `createCamera()` / `createScene()` / `await createRenderer()` (`src/main.js:64-71`)
4. `await createWorld({ scene, renderer, camera, ... })` — parallel `Promise.all` of city/billboards/car/envTexture loads, then sequential ground/smoke/planes/sky/collision-rain setup (`src/world/createWorld.js:57-190`)
5. `createPostProcessing(...)` + look preset application (`src/main.js:113-128`)
6. Factory wiring: adaptiveDpr, cameraDirector, inspectorSession, appShell, devApp, audio, introFlow, renderLoop (`src/main.js:130-240`)
7. `finalizeStartupLighting` → `compileDeferredStartup` (awaited pre-loop only on Safari) → `renderLoop.startLoop()` (`src/main.js:242-268`)
8. `await introFlow.run()` → UI reveal → inspector bootstrap (`src/main.js:282-293`)

### Per-Frame Flow (render loop)

1. `timer.update()` / delta (`src/runtime/createRenderLoop.js:19-20`)
2. `cameraDirector.update(delta)` — orbit damping or walk controls; sets DoF focus point
3. `world.collisionHeight?.update(...)` with `collectCollisionHideObjects(world)` — re-renders the height RT (frame-skippable) (`src/runtime/createRenderLoop.js:25-28`)
4. `world.rain?.update(delta, camera)` — compute-style position integration + respawn against height texture
5. Conditional updates: planes (skipped during intro), `sky.update`, `ground.update`, billboard materials, `carSurfaceRain.syncProximity` + update
6. `world.ground?.updateReflection?.(renderer, camera)` gated by `performanceTools.shouldUpdateGroundReflection()` (frame-skip + half-res)
7. `pipeline.syncCameras(camera)` (layer-filtered camera clones for AO/scene/rain passes) → `dof.updateFocusPoint` → `post.render()`
8. `performanceTools.sampleFps()` — feeds adaptive DPR

### Rain Collision Data Flow

1. `CollisionHeight` ortho camera renders top-down `positionWorld` into half-float nearest-filtered RT (`src/world/weather/createCollisionHeight.js`)
2. Hide list excludes rain particles, sky, smoke, planes from that RT (`src/world/weather/collisionHideObjects.js`)
3. Rain compute reads `floorY = texture(heightMap, uv(xz)).y` and respawns drops via TSL `If` (`src/world/weather/createCollisionRain.js`)
4. Rain draws as one instanced billboard mesh on a dedicated layer; `useDedicatedPass: false` means it renders inside the main scene pass, not a separate composite

### Language / Copy Flow (i18n)

1. **Boot:** module eval of `src/i18n/i18n.js` reads `getStoredLanguage()` (`src/platform/userPreferences.js`); a stored `"en"` (dormant until a future toggle writes it) swaps `currentLanguage`, sets `document.documentElement.lang`, and calls `applyStaticHead()` — all before any listener registers, so `notify()` is a no-op. Otherwise current language stays `"bm"` matching the `index.html` BM baseline.
2. **Hydration:** every UI factory builds its DOM with `t("key")` template interpolation for initial copy, then registers `const unsubscribeLanguage = subscribe(syncText)` — `subscribe` fires the listener immediately with `{ language }`, so `syncText` re-applies copy once at construction too.
3. **Runtime switch:** `setLanguage("en" | "bm")` (`src/i18n/i18n.js`) updates `currentLanguage`, sets `document.documentElement.lang` (`"ms"` / `"en"`), calls `applyStaticHead()` (`src/i18n/staticHead.js` — selector-map swap of `document.title`, 8 meta nodes, `og:locale` → `ms_MY`/`en_US`), then `notify()` fans out to every registered `syncText`, which writes `textContent` and `setAttribute("aria-label", ...)` — never `innerHTML`.
4. **Teardown:** factories with a `destroy()` (e.g. `src/ui/walk/createWalkPrompt.js`, `src/ui/walk/createWalkControlsHint.js`) call `unsubscribeLanguage?.()`; page-lifetime factories (`src/ui/chrome/createHeader.js`) keep the unsubscribe stored but never released.

**State Management:**
- No store/state library. State lives in closure-scoped variables inside factories; shared mutable state is limited to module singletons — `performanceProfile` (`src/platform/performanceProfile.js`), `FEATURES` (`src/world/features.js`), the i18n store (`src/i18n/i18n.js`: `currentLanguage` + `listeners` Set, same pub/sub shape as `src/audio/audioState.js`), plus `localStorage` user prefs (`src/platform/userPreferences.js`: look preset, language key `threejs-punk-language`) and the `window.__app` dev API
- Cross-component messaging uses injected callbacks and small bridge objects (e.g., `walkModeBridge` and `adaptiveSampleGate` in `src/main.js`), plus i18n `subscribe()` for language-driven re-renders

## Key Abstractions

**Factory returning plain object:**
- Purpose: uniform construction pattern; every module is a `createX(deps) → { methods, refs }` function
- Examples: `src/world/createWorld.js`, `src/runtime/createCameraDirector.js`, `src/app/createAppShell.js`
- Pattern: dependency object in, public API object out; nullable members for optional features

**Nullable feature object (`world`):**
- Purpose: one bag holding every scene feature; disabled features are `null`
- Examples: `src/world/createWorld.js:172-189` (`city`, `rain`, `smoke`, `planes`, `sky`, `ground`, `carSurfaceRain`, `colliders`, `focusTargets`)
- Pattern: consumers must use optional chaining; never assume a feature exists

**TSL node graph module:**
- Purpose: reusable shader logic importable by both world materials and post passes
- Examples: `src/tsl/surfaceRain.js` (car droplets), `src/tsl/rainRipples.js` (ground), `src/tsl/rainGlass.js` (intro), `src/tsl/boxBlur.js` (DoF blur)
- Pattern: export `Fn`-based builders or `applyX(material, uniforms)` wirers; no GLSL strings

**Pub/sub singleton store:**
- Purpose: module-scope state + `Set` of listeners, `notify()` on change, `subscribe()` with immediate sync on registration
- Examples: `src/audio/audioState.js` (audio), `src/i18n/i18n.js` (language)
- Pattern: `const unsubscribe = subscribe(listener)`; listener receives `{ language: currentLanguage }`; flat dictionary lookup via `t(key, vars)` with `{var}` interpolation

**Height RT collision proxy:**
- Purpose: replaces per-drop CPU raycasts with one ortho render target sampled on GPU
- Examples: `src/world/weather/createCollisionHeight.js` + `createCollisionRain.js`
- Pattern: pre-pass RT + shader texture fetch; hide-list management before the pre-pass

**Perf knob singleton:**
- Purpose: runtime-tunable budgets honored by every expensive feature
- Examples: `src/platform/performanceProfile.js` (resolution scales, frame skips, counts); degradation cascade in `src/main.js:130-143`
- Pattern: direct flag reads + `pipeline.perf.setXxx()` setters; new expensive work must add a scale/frame-skip knob here

## Entry Points

**Browser entry:**
- Location: `index.html` → `<script type="module" src="/src/main.js">`
- Triggers: page load
- Responsibilities: BM static baseline head/copy (`lang="ms"`), meta/SEO head, font CSS, loader overlay mount point, boot of `init()`

**`init(loaderOverlay)`:**
- Location: `src/main.js:56`
- Triggers: module load; failures caught at `src/main.js:51` → loader `fail()` + `console.error`
- Responsibilities: entire composition (see Primary Request Path); calls `applyStaticHead()` early (`src/main.js:62`)

**Render loop entry:**
- Location: `src/runtime/createRenderLoop.js:65` (`startLoop` → `renderer.setAnimationLoop(renderFrame)`)
- Triggers: called once after warmup in `init`
- Responsibilities: fixed per-frame update order (see Per-Frame Flow)

**Language switch entry:**
- Location: `src/i18n/i18n.js` — `setLanguage(language)`
- Triggers: future Phase 2 language toggle (nothing writes it in the current UI); the restore path reads `localStorage["threejs-punk-language"]` at module eval
- Responsibilities: swap dictionary, update `<html lang>`, refresh head meta, notify all `syncText` subscribers

## Architectural Constraints

- **Threading:** Single-threaded main thread; WASM decoders (Draco/Basis in `public/libs/`) run on loader threads via Three loader workers; no project-owned worker threads
- **Global state:** `performanceProfile` mutable singleton (`src/platform/performanceProfile.js`), `FEATURES` const singleton (`src/world/features.js`), `window.__app` dev API (`src/debug/createDevAppApi.js`), `audioState` (`src/audio/audioState.js`), i18n store (`src/i18n/i18n.js`)
- **Circular imports:** None detected; layering is acyclic — platform → i18n/tsl → world/post → runtime/app → main. `src/i18n/i18n.js` ↔ `src/i18n/staticHead.js` call each other only at runtime, never at module-eval time (see header comment in `staticHead.js`)
- **WebGPU-first:** Import from `three/webgpu` and `three/tsl` only; no custom GLSL under `src/`; dev server must be HTTPS (vite `basicSsl`) for WebGPU context
- **No SSR for wet ground:** Planar RT + roughness mixing only (`src/world/ground/createGround.js`); `reflector()` is banned inside TSL `PassNode` graphs (WebGPU attachment issues)
- **Rain pass mode:** collision rain uses `useDedicatedPass: false` (`src/world/weather/createCollisionRain.js`); do not assume a separate rain composite pass
- **BM static baseline:** `index.html` ships hardcoded Bahasa Melayu copy with `lang="ms"`; dictionaries are the runtime source of truth — never edit user-facing copy directly in `index.html` body markup (head meta IS dictionary-driven via `src/i18n/staticHead.js`)
- **Dictionary parity:** `src/i18n/dictionaries/bm.js` and `en.js` must carry identical key sets — enforced by `scripts/check-i18n-parity.mjs` via `npm run check:i18n`
- **Safari/mobile quirks:** `applyDevicePerformanceDefaults` gates DoF/lensflare/billboards/AO and compile ordering (`src/platform/performanceProfile.js:63-84`); respect it when adding passes
- **Optional chaining contract:** every new world feature must tolerate being `null` (feature flag off) — callers in `createRenderLoop.js` and `createWorld.js` rely on it

## Anti-Patterns

### CPU raycast per particle

**What happens:** Casting `THREE.Raycaster` per rain drop from JS
**Why it's wrong:** 5000 drops (`performanceProfile.collisionRainCount`) per frame stalls the main thread; the height-RT approach exists precisely to avoid this
**Do this instead:** Sample the collision height RT in TSL — see `src/world/weather/createCollisionHeight.js` and `src/world/weather/createCollisionRain.js`

### GLSL shader strings under src/

**What happens:** Writing `new THREE.ShaderMaterial({ vertexShader: \`...\` })`
**Why it's wrong:** Project is WebGPU-first; GLSL won't run on the WebGPU backend and breaks the TSL portability contract
**Do this instead:** Build nodes with `Fn` from `three/tsl` and `MeshStandardNodeMaterial` / `NodeMaterial` from `three/webgpu` — pattern in `src/tsl/surfaceRain.js`

### SSR / `reflector()` for wet ground

**What happens:** Reintroducing screen-space reflection or `reflector()` inside a `PassNode` graph
**Why it's wrong:** SSR was removed deliberately (see README "The SSR fork"); `reflector()` inside TSL `PassNode` graphs causes WebGPU attachment errors
**Do this instead:** Manual mirror camera → half-res RT → emissive × `(1 - roughness)` mix in `src/world/ground/createGround.js`

### Assuming features exist

**What happens:** Calling `world.rain.update(...)` without `?.` or branching on `FEATURES`
**Why it's wrong:** Any feature can be `null` (flag off, mobile profile, load failure) — this crashes the whole frame loop
**Do this instead:** Follow `src/runtime/createRenderLoop.js:25-56` — `world.rain?.update(...)`, `world.ground?.setRippleAmount?.(...)`

### Full-res unconditional new passes

**What happens:** Adding an expensive render pass at full resolution, every frame, on all devices
**Why it's wrong:** Mobile/Safari budgets are already tight; existing passes are half-res and/or frame-skipped
**Do this instead:** Add a `performanceProfile` knob (resolution scale or frame skip) and default off/half-res — see `bloomResolutionScale`, `groundReflectionFrameSkip` in `src/platform/performanceProfile.js`

### Hardcoding user-facing copy / re-rendering with innerHTML

**What happens:** Writing literal UI strings inline, or re-running `root.innerHTML = ...` inside a `syncText` handler to swap language
**Why it's wrong:** Copy must come from the dictionaries so BM/EN stay in sync (parity gate); `innerHTML` re-render destroys listeners, re-parses markup, and bypasses the `textContent`/`setAttribute` convention used by every migrated factory
**Do this instead:** Use `t("key")` from `src/i18n/i18n.js` for initial markup and a `subscribe(syncText)` handler that writes `textContent` / `setAttribute` per element — patterns in `src/ui/chrome/createHeader.js:39-50` and `src/ui/walk/createWalkPrompt.js:43-54,112`; for whole copy blocks, use `data-i18n` / `data-i18n-aria` attributes walked by `querySelectorAll` in `src/ui/chrome/createAboutPanel.js:93-102`

## Error Handling

**Strategy:** Fail loudly at boot, degrade silently at runtime

**Patterns:**
- Top-level: `init(loader).catch(...)` → loader overlay failure message + `console.error` (`src/main.js:51-54`)
- Deferred compile: `.catch` with `console.warn("[warmup] ...")` so a compile failure doesn't kill the loop (`src/main.js:260-262`)
- Optional features: `null` returns instead of throws; consumers skip via optional chaining
- i18n missing keys: `t()` warns `[i18n] missing key: ...` in dev and returns the key itself in all environments (`src/i18n/i18n.js:49-61`); missing head selectors warn `[i18n] head selector missed: ...` in dev only (`src/i18n/staticHead.js:33-36`)
- Dictionary parity mismatch: `scripts/check-i18n-parity.mjs` prints offending keys and exits 1 (build-time, not runtime)
- No retry logic, no error boundary beyond the loader overlay

## Cross-Cutting Concerns

**Logging:** `console` only (`console.error` boot failure, `console.warn` warmup degradation, `[i18n]` dev warnings for missing keys/selectors); dev-facing diagnostics via `window.__app` (`src/debug/createDevAppApi.js`) and inspector perf tools (`src/debug/createPerformanceDevTools.js`)
**Validation:** No schema validation; device capability gating via `src/platform/deviceLayout.js` (`isSafari`, `isMobileDevice`, `isAppleMobile`) consumed by `performanceProfile`; dictionary key parity validated by `scripts/check-i18n-parity.mjs`
**Authentication:** None — static public demo site, no backend
**Localization:** BM default (`lang="ms"`), EN dormant-restore; all user-visible copy + head meta localized via `src/i18n/`; brand string "THREEJS-PUNK" intentionally hardcoded in both languages

---

*Architecture analysis: 2026-11-23*
