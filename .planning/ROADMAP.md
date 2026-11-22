# Roadmap: Cyberpunk Malaya

## Overview

Transform the English-hardcoded Threejs-Punk demo into a natively Malay experience: first every UI surface renders in Bahasa Melayu from a bilingual dictionary store, then users get an instant BM ⇄ EN toggle and a KL-cyberpunk intro story rewrite, then the story is spoken aloud via a device-robust Malay TTS pipeline (spike-gated), and finally a pre-synthesized narration asset guarantees the voice works on every device — online or offline. The dependency chain is strict: dictionary → toggle/story → narration script → voice, with all platform TTS risk isolated in the last two phases so a failure there can never destabilize the shipped localization.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: i18n Foundation** - Every UI surface renders in BM by default from a bilingual dictionary store; document lang/title and static head follow (completed 2026-11-23)
- [ ] **Phase 2: Language Toggle & KL Intro Story** - Instant BM ⇄ EN switch with persistence, plus the KL-cyberpunk intro story rewrite in both languages
- [ ] **Phase 3: Malay TTS Narration** - Intro story narrated in Malay, gesture-anchored and robust across browsers (spike-gated)
- [ ] **Phase 4: Guaranteed Narration Asset** - Bundled pre-synthesized Malay narration guarantees voice everywhere, offline included

## Phase Details

### Phase 1: i18n Foundation
**Goal**: Every user-facing surface renders in Bahasa Melayu by default, backed by a hand-rolled bilingual dictionary store — no framework, no render-loop changes
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: LOC-01, LOC-03, LOC-04, LOC-05, LANG-03
**Success Criteria** (what must be TRUE):
  1. On first visit, every UI surface — header, settings, about, intro overlay, walk hints, HUD, virtual joystick, walk prompt, performance notice, loader overlay, loader statuses — renders in BM with zero leftover English strings
  2. `document.documentElement.lang` is `"ms"` and `document.title` is in BM
  3. The static `index.html` head (title, meta description) is BM in the raw HTML source before any JS runs
  4. OG/Twitter card meta tags carry BM content
  5. Every migrated string exists in both the BM and EN dictionaries (full parity, ready for the Phase 2 toggle)
**Plans**: 4/4 plans complete
Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Tracer: i18n store + dictionaries + parity script + walk prompt migration + staticHead boot wiring + dormant EN persistence path

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Leaf factories: loader overlay + distributed status call sites + intro overlay + performance notice + HUD + move hint + audio button

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — Composite surfaces: settings panel + about panel (data-i18n walker) + header + walk controls hint (SVG callouts)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 01-04-PLAN.md — Static BM head baseline in index.html + CSS text-expansion sweep + owner BM copy review (D-10) + residual-English audit

**UI hint**: yes

### Phase 2: Language Toggle & KL Intro Story
**Goal**: Users can switch BM ⇄ EN instantly with a persisted choice, and the intro tells a KL cyberpunk story written natively in both languages
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: LOC-02, LANG-01, LANG-02, LANG-04, INTRO-01, INTRO-02
**Success Criteria** (what must be TRUE):
  1. User can toggle "BM | EN" in the header/settings area and all visible UI re-renders instantly — no reload, no appShell teardown
  2. The language choice persists to localStorage and is restored on the next visit
  3. A first visit always starts in BM regardless of browser language; when the browser language is neither `ms` nor `id`, a dismissible hint suggests switching
  4. The intro story reads as a KL-cyberpunk-flavored BM rewrite (runner, deliveries, corporations, rain-soaked neon KL) — not a literal translation — with a faithful EN counterpart, both living as `intro.*` dictionary keys
  5. A full BM→EN→BM toggle round-trip leaves no English in BM mode and no BM in EN mode (document title and head included)
**Plans**: 3 plans
Plans:
**Wave 1**
- [x] 02-01-PLAN.md — Header BM|EN pill + Tetapan language row with persistence (tracer: activation path)

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 02-02-PLAN.md — KL intro story dictionaries + overlay syncText (owner-review checkpoint)

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 02-03-PLAN.md — Language hint toast (trigger/dismiss/persist) wired after revealAppUi
**UI hint**: yes

### Phase 3: Malay TTS Narration
**Goal**: The intro story is spoken in Malay automatically from the ENTER click, surviving every known Web Speech API platform quirk
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: TTS-01, TTS-02, TTS-03, TTS-04, TTS-05, TTS-06
**Success Criteria** (what must be TRUE):
  1. Narration starts automatically from the ENTER-button click and never speaks before a user gesture
  2. The complete story is narrated without truncation — sentence-sized utterances chained via `onend`, immune to the ~15 s Chrome/Safari cutoff, with a watchdog recovering from hung queues
  3. Toggling the audio button / mute cancels narration immediately
  4. Voice resolution follows the graded chain (local `ms` → network `ms-MY` → labeled `id-ID` → text-only), the UI always labels which voice is active, and the experience never silently mispronounces — text-only is the floor
  5. The currently-spoken sentence is highlighted in the intro overlay, and a replay button restarts the narration
**Plans**: TBD — the FIRST plan must be the device-matrix spike (minimal "click → speak chunked Malay sentence" page validated on Chrome/Edge/Safari/mobile, with and without local ms voices) before building the narration pipeline. Research flags this phase as highest-risk; re-verify `voiceschanged` timing, gesture scoping, and long-utterance behavior on real hardware during the spike.
**UI hint**: yes

### Phase 4: Guaranteed Narration Asset
**Goal**: Narration works for every visitor — including stock macOS/iOS and fully offline — via a bundled pre-synthesized Malay narration asset
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: VOICE-01, VOICE-02
**Success Criteria** (what must be TRUE):
  1. When no platform or network Malay voice is available, the bundled pre-synthesized narration audio (~1–2 MB) plays the full intro story
  2. The runtime automatically picks the best narration source — platform ms voice, network ms-MY voice, or the bundled asset — without user intervention
  3. With the network fully offline, narration still plays from the bundled asset
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. i18n Foundation | 4/4 | Complete    | 2026-11-23 |
| 2. Language Toggle & KL Intro Story | 0/TBD | Not started | - |
| 3. Malay TTS Narration | 0/TBD | Not started | - |
| 4. Guaranteed Narration Asset | 0/TBD | Not started | - |
