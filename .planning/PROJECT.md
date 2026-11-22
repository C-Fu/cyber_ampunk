# Cyberpunk Malaya

## What This Is

A fork of the Threejs-Punk WebGPU demo reimagined for a Malaysian audience: a rain-soaked, neon-lit cyberpunk alley in Kuala Lumpur rendered with Three.js TSL. This project's current goal is to make the entire experience speak Bahasa Melayu by default — UI, intro story, and spoken narration — while keeping full English parity via a settings toggle.

## Core Value

Every piece of text and the intro narration are presented in Bahasa Melayu by default, with a complete English toggle — the app must feel natively Malay, not translated.

## Requirements

### Validated

<!-- Inferred from existing codebase (map: .planning/codebase/, 2026-11-22) -->

- ✓ WebGPU-first rendering with WebGL2 fallback (`src/bootstrap/createRenderer.js`) — existing
- ✓ Cyberpunk alley scene: GLB assets, HDR sky, neon signage (`src/world/createWorld.js`) — existing
- ✓ GPU rain with collision height texture; drops land on roofs (`src/world/weather/createCollisionRain.js`) — existing
- ✓ Wet ground: ripples + planar reflection, no SSR (`src/world/ground/createGround.js`) — existing
- ✓ Procedural wet car paint (`src/world/car/applyCarSurfaceRain.js`) — existing
- ✓ Walk mode with BVH collision + orbit camera fallback (`src/controls/createWalkControls.js`, `src/world/bvh.js`) — existing
- ✓ TSL post stack: bloom, GTAO, DoF, cyberpunk grade (`src/post/postprocessing.js`) — existing
- ✓ Intro flow with rain-glass overlay and story text (`src/ui/intro/createIntroOverlay.js`) — existing
- ✓ Settings / about / header UI panels (`src/ui/chrome/`) — existing
- ✓ Procedural audio: footsteps, car engine, plane engine with mute toggle (`src/audio/`, `src/ui/chrome/createAudioButton.js`) — existing
- ✓ Performance profiles: Safari/mobile gates, adaptive DPR (`src/platform/performanceProfile.js`) — existing
- ✓ Static deploy to Vercel (`npm run deploy`) — existing

### Active

- [ ] All user-facing text renders in Bahasa Melayu by default (header, settings, about, intro story, walk hints, HUD, performance notice, loader overlay)
- [ ] Language toggle (BM ⇄ EN) available in the settings panel; choice persists across sessions
- [ ] Intro story text rewritten with KL cyberpunk flavor in BM, with faithful EN counterpart
- [ ] Malay TTS narration of the intro story starts automatically with the intro (respecting autoplay policy / audio button state)
- [ ] When no Malay (ms-MY) voice is installed, a Malay TTS voice is fetched/loaded from the network so narration still works
- [ ] Malay copy drafted by the AI, reviewed and corrected by the owner

### Out of Scope

- Mission system (walk-to-marker objectives, story missions, checkpoints) — deferred; revisit after localization milestone. The mission concept exists only as an idea, no design yet.
- Localizing procedural sound effects (footsteps, engines) — they carry no language content
- Any other languages beyond BM and EN — no demand identified
- Recorded human voice-over — TTS is the chosen approach; recordings would be a future enhancement
- Server-side rendering / backend — static site stays static

## Context

- Brownfield fork: full codebase map in `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS; stamped 2026-11-22).
- All user-facing strings are currently hardcoded English, scattered across UI factory modules in `src/ui/**` (text set via `textContent` in `create*` factory functions) plus `index.html` meta/title and the loader overlay in `src/app/createLoaderOverlay.js`.
- Audio is fully procedural (WebAudio-synthesized footsteps/engines in `src/audio/`); no audio files with speech. Browser TTS = `speechSynthesis` API (Web Speech API), zero dependencies.
- `speechSynthesis` voice availability for `ms-MY` is inconsistent across browsers/OSes — this is the main technical risk for narration. Options include bundled remote voices (e.g., meSpeak-style WASM TTS) if the platform voice is missing; research phase should evaluate.
- Existing settings panel (`src/ui/chrome/createSettingsPanel.js`) is the natural home for the language toggle; existing audio button (`createAudioButton.js`) governs audio state — TTS must respect it.
- User preferences already persist to `localStorage` (`src/platform/userPreferences.js`) — language choice should follow the same pattern.
- Story flavor: KL cyberpunk — a runner making deliveries across the alley, corporations, rain-soaked neon KL. The current intro story text needs a BM rewrite in this flavor, not a literal translation of the English.

## Constraints

- **Tech stack**: Three.js from `three/webgpu` + `three/tsl`, TSL node materials, no custom GLSL — project hard constraint from `AGENTS.md`
- **Compatibility**: Web Speech API `speechSynthesis` must work or fail gracefully across Chrome/Edge/Safari/mobile — narration is an enhancement, never a blocker for the experience
- **Performance**: No new full-res render passes; TTS/i18n work is CPU/DOM-side and must not touch the render loop budget
- **Assets**: Any fetched TTS voice adds network payload — prefer platform `ms-MY` voice when available; fetch only as fallback
- **Design**: Follow existing factory/composition patterns (`create*` factories, options objects, optional chaining) — no framework introductions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| BM default, EN via toggle (no auto-detect) | Owner wants the app to feel natively Malay for every first-time visitor | — Pending |
| TTS via Web Speech API for intro narration | Zero dependencies, adequate for one story passage; recorded audio out of scope | — Pending |
| Auto-start narration with intro (gated by audio button/autoplay) | Narration is part of the intro experience, not an opt-in extra | — Pending |
| Fetch network Malay voice when no local ms-MY voice | Guarantees narration works everywhere; costs bytes only when needed | — Pending |
| Intro story rewritten in KL cyberpunk flavor (not literal translation) | The demo is being reimagined as Malaysian; flavor matters | — Pending |
| AI drafts Malay copy, owner reviews | Owner is the language authority; AI drafts accelerate | — Pending |
| Missions deferred to future milestone | Localization is the focus; no mission design exists yet | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-22 after initialization*
