---
last_mapped_commit: 8cc20593b2270e2ce832e7b7b44356705daddec4
last_mapped_at: 2026-11-22
---
# Codebase Structure

**Analysis Date:** 2026-11-22

## Directory Layout

```
cyberpunk-malaya/
├── index.html            # Single-page entry; loads /src/main.js as module
├── vite.config.js        # Vite + basicSsl (HTTPS for WebGPU) + inspector extension middleware
├── package.json          # three, gsap, three-mesh-bvh; scripts: dev/build/preview/deploy
├── AGENTS.md             # Agent instructions: constraints, file routing, recipes
├── README.md             # Human overview + Source map table
├── STRIP.md              # Guide for stripping scene layers (linked from features.js)
├── docs/
│   └── techniques/       # Deep dives: collision-rain, wet-ground, car-surface-rain
├── public/               # Static assets served as-is
│   ├── models/           # GLB assets: cyberpunk_compressed.glb, colider.glb, quadra.glb, billboards.glb, plane.glb
│   ├── textures/         # wet-puddles PBR set, rainDrop.png, smoke.png, water-splash.webp
│   ├── hdri/             # Environment HDRs (sunflowers_puresky_1k.hdr, white_home_studio_1k.hdr)
│   ├── fonts/            # Orbitron, Gloock woff2 + Phosphor icon font
│   ├── libs/             # WASM decoders: draco/, basis/ (referenced by GLTF loaders)
│   ├── video/            # Billboard video textures (imagine-art-feed-item-*.mp4)
│   └── *.mp3             # Ambient/engine/footstep/thunder audio
├── src/
│   ├── main.js           # Composition root — the ONLY wiring file
│   ├── app/              # App-level shells: loader overlay, app shell, intro flow
│   ├── audio/            # Engine/footstep audio + audioState
│   ├── bootstrap/        # Renderer + camera primitives
│   ├── clouds/           # Cloud sky material + noise textures
│   ├── controls/         # Walk controls (BVH collision)
│   ├── debug/            # Dev API, inspector session, perf devtools
│   ├── intro/            # Rain-glass intro effect (TSL-driven)
│   ├── platform/         # Device detection, perf profile, adaptive DPR, user prefs
│   ├── post/             # RenderPipeline + look presets (post/look/)
│   ├── runtime/          # Render loop, camera director, warmup
│   ├── tsl/              # Reusable TSL shader node modules
│   ├── ui/               # DOM UI: core/, chrome/, intro/, walk/
│   └── world/            # Scene content: car/, city/, ground/, weather/, billboards/, effects/, loaders/
└── .planning/            # GSD planning artifacts (codebase maps live here)
```

## Directory Purposes

**`src/` (root files):**
- Purpose: composition root only
- Contains: `main.js` — imports every factory and wires them; no rendering logic of its own

**`src/app/`:**
- Purpose: app-lifecycle shells that aggregate other layers
- Contains: `createAppShell.js` (all UI chrome + audio wiring), `createIntroFlow.js` (boot → intro → reveal sequence), `createLoaderOverlay.js` (progress UI)
- Key files: `src/app/createAppShell.js`

**`src/audio/`:**
- Purpose: positional/game audio built on WebAudio
- Contains: `audioState.js`, `createCarEngineAudio.js`, `createPlaneEngineAudio.js`, `createWetFootstepAudio.js`

**`src/bootstrap/`:**
- Purpose: raw Three.js primitives with platform caps
- Contains: `createRenderer.js` (WebGPU init, DPR caps, shadow updater, resize), `createCamera.js` (camera + layout params + FOV sync)
- Key files: `src/bootstrap/createRenderer.js`

**`src/clouds/`:**
- Purpose: procedural cloud sky dome
- Contains: `createCloudSky.js`, `cloudsMaterial.js` (TSL material), `noiseTextures.js`

**`src/controls/`:**
- Purpose: first-person movement
- Contains: `createWalkControls.js` (799 lines — pointer lock, WASD, mobile joystick input, BVH capsule collision, footstep events)

**`src/debug/`:**
- Purpose: development-mode tooling
- Contains: `createDevAppApi.js` (`window.__app`), `createInspectorSession.js`, `setupInspector.js` (963 lines, Three.js inspector), `createPerformanceDevTools.js`, `inspectorControls.js`, `inspectorLayout.css`
- Note: inspector panels hidden outside Development Mode; perf API available in production

**`src/intro/`:**
- Purpose: the rain-on-glass intro camera effect
- Contains: `createRainGlassIntro.js` (uses `src/tsl/rainGlass.js` graph, hooks into post via `pipeline`)

**`src/platform/`:**
- Purpose: leaf-layer device/quality/user state — imports nothing project-internal
- Contains: `performanceProfile.js` (all perf knobs + device defaults), `deviceLayout.js` (mobile/Safari detection, layout classes), `adaptiveDpr.js` (FPS-driven DPR controller), `userPreferences.js` (localStorage: look preset, dev mode)
- Key files: `src/platform/performanceProfile.js`

**`src/post/`:**
- Purpose: render pipeline and grading
- Contains: `postprocessing.js` (RenderPipeline: AO pre-pass, MRT scene pass, bloom, DoF, lensflare, SMAA, rain glass, composite), `look/cyberpunkLook.js` (6 look presets)
- Key files: `src/post/postprocessing.js`

**`src/runtime/`:**
- Purpose: frame loop and camera direction
- Contains: `createRenderLoop.js` (per-frame update order), `createCameraDirector.js` (orbit/walk switching, DoF focus), `warmup.js` (startup lighting + deferred compile)
- Key files: `src/runtime/createRenderLoop.js`

**`src/tsl/`:**
- Purpose: reusable TSL shader node graphs, shared by world and post
- Contains: `surfaceRain.js` (car droplets), `rainRipples.js` (ground ripples), `rainGlass.js` (intro), `boxBlur.js` (separable blur for DoF), `edgeChromaticAberration.js`

**`src/ui/`:**
- Purpose: DOM overlay UI, co-located CSS
- Contains: `core/` (global.css, appUiState, phosphor icons, external links), `chrome/` (header, about, settings, audio button, visibility coordinator), `intro/` (intro overlay, performance notice), `walk/` (HUD panel, move hint, virtual joystick, walk prompt, controls hint, input facade)

**`src/world/`:**
- Purpose: everything in the 3D scene
- Contains: `createWorld.js`, `scene.js`, `features.js`, `bvh.js`, `envMap.js`; subfolders `car/` (loadCar, applyCarSurfaceRain), `city/` (loadCity), `ground/` (createGround), `weather/` (createCollisionHeight, createCollisionRain, collisionHideObjects), `billboards/` (loadBillboards, applyBillboardMaterials, `materials/` with video-texture shader), `effects/` (createSmoke, createFlyingPlanes, loadPlane), `loaders/` (createGltfLoaders — Draco/KTX2, meshUtils)
- Key files: `src/world/createWorld.js`, `src/world/features.js`

**`docs/techniques/`:**
- Purpose: deep-dive specs for the three signature effects (collision rain, wet ground, car surface rain) with diagrams and port checklists
- Key files: `docs/techniques/collision-rain.md`, `docs/techniques/wet-ground.md`, `docs/techniques/car-surface-rain.md`

## Key File Locations

**Entry Points:**
- `index.html`: single HTML shell; mounts loader overlay and `/src/main.js` module
- `src/main.js`: `init()` composition root — all factory wiring
- `src/runtime/createRenderLoop.js`: `renderFrame()` — the per-frame entry

**Configuration:**
- `vite.config.js`: HTTPS dev server (WebGPU requirement), inspector extension middleware
- `package.json`: scripts `dev`/`build`/`preview`/`deploy` (Vercel); deps: three ^0.185, gsap, three-mesh-bvh
- `src/world/features.js`: `FEATURES` flags + `STRIP_ORDER`
- `src/platform/performanceProfile.js`: every perf budget knob
- `.cursor/rules/tsl-webgpu-shaders.mdc`, `.cursor/rules/project-context.mdc`: editor rules

**Core Logic:**
- `src/world/createWorld.js`: world assembly
- `src/post/postprocessing.js`: pipeline assembly
- `src/runtime/createRenderLoop.js`: frame ordering
- `src/controls/createWalkControls.js`: walk mechanics
- `src/world/weather/createCollisionRain.js` + `createCollisionHeight.js`: GPU rain collision

**Testing:**
- None — no test files, no test runner, no test config anywhere in the repo. Verification is manual per AGENTS.md checklist (`npm run build`, dev-server WebGPU checks)

## Naming Conventions

**Files:**
- camelCase, `.js`, prefixed by role: `createX.js` for factories (`createWorld.js`, `createRenderLoop.js`), `applyX.js` for material/effect wirers (`applyCarSurfaceRain.js`, `applyBillboardMaterials.js`), bare noun for data/singletons (`features.js`, `performanceProfile.js`, `audioState.js`, `bvh.js`), `X.css` co-located with its JS in `src/ui/`
- Exceptions: `postprocessing.js`, `warmup.js`, `edgeChromaticAberration.js` (single-instance modules)

**Directories:**
- camelCase by layer/domain: `world/`, `post/`, `runtime/`, `platform/`, `tsl/`, `ui/`, `debug/`, `bootstrap/`, `controls/`, `audio/`, `clouds/`, `app/`, `intro/`
- Domain subfolders inside `world/` mirror scene entities: `car/`, `city/`, `ground/`, `weather/`, `billboards/`, `effects/`, `loaders/`
- `src/ui/` mirrors UI zones: `core/`, `chrome/`, `intro/`, `walk/`

**Exports:**
- One main `createX(deps)` named export per factory module; small helper extras allowed (`createLightingController` alongside `createWorld`, `attachDevAudio` alongside `createDevAppApi`)

## Where to Add New Code

**New Feature (scene object / asset):**
- Primary code: `src/world/createX/` folder or files under `src/world/`, registered in `src/world/createWorld.js` behind a `FEATURES` flag added to `src/world/features.js` (plus `STRIP_ORDER` if strippable)
- Asset: drop GLB/textures into `public/models/` / `public/textures/`; load via `src/world/loaders/createGltfLoaders.js`
- Tests: none exist — verify with `npm run build` + dev-server checklist in AGENTS.md

**New reusable TSL shader node:**
- Implementation: `src/tsl/newNode.js` (import from `three/tsl` only, no GLSL)
- Wire from world material or `src/post/postprocessing.js`

**New post effect:**
- Implementation: node in `src/tsl/` or inline in `src/post/postprocessing.js`; hook into `buildBeautyInput` / `look.buildComposite` / `rebuildSteadyOutput`
- Mandatory: add a `performanceProfile` flag in `src/platform/performanceProfile.js`, default off or half-res

**New world feature update (per-frame):**
- Add call in `src/runtime/createRenderLoop.js` in the correct order, using optional chaining

**New UI element:**
- `src/ui/<zone>/createX.js` + co-located `x.css`; aggregate in `src/app/createAppShell.js`

**New perf knob:**
- `src/platform/performanceProfile.js`; apply via `pipeline.perf.setXxx()` pattern in `applyPerformanceProfileToPipeline`

**Utilities:**
- Shared helpers: `src/world/loaders/meshUtils.js` (mesh traversal), `src/ui/core/` (icons, state); no general `utils/` dump — place helpers next to their consumer

## Special Directories

**`public/`:**
- Purpose: static assets (models, textures, HDRI, fonts, audio, video, WASM decoder libs)
- Generated: No
- Committed: Yes (`.gitkeep` in `models/` suggests large assets may be added out-of-band)

**`public/libs/`:**
- Purpose: Draco + Basis WASM decoders referenced by `src/world/loaders/createGltfLoaders.js` via decoder path config
- Generated: No (vendored)
- Committed: Yes

**`docs/techniques/`:**
- Purpose: effect deep-dives consumed by agents (AGENTS.md read order step 2)
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning artifacts; this codebase map lives in `.planning/codebase/`
- Generated: Yes (by GSD commands)
- Committed: Yes (typically)

**`.cursor/rules/`:**
- Purpose: editor-embedded agent rules (project context, TSL shader constraints)
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-11-22*
