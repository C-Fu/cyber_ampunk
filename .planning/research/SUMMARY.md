# Project Research Summary

**Project:** Cyberpunk Malaya (brownfield fork of Threejs-Punk — Three.js WebGPU/TSL cyberpunk alley demo)
**Domain:** Localized bilingual (BM default / EN toggle) web demo + browser TTS Malay narration
**Researched:** 2026-11-22
**Confidence:** HIGH

## Executive Summary

Cyberpunk Malaya is a brownfield feature milestone on an existing, deliberately dependency-light WebGPU/TSL demo: add Bahasa Melayu as the default UI language with an EN toggle, a KL-flavored BM intro story, and Malay TTS narration of that story via the Web Speech API. The research is unusually well-grounded because all four dimensions were verified against the actual codebase — the text surface (~15 UI factories with `innerHTML`/`textContent` strings, loader statuses in `main.js`, static `index.html` head) is enumerated file-by-file, and the sanctioned patterns to extend (module-scope pub/sub store à la `audioState.js`, `userPreferences.js` localStorage wrapper, per-factory `syncText()` hooks, nullable-feature factory contract) are already documented with exact seams.

The recommended approach is **zero new dependencies**: hand-rolled ES-module dictionaries behind a small `i18n` store (copying the `audioState.js` pub/sub shape), plus browser-native `speechSynthesis` for narration. i18next was evaluated (latest 27.2.4, verified on npm) and rejected as overkill for 2 locales × ~150 strings; Piper WASM TTS was ruled out (no usable official Malay voice, ~60 MB models); cloud TTS at runtime requires an API key and a server proxy this static Vercel site doesn't have. The single highest-risk area is **Malay voice availability and Web Speech API runtime behavior**: `ms-MY` voices are absent on stock macOS/iOS and default Windows, Chrome blocks `speak()` without a user gesture, and both Safari and Chrome silently cut utterances longer than ~15 seconds.

Mitigation is architectural, not optional: anchor narration start to the existing ENTER-button gesture, chunk the story into sentence-sized utterances queued via `onend` with a watchdog, resolve voices through a graded chain (local `ms` → network `ms-MY` → labeled `id-ID` fallback → text-only), treat narration as an enhancement (the overlay always tells the story in text), and validate the platform matrix with a short spike before building the full narration pipeline.

## Key Findings

### Recommended Stack

No new npm dependencies. The entire milestone is built from ES modules and browser built-ins, matching the project's composition pattern (`main.js` builds plain objects; deps today are only `gsap`, `three`, `three-mesh-bvh`).

**Core technologies:**
- Hand-rolled i18n store + dictionaries (`src/i18n/i18n.js` + `src/i18n/dictionaries/`) — zero deps, matches factory pattern, text surface is small and fully enumerated
- `Intl.DisplayNames` (browser built-in) — native locale labels ("Bahasa Melayu" / "English") in the settings toggle
- Web Speech API `speechSynthesis` (browser built-in) — only zero-dependency runtime TTS; constraints (gesture gate, async voices, 15 s cutoff) are all manageable for a fixed intro script
- Pre-synthesized narration audio (optional later phase) — offline-generated via Azure `ms-MY-KhalisaNeural`/`OsmanNeural`; guaranteed quality for fixed copy, no API key shipped client-side

**Critical version/constraint facts:** i18next 27.2.4 is the only credible library alternative (migration is mechanical if locale count ever grows past ~4–5); Piper's official voice catalog has **no Malay entry** (closest is `id_ID`; the third-party "malay-ms-medium" model uses a Vietnamese phonemizer and an unspecified license — unusable); Edge exposes Azure natural ms-MY voices as *network* voices gated by enterprise policy; Chrome has required user activation for `speak()` since M71, and iOS requires the first `speak()` synchronously inside a tap handler.

### Expected Features

**Must have (table stakes):**
- Full BM/EN parity of every user-facing string (header, settings, about, intro story, walk hints, HUD, performance notice, loader) — partial translation reads as broken (NN/g)
- Visible language toggle in the header (plain-text "BM | EN", no flags, no modal-only switch), persisted via the existing `userPreferences.js` localStorage pattern
- Instant language switch without reload (reload would kill the WebGPU scene); update `<html lang>` and `document.title` on switch
- Narration user-initiated (starts from the ENTER press — WCAG 1.4.2 / G171 compliant), with a visible, persistent mute/stop control
- Graceful degradation when no ms-MY voice exists — never silently mispronounce; text-only is the floor
- Localized ARIA labels (existing `aria-label`/`aria-live` usage must draw from the dictionary too)

**Should have (differentiators):**
- KL-cyberpunk-flavored BM intro story rewrite (localization, not translation — the milestone's emotional core)
- Gesture-anchored auto-starting narration with a pre-entry notice ("naratasi bunyi akan dimulakan" + mute toggle)
- Voice fallback chain ms-MY → id-ID → any `ms`/`id` prefix → unavailable state; narration language follows UI language
- Replay/tap-to-listen button on the intro (cheap recovery path)

**Defer (v2+):**
- Localized OG/Twitter meta runtime swap (title alone covers the tab/bookmark case)
- Pre-recorded narration audio asset (revisit if runtime TTS quality disappoints — decision point after Phase 3)
- URL-based locale routing / hreflang (single-URL SPA; Google's own guidance makes it optional)
- Any i18n framework adoption, pluralization/ICU support, remote voice loader module

### Architecture Approach

Two new leaf modules and one audio factory, wired from the existing composition root — no framework, no build tooling, no render-loop changes (`src/runtime/createRenderLoop.js` and `src/world/**`/`src/post/**`/`src/tsl/**` untouched).

**Major components:**
1. `src/i18n/i18n.js` — module-scope pub/sub store (`t(key)`, `setLanguage`, `getLanguage`, `subscribe` with immediate-sync-on-register, matching `audioState.js`); persists via new `getStoredLanguage`/`setStoredLanguage` in `userPreferences.js`; sets `document.documentElement.lang`
2. `src/i18n/dictionaries/bm.js`, `en.js` — plain exported objects, namespaced by module (`loader.*`, `intro.*`, `settings.*`, `about.*`, `walkPrompt.*`, `hud.*`, …); intro story and narration share the same `intro.*` keys (single source of truth)
3. `src/i18n/staticHead.js` + `data-i18n` attributes in `index.html` — boot-time translation of title/meta/noscript; BM hardcoded as the static baseline; `i18n` import ordered before `createLoaderOverlay` so loader statuses render in the active language from the first frame
4. Per-factory text sync — each UI factory replaces literals with `t()` lookups and re-runs a `syncText()` on `i18n.subscribe`; `data-i18n` spans handle multi-paragraph blocks (about panel); dictionary content rendered via `textContent` only, never `innerHTML` (XSS-safe by construction)
5. `src/audio/createIntroNarration.js` — speechSynthesis factory (`start/cancel/destroy`) created inside `createIntroFlow.runIntroSequence()`; starts from the ENTER gesture; sentence-chunked utterance queue with watchdog; cancels on mute via `audioState` subscription; optional `src/audio/loadNarrationVoice.js` fallback module kept swappable

**Key patterns to follow:** module-scope store (the only sanctioned global-store shape per CONVENTIONS.md); lookup-not-injection for factories (injected strings freeze language at construction); cancel-and-restart instead of `pause()`/`resume()`; never poll narration state from the render loop; no teardown/rebuild of `appShell` on language change.

### Critical Pitfalls

1. **15-second utterance cutoff (Safari AND Chrome)** — chunk narration into sentence-sized (~200–300 char) utterances queued via `onend`, with a watchdog timer and a skip affordance; never rely on `onend` alone
2. **Autoplay/user-gesture gate** — never `speak()` before the ENTER click (silently fails on Chrome/iOS); attach all utterance handlers before `speak()`; the ENTER handler is the guaranteed gesture, mirroring `createAudioButton`'s audio-unlock pattern
3. **Voice-loading race + missing ms-MY voices** — read `getVoices()` eagerly AND on every `voiceschanged` (fires late in Chromium, re-fires when network voices appear/vanish); resolve via graded chain by `lang` prefix (never by voice name or `default` flag), prefer `localService: true`, and treat `id-ID` as a labeled — never silent — fallback
4. **Silent wrong-language speech is worse than none** — on stock macOS/iOS and default Windows there is *no* local Malay voice; the intro overlay must fully tell the story in text, narration is an enhancement (matches the nullable-feature contract)
5. **Malay text expansion (15–30% EN→MS) + no Malay hyphenation in most browsers** — audit fixed-width HUD/caption chrome, use min-width + wrap, set `<html lang="ms">`, never depend on `hyphens: auto`

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: i18n Foundation — Dictionaries, Store, and Full String Migration
**Rationale:** Everything else depends on the dictionary and store; the architecture research provides an exact per-file seam list, making this the lowest-risk, highest-certainty phase.
**Delivers:** `src/i18n/i18n.js` + `bm.js`/`en.js` dictionaries covering all ~15 UI factories, loader statuses, `index.html` static head via `data-i18n`, `userPreferences` language persistence, `<html lang>`/title updates.
**Addresses:** Table stakes: full BM/EN string parity, BM default, persisted override, `lang` attribute correctness.
**Avoids:** Anti-patterns 1–4 and 6 (no framework, no injected strings, no `innerHTML` dictionary rendering, no build-time translation); Pitfall 10/11 (text expansion audit, hyphenation) via the fixed-width audit.

### Phase 2: Language Toggle + BM Intro Story
**Rationale:** With the store in place, the toggle and story rewrite are pure UI/content work on well-understood seams; shipping the KL-flavored story *with* the dictionary (not after) is the FEATURES.md MVP recommendation — the story is the milestone's identity.
**Delivers:** Header/settings language toggle (plain-text "BM | EN", `Intl.DisplayNames` labels if a labeled control is chosen), instant no-reload switch via per-factory `syncText()` subscriptions, KL-cyberpunk BM intro story as `intro.*` keys with a tonal EN parallel (not a literal translation).
**Addresses:** Table stakes: visible toggle, instant switch; differentiator: culturally specific story.
**Avoids:** Flags-as-icons, IP-based redirects, modal-only toggle placement (anti-features); anti-pattern 2 (no appShell teardown/rebuild on switch).

### Phase 3: Malay TTS Narration (spike first)
**Rationale:** The highest-risk phase — every critical pitfall (voice race, gesture gate, 15 s cutoffs, queue hangs, missing voices) lands here. PITFALLS.md explicitly recommends a one-day spike (minimal "click → speak Malay sentence, chunked" page on the device matrix) before building the full pipeline.
**Delivers:** `createIntroNarration.js` with sentence-chunked utterance queue + watchdog, graded voice resolution (local ms → network ms-MY → labeled id-ID → text-only), gesture-anchored start from ENTER, persistent mute wired to the audio button / `audioState`, `cancel()`-based skip.
**Addresses:** Differentiators: gesture-anchored narration, fallback chain, narration-follows-UI-language; table stakes: WCAG 1.4.2 stop control, graceful degradation.
**Avoids:** Pitfalls 1–6, 8, 9, 13 (all critical + queue/visibility races); render-loop polling (anti-pattern 5).

### Phase 4 (optional, decide after Phase 3): Pre-synthesized Narration Audio
**Rationale:** Only if runtime TTS quality/coverage on the device matrix is unacceptable. The intro story is fixed copy, so offline generation via Azure `ms-MY` neural voices (~1–2 MB compressed asset) gives every visitor identical high-quality narration with zero runtime voice risk; Web Speech stays for dynamic text.
**Delivers:** Compressed narration asset + playback path; no server, no API key in the client bundle.
**Avoids:** Pitfall 7's secret-key and 60 MB-WASM traps entirely; the meSpeak quality floor.

### Phase Ordering Rationale

- **Dependency chain from FEATURES.md:** dictionary → toggle/switch → story → narration (the story keys are the narration script — single source of truth forces content before TTS)
- **Risk gradient:** Phases 1–2 are mechanical refactors on enumerated seams with HIGH-confidence patterns; Phase 3 carries all the platform unknowns, so it comes last with a spike gate — a failure there cannot destabilize the already-shipped localization
- **Pitfall isolation:** i18n pitfalls (10, 11) are confined to Phases 1–2; TTS pitfalls (1–9, 13) to Phase 3; the optional Phase 4 exists specifically as the escape hatch for Phase 3's residual risk

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3:** Needs the recommended pre-roadmap spike (`$gsd-plan-phase --research-phase 3` or a dedicated spike task): device-matrix validation of ms-MY voice availability (macOS/iOS absence is MEDIUM-confidence inference), Safari 26 / iOS gesture scoping, Chrome network-voice behavior, `voiceschanged` timing. No headless/CI coverage is possible for speechSynthesis — UAT must be manual on real devices.
- **Phase 1:** Light research only if needed — the per-file seam list in ARCHITECTURE.md is already implementation-grade; no external APIs involved.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Pure application of documented patterns (`syncText()` subscription, existing settings-panel hooks); the story rewrite is creative work, not research
- **Phase 4 (if taken):** Standard static-asset delivery; generation is a one-time offline step

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | i18n and TTS choices verified against npm registry, vendor docs, and the codebase; the one MEDIUM item (exact per-OS ms-MY voice availability) is un-resolvable by research — runtime feature detection is the design answer |
| Features | HIGH | UX patterns sourced from normative/authoritative bodies (W3C WAI, Section508, NN/g, USWDS) and cross-checked against actual code (`userPreferences.js`, `createIntroFlow.js`, aria usage) |
| Architecture | HIGH | Every seam verified by reading the source; patterns copied from existing sanctioned modules (`audioState.js`, `userPreferences.js`, `createAudioButton.js`) |
| Pitfalls | HIGH | Each pitfall source-tagged; critical items (15 s cutoff, gesture gate, voice race) corroborated by MDN + Chromium tracker + multiple independent reports; platform-matrix *absence* claims are MEDIUM and flagged for spike validation |

**Overall confidence:** HIGH — this is a brownfield milestone with codebase-grounded research; the only material unknowns are platform TTS behaviors that only a device-matrix spike can resolve.

### Gaps to Address

- **Exact ms-MY voice presence per OS/browser (macOS/iOS/Windows-default):** MEDIUM-confidence absence claims — resolve via the Phase 3 spike; the graded fallback chain makes this a quality issue, not a blocker
- **Safari 26 / iOS current behavior:** iOS gesture scoping and visibility interactions change across releases — re-verify on real hardware during the spike; produce the per-browser behavior matrix doc in `docs/techniques/` per project convention
- **Edge natural-voice `pitch`/`rate` reliability:** documented issues with pitch on natural voices — test during implementation; consider exposing rate in settings rather than hardcoding
- **id-ID fallback UX (explicit notice vs. silent):** copy/product decision, not technical — decide during Phase 3 planning
- **Dictionary/module naming discrepancy between research files:** STACK.md sketches `createI18n.js` + `locales/ms.js`; ARCHITECTURE.md specifies `i18n.js` + `dictionaries/bm.js` with verified seams. Standardize during Phase 1 planning (ARCHITECTURE.md's version is the codebase-grounded one; note BCP 47 maps "bm" to Bambara — the stored key is internal, but `document.documentElement.lang` must be `"ms"`, which ARCHITECTURE.md already handles)
- **Narration-playing performance condition:** extend `performanceProfile` verification with "narration playing" as a test condition per the AGENTS.md budget rule

## Sources

### Primary (HIGH confidence)
- Codebase reads (2026-11-22): `src/audio/audioState.js`, `src/platform/userPreferences.js`, `src/ui/chrome/createAudioButton.js`, `src/app/createIntroFlow.js`, `src/app/createAppShell.js`, `src/ui/**` string-site inventory, `index.html`, `src/main.js`, `package.json`, `.planning/codebase/*`
- MDN Web Docs — Web Speech API, `speechSynthesis`, `getVoices()`, `voiceschanged`, `SpeechSynthesisVoice.localService`, `SpeechSynthesisErrorEvent`, `SpeechSynthesisUtterance`, autoplay guide
- W3C WAI — Understanding SC 1.4.2 Audio Control (WCAG 2.2 Level A), technique G171; W3C i18n — declaring language in HTML, text expansion guidance
- Chrome autoplay policy — developer.chrome.com/blog/autoplay
- Chromium bug tracker — issues 40108622, 41671978, 40306004 (long-utterance cutoff, hanging end events, pause/resume)
- Readium speech — per-browser/OS speechSynthesis voice provenance and testing
- Microsoft — Azure Speech language support (ms-MY neural voices), Edge `ConfigureOnlineTextToSpeech` policy
- rhasspy/piper — VOICES.md (no official Malay voice)
- Nielsen Norman Group — language switcher best practices; US Web Design System — two-language selector pattern
- Google Search Central — multilingual site guidance (hreflang optional for single-URL SPA)
- i18next on npm — version/health check (as evidence for the rejection, not adoption)

### Secondary (MEDIUM confidence)
- Smashing Magazine (Vitaly Friedman, 2022) — language selector UX; Bablic (2026-10) — consistent vendor guidance
- TryDeputize "SpeechSynthesis Crash Course" (2026-09) — measured Chrome behaviors (15 s cutoff, chunking workaround, underscore normalization)
- textintoaudio.com browser-support matrix — cross-checked with MDN
- Stack Overflow threads (Safari gating, 15 s cutoff, priming workaround, Chrome pause/resume)
- Google Cloud TTS voice list (ms-MY voices) — not re-verified this session
- Apple AVFoundation voice catalog — Malay absence inferred from published list

### Tertiary (LOW confidence, needs validation)
- Piper WASM + WebGPU contention magnitude — speculation until measured; only relevant if the WASM fallback were pursued (it isn't recommended)
- Exact EN→MS text expansion percentage (15–30%) — localization-industry rule of thumb, not Malay-specific measurement

---
*Research completed: 2026-11-22*
*Ready for roadmap: yes*
