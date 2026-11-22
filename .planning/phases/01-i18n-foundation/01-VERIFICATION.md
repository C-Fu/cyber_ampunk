---
phase: 01-i18n-foundation
verified: 2026-11-23T12:00:00Z
status: human_needed
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
covered_digest: "v4:sha256:f44e7def56f1c953213423c9bfef4eb9974fd88ef5795a2f4e420793c7aadd04"
behavior_unverified: 1 # runtime DOM behavior (lang/title swap, meta swap, BM rendering) — no DOM harness exists by design (D-01)
overrides_applied: 0
behavior_unverified_items:
  - truth: "Roadmap SC-2/SC-3: documentElement.lang is 'ms', document.title is BM, and the head swap writes BM metas at runtime (LOC-03/LOC-05 runtime path)"
    test: "Boot the dev server (HTTPS, WebGPU); in DevTools console run document.documentElement.lang and document.title; in the Elements panel inspect og:title/og:description/og:image:alt/og:locale"
    expected: "documentElement.lang === 'ms'; document.title is the BM title; og/twitter meta content is BM with og:locale 'ms_MY'"
    why_human: "Runtime DOM values require a live WebGPU browser session — the repo deliberately has no DOM test harness (D-01, zero new dependencies); static source checks prove the swap code is present and wired but not that it executes against a real DOM"
human_verification:
  - test: "Full UI surface walk in BM (SC-1 / LOC-01)"
    expected: "Loader statuses (MENYALAKAN BABAK, MEMUTAR PENJANA, MENYAMBUNG WEBGPU, MENYAMBUNG POST FX...), intro (melepasi kaca, MASUK, BM tagline), header (TENTANG/SUMBER), settings (Tetapan/Penampilan/Mod pembangunan/Set semula konfigurasi + BM confirm dialog), about (BM lead paragraphs, KOD SUMBER, SEDIAAN DISYORKAN), walk controls hint (BM SVG callouts, ESC UNTUK TUTUP), HUD (VITAL/TENAGA/ISYARAT), move hint (Pergerakan/Gunakan WASD untuk berjalan), walk prompt (Mod berjalan), audio button aria (Togol bunyi) — all BM, zero visible English beyond the keep-list (brands, key caps WASD/Shift/C/Esc)"
    why_human: "Rendering requires a live WebGPU browser session; grep proves the strings are wired into every factory, not that they display"
  - test: "Runtime head/document assertions (SC-2 / LOC-03)"
    expected: "DevTools console: document.documentElement.lang === 'ms'; document.title is 'Cyberpunk Malaya | Game hujan siberpunk oleh Adri 'C-Fu''"
    why_human: "Runtime JS values, not statically checkable"
  - test: "OG/Twitter meta localization (SC-4 / LOC-05)"
    expected: "Elements panel: og:title/og:description/og:image:alt and twitter equivalents carry BM content; og:locale is ms_MY"
    why_human: "Runtime JS meta swap requires the Elements panel in a live session"
  - test: "Raw HTML source is BM before JS (SC-3 / LOC-04)"
    expected: "View source (Ctrl+U) with JS disabled: BM title, BM meta description, BM og/twitter content, og:locale ms_MY, BM noscript line"
    why_human: "Static source gates passed programmatically (lang='ms'=1, lang='en'=0, ms_MY=1, en_US=0, 'Raining scene'=0, BM title regex OK) — this check only needs confirming once in a browser to close the loop; cheap to fold into the same session"
  - test: "BM text no-clipping at 360px and 1920px (E-5 / LOC-01 layout)"
    expected: "Loader status single line, HUD chips, look buttons, walk prompt — no clipping, no wrap in single-line lockups, no horizontal overflow"
    why_human: "Visual layout at viewport extremes; CSS sweep was a documented zero-diff pass, so visual confirmation is the only clipping evidence"
  - test: "AGENTS.md regression checklist (rain collision, height map, mobile profile)"
    expected: "Rain still collides (no drops through roofs); no rain/sky in the height map; mobile profile unchanged"
    why_human: "Visual/runtime WebGPU behavior; mitigation is structural — the phase diff touches no render-pipeline file (verified: git diff 8e8580c..HEAD contains no createRenderLoop.js, src/post/, or src/tsl/ paths) — but the AGENTS.md checklist itself demands browser confirmation"
---

# Phase 1: i18n Foundation Verification Report

**Phase Goal:** Every user-facing surface renders in Bahasa Melayu by default, backed by a hand-rolled bilingual dictionary store — no framework, no render-loop changes
**Verified:** 2026-11-23T12:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Roadmap success criteria merged with plan-level must-haves (deduplicated; roadmap wording kept as the contract).

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | SC-1: Every UI surface (header, settings, about, intro, walk hints, HUD, walk prompt, performance notice, loader, loader statuses) renders in BM with zero leftover English (LOC-01) | ✓ VERIFIED (static layer; rendering routed to human) | All factory grep gates green: walkPrompt literals 0/0/0/0; loader literals 0 in main.js/warmup.js/createWorld.js/createLoaderOverlay.js; dead fail() arg 0; intro (through the glass / A rain-soaked alley / >ENTER< / Adjusting performance) 0, zero subscribe in intro; HUD VITALS/ENERGY/SIGNAL 0; moveHint/audio literals 0; header ABOUT/SOURCE/About-aria 0; controls Interface/Esc to close/Navigation 0; settings Look/Development mode/Reset configs/option.label 0, t("look.")=2, resetConfirm=1; about data-i18n=12, Recommended setup/Source code 0, innerHTML = t( = 0 (D-04 XSS gate). Residual-English sweep `grep -rnE '"[A-Z][a-z]+ [a-z ]+"'` over src/ui + the 4 call-site files returns ZERO hits. t() call sites confirmed in all 8 surface groups (grep of `t("...")` across factories) |
| 2 | SC-2: documentElement.lang is "ms" and document.title is BM at runtime (LOC-03) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code present and wired: i18n.js setLanguage writes `documentElement.lang = language === "bm" ? "ms" : "en"` (D-06) and calls applyStaticHead(); staticHead.js sets `document.title = t("meta.title")`; main.js init() calls applyStaticHead() right after syncLayoutClass() (line 62). No DOM harness exists (D-01) — runtime value not exercisable without a browser → human item 2 |
| 3 | SC-3: Static index.html head is BM in the raw HTML source before any JS runs (LOC-04) | ✓ VERIFIED | Node script over raw index.html: lang="ms"=1, lang="en"=0, og:locale ms_MY=1, content="en_US"=0, "Raining scene"=0; <title> = "Cyberpunk Malaya \| Game hujan siberpunk oleh Adri 'C-Fu'"; noscript is BM ("permainan ini memerlukan JavaScript dan WebGPU"); JSON-LD carries single Adri 'C-Fu' author; zero anderson/sunag (case-insensitive) in index.html. All 10 staticHead SELECTOR_MAP targets verified resolvable by the 01-04 executor and spot-checked by this verifier (meta name/property selectors present in source) |
| 4 | SC-4: OG/Twitter card meta tags carry BM content (LOC-05) | ✓ VERIFIED (static) / ⚠️ runtime half in truth 2 | Raw source: og:title/og:description/og:image:alt and twitter:title/description/image:alt all carry BM strings; runtime swap machinery wired (staticHead.js SELECTOR_MAP, 8 entries + og:locale conditional). Static half VERIFIED by source inspection; runtime swap covered by human item 3 |
| 5 | SC-5: Every migrated string exists in both BM and EN dictionaries — full parity (LANG-03) | ✓ VERIFIED | `npm run check:i18n` exits 0: "bm.js and en.js both carry 81 keys". Independent Node re-check: bm=81, en=81, bm-only=[], en-only=[], no empty values. Parity script is Node ESM, zero deps, wired as check:i18n npm script (package.json) |
| 6 | No framework, no new dependencies, no render-loop changes | ✓ VERIFIED | Diff 8e8580c..HEAD + working tree contains NO createRenderLoop.js, src/post/, or src/tsl/ path (regression gate count 0). package.json diff contains only the check:i18n scripts line; tech-stack added: [] in all 4 summaries. clearAllStoredPreferences body does not reference LANGUAGE_KEY (reset semantics untouched) |
| 7 | Store contract: t/setLanguage/getLanguage/subscribe replicate the audioState pub/sub shape with immediate sync on subscribe; missing keys warn in dev / fall back to EN in prod (D-02/D-08) | ✓ VERIFIED | src/i18n/i18n.js source: `const listeners = new Set()`, notify() passes `{ language: currentLanguage }`, setLanguage has the no-op guard (unknown or unchanged) then applyStaticHead + notify, subscribe() calls the listener immediately and returns `() => listeners.delete(listener)`. t() does `DICTIONARIES[currentLanguage][key] ?? en[key]` (EN fallback) with dev console.warn + key return. Dormant EN restore path at module init: `if (getStoredLanguage() === "en")` swaps head-only before any listener exists (D-05). interpolation `{var}` replace present. Behavior exercised via the built bundle (see Behavioral Spot-Checks) — the direct Node spot-check was blocked by `import.meta.env.DEV` (Vite-only), not by a code defect |

**Score:** 7/7 truths verified (1 present, behavior-unverified: the runtime-DOM half of truths 2/4, tracked once as behavior_unverified)

### Deferred Items

None. No gap matched a later phase; Phase 2 covers the toggle/restore exercise (which is deliberately out of Phase 1 scope per D-05) but no Phase 1 requirement is unmet by design.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/i18n/i18n.js` | t/setLanguage/getLanguage/subscribe store, audioState-shaped | ✓ VERIFIED | All four exports present; Set listeners, notify, guard, immediate-sync subscribe; ~83 substantive lines |
| `src/i18n/dictionaries/bm.js` | Flat BM dictionary, alphabetical (D-07/D-10) | ✓ VERIFIED | 81 keys, all string values, parity green. NOTE (ℹ️ info, non-blocking): strict codepoint sort shows 22 key lines out of alphabetical order (hud.* ↔ header.* blocks, loader.linkingWebgpu/linkFailed swap, walkControls.chip*/closeAria/contentAria/diagramAria before callout*). This is a plan-style convention (D-10 "diff-stable, owner-reviewable") miss, not a functional defect — parity and lookup are unaffected |
| `src/i18n/dictionaries/en.js` | EN counterpart, identical key set | ✓ VERIFIED | 81 keys, parity green, no empty values |
| `src/i18n/staticHead.js` | SELECTOR_MAP + applyStaticHead | ✓ VERIFIED | 8-entry SELECTOR_MAP, document.title write, og:locale conditional (ms_MY/en_US), documentElement.lang, miss-skip with dev warn, no module-eval side effects |
| `scripts/check-i18n-parity.mjs` | Node ESM parity checker | ✓ VERIFIED | Runs green via npm run check:i18n; ~20 lines, zero deps |
| Migrated factories (10 files) | All UI factories migrated to t() | ✓ VERIFIED | createWalkPrompt, createLoaderOverlay, createIntroOverlay, createPerformanceNotice, createHudPanel, createMoveHint, createAudioButton, createSettingsPanel, createAboutPanel, createHeader, createWalkControlsHint — all import t/subscribe, all grep gates green, subscription wiring present (subscribe( ≥1, unsubscribeLanguage ≥2 in destroy()-bearing factories; header page-lifetime documented) |
| `index.html` | BM static baseline | ✓ VERIFIED | All static gates pass (truth 3) |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| src/ui/walk/createWalkPrompt.js | src/i18n/i18n.js | import { t, subscribe }; syncCopy via subscribe; unsubscribeLanguage released in destroy() | ✓ WIRED | Line 3 import; line 112 subscribe(syncCopy); line 124 first line of destroy() |
| src/i18n/i18n.js | dictionaries bm.js/en.js | DICTIONARIES = { bm, en }; flat key lookup | ✓ WIRED | Lines 1-2 imports, line 14; t() single-property access |
| src/i18n/i18n.js | src/i18n/staticHead.js | applyStaticHead called inside setLanguage (runtime) | ✓ WIRED | Line 7 import; line 74 call inside setLanguage; also line 27 in dormant EN path |
| src/i18n/i18n.js | src/platform/userPreferences.js | getStoredLanguage + isDevEnvironment | ✓ WIRED | Lines 3-6 import; line 24 getStoredLanguage; line 53 isDevEnvironment |
| src/main.js | src/i18n/staticHead.js | applyStaticHead() in init() next to syncLayoutClass() | ✓ WIRED | Line 44 import; line 62 call, directly after syncLayoutClass() (line 61), before loader statuses |
| src/main.js / warmup.js / createWorld.js | src/i18n/i18n.js | t() at all 8 status call sites | ✓ WIRED | main.js 65/72/77/114; warmup.js 88/98; createWorld.js 66/99 — all `setStatus(t("loader.*"))` |
| src/app/createLoaderOverlay.js | src/i18n/i18n.js | syncAriaLabel interpolation + fail() | ✓ WIRED | Lines 152/184/189/219/220 — ariaLoadingInitial, ariaLoading {percent,status}, ariaPercent, linkFailed, failedToLoad |
| Composite factories (settings/about/header/controls) | src/i18n/i18n.js | t() templates, data-i18n walker, t("look."+id), window.confirm(t()) | ✓ WIRED | settings: t("look.") x2 + resetConfirm; about: data-i18n=12 + walker; header: subscribe(syncText) page-lifetime; walkControls: data-i18n=8 on SVG text nodes |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| i18n.js t() | DICTIONARIES[currentLanguage][key] | bm.js / en.js module literals | Yes — dictionary values flow to every factory's DOM sinks | ✓ FLOWING |
| staticHead.js | t("meta.*") via SELECTOR_MAP | bm.js meta.* keys | Yes — mirrored by the static index.html baseline (single source of truth) | ✓ FLOWING |
| index.html head | static BM literals | hand-authored, mirror bm.js meta.* | Yes — verified wording match ("Game hujan siberpunk oleh Adri 'C-Fu'" in both) | ✓ FLOWING |
| Bundle output | dist/assets/index-*.js | Vite build | Yes — BM strings found in the compiled bundle (Mod berjalan, MASUK, MENYALAKAN BABAK, SAMBUKAN GAGAL, Set semula konfigurasi, Kod sumber, Esc untuk tutup, Cyberpunk Malaya title, Vital, EN fallback values, Adri 'C-Fu'); the stale EN literals found in the bundle are the en.js dictionary VALUES (correct — EN is a supported language), not leftover hardcoded sites | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Parity gate | `npm run check:i18n` | exit 0, "bm.js and en.js both carry 81 keys" | ✓ PASS |
| Production build | `npm run build` | ✓ built in 5.11s (chunk-size warning pre-existing, unrelated) | ✓ PASS |
| Dictionary sanity (keys, empties, meta.description ≤160) | Node script over bm.js/en.js | 81/81 keys, no empty values, meta.description=144 chars | ✓ PASS |
| BM content reaches the built bundle | Node string search over dist/assets/index-*.js | 11/11 BM/EN needles FOUND; all stale literals located inside the en dictionary object (expected) | ✓ PASS |
| i18n store runtime semantics (t/subscribe/setLanguage) | Direct Node import of i18n.js | ? SKIP — `import.meta.env.DEV` (Vite-only) throws in plain Node; not a code defect. Bundle-level evidence + source review substitute; full behavior rides the human browser matrix | ? SKIP |
| Static index.html gates | Node script | lang="ms"=1, lang="en"=0, ms_MY=1, en_US=0, Raining scene=0, BM title, BM noscript, C-Fu=13, anderson/sunag=0 | ✓ PASS |
| Residual-English sweep | `grep -rnE '"[A-Z][a-z]+ [a-z ]+"' src/ui src/app/createLoaderOverlay.js src/main.js src/runtime/warmup.js src/world/createWorld.js` | zero hits (exit 1) | ✓ PASS |
| Attribution sweep | `grep -rinE 'anderson\|sunag\|mancini\|sea3dformat' src index.html` | zero hits | ✓ PASS |
| Forbidden-file regression | `git diff --name-only 8e8580c..HEAD` + worktree | no createRenderLoop.js / src/post/ / src/tsl/ path; only the 21 expected implementation files + planning docs | ✓ PASS |
| Phase baseline ancestry | `git merge-base --is-ancestor 8e8580c HEAD` | exit 0 | ✓ PASS |

Step 7b note: no test framework exists in this repo (deliberate, D-01) — the full test suite is build + parity + grep gates, all run above.

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes exist and no PLAN declares one — not applicable (validation strategy is build + static scripts + manual matrix per 01-VALIDATION.md).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| LOC-01 | 01-01, 01-02, 01-03, 01-04 | All user-facing text renders in BM across every UI surface | ✓ SATISFIED (static) + human rendering check | All factory migrations verified (grep gates, t() call sites, subscription wiring); residual-English sweep zero; virtual joystick verified string-site-free in 01-02 plan (no-op, empty diff against baseline). Visual rendering → human item 1 |
| LOC-03 | 01-01, 01-04 | documentElement.lang + document.title swap at runtime with active language | ✓ SATISFIED (code) / ? runtime human | setLanguage + applyStaticHead wiring verified; runtime value → human item 2 |
| LOC-04 | 01-04 | Static index.html head is BM baseline, EN only via stored-preference JS swap | ✓ SATISFIED | All static gates pass (truth 3); dormant EN path code-verified (i18n.js module init) |
| LOC-05 | 01-01, 01-04 | OG/Twitter card metas localize with active language | ✓ SATISFIED (static) + human runtime check | Static BM content in raw HTML verified; runtime swap wired; og:locale conditional verified → human item 3 |
| LANG-03 | 01-01 | Every string in both BM and EN dictionaries — full parity | ✓ SATISFIED | Parity script green, 81/81 keys, independently re-verified |

Orphan check: REQUIREMENTS.md maps exactly LOC-01, LOC-03, LOC-04, LOC-05, LANG-03 to Phase 1 — all five claimed by plans. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| src/i18n/dictionaries/bm.js | (ordering) | 22 key lines out of strict alphabetical order (hud./header. block swap, loader.linkFailed/linkingWebgpu swap, walkControls.chip*/callout* interleaving) | ℹ️ Info | Cosmetic D-10 convention miss (diff-stability/reviewability); zero functional impact — lookup is a flat map and the parity gate is order-agnostic. Same interleaving exists in en.js. Optionally tidy in Phase 2 when the dictionaries are next touched |
| (none) | - | No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers in any phase-modified file; no stub returns; no console.log-only implementations | - | Clean |

Debt-marker gate: PASS (zero markers). No BLOCKER or WARNING anti-patterns.

### Human Verification Required

Six items (from 01-VALIDATION.md's manual-only matrix — the designed end-of-phase human checkpoint):

### 1. Full UI surface walk in BM (SC-1 / LOC-01)

**Test:** `npm run dev` (HTTPS, WebGPU) → walk loader → intro → ENTER → header/settings/about/walk-controls/HUD/move-hint/walk-prompt
**Expected:** Every surface in BM (MENYALAKAN BABAK..., melepasi kaca, MASUK, TENTANG/SUMBER, Tetapan/Penampilan/Mod pembangunan/Set semula konfigurasi + BM confirm dialog, BM about paragraphs + KOD SUMBER/SEDIAAN DISYORKAN, BM SVG callouts + ESC UNTUK TUTUP, VITAL/TENAGA/ISYARAT, Mod berjalan) — zero English beyond the keep-list (brands, WASD/Shift/C/Esc key caps)
**Why human:** Rendering requires a live WebGPU browser; grep proves wiring, not display

### 2. Runtime document assertions (SC-2 / LOC-03)

**Test:** DevTools console: `document.documentElement.lang`, `document.title`
**Expected:** `"ms"` and the BM title
**Why human:** Runtime JS values not statically checkable

### 3. OG/Twitter meta localization (SC-4 / LOC-05)

**Test:** Elements panel: inspect og:title/og:description/og:image:alt, twitter equivalents, og:locale
**Expected:** BM content, og:locale ms_MY
**Why human:** Runtime JS meta swap visible only in a live session

### 4. Raw HTML source BM before JS (SC-3 / LOC-04)

**Test:** View source (Ctrl+U) with JS disabled
**Expected:** BM title/description/og/twitter/noscript, lang="ms", og:locale ms_MY
**Why human:** Static gates already passed programmatically — cheap visual confirmation to fold into the same browser session

### 5. BM text no-clipping at 360px and 1920px (E-5)

**Test:** Set viewport to 360px and 1920px; watch loader status, HUD chips, look buttons, walk prompt
**Expected:** No clipping, no wrap in single-line lockups, no horizontal overflow
**Why human:** Visual layout; the CSS sweep was a documented zero-diff pass so visual confirmation is the only clipping evidence

### 6. AGENTS.md regression checklist

**Test:** Rain collision (drops not through roofs), height-map purity (no rain/sky), mobile profile
**Expected:** All regressions clean
**Why human:** Visual/runtime WebGPU behavior. Structural mitigation already verified: the phase diff touches zero render-pipeline files

### Gaps Summary

No gaps. All five roadmap success criteria are satisfied at the code level: every factory migrated with zero residual English (grep-proven), the static head is BM in raw source, OG/Twitter tags carry BM statically, dictionary parity is 81/81 and gate-enforced, and the no-framework/no-render-loop constraints hold. Attribution is owner-reviewed (Adri 'C-Fu' — upstream docs README/AGENTS/STRIP/LICENSE untouched by design, not a gap).

Status is `human_needed` (not `passed`) solely because the runtime-DOM half of SC-2 (documentElement.lang/title at runtime) cannot be exercised without a browser — the repo deliberately has no DOM test harness (D-01, zero new dependencies) and 01-VALIDATION.md routes those items to this manual matrix. Automated checks are otherwise all green: build, parity, residual sweep, attribution sweep, forbidden-file regression, subscription lifecycle wiring.

---

_Verified: 2026-11-23T12:00:00Z_
_Verifier: the agent (gsd-verifier)_
