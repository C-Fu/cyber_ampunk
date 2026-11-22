---
phase: 01-i18n-foundation
plan: 04
subsystem: ui
tags: [i18n, bahasa-melayu, localization, seo, meta-tags, json-ld, css, owner-review, webgpu, threejs]

requires:
  - phase: 01-i18n-foundation plan 03
    provides: 81-key dictionaries with all meta.* wording drafted, composite chrome surfaces fully migrated with live re-sync
provides:
  - "BM static baseline in raw index.html: lang=ms, BM title, BM meta title/description, BM keywords (game hujan), BM og/twitter content, og:locale ms_MY, BM JSON-LD description + single Adri 'C-Fu' author entity, BM noscript — crawler-visible before any JS runs"
  - "Owner-approved (D-10) BM copy: every Anderson Mancini/Sunag attribution replaced with Adri 'C-Fu'; title phrase 'Adegan hujan siberpunk' -> 'Game hujan siberpunk' in meta.metaTitle/ogTitle/title/twitterTitle"
  - "EN meta rebranded for consistency: 'Threejs-Punk - Raining scene inspired in CyberPunk by ...' -> 'Cyberpunk Malaya - Rain-soaked cyberpunk game by Adri 'C-Fu'' in metaTitle/ogTitle/title/twitterTitle"
  - "About-panel attribution collapsed to a single 'Adri 'C-Fu'' button (https://github.com/C-Fu, noopener,noreferrer) replacing the Anderson Mancini + Sunag button pair; sunag wiring removed"
  - "Residual-English audit closed: guided sweep over src/ui, createLoaderOverlay.js, main.js, warmup.js, createWorld.js returns ZERO hits (not even keep-list strings match the pattern) — LOC-01 closed"
  - "Documented zero-diff CSS sweep pass (Task 2, E-4/E-5): no overflow demonstrated at the box-model level, no speculative width bumps"
affects: [Phase 2 language toggle (EN swap path inherits the rebranded meta wording), end-of-phase manual matrix + VERIFICATION.md, $gsd-verify-work]

actuals:
  tokens: 3600    # chars/4 over the realized diff (43 insertions + 57 deletions across 5 files, 14260 diff chars)
  tasks: 3
  commits: 2      # MEASURED: git rev-list --count 7eef7646..a02f9c0 (Task 1 static baseline in the prior session; Task 2 was a zero-diff pass with no commit; Task 3 owner edits here) — note: the ledger base was recorded at continuation-agent spawn, after the Task 1 commit, so the measured range counts the Task 1 commit (aeea63d) visible in git log 7eef764..HEAD
  plan_head_before: 7eef7646ef0bcf5e280452ee6b46bf091259f9f4
  plan_head_after: a02f9c0be9829e5adf44b4d156782597867edc67

tech-stack:
  added: []  # D-01: zero new dependencies; package.json untouched by this plan
  patterns:
    - "Static-baseline-first head localization: the raw index.html mirrors bm.js meta.* wording exactly (single source of truth for wording), staticHead.js SELECTOR_MAP rewrites content attributes only — verified all 10 selectors resolve post-edit"
    - "Single-author JSON-LD entity replacing a multi-author array — schema stays valid (parsed OK post-edit), url points at the new author's profile"
    - "Owner-review checkpoint (D-10) as the sole blocking human gate of the phase: wording corrections flow back through both dictionaries + the static head + hardcoded credit lines in one atomic pass"

key-files:
  created: []
  modified:
    - index.html
    - src/i18n/dictionaries/bm.js
    - src/i18n/dictionaries/en.js
    - src/ui/chrome/createAboutPanel.js
    - src/ui/intro/createIntroOverlay.js

key-decisions:
  - "Owner feedback #1 (attribution rebrand): every 'Anderson Mancini dan Sunag' / 'and Sunag' / '· Sunag' / 'By ... & Sunag' variant replaced with Adri 'C-Fu' across bm.js/en.js meta keys, index.html title/meta-title/description/keywords/author/creator/publisher/og/twitter titles/JSON-LD, and the JSON-LD author array collapsed to a single Person entity (name Adri 'C-Fu', url https://github.com/C-Fu)"
  - "Owner feedback #2 (title phrase): 'Adegan hujan siberpunk' -> 'Game hujan siberpunk' applied at the word level in bm.js meta.metaTitle/ogTitle/title/twitterTitle and mirrored in index.html — INTERPRETATION NOTE: the owner's instruction was 'Adegan siberpunk' -> 'Game siberpunk' at the phrase level; the orchestrator interpreted it as 'Adegan' -> 'Game' inside the full title phrase, preserving 'hujan'. The owner can correct the phrasing later (e.g. if they want 'Game siberpunk hujan'); unrelated lowercase 'adegan' in og/twitter descriptions ('dalam adegan bandar malam') left unchanged per instruction"
  - "EN mirror edits (orchestrator-directed for brand consistency): EN metaTitle/ogTitle/title/twitterTitle rebranded 'Threejs-Punk' -> 'Cyberpunk Malaya' with 'Rain-soaked cyberpunk game by Adri 'C-Fu'' phrasing to mirror the BM 'Game hujan siberpunk'; EN meta.description attribution tail updated to 'by Adri 'C-Fu''. EN narrative copy (about.lead1 etc., which still say Threejs-Punk) left untouched per owner instruction (attribution + title phrase only)"
  - "index.html twitter:site / twitter:creator handles (@andersonmancini) updated to @C_Fu_ — attribution includes the social handles pointing at the old author; leaving the old handles would have been a residual attribution string"
  - "index.html keywords: 'adegan hujan' -> 'game hujan' (matching the title phrase) and 'Anderson Mancini, Sunag' -> 'Adri C-Fu' (keywords strip the quote marks, matching JSON-LD keywords style); JSON-LD keywords 'rainy scene, Anderson Mancini, Sunag' -> 'rain-soaked game, Adri C-Fu'"
  - "About panel: the two attribution buttons (Anderson Mancini -> andersonmancini.dev, Sunag -> x.com/sea3dformat) replaced by ONE 'Adri 'C-Fu'' button linking https://github.com/C-Fu with the same window.open(_blank, noopener,noreferrer) pattern; the sunagButton querySelector and click wiring removed; source button unchanged; aboutPanel.css has NO anderson/sunag-specific selectors (verified — only .about-buttons/.about-model-classes exist), so no CSS cleanup was needed"
  - "Intro overlay credit (createIntroOverlay.js line 36): 'Anderson Mancini · Sunag' -> 'Adri 'C-Fu'' — the credit sits OUTSIDE the GSAP letter-split region (splitIntoLetters runs only on .intro-brand-line elements); the plan's keep-list for this line is superseded by owner feedback as instructed"
  - "About brand subtitle: 'BY ANDERSON MANCINI & SUNAG' -> 'BY ADRI 'C-FU'' (text-transform: uppercase renders it uppercase; source carries the natural-case name). 'By Anderson Mancini & Sunag' model-credits line -> 'By Adri 'C-Fu''"
  - "Task 2 CSS sweep recorded as a documented zero-diff pass: no box-model overflow demonstrable from string lengths vs budgets, so no width/tracking bumps were made (E-4 forbids speculative changes); visual no-clipping confirmation rides the end-of-phase manual matrix (E-5)"

requirements-completed: [LOC-01, LOC-03, LOC-04, LOC-05]

coverage:
  - id: D1
    description: "Raw index.html is BM before any JS runs: lang=ms, BM title 'Cyberpunk Malaya | Game hujan siberpunk oleh Adri 'C-Fu'', BM meta title/description, BM og/twitter title/description/image:alt, og:locale ms_MY, BM JSON-LD description + single Adri 'C-Fu' author, BM noscript (LOC-04/LOC-05 static baseline)"
    requirement: LOC-04
    verification:
      - kind: other
        ref: "grep gates: lang=\"ms\"=1, lang=\"en\"=0, og:locale ms_MY=1, 'Raining scene'=0, content=\"en_US\"=0; JSON.parse of the JSON-LD block: valid; all 10 staticHead.js SELECTOR_MAP selectors + document.title target resolve against the edited head"
        status: pass
      - kind: other
        ref: "npm run build && npm run check:i18n (81-key parity green)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Owner (D-10 language authority) BM copy review returned TWO wording corrections, both applied: attribution rebrand to Adri 'C-Fu' everywhere, and 'Adegan hujan siberpunk' -> 'Game hujan siberpunk' in the title phrase — review APPROVED contingent on these edits, which are now in"
    requirement: LOC-01
    verification: []
    human_judgment: true
    rationale: "Owner wording approval is the D-10 blocking-human checkpoint by design — wording naturalness is a judgment no automated gate can assert. The owner returned the corrections via the checkpoint response; approval is contingent on the applied edits, which this summary documents. Any further wording preference (e.g. the 'hujan' placement interpretation) can be corrected in a later pass."
  - id: D3
    description: "Residual-English audit (LOC-01 closure): guided sweep grep -rnE '\"[A-Z][a-z]+ [a-z ]+\"' over src/ui, src/app/createLoaderOverlay.js, src/main.js, src/runtime/warmup.js, src/world/createWorld.js returns ZERO hits; leaf-factory spot grep returns 0; zero 'Anderson Mancini'/'Sunag' strings remain anywhere in src/ or index.html"
    requirement: LOC-01
    verification:
      - kind: other
        ref: "grep -rnE '\"[A-Z][a-z]+ [a-z ]+\"' src/ui src/app/createLoaderOverlay.js src/main.js src/runtime/warmup.js src/world/createWorld.js -> empty; spot grep on the five leaf factories -> 0; grep -i 'anderson|sunag|mancini|sea3dformat' src index.html -> empty (RESIDUAL_EXIT=1)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Runtime head swap (LOC-03/LOC-05): applyStaticHead rewrites document.title + all 8 SELECTOR_MAP meta contents + og:locale (ms_MY/en_US) + documentElement.lang (ms/en) from the active dictionary — every selector verified to resolve against the owner-edited static head"
    requirement: LOC-03
    verification:
      - kind: other
        ref: "staticHead.js source review: document.title = t('meta.title'), 8-entry SELECTOR_MAP, og:locale conditional, lang conditional; all 10 selectors resolve in the edited index.html (checked programmatically)"
        status: pass
    human_judgment: false
  - id: D5
    description: "EN-swap path verification and visual no-clipping at 360px/1920px (E-5) — dormant EN swap exercised in Phase 2; browser matrix deferred to end-of-phase manual verification per human_verify_mode: end-of-phase"
    requirement: LOC-05
    verification: []
    human_judgment: true
    rationale: "Live WebGPU browser session required (DevTools documentElement.lang/document.title assertions, og/twitter head inspection, viewport extremes) — no DOM test harness exists by design (D-01, zero new dependencies); deferred to the end-of-phase manual matrix."

duration: ~25 min (this continuation session: Task 3 edits + close-out; Tasks 1-2 completed in the prior session at commit aeea63d)
completed: 2026-11-23
status: complete
---

# Phase 01 Plan 04: BM Static Head, CSS Sweep, Owner Review, Residual-English Audit Summary

**BM-first static head in index.html (title/meta/og/twitter/JSON-LD/noscript, og:locale ms_MY) + owner-applied attribution rebrand to Adri 'C-Fu' with 'Game hujan siberpunk' title phrasing, about-panel attribution collapsed to one button, and a zero-hit residual-English audit closing LOC-01**

## Performance

- **Duration:** ~25 min (continuation session; Tasks 1-2 in prior session)
- **Started:** 2026-11-22T17:45:44Z (continuation spawn)
- **Completed:** 2026-11-23 (session date)
- **Tasks:** 3/3
- **Files modified:** 5 (all planned; 0 created)

## Accomplishments
- Raw index.html is fully BM before any JS runs (LOC-04): `<html lang="ms">`, BM title, BM meta title/description/keywords, BM og and twitter title/description/image:alt, `og:locale ms_MY`, BM JSON-LD description with a single Adri 'C-Fu' author entity (url https://github.com/C-Fu), BM noscript line; all 10 staticHead.js SELECTOR_MAP targets verified to resolve post-edit (T-1-09 desync mitigation)
- Owner BM copy review (D-10, the phase's single blocking human gate) returned two wording corrections, both applied: (1) attribution rebrand — every "Anderson Mancini dan Sunag" variant (BM meta keys, EN meta keys, index.html metas + JSON-LD, twitter handles, intro credit, about subtitle/model-credits) replaced with Adri 'C-Fu'; (2) title phrase — "Adegan hujan siberpunk" -> "Game hujan siberpunk" in bm.js meta.metaTitle/ogTitle/title/twitterTitle, mirrored in index.html (see frontmatter key-decisions for the interpretation note; unrelated lowercase "adegan bandar malam" untouched)
- EN side rebranded for consistency per orchestrator instruction: metaTitle/ogTitle/title/twitterTitle now "Cyberpunk Malaya - Rain-soaked cyberpunk game by Adri 'C-Fu'" (was "Threejs-Punk - Raining scene inspired in CyberPunk by Anderson Mancini and Sunag"); EN narrative copy (about.lead*) untouched per owner scope
- About panel: the Anderson Mancini + Sunag button pair replaced by a single "Adri 'C-Fu'" button linking https://github.com/C-Fu (same window.open pattern); sunag querySelector/wiring removed; source button unchanged; aboutPanel.css verified to contain no anderson/sunag-specific selectors
- Residual-English audit closed (LOC-01): the guided sweep over the full migrated surface set returns ZERO hits (keep-list strings like key caps don't even match the pattern), the leaf-factory spot grep returns 0, and a case-insensitive grep confirms zero "Anderson"/"Sunag"/"Mancini"/"sea3dformat" strings remain in src/ or index.html
- Task 2 CSS text-expansion sweep recorded as a documented zero-diff pass (prior session): no overflow demonstrable, no speculative width bumps (E-4); visual confirmation rides the end-of-phase manual matrix (E-5)
- Dictionary parity green after all edits: `npm run check:i18n` — bm.js and en.js both carry 81 keys (values only edited, key set unchanged); `npm run build` green

## Task Commits

Each task was committed atomically:

1. **Task 1: index.html BM static baseline** - `aeea63d` (feat) — prior session
2. **Task 2: CSS text-expansion sweep (E-1..E-5)** - zero-diff documented pass, no commit (a no-change outcome is a valid pass per the plan's action step 5)
3. **Task 3: Owner BM review (D-10) wording application + residual-English audit closure** - `a02f9c0` (feat)

**Plan metadata:** (final docs commit below)

## Files Created/Modified
- `index.html` - BM static head baseline + owner edits: title/meta/keywords/author/creator/publisher/og/twitter titles, JSON-LD description + single-author entity, twitter handles, keywords "game hujan" / "Adri C-Fu"
- `src/i18n/dictionaries/bm.js` - meta.description/metaTitle/ogTitle/title/twitterTitle: attribution -> Adri 'C-Fu', "Adegan" -> "Game" (title phrase only)
- `src/i18n/dictionaries/en.js` - meta.description/metaTitle/ogTitle/title/twitterTitle: Cyberpunk Malaya rebrand + Rain-soaked cyberpunk game phrasing + Adri 'C-Fu' attribution
- `src/ui/chrome/createAboutPanel.js` - brand subtitle, single author button (github.com/C-Fu) replacing the anderson+sunag pair, model-credits line; sunag wiring removed
- `src/ui/intro/createIntroOverlay.js` - intro credit line "Adri 'C-Fu'" (outside the letter-split region; keep-list superseded by owner feedback)

## Decisions Made
(see frontmatter key-decisions for the full list; highlights:)
- The owner's "Adegan siberpunk -> Game siberpunk" instruction was interpreted at the word level inside the full title phrase ("Adegan hujan siberpunk" -> "Game hujan siberpunk"), preserving "hujan" — noted here so the owner can correct the phrasing later if they intended a different word order
- Twitter social handles counted as attribution (they pointed at the old author) and were updated to @C_Fu_
- og:site_name, application-name/mobile-web-app-title/apple-mobile-web-app-title ("Threejs-Punk"), brand URLs, and canonical left untouched — the owner's instruction covered attribution strings and the title phrase, not the site brand fields; the EN dictionary narrative copy likewise stays Threejs-Punk (owner asked only for attribution + title phrase)
- README.md/AGENTS.md/STRIP.md/LICENSE untouched — upstream project documents, explicitly out of scope

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale attribution residuals the plan's keep-list would have preserved**
- **Found during:** Task 3 (owner response application)
- **Issue:** The plan's Task 1 keep-list ("author/creator/publisher proper nouns") and the 01-03 about-panel keep-list ("proper-noun buttons, credit lines stay hardcoded") would have left "Anderson Mancini"/"Sunag" strings in the shipped head and about panel — contradicting the owner's rebrand instruction (checkpoint feedback supersedes the plan's keep-list, as the resume instructions stated)
- **Fix:** Replaced every attribution occurrence (grep-verified occurrence map re-verified before editing): both dictionaries' meta keys, index.html metas/JSON-LD/twitter handles, intro credit, about subtitle/buttons/model-credits; the two-author JSON-LD array collapsed to one Person entity
- **Files modified:** index.html, src/i18n/dictionaries/bm.js, src/i18n/dictionaries/en.js, src/ui/chrome/createAboutPanel.js, src/ui/intro/createIntroOverlay.js
- **Verification:** Case-insensitive grep for anderson|sunag|mancini|sea3dformat over src/ + index.html returns zero hits; JSON-LD block parses; build + parity green
- **Committed in:** a02f9c0

---

**Total deviations:** 1 auto-fixed (keep-list supersession by owner feedback — the designed D-10 review loop working as intended)
**Impact on plan:** None beyond the owner's requested wording scope; EN narrative copy, brand fields, and upstream docs deliberately untouched.

## Issues Encountered
None in this session. (Prior session note carried forward: Task 2's CSS sweep was a zero-diff pass, documented in the plan's own action step 5 as a valid outcome.)

## User Setup Required
None - no external service configuration required.

## Known Stubs
None — no stub patterns, empty states, or placeholder text introduced. The BM copy is now owner-reviewed per D-10 (the review loop completed: corrections applied, approval contingent on the applied edits which are in).

## Threat Flags

None — no new security-relevant surface. T-1-09 (head/staticHead desync) re-verified post-owner-edit: all 10 SELECTOR_MAP selectors resolve, and bm.js meta.* wording mirrors the static head exactly (single source of truth). T-1-10 (noscript) static BM only. T-1-SC honored (no installs, package.json untouched). The new author link uses the same window.open(_blank, noopener,noreferrer) pattern as the buttons it replaces.

## Next Phase Readiness
- Phase 01 (i18n Foundation) is COMPLETE: all 4 plans have summaries; every JS surface + the static head are BM with 81-key dictionary parity and owner-reviewed wording (D-10)
- LOC-01/03/04/05 requirements satisfied by code + owner sign-off; final browser/manual matrix (DevTools lang/title assertions, og/twitter inspection, 360px/1920px no-clipping, AGENTS.md regression items) rides `$gsd-verify-work` per human_verify_mode: end-of-phase
- The dormant EN swap path (staticHead + setLanguage) is exercised in Phase 2; EN meta wording is already the rebranded Cyberpunk Malaya phrasing
- No render-pipeline changes: the plan's diff touches only head/dictionary/UI-credit files; createRenderLoop.js, src/post/, src/tsl/ untouched

## Self-Check: PASSED

All 5 modified files exist on disk; task commits are ancestors of HEAD (aeea63d, a02f9c0 — verified via git log; Task 2 was zero-diff by design); final plan-level verify green: npm run build + npm run check:i18n (81 keys both dictionaries); residual-English sweep zero hits; zero Anderson/Sunag strings in src/ and index.html; all 10 head selectors resolve; commits measured from the persisted ledger: 2.

---
*Phase: 01-i18n-foundation*
*Completed: 2026-11-23*
