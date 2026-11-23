# Phase 2: Language Toggle & KL Intro Story - Pattern Map

**Mapped:** 2026-11-23
**Files analyzed:** 7 (4 modified, 2 new, 1 optional wiring in main.js/createIntroFlow.js)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/ui/chrome/createHeader.js` (modify — toggle pill) | component | event-driven (pub-sub re-render) | self + `createSettingsPanel.js` active-state pattern | exact |
| `src/ui/chrome/createSettingsPanel.js` (modify — language row) | component | event-driven (pub-sub re-render) | self (look-grid two-button row) | exact |
| `src/ui/intro/createIntroOverlay.js` (modify — story + syncText) | component | event-driven (add pub-sub to creation-time file) | `createHeader.js` syncText/subscribe pattern | role-match |
| `src/ui/chrome/createLanguageHintToast.js` (new) | component | event-driven (show/hide + localStorage flag) | `src/ui/intro/createPerformanceNotice.js` | exact |
| `src/ui/chrome/createLanguageHintToast.css` (new) | config (CSS) | — | `src/ui/intro/performanceNotice.css` | exact |
| `src/i18n/dictionaries/bm.js`, `en.js` (modify — story/toggle/toast keys) | model (data) | CRUD (static lookup) | existing dictionary key style + `scripts/check-i18n-parity.mjs` gate | exact |
| `src/platform/userPreferences.js` (modify — hint-dismissed pair) | service (storage) | CRUD (localStorage try/catch) | self (`getStoredLookPreset`/`setStoredLookPreset`) | exact |
| `src/main.js` / `src/app/createIntroFlow.js` (modify — toast wiring) | controller (boot DI) | request-response (factory composition) | existing DI of loader/pipeline/renderer into `createIntroFlow` | role-match |

All analog paths verified git-tracked (`git ls-files` non-empty).

## Pattern Assignments

### `src/ui/chrome/createHeader.js` — toggle pill (component, event-driven)

**Analog:** the file itself for the subscription; `createSettingsPanel.js` for active-state.

**Insertion point** (lines 12-27): first child of `.app-header-actions`, before the about button. Hardcoded `BM`/`EN` segment spans (NOT dictionary keys — UI-SPEC T-5); only the `aria-label` comes from `t()`.

**Existing subscription pattern to extend** (lines 39-50):

```js
function syncText() {
  aboutLabel.textContent = t("header.about");
  ...
  settingsButton.setAttribute("aria-label", t("header.settingsAria"));
}
// Page-lifetime subscription: createHeader has no destroy() and lives
// for the whole page — unsubscribe stored but deliberately never released.
const unsubscribeLanguage = subscribe(syncText);
```

Extend `syncText()` with: `langButton.setAttribute("aria-label", t("header.langAria" + (getLanguage() === "bm" ? "Bm" : "En")))` and per-segment `seg.classList.toggle("lang-toggle-segment--active", getLanguage() === seg.dataset.lang)`.

**Click handler — the entire Phase 1 activation** (verified `i18n.js:67-76`, `userPreferences.js:54-64`):

```js
import { setLanguage, getLanguage, subscribe } from "../../i18n/i18n.js";
import { setStoredLanguage } from "../../platform/userPreferences.js";

langButton.addEventListener("click", (event) => {
  event.stopPropagation(); // match lines 52-57 convention
  const next = getLanguage() === "bm" ? "en" : "bm";
  setStoredLanguage(next); // persist FIRST — setLanguage does NOT persist
  setLanguage(next);       // early-returns on same language, safe unconditionally
});
```

**CSS:** new `.app-header-lang-btn` in `header.css` cloned from `.app-header-about-btn` (lines 69-107; 44px height, 40px at ≤640px). Active-state values copied verbatim from `.settings-look-btn--active` (`settingsPanel.css:173+`) — do not invent.

---

### `src/ui/chrome/createSettingsPanel.js` — language row (component, event-driven)

**Analog:** self, look-grid section (lines 42-54 markup, 100-128 sync).

**Markup rhythm to copy** (lines 49-54): a new `.settings-section` between the look section and the first divider, with `settings-section-title` + a 2-column grid of two `.settings-look-btn`-shaped segment buttons carrying `data-lang="bm|en"` and `aria-pressed`.

**The critical Phase 1 convention (lines 100-116):**

```js
// D-03: textContent/setAttribute writes only — dictionary values never
// reach an innerHTML write (D-04).
function syncText() {
  glass.setAttribute("aria-label", t("settings.aria"));
  sectionTitle.textContent = t("settings.look");
  ...
}
```

For the language row: section title + full-name `aria-label`s re-sync in `syncText()` via `textContent`/`setAttribute`; the `BM`/`EN` segment text is hardcoded.

**Active/pressed state to copy** (lines 118-128):

```js
for (const button of lookButtons) {
  const selected = button.dataset.lookPreset === activeId;
  button.classList.toggle("settings-look-btn--active", selected);
  button.setAttribute("aria-pressed", selected ? "true" : "false");
}
```

Use `getLanguage()` instead of `getCurrentLookPreset()` as the state source — both surfaces read the same store (UI-SPEC TG-8, no component-local mirrors). Click handler identical to the header's (`setStoredLanguage(id); setLanguage(id);`). Note the file already imports `phosphorX` (line 6) — reuse for the toast dismiss icon pattern reference.

---

### `src/ui/intro/createIntroOverlay.js` — story + syncText gap (component, adding pub-sub)

**Analog:** `createHeader.js` subscription shape applied to this creation-time-only file.

**Verified gap:** no `subscribe()` today; kicker/tagline/ENTER resolve `t()` once (lines 26-34). Story paragraph = the existing `.intro-tagline` `<p>` becomes the story (UI-SPEC S-2), guarded with a `max-height`/`overflow: hidden` modifier class (`intro-tagline--story` recommended — lower blast radius).

**Add (per research Seam 3):**

```js
import { t, subscribe } from "../../i18n/i18n.js";

const STORY_KEYS = ["intro.story.s1","intro.story.s2","intro.story.s3",
                    "intro.story.s4","intro.story.s5","intro.story.s6"];
function storyText() {
  return STORY_KEYS.map((key) => t(key)).join(" ");
}

function syncText() {
  kicker.textContent = t("intro.kicker");
  tagline.textContent = storyText();
  button.textContent = t("intro.enter");
}
const unsubscribeLanguage = subscribe(syncText); // page-lifetime; overlay self-removes in playExit
```

**Letter-split boundary (D-05 — hard rule):** `splitIntoLetters()` (lines 5-18) runs only over `.intro-brand-line` spans (lines 49-51). The story `<p>` is NEVER letter-split — `textContent` writes are safe even mid-tween (timeline tweens `opacity`/`y` on the element box, lines 103-112). Brand `aria-label="THREEJS-PUNK"` (line 27) and credit (line 36) stay out of `syncText` — fixed tokens. **The GSAP timeline (lines 57-135) needs zero changes** — it already targets `kicker`/`tagline`/`button` by reference.

---

### `src/ui/chrome/createLanguageHintToast.js` + `.css` — new toast (component, event-driven + storage flag)

**Analog:** `src/ui/intro/createPerformanceNotice.js` (verbatim shape below).

**Show/hide choreography to clone** (lines 7-33):

```js
const root = document.createElement("p"); // toast: div with two buttons instead
root.className = "performance-notice";
root.textContent = message;
root.setAttribute("aria-live", "polite");
root.hidden = true;
document.body.appendChild(root);

function show() {
  root.hidden = false;
  requestAnimationFrame(() => {
    root.classList.add("performance-notice--visible");
  });
}

function hide({ delay = 420 } = {}) {
  return new Promise((resolve) => {
    root.classList.remove("performance-notice--visible");
    window.setTimeout(() => { root.hidden = true; resolve(); }, delay);
  });
}
```

**Differences from analog (UI-SPEC TO-*):** two real buttons (`langHint.action` + dismiss, icon `phosphorX` from `src/ui/core/phosphorIcons.js`); 10 s auto-dismiss that pauses on hover/focus-within; Escape dismissal only when focus is inside; reduced-motion opacity-only; explicit `pointer-events: all` + `z-index: 1000` (the notice is `pointer-events: none` — do not inherit); repositioned `bottom: clamp(1.5rem, 5vh, 3rem)` + safe-area. CSS cloned from `performanceNotice.css` lines 1-30 (pill silhouette, `rgba(8,10,14,0.78)` bg, blur, 320ms transitions).

**Trigger guard** (all at creation time, TO-3, in this order):
1. `getStoredLanguage() === null` (first visit)
2. `getLanguage() === "bm"`
3. `!(navigator.languages ?? []).some((l) => l.startsWith("ms") || l.startsWith("id"))` (empty array = show)
4. `!getLanguageHintDismissed()`

**No subscription** (TO-8/LS-4): toast text is creation-time `t()`; it self-removes on switch. Persist dismissal only on explicit action/dismiss click — auto-timeout does NOT set the flag (A3). Do NOT add the dismissed key to `clearAllStoredPreferences()`.

**Wiring point (verified):** inside `createIntroFlow.js` `onStart`, after `revealAppUi()` (~line 62). Pass the toast creation closure into `createIntroFlow` from `main.js` (matches existing DI: loader/pipeline/renderer all passed in, `main.js:220-226`). Alternative: inside `createAppShell.revealAppUi()` — planner picks one; intro-flow DI recommended.

---

### `src/i18n/dictionaries/bm.js` / `en.js` — story + toggle/toast keys (model, static lookup)

**Analog:** existing flat-key style (`"intro.kicker": "..."`) — dots are cosmetic namespacing (`i18n.js:49-61`), keys sorted alphabetically per dictionary header convention. Add `intro.story.s1..s6` (drafts in 02-RESEARCH.md Story Draft), `intro.kicker` rewrite, `header.langAriaBm/En`, `settings.language`, `settings.langBmAria/EnAria`, `langHint.*`. Both dictionaries must get identical key sets — gate: `npm run check:i18n` after every edit (missing keys = silent EN fallback in prod). No s7 key unless prose demands it (parity gate).

---

### `src/platform/userPreferences.js` — hint-dismissed pair (service, localStorage CRUD)

**Analog:** self, look-preset pair (lines 26-44) — the exact template:

```js
const LOOK_PRESET_KEY = "threejs-punk-look-preset"; // pattern: sibling const, line 2-3 style

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

Add `LANGUAGE_HINT_DISMISSED_KEY = "threejs-punk-lang-hint-dismissed"` + `getLanguageHintDismissed()`/`setLanguageHintDismissed()` cloned from this pair. **Do NOT touch `clearAllStoredPreferences()` (lines 66-74)** — it already skips the language key; hint dismissal is not a config (TO-4).

---

### `src/main.js` / `src/app/createIntroFlow.js` — toast wiring (controller, DI)

**Analog:** existing dependency injection into `createIntroFlow` (loader, pipeline, renderer — `main.js:220-226`). Add the toast closure as one more destructured option, invoked after `revealAppUi()` in `onStart`. `src/runtime/createRenderLoop.js` MUST NOT be touched.

## Shared Patterns

### i18n subscription contract
**Source:** `src/i18n/i18n.js:78-82`; applied in `createHeader.js:50`, `createSettingsPanel.js:206`
**Apply to:** header, settings, intro overlay (new)
```js
export function subscribe(listener) {
  listeners.add(listener);
  listener({ language: currentLanguage }); // immediate sync — surfaces self-correct on restore
  return () => listeners.delete(listener);
}
```

### Persistence-on-toggle (gap the plan must own)
**Source:** `i18n.js:67-76` (setLanguage does NOT persist) + `userPreferences.js:54-64`
**Apply to:** every toggle entry point (header, settings, toast action)
```js
setStoredLanguage(next); // persist FIRST, UI layer owns storage
setLanguage(next);       // head swap + notify, early-returns on same language
```

### Dictionary values never reach innerHTML
**Source:** `createSettingsPanel.js:100-116` (D-03/D-04 comment)
**Apply to:** all new modules — static skeleton via innerHTML with hardcoded literals; dictionary strings via `textContent`/`setAttribute` only.

### Toast enter/exit choreography
**Source:** `createPerformanceNotice.js:14-29`
**Apply to:** `createLanguageHintToast.js` — hidden attr + rAF class flip in, timed class removal out, `aria-live="polite"`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none — all surfaces map to strong analogs) | | | |

Note: `navigator.languages` sniffing and the hover-pause auto-dismiss timer have no exact precedent but are small, self-contained additions inside the cloned toast shape — planner should spec them inline (RESEARCH Seam 4 covers both).

## Metadata

**Analog search scope:** `src/ui/chrome/`, `src/ui/intro/`, `src/i18n/`, `src/platform/`, `src/app/`
**Files scanned:** 10
**Pattern extraction date:** 2026-11-23
