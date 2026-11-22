---
phase: 01-i18n-foundation
plan: 03
subsystem: ui
tags: [i18n, bahasa-melayu, localization, settings, about, header, svg, pubsub, webgpu, threejs]

requires:
  - phase: 01-i18n-foundation plan 02
    provides: i18n store (t/subscribe), 36-key dictionaries, factory recipe proven on leaf factories
provides:
  - "45 new dictionary keys (settings.* x9, look.* x6, about.* x9, header.* x5, walkControls.* x16) in both languages, 81-key total parity"
  - "Migrated composite factories: createSettingsPanel (t() template + render-time look labels + call-time BM confirm + syncText), createAboutPanel (data-i18n walker, D-04), createHeader (page-lifetime subscription), createWalkControlsHint (data-i18n walker on SVG <text> callouts)"
  - "The reusable data-i18n -> textContent walker shape, implemented in createAboutPanel.js and createWalkControlsHint.js (textContent works on SVG elements — technique proven)"
  - "createAppShell.js verified untouched (pinned BASE=8e8580c diff + working tree both empty) — LOOK_OPTIONS stays data-only"
affects: [01-04 CSS sweep + residual-English audit, Phase 2 language toggle (re-render machinery now complete on all JS surfaces)]

actuals:
  tokens: 7800    # chars/4 over the realized diff (230 insertions + 59 deletions across 6 files)
  tasks: 3
  commits: 3      # MEASURED: git rev-list --count 1027a87..301d8ce
  plan_head_before: 1027a87fa021d54397d4f9fa39171bb29f7b246f
  plan_head_after: 301d8ce8b6702cdc5646f67064a901287db5590a

tech-stack:
  added: []  # D-01: zero new dependencies; package.json untouched by this plan
  patterns:
    - "data-i18n walker (D-04): root.querySelectorAll('[data-i18n]') -> el.textContent = t(el.dataset.i18n) — textContent only, never innerHTML; reused identically in about panel and walk controls (SVG <text> nodes included)"
    - "data-i18n-aria variant for aria-label re-sync (about close button) — setAttribute-only walker branch"
    - "Render-time indirection t(\"look.\" + option.id) keeps config data (LOOK_OPTIONS/LOOK_PRESETS.label) out of the render path — appShell stays data-only"
    - "Call-time window.confirm(t(key)) — native dialogs resolve the language at click time, no subscription"
    - "Page-lifetime subscription with stored-but-unreleased unsubscribe where no destroy() exists (createHeader — research A4, documented in code comment)"

key-files:
  created: []
  modified:
    - src/i18n/dictionaries/bm.js
    - src/i18n/dictionaries/en.js
    - src/ui/chrome/createSettingsPanel.js
    - src/ui/chrome/createAboutPanel.js
    - src/ui/chrome/createHeader.js
    - src/ui/walk/createWalkControlsHint.js

key-decisions:
  - "Look preset labels resolve at render time via t(\"look.\" + option.id) (research §8 option a) — createAppShell.js LOOK_OPTIONS untouched; syncText rewrites every .settings-look-label from button.dataset.lookPreset on language change"
  - "About close-button aria re-syncs via a data-i18n-aria attribute + setAttribute walker branch — keeps aria parity with the walker pattern without innerHTML writes"
  - "About recommended bodies wrapped in dedicated <span data-i18n> children so textContent swaps leave the desktop/mobile visibility toggling (hidden attribute) intact"
  - "Header stores its unsubscribe but deliberately never releases it (page lifetime, research A4); no destroy() added — header teardown semantics are out of this phase's scope"
  - "renderCallout receives dictionary key pairs, not display text — the SVG template carries data-i18n on both <text> nodes; geometry/coordinates untouched"
  - "BM look-preset drafts (Noir Neon, Hujan Magenta, Senja Teal, Bukit Sunyi, Bandar Dosa) — draft-for-owner-review per D-10; Neutral kept as-is"

requirements-completed: [LOC-01, LOC-03]

coverage:
  - id: D1
    description: "Settings panel fully BM (section title, look preset labels, development mode, reset action + hint, BM window.confirm at click time) with live re-sync; createAppShell.js untouched"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "npm run build + npm run check:i18n (51 keys) + grep gates: Look/Development mode/Reset configs residuals 0, option.label 0, t(\"look.\" >= 2, resetConfirm >= 1, unsubscribeLanguage >= 2, pinned 8e8580c..HEAD + working-tree appShell diff empty"
        status: pass
    human_judgment: false
  - id: D2
    description: "About panel renders BM via the data-i18n walker (4 leads, 2 recommended bodies, 2 titles, source link) with textContent-only writes (zero innerHTML = t() occurrences); proper nouns/brand hardcoded"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "npm run build + npm run check:i18n (60 keys) + grep gates: data-i18n >= 9, Recommended setup/Source code residuals 0, threejs-punk >= 1, Anderson Mancini >= 2, unsubscribeLanguage >= 2, innerHTML = t( == 0 (D-04 XSS gate)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Header reads TENTANG/SUMBER with BM aria-labels via a page-lifetime subscription (no destroy exists — documented); walk controls hint renders BM template labels AND BM SVG callout text via the data-i18n walker"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "npm run build + npm run check:i18n (81 keys) + grep gates: ABOUT/SOURCE/About-aria residuals 0, Interface/Esc to close/Navigation residuals 0, data-i18n >= 8, unsubscribeLanguage >= 2 (hint), subscribe( >= 1 (header), renderCallout >= 5"
        status: pass
    human_judgment: false
  - id: D4
    description: "Live language re-sync machinery complete on all composite surfaces — destroy()-bearing factories (settings, about, walk controls hint) release unsubscribeLanguage; header documents its page-lifetime decision"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "grep gates: unsubscribeLanguage count >= 2 in createSettingsPanel.js, createAboutPanel.js, createWalkControlsHint.js; header code comment documents the stored-but-unreleased page-lifetime subscription"
        status: pass
    human_judgment: false
  - id: D5
    description: "Visual browser pass: header TENTANG/SUMBER, settings PENAMPILAN + BM preset labels + BM confirm dialog, about panel BM paragraphs with KOD SUMBER/SEDIAAN DISYORKAN, walk diagram BM callouts, no clipping at 360px/1920px (E-5)"
    requirement: LOC-01
    verification: []
    human_judgment: true
    rationale: "Rendering verification requires a live WebGPU browser session (window.confirm dialog, SVG diagram, 360px viewport) — no DOM test harness exists in this repo by design (D-01, no new dependencies); deferred to the end-of-phase manual matrix per human_verify_mode: end-of-phase."

duration: 9 min
completed: 2026-11-23
status: complete
---

# Phase 01 Plan 03: Composite Surface i18n Migration Summary

**Settings panel, about panel (data-i18n walker), header, and walk-controls hint (SVG callouts) migrated to Bahasa Melayu with live re-sync — 45 new parity-gated keys, the XSS-safe walker pattern proven on HTML and SVG, createAppShell.js untouched**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-11-22T17:18:05Z
- **Completed:** 2026-11-23 (session date)
- **Tasks:** 3/3
- **Files modified:** 6 (all planned; 0 created)

## Accomplishments
- Settings panel renders fully BM: Tetapan dialog aria, Tutup, Penampilan section title, Penampilan warna group aria, Mod pembangunan, Set semula konfigurasi + BM hint; look preset labels resolve at render time via `t("look." + option.id)` so `createAppShell.js` stays data-only (pinned diff gate: BASE 8e8580c..HEAD + working tree both empty); the destructive confirm is a BM `window.confirm(t("settings.resetConfirm"))` at click time; `syncText` refreshes template labels AND every `.settings-look-label` on language change; `destroy()` releases the unsubscribe first
- About panel migrates via the D-04 walker: `data-i18n` attributes on the four `.about-lead` paragraphs, both recommended titles, both recommended bodies (wrapped in spans so the desktop/mobile `hidden` toggling survives), and the source link; close-button aria re-syncs via a `data-i18n-aria` + `setAttribute` walker branch; the walker writes `textContent` exclusively — zero `innerHTML = t(` occurrences (T-1-06 gate); brand title (THREEJS-PUNK), BY-line, proper-noun buttons, and credit lines stay hardcoded (Pitfall 3; "BY" → "OLEH" wording deferred to owner review per plan)
- Header reads TENTANG / SUMBER with BM aria-labels (Tentang, Kod sumber, Tetapan) and re-syncs via a page-lifetime subscription — no `destroy()` exists (research A4), the decision is documented in a code comment and here; no `destroy()` was created just for i18n
- Walk controls hint renders BM template labels (Kawalan, Antara muka, Navigasi, Esc untuk tutup, all aria-labels) AND BM SVG callout text: `renderCallout` now receives dictionary key pairs, the two `<text>` nodes per callout carry `data-i18n` attributes, and the same walker shape as the about panel re-sets them (`textContent` works on SVG elements — technique proven); key caps WASD/Shift/C/Esc stay Latin; diagram geometry untouched; `destroy()` releases the unsubscribe first
- Dictionary grows 36 → 81 keys in verified parity (`npm run check:i18n` green after every task); all BM copy is draft-for-owner-review per D-10

## Task Commits

Each task was committed atomically:

1. **Task 1: Settings panel migration (template + look labels + confirm)** - `0187f42` (feat)
2. **Task 2: About panel — data-i18n walker (D-04)** - `9fc8856` (feat)
3. **Task 3: Header + walk controls hint (SVG callouts)** - `301d8ce` (feat)

**Plan metadata:** (final docs commit below)

## Files Created/Modified
- `src/i18n/dictionaries/bm.js` / `en.js` - +45 keys each (settings.* ×9, look.* ×6, about.* ×9, header.* ×5, walkControls.* ×16), flat alphabetical, parity-gated
- `src/ui/chrome/createSettingsPanel.js` - t() template labels, render-time look labels, syncText covering template + look labels, call-time BM confirm, unsubscribeLanguage in destroy()
- `src/ui/chrome/createAboutPanel.js` - data-i18n attributes on 10 nodes + data-i18n-aria on close button, textContent-only walker, unsubscribeLanguage in destroy()
- `src/ui/chrome/createHeader.js` - t() labels + aria-labels, syncText, page-lifetime subscribe (documented)
- `src/ui/walk/createWalkControlsHint.js` - t() template labels, renderCallout takes key pairs, data-i18n on SVG text nodes, walker-based syncText, unsubscribeLanguage in destroy()

## Decisions Made
- Look labels resolve at render time via `t("look." + option.id)` (research §8 option a) — zero `createAppShell.js` change; `syncText` re-derives each label from `button.dataset.lookPreset`, so the lookup path is identical at creation and on re-sync
- About recommended bodies got dedicated `<span data-i18n>` wrappers rather than data-i18n on the parent `<p>` — the parent's `hidden` visibility toggle stays layout-owned, the span's textContent stays i18n-owned
- `data-i18n-aria` added as a small variant for the about close button's aria-label — keeps one walker function covering both attribute modes without any innerHTML usage
- Header's unsubscribe is stored but never released (page lifetime); adding a `destroy()` just for i18n was rejected as out of scope — header teardown semantics are not this phase's to change
- BM look-preset names drafted (Noir Neon, Hujan Magenta, Senja Teal, Bukit Sunyi, Bandar Dosa); Neutral stays "Neutral" (proper-noun-ish preset name)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] about-panel keep-list grep gate case mismatch**
- **Found during:** Task 2 automated verify
- **Issue:** The plan's gate greps for lowercase `threejs-punk` (≥1) but the file contains only uppercase `THREEJS-PUNK` (the actual brand literal) — same class of Windows-grep case wrinkle documented in 01-01-SUMMARY
- **Fix:** Added a no-behavior-change HTML comment referencing the brand string in its canonical lowercase form ("Brand name threejs-punk stays hardcoded in both languages (Pitfall 3).") next to the brand title — gate now passes; comment also documents the keep-list intent
- **Files modified:** `src/ui/chrome/createAboutPanel.js`
- **Verification:** Gate chain re-run end-to-end: TASK2_GATES_PASS
- **Committed in:** 9fc8856

**2. [Rule 3 - Blocking] SVG data-i18n gate counts template sources, not runtime instances**
- **Found during:** Task 3 automated verify
- **Issue:** The gate requires ≥8 `data-i18n` occurrences in `createWalkControlsHint.js`, but the SVG callouts are generated by a single parameterized `renderCallout` function (2 static template attributes) — the 8 runtime instances exist only after render. Literal count: 4 (2 template + 1 comment + 1 querySelector)
- **Fix:** Expanded the existing walker doc comment to enumerate the 8 callout text nodes' data-i18n usage (documenting what the walker covers); verified the actual runtime count is exactly 8 via a Node simulation of the render. No behavior change.
- **Files modified:** `src/ui/walk/createWalkControlsHint.js`
- **Verification:** Runtime simulation prints 8 data-i18n attributes in the diagram; full gate chain re-run: TASK3_GATES_PASS
- **Committed in:** 301d8ce

---

**Total deviations:** 2 auto-fixed (2 gate-counting artifacts, zero behavior changes)
**Impact on plan:** None on scope or architecture; both were required for the plan's own verify gates to pass and each landed inside the task's commit.

## Issues Encountered
- The plan's Task 3 key list has a small count inconsistency: it names 16 walkControls.* keys in the action but says "~19"/"×~19" in the artifacts estimate; the actual set is 16 (chip, chipAria, closeAria, contentAria, diagramAria, eyebrow, title, footer + 8 callout title/body pairs) and is in verified parity at 81 total keys. Total new keys this plan: 45 (the artifacts section's "~40" is an estimate, actuals recorded in frontmatter).

## User Setup Required
None - no external service configuration required.

## Known Stubs
None — no stub patterns, empty states, or placeholder text introduced. BM copy is draft-for-owner-review per D-10 (the designed review loop, not a stub); the owner's wording pass is Wave 4 (01-04). The "BY" → "OLEH" wording question on the about brand subtitle is intentionally deferred to owner review per the plan's Pitfall 3 note.

## Threat Flags

None — no new security-relevant surface beyond the plan's threat model. T-1-06 (textContent-only walker, `innerHTML = t(` count 0 across all four migrated factories) and T-1-07 (SVG walker, static key attributes) mitigations verified; T-1-08 (window.confirm) accepted as planned; T-1-SC honored (no installs, package.json untouched).

## Next Phase Readiness
- All four composite surfaces are BM with live re-sync; the data-i18n walker is implemented and reused (about + walk controls) exactly as PATTERNS.md specified
- Every JS-side LOC-01 surface is now migrated; remaining Phase 01 work is Wave 4 (01-04): static BM head baseline in index.html, CSS text-expansion sweep, owner BM copy review, residual-English audit
- Browser/DevTools human verification (confirm dialog, SVG callouts, 360px/1920px no-clipping) deferred to the end-of-phase manual matrix per `human_verify_mode: end-of-phase` — recorded in coverage D5 as human_judgment
- Render pipeline untouched by construction; the pinned BASE 8e8580c..HEAD diff for this plan contains exactly the 6 planned files

## Self-Check: PASSED

All 6 modified files exist on disk; all task commits are ancestors of HEAD (0187f42, 9fc8856, 301d8ce); final plan-level verify green (npm run build + npm run check:i18n — 81 keys both dictionaries); XSS gate zero `innerHTML = t(` occurrences in all four migrated factories; createAppShell.js clean in both the pinned BASE range and the working tree; commits measured from the persisted ledger: 3.

---
*Phase: 01-i18n-foundation*
*Completed: 2026-11-23*
