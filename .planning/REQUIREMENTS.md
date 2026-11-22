# REQUIREMENTS.md

**Project:** Cyberpunk Malaya
**Created:** 2026-11-22
**Source:** Questioning + research (`.planning/research/SUMMARY.md`)

## v1 Requirements

### Localization Core

- [x] **LOC-01**: All user-facing text renders in Bahasa Melayu by default across every UI surface — header, settings panel, about panel, intro overlay, walk hints, HUD, virtual joystick, walk prompt, performance notice, loader overlay, and loader statuses in `src/main.js`
- [ ] **LOC-02**: User can switch language BM ⇄ EN with an instant, no-reload re-render of all visible UI (pub/sub text re-sync, no appShell teardown)
- [x] **LOC-03**: `document.documentElement.lang` and `document.title` swap at runtime with the active language (`"ms"` for BM)
- [x] **LOC-04**: Static `index.html` head text (title, meta description) is localized with BM as the hardcoded static baseline, swapped to EN via JS only when the stored preference says EN
- [x] **LOC-05**: OG/Twitter card meta tags localize with the active language

### Language Toggle

- [ ] **LANG-01**: A plain "BM | EN" text toggle (no flags, no dropdown) is available in the header/settings area
- [ ] **LANG-02**: Language choice persists to `localStorage` (following the `src/platform/userPreferences.js` pattern) and is restored on next visit
- [x] **LANG-03**: Every string exists in both BM and EN dictionaries — full parity, verified by toggling (the switch itself is the parity test)
- [x] **LANG-04**: First visit always starts in BM regardless of browser language; a dismissible hint suggests switching when the browser language is neither `ms` nor `id`

### Intro Story

- [ ] **INTRO-01**: The intro story is written in BM with KL cyberpunk flavor (a runner making deliveries across the alley, corporations, rain-soaked neon KL) — a rewrite, not a literal translation
- [ ] **INTRO-02**: A faithful EN counterpart exists; both live as `intro.*` keys in the dictionaries (single source of truth shared by the overlay text and the TTS narration)

### TTS Narration

- [ ] **TTS-01**: Malay TTS narration of the intro story starts automatically from the ENTER-button click (gesture-anchored; no pre-gesture speech)
- [ ] **TTS-02**: The narration queue splits the story into sentence-sized utterances (≤ ~300 chars) chained via `onend`, immune to the ~15 s Chrome/Safari utterance cutoff
- [ ] **TTS-03**: Toggling the audio button / mute cancels narration immediately (WCAG 1.4.2 compliant)
- [ ] **TTS-04**: Voice resolution follows a graded chain — local `ms` voice → network `ms-MY` voice → labeled `id-ID` cross-language fallback → text-only — and the UI always labels which voice is active (never silently mispronounce)
- [ ] **TTS-05**: The currently-spoken sentence is highlighted in the intro overlay, synced to the narration queue
- [ ] **TTS-06**: A replay button on the intro overlay restarts the narration

### Voice Fallback Asset

- [ ] **VOICE-01**: A pre-synthesized Malay narration audio asset (~1–2 MB, generated offline from a cloud neural ms-MY voice) ships as the guaranteed narration fallback when no runtime Malay voice is available
- [ ] **VOICE-02**: Runtime picks the best narration source — platform ms voice, network ms-MY voice, or the bundled audio asset — with the bundled asset guaranteeing narration works offline and on stock macOS/iOS

## v2 Requirements (Deferred)

- [ ] **MISSION-01**: Mission system (walk-to-marker objectives, story missions, checkpoints) in BM — deferred until localization milestone completes; no design exists yet
- [ ] **TTS-07**: Dynamic TTS narration beyond the intro (walk prompts, HUD updates)

## Out of Scope

- Localizing procedural sound effects (footsteps, engines) — no language content
- Languages beyond BM and EN — no demand identified
- Recorded human voice-over for dynamic text — TTS + bundled intro asset covers v1; recordings for new content would be future work
- Runtime cloud TTS API calls — API key cannot live in a static Vercel site
- WASM TTS engines (Piper, meSpeak) — no usable official Malay voice; 60 MB models
- Locale/IP-based routing or redirects — anti-pattern per research
- Full i18n framework (i18next) — 2 locales × ~150 strings doesn't justify the dependency

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| LOC-01 | Phase 1 | Complete |
| LOC-02 | Phase 2 | Pending |
| LOC-03 | Phase 1 | Complete |
| LOC-04 | Phase 1 | Complete |
| LOC-05 | Phase 1 | Complete |
| LANG-01 | Phase 2 | Pending |
| LANG-02 | Phase 2 | Pending |
| LANG-03 | Phase 1 | Complete |
| LANG-04 | Phase 2 | Complete |
| INTRO-01 | Phase 2 | Pending |
| INTRO-02 | Phase 2 | Pending |
| TTS-01 | Phase 3 | Pending |
| TTS-02 | Phase 3 | Pending |
| TTS-03 | Phase 3 | Pending |
| TTS-04 | Phase 3 | Pending |
| TTS-05 | Phase 3 | Pending |
| TTS-06 | Phase 3 | Pending |
| VOICE-01 | Phase 4 | Pending |
| VOICE-02 | Phase 4 | Pending |

## Definition of Done

- All v1 requirements checked and verified on Chrome/Edge (Windows), Safari (macOS), and at least one mobile browser
- `npm run build` succeeds with no new runtime dependencies
- Language toggle round-trip (BM→EN→BM) leaves no English in BM mode and vice versa
- Narration verified on the device matrix: with local ms voice, without (fallback chain), and fully offline (bundled asset)
- No changes to render loop budget; no new full-res render passes
