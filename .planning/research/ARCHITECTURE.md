# Architecture Patterns — i18n + TTS Layer for Cyberpunk Malaya

**Domain:** Localization (BM default / EN toggle) + browser TTS narration for a no-framework Three.js WebGPU factory-composition codebase
**Researched:** 2026-11-22
**Mode:** Architecture (codebase-grounded; findings verified against source files listed in Sources)

## Recommended Architecture

Add **two new leaf/cross-cutting modules** and **one UI feature factory**, wired from the existing composition root. No framework, no build tooling, no TypeScript.

```text
src/platform/userPreferences.js     (existing — extend with language key)
        │
        ▼
src/i18n/i18n.js  ◄── src/i18n/dictionaries/bm.js, en.js   ← module-scope store +
        │                                                      subscribe()/notify() pub/sub
        │  t(key), setLanguage(lang), getLanguage(), subscribe(cb), applyStaticHtml()
        ▼
src/ui/** factories (createSettingsPanel, createIntroOverlay, createWalkPrompt, …)
   └─ each factory gains a string→key refactor + an i18n subscription that
      re-runs its local render/sync function on language change

src/i18n/staticHead.js  → data-i18n attributes in index.html, applied at boot

src/audio/createIntroNarration.js  (factory, same shape as createWetFootstepAudio)
   └─ created inside createIntroFlow.runIntroSequence(), driven by introOverlay
      onStart + rainGlassIntro fadeOut timeline; gated by audioState + FEATURES.audio
```

### Component Boundaries

| Component | Responsibility | Location | Communicates With |
|-----------|----------------|----------|-------------------|
| `i18n` store | Hold current language (module singleton, `"bm"` default), expose `t(key, vars?)`, `setLanguage`, `getLanguage`, `subscribe`, `onLanguageChange` side effects (`document.documentElement.lang`, localStorage persist) | `src/i18n/i18n.js` | dictionaries, `userPreferences.js`, all UI factories, staticHead |
| Dictionaries | Plain exported objects: nested-by-module keys → strings (BM/EN). One file per language | `src/i18n/dictionaries/bm.js`, `src/i18n/dictionaries/en.js` | `i18n.js` only |
| `applyStaticHead` / `data-i18n` | Translate static `index.html` text (title, meta, noscript, og/twitter/JSON-LD) and set `lang` attribute | `src/i18n/staticHead.js` + `index.html` attributes | `i18n.js`, called from `src/main.js` before loader overlay creation |
| Loader overlay statuses | Status lines currently hardcoded in `src/main.js` (`"BOOTING SCENE"` etc.) become `t("loader.bootingScene")` lookups at call time | `src/main.js` + `src/app/createLoaderOverlay.js` (`"LINK FAILED"`, aria-labels) | `i18n.js` |
| Language toggle UI | New section in settings panel; calls `i18n.setLanguage` | `src/ui/chrome/createSettingsPanel.js` | `i18n.js` |
| Intro narration (TTS) | Speak the BM/EN intro story via `speechSynthesis`; handle voice resolution (local `ms-MY` voice, else remote fetch fallback); cancel on skip; expose `start/skip/destroy` | `src/audio/createIntroNarration.js` | `audioState.js`, `i18n.js`, `createIntroFlow.js` |
| Remote voice loader | Fetch/cache a Malay voice asset if platform has none (separate module so the fallback strategy can be swapped) | `src/audio/loadNarrationVoice.js` | `createIntroNarration.js` only |
| Narration strings | Intro story copy (BM KL-cyberpunk rewrite + EN) as dictionary keys under `intro.*`; narration reads the same keys the overlay renders | `src/i18n/dictionaries/*.js` | shared by overlay + TTS — single source of truth |

### Data Flow

**Boot:**
1. `index.html` loads → `src/main.js` `init()` starts.
2. First (before `createLoaderOverlay`): import `i18n` — module init reads stored language from `userPreferences.getStoredLanguage()` (new function, same pattern as `getStoredLookPreset`), defaults `"bm"`. `i18n` notifies subscribers immediately (same contract as `audioState.subscribe`, which calls the listener once on registration — see `src/audio/audioState.js:37-41`).
3. `applyStaticHead()` rewrites `index.html` head/body text via `data-i18n` attributes and sets `<html lang>`.
4. Every subsequent `loaderOverlay.setStatus(t("loader.…"))` in `src/main.js:62-111` renders in the active language from the start — no flash of English.

**Language switch (runtime):**
1. Settings toggle → `i18n.setLanguage("en")`.
2. `i18n` persists via `userPreferences.setStoredLanguage`, sets `document.documentElement.lang`, notifies subscribers.
3. Each subscribed UI factory re-runs its own text sync (details below). GSAP-animated elements already mounted (intro letters, HUD) do NOT re-split mid-animation — the intro is one-shot and language is BM-default from boot, so live re-render during the intro is explicitly out of scope; the subscription contract only guarantees correctness for post-reveal chrome.

**TTS narration:**
1. `createIntroFlow.runIntroSequence()` (`src/app/createIntroFlow.js:33`) creates `introNarration = createIntroNarration({ audioState-ish deps, getLanguage: () => i18n.getLanguage() })` after the overlay is created.
2. Narration starts when the ENTER button becomes enabled (i.e., text reveal done) — same trigger point the overlay already exposes via its `playEnter` completion / button `disabled = false`. It is **not** autoplayed before user gesture: Web Speech `speechSynthesis.speak` is blocked by autoplay policy exactly like `audio.play()`, and the ENTER click is the guaranteed gesture. This mirrors how `createAudioButton.startOnFirstInteraction` handles audio unlock (`src/ui/chrome/createAudioButton.js:137-143`).
3. Narration pauses/ducks nothing in the render loop — zero changes to `src/runtime/createRenderLoop.js`.
4. On `onStart` (ENTER clicked): narration keeps speaking through the glass fade (it is the story voiceover), and is cancelled when `revealAppUi` fires or the user mutes via the audio button — subscribe to `audioState` (`setMusicPlaying`) and `cancel()` on mute, restart on unmute, matching how the audio button syncs (`createAudioButton.js:169-177`).
5. `destroy()` cancels `speechSynthesis`, removes listeners. Intro is one-shot, so teardown is trivial.

## Patterns to Follow

### Pattern 1: Module-scope pub/sub store (copy `audioState.js` verbatim)

**What:** A leaf module holding `let currentLanguage` + `const listeners = new Set()` with `get/set/subscribe` named exports.
**When:** Any cross-cutting runtime state that UI observes.
**Why:** This is the *only* sanctioned global-store pattern in the codebase — CONVENTIONS.md explicitly lists `audioState.js` (`src/audio/audioState.js` — pub/sub with `subscribe()`/`notify()`) as one of the allowed global mutable modules, alongside `performanceProfile` and `FEATURES`. Adding a fourth store of identical shape is consistent; adding a reactive framework is not.

```javascript
// src/i18n/i18n.js — sketch (shape only)
import { bm } from "./dictionaries/bm.js";
import { en } from "./dictionaries/en.js";
import { getStoredLanguage, setStoredLanguage } from "../platform/userPreferences.js";

const DICTIONARIES = { bm, en };
const listeners = new Set();
let currentLanguage = getStoredLanguage() ?? "bm";

function notify() {
  for (const listener of listeners) {
    listener({ language: currentLanguage });
  }
}

export function t(key, vars = {}) {
  // dot-path lookup into DICTIONARIES[currentLanguage], fall back to en, then key
}

export function setLanguage(language) {
  if (!DICTIONARIES[language] || language === currentLanguage) return;
  currentLanguage = language;
  setStoredLanguage(language);
  document.documentElement.lang = language === "bm" ? "ms" : "en";
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);
  listener({ language: currentLanguage }); // immediate sync, like audioState
  return () => listeners.delete(listener);
}
```

**Layering note:** `src/i18n/` sits beside `src/platform/` as a leaf layer (its only internal dep is `userPreferences`, itself a leaf). No circular imports — `platform → i18n → ui/app/main` matches the existing acyclic layering documented in `.planning/codebase/ARCHITECTURE.md`.

### Pattern 2: Per-factory text sync + subscription (lookup, not injection)

**What:** Each `createX` UI factory keeps its DOM template but replaces literal strings with `t("ns.key")`, then exposes/uses an internal `syncText()` invoked once at construction and again on `i18n.subscribe`.
**When:** Every factory that renders user-visible text.
**Why not injected strings:** factories here self-mount to `document.body` and self-wire events (`createAboutPanel.js`, `createWalkPrompt.js`); passing a pre-resolved strings object would freeze language at creation time and break the runtime toggle. A live `t()` lookup plus re-sync keeps the factory self-contained and requires no changes to `createAppShell.js` wiring.
**Why not full teardown/rebuild:** factories bind document-level listeners (`keydown`, `pointerlockchange`) and GSAP timelines; re-running them mid-session risks listener leaks and animation state loss for zero benefit — text swaps are cheap.

```javascript
// inside createWalkPrompt.js — current syncCopy (src/ui/walk/createWalkPrompt.js:41-51)
// becomes:
import { t } from "../../i18n/i18n.js";
import { subscribe as subscribeLanguage } from "../../i18n/i18n.js";

function syncCopy() {
  if (isCoarsePointerDevice()) {
    titleEl.textContent = t("walkPrompt.dragToLook");
    root.setAttribute("aria-label", t("walkPrompt.dragToLook"));
    ...
  } else {
    titleEl.textContent = t("walkPrompt.clickToLook");
    ...
  }
}
const unsubscribeLanguage = subscribeLanguage(syncCopy); // add to destroy()
```

**Existing sync hooks make this nearly free:** `createWalkPrompt.syncCopy`, `createSettingsPanel.syncLookPreset/syncDevelopmentMode`, `createAboutPanel.syncRecommendedVisibility` already exist as re-runnable functions called on open/subscribe. Factories without one (header, HUD, move hint, walk controls hint, intro overlay) need a small `syncText()` added that sets `textContent`/`aria-label` on cached element refs.

**innerHTML templates:** factories build DOM from `innerHTML` template literals (`createAboutPanel.js:21-89` is the biggest block). Recommended migration: keep the template, but split long copy into key'd spans (`<p class="about-lead" data-i18n="about.lead1"></p>`) and have `syncText()` do `for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);`. This handles multi-paragraph copy without string-concatenating HTML in the dictionary (XSS-safe by construction — never `innerHTML` dictionary content).

**Strings from non-UI callers:** loader statuses in `src/main.js` (`"BOOTING SCENE"` etc. at `src/main.js:62,69,74,111`) and `createLoaderOverlay.fail()` (`"LINK FAILED"`, `"Failed to load"` aria) call `t()` at call time — no subscription needed since each call re-renders. Look preset labels (`src/post/look/cyberpunkLook.js` `label` fields) are data, not UI; map them to `t("look.neutral")` etc. when building `LOOK_OPTIONS` in `src/app/createAppShell.js:37-68`, and have `createSettingsPanel.syncLookPreset` also refresh button labels via `data-i18n` spans.

**Native dialogs:** the `window.confirm` in `createSettingsPanel.js:153-155` takes its message from `t("settings.resetConfirm")` at call time. `window.alert`/`confirm` are not translatable retroactively — always pass translated text in.

### Pattern 3: `data-i18n` on `index.html` static text

**What:** Add `data-i18n="meta.title"` etc. to title/meta/noscript elements; a boot-time `applyStaticHead()` sets `textContent`/`content` from the dictionary. Meta tags use `setAttribute("content", t(key))`.
**When:** Anything in `index.html` users or crawlers see.
**Caveats (opinionated):**
- `<html lang>` must be set by `i18n` init (before first paint is impossible with a module script at end of body — acceptable for this demo; SEO bots mostly read the static English/BM markup. Given BM-default, consider hardcoding the BM title/description directly in `index.html` as the static baseline and letting `applyStaticHead` swap to EN when the stored preference is English. Static-first beats JS-only for the default audience.)
- Open Graph / Twitter / JSON-LD: translate `og:title`, `og:description`, twitter equivalents, and the JSON-LD `name`/`description`. Keep canonical URL unchanged.
- `<noscript>` text: translate statically (JS never runs there) — hardcode BM.

### Pattern 4: TTS factory mirroring the audio factory contract

**What:** `createIntroNarration({ getLanguage, isAudioEnabled })` returning `{ start, cancel, destroy }`, built on `window.speechSynthesis`.
**When:** Intro sequence only.
**Sketch of integration in `src/app/createIntroFlow.js:33-68`:**

```javascript
rainGlassIntro = createRainGlassIntro({ pipeline });
const narration = createIntroNarration({ getLanguage: () => i18n.getLanguage() });

const introOverlay = createIntroOverlay({
  onNarrationReady: () => narration.start().catch(() => {}), // when ENTER enables
  onStart: async () => {
    /* existing sequence; narration continues through fade */
    revealAppUi();
    narration.stop(); // story ends with the reveal
  },
});
```

**Key decisions:**
- **Never touch the render loop.** Narration is event-driven (intro overlay callbacks + `audioState` subscription), so `src/runtime/createRenderLoop.js` stays untouched — AGENTS.md routing keeps per-frame work out of UI/audio concerns.
- **Autoplay policy:** do not attempt to speak before the ENTER click. `speechSynthesis.speak()` outside a user gesture is blocked in Chrome/Safari exactly like `audio.play()`. The ENTER click is the gesture. (Alternative considered: speak on overlay mount — rejected; it silently fails everywhere.)
- **Voice resolution (the ms-MY risk):** `createIntroNarration` resolves a voice in order: (1) `speechSynthesis.getVoices().find(v => v.lang startsWith "ms")`, (2) wait for `voiceschanged` event (voices load async in Chrome), (3) fallback: `loadNarrationVoice.js` fetches a remote Malay voice (e.g., a hosted WAV/MP3 + subtitle-synced playback, or a WASM TTS bundle) — kept in its own module so the strategy is swappable. If everything fails: degrade silently (`console.warn("[narration] ...")`), intro text still tells the story — matches the "best-effort subsystems log-and-continue" convention (`createWetFootstepAudio.js` precedent).
- **Audio-button gating:** subscribe to `audioState` (`src/audio/audioState.js` `subscribe`/`setMusicPlaying`) — mute → `speechSynthesis.cancel()`; unmute during intro → restart from current story segment (or simply cancel-only if segment tracking is too complex; cancel-only is the recommended MVP).
- **FEST (feature flag):** add `narration: true` to `FEATURES` (`src/world/features.js`) — hmm, FEATURES is world-scoped; better: gate on `FEATURES.audio` which already gates the audio button. If a separate kill-switch is wanted, a module-level `const NARRATION_ENABLED = true` in `createIntroNarration.js` returning `null` when off, honoring the nullable-feature contract.

## Anti-Patterns to Avoid

### Anti-Pattern 1: i18n framework (i18next, vue-i18n, svelte-i18n, formatjs)
**What:** `npm install i18next` for a two-language toggle.
**Why bad:** violates AGENTS.md "no new frameworks" spirit, adds runtime + build weight to a demo that ships zero i18n deps today, and its reactivity model (DOM re-binding, ICU formatters) fights the hand-rolled factory pattern. Two flat dictionaries + a 60-line store cover 100% of requirements (BM/EN, toggle, persist).
**Instead:** Pattern 1 above. If pluralization/gender ever appears (BM/EN have trivial plural rules), extend `t(key, vars)` with a `{count}` formatter — still no dependency.

### Anti-Pattern 2: Full teardown/rebuild of the UI on language change
**What:** Destroying and recreating `appShell` when language toggles.
**Why bad:** `createAppShell` wires cameraDirector, inspectorSession, audio init (`createAppShell.js:70-277`); rebuilding it re-triggers audio setup, loses panel state, and risks duplicate document-level listeners in factories whose `destroy()` is not uniformly called. GSAP timelines in `createIntroOverlay` cannot be safely re-run.
**Instead:** per-factory `syncText()` + `i18n.subscribe` (Pattern 2). Language toggle cost: a few dozen `textContent` writes.

### Anti-Pattern 3: Strings injected as factory options
**What:** `createHeader({ strings: { about: "Tentang" } })`.
**Why bad:** freezes language at construction; every future `setLanguage` needs the orchestrator to know which factories took strings and re-call them — recreates the teardown problem one level up.
**Instead:** factories import `t` directly (it's a leaf module, import-safe everywhere) and subscribe.

### Anti-Pattern 4: Rendering dictionary content via innerHTML
**What:** `el.innerHTML = t("about.lead1")`.
**Why bad:** dictionary strings become HTML injection surface; also breaks the `data-i18n` scanning pattern.
**Instead:** always `textContent` (or `setAttribute` for aria/meta).

### Anti-Pattern 5: TTS polled from the render loop
**What:** Checking narration state each frame in `createRenderLoop.js`.
**Why bad:** render loop is perf-critical with a fixed update order (AGENTS.md file routing table); narration is purely event-driven.
**Instead:** intro-overlay callbacks + `audioState` subscription (Pattern 4).

### Anti-Pattern 6: Translating at build time only
**What:** Vite i18n plugin generating per-language bundles.
**Why bad:** runtime toggle requirement (BM ⇄ EN in settings) demands a single bundle with both dictionaries; build-time split forces a reload and doubles bundle variance.
**Instead:** both dictionaries statically imported (they're small — a few KB each; `three` is ~1MB, this is noise).

## Scalability Considerations

| Concern | 2 languages (now) | 5 languages | RTL / CJK |
|---------|-------------------|--------------|-----------|
| Dictionary size | ~150 keys, ~10KB total — import both statically | Consider `import()` lazy chunks per language | Same store; add `dir` handling in `setLanguage` |
| Lookup cost | O(depth) dot-path on tiny objects — negligible | Same (flat-compile keys to a Map if profiling ever shows up — it won't) | — |
| UI re-sync | ~15 factories × `syncText()` | Same — pattern is per-factory, orthogonal to language count | CSS `:dir()` / logical properties in the co-located CSS files |
| TTS voices | ms-MY resolution + EN fallback | Per-language voice resolution table | `speechSynthesis` handles utterance lang per language code |

(Not a roadmap requirement beyond BM/EN — included only to show the pattern doesn't paint into a corner.)

## Integration Points for the Roadmap

Exact seams the i18n + TTS work touches, by file:

| File | Change |
|------|--------|
| `src/i18n/i18n.js` (new) | store: `t`, `setLanguage`, `getLanguage`, `subscribe` |
| `src/i18n/dictionaries/bm.js`, `en.js` (new) | all copy, namespaced: `loader.*`, `intro.*` (story + narration share keys), `settings.*`, `about.*`, `walkPrompt.*`, `moveHint.*`, `walkControls.*`, `hud.*`, `header.*`, `performanceNotice.*`, `look.*` |
| `src/i18n/staticHead.js` (new) | `data-i18n` applier for `index.html` |
| `index.html` | `data-i18n` attributes + BM static baseline + `lang="ms"` |
| `src/platform/userPreferences.js` | `getStoredLanguage`/`setStoredLanguage` (copy look-preset pattern; add to `clearAllStoredPreferences`) |
| `src/main.js` | `t()` for the four `setStatus` calls (lines 62/69/74/111); ensure `i18n` import ordering before `createLoaderOverlay` |
| `src/app/createLoaderOverlay.js` | `t()` for `"LINK FAILED"`, aria-labels in `syncAriaLabel`/`fail` |
| `src/ui/chrome/createSettingsPanel.js` | language toggle section + label sync in `syncLookPreset`-style hook + translated `confirm` message |
| `src/ui/chrome/createAboutPanel.js` | `data-i18n` spans for the copy block (largest single migration) |
| `src/ui/chrome/createHeader.js` | aria-labels via `syncText()` |
| `src/ui/chrome/createAudioButton.js` | aria-label only (`t("audio.toggle")`) |
| `src/ui/walk/createWalkPrompt.js`, `createMoveHint.js`, `createWalkControlsHint.js`, `createHudPanel.js` | `syncText()` + subscription (walkPrompt already has `syncCopy`) |
| `src/ui/intro/createIntroOverlay.js` | story keys for kicker/tagline/button; letters split already reads `textContent` so `t()` feeds it naturally |
| `src/ui/intro/createPerformanceNotice.js` | default message via `t("performanceNotice.adjusting")` |
| `src/app/createAppShell.js` | `LOOK_OPTIONS` labels via `t()` (or move label resolution into settings panel render) |
| `src/app/createIntroFlow.js` | create/start/stop `createIntroNarration` inside `runIntroSequence` |
| `src/audio/createIntroNarration.js` (new) | speechSynthesis factory |
| `src/audio/loadNarrationVoice.js` (new, optional phase 2) | remote Malay voice fallback |
| `src/audio/audioState.js` | unchanged (narration subscribes, does not extend it — narration is not "music") |

**NOT touched:** `src/runtime/createRenderLoop.js`, `src/world/**`, `src/post/**`, `src/tsl/**`, `src/bootstrap/**`, `src/controls/**` — the i18n layer is UI/app-scoped. This satisfies the AGENTS.md quality gate: three/webgpu/tsl imports unaffected, factory composition preserved, no frameworks, verification checklist (build + dev WebGPU + rain collision) unaffected by design.

## Sources

- `src/audio/audioState.js` — pub/sub store pattern to replicate (HIGH, verified read)
- `src/platform/userPreferences.js` — localStorage persistence pattern to extend (HIGH, verified read)
- `src/ui/chrome/createAudioButton.js` — autoplay-policy handling + audioState subscription pattern (HIGH, verified read)
- `src/app/createIntroFlow.js` — intro lifecycle and narration integration seams (HIGH, verified read)
- `src/ui/intro/createIntroOverlay.js` — GSAP letter-split constraints, `onStart` contract (HIGH, verified read)
- `src/app/createAppShell.js` — factory wiring, LOOK_OPTIONS label source (HIGH, verified read)
- `src/ui/chrome/createSettingsPanel.js`, `createAboutPanel.js`, `createHeader.js`; `src/ui/walk/createWalkPrompt.js`, `createMoveHint.js`, `createWalkControlsHint.js`, `createHudPanel.js`; `src/ui/intro/createPerformanceNotice.js`; `src/app/createLoaderOverlay.js`; `index.html`; `src/main.js` — string-site inventory (HIGH, verified read/grep)
- `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `CONVENTIONS.md` — layering, naming, allowed globals (HIGH, project artifacts)
- `.planning/PROJECT.md` — requirements: BM default, EN toggle, TTS narration, ms-MY voice risk (HIGH, project artifact)
- Web Speech API autoplay/voice-loading behavior — MEDIUM, standard platform knowledge; verify `voiceschanged` + gesture-gating behavior per-target-browser during implementation phase (flagged as phase-level verification, not architecture risk)

---

*Architecture research: 2026-11-22*
