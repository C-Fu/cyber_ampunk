# Phase 1: i18n Foundation - Pattern Map

**Mapped:** 2026-11-22
**Files analyzed:** 22 (5 new + 17 modified/verified)
**Analogs found:** 20 / 22 (2 have no analog — see "No Analog Found")

All analog paths below are git-tracked source (verified via `git ls-files`). Per AGENTS.md: this phase touches zero render-pipeline code except string literals in `warmup.js`/`createWorld.js`; `src/runtime/createRenderLoop.js` is not touched. The codebase has no controllers/services — it is a factory-composition frontend, so roles map to store / component-factory / utility / config-data / script.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/i18n/i18n.js` (new) | store | pub-sub | `src/audio/audioState.js` | exact |
| `src/i18n/dictionaries/bm.js` (new) | config (data module) | transform (static lookup) | `src/post/look/cyberpunkLook.js` (`LOOK_PRESETS`) | role-match (data-only ES module) |
| `src/i18n/dictionaries/en.js` (new) | config (data module) | transform (static lookup) | `src/post/look/cyberpunkLook.js` (`LOOK_PRESETS`) | role-match |
| `src/i18n/staticHead.js` (new) | utility (DOM boot module) | event-driven (imperative DOM writes) | `src/platform/deviceLayout.js` (`syncLayoutClass`) | role-match |
| `scripts/check-i18n-parity.mjs` (new) | test (Node script) | batch (file I/O / import + compare) | — | none |
| `src/platform/userPreferences.js` (mod) | utility (persistence) | file-I/O (localStorage) | itself (`getStoredLookPreset` pattern) | exact (extend in place) |
| `src/ui/walk/createWalkPrompt.js` (mod) | component factory | event-driven | itself (`syncCopy` hook) | exact (the D-03 exemplar) |
| `src/ui/chrome/createAudioButton.js` (mod) | component factory | event-driven | `src/ui/walk/createWalkPrompt.js` | exact |
| `src/ui/walk/createMoveHint.js` (mod) | component factory | event-driven | `src/ui/walk/createWalkPrompt.js` | exact |
| `src/ui/intro/createPerformanceNotice.js` (mod) | component factory | event-driven | `src/ui/walk/createWalkPrompt.js` (call-time only) | role-match |
| `src/app/createLoaderOverlay.js` (mod) | component factory | event-driven | itself (`syncAriaLabel`/`setStatus`) | exact |
| `src/main.js` (mod — statuses only) | config/composition root | event-driven | itself (`loaderOverlay.setStatus` call sites) | exact |
| `src/runtime/warmup.js` (mod — 2 literals) | service (startup orchestration) | event-driven | itself (`loaderOverlay.setStatus` call sites) | exact |
| `src/world/createWorld.js` (mod — 2 literals) | service (world assembly) | event-driven | itself (`loaderOverlay.setStatus` call sites) | exact |
| `src/ui/intro/createIntroOverlay.js` (mod) | component factory | event-driven | `src/ui/walk/createWalkPrompt.js` (but NO subscription — GSAP constraint) | role-match |
| `src/ui/walk/createHudPanel.js` (mod) | component factory | event-driven | `src/ui/walk/createWalkPrompt.js` (but no `destroy()` — page lifetime) | role-match |
| `src/ui/chrome/createSettingsPanel.js` (mod) | component factory | event-driven | itself (`syncLookPreset` + `window.confirm`) | exact |
| `src/ui/chrome/createAboutPanel.js` (mod) | component factory | event-driven | itself (`unsubscribeLayout` + `destroy`) — `data-i18n` walker has no precedent | exact (lifecycle), none (walker) |
| `src/ui/chrome/createHeader.js` (mod) | component factory | event-driven | `src/ui/walk/createWalkPrompt.js` (no `destroy()` — page lifetime) | role-match |
| `src/ui/walk/createWalkControlsHint.js` (mod) | component factory | event-driven | `src/ui/walk/createWalkPrompt.js` (SVG `<text>` wrinkle) | role-match |
| `src/ui/walk/createVirtualJoystick.js` (verify-only) | component factory | — | — | none (verified no string sites) |
| `index.html` (mod — head) | config (static document) | — | — | none (single instance) |

## Pattern Assignments

### `src/i18n/i18n.js` (store, pub-sub)

**Analog:** `src/audio/audioState.js` (41 lines, full read — replicate the shape exactly, per D-02)

**Module-scope store pattern** (lines 1–10):
```javascript
const listeners = new Set();

let audioVolume = 0.5;
let isMusicPlaying = false;

function notify() {
  for (const listener of listeners) {
    listener({ audioVolume, isMusicPlaying });
  }
}
```
i18n equivalent: `let currentLanguage = "bm";` and `notify()` passes `{ language: currentLanguage }`.

**Guard + notify setter** (lines 20–27) — copy this no-op-when-unchanged guard into `setLanguage`:
```javascript
export function setMusicPlaying(value) {
  if (isMusicPlaying === value) {
    return;
  }

  isMusicPlaying = value;
  notify();
}
```

**Subscribe-with-immediate-sync contract** (lines 37–41) — the most important excerpt: registration fires the listener once immediately, so factories don't need a separate initial `syncText()` call:
```javascript
export function subscribe(listener) {
  listeners.add(listener);
  listener({ audioVolume, isMusicPlaying });
  return () => listeners.delete(listener);
}
```

**Deviations from the analog (sanctioned by RESEARCH.md § Store Shape):**
- Adds `t(key, vars = {})` lookup with flat-key access `DICTIONARIES[currentLanguage][key]` (D-07 — dots are cosmetic, no path traversal).
- Adds the `{var}` interpolation replace (one site needs it: loader aria).
- `setLanguage` additionally writes `document.documentElement.lang = language === "bm" ? "ms" : "en"` (D-06) and calls `applyStaticHead()` from `staticHead.js`. Note the circular-import risk: keep `staticHead.js` importing `t` from `i18n.js` only, and have `i18n.js` import `applyStaticHead` — ES module cycles work here because both calls happen at runtime, not module-eval time, but the planner should keep `staticHead.js` free of module-eval-time side effects to be safe.

### `src/i18n/dictionaries/bm.js` + `en.js` (config data module)

**Analog:** `src/post/look/cyberpunkLook.js` — `LOOK_PRESETS` (lines 102–131):
```javascript
export const LOOK_PRESETS = {
  neutral: {
    label: "Neutral",
    bloom: { strength: 3, radius: 0.5 },
    ...
```
What to copy: plain `export const` data at module top level, no classes, no factory wrapper, alphabetically stable key order (D-10 owner review requires greppable, diff-stable files). Shape: `export const bm = { "about.lead1": "...", "hud.vitals": "VITAL", ... }` — flat object literal, string keys with dots, one entry per line.

Difference from analog: dictionaries are flat string→string maps, not nested config. EN dictionary = current hardcoded strings verbatim (research inventory §1–15 is the source of truth for which strings move and which stay hardcoded: brand names, proper nouns, key caps stay out of the dictionaries entirely — Pitfall 3).

### `src/i18n/staticHead.js` (utility, DOM boot module)

**Analog:** `src/platform/deviceLayout.js` — `syncLayoutClass` (lines 62–64) plus `onMobileLayoutChange` (line 66):
```javascript
export function syncLayoutClass() {
  document.documentElement.classList.toggle("layout-mobile", isMobileLayout());
}
```
What to copy: an exported function that imperatively writes one `document.documentElement` attribute, called once at boot from `src/main.js` (`syncLayoutClass()` is called at `src/main.js:59`, inside `init()` before heavy work). `applyStaticHead()` follows the same shape: `document.title = t("meta.title"); document.documentElement.lang = ...;` plus a `SELECTOR_MAP` constant of `{ selector: key }` entries (`meta[name="description"]`, `meta[property="og:title"]`, `og:locale` → `ms_MY`/`en_US`, twitter:*), each resolved via `el.setAttribute("content", t(key))`.

Boot wiring: call `applyStaticHead()` at the top of `init()` in `src/main.js` next to `syncLayoutClass()` (line 59) — after the stored-language check in `i18n.js` module init. RESEARCH.md § Recommended Project Structure justifies the selector map over `data-i18n` attributes in `index.html`.

### `scripts/check-i18n-parity.mjs` (test script, batch)

**No analog** — no `scripts/` directory, no test files exist in the repo. Build per RESEARCH.md § Wave 0 Gaps: a ~20-line Node-native ESM script (package.json has `"type": "module"`, so `.mjs`/`.js` both work; use `.mjs` to be explicit it runs under Node, not the browser): import both dictionaries, compare `Object.keys()` sets both directions, `console.error` the diff, `process.exit(1)` on mismatch. Add an npm script entry (`"check:i18n": "node scripts/check-i18n-parity.mjs"`) following the flat script style of the existing `dev`/`build`/`preview`/`deploy` entries.

### `src/platform/userPreferences.js` (mod — add language persistence)

**Analog:** itself — `getStoredLookPreset`/`setStoredLookPreset` (lines 25–43):
```javascript
export function getStoredLookPreset() {
  try {
    return localStorage.getItem(LOOK_PRESET_KEY);
  } catch {
    return null;
  }
}

export function setStoredLookPreset(presetId) {
  try {
    if (presetId) {
      localStorage.setItem(LOOK_PRESET_KEY, presetId);
    } else {
      localStorage.removeItem(LOOK_PRESET_KEY);
    }
  } catch {
    // localStorage may be unavailable
  }
}
```
Copy verbatim with a new `LANGUAGE_KEY = "threejs-punk-language"` constant (mirrors lines 1–2 naming). Also reuse the existing `isDevEnvironment()` export (line 13–15, `import.meta.env.DEV`) inside `t()` for the D-08 loud/silent fallback split. **Do NOT** add the language key to `clearAllStoredPreferences` (lines 45–53) — that's a Phase 2 product call (research Open Question 2).

### `src/ui/walk/createWalkPrompt.js` (mod — the D-03 exemplar)

**Analog:** itself. The three excerpts every migrated factory copies:

**1. Template literals → `t()`** (lines 14, 23–24): initial `aria-label` and `innerHTML` template strings become `t("walkPrompt.clickToActivate")`, `t("walkPrompt.kicker")`, `t("walkPrompt.clickToLook")` — evaluated at creation.

**2. The `syncCopy` hook** (lines 41–51) — the re-sync function D-03 is named after; extend it to also set the kicker, and convert literals to `t()`:
```javascript
function syncCopy() {
  if (isCoarsePointerDevice()) {
    titleEl.textContent = "Drag to look around";
    root.setAttribute("aria-label", "Drag to look around");
    root.classList.add("walk-prompt--passive");
  } else {
    titleEl.textContent = "Click to look around";
    root.setAttribute("aria-label", "Click to activate walk mode");
    root.classList.remove("walk-prompt--passive");
  }
}
```

**3. Subscription + unsubscribe-in-destroy** (lines 104–108, 119–125):
```javascript
const unsubscribeWalk = walkControls?.subscribe?.(onWalkChange);
const unsubscribeState = state?.subscribe?.(({ openedPanel }) => {
  panelOpen = Boolean(openedPanel);
  sync();
});
...
destroy() {
  unsubscribeWalk?.();
  unsubscribeState?.();
  ...
```
i18n addition mirrors this exactly: `const unsubscribeLanguage = subscribe(syncCopy);` (named import from `../../i18n/i18n.js`) at the same block, `unsubscribeLanguage?.()` first line of `destroy()`. Because `subscribe` fires immediately (audioState contract), the initial template values could even come from the subscription alone — but keep the `t()` in the template too; it costs nothing and keeps creation-time DOM correct without ordering assumptions.

### `src/ui/chrome/createAudioButton.js`, `createMoveHint.js`, `createHudPanel.js`, `createHeader.js`, `createWalkControlsHint.js` (mod — generic factory migration)

**Analog:** `createWalkPrompt.js` (above). All follow: template `t()` at creation + `syncText()` function + `subscribe(syncText)` + `unsubscribe?.()` in `destroy()` if one exists.

Per-factory deltas (from research inventory):
- `createAudioButton.js` — 1 aria-label, has `destroy()` (line 200). Trivial.
- `createMoveHint.js` — 2 strings (lines 61–62), has `destroy()` (line 192), needs a new `syncText()`.
- `createHudPanel.js` — 3 labels (lines 90/103/108), created inside `createHeader` (line 29), **no `destroy()`** — page-lifetime subscription is acceptable but the plan must state it explicitly (research A4). Numbers (`82%`) stay hardcoded.
- `createHeader.js` — 2 labels + 3 aria-labels (lines 14–22), **no `destroy()`** (returns `{ root, show, hide, setForceHidden, bindWalkControls, updateHud }` at line 70) — same page-lifetime note.
- `createWalkControlsHint.js` — SVG callouts are baked into `renderExpandedDiagram()` (lines 80–83) via `renderCallout(x, y, w, "Movement", "WASD to move")`. Give the generated `<text>` nodes `data-i18n` attributes inside the SVG template string so the generic walker (see `createAboutPanel` below) can re-set `textContent` — `textContent` works on SVG text elements. Keep physical key caps (W/A/S/D/Shift/C/Esc) Latin.

### `src/ui/intro/createIntroOverlay.js` (mod — no subscription)

**Analog:** `createWalkPrompt.js` for the `t()`-at-creation part only. **Do not add a subscription** — brand lines are letter-split by `splitIntoLetters` (lines 4–17) into GSAP-staggered spans; only kicker/tagline/button get `t()` at creation (research Wave 2, item 12). Keys: `intro.kicker`, `intro.tagline`, `intro.enter`. Brand lines and credit stay hardcoded.

### `src/ui/intro/createPerformanceNotice.js` (mod — call-time only)

**Analog:** `createWalkPrompt.js` call-site shape. Single default parameter (line 4: `message = "Adjusting performance"` → `t("performanceNotice.adjusting")`). Transient, one-shot — no subscription.

### `src/app/createLoaderOverlay.js` (mod)

**Analog:** itself. Three call-time/`sync` sites:

**`syncAriaLabel` interpolation site** (lines 176–191):
```javascript
function syncAriaLabel() {
  if (currentStatus) {
    root.setAttribute(
      "aria-label",
      currentProgress >= 1
        ? currentStatus
        : `Loading ${Math.round(currentProgress * 100)}%. ${currentStatus}`,
    );
    return;
  }

  root.setAttribute(
    "aria-label",
    `Loading ${Math.round(currentProgress * 100)}%`,
  );
}
```
Becomes `t("loader.ariaLoading", { percent: Math.round(currentProgress * 100), status: currentStatus })` — the only interpolation consumer. `currentStatus` is stored as a **key** (not translated text) once main.js/warmup/createWorld pass keys; `setStatus(key)` then resolves `statusEl.textContent = t(key)`. Keep the CSS `text-transform: uppercase` (injected style, line 112) doing the casing — no case-munging in dictionaries.

**`fail()` dead-argument wrinkle** (lines 218–222 + `src/main.js:52`): `fail()` takes no params and hardcodes `"LINK FAILED"`; the string passed at `main.js:52` is ignored. Localize inside `fail()` via `t("loader.linkFailed")` / `t("loader.failedToLoad")` and drop the ignored argument at the call site.

### `src/main.js`, `src/runtime/warmup.js`, `src/world/createWorld.js` (mod — loader statuses)

**Analog:** themselves — the call-site shape is identical in all three, e.g. `src/main.js:61–62`:
```javascript
loaderOverlay.setProgress(0.03);
loaderOverlay.setStatus("BOOTING SCENE");
```
Migration is argument-only: `setStatus(t("loader.bootingScene"))` (or pass the key if the loader resolves keys — planner picks one; the call-time `t()` form keeps `setStatus` signature untouched and is simpler). Full site list (verified this session): `src/main.js:62,69,74,111` (+ dead arg line 52), `src/runtime/warmup.js:87,97`, `src/world/createWorld.js:65,98`. Import `t` at module top — `i18n.js` is a module-scope store so import order handles initialization before `createLoaderOverlay()` (line 49) runs. No other lines in these files change (AGENTS.md: touch world subtree minimally; `createRenderLoop.js` untouched).

### `src/ui/chrome/createSettingsPanel.js` (mod)

**Analog:** itself — three existing hooks carry the migration:

**Template labels** (lines 40, 47, 57, 72, 75): `"Look"`, `"Development mode"`, `"Reset configs"`, the hint paragraph, and both `aria-label`s become `t("settings.*")` in the `innerHTML` template.

**Look-button labels** — `renderLookButtons` (lines 7–23) interpolates `${option.label}`. Recommended: resolve at render time via `t("look." + option.id)` instead of `LOOK_OPTIONS.label`, keeping `createAppShell.js` data-only (research §8, option a). Preset ids are stable suffixes: `neutral`, `neonNoir`, `magentaRain`, `tealDusk`, `silentHill`, `sinCity` (verified in `cyberpunkLook.js:102` ff.).

**`syncLookPreset`** (lines 92–102) is the existing refresh hook — extend it (or the new `syncText`) to also rewrite `.settings-look-label` textContent on language change:
```javascript
function syncLookPreset(presetId = getCurrentLookPreset()) {
  const activeId = lookOptionIds.has(presetId)
    ? presetId
    : defaultLookPreset;

  for (const button of lookButtons) {
    const selected = button.dataset.lookPreset === activeId;
    button.classList.toggle("settings-look-btn--active", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  }
}
```

**Call-time confirm** (lines 152–158):
```javascript
restartButton.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Reset configs? Look preference will return to default and development mode will turn off.",
  );
```
Becomes `window.confirm(t("settings.resetConfirm"))` at click time — no subscription needed for this one.

**Unsubscribe in `destroy()`** (lines 189–193) — currently only removes the keydown listener; add `unsubscribeLanguage?.()` first, mirroring the about panel.

### `src/ui/chrome/createAboutPanel.js` (mod — `data-i18n` walker territory, D-04)

**Analog:** itself for lifecycle; the walker is new.

**Template + querySelector pattern** (lines 21–22, 91–96): the `innerHTML` template gains `data-i18n="about.lead1"` attributes on the four `.about-lead` paragraphs (lines 34–55) and on spans wrapping the recommended-setup bodies (lines 74–86); proper nouns (lines 29–30, 62–66, 72) stay hardcoded.

**Lifecycle pattern to extend** (lines 104–105 + 163–167):
```javascript
syncRecommendedVisibility();
const unsubscribeLayout = onMobileLayoutChange(syncRecommendedVisibility);
...
destroy() {
  unsubscribeLayout?.();
  document.removeEventListener("keydown", onKeyDown);
  root.remove();
}
```
Add `const unsubscribeLanguage = subscribe(syncText);` next to `unsubscribeLayout` and `unsubscribeLanguage?.()` first in `destroy()`.

**New `syncText()` (no in-repo precedent — write fresh per D-04):**
```javascript
function syncText() {
  for (const el of root.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
}
```
XSS constraint (ASVS): the walker writes `textContent` only — never `innerHTML = t(...)`. This same walker shape is reused by `createWalkControlsHint.js` for its SVG `<text>` nodes. Also copy the existing pattern of the state subscription at lines 140–146 (subscribes without storing the unsubscribe — an existing inconsistency; do NOT copy that part for i18n).

### `index.html` (mod — static head, D-05)

**No analog** (single static document). Follow the research inventory §15 exactly: `lang="ms"` on `<html>` (line 2), BM literals for title/meta/og/twitter/noscript, `og:locale` → `ms_MY`, brand values (`og:site_name`, `application-name`, author metas, canonical URL) untouched. The JS swap path lives entirely in `staticHead.js`. JSON-LD: BM `description`, brand `name` (research recommendation, owner review D-10).

## Shared Patterns

### Module-scope pub/sub store (audioState contract)
**Source:** `src/audio/audioState.js` lines 1–10, 37–41 (quoted in full above)
**Apply to:** `src/i18n/i18n.js` only (single store). Every factory consumes it — factories never hold language state.

### Factory i18n migration recipe (subscribe → syncText → destroy)
**Source:** `src/ui/walk/createWalkPrompt.js` lines 41–51 (syncCopy), 104–108 (subscription), 119–125 (destroy)
**Apply to:** all ~12 migrated factories. Canonical sequence:
1. Template literals → `t()` in the creation-time `innerHTML`.
2. New or extended `syncText()`/`syncCopy()` doing all `textContent`/`setAttribute` writes.
3. `const unsubscribeLanguage = subscribe(syncText);` — immediate-sync contract makes step 1 technically redundant but keep it for creation-time correctness.
4. `unsubscribeLanguage?.()` in `destroy()` if it exists; if not (header, HUD), document the page-lifetime decision in the plan.
Exception: `createIntroOverlay` (no subscription — GSAP letter-split) and `createPerformanceNotice` (transient).

### localStorage persistence
**Source:** `src/platform/userPreferences.js` lines 25–43 (quoted above)
**Apply to:** the new `getStoredLanguage`/`setStoredLanguage`. Always try/catch returning `null`/silently swallowing — matches the file's existing defensive style.

### Call-time `t()` for one-shot strings
**Source:** `createSettingsPanel.js` lines 152–158 (`window.confirm` at click time); `main.js:62` (`setStatus` argument at call time)
**Apply to:** loader statuses (3 files), reset confirm, performance notice — anything that re-renders on every invocation needs no subscription.

### data-i18n → textContent walker (XSS-safe innerHTML migration)
**Source:** new (D-04); shape given in the `createAboutPanel` section above
**Apply to:** `createAboutPanel.js`, `createWalkControlsHint.js` (works on SVG `<text>` too).

### Keep-as-is list (do not dictionary-ize)
**Source:** research Pitfall 3 + inventory markers
**Apply to:** all dictionaries — brand names (`THREEJS-PUNK`, `THREEJS`, `PUNK`), proper nouns (Anderson Mancini, Sunag), physical key caps (WASD/Shift/C/Esc), interpolated numbers, canonical URL, `og:site_name`/`application-name` metas.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/check-i18n-parity.mjs` | test (Node script) | batch | No `scripts/` directory, no test files, no CI in the repo — build per RESEARCH.md § Wave 0 (~20 lines, Node ESM, exit 1 on key-set mismatch) |
| `index.html` head changes | config (static document) | — | Single static instance; research inventory §15 is the complete spec |
| `createVirtualJoystick.js` | — | — | Verified no-op: no string sites exist (root is `aria-hidden`, markup is base + knob divs only) — document in VERIFICATION.md, no code change |

(`data-i18n` walker inside `createAboutPanel.js` is new-but-trivial — 3 lines, specified under Shared Patterns.)

## Metadata

**Analog search scope:** `src/audio/`, `src/platform/`, `src/ui/` (chrome, walk, intro), `src/app/`, `src/post/look/`, `src/runtime/`, `src/world/`, `index.html`, `package.json`
**Files scanned:** audioState.js, userPreferences.js, deviceLayout.js, createWalkPrompt.js, createAboutPanel.js, createSettingsPanel.js, createLoaderOverlay.js, main.js, warmup.js (status sites), createWorld.js (status sites), cyberpunkLook.js (LOOK_PRESETS), createVirtualJoystick.js (via research, verified no-op), package.json
**Pattern extraction date:** 2026-11-22

---

*Phase: 1-i18n Foundation*
