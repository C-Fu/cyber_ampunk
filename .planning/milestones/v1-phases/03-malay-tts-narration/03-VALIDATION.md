---
phase: "3"
slug: "malay-tts-narration"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-23"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract. Source: `03-RESEARCH.md` § Validation Architecture. Node script gates + build + manual browser matrix (audio behavior is human-verified; `human_verify_mode: end-of-phase` + owner ear-review checkpoint).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — Node script gates matching the `check-i18n-parity.mjs` pattern |
| **Config file** | none |
| **Quick run command** | `npm run build && npm run check:i18n && node scripts/check-narration-assets.mjs` |
| **Full suite command** | same + manual browser matrix |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** `npm run build` (+ asset gate once the script exists)
- **After every plan wave:** `npm run build && npm run check:i18n && node scripts/check-narration-assets.mjs`
- **Before `$gsd-verify-work`:** all automated gates green + manual browser matrix + owner ear-review of the synthesized voice
- **Max feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (planner fills task-level rows) | | | | | | | | | |

**Requirement-level map (from research):**

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-------------|
| VOICE-01 | 49 asset files exist, non-trivial size, keys match dictionary | script | `node scripts/check-narration-assets.mjs` | ❌ Wave 0 |
| VOICE-02 | No runtime cloud calls | grep | `grep -rn "tts.speech.microsoft" src/` = 0 hits | ❌ Wave 0 |
| TTS-05 | Highlight keys ↔ story keys parity | script | check-narration-assets + `npm run check:i18n` (49-key parity) | partial ✅ |
| TTS-01 | Narration starts on ENTER only | manual | browser matrix | manual |
| TTS-03 | Mute kills narration immediately | manual + grep | browser matrix; narration never calls `setMusicPlaying` | manual |
| TTS-04 | Source label reflects active source | manual | browser matrix + DevTools block simulation | manual |
| TTS-02 | Fallback TTS on asset failure | manual | DevTools network-block simulation | manual |
| TTS-06 | Replay restarts from l01 | manual | browser matrix | manual |
| Build | Compiles | build | `npm run build` | ✅ |

---

## Wave 0 Requirements

- [ ] `scripts/check-narration-assets.mjs` — asserts `public/audio/narration/l01..l49.mp3` ↔ `intro.story.lNN` keys in bm.js (non-trivial file sizes); covers VOICE-01/TTS-05 integrity
- [ ] `--intro-story-dur` CSS var + `.intro-story-line--active` class defined in `introOverlay.css` (plan implementation, not test infra)
- [ ] No test framework install — Node script gates match existing pattern

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Narration starts from ENTER, never pre-gesture | TTS-01 | Audio/gesture runtime behavior | Fresh load → verify silence before ENTER → click → narration starts |
| Mute kills narration immediately | TTS-03 | Audio runtime | During narration, click audio button → speech stops instantly |
| Source label reflects active source | TTS-04 | Visual + runtime | Normal load → "audio asset" state; block asset URL → fallback state label |
| Browser TTS fallback on asset failure | TTS-02 | Requires network blocking | DevTools block `public/audio/narration/*` → labeled fallback narration plays |
| Replay restarts from l01 | TTS-06 | Audio runtime | Click replay mid-narration → restarts from first line, highlight resets |
| Highlight syncs to spoken line | TTS-05 | Audio-visual sync | Listen + watch: highlighted line matches the voice; language switch rebuilds highlight bindings (HL-4) |
| **Owner ear-review of synthesized voice** | VOICE-01 | Human judgment | Owner listens to generated per-line audio, picks Osman vs Yasmin, approves before asset commit |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or documented manual-only routing
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
