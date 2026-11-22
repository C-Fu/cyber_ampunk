---
phase: 01-i18n-foundation
plan: 02
subsystem: ui
tags: [i18n, bahasa-melayu, localization, loader, intro, hud, pubsub, webgpu, threejs]

requires:
  - phase: 01-i18n-foundation plan 01
    provides: i18n store (t/setLanguage/getLanguage/subscribe), bm/en dictionaries, parity gate, staticHead, walk-prompt exemplar
provides:
  - "23 new dictionary keys (loader.* x12, intro.* x3, performanceNotice.* x1, hud.* x3, moveHint.* x2, audio.* x1) in both languages, 36-key total parity"
  - "Migrated leaf factories: createLoaderOverlay, createIntroOverlay (creation-time t(), no subscription), createPerformanceNotice, createHudPanel (page-lifetime subscription), createMoveHint, createAudioButton"
  - "All 8 distributed loader-status call sites (main.js x4, warmup.js x2, createWorld.js x2) resolve BM at call time; dead fail() argument dropped from main.js"
  - "Verified no-op: createVirtualJoystick has no string sites (empty pinned diff) — LOC-01 coverage documented for VERIFICATION.md"
affects: [03 composite chrome migrations (settings/about/header/walk-controls), 01-04 CSS sweep + residual-English audit, Phase 2 toggle re-render]

actuals:
  tokens: 2300    # chars/4 over the realized diff (112 insertions + 27 deletions across 11 files)
  tasks: 3
  commits: 3      # MEASURED: git rev-list --count af40cd0..HEAD

tech-stack:
  added: []  # D-01: zero new dependencies; package.json untouched by this plan
  patterns:
    - "Call-time t() for re-rendering strings: setStatus(t(key)) at every invocation — no subscription needed for loader statuses"
    - "Creation-time-only t() for GSAP letter-split surfaces (intro overlay): brand lines and credit stay hardcoded; zero subscribe calls"
    - "Default-parameter t() for transient one-shot notices (createPerformanceNotice)"
    - "Page-lifetime subscription without destroy() for factories created inside other factories (HUD inside createHeader — research A4, documented in code comment)"
    - "Import aliasing when a factory already consumes a same-named export (createAudioButton: subscribe as subscribeLanguage from i18n alongside audioState subscribe)"

key-files:
  created: []
  modified:
    - src/i18n/dictionaries/bm.js
    - src/i18n/dictionaries/en.js
    - src/app/createLoaderOverlay.js
    - src/main.js
    - src/runtime/warmup.js
    - src/world/createWorld.js
    - src/ui/intro/createIntroOverlay.js
    - src/ui/intro/createPerformanceNotice.js
    - src/ui/walk/createHudPanel.js
    - src/ui/walk/createMoveHint.js
    - src/ui/chrome/createAudioButton.js

key-decisions:
  - "Loader statuses keep setStatus receiving translated display text (call-time t()), not keys — setStatus signature untouched; syncAriaLabel currentStatus remains display text so only the template wrappers localize"
  - "loader.ariaPercent added as its own key (bare-percent branch needs a standalone string) alongside loader.ariaLoading's {percent}/{status} template; loader.ariaLoadingInitial covers the pre-progress aria"
  - "BM loader status drafts authored in uppercase (MENYALAKAN BABAK etc.) to mirror the EN uppercase literals; CSS text-transform: uppercase holds the casing either way (T-2)"
  - "BM status vocabulary kept ≤20 chars per E-3 budget (MENTRANSMISI JARING for STREAMING MESHES, MERAKIT SEKTOR for ASSEMBLING SECTOR, MENYELARASKAN CAHAYA for SYNCING LIGHTS, MENYAMBUNG DUNIA for WIRING WORLD)"
  - "createAudioButton imports the i18n subscription aliased (subscribe as subscribeLanguage) because audioState.js already exports subscribe — collision avoided without renaming either store's API"
  - "createHudPanel subscribes without storing an unsubscribe (no destroy() exists; page lifetime) — explicit code comment, not a silent leak (research A4)"

patterns-established:
  - "Same-named-export aliasing: import { subscribe as subscribeLanguage } from i18n when the file already subscribes to another store"
  - "Loader status BM vocabulary (BABAK/PENJANA/SEKTOR/JARING/DUNIA register) — the cyberpunk-flavored namespace D-09 sanctions for loader text"

requirements-completed: [LOC-01]

coverage:
  - id: D1
    description: "Loader overlay + all 8 distributed status call sites render BM through boot (BOOTING SCENE → MENYALAKAN BABAK etc.), error path SAMBUKAN GAGAL, aria templates localized, dead fail() argument dropped"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "npm run build + npm run check:i18n (26→36 keys) + residual-literal grep gates all 0 (BOOTING SCENE, SPINNING UP RENDERER, LINKING WEBGPU, WIRING POST FX, SYNCING LIGHTS, ASSEMBLING SECTOR, STREAMING MESHES, WIRING WORLD, LINK FAILED, dead fail arg)"
        status: pass
      - kind: other
        ref: "pinned gate: git diff --name-only 8e8580c..HEAD + working tree contains no createRenderLoop / src/post/ / src/tsl/ entry (count 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Intro overlay (kicker melepasi kaca, tagline, MASUK button) and performance notice (Melaraskan prestasi…) render BM at creation with zero subscription; brand lines and credit hardcoded"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "grep gates: migrated literals 0; subscribe count 0 in createIntroOverlay.js; keep-list (splitIntoLetters, Anderson Mancini, THREEJS) each >= 1; build + parity green"
        status: pass
    human_judgment: false
  - id: D3
    description: "HUD labels (Vital/Tenaga/Isyarat), move hint (Pergerakan / Gunakan WASD untuk berjalan), and audio button aria (Togol bunyi) render via t() with live re-sync; destroy()-bearing factories release unsubscribeLanguage"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "grep gates: VITALS/ENERGY/SIGNAL, Use WASD to walk, Movement, Toggle sound all 0; unsubscribeLanguage count >= 2 in createMoveHint.js and createAudioButton.js; BM label lengths 5/6/7 chars (E-2 <= 8); build + parity green"
        status: pass
    human_judgment: false
  - id: D4
    description: "Virtual joystick LOC-01 coverage verified as no-op: no string sites exist (root aria-hidden, base + knob divs only) — recorded for VERIFICATION.md"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "pinned gate: git diff --name-only 8e8580c..HEAD -- src/ui/walk/createVirtualJoystick.js + working-tree status for the same path is empty (count 0)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual browser pass: BM loader statuses single-line without clipping, intro tagline <= 2 wrapped lines with MASUK button, HUD chips VITAL/TENAGA/ISYARAT unclipped at 360px, audio aria Togol bunyi in DevTools"
    requirement: LOC-01
    verification: []
    human_judgment: true
    rationale: "Rendering verification requires a live WebGPU browser session (DevTools Elements panel + 360px viewport) — no DOM test harness exists in this repo by design (D-01, no new dependencies); deferred to the end-of-phase manual matrix per human_verify_mode: end-of-phase."

duration: 5min
completed: 2026-11-23
status: complete
---

# Phase 01 Plan 02: Leaf Factory i18n Migration Summary

**Boot-to-walk journey (loader statuses, intro overlay, performance notice, HUD, move hint, audio button) migrated to Bahasa Melayu via call-time/creation-time t() and page-lifetime subscriptions — 23 new parity-gated keys, zero render-pipeline changes**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-11-22T17:09:49Z
- **Completed:** 2026-11-23 (session date)
- **Tasks:** 3/3
- **Files modified:** 11 (all planned; 0 created)

## Accomplishments
- Loader overlay + the 8 distributed status call sites across `src/main.js` (x4), `src/runtime/warmup.js` (x2), `src/world/createWorld.js` (x2) render BM from first paint through boot — statuses authored ≤20 chars to hold the single-line E-3 budget, error path shows SAMBUKAN GAGAL with BM aria, and the dead `fail()` argument in main.js is dropped (the function ignores params)
- Intro overlay renders `melepasi kaca` / `Lorak basah hujan di bawah neon.` / MASUK at creation with ZERO subscription calls (GSAP letter-split safety); brand lines (THREEJS/PUNK), brand aria, and credit (Anderson Mancini · Sunag) stay hardcoded, gate-verified; performance notice default message is a `t()` call
- HUD labels (Vital/Tenaga/Isyarat — 5/6/7 chars each, E-2 ≤8), move hint (Pergerakan / Gunakan WASD untuk berjalan), and audio button aria (Togol bunyi) migrate with live re-sync; destroy()-bearing factories (move hint, audio button) release `unsubscribeLanguage` first; HUD subscribes page-lifetime (no destroy — explicit code comment per research A4)
- Dictionary grows 13 → 36 keys in verified parity (`npm run check:i18n` green after every task); all BM copy is draft-for-owner-review per D-10
- `createVirtualJoystick.js` verified no-op for LOC-01: root is aria-hidden, markup is base + knob divs only — empty pinned diff (BASE 8e8580c..HEAD + working tree), documented for VERIFICATION.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Loader overlay migration + distributed status call sites** - `bca5282` (feat)
2. **Task 2: Intro overlay + performance notice (creation-time t())** - `77aaff6` (feat)
3. **Task 3: HUD, move hint, audio button + joystick no-op verification** - `eed5b94` (feat)

**Plan metadata:** (final docs commit below)

## Files Created/Modified
- `src/i18n/dictionaries/bm.js` / `en.js` - +23 keys each (loader.* ×12, intro.* ×3, performanceNotice.* ×1, hud.* ×3, moveHint.* ×2, audio.* ×1), flat alphabetical, parity-gated
- `src/app/createLoaderOverlay.js` - t() for initial aria, syncAriaLabel interpolation ({percent}/{status} template + bare-percent key), fail() localized
- `src/main.js` - import t; 4 status call sites swapped; dead fail() argument dropped
- `src/runtime/warmup.js` - import t; 2 status call sites swapped (string literals only)
- `src/world/createWorld.js` - import t; 2 status call sites swapped (world subtree minimal-touch honored)
- `src/ui/intro/createIntroOverlay.js` - kicker/tagline/ENTER via t() at creation; no subscription
- `src/ui/intro/createPerformanceNotice.js` - default parameter is t("performanceNotice.adjusting")
- `src/ui/walk/createHudPanel.js` - 3 labels via t() + syncText + page-lifetime subscribe
- `src/ui/walk/createMoveHint.js` - kicker/title via t() + syncText + unsubscribeLanguage in destroy()
- `src/ui/chrome/createAudioButton.js` - aria-label via t() + syncText + aliased i18n subscribe + unsubscribeLanguage in destroy()

## Decisions Made
- Loader statuses pass translated display text at call time (`setStatus(t(key))`) — the setStatus signature stays untouched and `currentStatus` remains display text, so only the aria template wrappers localize (the plan's chosen form over the key-passing alternative)
- `loader.ariaPercent` added as its own key for the bare-percent aria branch; `loader.ariaLoadingInitial` for the pre-progress label — both required by the syncAriaLabel branches the plan flagged
- BM loader vocabulary drafted in uppercase (matching the EN literal style) with the cyberpunk register D-09/C-1 allow for loader text: MENYALAKAN BABAK, MEMUTAR PENJANA, MENYAMBUNG WEBGPU/POST FX/DUNIA, MENYELARASKAN CAHAYA, MERAKIT SEKTOR, MENTRANSMISI JARING
- i18n `subscribe` imported aliased in createAudioButton (`subscribe as subscribeLanguage`) because audioState.js already exports `subscribe` — neither store's public API renamed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- An ad-hoc stricter forbidden-file check (not the plan's gate) that included `package.json` tripped on the pinned 8e8580c..HEAD range — that entry is plan 01-01's sanctioned `check:i18n` npm-script addition, not this plan's change. The plan's actual gates (Task 1 verify + plan-level verification) forbid only `createRenderLoop.js`, `src/post/`, `src/tsl/` — all count 0. This plan's own ledger-based diff (af40cd0..eed5b94) contains exactly the 11 planned files and no package.json change.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None — no stub patterns, empty states, or placeholder text introduced. BM copy is draft-for-owner-review per D-10 (the designed review loop, not a stub); the owner's wording pass is Wave 4 (01-04).

## Next Phase Readiness
- The boot-to-walk journey (loader → intro → ENTER → HUD/hints/audio) is fully BM; Wave 3 (01-03 composite surfaces: settings/about/header/walk-controls hint) can proceed — the `data-i18n` walker and confirm-call pattern it needs are specified in PATTERNS.md
- Browser/DevTools human verification (loader clipping, 360px HUD, aria inspection) deferred to the end-of-phase manual matrix per `human_verify_mode: end-of-phase` — recorded in coverage D5 as human_judgment
- Render pipeline untouched by construction: rain collision, height-map hide list, and mobile profile are unaffected (pinned gates verify zero render-loop/post/tsl changes)

## Self-Check: PASSED

All 11 modified files exist on disk; all task commits are ancestors of HEAD (bca5282, 77aaff6, eed5b94); final plan-level verify green (npm run build + npm run check:i18n — 36 keys both dictionaries); pinned 8e8580c..HEAD + working-tree diff contains no createRenderLoop/src/post//src/tsl/ entry; residual-English sweep over the 9 migrated call-site/factory files returns zero hits outside the keep-list (brands, WASD key caps, numbers).

---
*Phase: 01-i18n-foundation*
*Completed: 2026-11-23*
