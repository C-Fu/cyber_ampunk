---
last_mapped_commit: de9d95337071737e9086c6a2a1c25d16e8454a48
last_mapped_at: 2026-11-23
---
# Codebase Concerns

**Analysis Date:** 2026-11-22

## Tech Debt

**KTX2Loader prototype monkey-patch:**
- Issue: `KTX2Loader.prototype._createTextureFrom` is overridden at module scope to rewrap uncompressed transcoded textures as `DataTexture` (WebGPU cannot bind `CompressedTexture` with uncompressed formats). This patches a private three.js internal API.
- Files: `src/world/loaders/createGltfLoaders.js` (lines 26–67)
- Impact: Any three.js upgrade that renames or re-signatures `_createTextureFrom` breaks texture loading silently — the patch would simply never run or throw at import time, and every KTX2 uncompressed texture in the scene fails.
- Fix approach: Watch this file on every `three` version bump; upstream a fix to three.js (`KTX2Loader` WebGPU path) and delete the patch when fixed. The `patchKTX2UncompressedTextures.applied` guard makes double-patching safe but also hides failures.

**`rain.setEnabled` monkey-patching in the post pipeline:**
- Issue: `createPostProcessing` wraps `rain.setEnabled` after-the-fact so toggling rain also rebuilds the composite graph (`setRainPassEnabled`). The rain module has no knowledge of the pipeline; the pipeline reaches in and rebinds its method.
- Files: `src/post/postprocessing.js` (lines 304–310)
- Impact: Any future refactor of `createCollisionRain`'s public API (renaming `setEnabled`, or adding another toggle) silently disconnects the post-graph rebuild. Wrapping order also matters — if something else wraps `setEnabled` later, the chain can double-fire.
- Fix approach: Invert the dependency — have the owner of `rain` call `pipeline.setRainPassEnabled(value)` explicitly (e.g., from the settings/inspector layer where `setEnabled` is invoked), and remove the wrapper.

**Three per-frame cloned cameras synced via `copy()`:**
- Issue: `aoCamera`, `sceneCamera`, and (when active) `rainCamera` are clones of the main camera, re-`copy()`-ed and layer-mask-adjusted every frame in `syncCameras` (`src/runtime/createRenderLoop.js` line 58 calls it per tick).
- Files: `src/post/postprocessing.js` (lines 36–97)
- Impact: Per-frame CPU cost (3× matrix copies + `updateMatrixWorld`) and a drift hazard — any new pass that forgets to go through `syncCameras` sees a stale camera. Layer enable/disable logic is duplicated in two places (construction and `syncCameras`).
- Fix approach: Extract a single `makeLayerCamera(camera, { enable, disable })` helper used both at construction and in `syncCameras`, so layer intent is declared once.

**Feature-flag drift between `FEATURES` and documented strip order:**
- Issue: The comment/strip guide in `features.js` references flags `advancedPost` and `groundReflection`, but the `FEATURES` object contains neither (post toggles live in `performanceProfile` instead). `STRIP.md` and `features.js` can disagree after edits.
- Files: `src/world/features.js`
- Impact: An agent following the documented strip order will look for flags that do not exist, or strip post effects by hand where a knob already exists.
- Fix approach: Update the `features.js` header comment and `STRIP.md` to point at the real knobs (`performanceProfile.bloom/dof/lensflare`, `groundReflection`), or add the missing flags.

**Hardcoded magic material names for the car GLB:**
- Issue: Glass detection is `GLASS_MATERIAL_NAMES = new Set(["77_5"])` and paint exclusion is `EXCLUDED_MATERIAL_NAMES = new Set(["mat_0.001"])`. These are opaque names exported from Blender embedded in `public/models/quadra.glb`.
- Files: `src/world/car/applyCarSurfaceRain.js` (lines 21–22)
- Impact: Re-exporting the car model with different material names silently disables glass wetness or misclassifies paint (emissive/transparent heuristics in `isPaintMaterial` then guess wrong). No warning is logged when zero glass materials are found.
- Fix approach: Log a `console.warn` when `glassCount === 0` after traversal; prefer an explicit material-name convention (e.g., `glass_*`) documented in `docs/techniques/car-surface-rain.md`, or a small JSON manifest mapping roles to material names.

**`MAX_COUNT` clamp silently caps rain tuning:**
- Issue: `createCollisionRain` clamps `count` to `MAX_COUNT = 5000`, but `performanceProfile.collisionRainCount` is the documented tuning knob. Raising the profile above 5000 does nothing, and `setDropCount` re-clamps with no feedback.
- Files: `src/world/weather/createCollisionRain.js` (lines 28, 66, 383–388)
- Impact: Inspectors/devs raising `collisionRainCount` see no change and no error.
- Fix approach: Derive `MAX_COUNT` from `performanceProfile` or warn when the requested count is clamped.

**`applyCarSurfaceRain.dispose()` does not restore materials:**
- Issue: `dispose()` only clears the `convertedMaterials` set. Node materials created by `ensurePaintNodeMaterial`/`ensureGlassNodeMaterial` are never disposed, and original materials are not restored on the meshes.
- Files: `src/world/car/applyCarSurfaceRain.js` (lines 320–322)
- Impact: Fine for the single-load page lifecycle, but any future re-init/scene-reload path leaks GPU materials. Same pattern applies to most `dispose()` functions — they exist but nothing calls them in `src/main.js` (one-shot page, no teardown path).
- Fix approach: If a re-init path is ever added, store `{ mesh, materialIndex, original }` pairs in `replaceMeshMaterial` and restore them in `dispose`, plus call `material.dispose()` on each converted material.

## Known Bugs

**No WebGL fallback for compute-based rain (silent degradation, not a crash):**
- Symptoms: On browsers without WebGPU, `WebGPURenderer` falls back to its WebGL2 backend (`src/bootstrap/createRenderer.js` lines 59–64 logs the backend in dev), but the collision rain system is built on `instancedArray` + `renderer.compute()` which is WebGPU-only. Rain/splashes will be missing or broken; the rest of the scene may render.
- Files: `src/world/weather/createCollisionRain.js`, `src/bootstrap/createRenderer.js`
- Trigger: Load in any browser without WebGPU enabled.
- Workaround: None in code; the project declares WebGPU as a hard requirement in `README.md`. A user-facing capability notice (beyond the generic loader failure message) is not present.

**Splash texture lacks an alpha channel (worked around):**
- Symptoms: `water-splash.webp` is fully opaque; the sprite shape lives in the red channel. `.r` is used as the opacity mask.
- Files: `src/world/weather/createCollisionRain.js` (lines 327–332)
- Trigger: Replacing the splash texture with a "normal" RGBA-webp makes splashes render as opaque squares.
- Workaround: The `.r`-as-mask workaround is in place and commented; asset replacement is the risk, not current behavior.

**Static drop layer "blinking" on car UV1 (avoided by omission):**
- Symptoms: Static drops on the car's secondary UV channel blink as specks when the grid loops, so the car path zeroes the static layer entirely (`getCarRainLayerWeights`).
- Files: `src/tsl/surfaceRain.js` (lines 132–139)
- Trigger: Re-enabling `staticDrops` weight for the car path.
- Workaround: Car uses moving layers only; documented in code comment. Underlying UV1 seam issue is unresolved.

**Adaptive DPR one-way ratchet:**
- Symptoms: Once sustained FPS < 50 forces the pixel ratio to 0.85, it never recovers for the session (only a page reload resets it). `onForcedLow` also permanently disables DoF and lensflare.
- Files: `src/platform/adaptiveDpr.js` (lines 55–73), `src/main.js` (lines 130–143)
- Trigger: A transient stutter (e.g., intro compile hitches — hence the `adaptiveSampleGate`) on a capable device locks in low DPR.
- Workaround: Deliberate design decision (documented in the module comment); no recovery path exists.

## Security Considerations

**Static `innerHTML` template strings:**
- Risk: Eleven UI builders assign `root.innerHTML = \`...\`` with static template literals. No user-supplied content is interpolated today.
- Files: `src/app/createLoaderOverlay.js`, `src/ui/chrome/createAboutPanel.js`, `src/ui/chrome/createHeader.js`, `src/ui/chrome/createSettingsPanel.js`, `src/ui/chrome/createAudioButton.js`, `src/ui/intro/createIntroOverlay.js`, `src/ui/walk/createHudPanel.js`, `src/ui/walk/createMoveHint.js`, `src/ui/walk/createWalkPrompt.js`, `src/ui/walk/createWalkControlsHint.js`, `src/ui/walk/createVirtualJoystick.js`
- Current mitigation: All interpolated values are compile-time constants (icon SVGs, preset labels). No dynamic content is ever injected.
- Recommendations: If any user/network-derived string (e.g., asset names, error messages) is ever rendered, switch that insertion point to `textContent` or sanitize. Do not introduce URL-parameter-driven UI text.

**Dev-server exposure (`host: true`) and inspector middleware:**
- Risk: `vite.config.js` sets `server.host: true` (LAN-exposed dev server) and adds a custom middleware serving files from `node_modules/three/examples/jsm/inspector/extensions`.
- Files: `vite.config.js`
- Current mitigation: The middleware enforces path containment (`filePath.startsWith(inspectorExtensionsDir)`) — no traversal. `@vitejs/plugin-basic-ssl` uses a self-signed cert. Dev-only; not in production builds.
- Recommendations: Be conscious that `npm run dev` exposes the workspace to the local network; use `--host localhost` when on untrusted networks.

**`window.__app` dev API:**
- Risk: Exposes live scene references to page scripts.
- Files: `src/debug/createDevAppApi.js`
- Current mitigation: Hard-gated on `import.meta.env.DEV` — returns `null` in production builds and is stripped by the bundler.
- Recommendations: None needed; keep the DEV gate on every future debug surface.

**localStorage:**
- Risk: Minimal. Only the look-preset ID is persisted; the development-mode key is proactively removed each boot.
- Files: `src/platform/userPreferences.js`
- Current mitigation: All access wrapped in try/catch for private-mode Safari. Values are compared against the `LOOK_PRESETS` whitelist before use in `src/main.js` (lines 119–123).
- Recommendations: None.

## Performance Bottlenecks

**Height-map pass renders the entire scene with an override material:**
- Problem: Every (non-skipped) frame, `collisionHeight.update` renders the full scene (city, car, ground, billboards — everything not hidden) top-down into a 512² RT just to capture world Y.
- Files: `src/world/weather/createCollisionHeight.js` (lines 117–128), hide list in `src/world/weather/collisionHideObjects.js`
- Cause: `scene.overrideMaterial` with `renderer.render(scene, ...)` — no layer filtering; the only culling is the manual hide list. Transparent billboard faces and other non-collision geometry are paid for.
- Improvement path: Put all collision-relevant meshes on a dedicated layer and render with a layer-masked camera instead of the whole scene; or raise `collisionRainFrameSkip` (default 1) — the knob already exists in `performanceProfile`.

**Ground planar reflection re-renders the scene:**
- Problem: `updateReflection` performs a full second scene render into a half-res RT every N frames (`groundReflectionFrameSkip: 1` → every other frame).
- Files: `src/world/ground/createGround.js` (lines 190–276)
- Cause: Manual mirror camera + `renderer.render(scene, mirrorCamera)`; `syncReflectionSize` runs a drawing-buffer size query each time it fires.
- Improvement path: Already budgeted (half-res, frame-skip, layer-disabled rain camera). Further gains would need reflection LOD or culling geometry below the plane.

**Finite-difference car rain evaluates the drop graph 3× per pixel:**
- Problem: `computeCarDropNormalOffset` evaluates `CarDrops` at three UV offsets (center, +x, +y) to build normals; the full drop graph (two `MovingDropLayer` evaluations each) runs per evaluation.
- Files: `src/tsl/surfaceRain.js` (lines 169–189), wired per material in `src/world/car/applyCarSurfaceRain.js` (`wireSurfaceRain`)
- Cause: Analytic derivative is impractical for the procedural graph; this is the standard trade.
- Improvement path: The camera-distance fade (`carSurfaceRainFadeStart/End` 20–32 m) already zeros the effect far away. If needed, compute the mask once and approximate the normal from a single packed texture lookup.

**Whole-scene compile hitching on startup:**
- Problem: `renderer.compileAsync(scene, beautyCamera)` compiles all visible materials; the split into critical (city/car/ground/sky) vs deferred (rain/smoke/planes) mitigates but does not eliminate multi-second stalls on weak GPUs.
- Files: `src/runtime/warmup.js`
- Cause: WebGPU pipeline compilation is synchronous-per-pipeline and inherently bursty; Safari additionally blocks the animation loop until compile completes (`shouldCompileBeforeRenderLoop`).
- Improvement path: Already tuned (progress shown at 100% with "ASSEMBLING SEECTOR" status so the loader doesn't look stuck). Further gains would require rendering fewer unique materials on the critical path.

**38 MB of static assets under `public/`:**
- Problem: Five GLB models, six billboard MP4s, multiple ambient MP3s, HDRI, and textures ship as plain static files with no preload orchestration beyond the GLTF parallel loads in `createWorld`.
- Files: `public/` (see `public/models/`, `public/video/`, `public/audio` files at root)
- Cause: All audio (engine loops, footsteps, ambience) loads on demand via `createAppShell.initAudio()`; videos start buffering when billboards load.
- Improvement path: Lazy-load audio until the user unmutes; consider shorter/loopable video variants for mobile (mobile already disables billboards via `performanceProfile.billboardsEnabled = false`).

## Fragile Areas

**Collision-rain height pass (hide list + frame ordering):**
- Files: `src/world/weather/collisionHideObjects.js`, `src/world/weather/createCollisionHeight.js`, `src/runtime/createRenderLoop.js` (lines 25–29)
- Why fragile: Correctness depends on (a) every non-collision visual (rain group, sky mesh, planes group, smoke emitter meshes) being in the hide list, (b) the height RT updating before `rain.update` in the same tick, and (c) rain compute reading a height map that may be one `collisionRainFrameSkip` stale. Adding any new transparent/transient layer (fog volumes, holograms) without updating `collectCollisionHideObjects` makes rain collide with it.
- Safe modification: When adding a world feature, add its root object to `collectCollisionHideObjects` immediately and verify drops don't hover on the new object. Never reorder `collisionHeight.update` after `rain.update` in the loop.
- Test coverage: No automated tests; manual verification per AGENTS.md checklist ("Rain still collides", "No rain/sky in height map").

**Post-processing graph rebuild chain (`rebuildSteadyOutput`):**
- Files: `src/post/postprocessing.js` (lines 241–292)
- Why fragile: Bloom/DoF/lensflare/AO/rain-pass toggles each call `rebuildSteadyOutput()`, which re-derives `steadyOutput`, `steadyOutputWithSmaa`, `introOutput`, and reassigns `post.outputNode`. The intro rain-glass branch must be re-entangled after every rebuild (`disposeIntroRainGlass` + `applyRainGlass` lifecycle is order-sensitive). The dedicated-rain-pass path exists in the graph but is dead code for this implementation (`useDedicatedPass: false`).
- Safe modification: Follow the existing setter pattern (`setXEnabled` → mutate flag → `rebuildSteadyOutput`); new effects must be added inside `rebuildSteadyOutput` and re-checked against the intro-glass branch (AGENTS.md recipe D).
- Test coverage: None; only the settings panel and inspector exercise these paths at runtime.

**WebGPU/TSL version coupling:**
- Files: `package.json` (`three ^0.185.1`), `src/world/loaders/createGltfLoaders.js`, `src/post/postprocessing.js` (MRT, blend-mode, `getTextureNode` APIs)
- Why fragile: TSL and `three/webgpu` APIs change frequently between minor versions; this repo relies on internals (`KTX2Loader._createTextureFrom`, `RenderPipeline`, addon TSL display nodes under `three/addons/tsl/display/`). The codebase is pinned only by a caret range.
- Safe modification: Upgrades to `three` require a full manual pass (build + collision rain + ground reflection + intro glass on WebGPU) before merge. Check the KTX2 patch and the post MRT wiring first.
- Test coverage: No automated tests; the AGENTS.md verification checklist is manual.

**Safari/iOS special-casing is spread across five files:**
- Files: `src/platform/deviceLayout.js` (UA sniffing), `src/platform/performanceProfile.js` (`applyDevicePerformanceDefaults`, `shouldCompileBeforeRenderLoop`), `src/post/postprocessing.js` (line 244: `dofActive && !isSafari()`), `src/main.js` (compile-before-loop gate), `src/platform/adaptiveDpr.js`
- Why fragile: The set of "what Safari breaks" is encoded implicitly across these sites. A new Safari WebGPU regression requires finding all the gates. UA sniffing (`navigator.platform === "MacIntel"`) is itself deprecated-API-dependent.
- Safe modification: Centralize any new platform workaround in `performanceProfile`/`deviceLayout` and reference it from feature code; do not add new inline `isSafari()` checks in render paths.
- Test coverage: None (no Mac/iOS CI).

**`setupInspector.js` size and coupling (963 lines):**
- Files: `src/debug/setupInspector.js` (largest file in `src/`)
- Why fragile: The inspector session reaches into `pipeline`, `sceneResult`, `world`, `cameraDirector`, `cameraParams`, lighting, shadows, and adaptive DPR (wired in `src/main.js` lines 172–186). Every refactor of those public shapes can break inspector wiring, and the file is the least-covered code path (production users only see it via Development Mode).
- Safe modification: When renaming anything on `world`, `pipeline`, or `cameraDirector` return objects, grep `src/debug/` for the old key before merging.
- Test coverage: None; manual Development Mode verification only.

## Scaling Limits

**Rain instance count:**
- Current capacity: 5000 streaks + 5000 splash instances (`MAX_COUNT` in `src/world/weather/createCollisionRain.js`), height map 512² over a 100×100 m volume (`performanceProfile.collisionRainResolution`).
- Limit: Hard cap 5000 regardless of profile; height texel resolution ~5 texels/meter means small overhangs thinner than ~20 cm can be missed between texels.
- Scaling path: Raise `MAX_COUNT` + `collisionRainCount` together and confirm frame budget; raise `collisionRainResolution` (1024) if thin-roof collision errors appear, at height-pass cost.

**Frame budget governance:**
- Current capacity: Device-gated knob set in `src/platform/performanceProfile.js` (bloom/lensflare/AO at 0.5 scale, GTAO 6 samples, ground reflection 0.5 scale with frame skip 1, collision height frame skip 1).
- Limit: The budget system is conventions + flags, not enforcement — nothing prevents adding a full-res pass except review. Adaptive DPR provides a one-way safety net on non-Safari devices.
- Scaling path: New expensive work must follow the AGENTS.md rule (half-res, frame-skip, or distance fade) and add a `performanceProfile` flag; mobile defaults must stay gated in `applyDevicePerformanceDefaults`.

## Dependencies at Risk

**`three` (`^0.185.1`):**
- Risk: Pre-1.0, fast-moving WebGPU/TSL API surface; private-API monkey-patch (`KTX2Loader._createTextureFrom`) and addon-node imports (`three/addons/tsl/display/*`) can break on minor bumps.
- Impact: Build succeeds but runtime shader/texture failures, or import-time crashes in the loader patch.
- Migration plan: Pin exact versions for upgrades; run the manual verification checklist (build, WebGPU dev context, rain collision, height-map purity, mobile profile) on every bump. Watch for an upstream WebGPU fix to KTX2 uncompressed textures to delete the patch.

**`vercel` (`^56.2.0`) as a runtime dependency:**
- Risk: The entire Vercel CLI (~large install footprint) sits in `dependencies` rather than `devDependencies`, used only for `npm run deploy`.
- Impact: Bloats production dependency installs; version churn unrelated to the app.
- Migration plan: Move to `devDependencies` (deploy CLI is a dev concern) or replace the script with a CI action.

**`three-mesh-bvh` (`^0.9.13`):**
- Risk: Tightly coupled to specific three.js internals (geometry attribute access); version mismatches with `three` cause subtle walk-collision breakage.
- Impact: Player falls through geometry or stutters on stairs.
- Migration plan: Upgrade in lockstep with `three` and re-verify walk mode (crouch, sprint, step-up on curbs) after each bump.

## Missing Critical Features

**No automated test suite:**
- Problem: Zero test files, no test runner in `package.json`, no lint config, no CI pipeline.
- Blocks: Regression detection for the fragile areas above (post rebuild chain, hide list, KTX2 patch, platform gates) relies entirely on the manual AGENTS.md checklist.

**No error telemetry or user-facing WebGPU capability check:**
- Problem: Startup failure shows a generic loader message (`src/main.js` lines 51–54); browsers without WebGPU get no explicit "WebGPU required" notice; no error reporting beyond `console`.
- Blocks: Field diagnosis of device-specific WebGPU failures; users on unsupported browsers get a silent non-experience.

**No renderer/device-loss recovery:**
- Problem: WebGPU device loss (`device.lost`) is not handled; the page would freeze on the last frame.
- Blocks: Long-running sessions on driver-reset-prone machines.

## Test Coverage Gaps

**Entire rendering pipeline (High):**
- What's not tested: Post graph assembly, look presets, rebuild chain, intro rain-glass lifecycle, adaptive DPR decisions.
- Files: `src/post/postprocessing.js`, `src/post/look/cyberpunkLook.js`, `src/platform/adaptiveDpr.js`
- Risk: A flag-rename or node wiring change breaks rendering only at runtime, possibly only on specific toggles.
- Priority: High (but requires headless WebGPU, e.g., Chrome `--enable-unsafe-webgpu` + Playwright, or extract pure logic — preset tables, DPR math — into unit tests first).

**Collision rain correctness (High):**
- What's not tested: Hide-list completeness, height-map UV math (`getUV`/`getPosition` round-trip), respawn logic, frame-skip staleness behavior.
- Files: `src/world/weather/createCollisionHeight.js`, `src/world/weather/createCollisionRain.js`, `src/world/weather/collisionHideObjects.js`
- Risk: Rain falling through roofs or colliding with newly added layers — the exact regressions the AGENTS.md checklist guards manually.
- Priority: High — `getUV`/`getPosition` are pure node math and unit-testable; hide-list completeness is testable with a scene fixture.

**Platform detection and perf gates (Medium):**
- What's not tested: `isSafari`/`isAppleMobile`/`isMobileDevice` against real UA strings; `applyDevicePerformanceDefaults` output per device class.
- Files: `src/platform/deviceLayout.js`, `src/platform/performanceProfile.js`
- Risk: UA changes (e.g., iPadOS changes) silently mis-gate devices.
- Priority: Medium — table-driven UA fixture tests are cheap and need no GPU.

**Walk controls physics (Medium):**
- What's not tested: Step-up/step-down limits, wall probing, crouch/sprint state machine, virtual joystick mapping.
- Files: `src/controls/createWalkControls.js` (799 lines, second-largest file), `src/ui/walk/createWalkInputFacade.js`
- Risk: Collision math regressions trap the player in geometry.
- Priority: Medium — the movement math is CPU-side and testable with a mocked BVH raycaster.

**Pure TSL-adjacent logic (Low):**
- What's not tested: `getRainLayerWeights`/`getCarRainLayerWeights` blending, splash frame selection math, `MovingDropLayer` constants.
- Files: `src/tsl/surfaceRain.js`, `src/tsl/rainGlass.js`
- Risk: Visual-parameter regressions only; no functional breakage.
- Priority: Low.

---

*Concerns audit: 2026-11-22*
