# Phase 2: Language Toggle & KL Intro Story - Research

**Researched:** 2026-11-23
**Domain:** Frontend i18n activation (DOM chrome re-render), localStorage persistence, intro overlay GSAP interaction, bilingual copy drafting
**Confidence:** HIGH (every claim below was verified against source read this session unless tagged otherwise)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (verbatim)

### Implementation Decisions

#### Locked by milestone + Phase 1 (carried forward)
- **D-01:** Plain "BM | EN" text toggle — no flags, no dropdown (research anti-pattern; USWDS two-language guidance)
- **D-02:** Instant switch via the Phase 1 pub/sub store — every factory's `syncText()` fires on `setLanguage`; NO appShell teardown, NO reload
- **D-03:** Persistence via the dormant `getStoredLanguage`/`setStoredLanguage` (built in Phase 1 wave 1; restore path already in `i18n.js` module init)
- **D-04:** BM→EN→BM round-trip must leave zero mixed-language strings, including `document.title`, `<html lang>`, and all head metas via `staticHead.js` (already swap-wired)
- **D-05:** Intro overlay: the letter-split region (THREEJS-PUNK brand lines) is NEVER re-synced; the tagline/kicker/ENTER re-render safely. If the story text sits in a letter-split span, the toggle re-renders it as plain text (acceptable per research) — flag the exact approach in the plan
- **D-06:** `intro.*` keys are the single source of truth — the EN and BM story live only in the dictionaries; Phase 3 TTS reads the same keys
- **D-07:** AI drafts the story (D-10 milestone decision); owner reviews at a checkpoint like Phase 1

#### Toggle UX (agent's discretion — auto-decided from research defaults, user review pending)
- **D-08:** Toggle lives in the header button row on desktop (a "BM | EN" pill styled like the existing chrome buttons) AND as a language row inside the Tetapan panel (covers mobile where the header collapses below 640px). Both control the same store.
- **D-09:** First visit always starts BM. When `navigator.languages` contains neither `ms` nor `id`, a dismissible toast hint appears after ENTER ("Prefer English?" / BM equivalent) with a one-tap switch action; dismissed state persists to localStorage.
- **D-10:** Intro story: medium arc, 5-7 sentences — the KL runner, one delivery, a moment of tension in the rain, arrival. KL flavor: neon-soaked Kuala Lumpur imagery, Malaysian street texture (mamak, monsoon, motorbike courier), corporations in the background. English version is a faithful counterpart, not a literal translation.

### the agent's Discretion
None declared beyond D-08/D-09/D-10 (auto-decided from research defaults, user review pending).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Explicitly out of phase: no TTS (Phase 3), no bundled audio (Phase 4).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOC-02 | BM ⇄ EN instant, no-reload re-render of all visible UI | Store `setLanguage()` fully built (`src/i18n/i18n.js:67-76`); every chrome factory already subscribes via `syncText()`. Gaps: intro overlay has NO subscription (creation-time `t()` only), and the two new toggle surfaces need their own subscriptions. See "Integration Seams". |
| LANG-01 | Plain "BM | EN" toggle in header/settings | Exact insertion point in `createHeader.js` verified; settings row pattern (`.settings-section` + `.settings-look-grid` rhythm) verified in `createSettingsPanel.js:42-82`. Full markup/CSS contract already locked in 02-UI-SPEC TG-1..TG-9. |
| LANG-02 | Persistence to localStorage + restore | `setStoredLanguage`/`getStoredLanguage` dormant in `userPreferences.js:46-64`; EN-restore boot path live in `i18n.js:24-28`. Gap: `setLanguage()` does NOT persist — the toggle click handler must call `setStoredLanguage` alongside `setLanguage`. |
| LANG-04 | First visit always BM; dismissible hint for non-ms/id browsers | `currentLanguage = "bm"` module default (`i18n.js:18`); restore only fires when stored value is `"en"` — first visit is always BM. Toast analog: `createPerformanceNotice.js` + `performanceNotice.css` (full pattern read). Trigger/dismiss contract in UI-SPEC TO-1..TO-10. |
| INTRO-01 | BM KL-cyberpunk story rewrite | `.intro-tagline` element becomes the story paragraph (UI-SPEC S-2). Story draft below (6 sentences, per-sentence keys, char budgets verified against `introOverlay.css` geometry). |
| INTRO-02 | Faithful EN counterpart as shared `intro.*` keys | Key shape `intro.story.s1`..`s6` per UI-SPEC ST-3; parity enforced by `scripts/check-i18n-parity.mjs`. Draft below. |
</phase_requirements>

## Summary

Phase 2 is an **activation phase, not a foundation phase**. The entire dynamic-switch machinery exists and works: `setLanguage()` (`src/i18n/i18n.js:67-76`) swaps `currentLanguage`, writes `documentElement.lang`, calls `applyStaticHead()` (title + metas + og:locale), and notifies all subscribers synchronously; every Phase 1 factory already carries a `syncText()` subscription; the dormant localStorage persistence pair sits ready in `userPreferences.js`; and the EN-restore boot path already runs at module-eval time, before any listener exists. The new work is four UI surfaces (header pill, settings row, hint toast, story paragraph) plus two small gap-fills (intro overlay `syncText`, persistence-on-toggle) plus the story copy.

The approved **02-UI-SPEC.md** already locks the full markup, CSS, copy, and interaction contracts (TG-*, TO-*, S-*, ST-*, LS-*). This research therefore focuses on what the spec could not know: the exact code seams (verified line-level), the boot-order/restore flow, the GSAP letter-split interaction, the toast mechanics cloned from the performance-notice analog, a ready-to-taskify story draft, and the validation architecture.

**Primary recommendation:** Four tasks — (1) dictionaries: add `intro.story.s1..s6` + kicker rewrite + toggle/toast aria strings to bm.js/en.js (owner-review checkpoint on prose); (2) header toggle pill + settings language row, both wired as standard `syncText()` subscribers calling `setStoredLanguage` + `setLanguage`; (3) intro overlay: add a small `syncText()` covering kicker/story/ENTER only (brand lines + credit excluded per D-05/S-4), retarget `.intro-tagline` to the story paragraph with max-height guard; (4) new `createLanguageHintToast.js` under `src/ui/chrome/` cloned from the performance-notice pattern, created after `revealAppUi()` in the intro flow's `onStart` completion. No render-loop changes, no new dependencies.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Language store + switch | Browser/Client (module singleton) | — | `src/i18n/i18n.js` module-scope pub/sub; no server, static Vercel site |
| Persistence + restore | Browser/Client (localStorage) | — | `userPreferences.js` try/catch localStorage pattern; restore at module init |
| Toggle UI (header + settings) | Browser/Client (DOM) | — | Pure DOM factories per project composition pattern |
| Hint toast | Browser/Client (DOM + localStorage flag) | — | Same pattern; `navigator.languages` sniffing is client-only |
| Intro story text | Browser/Client (DOM, dictionary-sourced) | Static CDN (dictionaries bundled) | Text lives in JS dictionaries — single source of truth for Phase 3 TTS |
| Head/meta localization | Browser/Client (`staticHead.js`) | — | `applyStaticHead()` already swap-wired into `setLanguage()` |

## Project Constraints (from AGENTS.md)

- Import from `three/webgpu` and `three/tsl` — irrelevant here (no shader work), but do not introduce custom GLSL or touch WebGPU surfaces.
- **`src/runtime/createRenderLoop.js` MUST NOT be touched** (CONTEXT integration points).
- Composition pattern: `main.js` builds plain objects (`world`, `pipeline`, `appShell`, …); optional features return `null` — use optional chaining.
- Factory style: match existing factory composition; avoid large unrelated refactors.
- No new full-res passes / no perf-relevant work — this phase is DOM-only, zero render impact.
- `npm run build` must succeed after pipeline changes; no new runtime dependencies (UI-SPEC Registry Safety: zero new deps).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none — existing) | — | All work uses the existing stack: vanilla DOM factories, `gsap ^3.15.0`, the i18n store | Zero-new-dependencies phase per UI-SPEC Registry Safety and roadmap constraint |

No packages are installed this phase → **Package Legitimacy Audit: not applicable (no external packages introduced).** No Wave 0 framework install needed; validation is build + script gates (see Validation Architecture).

## Architecture Patterns

### System Architecture Diagram

```
Boot (module eval)
  i18n.js init ──getStoredLanguage()=="en"?──► currentLanguage="en" + applyStaticHead()  [pre-listener, notify no-op]
       │
       ▼
main.js init(): applyStaticHead() → loader (t()) → world → appShell (header/settings subscribe) → introFlow.run()
       │
       ▼
Intro overlay (creation-time t()); ENTER click ─► playExit() → revealAppUi() → [createLanguageHintToast if trigger]
       │
User taps toggle (header pill / settings row / toast action)
       │
       ▼
setLanguage(next) ─► documentElement.lang ─► applyStaticHead() ─► notify()
                                                                     │
                              ┌──────────────────────────────────────┼──────────────────────┐
                              ▼                                      ▼                      ▼
                 every syncText() subscriber              <html lang>/title/metas     (one frame, sync)
                 header pill · settings row · toast(while shown) · intro overlay · all Phase 1 factories
       │
(toggle click handler ALSO) setStoredLanguage(next) ─► localStorage "threejs-punk-language"
```

### Integration Seams (verified this session, line-level)

#### Seam 1 — Header toggle pill (`src/ui/chrome/createHeader.js`)

Current `.app-header-actions` innerHTML (lines 12-27) contains three buttons: about, source, settings. **Insertion point: first child of `.app-header-actions`, before the about button** (UI-SPEC TG-1: leftmost). Markup per UI-SPEC TG-2:

```html
<button type="button" class="app-header-lang-btn" aria-label="${t("header.langAria")}">
  <span class="lang-toggle-segment" data-lang="bm" aria-hidden="true">BM</span>
  <span class="lang-toggle-segment" data-lang="en" aria-hidden="true">EN</span>
</button>
```

- `BM`/`EN` segment labels are **hardcoded, not dictionary keys** (UI-SPEC T-5); only the `aria-label` re-syncs (keys `header.langAriaBm` / `header.langAriaEn`, drafts in UI-SPEC copy table).
- The header's existing `syncText()` (lines 39-45) and page-lifetime `subscribe(syncText)` (line 50) extend naturally: add aria-label update + active-segment toggle (`classList.toggle("lang-toggle-segment--active", getLanguage() === seg.dataset.lang)`).
- Click handler: `setStoredLanguage(next); setLanguage(next);` where `next = getLanguage() === "bm" ? "en" : "bm"`. Note `setLanguage` early-returns on same-language (i18n.js:68), so calling both unconditionally is safe.
- CSS: new `.app-header-lang-btn` in `header.css` cloned from `.app-header-about-btn` (lines 69-107; height 44px, 40px at ≤640px) — the pill is unaffected by the 640px label-collapse rules that hide `.app-header-about-label`/`.app-header-source-label` (header.css:189-192) because it carries no collapsible label. It inherits the header's `app-header--force-hidden` gating automatically (TG-9).
- Pattern to copy for active state: `.settings-look-btn--active` values (settingsPanel.css:173+) — copy exact values, do not invent (UI-SPEC TG-3).

#### Seam 2 — Settings language row (`src/ui/chrome/createSettingsPanel.js`)

Insert a new `.settings-section` between the look section (line 49-54) and the first divider — or after the dev-mode row; UI-SPEC SR-1 fixes the shape: section title `t("settings.language")` (`Bahasa`/`Language`) + a 2-column grid of two `.settings-look-btn`-shaped segment buttons with `aria-pressed`.

- Critical Phase 1 pattern to preserve: look-button labels render via `t()` **at creation time into innerHTML**, then `syncText()` re-writes them via `textContent` (lines 100-116, comment "dictionary values never reach an innerHTML write"). The language segments are `BM`/`EN` literals — but their `aria-label`s (`Bahasa Melayu`/`English` full names) come from the dictionary and re-sync in `syncText()` via `setAttribute`.
- Two buttons here (unlike the header's single button) because the panel already speaks the two-state button language; `aria-pressed` per button is the accessible contract (UI-SPEC TG-7).
- Click handler identical to Seam 1: `setStoredLanguage(id); setLanguage(id);`. Both surfaces subscribe to the same store; no component-local mirrors (UI-SPEC TG-8).

#### Seam 3 — Intro overlay story + syncText gap (`src/ui/intro/createIntroOverlay.js`)

**Verified gap:** `createIntroOverlay.js` has **no `subscribe()` call today** — kicker/tagline/ENTER resolve `t()` once at creation (lines 26-34). Per UI-SPEC S-4 and D-05, this phase adds a small `syncText()`:

```js
function syncText() {
  kicker.textContent = t("intro.kicker");
  tagline.textContent = storyText();          // intro.story.s1..s6 joined with " "
  button.textContent = t("intro.enter");
}
const unsubscribeLanguage = subscribe(syncText); // page-lifetime pattern (overlay removes itself in playExit)
```

**Letter-split interaction (D-05, flagged approach for the plan):**
- `splitIntoLetters()` (lines 5-18) runs on `.intro-brand-line` spans only, AFTER the template innerHTML is set (lines 49-51). It sets `aria-label` on the line and `aria-hidden` per-letter spans.
- The story paragraph is a **plain `<p>`, never letter-split** — `textContent` writes on it are trivially safe even mid-GSAP-timeline (the enter timeline tweens `opacity`/`y` on the element box, not its text; swapping text under a running tween is safe — worst case the new text pops in within the fading element, acceptable for a post-reveal-only swap path).
- In practice the overlay is gone before the toggle is reachable (header is force-hidden during intro; settings panel is reachable only post-reveal) — the `syncText` subscription is belt-and-braces per UI-SPEC LS-5. The brand `aria-label="THREEJS-PUNK"` (line 27) and the credit (line 36) stay out of `syncText` — fixed brand tokens.
- DOM change: the existing `.intro-tagline` `<p>` **becomes** the story paragraph (S-2 — the tagline one-liner is replaced, not kept). Add the S-1 guard CSS (`max-height: 26.5rem; overflow: hidden;` on `.intro-tagline` or a `.intro-tagline--story` modifier — planner picks one; modifier is lower-blast-radius). The GSAP timeline (lines 57-135) needs **no changes** — it already targets `kicker`, `tagline`, `button` by reference (S-3).
- Join helper: build story text as `["intro.story.s1",…,"intro.story.s6"].map((k) => t(k)).join(" ")`. Phase 3 will replace this with per-sentence spans — keep the helper one-liner so the swap is mechanical.

#### Seam 4 — Language hint toast (new `src/ui/chrome/createLanguageHintToast.js`)

Analog verified: `src/ui/intro/createPerformanceNotice.js` (38 lines) + `performanceNotice.css`. Clone shape:

- Same show/hide choreography: `hidden` attr + `requestAnimationFrame` class flip for the enter transition; timed class removal for exit; `aria-live="polite"` on the root.
- CSS cloned from `.performance-notice` (performanceNotice.css lines 1-30): pill silhouette, `rgba(8,10,14,0.78)` bg, blur, 320ms transitions — but repositioned to `bottom: clamp(1.5rem, 5vh, 3rem)` + safe-area, `z-index: 1000`, and **`pointer-events: all`** (the notice is `pointer-events: none`; the toast has buttons — UI-SPEC TO-5).
- Differences from the analog: two real buttons (action + dismiss, `phosphorX` already exists in `src/ui/core/phosphorIcons.js` and is imported in `createSettingsPanel.js` — reuse), 10 s auto-dismiss timer that **pauses on hover/focus-within** (UI-SPEC TO-7), Escape dismissal scoped to focus-inside (TO-9), reduced-motion opacity-only.
- Module placement: `src/ui/chrome/` (post-reveal chrome, not intro-scoped — UI-SPEC TO-10).
- **Creation point (verified boot flow):** inside `createIntroFlow.js`'s `onStart` callback, after `revealAppUi()` at line 62 — the intro's EXIT path, i.e. after ENTER completes and chrome is shown. `revealAppUi` is passed into `createIntroFlow` from `main.js` (lines 220-226) and calls `appShell.revealAppUi()`. Simplest wiring: have `main.js` pass a `createLanguageHintToast` factory (or the toast creation closure) into `createIntroFlow`, invoked right after `revealAppUi()` in `onStart` — matches the existing DI style (loader, pipeline, renderer all passed in). Alternative (equally valid per TO-10): create the toast inside `createAppShell.revealAppUi()`; planner picks one — the intro-flow wiring keeps toast concerns out of appShell.
- Trigger guard (TO-3), all checked at creation time:
  1. `getStoredLanguage()` is null (first visit — a stored language means the choice was made);
  2. `getLanguage() === "bm"` (hint offers the OTHER language; TO-1);
  3. `!(navigator.languages ?? []).some((l) => l.startsWith("ms") || l.startsWith("id"))` — empty `navigator.languages` counts as non-matching (show);
  4. `getLanguageHintDismissed()` is falsy.
- Toast text is creation-time `t()` — **do not subscribe** the toast (UI-SPEC TO-8: it is about to be removed on action; LS-4's subscribe clause applies only if you choose a live-re-rendering toast; simplest compliant path is no subscription since the 10 s window is post-reveal and the toast self-removes on switch).
- Dismissal persistence: new pair `getLanguageHintDismissed`/`setLanguageHintDismissed` in `userPreferences.js` using key `threejs-punk-language` sibling `"threejs-punk-lang-hint-dismissed"` (TO-4), same try/catch wrapper as lines 26-44. **Do NOT add it to `clearAllStoredPreferences()`** (lines 66-74) — a hint dismissal is not a config (TO-4). Note `clearAllStoredPreferences` already does not touch the language key, so reset configs preserves both language and hint state — correct behavior.

### Boot-order / restore flow (verified)

1. **Module eval of `i18n.js`** (before `main.js` runs): if `getStoredLanguage() === "en"`, `currentLanguage = "en"`, `documentElement.lang = "en"`, `applyStaticHead()` fire with **zero listeners** — so every later creation-time `t()` (loader statuses, header, settings, intro) resolves in EN. Nothing to build here; the restore path is live.
2. `main.js init()` calls `applyStaticHead()` again (line ~85) — idempotent, harmless.
3. `createAppShell` → header/settings factories subscribe; their immediate-sync `listener({ language })` call (i18n.js:80) runs `syncText()` once at registration — surfaces self-correct to the restored language.
4. Intro overlay is created in `runIntroSequence` — creation-time `t()` sees the restored language; with Seam 3's subscription it also live-tracks any (theoretically impossible during intro) switch.
5. First visit: `currentLanguage` stays `"bm"` (module default, i18n.js:18) — D-09's always-BM start is already guaranteed with zero new code.

**Key gap the plan must own:** `setLanguage()` does not persist. Every toggle entry point must call `setStoredLanguage(language)` **before/alongside** `setLanguage(language)`. Do not add persistence inside `setLanguage` itself — that would couple the store to storage and change behavior if Phase 3+ ever needs a transient switch; the UI layer owns persistence.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pub/sub re-render | Event bus, context system | Existing `subscribe(syncText)` per factory | Built + proven in 8+ factories; audioState contract |
| Persistence | New storage util | `userPreferences.js` try/catch pattern | Safari private-mode safe, established |
| Toast in/out animation | Animation library / Web Animations API | `.performance-notice` CSS transition pattern | Matches house style, 320ms, reduced-motion easy |
| Dictionary parity check | Custom test harness | `npm run check:i18n` (`scripts/check-i18n-parity.mjs`) | Exists, node-native, exits 1 on missing keys |
| Story narration chunking | — | Per-sentence keys `intro.story.s1..s6` | Free now; Phase 3 TTS-02/TTS-05 consume directly |

## Common Pitfalls

### Pitfall 1: Forgetting persistence on toggle
**What goes wrong:** toggle works in-session, choice lost on reload (LANG-02 fails).
**Why:** `setLanguage()` deliberately does not write localStorage.
**Avoid:** each toggle caller calls `setStoredLanguage(next); setLanguage(next);`. Verify with a reload test.

### Pitfall 2: innerHTML with dictionary values (XSS-by-convention break)
**What goes wrong:** new toggle/toast code interpolating `t()` into template literals — Phase 1 locked dictionary values to `textContent`/`setAttribute` only (createSettingsPanel.js comment D-03/D-04).
**Why:** consistency + injection hygiene; also `t()` output is not HTML-escaped.
**Avoid:** static skeleton via innerHTML with hardcoded segments; all dictionary-driven strings via `textContent`/`aria-label` in `syncText()`.

### Pitfall 3: Touching the letter-split region
**What goes wrong:** re-syncing `.intro-brand-line` destroys the split spans mid-timeline (aria-label/aria-hidden letter structure, GSAP stagger targets).
**Why:** split happens once post-creation over hardcoded "THREEJS"/"PUNK".
**Avoid:** `syncText` covers kicker/story/ENTER only; brand + credit are fixed tokens (D-05, S-4).

### Pitfall 4: Kicker/story key count drift
**What goes wrong:** adding `intro.story.s1..s6` to bm.js but not en.js (or vice versa) — silent EN fallback in prod, warn in dev.
**Avoid:** `npm run check:i18n` after every dictionary edit; keys sorted alphabetically per dictionary header comment (D-10 of Phase 1).

### Pitfall 5: Toast re-appearing every visit / never appearing
**What goes wrong:** trigger checks wrong order — e.g. showing when a stored language exists (annoying) or persisting dismissal on mere auto-timeout.
**Avoid:** TO-3 guard order; persist dismissal only on explicit action or dismiss click, and also on switch (TO-8). Auto-timeout alone: UI-SPEC TO-7 does not persist it — follow the spec literally (auto-dismiss without interaction does NOT set the flag, so the hint may re-show next visit — acceptable per spec's UI Considerations table).

### Pitfall 6: `setLanguage` no-op on same language
**What goes wrong:** settings row clicking the already-active segment does nothing visible — fine — but if code relies on the notify side-effect it silently skips.
**Avoid:** `setLanguage` early-returns on `language === currentLanguage` (i18n.js:68); don't depend on notify for non-language state.

### Pitfall 7: z-index / pointer-events on the toast
**What goes wrong:** toast unclickable (inherited `pointer-events: none` pattern from the notice) or trapped under the header gradient.
**Avoid:** explicit `pointer-events: all` on the toast root, `z-index: 1000` (TO-5) — same layer as `.app-header`.

## Code Examples

### Toggle click handler (the entire "activation" of Phase 1 machinery)

```js
// Source: verified src/i18n/i18n.js:67-76 + src/platform/userPreferences.js:54-64
import { setLanguage, getLanguage, subscribe } from "../../i18n/i18n.js";
import { setStoredLanguage } from "../../platform/userPreferences.js";

langButton.addEventListener("click", () => {
  const next = getLanguage() === "bm" ? "en" : "bm";
  setStoredLanguage(next);   // persist FIRST (idempotent, try/catch safe)
  setLanguage(next);         // head swap + notify → every syncText() runs this frame
});
```

### Story paragraph assembly (overlay)

```js
// Source: UI-SPEC ST-3/S-2; keys verified absent in both dictionaries today (en.js has no intro.story.*)
const STORY_KEYS = ["intro.story.s1", "intro.story.s2", "intro.story.s3",
                    "intro.story.s4", "intro.story.s5", "intro.story.s6"];
function storyText() {
  return STORY_KEYS.map((key) => t(key)).join(" ");
}
```

## State of the Art

Not applicable — no library/version decisions this phase. The i18n approach (hand-rolled 2-locale pub/sub store, no i18next) was locked at milestone level (REQUIREMENTS Out-of-Scope list).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Story draft prose quality/length is owner-reviewed at a checkpoint (D-07) — drafts below are proposals, not final copy | Story Draft | Low — budgets have headroom; prose is editable text |
| A2 | GSAP `textContent` swap under a running tween is visually acceptable (text pops within fading element) — theoretical path only, overlay unreachable during toggle in practice | Seam 3 | Negligible — flagged per D-05; no code risk |
| A3 | Toast auto-timeout without interaction does not persist dismissal (reading of TO-7 + UI Considerations table) | Pitfall 5 | Low — worst case one extra hint next visit |

## Open Questions

1. **Toast wiring point: `main.js` closure vs `createAppShell.revealAppUi()`** — both compliant with TO-10; recommend intro-flow DI (keeps appShell unaware of hints). Planner decides.
2. **Story sentence count** — 6 drafted; owner may trim to 5 / extend to 7 at the checkpoint (ST-3/ST-5). Keys s7 slot reserved conceptually; do NOT add an s7 key unless prose demands it (parity gate would then require it in both dictionaries).

## Environment Availability

Step 2.6: SKIPPED beyond baseline — no external dependencies beyond the existing dev environment (`npm`, vite, node for the parity script). Verified: `package.json` scripts `dev`/`build`/`check:i18n`/`preview` exist (`package.json:6-12` [VERIFIED: package.json:6-12] — verbatim: `"dev": "vite"`, `"build": "vite build"`, `"check:i18n": "node scripts/check-i18n-parity.mjs"`, `"preview": "vite preview"`).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None (no unit test framework in project) — gates are: Vite build, node-native parity script, grep gates, manual browser pass |
| Config file | `scripts/check-i18n-parity.mjs` (node-native ESM, no deps) |
| Quick run command | `npm run check:i18n` |
| Full suite command | `npm run check:i18n && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LANG-03 gate (all keys) | BM/EN key parity incl. new `intro.story.*`, toggle/toast keys | script | `npm run check:i18n` | ✅ (`scripts/check-i18n-parity.mjs`) |
| LOC-02/LANG-01 (static) | Toggle present in header + settings; calls setLanguage+setStoredLanguage; no innerHTML-with-`t()` in new modules | grep | `grep -c "lang-toggle-segment" src/ui/chrome/createHeader.js` ≥ 1; `grep -c "setStoredLanguage" src/ui/chrome/*.js src/app/*.js` ≥ 2; `grep -nE "innerHTML.*\$\{t\(" src/ui/chrome/createLanguageHintToast.js` → 0 hits | ❌ grep-only, no file needed |
| D-05 guard | `splitIntoLetters` invoked only on brand lines; story `<p>` not letter-split | grep | `grep -n "splitIntoLetters" src/ui/intro/createIntroOverlay.js` → exactly 1 call site (line ~49) over `.intro-brand-line` | ✅ (invariant re-check) |
| LOC-02/LANG-02/INTRO-01/INTRO-02 round-trip | BM→EN→BM leaves zero mixed strings incl. title/lang/metas; story fits at 360px; toast trigger/dismiss/persist; persistence survives reload | **manual browser pass** | `npm run dev` + checklist below | manual-only (justification: DOM/visual/GSAP behavior, no headless harness in project) |
| Build | Compiles, no new deps | build | `npm run build` | ✅ |

### Manual browser checklist (the round-trip parity test)
1. Fresh profile (localStorage cleared) → intro in BM; header pill shows BM active.
2. Toggle header pill → EN: title bar, all chrome, settings labels flip in one frame; screenshot mid-swap shows no mixed language (LS-1).
3. BM→EN→BM: `document.documentElement.lang === "ms"`, title BM, og:locale `ms_MY` (applyStaticHead covers all — verify visually via devtools).
4. Toggle → EN → reload → boots EN everywhere incl. loader statuses (restore path, i18n.js:24-28).
5. Toggle → EN → reload → toggle → BM → reload → boots BM.
6. Settings row mirrors header pill state both directions (TG-8).
7. Non-ms/id browser (en-US profile) + first visit → after ENTER: hint toast appears; "Tukar ke BM"-style action switches language live; X dismiss persists across reload; hover pauses auto-dismiss; auto-timeout does not persist.
8. Story: fits without clipping ENTER at 360px viewport and 1080p; `overflow: hidden` clips tail only if prose over-budget (then shorten copy — never scroll).
9. Letter-split brand animates unchanged after a toggle.

### Sampling Rate
- **Per task commit:** `npm run check:i18n`
- **Per wave merge:** `npm run check:i18n && npm run build`
- **Phase gate:** full manual checklist green before `$gsd-verify-work`

### Wave 0 Gaps
None — no test framework to install; existing gates (parity script + build) cover all automatable checks; the rest is the manual pass above.

## Story Draft (proposed dictionary content — owner reviews per D-07/ST-5)

Arc per D-10/ST-1: runner → one delivery → tension in the monsoon rain → arrival. BM is a native rewrite with KL texture (mamak, monsoon, motorbike courier, corporate towers); EN is a faithful counterpart, not a literal translation. All sentences within the ST-4 budget (per-sentence ≤ ~110 chars; total ≤ ~460 BM / ~420 EN — drafts measure ~300 BM / ~300 EN, comfortable headroom).

**BM (`src/i18n/dictionaries/bm.js`, alphabetical placement per dictionary convention):**
```js
"intro.story.s1": "Kuala Lumpur, pukul tiga pagi — hujan monsoon tak berhenti.",
"intro.story.s2": "Aku seorang kurir; motosikal tua membawa paket yang tak boleh ditanya.",
"intro.story.s3": "Neon Mamak Bintang berkelip, mewarnai lorong dengan ungu dan sian.",
"intro.story.s4": "Drone korporat mengimbas dari menara berkaca; aku menunduk, melaju.",
"intro.story.s5": "Roadblock merentas lorong — satu detik, jantung seakan berhenti.",
"intro.story.s6": "Paket sampai. Bandar ini tak pernah tahu nama kurirnya.",
```
(~305 chars total; longest sentence 71 chars.)

**EN (`src/i18n/dictionaries/en.js`):**
```js
"intro.story.s1": "Kuala Lumpur, three a.m. — the monsoon won't let up.",
"intro.story.s2": "I'm a runner; an old bike carries a parcel no one may ask about.",
"intro.story.s3": "The Mamak Bintang neon flickers, painting the alley purple and cyan.",
"intro.story.s4": "Corporate drones sweep down from the glass towers; I duck and ride.",
"intro.story.s5": "A roadblock swallows the lane — one second, my heart nearly stops.",
"intro.story.s6": "The parcel arrives. The city never learns its runner's name.",
```
(~300 chars total; faithful counterpart — same beats, natural EN rhythm.)

**Kicker rewrite drafts (UI-SPEC copy table, ≤ ~26 chars):**
```js
// bm.js
"intro.kicker": "bawah hujan neon",          // 16 chars
// en.js
"intro.kicker": "beneath the neon rain",   // 22 chars
```

**Toggle/toast dictionary keys (drafts per UI-SPEC copy table):**
```js
// both dictionaries
"header.langAriaBm": /* en */ "Language: Malay. Activate to switch to English."  /* bm */ "Bahasa: Bahasa Melayu. Aktifkan untuk bertukar ke Bahasa Inggeris.",
"header.langAriaEn": /* en */ "Language: English. Activate to switch to Malay."  /* bm */ "Bahasa: Bahasa Inggeris. Aktifkan untuk bertukar ke Bahasa Melayu.",
"settings.language":  /* en */ "Language"  /* bm */ "Bahasa",
"settings.langBmAria": /* en */ "Bahasa Melayu" /* bm */ "Bahasa Melayu",
"settings.langEnAria": /* en */ "English" /* bm */ "Bahasa Inggeris",
"langHint.message":    /* en */ "Prefer Malay?" /* bm */ "Lebih selesa dalam Bahasa Inggeris?",
"langHint.action":     /* en */ "Switch to Malay" /* bm */ "Tukar ke BM",
"langHint.dismissAria":/* en */ "Dismiss" /* bm */ "Tutup",
```
(Exact EN/BM values per language live in that language's dictionary — the table above shows the pair; the toast action label offers the OTHER language, resolved by `t("langHint.action")` in the current language, TO-1/TO-8.)

## Sources

### Primary (HIGH confidence — all read this session)
- `src/i18n/i18n.js` — store, `setLanguage` path (lines 67-76), dormant restore (24-28), `subscribe` immediate-sync (78-82)
- `src/platform/userPreferences.js` — storage pair (46-64), `clearAllStoredPreferences` (66-74)
- `src/ui/chrome/createHeader.js` — actions markup (12-27), `syncText` + page-lifetime subscription (39-50)
- `src/ui/chrome/createSettingsPanel.js` — look-grid pattern (8-26, 42-82), textContent-only sync convention (100-116)
- `src/ui/chrome/header.css` — button metrics + 640px collapse (69-107, 160-203)
- `src/ui/intro/createIntroOverlay.js` — template, `splitIntoLetters`, GSAP timelines (full file)
- `src/ui/intro/introOverlay.css` — stack geometry, tagline ramp, 480px media query (full file)
- `src/ui/intro/createPerformanceNotice.js` + `performanceNotice.css` — toast analog (full files)
- `src/app/createIntroFlow.js` — ENTER → revealAppUi sequence (33-68)
- `src/main.js` — boot order, `createIntroFlow`/`revealAppUi` wiring (220-226, 250-281)
- `scripts/check-i18n-parity.mjs` — parity gate
- `src/i18n/dictionaries/en.js`, `bm.js` — current key inventory (81 keys, no `intro.story.*`)
- `.planning/phases/02-language-toggle-kl-intro-story/02-UI-SPEC.md` — TG-*/TO-*/S-*/ST-*/LS-* contracts (approved spec)
- `.planning/phases/02-language-toggle-kl-intro-story/02-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`

### Secondary
- Milestone research `.planning/research/ARCHITECTURE.md`, `FEATURES.md`, `PITFALLS.md` (referenced via CONTEXT canonical refs; not re-fetched — phase-level code verification supersedes)

## Metadata

**Confidence breakdown:**
- Integration seams: HIGH — every file read line-level this session
- Boot/restore flow: HIGH — traced through main.js → createAppShell → createIntroFlow
- Story drafts: MEDIUM — prose is owner-reviewed by design (D-07); budgets verified against CSS geometry
- Toast mechanics: HIGH — cloned from a read analog; auto-dismiss-persistence nuance flagged as A3

**Research date:** 2026-11-23
**Valid until:** 2026-12-23 (stable — codebase-local research)
