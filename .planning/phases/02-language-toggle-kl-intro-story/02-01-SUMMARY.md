---
phase: 02-language-toggle-kl-intro-story
plan: 01
subsystem: ui
tags: [i18n, localization, vanilla-dom, bm, header, settings-panel]

requires:
  - phase: 01-i18n-foundation
    provides: i18n pub/sub store (t/getLanguage/setLanguage/subscribe), staticHead swap path, dormant userPreferences get/setStoredLanguage, chrome syncText factories
provides:
  - Header BM|EN toggle pill with persist-first click handler (setStoredLanguage -> setLanguage)
  - Tetapan language section with two aria-pressed segment buttons on the same store
  - header.langAriaBm/langAriaEn + settings.language/langBmAria/langEnAria keys in both dictionaries (86-key parity)
  - Persist-on-toggle pattern established for the plan 02-03 toast switch caller
affects: [02-02 KL intro story, 02-03 language hint toast, phase 3 TTS]

actuals:
  tokens: 12800
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - persist-first toggle (UI layer calls setStoredLanguage before setLanguage; setLanguage never persists)

key-files:
  created: []
  modified:
    - src/ui/chrome/createHeader.js
    - src/ui/chrome/header.css
    - src/ui/chrome/createSettingsPanel.js
    - src/ui/chrome/settingsPanel.css
    - src/i18n/dictionaries/bm.js
    - src/i18n/dictionaries/en.js

key-decisions:
  - "Persistence lives in the UI layer: both toggle callers run setStoredLanguage(next) FIRST then setLanguage(next) — setLanguage stays persistence-free (LANG-02, Pitfall 1)"
  - "BM/EN segment labels are hardcoded literals (T-5), never dictionary keys; only aria-labels/aria-pressed come from the store and re-sync in syncText"
  - "Settings language segments reuse .settings-look-btn styling (TG-7) with a compact .settings-lang-grid modifier; active values copied verbatim from .settings-look-btn--active"
  - "getLanguage() is the single state source on both surfaces (TG-8) — no component-local language mirror; syncLanguageSelection derived from store at call time"

patterns-established:
  - "Persist-first toggle: setStoredLanguage(next); setLanguage(next) — every future toggle caller (toast, any new surface) must copy this"
  - "syncText extension shape: setAttribute for aria, classList.toggle for active state, dataset-driven key resolution"

requirements-completed: [LOC-02, LANG-01, LANG-02]

coverage:
  - id: D1
    description: Header BM|EN pill toggles all subscribed chrome (aria, active segment, title, metas, html lang) instantly via store notify, no reload
    requirement: LOC-02
    verification:
      - kind: other
        ref: "npm run check:i18n (parity 83 keys at task 1) + npm run build + grep lang-toggle-segment=4, setStoredLanguage=2"
        status: pass
    human_judgment: true
    rationale: "Visual/interaction verification (pill position, one-frame swap, both directions) is manual UAT deferred to end-of-phase human_verify_mode per project convention"
  - id: D2
    description: Tetapan panel language row with two aria-pressed segment buttons always agreeing with the header pill (both read the store)
    requirement: LANG-01
    verification:
      - kind: other
        ref: "npm run build + grep settings.langBmAria=1, aria-pressed=6 (HEAD 2 -> >=4)"
        status: pass
    human_judgment: true
    rationale: "Mirror-state verification between the two surfaces needs live clicking in the browser; covered by end-of-phase manual round-trip check"
  - id: D3
    description: Language choice persists across reloads — both toggle callers write localStorage before switching
    requirement: LANG-02
    verification:
      - kind: other
        ref: "grep ordering gate: setStoredLanguage precedes setLanguage in createHeader.js (lines 77-78) and createSettingsPanel.js (lines 226-227); restore path already live in i18n.js module init from Phase 1"
        status: pass
    human_judgment: true
    rationale: "Persistence across reload requires a browser reload cycle; static ordering verified, live reload check deferred to end-of-phase UAT"

duration: 9min
completed: 2026-11-23
status: complete
---

# Phase 2 Plan 01: Language Toggle Activation Summary

**Header BM|EN pill + Tetapan language row activate the Phase 1 i18n store end-to-end with persist-first switching on both surfaces**

## Performance

- **Duration:** 9 min
- **Started:** 2026-11-23T04:13+08:00
- **Completed:** 2026-11-23T04:23+08:00
- **Tasks:** 3 (2 production commits + 1 static-verification pass)
- **Files modified:** 6

## Accomplishments

- Header BM|EN toggle pill wired as leftmost child of `.app-header-actions` — clicking it flips all subscribed chrome (aria, active segment, title, metas, `<html lang>`) in one notify frame, no reload
- Tetapan language section added after the Penampilan section — two aria-pressed segment buttons (hardcoded BM/EN labels) sharing the same store as the header pill
- Persistence wired on every toggle caller: `setStoredLanguage(next)` before `setLanguage(next)`; choice now survives reload via the Phase 1 restore path
- Dictionary parity grew 83 -> 86 keys (`header.langAriaBm/En`, `settings.language`, `settings.langBmAria`, `settings.langEnAria`), alphabetical placement

## Task Commits

1. **Task 1: Header BM|EN toggle pill** - `d646fd0` (feat)
2. **Task 2: Tetapan panel language row** - `2474740` (feat)
3. **Task 3: Round-trip persistence + purity gates** - no commit (static verification only, zero file diffs; all gates green)

## Files Created/Modified

- `src/ui/chrome/createHeader.js` — lang pill markup (hardcoded segments, aria-hidden), syncText extension (aria-label + active segment), persist-first click handler
- `src/ui/chrome/header.css` — `.app-header-lang-btn` cloned from about-btn (44px/40px, padding 0 20px), segment divider, active values verbatim from `.settings-look-btn--active`, TG-4 focus-visible
- `src/ui/chrome/createSettingsPanel.js` — language section markup, syncText aria/pressed sync, syncLanguageSelection, persist-first click handler, store-derived initial state
- `src/ui/chrome/settingsPanel.css` — `.settings-lang-grid` two-column grid + compact segment modifiers
- `src/i18n/dictionaries/bm.js`, `en.js` — 5 new toggle keys each, alphabetical

## Decisions Made

- Persistence lives in the UI layer, never inside `setLanguage` — matches Pitfall 1 / LANG-02 contract
- Settings segments reuse `.settings-look-btn` styling per TG-7 (panel's own two-state button language) instead of importing the header pill form; a scoped `.settings-lang-grid .settings-look-btn` modifier makes them compact 44px rows
- `langSectionTitle` resolved via the grid's `previousElementSibling` — avoids adding another class hook; section title textContent syncs in syncText
- Added `state?.showAllUi?.()` to both toggle handlers to match the sibling settings/about/source button convention

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Baselines inherited by plans 02/03 (measured grep counts, per plan Task 3)

- `lang-toggle-segment` in createHeader.js: **4**
- `setStoredLanguage` in createHeader.js: **2**; createSettingsPanel.js: **2** (import + call)
- `aria-pressed` in createSettingsPanel.js: **6**
- `innerHTML.*${t(` per file: **0** (both)
- Dictionary parity: **86 keys** per file

## User Setup Required

None — no external service configuration.

## Next Phase Readiness

- Plan 02-02 (KL intro story) can build directly on the live activation path; `intro.*` keys just need the same append-only alphabetical dictionary pattern
- Plan 02-03 (hint toast) must copy the persist-first toggle pattern: `setStoredLanguage(other); setLanguage(other);`
- Manual round-trip UAT (BM→EN→BM zero mixed strings, reload persistence, surface mirroring) deferred to end-of-phase `human_verify_mode` per project convention

---
*Phase: 02-language-toggle-kl-intro-story*
*Completed: 2026-11-23*
