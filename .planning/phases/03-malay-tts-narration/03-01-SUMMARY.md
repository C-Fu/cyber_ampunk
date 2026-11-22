---
phase: 03-malay-tts-narration
plan: 01
status: complete
completed: 2026-11-23
commits: 4
---

# Plan 03-01 Summary — Narration Asset Pipeline

## What was built

Offline narration asset pipeline for the 49-line BM Ghost Runner story, delivering the owner-approved "android" narration:

1. **`scripts/synthesize-narration.mjs`** — Node synthesis runner: reads `intro.story.lNN` verbatim from `bm.js`, XML-escapes into SSML (Azure `serious` style, degree 1.5, rate −10%, pitch −12%), fetches 24kHz/16-bit mono WAV from the Azure Speech REST endpoint (SPEECH_KEY/SPEECH_REGION from env only — T-3-01), applies the owner-selected **U2 android DSP** (ring-mod 90Hz/45% + 11-bit crush + 55ms echo on a dry tap + fixed DC blocker + limiter/normalize), encodes via lamejs (64kbps mono mp3), and emits `narration-cue.json` (per-line seconds for Phase 3 scroll tuning).

2. **`scripts/check-narration-assets.mjs` + `npm run check:narration`** — integrity gate: 49 mp3s present (>1KB each) ↔ 49 dictionary keys, cue coverage, VOICE-02 endpoint grep (no runtime cloud calls in `src/`).

3. **49 committed assets** — `public/audio/narration/l01..l49.mp3` (~4.7MB total, 260.9s measured speech) + `narration-cue.json`.

## Owner decisions at the checkpoint

- **Voice**: ms-MY-OsmanNeural with the U2 android treatment (neutral voices "too soft"; DSP treatments iterated U1→U2→U3 at the owner's ear; U2 picked 2026-11-23)
- **l46 copy tweak**: "menunggang melalui hujan pada pukul tiga pagi" → "menunggang melalui hujan tiga pagi tadi" (conversational; EN counterpart unchanged — parity gate green)
- **Bitrate**: 64kbps mono accepted

## Key technical findings (for the record)

- lamejs 1.2.1's ESM entry is broken (`MPEGMode is not defined`); pinned to 1.2.0 and loaded via `createRequire` — lamejs is a **devDependency** (build-time synthesis only; nothing ships to the browser, D-01 spirit intact)
- Two DSP bugs were caught by the added sanity guards before shipping: (a) broken DC-blocker formula produced pure oscillation (replaced with the standard `y = x − xPrev + R·yPrev` form), (b) echo feeding back through the blocker created a howling loop (echo now taps the dry pre-blocker signal)
- Oscillation guard compares the last-2% tail RMS against mid-speech RMS (a 10% window false-positives on paragraphs that end mid-sentence)

## Deviations

- lamejs devDependency added (build-time only) — sanctioned: audio encoding is impossible dependency-free; the runtime bundle remains dependency-free (D-01's constraint was on runtime)
- `narration-cue.json` lives in the phase dir (plan artifact) — 03-02 consumes it for scroll tuning

## Coverage

| Requirement | Evidence |
|-------------|----------|
| VOICE-01 | 49 assets committed, gate green (`npm run check:narration` exit 0) |
| VOICE-02 | VOICE-02 grep: 0 Azure endpoint refs under `src/`; assets are static files in `public/` |
| TTS-04 (source label, partial) | Primary source exists — label work is 03-02 |

## Self-Check: PASSED

- Files on disk: `public/audio/narration/l01..l49.mp3` + cue JSON ✓
- Commits: `a07488d` (script), `cbe00a9` (gate), `46ebbc1` (assets + tweak), this SUMMARY ✓
- Gates: `check:narration` exit 0, `check:i18n` 138-key parity, `npm run build` green ✓
- No credential material in repo ✓
