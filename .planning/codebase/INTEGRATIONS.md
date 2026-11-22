---
last_mapped_commit: 8cc20593b2270e2ce832e7b7b44356705daddec4
last_mapped_at: 2026-11-22
---
# External Integrations

**Analysis Date:** 2026-11-22

## APIs & External Services

**None at runtime.** This is a fully static, client-only WebGPU demo. No third-party SDKs, no network calls from application code.

**Browser platform APIs (internal, not external services):**
- WebGPU (`navigator.gpu`) - renderer capabilities/limits, `src/bootstrap/createRenderer.js`
- Web Audio (via three.js `AudioListener` / `PositionalAudio` / `AudioLoader`) - music, ambience, car/plane engines, wet footsteps: `src/audio/audioState.js`, `src/audio/createCarEngineAudio.js`, `src/audio/createPlaneEngineAudio.js`, `src/audio/createWetFootstepAudio.js`
- `localStorage` - look preset persistence and dev-mode flag, `src/platform/userPreferences.js` (with try/catch for unavailability); inspector state, `src/debug/inspectorControls.js`
- Pointer/touch/keyboard input (walk controls, virtual joystick) - `src/controls/createWalkControls.js`, `src/ui/walk/`
- `<video>` textures - billboard feeds from local files in `public/video/`
- WASM (vendored locally) - Draco mesh decoding (`public/libs/draco/`) and Basis/KTX2 texture transcoding (`public/libs/basis/`), wired in `src/world/loaders/createGltfLoaders.js`

**Asset loading (all same-origin, static files from `public/`):**
- glTF models (`GLTFLoader` + `DRACOLoader` + `KTX2Loader`): `src/world/loaders/createGltfLoaders.js`
- HDR environment maps (`HDRLoader`): `public/hdri/*.hdr`, used by `src/world/envMap.js`
- No cross-origin asset fetching; no CDN dependencies

## Data Storage

**Databases:**
- None

**File Storage:**
- Local filesystem only (repo `public/` directory, committed)

**Caching:**
- None beyond standard browser HTTP caching

## Authentication & Identity

**Auth Provider:**
- None - public static site, no users, no auth

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, analytics, or telemetry detected)

**Logs:**
- `console` only; dev diagnostics behind `window` dev API / performance dev tools: `src/debug/createDevAppApi.js`, `src/debug/createPerformanceDevTools.js`, `src/debug/createInspectorSession.js`

## CI/CD & Deployment

**Hosting:**
- Vercel (static site). Deploy via `npm run deploy` → `vercel --prod` (CLI listed in `package.json` dependencies). Live URL: https://threejspunk.vercel.app/ (canonical in `index.html:34`)

**CI Pipeline:**
- None (no GitHub Actions/workflows detected; deploys are manual CLI invocations)

## Environment Configuration

**Required env vars:**
- None

**Secrets location:**
- None; no `.env` files present. Repo contains no credentials

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## External References (non-runtime, documentation/credits only)

- Source-code attribution links (e.g., GitHub repo, credits to Anderson Mancini, rocksdanister/rain technique, TSL Workshop) appear in `README.md`, `AGENTS.md`, and UI about panel link source `src/ui/core/externalLinks.js` (`SOURCE_CODE_URL`) - these are outbound display links, not API calls

---

*Integration audit: 2026-11-22*
