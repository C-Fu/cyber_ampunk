---
last_mapped_commit: 8cc20593b2270e2ce832e7b7b44356705daddec4
last_mapped_at: 2026-11-22
---
# Technology Stack

**Analysis Date:** 2026-11-22

## Languages

**Primary:**
- JavaScript (ES modules, `"type": "module"`) - entire `src/` tree; no TypeScript detected

**Secondary:**
- CSS - UI styling, co-located in `src/ui/**` (e.g., `src/debug/inspectorLayout.css`) plus `src/ui/core/global.css`
- HTML - single-page shell `index.html` (SEO meta, JSON-LD, loads `/src/main.js`)
- GLSL/WGSL - none written by hand; all shading via Three.js TSL node graphs (hard constraint from `AGENTS.md`)

## Runtime

**Environment:**
- Browser (client-only app; no server runtime, no Node.js server code)
- WebGPU-first: `navigator.gpu` checked in `src/bootstrap/createRenderer.js` (`getWebGPURimits()` requests adapter limits); automatic WebGL2 fallback via `WebGPURenderer` backend detection (`renderer.backend.isWebGLBackend`, `src/bootstrap/createRenderer.js:60`)
- Node.js required only for tooling (Vite dev/build)

**Package Manager:**
- npm (no `packageManager` field, no lockfile alternatives)
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- three.js `^0.185.1` - rendering engine, imported exclusively from `three/webgpu` and `three/tsl` plus `three/addons/*` (loaders, controls, TSL display nodes, Inspector)
- GSAP `^3.15.0` - animation/tweening for camera director, loader overlay, intro flow (`src/app/createLoaderOverlay.js`, `src/runtime/createCameraDirector.js`, `src/intro/createRainGlassIntro.js`, `src/ui/intro/createIntroOverlay.js`)
- three-mesh-bvh `^0.9.13` - BVH raycasting for walk-mode collision (`src/world/bvh.js`, wired from `src/controls/createWalkControls.js`)

**Testing:**
- Not detected - no test framework, no test files, no test scripts in `package.json`

**Build/Dev:**
- Vite `^6.3.5` - dev server and production build (`npm run dev`, `npm run build`, `npm run preview`)
- @vitejs/plugin-basic-ssl `^2.3.0` - HTTPS dev server (WebGPU requires a secure context; see `vite.config.js:53`)
- Custom Vite middleware plugin `three-inspector-extensions` (`vite.config.js:21-45`) - serves `node_modules/three/examples/jsm/inspector/extensions` at `/node_modules/.vite/extensions/` for dev and preview servers
- vercel `^56.2.0` - CLI deployment tool (`npm run deploy` runs `vercel --prod`)

## Key Dependencies

**Critical:**
- three `^0.185.1` - WebGPURenderer, TSL node materials, `RenderPipeline`, addons: `GLTFLoader`, `DRACOLoader`, `KTX2Loader`, `HDRLoader`, `OrbitControls`, `BloomNode`, `GTAONode`, `Inspector`
- three-mesh-bvh `^0.9.13` - `buildModelBvh` / `installBvhRaycast` in `src/world/bvh.js` for per-frame character collision without custom physics engine

**Infrastructure:**
- gsap `^3.15.0` - timeline/positioner tweens for cinematic camera moves and UI transitions
- vercel `^56.2.0` - deployment CLI (a runtime dependency in `package.json`, used only for deploys)

## Configuration

**Environment:**
- No `.env` files; no runtime environment variables. All configuration is code-based:
  - Feature flags: `src/world/features.js` (`FEATURES` object)
  - Performance budgets / device profiles: `src/platform/performanceProfile.js` (Safari/mobile defaults, e.g., DoF off)
  - User preferences persisted to `localStorage` (look preset, dev mode cleanup): `src/platform/userPreferences.js`
  - Adaptive DPR: `src/platform/adaptiveDpr.js`
- WebGPU limits negotiated at runtime in `src/bootstrap/createRenderer.js` (`requiredLimits` from `navigator.gpu.requestAdapter()`)

**Build:**
- `vite.config.js` - HTTPS dev server (`basicSsl()`), `host: true` (LAN testing on mobile), inspector extensions middleware
- `index.html` - app shell with SEO/JSON-LD, canonical URL `https://threejspunk.vercel.app/`
- `.gitattributes` - line-ending normalization
- Static assets served from `public/` (no build-time asset pipeline): models (`.glb`), HDRIs (`.hdr`), textures, fonts (self-hosted `orbitron-latin.woff2`, `gloock-*.woff2`, `Phosphor.*` in `public/fonts/`), audio (`.mp3`), video (`.mp4`)
- Decoder libraries vendored locally (no CDN): `public/libs/draco/*` (Draco mesh compression), `public/libs/basis/*` (KTX2/Basis texture transcoding, WASM)

## Platform Requirements

**Development:**
- Node.js + npm; `npm install` then `npm run dev` (opens HTTPS URL automatically)
- WebGPU-capable browser for the intended experience (Chrome/Edge 113+, Safari 26+); WebGL2 fallback exists (`src/bootstrap/createRenderer.js:60-62`)
- Local HTTPS via `@vitejs/plugin-basic-ssl` (self-signed cert) because WebGPU requires a secure context
- Dev-only tooling gated behind `isDevelopmentModeEnabled()` (`src/platform/userPreferences.js`): performance dev tools and Inspector session in `src/debug/`

**Production:**
- Static site deployed to Vercel (`npm run deploy`; live at https://threejspunk.vercel.app/)
- All assets bundled/served statically; no server-side rendering, no API backend

---

*Stack analysis: 2026-11-22*
