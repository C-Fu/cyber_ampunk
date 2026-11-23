---
status: passed
phase: 03-malay-tts-narration
source: [03-VERIFICATION.md]
started: 2026-11-23T16:00:00Z
updated: 2026-11-23T16:00:00Z
---

## Current Test

number: 1
name: Narration starts from ENTER, never pre-gesture (TTS-01)
expected: |
  Fresh load → silence before ENTER → click MASUK → android narration begins
awaiting: user response

## Tests

### 1. Narration starts from ENTER, never pre-gesture (TTS-01)
expected: Fresh load → silence → click MASUK → your android-voice narration starts immediately (no pre-gesture speech)
result: [pass] (owner confirmed all pass, 2026-11-23)

### 2. Highlight–audio sync (TTS-05)
expected: The story line currently being spoken is highlighted in the intro; highlight follows the voice line-for-line; language switch mid-play stops narration and clears highlight (HL-4)
result: [pass] (owner confirmed all pass, 2026-11-23)

### 3. Mute kills narration instantly (TTS-03)
expected: During narration, clicking the audio button stops speech immediately and clears the highlight
result: [pass] (owner confirmed all pass, 2026-11-23)

### 4. Replay restarts from l01 (TTS-06)
expected: Mid-narration replay restarts from the first line with highlight and scroll reset; replay disabled-quiet while muted
result: [pass] (owner confirmed all pass, 2026-11-23)

### 5. Source label three states (TTS-04)
expected: "Bundled audio" state normally; "device TTS" when assets blocked; "unavailable" when no speechSynthesis — localized, re-syncs on language switch
result: [pass] (owner confirmed all pass, 2026-11-23)

### 6. Browser TTS fallback (TTS-02)
expected: DevTools → Network → block `**/audio/narration/*` → reload → ENTER → sentence-chunked device TTS narrates instead; label swaps; no error chrome
result: [pass] (owner confirmed all pass, 2026-11-23)

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Note: automation-pane UAT was attempted and blocked — the pane's GPU device fails at renderer init (known intermittent limitation; same pane rendered the scene successfully earlier today, so the build itself is healthy — asset serving verified 200/206 locally and on Pages). These items require the owner's real browser (WebGPU + audio output).
