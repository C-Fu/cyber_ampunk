---
phase: 02-language-toggle-kl-intro-story
verified: 2026-11-23T00:00:00Z
status: passed
score: 8/12 must-haves verified
covered_files: [".planning/phases/02-language-toggle-kl-intro-story/02-01-PLAN.md", ".planning/phases/02-language-toggle-kl-intro-story/02-01-SUMMARY.md", ".planning/phases/02-language-toggle-kl-intro-story/02-02-PLAN.md", ".planning/phases/02-language-toggle-kl-intro-story/02-02-SUMMARY.md", ".planning/phases/02-language-toggle-kl-intro-story/02-03-PLAN.md", ".planning/phases/02-language-toggle-kl-intro-story/02-03-SUMMARY.md", "index.html", "src/app/createIntroFlow.js", "src/i18n/dictionaries/bm.js", "src/i18n/dictionaries/en.js", "src/main.js", "src/platform/userPreferences.js", "src/ui/chrome/createHeader.js", "src/ui/chrome/createLanguageHintToast.css", "src/ui/chrome/createLanguageHintToast.js", "src/ui/chrome/createSettingsPanel.js", "src/ui/chrome/header.css", "src/ui/chrome/settingsPanel.css", "src/ui/core/externalLinks.js", "src/ui/intro/createIntroOverlay.js", "src/ui/intro/introOverlay.css", "vite.config.js"]
covered_digest: "v4:sha256:3c03a679ccd694ff880b846fac5e1673a128b9eeed9a74bbb25fdbe943ccc380"
behavior_unverified: 4
overrides_applied: 0
behavior_unverified_items:
  - truth: "A user clicks the header BM|EN pill and every subscribed chrome surface re-renders in the other language within one frame — no reload, no teardown"
    test: "On https://c-fu.github.io/cyberpunk-malaya/ click the header BM|EN pill and confirm header, settings, title, metas, html lang all flip instantly in both directions"
    expected: "All subscribed surfaces re-render in the other language with no reload and no appShell teardown"
    why_human: "Store-notify fan-out at runtime; static greps prove wiring, not the rendered result"
  - truth: "The choice survives a page reload (persist via setStoredLanguage before setLanguage, restored on next visit)"
    test: "Toggle to EN, hard-reload the page, confirm UI restores EN; repeat BM; also confirm first visit (fresh localStorage) always starts BM"
    expected: "Restored language matches the persisted choice; first visit starts BM regardless of browser language"
    why_human: "Persistence is a reload-cycle state transition; requires a browser reload"
  - truth: "Toast trigger/dismiss semantics — shows only for first-visit non-ms/id browsers after ENTER; explicit dismiss (X or in-toast Escape) persists the flag across reloads; auto-timeout does NOT persist; hover/focus pauses the 10s timer"
    test: "Fresh profile with navigator.languages=en-US: complete intro via ENTER, observe toast; test action switch, X dismiss + reload (hint gone), auto-timeout + reload (hint returns), hover pause"
    expected: "TO-3 guard order and TO-4 dismiss-vs-timeout persistence behave exactly as specified"
    why_human: "Multi-step state machine over localStorage + navigator state; no test exercises the transitions"
  - truth: "Intro story slow upward auto-scroll renders the ~49-line story, fits the intro stack, restarts on language switch, and the BM→EN→BM round-trip leaves no mixed-language strings (title/head included)"
    test: "On the live site: watch the story scroll, toggle BM⇄EN mid-scroll, confirm scroll restart and full round-trip cleanliness at 360px and 1080p"
    expected: "Credits-style scroll present; language switch rebuilds story and restarts scroll; zero mixed strings after round-trip"
    why_human: "CSS animation behavior, viewport fit, and visual round-trip cleanliness are visual/real-time checks"
coincidental_reliance_items: []
human_verification:
  - test: "BM→EN→BM toggle round-trip on https://c-fu.github.io/cyberpunk-malaya/ — header pill and Tetapan row mirror each other; zero English in BM mode, zero BM in EN mode (document title, html lang, metas included)"
    expected: "Instant re-render, no reload; both toggle surfaces agree; round-trip leaves no mixed strings"
    why_human: "Live render fan-out and visual verification"
  - test: "Persistence: toggle to EN, reload, confirm EN restored; fresh localStorage first visit starts BM with dismissible hint toast only if browser locale is non-ms/id"
    expected: "Persisted choice restored; first visit always BM; toast per TO-3 guard"
    why_human: "Reload-cycle state transition"
  - test: "Toast interaction matrix: action one-tap switch, X dismiss persists across reload, auto-timeout does not persist, hover/focus pauses 10s timer, Escape (focused) dismisses"
    expected: "TO-4/TO-7 semantics exactly"
    why_human: "Multi-step runtime state machine"
  - test: "Intro story scroll treatment at 360px and 1080p: 49 lines scroll slowly upward, ENTER stays clickable, reduced-motion shows opening lines statically, language switch restarts scroll"
    expected: "Owner's 'slowly scroll up' treatment as implemented (credits scroll); no layout break"
    why_human: "Visual/CSS-animation behavior"
  - test: "EN story wording review — owner has wording authority; EN counterpart was orchestrator-drafted pending post-hoc review"
    expected: "Owner approves or edits en.js intro.story.l01..l49"
    why_human: "Prose quality judgment (accepted sanctioned state, not a gap)"
---

# Phase 2: Language Toggle & KL Intro Story Verification Report

**Phase Goal:** Users can switch BM ⇄ EN instantly with a persisted choice, and the intro tells a KL cyberpunk story written natively in both languages
**Verified:** 2026-11-23
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Merged from ROADMAP.md Phase 2 success criteria + 02-01/02-02/02-03 PLAN must_haves. Sanctioned deviations (owner full-length 49-line story replacing the 6-sentence draft; ST-4 budget dead; fork URL identity; orchestrator-drafted EN) are per the verification context NOT gaps.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Header BM\|EN pill toggles all subscribed chrome instantly, no reload/teardown (LOC-02, SC-1) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `createHeader.js:17-18,40,59,77-78` — pill present, syncText via store subscribe; no test exercises the runtime fan-out |
| 2 | Choice persists to localStorage and restores on next visit (LANG-02, SC-2) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `createHeader.js:77-78`, `createSettingsPanel.js:226-227` — persist-first ordering verified; restore path in i18n.js module init; reload transition needs human |
| 3 | Header pill and Tetapan language row always show the same active language (LANG-01, TG-8) | ✓ VERIFIED (presence+wiring; mirror is visual) | Both read `getLanguage()` at call time; `lang-toggle-segment--active` in header syncText; `aria-pressed` segments in settings; live mirror check in Human Verification |
| 4 | BM\|EN segment labels hardcoded language-neutral; only aria-labels from dictionary (T-5) | ✓ VERIFIED | `createHeader.js:17-18` literal "BM"/"EN" spans with `aria-hidden`; aria-labels via `t()` |
| 5 | First visit always starts BM regardless of browser language (LANG-04, SC-3) | ✓ VERIFIED | Store default BM; `shouldShowHint()` guard (`createLanguageHintToast.js:14-41`) implements TO-3 order: stored-language → current-language → navigator.languages ms/id prefix → dismissed |
| 6 | Toast is dismissible, offers one-tap switch, persists explicit dismissal only (LANG-04, TO-4/TO-8) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `onActionClick`/`onDismissClick` persist flag; auto-dismiss does not (grep-verified structure); runtime behavior needs human |
| 7 | Toast is clickable chrome: pointer-events all, z-index 1000, hover/focus pauses timer (TO-5/TO-6/TO-7) | ✓ VERIFIED | `createLanguageHintToast.css:6,27` (`z-index: 1000`, `pointer-events: all`), `prefers-reduced-motion` block at :79; hover/focus timer pause in JS |
| 8 | Toast text creation-time t(), no subscription, self-removes on switch (TO-8) | ✓ VERIFIED | `createLanguageHintToast.js` — no `subscribe` import; `hide()` calls `root.remove()` |
| 9 | Reduced-motion opacity-only; aria-live polite; no focus steal (TO-7/TO-9) | ✓ VERIFIED | CSS `prefers-reduced-motion: reduce` block; `aria-live="polite"` on toast root |
| 10 | Intro tells the KL-cyberpunk story natively in BM and EN as dictionary keys (INTRO-01/02, SC-4) | ✓ VERIFIED | `intro.story.l01..l49` present in BOTH dictionaries (49 keys each, parity 138 keys green); owner-authored BM verbatim; rendered as per-line `<p>` in `createIntroOverlay.js` renderStory() |
| 11 | Switching language re-renders intro kicker/story/ENTER via syncText; letter-split brand lines never re-synced (D-05) | ✓ VERIFIED | `createIntroOverlay.js:100` `subscribe(syncText)`; syncText covers kicker/story/ENTER only; `splitIntoLetters` exactly 2 occurrences (1 def + 1 call over `.intro-brand-line`); story built with createElement/textContent, never letter-split |
| 12 | Full BM→EN→BM round-trip leaves no mixed strings incl. title/head (SC-5) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Dictionary parity (138 keys) + staticHead swap path verified; the visual round-trip is a live-browser check |

**Score:** 8/12 truths verified (4 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/ui/chrome/createHeader.js` | Toggle pill + persist-on-click | ✓ VERIFIED | wired (imports setStoredLanguage, subscribes store) |
| `src/ui/chrome/header.css` | Pill styling | ✓ VERIFIED | substantive, wired via import |
| `src/ui/chrome/createSettingsPanel.js` | Language row, two aria-pressed segments, persist | ✓ VERIFIED | lines 226-227 persist-first |
| `src/ui/chrome/settingsPanel.css` | Language section styling | ✓ VERIFIED | substantive, wired |
| `src/i18n/dictionaries/bm.js` / `en.js` | intro.story.l01..l49, kicker, toggle aria keys, langHint.* | ✓ VERIFIED | identical key sets, `check:i18n` parity 138 keys green |
| `src/ui/intro/createIntroOverlay.js` | Story paragraph + syncText subscription + scroll restart | ✓ VERIFIED | renderStory/restartStoryScroll/subscribe present |
| `src/ui/intro/introOverlay.css` | Story window + CSS credits scroll + reduced-motion | ✓ VERIFIED | `--intro-story-h`, `@keyframes intro-story-scroll` (100s linear), reduced-motion block |
| `src/platform/userPreferences.js` | get/setLanguageHintDismissed storage pair | ✓ VERIFIED | exported at :69/:77, static key, try/catch template |
| `src/ui/chrome/createLanguageHintToast.js` | Toast factory + shouldShowHint guard | ✓ VERIFIED | wired into main.js DI |
| `src/ui/chrome/createLanguageHintToast.css` | Clickable chrome styling | ✓ VERIFIED | pointer-events: all, z-index 1000 |
| `src/app/createIntroFlow.js` + `src/main.js` | Toast DI invoked after revealAppUi (TO-10) | ✓ VERIFIED | `createIntroFlow.js:63,67` (revealAppUi then showLanguageHintToast?.()); main.js:236-243 closure with guard |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| createIntroFlow.js | createLanguageHintToast.js | onStart calls injected closure right after revealAppUi() | WIRED | `createIntroFlow.js:63-67` |
| createLanguageHintToast.js | userPreferences.js | guard reads getStoredLanguage/getLanguageHintDismissed; persists via setLanguageHintDismissed | WIRED | imports + guard order at :14-41, persist at :115 |
| createLanguageHintToast.js | i18n.js | action: setStoredLanguage(other); setLanguage(other) | WIRED | :121-122 persist-first contract |
| createHeader.js / createSettingsPanel.js | i18n store | subscribe/syncText + persist-first toggles | WIRED | header :77-78, settings :226-227 |
| intro.story.l01..l49 | Phase 3 TTS | per-line keys as narration source | WIRED (contract) | keys present in both dictionaries; Phase 3 consumes them |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Dictionary parity | `npm run check:i18n` | parity OK: bm.js and en.js both carry 138 keys | ✓ PASS |
| Production build | `npm run build` | built in 14.05s | ✓ PASS |
| Story key symmetry | `grep -c "intro.story"` | 49 in bm.js, 49 in en.js | ✓ PASS |
| Letter-split boundary (D-05) | `grep -c "splitIntoLetters("` | 2 (1 def + 1 call over brand lines) | ✓ PASS |
| innerHTML-t() ban | grep across 4 Phase 2 UI files | 0 matches in all files | ✓ PASS |
| Debt markers | grep TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER | 0 in all 5 phase-touched files | ✓ PASS |
| langHint keys | grep both dictionaries | 3 keys each (message/action/dismissAria) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| LOC-02 | 02-01, 02-02, 02-03 | Instant BM⇄EN switch without reload | ✓ SATISFIED (behavior: human) | store subscribe fan-out wired on header, settings, intro overlay |
| LANG-01 | 02-01 | Header + settings toggle surfaces | ✓ SATISFIED (behavior: human) | both surfaces verified present and store-driven |
| LANG-02 | 02-01 | Persisted language choice | ✓ SATISFIED (behavior: human) | persist-first at all 3 callers; restore path from Phase 1 |
| LANG-04 | 02-03 | First visit BM; non-ms/id browsers get dismissible switch hint | ✓ SATISFIED (behavior: human) | TO-3 guard + toast factory + DI wiring |
| INTRO-01 | 02-02 | KL-cyberpunk intro story in BM | ✓ SATISFIED (visual: human) | owner-authored 49-line BM verbatim in dictionary + scroll treatment |
| INTRO-02 | 02-02 | Faithful EN counterpart | ✓ SATISFIED (wording review: human) | 49-line EN in dictionary; orchestrator-drafted, owner post-hoc review pending (sanctioned) |

No orphaned requirements: REQUIREMENTS.md Phase 2 mapping is exactly the six IDs above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| (none) | — | — | — | No debt markers, no innerHTML-t() interpolation, no stub returns in any phase-touched file |

## Human Verification Required

See frontmatter `human_verification` + `behavior_unverified_items`. Live site: https://c-fu.github.io/cyberpunk-malaya/ (Pages auto-deploy on push; a prior session confirmed the toggle round-trip on a local build). The five items: round-trip cleanliness, persistence/first-visit, toast interaction matrix, story scroll treatment at 360px/1080p, and the EN story wording review (owner wording authority — accepted sanctioned state, not a gap).

## Gaps Summary

No gaps. All 12 must-have truths are present and wired in the codebase; none FAILED. The 4 behavior-dependent truths (render fan-out, persistence restore, toast state machine, visual round-trip) have no automated tests exercising the transitions and route to human verification per the escalation gate — consistent with the project's end-of-phase human_verify_mode convention and the 02-VALIDATION.md manual browser checklist.

---
_Verified: 2026-11-23_
_Verifier: the agent (gsd-verifier)_
