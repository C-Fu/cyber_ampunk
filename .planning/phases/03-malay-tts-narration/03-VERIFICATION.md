---
phase: 03-malay-tts-narration
verified: 2026-11-23T12:00:00Z
status: human_needed
score: 6/10 must-haves verified
covered_files: [".planning/phases/03-malay-tts-narration/03-01-PLAN.md", ".planning/phases/03-malay-tts-narration/03-01-SUMMARY.md", ".planning/phases/03-malay-tts-narration/03-02-PLAN.md", ".planning/phases/03-malay-tts-narration/03-02-SUMMARY.md", "package.json", "scripts/check-narration-assets.mjs", "scripts/synthesize-narration.mjs", "src/app/createIntroFlow.js", "src/audio/createIntroNarration.js", "src/i18n/dictionaries/bm.js", "src/i18n/dictionaries/en.js", "src/main.js", "src/ui/intro/createIntroOverlay.js", "src/ui/intro/introOverlay.css"]
covered_digest: "v4:sha256:1997fba596f88064cf95869d628d11346f77e8f80f848fa703e9025d61df064b"
behavior_unverified: 4
overrides_applied: 0
behavior_unverified_items:
  - truth: "Narration starts only from the ENTER click, synchronously inside the gesture handler, and never before a gesture (TTS-01, D-05)"
    test: "Fresh load with sound on → confirm silence before ENTER → click ENTER → narration begins with line 1 highlighted"
    expected: "No audio before the click; first line audible immediately after the click"
    why_human: "Gesture-window playback is runtime browser behavior; no automated test exercises it"
  - truth: "The spoken story line is highlighted in the intro overlay in exact sync with the per-line audio, one line active at a time, and the highlight clears at story end (TTS-05, D-03, HL-2/HL-3)"
    test: "Listen + watch during full 49-line playback; also switch language mid-playback (HL-4 rebind) and confirm highlight rebinds"
    expected: "Highlighted line always matches the audible voice; exactly one active; clears at l49 end and after language switch"
    why_human: "Audio-visual sync is perceptual; no behavioral test exists"
  - truth: "Muting via the existing audio button kills narration immediately and clears the highlight; narration never writes music state (TTS-03, D-05)"
    test: "During narration, click the audio mute button"
    expected: "Speech stops instantly, highlight clears, ambience/music state unaffected by narration"
    why_human: "Real-time audio state transition; grep proves one-way subscribe but not the runtime timing"
  - truth: "A replay button in the actions row restarts narration from l01 with highlight and scroll reset; disabled-quiet while muted (TTS-06, D-05, RP-4, MU-3)"
    test: "Mid-narration click replay; separately, mute and inspect the replay button state"
    expected: "Restart from l01, highlight + scroll reset in the same frame; replay disabled at 0.4 opacity while muted"
    why_human: "Audio runtime + visual disabled state"
  - truth: "A source label under the story window names the active source (bundled / device TTS / unavailable) and re-syncs on language change (TTS-04, SL-2/SL-4)"
    test: "Normal load → label shows 'SUARA: AUDIO PRA-RAKAM'; block /audio/narration/* in DevTools → label swaps to 'SUARA: TTS PERANTI'; toggle language → label re-syncs"
    expected: "Three-state localized label; cyan only in unavailable state"
    why_human: "Visual + network-block simulation"
  - truth: "If the bundled asset fails to load, sentence-chunked browser TTS takes over with the label swapped — no error chrome (TTS-02, D-04)"
    test: "DevTools network-block public/audio/narration/* → reload → ENTER"
    expected: "Fallback narration plays via device TTS with sentence chunks, label swapped, no error UI"
    why_human: "Requires network blocking + audio runtime"
human_verification:
  - test: "Full manual browser matrix per 03-VALIDATION.md: pre-ENTER silence, ENTER-start, highlight-audio sync across l01..l49, mute timing, replay restart, language switch mid-playback, DevTools network-block fallback, source-label three states"
    expected: "All TTS-01..06 behaviors behave as specified in 03-VALIDATION.md's manual matrix"
    why_human: "Audio playback, sync, and fallback are runtime/perceptual behaviors with no automated test coverage"
  - test: "Owner ear-approval of the shipped voice (U2 android treatment on ms-MY-OsmanNeural)"
    expected: "Owner approves the committed narration audio"
    why_human: "Aesthetic judgment — ALREADY SATISFIED: checkpoint passed 2026-11-23, recorded in 03-01-SUMMARY.md (U2 picked after U1/U2/U3 iteration; l46 tweak; 64kbps accepted)"
---

# Phase 3: Malay Narration (merged) Verification Report

**Phase Goal:** The full ~49-line Ghost Runner story is narrated in Malay from the ENTER click, synced to the intro story scroll with per-line highlighting, using a bundled pre-synthesized neural ms-MY audio asset as the primary narration source
**Verified:** 2026-11-23
**Status:** human_needed (all automated checks pass; audio runtime behaviors routed to human per 03-VALIDATION.md)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 49 per-line mp3s exist under public/audio/narration/, one per intro.story.l01..l49 key, passing the integrity gate (VOICE-01) | ✓ VERIFIED | `npm run check:narration` exit 0: "[narration] OK: 49 narration mp3s present (> 1024 bytes each) matching bm.js keys; cue map covers all 49 lines"; 49 files counted on disk |
| 2 | Narration is the owner-approved neural voice at a measured, cinematic pace | ✓ VERIFIED | Owner ear-review checkpoint passed 2026-11-23 (03-01-SUMMARY.md): ms-MY-OsmanNeural + U2 android DSP (ring-mod 90Hz/45%, bit crush, echo), owner-iterated U1→U2→U3; sanctioned decision |
| 3 | narration-cue.json maps each lNN key to audio duration for scroll tuning | ✓ VERIFIED | Cue file exists at .planning/phases/03-malay-tts-narration/narration-cue.json, gate asserts 49-key numeric coverage; main.js:59 fetches it, sums to 260.88s, passes to setScrollDuration |
| 4 | No runtime code path references the Azure TTS endpoint — synthesis is build-time only (VOICE-02) | ✓ VERIFIED | `grep -rn "tts.speech.microsoft" src/` = 0 hits; gate enforces it; synthesis script lives under scripts/ with env-var-only credentials |
| 5 | Narration starts only from the ENTER click, synchronously inside the gesture handler, never before a gesture (TTS-01) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | createIntroOverlay.js handleStart: `onStart?.()` invoked synchronously at the top of the click handler before any await, with gesture-anchor comment; createIntroFlow.js:52 `startNarrationRef?.start()`; factory start() calls play() synchronously. Wired correctly; runtime gesture-window playback needs human confirmation |
| 6 | Spoken line highlighted in sync, zero-or-one active, cleared at story end; HL-4 rebind after renderStory (TTS-05) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | setStoryHighlight (overlay:187), storyLineEls tracked + rebound after renderStory (overlay:197-204), onLineChange(null) at end (factory:189, HL-3); audio-visual sync itself is perceptual |
| 7 | Mute kills narration immediately and clears highlight; narration never writes music state (TTS-03) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | One-way `subscribe` in createIntroNarration.js; negative grep `setMusicPlaying` = 0 hits in factory; main.js second read-only subscribe drives mute UI. Runtime timing (immediate stop) needs human |
| 8 | Replay restarts from l01 with highlight + scroll reset; disabled-quiet while muted (TTS-06) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Replay button in .intro-actions (overlay:51), RP-4 handler calls restartStoryScroll + narration restart (overlay:392-395); disabled-quiet wiring present; runtime restart needs human |
| 9 | Source label names active source, re-syncs on language change (TTS-04) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Three-state label map (overlay:87-89) from intro.voice.sourceAsset/sourceTts/sourceNone in both dictionaries (check:i18n 142-key parity green); re-derived in syncText (SL-4) |
| 10 | Asset-failure fallback: sentence-chunked browser TTS with label swap, no error chrome (TTS-02) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | createIntroNarration.js:120+ sentence-chunked SpeechSynthesisUtterance chain (ms-MY), assetFailedAt watermark, unavailable floor; requires DevTools network-block to observe |

**Score:** 6/10 truths verified (4 present + wired, behavior-unverified)

Note: the ROADMAP's merged success criterion 4 ("graded voice chain: local ms → network ms-MY → labeled id-ID → text-only") is superseded by the merge itself — bundled audio is primary, browser TTS only as labeled fallback (TTS-02/04 demoted per ROADMAP requirements note). Truths 9-10 verify the fallback + labeling portion; the graded device-voice-chain ladder is intentionally not the primary path anymore.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| scripts/synthesize-narration.mjs | Build-time synthesis, env-only creds | ✓ VERIFIED | Parses clean, env-var read confirmed, no credential literals, XML-escaping, cue emission |
| scripts/check-narration-assets.mjs | Integrity gate | ✓ VERIFIED | Wired as npm run check:narration; exits 0 with 49 assets |
| public/audio/narration/l01..l49.mp3 | 49 committed assets | ✓ VERIFIED | 49 files, >1KB each, ~4.7MB |
| .planning/phases/03-malay-tts-narration/narration-cue.json | Cue map | ✓ VERIFIED | 49 numeric durations, gate-enforced |
| src/audio/createIntroNarration.js | Playback factory | ✓ VERIFIED | Queue + watchdog + fallback + one-way audioState subscribe; imported and used by main.js |
| src/ui/intro/createIntroOverlay.js | keepStory, highlight, replay, label | ✓ VERIFIED | All symbols present (playExit keepStory, setStoryHighlight, setScrollDuration, replay handler) |
| src/ui/intro/introOverlay.css | --intro-story-dur, --active class | ✓ VERIFIED | CSS var + .intro-story-line--active present |
| src/app/createIntroFlow.js + src/main.js | startNarration DI wiring | ✓ VERIFIED | setupNarration built in main.js:263, DI'd through flow, start() called in gesture window |
| intro.voice.* keys in bm.js + en.js | 4 keys each | ✓ VERIFIED | 4 intro.voice keys per dictionary; 142-key parity green |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| src/main.js | src/audio/createIntroNarration.js | setupNarration closure passed into createIntroFlow | WIRED | main.js:263,318; flow line 13,89-90 |
| src/app/createIntroFlow.js | narration factory | optional-chained start inside ENTER onStart gesture anchor | WIRED | flow:51-52 `startNarrationRef?.start()`; overlay:377 `onStart?.()` before any await |
| src/audio/createIntroNarration.js | src/audio/audioState.js | one-way subscribe, never setMusicPlaying | WIRED | subscribe at factory:1-import + mute handling; negative grep 0 hits (TTS-03 trap honored) |
| src/ui/intro/createIntroOverlay.js | public/audio/narration assets | per-line Audio queue → .intro-story-line--active | WIRED | factory URL builder over lNN keys; highlight callback to overlay |
| scripts/synthesize-narration.mjs | src/i18n/dictionaries/bm.js | intro.story.l01..l49 verbatim synthesis source | WIRED | bm dictionary import in synthesis script |
| scripts/check-narration-assets.mjs | src/i18n/dictionaries/bm.js | 49 assets ↔ dictionary keys | WIRED | gate imports bm, asserts keys, exit 0 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build compiles | npm run build | ✓ built in 14.90s | ✓ PASS |
| Narration integrity gate | npm run check:narration | exit 0, 49 assets + cue + VOICE-02 clean | ✓ PASS |
| Dictionary parity | npm run check:i18n | 142 keys parity OK | ✓ PASS |
| Mute trap (negative) | grep setMusicPlaying src/audio/createIntroNarration.js | 0 hits | ✓ PASS |
| VOICE-02 (negative) | grep tts.speech.microsoft src/ | 0 hits | ✓ PASS |
| Debt markers | grep TBD/FIXME/XXX across phase files | 0 hits | ✓ PASS |
| Render-loop untouched | git log src/runtime/createRenderLoop.js src/tsl/ | last commits pre-Phase-3 (89e766f rain update) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TTS-01 | 03-02 | Narration starts only from ENTER, gesture-anchored | ? NEEDS HUMAN (wired) | Source wiring verified; runtime behavior → human |
| TTS-02 | 03-02 | Browser-TTS fallback on asset failure, labeled | ? NEEDS HUMAN (wired) | Fallback chain + assetFailedAt wired; needs DevTools block test |
| TTS-03 | 03-02 | Mute kills narration immediately; no music-state writes | ? NEEDS HUMAN (wired) | One-way subscribe + 0-hit negative grep; timing → human |
| TTS-04 | 03-02 | Source label reflects active source | ? NEEDS HUMAN (wired) | Three-state localized label wired |
| TTS-05 | 03-02 | Highlight synced to spoken line | ? NEEDS HUMAN (wired) | Highlight/rebind wired; sync perceptual |
| TTS-06 | 03-02 | Replay restarts from l01 | ? NEEDS HUMAN (wired) | Replay handler wired |
| VOICE-01 | 03-01 | 49 assets + integrity gate | ✓ SATISFIED | Gate green, 49 files |
| VOICE-02 | 03-01 | No runtime cloud TTS calls | ✓ SATISFIED | 0 endpoint hits under src/, gate-enforced |

No orphaned requirements: ROADMAP Phase 3 lists exactly TTS-01/03/05/06, VOICE-01/02 (+ demoted TTS-02/04 as fallback-only), all covered by the two plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | | | | |

No TBD/FIXME/XXX markers in any phase-modified file. Untracked stray artifacts (.narr-preview/, android-voice.tmp.mjs, .planning/state.json) are uncommitted scratch — not part of the phase surface, no impact.

### Gaps Summary

No gaps. All must-have artifacts exist, are substantive, and are wired; all automated gates (build, check:i18n 142 keys, check:narration 49 assets + cue + VOICE-02) pass; negative greps (mute trap, endpoint) clean; render-loop/tsl/post untouched. Four truths are behavior-dependent (audio playback, sync, mute timing, replay, fallback, label states) — present and wired but exercised by no automated test, so status is human_needed: run the 03-VALIDATION.md manual browser matrix. The owner ear-approval item is already satisfied (checkpoint passed 2026-11-23, recorded in 03-01-SUMMARY.md).
