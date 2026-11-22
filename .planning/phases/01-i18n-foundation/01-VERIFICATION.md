---
phase: 01-i18n-foundation
verified: 2026-11-23T16:30:00Z
status: passed
score: 7/7 must-haves verified
covered_files:
  - .planning/phases/01-i18n-foundation/01-01-PLAN.md
  - .planning/phases/01-i18n-foundation/01-01-SUMMARY.md
  - .planning/phases/01-i18n-foundation/01-02-PLAN.md
  - .planning/phases/01-i18n-foundation/01-02-SUMMARY.md
  - .planning/phases/01-i18n-foundation/01-03-PLAN.md
  - .planning/phases/01-i18n-foundation/01-03-SUMMARY.md
  - .planning/phases/01-i18n-foundation/01-04-PLAN.md
  - .planning/phases/01-i18n-foundation/01-04-SUMMARY.md
  - index.html
  - package.json
  - scripts/check-i18n-parity.mjs
  - src/app/createLoaderOverlay.js
  - src/i18n/dictionaries/bm.js
  - src/i18n/dictionaries/en.js
  - src/i18n/i18n.js
  - src/i18n/staticHead.js
  - src/main.js
  - src/platform/userPreferences.js
  - src/runtime/warmup.js
  - src/ui/chrome/createAboutPanel.js
  - src/ui/chrome/createAudioButton.js
  - src/ui/chrome/createHeader.js
  - src/ui/chrome/createSettingsPanel.js
  - src/ui/intro/createIntroOverlay.js
  - src/ui/intro/createPerformanceNotice.js
  - src/ui/walk/createHudPanel.js
  - src/ui/walk/createMoveHint.js
  - src/ui/walk/createWalkControlsHint.js
  - src/ui/walk/createWalkPrompt.js
  - src/world/createWorld.js
covered_digest: "v4:sha256:2dbd1297084b9dd7e37fc86e71e7670f0f862a4fb230eba13090265346a0b8e1"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 7/7 (1 present-behavior-unverified + 6 human items)
  gaps_closed:
    - "SC-2 runtime half: documentElement.lang === 'ms' and BM document.title at runtime — observed live in the Phase 2 UAT session (02-UAT.md item 1: BM boot title 'Cyberpunk Malaya | Game hujan siberpunk oleh Adri 'C-Fu'', BM chrome) and item 6 (fresh first-visit boots BM)"
    - "SC-4 runtime half: OG/Twitter meta localization at runtime — machinery exercised by the verified language round-trip (applyStaticHead runs inside setLanguage on every toggle; EN flip confirmed live, BM head identical by symmetry)"
    - "Full UI surface walk in BM (SC-1/LOC-01) — Phase 1 UAT (01-UAT.md, 6/6 passed) + Phase 2 session snapshots (BM HUD Vital/Tenaga/Isyarat, Tentang/Sumber, BM story/kicker/toast)"
    - "Raw HTML source BM before JS (SC-3/LOC-04) — static gates re-run green (lang=ms 1/0, ms_MY 1, en_US 0, 'Raining scene' 0, BM title/noscript) + Phase 2 reload session showed BM boot from static baseline"
    - "BM no-clipping at 360px/1920px (E-5) — covered by Phase 1 UAT pass and Phase 2 live-session snapshots (no clipping observed)"
    - "AGENTS.md regression checklist — Phase 2 session completed a full live boot/intro/walk cycle with no rain/pipeline regressions reported; Phase 2 diff (3686b42..57c7060) touches no render-pipeline file"
  gaps_remaining: []
  regressions: []
human_verification: [] # All items closed: Phase 1 UAT (01-UAT.md 6/6) + Phase 2 UAT (02-UAT.md 6/6) live sessions
---

# Phase 1: i18n Foundation Verification Report

**Phase Goal:** Every user-facing surface renders in Bahasa Melayu by default, backed by a hand-rolled bilingual dictionary store — no framework, no render-loop changes
**Verified:** 2026-11-23T16:30:00Z
**Status:** passed
**Re-verification:** Yes — stale refresh (not gap-driven)

## Re-verification reason

The prior report (2026-11-23T12:00:00Z, status `human_needed`) went stale because Phase 2 legitimately modified overlapping files: dictionaries grew 81 → 138 keys (intro.story.l01–l49 narrative + toggle/toast keys), index.html head identity changed (canonical/OG URLs → c-fu.github.io/cyberpunk-malaya), main.js gained toast wiring, userPreferences.js gained the hint-pair keys, warmup.js/createWorld.js re-hashed (content-identical). All changes are sanctioned Phase 2 work (attribution "Adri 'C-Fu'" everywhere; intro story is the owner's full-length narrative; Vite base /cyberpunk-malaya/) and none alter Phase 1 semantics. This report re-runs the same must-haves against HEAD 57c7060 and refreshes the digest.

## Goal Achievement

### Observable Truths

Roadmap success criteria merged with plan-level must-haves (deduplicated; roadmap wording kept as the contract).

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | SC-1: Every UI surface (header, settings, about, intro, walk hints, HUD, walk prompt, performance notice, loader, loader statuses) renders in BM with zero leftover English (LOC-01) | ✓ VERIFIED | Static layer re-verified: residual-English sweep `grep -rnE '"[A-Z][a-z]+ [a-z ]+"'` over src/ui + the 4 call-site files returns ZERO hits at HEAD. t() wiring intact through Phase 2 edits (toast/toggle factories also consume the same store). **Runtime half closed:** Phase 1 UAT (01-UAT.md, 6/6 passed) and Phase 2 live session (02-UAT.md items 1/5/6) observed BM boot, BM chrome, BM intro story — no mixed strings |
| 2 | SC-2: documentElement.lang is "ms" and document.title is BM at runtime (LOC-03) | ✓ VERIFIED | Code wired: i18n.js writes `documentElement.lang = language === "bm" ? "ms" : "en"` (D-06) and setLanguage calls applyStaticHead; staticHead.js sets `document.title = t("meta.title")`; main.js init() calls applyStaticHead() (line 66, after syncLayoutClass). **Behavior observed live** in the Phase 2 UAT session: BM boot title "Cyberpunk Malaya \| Game hujan siberpunk oleh Adri 'C-Fu'" with BM chrome; EN flip via setLanguage exercised the same applyStaticHead path |
| 3 | SC-3: Static index.html head is BM in the raw HTML source before any JS runs (LOC-04) | ✓ VERIFIED | Node gates re-run over raw index.html at HEAD: lang="ms"=1, lang="en"=0, og:locale ms_MY=1, content="en_US"=0, "Raining scene"=0; title = "Cyberpunk Malaya \| Game hujan siberpunk oleh Adri 'C-Fu'"; noscript BM ("memerlukan JavaScript"); attribution Adri 'C-Fu' (sanctioned), zero anderson/sunag in src/dictionaries/staticHead. Phase 2 reload session (02-UAT.md item 2) confirmed BM boot from the static baseline |
| 4 | SC-4: OG/Twitter card meta tags carry BM content (LOC-05) | ✓ VERIFIED | Raw source at HEAD: og:title/og:description/og:image:alt + twitter equivalents carry BM strings with og:locale ms_MY. Runtime swap machinery wired (staticHead.js SELECTOR_MAP + og:locale conditional); the round-trip toggling that runs it was behaviorally verified live in the Phase 2 session (EN head flip → BM restore, no residue) |
| 5 | SC-5: Every migrated string exists in both BM and EN dictionaries — full parity (LANG-03) | ✓ VERIFIED | `npm run check:i18n` exits 0: "bm.js and en.js both carry 138 keys" (81 Phase 1 keys + 57 sanctioned Phase 2 story/toggle/toast keys). intro.story.* count matches 49/49 in both dictionaries. Parity script unchanged, Node ESM, zero deps, wired as check:i18n |
| 6 | No framework, no new dependencies, no render-loop changes | ✓ VERIFIED | Phase 1 diff (8e8580c..HEAD) contains no createRenderLoop.js, src/post/, or src/tsl/ path (re-confirmed via fingerprint gate). Phase 2's sanctioned additions (toast/toggle UI, dictionary growth) touch no render-pipeline file either; package.json check:i18n script intact; clearAllStoredPreferences reset semantics untouched |
| 7 | Store contract: t/setLanguage/getLanguage/subscribe replicate the audioState pub/sub shape with immediate sync on subscribe; missing keys warn in dev / fall back to EN in prod (D-02/D-08) | ✓ VERIFIED | src/i18n/i18n.js source re-inspected at HEAD: Set listeners, notify `{ language }`, setLanguage no-op guard + applyStaticHead + notify, subscribe immediate-sync returning unsubscribe closure, t() EN fallback with dev warn, dormant EN restore path at module init (behaviorally exercised in Phase 2 UAT item 2 — full EN boot from the dormant path), `{var}` interpolation |

**Score:** 7/7 truths verified (0 present, behavior-unverified — all runtime halves closed by live UAT sessions)

### Deferred Items

None. No gap matched a later phase.

### Advisory (New Scope, Unevidenced)

| # | Finding | Category | Why Advisory |
| --- | --- | --- | --- |
| 1 | Toast X-persist click was not exercised at runtime in the Phase 2 session (toast auto-dismissed first) — X-persist + hover-pause verified in Phase 2 code gates only | other | Phase 2 scope (02-UAT item 4 recorded the caveat), not a Phase 1 must-have; new-scope with no deterministic evidence at Phase 1 level |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/i18n/i18n.js` | t/setLanguage/getLanguage/subscribe store, audioState-shaped | ✓ VERIFIED | All four exports present; guard, immediate-sync subscribe; unchanged by Phase 2 (store grew consumers, not shape) |
| `src/i18n/dictionaries/bm.js` | Flat BM dictionary, alphabetical (D-07/D-10) | ✓ VERIFIED | 138 keys, parity green. The Phase 1-era ℹ️ ordering note (22 lines out of strict codepoint order) persists unchanged — cosmetic D-10 convention miss, zero functional impact |
| `src/i18n/dictionaries/en.js` | EN counterpart, identical key set | ✓ VERIFIED | 138 keys, parity green, no empty values |
| `src/i18n/staticHead.js` | SELECTOR_MAP + applyStaticHead | ✓ VERIFIED | 8-entry SELECTOR_MAP, title write, og:locale conditional, lang write, miss-skip dev warn |
| `scripts/check-i18n-parity.mjs` | Node ESM parity checker | ✓ VERIFIED | Green at 138/138 keys via npm run check:i18n |
| Migrated factories (10 files + loader) | All UI factories migrated to t() | ✓ VERIFIED | All import t/subscribe, grep gates green, subscription wiring intact through Phase 2 edits |
| `index.html` | BM static baseline | ✓ VERIFIED | All static gates pass (truth 3); head URLs now c-fu.github.io/cyberpunk-malaya (sanctioned Phase 2 change) |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| src/ui/* factories | src/i18n/i18n.js | import { t, subscribe }; sync callbacks; unsubscribe in destroy() | ✓ WIRED | Re-checked at HEAD: subscription wiring unchanged; Phase 2 added toggle/toast factories consuming the same store (confirms the contract) |
| src/i18n/i18n.js | dictionaries bm.js/en.js | DICTIONARIES = { bm, en }; flat key lookup | ✓ WIRED | Imports intact; 138-key lookup green |
| src/i18n/i18n.js | src/i18n/staticHead.js | applyStaticHead inside setLanguage + dormant EN path | ✓ WIRED | Lines 7/26/74 — exercised live by the Phase 2 round-trip |
| src/i18n/i18n.js | src/platform/userPreferences.js | getStoredLanguage + isDevEnvironment | ✓ WIRED | Imports intact; userPreferences.js now also carries the sanctioned hint-pair keys — LANGUAGE_KEY semantics untouched |
| src/main.js | src/i18n/staticHead.js | applyStaticHead() in init() | ✓ WIRED | Lines 48/66; toast wiring added by Phase 2 does not disturb the boot order |
| src/main.js / warmup.js / createWorld.js | src/i18n/i18n.js | t() at all 8 status call sites | ✓ WIRED | setStatus(t("loader.*")) call sites intact (warmup/createWorld content-identical, re-hashed) |
| src/app/createLoaderOverlay.js | src/i18n/i18n.js | syncAriaLabel interpolation + fail() | ✓ WIRED | Call sites 152/184/189/219/220 unchanged |
| Composite factories (settings/about/header/controls) | src/i18n/i18n.js | t() templates, data-i18n walker, window.confirm(t()) | ✓ WIRED | Unchanged from initial verification |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| i18n.js t() | DICTIONARIES[currentLanguage][key] | bm.js / en.js module literals (138 keys) | Yes | ✓ FLOWING |
| staticHead.js | t("meta.*") via SELECTOR_MAP | bm.js meta.* keys | Yes | ✓ FLOWING |
| index.html head | static BM literals | hand-authored, mirror bm.js meta.* | Yes — wording match re-confirmed at HEAD (Adri 'C-Fu' title, BM description) | ✓ FLOWING |
| Bundle output | dist/assets/index-*.js | Vite build (18.76s, green) | Yes — BM strings present in compiled bundle; EN literals are dictionary values (supported language), not hardcoded sites | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Parity gate | `npm run check:i18n` | exit 0, "bm.js and en.js both carry 138 keys" | ✓ PASS |
| Production build | `npm run build` | ✓ built in 18.76s (chunk-size warning pre-existing, unrelated) | ✓ PASS |
| Static index.html gates | Node script | lang="ms"=1, lang="en"=0, ms_MY=1, en_US=0, Raining scene=0, BM title, BM noscript | ✓ PASS |
| Residual-English sweep | `grep -rnE '"[A-Z][a-z]+ [a-z ]+"' src/ui src/app/createLoaderOverlay.js src/main.js src/runtime/warmup.js src/world/createWorld.js` | zero hits (exit 1) | ✓ PASS |
| Debt-marker sweep | `grep -rnE 'TBD\|FIXME\|XXX'` over phase files | zero hits (exit 1) | ✓ PASS |
| Dictionary growth sanity | grep intro.story.* count | bm.js=49, en.js=49 story keys (sanctioned Phase 2 addition) | ✓ PASS |
| Runtime BM boot + toggle round-trip | (human, already executed) Phase 2 UAT session 02-UAT.md items 1/2/5/6 — BM boot, EN↔BM flip, persistence, fresh-visit BM | all [pass] | ✓ PASS (recorded) |
| i18n store runtime semantics via direct Node import | `node -e "import('./src/i18n/i18n.js')"` | ? SKIP — `import.meta.env.DEV` (Vite-only) throws in plain Node; not a code defect. Bundle-level + live-session evidence substitutes | ? SKIP |

Step 7b note: no test framework exists in this repo (deliberate, D-01) — the validation suite is build + parity + grep gates, all re-run above; runtime behavior is covered by the two recorded UAT sessions.

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes exist and no PLAN declares one — not applicable (validation strategy is build + static scripts + manual matrix per 01-VALIDATION.md).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| LOC-01 | 01-01, 01-02, 01-03, 01-04 | All user-facing text renders in BM across every UI surface | ✓ SATISFIED | Static sweep zero residual English; rendering verified live in Phase 1 UAT (6/6) + Phase 2 session |
| LOC-03 | 01-01, 01-04 | documentElement.lang + document.title swap at runtime with active language | ✓ SATISFIED | Code wired + runtime values observed live (Phase 2 UAT item 1: BM title, BM chrome; EN flip exercised same path) |
| LOC-04 | 01-04 | Static index.html head is BM baseline, EN only via stored-preference JS swap | ✓ SATISFIED | Static gates green; dormant EN restore path behaviorally exercised (Phase 2 UAT item 2: full EN boot on reload) |
| LOC-05 | 01-01, 01-04 | OG/Twitter card metas localize with active language | ✓ SATISFIED | BM metas in raw source (ms_MY); runtime swap runs inside the verified setLanguage path |
| LANG-03 | 01-01 | Every string in both BM and EN dictionaries — full parity | ✓ SATISFIED | Parity gate green at 138/138 keys |

Orphan check: REQUIREMENTS.md maps exactly LOC-01, LOC-03, LOC-04, LOC-05, LANG-03 to Phase 1 — all five claimed by plans. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| src/i18n/dictionaries/bm.js | (ordering) | Pre-existing ℹ️ note: some key lines out of strict codepoint alphabetical order (D-10 convention miss); carried through Phase 2's dictionary growth | ℹ️ Info | Cosmetic; parity/lookup unaffected. Not re-flagged as new scope — predates the stale refresh and is owner-reviewed convention style |
| (none) | - | No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers in any phase-modified file at HEAD; no stub returns | - | Clean |

Debt-marker gate: PASS (zero markers). No BLOCKER or WARNING anti-patterns.

### Human Verification Required

None outstanding. All six items from the initial report are closed:

1. Full UI surface walk in BM — Phase 1 UAT (01-UAT.md, 6/6 passed) + Phase 2 live session (BM boot/chrome/story, no mixed strings).
2. Runtime document assertions (lang="ms", BM title) — observed in the Phase 2 session (02-UAT item 1).
3. OG/Twitter meta localization — applyStaticHead path exercised by the verified live round-trip.
4. Raw HTML source BM before JS — static gates re-run green + BM boot from static baseline observed on reload.
5. BM no-clipping at 360px/1920px — covered by the Phase 1 UAT pass and Phase 2 snapshots.
6. AGENTS.md regression checklist — Phase 2 session ran a full live boot/intro/walk cycle with no rain/pipeline regressions; neither phase's diff touches render-pipeline files.

### Gaps Summary

No gaps. All five roadmap success criteria remain satisfied at HEAD 57c7060: factories migrated with zero residual English, static head BM in raw source, OG/Twitter tags BM with ms_MY, dictionary parity 138/138 and gate-enforced, no-framework/no-render-loop constraints intact. The runtime-DOM items that previously held the status at `human_needed` are now closed by two recorded live UAT sessions (Phase 1: 6/6; Phase 2: 6/6), upgrading truths 2/4 to fully VERIFIED. Sanctioned Phase 2 changes (Adri 'C-Fu' attribution, c-fu.github.io URLs, 138-key dictionaries with the owner's full-length story keys, toast/toggle wiring, Vite base) were re-verified as non-regressive against Phase 1 semantics.

---

_Verified: 2026-11-23T16:30:00Z_
_Verifier: the agent (gsd-verifier)_
