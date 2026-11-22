---
gsd_state_version: "1.0"
current_phase: 2
current_phase_name: Language Toggle & KL Intro Story
status: executing
stopped_at: Phase 2 plan 02-01 complete — next wave 02-02
last_updated: "2026-11-22T20:24:21.000Z"
last_activity: 2026-11-23
last_activity_desc: Plan 02-01 executed — header BM|EN pill + Tetapan language row live with persistence
state_head: eb7c83443210ae0a094a2f925ea246c642a9dab7
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 7
  completed_plans: 5
  percent: 29
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-11-22)

**Core value:** Every piece of text and the intro narration are presented in Bahasa Melayu by default, with a complete English toggle — the app must feel natively Malay, not translated.
**Current focus:** Phase 02 — Language Toggle & KL Intro Story

## Current Position

Phase: 2 (Language Toggle & KL Intro Story) — EXECUTING
Plan: 02-01 complete — next wave: 02-02 (KL intro story)
Status: Ready to execute 02-02
Last activity: 2026-11-23 — Plan 02-01 executed (header pill + settings row + persistence, 9min)

Progress: [██▒░░░░░░░] 29%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4 | - | - |
| 2 | 1 | 3 | 1 |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 10min | 3 tasks | 9 files |
| Phase 01 P02 | 5min | 3 tasks | 11 files |
| Phase 01 P03 | 9min | 3 tasks | 6 files |
| Phase 01 P04 | ~25 min | 3 tasks | 5 files |
| Phase 02 P01 | 9min | 3 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Zero new dependencies — hand-rolled i18n store (audioState.js pub/sub shape) + Web Speech API; i18next and WASM TTS rejected (research SUMMARY.md)
- Roadmap: Phase 3 (TTS) is highest-risk — device-matrix spike must be the first plan in that phase, before the narration pipeline
- [Phase 01]: D-02 store shape implemented verbatim for i18n: Set listeners, notify({language}), guard+notify setLanguage, subscribe with immediate sync (01-01)
- [Phase 01]: setStoredLanguage landed unused by design (dormant D-05 path; Phase 2 toggle consumes it) so userPreferences.js is touched once in phase 01 (01-01)
- [Phase 01]: BM meta.description authored at 159 chars to hold the 160-char budget C-4 (01-01)
- [Phase 01]: Loader statuses pass translated display text at call time (setStatus(t(key))) — signature untouched; createAudioButton aliases i18n subscribe to avoid audioState export collision (01-02)
- [Phase 01]: createHudPanel subscribes page-lifetime without destroy (no destroy exists; created inside createHeader — research A4, explicit code comment) (01-02)
- [Phase 01]: Look preset labels resolve at render time via t("look." + option.id) — createAppShell.js LOOK_OPTIONS stays data-only; syncText re-derives labels from button.dataset.lookPreset
- [Phase 01]: data-i18n walker (D-04) proven on HTML (about panel) and SVG text nodes (walk controls callouts): querySelectorAll('[data-i18n]') -> textContent only; data-i18n-aria variant covers aria-label re-sync
- [Phase 01]: Header subscribes page-lifetime storing but never releasing the unsubscribe (no destroy exists — research A4, explicit code comment); no destroy added just for i18n (01-03)
- [Phase 01]: 01-04: owner D-10 review applied — attribution rebranded to Adri 'C-Fu' everywhere (incl. twitter handles + JSON-LD single-author entity + about-panel single button to github.com/C-Fu); title phrase 'Adegan hujan siberpunk' -> 'Game hujan siberpunk' (word-level, 'hujan' preserved — owner can correct phrasing later); EN meta rebranded 'Cyberpunk Malaya - Rain-soaked cyberpunk game'
- [Phase 01]: 01-04: residual-English audit closes LOC-01 — sweep over the full migrated surface set returns zero hits; Task 2 CSS sweep was a documented zero-diff pass (E-4 forbids speculative bumps); visual matrix deferred to verify-work per end-of-phase human_verify_mode
- [Phase 02]: persist-first toggle pattern (02-01): UI layer calls setStoredLanguage(next) BEFORE setLanguage(next) — setLanguage never persists; toast (02-03) must copy this
- [Phase 02]: BM/EN segment labels hardcoded literals (T-5), never dictionary keys — only aria-labels/aria-pressed re-sync via syncText; getLanguage() is the single state source on both toggle surfaces (TG-8)
- [Phase 02]: 02-01 grep baselines: lang-toggle-segment=4, setStoredLanguage=2 per file, aria-pressed=6, innerHTML-t()=0 both files, dictionary parity 86 keys

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3: exact ms-MY voice availability per OS/browser is MEDIUM-confidence research — resolve via the Phase 3 device-matrix spike, not by planning assumptions

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Feature | MISSION-01 mission system | v2 requirement | 2026-11-22 | v1 |
| Feature | TTS-07 dynamic narration beyond intro | v2 requirement | 2026-11-22 | v1 |

## Session Continuity

Last session: 2026-11-22T20:24:21.000Z
Stopped at: Phase 2 plan 02-01 complete — next wave 02-02
Resume file: .planning/phases/02-language-toggle-kl-intro-story/02-02-PLAN.md
