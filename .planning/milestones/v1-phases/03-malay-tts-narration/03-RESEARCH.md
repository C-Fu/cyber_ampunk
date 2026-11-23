# Phase 3: Malay Narration (merged) - Research

**Researched:** 2026-11-23
**Domain:** Offline Malay TTS asset generation + intro-overlay narration playback, per-line highlight sync, mute integration
**Confidence:** MEDIUM-HIGH (runtime code verified in-repo this session; synthesis workflow verified against Microsoft docs; sizes/timings estimated)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01..D-05, LOCKED)
- **D-01:** Full story narrated (~49 lines, ~3-5 min of speech) — matches the scroll duration
- **D-02:** Bundled pre-synthesized audio is the PRIMARY narration source (merges former Phase 4). Generate offline with a cloud neural ms-MY voice; chunk per story line (one audio segment per `intro.story.lNN` key) so highlighting syncs exactly
- **D-03:** Per-line highlight: the line currently being spoken is highlighted in the story, synced to audio playback (TTS-05)
- **D-04:** Browser TTS demoted to emergency fallback only (asset-load failure) — no voice chain, no device-matrix spike needed for the primary path
- **D-05:** TTS-01 gesture-anchored start (ENTER click), TTS-03 mute kills narration immediately, TTS-06 replay button — carried over unchanged

### Carried from milestone (locked)
- Narration reads the `intro.story.lNN` dictionary keys — single source of truth
- 100s CSS scroll; audio will not match exactly — sync design (audio drives highlight; scroll duration tuning) is a planning decision
- `audioState` pub/sub governs all sound — narration must subscribe and cancel on mute
- No new runtime dependencies; audio asset is a build artifact, not a dependency

### the agent's Discretion
- Which neural voice/tier to synthesize with (owner reviews the audio before it ships — checkpoint)
- Asset format (per-line files vs single file + cue map) — planner decides based on highlighting mechanism
- Asset location (`public/audio/narration/`) and loading strategy
- Scroll-duration tuning approach
- UI for source label + replay button (follows existing chrome patterns per UI-SPEC culture)

### Deferred Ideas (OUT OF SCOPE)
- Language-switch behavior mid-play (planner picks simplest correct behavior; EN audio NOT generated this phase)
- Subtitle display of spoken line outside the story region
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TTS-01 | Narration starts from ENTER click, gesture-anchored | ENTER click handler in `createIntroOverlay.handleStart` → `onStart` (createIntroFlow) is the gesture anchor; start playback synchronously inside it (Pitfall 5) |
| TTS-02 | Browser TTS sentence-chunked emergency fallback | Sentence-chunking pattern from PITFALLS.md (15s cutoff), only on asset fetch failure |
| TTS-03 | Mute cancels narration immediately | Subscribe to `audioState.isMusicPlaying`; on `false` → stop audio, clear highlight |
| TTS-04 | Bundled ms-MY neural audio primary; UI labels active source | Offline synthesis workflow (Azure); `data-source` label on story region |
| TTS-05 | Per-line highlight synced to narration queue | Per-line mp3 chain + `.intro-story-line[data-key]` highlight class |
| TTS-06 | Replay button restarts narration | Reset queue index to l01, restart scroll |
| VOICE-01 | Bundled per-line asset ships, full 49-line coverage | Asset generation script + cue integrity gate (49 files ↔ 49 keys) |
| VOICE-02 | Works offline, no runtime cloud calls | Static mp3s under `public/`, plain `Audio` elements — fully offline |
</phase_requirements>

## Summary

Phase 3 has two halves. **Offline asset generation**: the owner's 49 BM story lines (verbatim in `src/i18n/dictionaries/bm.js`, keys `intro.story.l01..l49`) are batch-synthesized with an Azure neural ms-MY voice into per-line mp3s under `public/audio/narration/`. **Verified correction to CONTEXT.md D-02:** Azure's ms-MY locale has exactly two neural voices — `ms-MY-OsmanNeural` (male) and `ms-MY-YasminNeural` (female); there is no `ms-MY-KhalisaNeural` [VERIFIED: learn.microsoft.com language-support]. A small Node script (devDependency or plain Node 22 fetch against the TTS REST endpoint) generates the assets; they are committed as build artifacts. Per-line files are recommended over one concatenated file + cue table: sync becomes exact and self-healing (no clock drift over 3-5 min), files are tiny (~10-40 KB each), and the integrity check (49 files ↔ 49 keys) is trivially automatable.

**Runtime playback**: a small `src/audio/createNarrationAudio.js` factory (matching existing `src/audio/*` factory shape) drives the chain: play `lNN.mp3` via an `Audio` element, `onended` → highlight next line, play next. The intro overlay must persist its story region after ENTER — today `playExit()` fades the whole container and calls `root.remove()` [VERIFIED: src/ui/intro/createIntroOverlay.js:188-202]. Minimal persistence: add a "narrating" exit mode that fades/removes kicker, brand, actions, and credit but keeps the root (or story window) in the DOM with a CSS class; zero render-loop impact since everything is CSS/GSAP/DOM, untouched by `createRenderLoop.js`. Mute integration subscribes to `audioState` (`setMusicPlaying(false)` must stop narration instantly). Scroll duration: promote the hardcoded `100s` into a CSS custom property and set it at runtime from summed audio metadata, so the credits scroll ends when the voice does.

**Primary recommendation:** Per-line mp3s (`public/audio/narration/l01..l49.mp3`) synthesized with `ms-MY-OsmanNeural` (or `ms-MY-YasminNeural`, owner's ear-decision checkpoint) via a one-shot offline generation script; runtime is a plain `Audio`-element chain inside a new `src/audio/createNarrationAudio.js`; overlay gets a `keepStory` exit mode; scroll duration CSS var tuned from measured total duration.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Asset synthesis (VOICE-01) | Developer machine (offline script) | CDN/Static (committed mp3s in `public/`) | Cloud TTS call happens once at build time, never at runtime [D-02, VOICE-02] |
| Narration playback queue | Browser / Client (`src/audio/createNarrationAudio.js`) | — | Same tier as existing audio factories |
| Gesture anchor (TTS-01) | Browser / Client (`createIntroOverlay` click handler) | — | Autoplay policy requires user activation |
| Highlight sync (TTS-05) | Browser / Client (overlay DOM + narration callbacks) | — | Story lines are `<p data-key>` elements the overlay already renders |
| Mute kill (TTS-03) | Browser / Client (`audioState` pub/sub) | — | Existing state source, no new state |
| Overlay persistence | Browser / Client (DOM/CSS only) | — | Must not touch render loop (AGENTS.md) |
| Emergency TTS fallback (TTS-02) | Browser / Client (Web Speech API) | — | Device-provided voices, no network |

## Project Constraints (from AGENTS.md)

- Import from `three/webgpu` / `three/tsl` — irrelevant here (no shader changes) but do not touch `src/tsl/` or post stack
- `createRenderLoop.js` MUST NOT be touched — narration and overlay persistence are pure DOM/CSS/GSAP work, naturally compliant
- No new runtime dependencies — synthesis script may be a devDependency or plain Node `fetch` (no package needed for a REST call); asset is a build artifact
- Match existing factory style (`createWetFootstepAudio.js` shape, optional chaining, DI closures)
- Verification checklist: `npm run build` must succeed; verify no impact on rain/height pass (narration phase touches none of it)

## Standard Stack

### Core (runtime — zero new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| HTMLAudioElement (`Audio`) | platform | Per-line playback queue | Already used in `createAudioButton.js`; gesture-unlocked by ENTER click; no decode wiring needed |
| `audioState` pub/sub | in-repo (`src/audio/audioState.js`) | Mute integration | Existing single state source [VERIFIED: src/audio/audioState.js:20-41] |
| GSAP (existing dep) | ^3.15.0 | Overlay narrating-exit fade | Already imported in `createIntroOverlay.js` |

### Offline synthesis (build-time, dev machine only)
| Tool | Purpose | Notes |
|------|---------|-------|
| Azure Speech TTS REST API (or Speech SDK) | Generate 49 mp3s from `bm.js` story lines | `az` CLI NOT installed on this machine (checked) — prefer a small Node script calling the REST endpoint, or `az extension add --name speech` as alternative |
| Azure voice | `ms-MY-OsmanNeural` (male) or `ms-MY-YasminNeural` (female) | Only two ms-MY neural voices exist [VERIFIED: learn.microsoft.com/azure/ai-services/speech-service/language-support] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Per-line mp3s | One mp3 + cue table | Cue table needs clock drift handling over 3-5 min and a retry-on-seek story; per-line is exact sync, simpler replay/mute — planner should pick per-line |
| MP3 48 kbps mono | OGG/WebM | MP3 plays everywhere including older Safari; ogg lacks Safari support [ASSUMED] |
| REST endpoint script | `az speech synthesize` per line | az CLI + speech extension not installed here; REST via Node 22 `fetch` needs only `SPEECH_KEY`/`SPEECH_REGION` env vars and matches "offline script" constraint |
| HTMLAudio chain | WebAudio decoded buffers | WebAudio adds decode/Memory complexity and its own unlock path; HTMLAudio `ended` events are sufficient at 1 line/5-10s cadence |

## Package Legitimacy Audit

No new packages required. Runtime uses existing deps (gsap) and platform APIs. The synthesis script can be dependency-free Node (`fetch` + `fs`), avoiding any install.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none — no new packages) | — | — | — | — | — | none |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
[Offline, dev machine]
  bm.js intro.story.l01..l49 ──> narration-generate script
        (Azure TTS REST, ms-MY voice, SSML per line, mp3 48kbps mono)
        ──> public/audio/narration/l01.mp3 .. l49.mp3  (committed)
        ──> durations emitted -> narration-cue.json (line -> seconds, optional)

[Runtime, browser]
  ENTER click (gesture)
    ├─ audioState unlocked; narration.start()
    │     loop: Audio.src = lNN.mp3 -> play -> onended -> highlight(lNN+1) -> play next
    ├─ overlay narrating-exit: fade/remove kicker+brand+actions, KEEP story window
    └─ scroll CSS var set from summed audio durations
  audioState mute (isMusicPlaying=false) ──> narration.stop() + clear highlight
  replay button ──> narration.restart() from l01
  asset fetch failure ──> labeled fallback: Web Speech sentence chunks
```

### Recommended Project Structure
```
public/audio/narration/l01.mp3 .. l49.mp3   # committed build artifacts
scripts/generate-narration.mjs              # offline synthesis (reads bm.js, writes mp3s)
src/audio/createNarrationAudio.js           # playback queue factory (audioState subscriber)
src/ui/intro/createIntroOverlay.js          # keepStory exit mode + highlight + replay button
src/ui/intro/introOverlay.css               # --intro-story-dur var, .intro-story-line--active, source label
```

### Pattern 1: Narration queue (audio factory shape)
```js
// src/audio/createNarrationAudio.js — follows createWetFootstepAudio DI shape
export function createNarrationAudio({ keys, audioEl } = {}) {
  // audioEl = new Audio(); preload="auto"
  // subscribe(audioState) — on isMusicPlaying=false: pause, reset, clear highlight
  // start(): index=0; playLine(index) — src=`${BASE}/l${NN}.mp3`;
  //          onended -> onLineEnd(index), advance or finish
  return { start, stop, restart, subscribeLine };
}
```
[CITED: MDN HTMLAudioElement / `ended` event — https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended_event]

### Pattern 2: Overlay persistence (minimal diff)
`handleStart` currently runs `await playExit()` (which `root.remove()`s) before `onStart` [VERIFIED: src/ui/intro/createIntroOverlay.js:204-217]. Minimal change: `playExit({ keepStory: true })` fades only kicker/brand/actions/credit (or adds a `.intro-container--narrating` class that hides them via CSS) and skips `root.remove()`; the story window stays. Destroy path (`root.remove()` after narration ends) reuses existing `destroy()`. The container is `position:fixed; pointer-events:none; z-index:20` [VERIFIED: src/ui/intro/introOverlay.css:1-11] — keeping it in the DOM costs nothing per-frame (no render-loop coupling; the scroll is a CSS animation, the fade is GSAP on DOM only).

### Pattern 3: Scroll-duration tuning
Change `animation: intro-story-scroll 100s linear both` [VERIFIED: src/ui/intro/introOverlay.css:116-122] to use `var(--intro-story-dur, 100s)`. At narration start, sum `audioEl.duration` metadata as lines load (or use a generated cue JSON) and `storyScroll.style.setProperty("--intro-story-dur", totalSeconds + "s")`, then `restartStoryScroll()`. Discretion item: this is the recommended approach (audio drives scroll length); alternative is leaving 100s and letting audio hold the last line.

### Pattern 4: Offline synthesis command shape (REST)
```
POST https://{region}.tts.speech.microsoft.com/cognitiveservices/v1
Headers: Ocp-Apim-Subscription-Key: $SPEECH_KEY
         Content-Type: application/ssml+xml
         X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3
Body: <speak version="1.0" xml:lang="ms-MY">
        <voice name="ms-MY-OsmanNeural">{line text}</voice>
      </speak>
```
[CITED: learn.microsoft.com/azure/ai-services/speech-service/get-started-text-to-speech (REST + output formats)] For SSML prosody, a measured cinematic read maps to `<prosody rate="-8%">`-ish values — owner checkpoint decides.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mute state | New narration-specific flag | `audioState` subscribe (existing) | Single source of truth per milestone decision |
| Overlay fade choreography | Custom rAF/JS animation loop | GSAP timelines + CSS animation (existing) | Zero render-loop coupling is already achieved this way |
| Asset integrity check | Ad-hoc manual counting | Extend `scripts/check-i18n-parity.mjs`-style Node gate | Same pattern, same runbook (`npm run check:i18n` exists [VERIFIED: package.json scripts]) |
| Sentence splitting for fallback | Regex-perfectionism | Simple split on `.!?` + 200-300 char cap | PITFALLS.md-established bound for the 15s cutoff |

## Common Pitfalls

### Pitfall 1: Wrong voice name (CONTEXT.md says "Khalisa")
**What goes wrong:** `ms-MY-KhalisaNeural` does not exist; synthesis call fails with 404/invalid voice.
**Why:** Azure ms-MY has exactly `ms-MY-OsmanNeural` and `ms-MY-YasminNeural` [VERIFIED: learn.microsoft.com language-support].
**Avoid:** Use Osman or Yasmin; owner ear-checkpoint picks. Budget for a multilingual fallback voice (e.g. `en-US-AndrewMultilingualNeural` with `xml:lang="ms-MY"`) only if owner rejects both ms-MY voices.

### Pitfall 2: Narration starts outside the gesture window
**What goes wrong:** Starting audio after a chain of awaits (`playExit` → GSAP → notice timers) can lose user activation on Safari; `Audio.play()` rejects silently.
**Avoid:** Kick the first `play()` (or `audioEl.load()`) synchronously inside the ENTER click handler path before long awaits; ENTER click is the gesture anchor (TTS-01). Warning sign: works in Chrome, silent first line on Safari/iOS.

### Pitfall 3: Mute semantics of `audioState`
**What goes wrong:** `audioState.isMusicPlaying` flips from ambience autoplay too — `startOnFirstInteraction` in `createAudioButton.js` calls `play()` on any first interaction and sets `setMusicPlaying(true)` [VERIFIED: src/ui/chrome/createAudioButton.js:138-178]. Narration must therefore react to `false` as "kill narration" (TTS-03), and the narration module must not itself call `setMusicPlaying` (that would toggle ambience).
**Avoid:** One-way subscription: narration reads `isMusicPlaying`, never writes it.

### Pitfall 4: Onended gaps / stalled queue
**What goes wrong:** A network hiccup or a decode stall leaves the queue hung with no `ended` event; highlight freezes.
**Avoid:** Per-line watchdog timer (e.g. `duration * 2 + 3s`) that skips to next line or stops; never rely on `ended` alone. Also `onerror` handler → route to fallback path (TTS-02) with source label change.

### Pitfall 5: Overlay removal races narration
**What goes wrong:** `playExit`'s `root.remove()` [VERIFIED: src/ui/intro/createIntroOverlay.js:196-199] runs before `onStart` — if narration highlights story lines after removal, highlight targets are detached.
**Avoid:** keepStory exit mode (Pattern 2); narration and overlay share line elements via DI (overlay passes a highlight callback into the narration factory, or narration exposes `onLineChange` that the overlay subscribes to).

### Pitfall 6: Language switch mid-narration
**What goes wrong:** `subscribe(syncText)` re-renders story lines on language change [VERIFIED: src/ui/intro/createIntroOverlay.js:66-76] while narration plays BM audio — highlight keys still match (same lNN keys) but text is EN.
**Simplest correct behavior (discretion):** narration is BM-only; on language switch, stop narration and clear highlight (do not restart in EN — EN audio not generated this phase).

### Pitfall 7: asset loading strategy vs memory
49 tiny mp3s are trivial, but `preload="auto"` on all 49 at startup is unnecessary; lazy-load with `preload="auto"` on the current + next line only, or fetch the single smallest acceptable quality (48 kbps mono mp3 ≈ 360 KB/min [ASSUMED] → ~1.5 MB total for 4 min).

## Code Examples

### SSML per line (synthesis script)
```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ms-MY">
  <voice name="ms-MY-OsmanNeural">
    <prosody rate="-8%">Kuala Lumpur. 03:00.</prosody>
  </voice>
</speak>
```
[CITED: learn.microsoft.com SSML docs]

### Highlight binding (runtime)
```js
// overlay side — lines already carry their keys implicitly by index
lines[i] // = the <p> for intro.story.l{NN}
function setHighlight(i) {
  lines.forEach((el, j) => el.classList.toggle("intro-story-line--active", j === i));
}
```
Story keys verified: `STORY_KEYS = intro.story.l${pad2(i+1)}`, 49 entries [VERIFIED: src/ui/intro/createIntroOverlay.js:8-10]; bm.js contains 49 `intro.story.l` keys [VERIFIED: grep count, src/i18n/dictionaries/bm.js].

### Fallback (TTS-02) sketch
```js
// sentence chunks, immune to ~15s cutoff (PITFALLS.md Pitfall 3/4)
const chunks = splitSentences(t(key), 250);
for (const c of chunks) {
  const u = new SpeechSynthesisUtterance(c);
  u.lang = "ms-MY"; u.onend = next;
  speechSynthesis.speak(u);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Web Speech API as primary narration (Phase 3 original plan) | Bundled neural audio primary; Web Speech emergency fallback only | 2026-11-23 owner decision (D-02/D-04) | Device-matrix spike demoted; asset pipeline becomes the core work |
| Single concatenated narration file idea | Per-line chunks | D-02 lock | Exact highlight sync without cue-table clock math |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ~450 BM words ≈ 3-5 min neural speech; ~1-2 MB total at 48 kbps mono mp3 | Summary / Pitfall 7 | Asset size budget off — trivial to re-measure after generation |
| A2 | MP3 48 kbps mono is acceptable quality for narration | Standard Stack | Owner rejects quality at ear-checkpoint — regenerate at higher bitrate |
| A3 | Azure TTS REST accepts direct Node fetch with only key+region env vars | Pattern 4 | Script needs SDK instead — devDependency then (build-time only, still no runtime dep) |
| A4 | `Audio.duration` available fast enough to drive scroll var (or cue JSON pre-generated instead) | Pattern 3 | Fall back to generated `narration-cue.json` with durations emitted by the synthesis script — this is actually the more robust default |
| A5 | Safari accepts `Audio.play()` started synchronously in click handler even after subsequent awaits for later lines | Pitfall 2 | Later lines need re-gesture on iOS — mitigated by unlocking early; manual matrix covers it |

## Open Questions

1. **Voice choice (Osman vs Yasmin)** — owner ear-checkpoint; generate both for a 3-line sample before batch synthesis. Recommendation: build the script to take `--voice` param.
2. **ToS consideration for shipping generated audio** [ASSUMED]: Azure TTS output may be shipped in apps per Microsoft Speech service terms (synthesized speech is the product); confirm current Microsoft generative-AI usage terms during synthesis task. Owner holds the Azure account; no API key in repo (env var at generation time only).
3. **Replay button placement** — inside `.intro-actions` area vs floating chrome; follow UI-SPEC culture, discretion item.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | synthesis script | ✓ | (project uses Node/ESM) | — |
| Azure Speech resource + key | asset generation (one-time, owner-owned) | ✗ unknown — owner must provision | — | Owner provides `SPEECH_KEY`/`SPEECH_REGION` env vars; no key in repo |
| `az` CLI | alternative synthesis route | ✗ (not on PATH, checked 2026-11-23) | — | REST script (preferred) or `npm i -g` az + speech extension |
| ffmpeg | optional loudness normalize | ✗ unknown | — | Skip; Azure output is consistent |

**Missing dependencies with no fallback:** Azure Speech resource — planner must include an owner-provision checkpoint before the synthesis task.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none installed — Node script assertions + `npm run check:i18n`-style gates (no vitest/jest in package.json [VERIFIED: package.json scripts]) |
| Config file | none — see Wave 0 |
| Quick run command | `npm run build && npm run check:i18n && node scripts/check-narration-assets.mjs` |
| Full suite command | same (build + parity + asset gate); behavior checks are manual browser matrix |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VOICE-01 | 49 asset files exist, non-trivial size, keys match dictionary | script | `node scripts/check-narration-assets.mjs` (asserts `public/audio/narration/l01..l49.mp3` ↔ `intro.story.lNN` keys in bm.js) | ❌ Wave 0 |
| VOICE-02 | Assets served from `public/` (offline-capable), no runtime cloud calls | grep gate | `grep -rn "tts.speech.microsoft" src/` returns 0 hits | ❌ Wave 0 (add to script or plan grep task) |
| TTS-05 | Highlight keys ↔ STORY_KEYS parity | script | covered by `check-narration-assets.mjs` + existing `npm run check:i18n` (49 story keys parity already enforced) | partial — check:i18n exists ✅ |
| TTS-01 | Narration starts on ENTER only | manual | browser matrix (Chrome/Edge, Safari, mobile) | manual-only |
| TTS-03 | Mute kills narration immediately | manual | browser matrix; plus code-review grep that narration never calls `setMusicPlaying` | manual + grep |
| TTS-04 | Source label reflects active source (bundled vs fallback) | manual | browser matrix + fallback simulation (block asset URL in DevTools) | manual-only |
| TTS-02 | Fallback TTS on asset failure | manual | DevTools network-block simulation | manual-only |
| TTS-06 | Replay restarts from l01 | manual | browser matrix | manual-only |
| build | `npm run build` succeeds | build | `npm run build` | ✅ |

### Sampling Rate
- **Per task commit:** `npm run build` (+ asset gate once script exists)
- **Per wave merge:** full quick run (build + check:i18n + check-narration-assets)
- **Phase gate:** all automated gates green + manual browser matrix (audio plays, highlight syncs, mute kills, replay works, offline via `vite preview` with network throttled/off) before `$gsd-verify-work` — note `human_verify_mode: end-of-phase` and owner ear-review checkpoint on the synthesized voice

### Wave 0 Gaps
- [ ] `scripts/check-narration-assets.mjs` — covers VOICE-01/VOICE-02/TTS-05 integrity gates
- [ ] `--intro-story-dur` CSS var + `.intro-story-line--active` class defined in `introOverlay.css` (implementation Wave 0 of the plan, not test infra)
- [ ] No test framework install planned — Node script gates match existing `check-i18n-parity.mjs` pattern

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | — (no auth surfaces) |
| V5 Input Validation | yes (minor) | Story text into SSML must be XML-escaped in the synthesis script (BM text is trusted owner content, but escape `<`, `>`, `&` anyway); runtime `Audio.src` built from padded index, never from raw key text |
| V14 Data Protection | yes | Azure Speech key only as env var on the dev machine at generation time; never in repo, never in client bundle [project rule: do not commit .env/secrets] |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key leakage via committed script | Information Disclosure | Read `SPEECH_KEY`/`SPEECH_REGION` from process env; script fails fast with clear message if absent |
| SSML injection from story text | Tampering | XML-escape line text before interpolation |

## Sources

### Primary (HIGH confidence)
- [VERIFIED: src/ui/intro/createIntroOverlay.js:8-10, 66-101, 188-217] — STORY_KEYS, renderStory, playExit/root.remove, handleStart
- [VERIFIED: src/ui/intro/introOverlay.css:88-153] — story window, 100s scroll keyframes, reduced-motion
- [VERIFIED: src/app/createIntroFlow.js:34-73] — runIntroSequence, ENTER anchor, revealAppUi ordering
- [VERIFIED: src/audio/audioState.js:20-41] — setMusicPlaying/toggleMusic/subscribe shape
- [VERIFIED: src/ui/chrome/createAudioButton.js:118-178] — autoplay-on-interaction, mute wiring
- [VERIFIED: learn.microsoft.com/azure/ai-services/speech-service/language-support] — ms-MY voices: `ms-MY-OsmanNeural` (male), `ms-MY-YasminNeural` (female); no Khalisa
- [VERIFIED: learn.microsoft.com/azure/ai-services/speech-service/get-started-text-to-speech] — synthesis REST/CLI shape, output formats, batch options
- [CITED: developer.mozilla.org Web Speech / HTMLMediaElement docs] — `ended`, SpeechSynthesisUtterance

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — Web Speech quirks (15s cutoff, autoplay, voiceschanged), source-tagged at milestone level
- `.planning/phases/02-language-toggle-kl-intro-story/02-RESEARCH.md` — intro overlay architecture background

### Tertiary (LOW confidence)
- Asset size/duration estimates [ASSUMED A1/A2]
- Azure ToS for shipping generated audio [ASSUMED, Open Question 2]

## Metadata

**Confidence breakdown:**
- Runtime architecture: HIGH — all integration points read in source this session
- Synthesis workflow: HIGH for voice names/commands (Microsoft docs), MEDIUM for operational details (Azure resource provisioning is owner-side)
- Asset sizes/timing: LOW — estimates, re-measured at generation

**Research date:** 2026-11-23
**Valid until:** ~2026-12-23 (voice catalog could change; re-check language-support page if planning slips >30 days)
