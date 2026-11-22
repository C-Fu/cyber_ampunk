# Phase 3: Malay Narration (merged) - Pattern Map

**Mapped:** 2026-11-23
**Files analyzed:** 7
**Analogs found:** 7 / 7 (all git-tracked, verified via `git ls-files`)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/synthesize-narration.mjs` (new) | utility | file-I/O (network fetch → disk) | `scripts/check-i18n-parity.mjs` | role-match (script conventions; I/O shape from RESEARCH Pattern 4) |
| `scripts/check-narration-assets.mjs` (new) | utility (test gate) | file-I/O (validation) | `scripts/check-i18n-parity.mjs` | exact |
| `src/audio/createIntroNarration.js` (new) | service (audio factory) | event-driven (queue + pub/sub) | `src/audio/createWetFootstepAudio.js` + `src/audio/audioState.js` | exact (factory shape, mute subscription) |
| `src/ui/intro/createIntroOverlay.js` (modify) | component | event-driven (DOM/GSAP) | itself — `playExit` (lines 188-217) + `renderStory` (66-76) | exact (self-analog) |
| `src/ui/intro/introOverlay.css` (modify) | component styles | — | itself — scroll animation + `--intro-story-h` var; `src/ui/chrome/header.css:125` `--active` class convention | exact (self-analog + modifier-class convention) |
| `src/app/createIntroFlow.js` (modify) | controller (wiring) | event-driven | itself — `showLanguageHintToast` DI (lines 12, 64-67) | exact (self-analog, Phase 2 pattern) |
| `src/main.js` (modify) | config/composition root | — | itself — hint-toast closure wiring (lines ~236-244) | exact (self-analog) |

## Pattern Assignments

### `scripts/synthesize-narration.mjs` (utility, file-I/O)

**Analog:** `scripts/check-i18n-parity.mjs` (whole file, 33 lines) — the project's only Node script; copies its header-comment, plain-ESM, dictionary-import, and fail-fast `process.exit(1)` conventions.

**Script conventions** (check-i18n-parity.mjs lines 1-8, 16-28):
```js
/**
 * i18n dictionary parity check (LANG-03): BM and EN dictionaries must
 * carry identical key sets. Node-native ESM, no dependencies.
 *
 * Usage: node scripts/check-i18n-parity.mjs
 */
import { bm } from "../src/i18n/dictionaries/bm.js";

if (missingInEn.length > 0 || missingInBm.length > 0) {
  console.error(`[i18n] keys missing in en.js: ${missingInEn.join(", ")}`);
  process.exit(1);
}
console.log(`[i18n] parity OK: ...`);
```

**Apply:** same shape — import `{ bm }` from the dictionary, iterate `intro.story.l01..l49` keys, POST SSML to the Azure REST endpoint (RESEARCH Pattern 4), write `public/audio/narration/lNN.mp3` via `fs`, exit 1 with a `[narration]`-prefixed `console.error` when `SPEECH_KEY`/`SPEECH_REGION` are missing or any line fails; XML-escape line text (Security: V5). Accept a `--voice` flag (open question 1). No dependencies — Node 22 `fetch` (RESEARCH Standard Stack).

---

### `scripts/check-narration-assets.mjs` (utility, validation gate)

**Analog:** `scripts/check-i18n-parity.mjs` — exact match: same import-dictionary → assert → `process.exit(1)` gate, wired into package.json as a `check:` script (`"check:i18n": "node scripts/check-i18n-parity.mjs"`, package.json line 9; add `"check:narration"` alongside).

**Apply:** import `{ bm }`, assert `public/audio/narration/lNN.mp3` exists and is non-trivial (>1 KB) for each of the 49 keys; also grep-gate that `src/` contains no `tts.speech.microsoft` hits (VOICE-02).

---

### `src/audio/createIntroNarration.js` (service, event-driven)

**Analog:** `src/audio/createWetFootstepAudio.js` (whole file) — the canonical audio factory shape: DI args object, no-op guard return, try/catch asset load, `audioState.subscribe` mute handling, `dispose()`.

**Imports pattern** (lines 1-2):
```js
import * as THREE from "three/webgpu";
import { getAudioVolume, getIsMusicPlaying, subscribe } from "./audioState.js";
```
(Narration uses plain `new Audio()` instead of THREE.Audio — RESEARCH Standard Stack — but keeps the `subscribe` import.)

**No-DI guard / asset-load failure → no-op** (lines 26-47):
```js
export async function createWetFootstepAudio({ listener }) {
  if (!listener) {
    return { update() {}, dispose() {} };
  }
  try {
    buffers = await Promise.all(FOOTSTEP_URLS.map((url) => loader.loadAsync(url)));
  } catch (error) {
    console.warn("[audio] Footsteps disabled:", error);
    return { update() {}, dispose() {} };
  }
```
**Apply:** on first-asset fetch failure, return a factory whose `start()` routes to the Web Speech fallback (TTS-02) with the same `console.warn("[audio] ...")` prefix.

**Mute subscription pattern — the TTS-03 core** (lines 107-126):
```js
const unsubscribe = subscribe(({ isMusicPlaying, audioVolume }) => {
  enabled = isMusicPlaying;
  ...
  if (!enabled) {
    ...
    for (const sound of sounds) {
      if (sound.isPlaying) { sound.stop(); }
    }
  }
});
```
**Apply:** on `isMusicPlaying === false`: `audioEl.pause()`, reset queue index, clear highlight via the injected `onLineChange(null)`. CRITICAL (RESEARCH Pitfall 3): narration must READ the state, never call `setMusicPlaying` — `createAudioButton.js:138-178` flips it on any first interaction. Note `subscribe` fires immediately with current state (audioState.js lines 37-41) — treat the initial call accordingly.

**Dispose pattern** (lines 128-143): `unsubscribe()` + stop all playback + reset indexes; narration adds `audioEl.src = ""`.

**Returned API shape:** `{ start, stop, restart, subscribeLine, dispose }` (RESEARCH Pattern 1); queue loop uses `audioEl.onended` → `onLineChange(index)` → next line, with the Pitfall-4 watchdog (`duration * 2 + 3s`) instead of relying on `ended` alone.

---

### `src/ui/intro/createIntroOverlay.js` (modify — keepStory exit + highlight)

**Analog:** itself. Three sections to extend.

**playExit fade pattern** (lines 188-202) — add `keepStory` option; today it fades the whole root and removes it:
```js
function playExit({ duration = 0.6 } = {}) {
  return new Promise((resolve) => {
    enterTween?.kill();
    exitTween?.kill();
    exitTween = gsap.to(root, {
      opacity: 0, duration, ease: "power1.out",
      onComplete: () => { root.remove(); resolve(); },
    });
  });
}
```
**handleStart ordering** (lines 204-217) — RESEARCH Pattern 2/Pitfall 2: kick narration start synchronously here (gesture anchor) before the awaits:
```js
void (async () => {
  await playExit();
  await onStart?.();
})();
```
**Apply:** `playExit({ keepStory: true })` fades kicker/brand/rule/actions/credit individually (they are already separate `gsap.set` targets, lines 107-116) or toggles a `.intro-container--narrating` class; skip `root.remove()` when `keepStory`.

**Story line elements** (lines 66-76) — highlight targets already exist as `<p class="intro-story-line">` in `STORY_KEYS` order:
```js
function renderStory() {
  storyScroll.textContent = "";
  for (const key of STORY_KEYS) {
    const line = document.createElement("p");
    line.className = "intro-story-line";
    line.textContent = t(key);
    storyScroll.appendChild(line);
  }
  restartStoryScroll();
}
```
**Apply:** keep the line elements in an array at render time; expose `setStoryHighlight(index)` (toggles `intro-story-line--active`, RESEARCH code example) and `setScrollDuration(seconds)` (`storyScroll.style.setProperty("--intro-story-dur", ...)` then `restartStoryScroll()` — pattern already proven by lines 81-86). On `syncText`/language switch (lines 91-101): stop narration and clear highlight (Pitfall 6, simplest correct behavior).

---

### `src/ui/intro/introOverlay.css` (modify)

**Analog:** itself — two self-analogs to copy.

**CSS custom property pattern** (lines 88-92, 120):
```css
.intro-container {
  --intro-story-h: clamp(7.5rem, 22vh, 13rem);
}
...
animation: intro-story-scroll 100s linear both;
```
**Apply:** add `--intro-story-dur: 100s` to the same block and change the animation line to `animation: intro-story-scroll var(--intro-story-dur, 100s) linear both;` (RESEARCH Pattern 3).

**Active-state modifier class convention** — `src/ui/chrome/header.css:125` (comment at 124: "Active-segment values copied verbatim from `.settings-look-btn--active`"):
```css
.lang-toggle-segment--active {
  background: rgba(168, 85, 247, 0.16);
  border-color: rgba(34, 211, 238, 0.55);
  color: rgba(255, 255, 255, 0.96);
}
```
**Apply:** `.intro-story-line--active` as a `--active`-suffixed modifier of `.intro-story-line` (lines 124-134): cyan/purple accent tint (cyber palette above), slightly stronger `color`/`text-shadow`. Also add `.intro-container--narrating` rules (hide kicker/brand/actions/credit) and the source-label styles, all inside the existing `.intro-container` scope. Respect the existing `prefers-reduced-motion` block (lines 148-153).

---

### `src/app/createIntroFlow.js` (modify — DI wiring)

**Analog:** itself — the Phase 2 `showLanguageHintToast` DI is the exact pattern to replicate.

**DI param** (lines 6-13):
```js
export function createIntroFlow({
  pipeline,
  renderer,
  loaderOverlay,
  revealAppUi,
  world,
  showLanguageHintToast,
}) {
```
**Optional-chained call with guard comment** (lines 64-67, inside the `onStart` callback):
```js
// LANG-04 (TO-10): hint toast fires right after app UI reveal. The
// closure is DI'd from main.js; the toast guards itself (TO-3) and
// stays inert when the guard fails — safe under optional chaining.
showLanguageHintToast?.();
```
**Apply:** add `createIntroNarration` (or `startNarration`) to the same destructured params and call it optional-chained inside `runIntroSequence`'s `onStart` (the ENTER gesture anchor, TTS-01). The narration factory guards itself (asset-failure → fallback) exactly like the toast guards itself.

---

### `src/main.js` (modify — composition root)

**Analog:** itself — the hint-toast closure wiring (lines ~230-244):
```js
const introFlow = createIntroFlow({
  pipeline,
  renderer,
  loaderOverlay,
  revealAppUi: () => { ... },
  world,
  // LANG-04: the toast guards itself (TO-3) and never shows when the
  // guard fails; creation-time t() only (TO-8).
  showLanguageHintToast: () => {
    const toast = createLanguageHintToast();
    if (shouldShowHint()) { toast.show(); } else { toast.destroy(); }
  },
});
```
**Apply:** add a sibling closure, e.g. `startNarration: () => createIntroNarration({ ... })` (async, like `appShell.initAudio()` at line ~216 which awaits audio factories). Import the factory at the top of main.js following the existing import grouping. Never call `setMusicPlaying` here (Pitfall 3).

---

## Shared Patterns

### audioState pub/sub (mute kill)
**Source:** `src/audio/audioState.js:37-41` + subscriber shape from `createWetFootstepAudio.js:107-126`
**Apply to:** `createIntroNarration.js`
```js
export function subscribe(listener) {
  listeners.add(listener);
  listener({ audioVolume, isMusicPlaying });
  return () => listeners.delete(listener);
}
```
One-way read; `false` → stop narration + clear highlight; never write `setMusicPlaying`.

### Node script gate conventions
**Source:** `scripts/check-i18n-parity.mjs` (whole file) + `package.json:9`
**Apply to:** both new `scripts/*.mjs` — header JSDoc with usage line, dictionary import, `[prefix]` console messages, `process.exit(1)` on failure, wire as `check:*` npm script.

### DI closure + optional chaining
**Source:** `createIntroFlow.js:64-67`, `main.js:236-244`
**Apply to:** narration wiring — guard itself, call optional-chained, comment the contract.

### Modifier-class active state (`--active` suffix)
**Source:** `src/ui/chrome/header.css:125`
**Apply to:** `.intro-story-line--active` in `introOverlay.css`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/synthesize-narration.mjs` (network half) | utility | request-response (Azure REST) | No existing network-call script in `scripts/`; use RESEARCH.md Pattern 4 (SSML REST shape) + check-i18n conventions for structure |

## Metadata

**Analog search scope:** `scripts/`, `src/audio/`, `src/ui/intro/`, `src/ui/chrome/`, `src/app/`, `src/main.js`
**Files scanned:** 10 (7 in full)
**All analog paths verified git-tracked** (`git ls-files` non-empty)
**Pattern extraction date:** 2026-11-23
