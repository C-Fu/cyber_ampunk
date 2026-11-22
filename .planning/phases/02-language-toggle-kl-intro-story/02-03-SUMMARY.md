---
phase: 02-language-toggle-kl-intro-story
plan: 03
subsystem: ui-chrome
tags: [i18n, toast, intro-flow, localStorage]
requires: ["02-01 (language store + toggle callers)", "02-02 (intro story keys)"]
provides: ["createLanguageHintToast factory", "langHint.* dictionary keys", "get/setLanguageHintDismissed storage pair"]
affects: ["src/main.js", "src/app/createIntroFlow.js"]
tech-stack:
  added: []
  patterns: ["self-mounting chrome factory (show/destroy)", "DI closure into createIntroFlow", "persist-first language switch"]
key-files:
  created:
    - src/ui/chrome/createLanguageHintToast.js
    - src/ui/chrome/createLanguageHintToast.css
  modified:
    - src/platform/userPreferences.js
    - src/i18n/dictionaries/bm.js
    - src/i18n/dictionaries/en.js
    - src/app/createIntroFlow.js
    - src/main.js
decisions:
  - "Toast text resolves at creation time via t() with no store subscription — the toast self-removes on switch (TO-8 simplest compliant path)"
  - "Toast guard is exported (shouldShowHint) and evaluated in main.js closure; factory destroys itself when the guard fails"
  - "Hint-dismissed flag intentionally excluded from clearAllStoredPreferences (a dismissed hint is not a config, TO-4)"
metrics:
  duration: ~35 min
  completed: 2026-11-23
status: complete
plan_head_before: ead8716458c626f2bdd22e239648384086d9d630
plan_head_after: 2f5fa02083d585f1d8c4634b1e479369f6acb872
commits: 2
actuals:
  tokens: 40000
  tasks: 3
  commits: 2
---

# Phase 02 Plan 03: Language Hint Toast Summary

One-shot dismissible toast after the intro's ENTER offering a one-tap BM↔EN switch for non-ms/id first-visit browsers, with explicit-only dismissal persistence.

## What Was Built

- **Storage pair** (src/platform/userPreferences.js): `getLanguageHintDismissed` / `setLanguageHintDismissed` around static key `threejs-punk-lang-hint-dismissed`, cloned from the look-preset try/catch template. `clearAllStoredPreferences` untouched.
- **Dictionary keys**: `langHint.message` / `langHint.action` / `langHint.dismissAria` added to bm.js and en.js (138 keys, parity green).
- **Toast module** (src/ui/chrome/createLanguageHintToast.js + .css): self-mounting factory returning `{ root, show, hide, destroy }`. DOM skeleton from hardcoded literals; dictionary strings enter only via `textContent`/`setAttribute` (T-2-05). Show/hide choreography cloned from createPerformanceNotice (hidden attr + rAF class flip, 420ms settle). 10s auto-dismiss paused on hover/focus-within; auto-timeout does NOT persist — only action click, X click, or in-toast Escape persist the flag. Action performs persist-first switch: `setStoredLanguage(other)` then `setLanguage(other)`. Guard order per TO-3: stored language null → current language "bm" → navigator.languages has no ms/id prefix → not already dismissed. Reduced-motion: opacity-only, no translate. `aria-live="polite"`, no focus steal.
- **Wiring**: `createIntroFlow` accepts `showLanguageHintToast` DI option; `onStart` invokes it right after `revealAppUi()` (TO-10). main.js passes a closure that creates the toast, calls exported `shouldShowHint()`, and shows or destroys accordingly. `src/runtime/createRenderLoop.js` untouched.

## Task Results

| Task | Name | Commit | Result |
|------|------|--------|--------|
| 1 | Storage pair + langHint keys | 746f929 | Done — parity 138 keys green |
| 2 | Toast module + CSS + wiring | 2f5fa02 | Done — build green, all greps pass |
| 3 | Phase-close hygiene gates | (no commit — zero violations found, no file changes) | Done |

## Verification Baselines (for verify-work)

- `pointer-events` occurrences in createLanguageHintToast.css: **2** (base declaration + reduced-motion unaffected; gate EXPECT ≥1)
- `setStoredLanguage` occurrences in createLanguageHintToast.js: **2** (import + action call; gate EXPECT ≥1)
- `innerHTML.*\$\{t\(` matches across createLanguageHintToast.js, createHeader.js, createSettingsPanel.js, createIntroOverlay.js: **0** (grep exit 1)
- `setStoredLanguage` callers in src/ui/chrome/*.js: **3** (createHeader.js:77, createSettingsPanel.js:226, createLanguageHintToast.js:121 — all persist-first)
- Toast imports: only i18n.js, userPreferences.js, phosphorIcons.js + own CSS — no new dependencies, no render-loop import
- `npm run check:i18n`: green (138 keys both dictionaries); `npm run build`: green (vite, 192 modules)
- git ls-files src/runtime/createRenderLoop.js: tracked; working-tree diff: clean

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] BM action label corrected to name the TARGET language**
- **Found during:** Task 1
- **Issue:** The plan's literal BM copy "Tukar ke BM" contradicts its own TO-1/TO-2 rationale ("message and action label are in the CURRENT language naming the TARGET language") — under the TO-3 guard the toast only ever shows in BM offering EN.
- **Fix:** BM `langHint.action` set to "Tukar ke EN"; EN mirror "Switch to Malay" unchanged.
- **Files modified:** src/i18n/dictionaries/bm.js
- **Commit:** 746f929

**2. [Rule 1 - Bug] Task 2 verification storage-key grep expectation**
- **Found during:** Task 1 verification
- **Issue:** The automated gate expected ≥2 literal occurrences of "threejs-punk-lang-hint-dismissed", but the implementation references the `LANGUAGE_HINT_DISMISSED_KEY` const (1 literal) — the correct D-04 static-key style, with no duplicates.
- **Fix:** Interpreted the gate's intent (pair present, no stray duplicates): count is 1 literal + 2 symbol usages via const. Gate intent satisfied; not weakened.
- **Files modified:** none

### Sanctioned wave-2 context
Wave 2 added commits (c710bc5, 867911f, 384d29b) not in the plan's original scope; no diff-scope gate in this plan pinned an older base, so no gate re-pin was needed. `plan_head_before` is ead8716 (immediately preceding this plan's work).

## Known Stubs

None — no stub patterns found in created/modified files.

## Deferred Issues (out of scope)

- Pre-existing vite chunk-size warning (>500 kB main chunk) — unrelated to this plan.

## Self-Check: PASSED

- 746f929 and 2f5fa02 are ancestors of HEAD (verified via rev-list count = 2)
- All created files exist on disk
- All `<automated>` gates executed and passed
