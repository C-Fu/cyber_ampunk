---
phase: 03-malay-tts-narration
plan: 02
status: complete
completed: 2026-11-23
subsystem: audio-intro-ui
tags: [narration, tts-fallback, intro-overlay, i18n, gesture-anchor]
requires: [03-01 narration assets (l01..l49.mp3 + narration-cue.json), Phase 2 intro overlay, audioState pub/sub]
provides: [createIntroNarration playback factory, keepStory overlay exit, per-line highlight, replay button, intro.voice.* dictionary keys, cue-driven scroll duration]
affects: [end-of-phase human verify (browser matrix), verify-work]
tech-stack:
  added: []
  patterns: [audio-factory DI shape (createWetFootstepAudio analog), one-way audioState subscribe (mute trap), sync gesture-anchored start, sentence-chunked SpeechSynthesisUtterance chain]
key-files:
  created:
    - src/audio/createIntroNarration.js
  modified:
    - src/ui/intro/createIntroOverlay.js
    - src/ui/intro/introOverlay.css
    - src/app/createIntroFlow.js
    - src/main.js
    - src/i18n/dictionaries/bm.js
    - src/i18n/dictionaries/en.js
decisions:
  - "Gesture anchor implemented as overlay onStart invoked synchronously before playExit awaits; post-ENTER app-reveal sequence moved to a new onExited callback so keepStory and the glass fade/DoF restore both survive"
  - "Browser-TTS fallback sticks after first asset failure (assetFailedAt watermark) — replay does not re-churn dead assets"
  - "Mute UI state (label dim + replay disable) driven from a separate audioState subscribe in main.js setupNarration; the narration factory itself never imports the music setter (TTS-03 trap honored)"
metrics:
  duration: ~40min
  tasks: 3
  completed: 2026-11-23
commits: 3
plan_head_before: ccfe490cc2a6f7b0a752afd69ee4689b18aa29cd
plan_head_after: 8ac979b412df837c4027d0749f765d86c3a93500
actuals:
  tokens: 62000
  tasks: 3
  commits: 3
---

# Phase 03 Plan 02: Narration Playback Wiring Summary

End-to-end BM narration: per-line Audio queue factory with mute-trap-safe audioState subscription and browser-TTS fallback, keepStory overlay exit with per-line cyan highlight, replay button, three-state localized source label, and cue-driven 260.88s story scroll.

## What was built

### Task 1 — Narration factory + gesture anchor + keepStory exit (`10ccc4d`)

- **`src/audio/createIntroNarration.js`** (new): single-`Audio` per-line queue over `/audio/narration/lNN.mp3`; one-way `audioState.subscribe` that pauses, resets the queue, and clears the highlight on `isMusicPlaying === false` — **never writes music state** (TTS-03 trap, negative grep green). Watchdog (`duration*2+3s` from cue, 12s default) skips stalled `ended`. TTS-02 fallback: sentence-chunked (`(?<=[.!?])\s+` split, 250-char cap) `SpeechSynthesisUtterance` chain with `ms-MY` lang; graded text-only floor with `onSourceChange("unavailable")` when `speechSynthesis` is absent. Exposes `{ start, stop, restart, dispose }` + disabled no-op shape when misconfigured.
- **`createIntroOverlay.js`**: `playExit({ keepStory })` fades only kicker/brand/rule/ENTER/credit and skips `root.remove()`; new `onExited` callback preserves the original post-ENTER app-reveal sequence (performance notice, glass fade, DoF restore, UI reveal, hint toast) — moved to `createIntroFlow.js`. `handleStart` invokes `onStart` (narration start) synchronously at the top of the click handler **before any await** (Pitfall 2 gesture anchor). `setStoryHighlight(index)` keeps exactly zero-or-one `.intro-story-line--active` (HL-2/HL-3); line elements are tracked in `storyLineEls` and rebound after every `renderStory()` (HL-4); `onLanguageSwitchDuringPlayback` stops narration and clears highlight (Pitfall 6). `setScrollDuration(seconds)` sets `--intro-story-dur` and restarts the scroll.
- **`introOverlay.css`**: `--intro-story-dur: 100s` var consumed by the scroll keyframes; `.intro-story-line--active` cyan accent (`var(--cyber-text)` + cyan bloom shadow, H-3), idle lines dimmed to `rgba(255,255,255,0.55)`, 300ms color/opacity/text-shadow transitions, no geometry change (H-1).
- **`main.js` + `createIntroFlow.js`**: `setupNarration(overlay)` DI — main.js builds the factory (bm story keys, lNN URL builder, per-line cue watchdog map, highlight/source callbacks) and returns `{ start, stop, restart }`; the flow calls `start()` synchronously inside the ENTER gesture window.

### Task 2 — Replay button + localized source label (`1c058ed`)

- `intro.voice.replay` / `intro.voice.sourceAsset` / `intro.voice.sourceTts` / `intro.voice.sourceNone` added to both dictionaries with exact copy-table strings — parity 142 keys, `check:i18n` green.
- Replay `<button>` after ENTER in `.intro-actions`: 44px/40px circular Phosphor `arrow-counter-clockwise` glyph, `.intro-button` glass family verbatim, cyan-glow hover (R-1), `:focus-visible` outline (RP-3), disabled-quiet opacity 0.4 while muted/idle/unavailable (R-1/MU-3); click resets scroll and calls narration `restart()` (RP-4).
- Source `<p>` under the story window: always rendered (opacity swap, H-2), re-derives from language + source state in `syncText` (SL-4), cyan at opacity 0.6 only in the unavailable state (SL-3), dims to 0.4 when muted (MU-2).
- Mute visual state driven by a second read-only `audioState.subscribe` in `setupNarration` calling `introOverlay.setNarrationMuted`.

### Task 3 — Scroll tuning + queue hardening (`8ac979b`)

- `main.js` fetches `narration-cue.json` (static file, VOICE-02 compliant), validates all 49 durations, sums to **260.88s**, and passes the per-line map (watchdogs) + total (`setScrollDuration`) at setup; any missing/non-numeric duration falls back to the CSS default 100s.
- Queue hardening: once an asset failure occurs at line N, `assetFailedAt` watermark keeps lines ≥ N on the fallback path across replays instead of re-churning the dead asset.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Overlay refactor needed a new exit callback**
- **Found during:** Task 1
- **Issue:** The plan routed the whole `onStart` body into narration start, but the existing `onStart` also carried the app-reveal sequence (glass fade, DoF restore, `revealAppUi`). Replacing it would have silently dropped the reveal.
- **Fix:** Split into synchronous `onStart` (gesture-anchored narration start) + async `onExited` (app reveal after keepStory exit). Behavior preserved.
- **Files modified:** `src/ui/intro/createIntroOverlay.js`, `src/app/createIntroFlow.js`

**2. [Rule 1 - Bug] Stray duplicated `createIntroFlow` call block in main.js**
- **Found during:** Task 1 build
- **Issue:** An Edit left a duplicated `const introFlow = createIntroFlow({` fragment — build parse failure.
- **Fix:** Removed the fragment; `node --check` + build green.
- **Commit:** `10ccc4d`

## Verification (automated gates)

| Gate | Result |
|------|--------|
| `npm run build` | green (all 3 tasks) |
| `npm run check:i18n` | 142-key parity bm/en |
| `npm run check:narration` | 49 assets + cue coverage + VOICE-02 grep green |
| `grep setMusicPlaying src/audio/createIntroNarration.js` | 0 hits (TTS-03) |
| `grep tts.speech.microsoft src/` | 0 hits (VOICE-02) |
| `createRenderLoop.js` / `src/tsl/` / post stack | untouched (diff confirmed) |

Manual browser-matrix items (highlight-audio sync, DevTools network-block fallback, mute timing, replay) are routed to the end-of-phase human verify per 03-VALIDATION.md.

## Known Stubs

None. All source-state paths are wired (bundled asset / device TTS / unavailable); no placeholder or unreachable branches.

## Coverage

| Requirement | Evidence |
|-------------|----------|
| TTS-01 | `handleStart` invokes narration start synchronously before playExit awaits; factory `start()` calls `play()` in the same task |
| TTS-02 | sentence-chunked utterance chain on asset `error`/play-rejection; `unavailable` floor when speechSynthesis absent; label swaps state |
| TTS-03 | one-way subscribe; negative grep 0 hits; mute pauses, resets queue, clears highlight; never writes music state |
| TTS-04 | three-state label from `intro.voice.*` in both dictionaries, re-synced on language change (SL-4) |
| TTS-05 | `.intro-story-line--active` zero-or-one, HL-4 rebind after renderStory, cleared at end/mute (HL-2/HL-3) |
| TTS-06 | replay restarts from l01 with highlight + scroll reset; disabled-quiet while muted (RP-4/MU-3) |

## Self-Check: PASSED

- Commits `10ccc4d`, `1c058ed`, `8ac979b` all ancestors of HEAD (`8ac979b`) ✓
- All 7 modified/created files on disk, build green, no stub patterns ✓
- 3 commits measured from ledger `ccfe490..8ac979b` ✓
