# Domain Pitfalls

**Domain:** Browser TTS (Web Speech API) for Bahasa Melayu narration + Malay-locale i18n in a WebGPU/Three.js demo
**Project:** Cyberpunk Malaya (brownfield fork of Threejs-Punk)
**Researched:** 2026-11-22
**Overall confidence:** HIGH (each claim below is source-tagged; speculation is explicitly marked)

Confidence key: **[HIGH]** = well-documented in vendor docs / bug trackers / MDN. **[MEDIUM]** = multiple credible community reports, vendor docs indirectly. **[LOW]** = speculation or single anecdote — treat as unverified.

---

## Critical Pitfalls

Mistakes that cause rewrites, silent feature failure, or broken UX on specific target browsers.

### Pitfall 1: `getVoices()` returns an empty array on first call (voice loading race)
**What goes wrong:** Calling `speechSynthesis.getVoices()` immediately after page load returns `[]`. Code that picks a voice once at startup picks nothing, and `speak()` then falls back to an arbitrary default voice (often not Malay).
**Why it happens:** Voice population is asynchronous in every major engine. MDN documents that voices may not be available until after the `voiceschanged` event fires (https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event) and that `getVoices()` can return empty until then (https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices).
**Consequences:** Narration plays in the wrong language/voice intermittently — a heisenbug that "works on my machine" and depends on OS voice count and cache state.
**Prevention:**
- Read voices both eagerly AND inside a `voiceschanged` handler; re-resolve the selected voice each time it fires.
- Keep a resolved-voice reference; do not assume the initial resolution is final. Fire may occur only once (Chrome desktop) or repeatedly/note each time speech is triggered (noted by community testing and by the WebKit implementation quirk documented at https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event).
- On Chrome, `getVoices()` can also return stale/partial lists while network "Google" voices are still fetching — see Pitfall 6.
**Detection:** Narration language differs from `ms-MY` on some reloads; empty voice list logged at startup.
**Source confidence:** **[HIGH]** — MDN, vendor docs.

### Pitfall 2: Autoplay policy — speechSynthesis is blocked without a user gesture (Chrome desktop)
**What goes wrong:** Calling `speak()` with no prior user activation does nothing on desktop Chrome. There is no error event, no rejection — narration just never starts.
**Why it happens:** Chrome's autoplay policy disallows speech synthesis until the user interacts with the page (https://developer.chrome.com/blog/autoplay/#things-to-consider). Firefox and Safari are less strict here, so testing in the "wrong" browser hides the bug.
**Consequences:** A narrated intro story that autoplays on load will be permanently silent in Chrome/Edge — the primary desktop targets of this project.
**Prevention:**
- Treat narration start as a user-gated action: begin after an explicit "Start / Mula" click on the intro/loading screen (which this project already has), never on page load.
- Optionally check `navigator.userActivation.hasBeenActive` before attempting `speak()`.
- The utterance's `onstart`/`onerror` handlers must exist before `speak()`; do not attach them after.
**Detection:** Silent narration in Chrome with DevTools showing no errors; works after any click.
**Source confidence:** **[HIGH]** — Chrome autoplay policy doc (developer.chrome.com/blog/autoplay).

### Pitfall 3: Safari requires speech synthesis per-page activation + hardcoded 15-second utterance cutoff
**What goes wrong:** On Safari (macOS and iOS), (a) `speechSynthesis.speak()` needs to be called from a user gesture within the current page session, and (b) utterances are silently cut off after roughly 15 seconds — a long intro story simply stops mid-sentence with no `onend` or error in some versions.
**Why it happens:** WebKit's speech implementation dispatches synthesis jobs through the system; iOS Safari blocks `speak()` unless it is triggered (directly or via a stored activation flag) by a user gesture, per community-documented Safari behavior and WebKit source discussion (https://stackoverflow.com/questions/68099299/speechsynthesis-speak-not-working-in-safari, https://stackoverflow.com/questions/59927569/speechsynthesis-cut-off-in-safari, https://discourse.wicg.io/t/speech-synthesis-dispatch-sync-bug-on-safari/). The ~15 s limit is a long-standing WebKit quirk widely reported (Stack Overflow threads above, plus community testing).
**Consequences:** The Malay intro story (likely 30–90 seconds of narration) will be truncated on the Safari 26+ target unless chunked.
**Prevention:**
- **Chunk narration into sentences or ~200–300 character segments and queue them as separate utterances.** This is the single most important engineering constraint for this project.
- Prime `speechSynthesis` with a zero-length/empty utterance on the user gesture (a known Safari workaround — https://stackoverflow.com/questions/59682332/safari-web-speech-api-working-unexpectedly, https://stackoverflow.com/questions/66725299/speechsynthesis-speech-cut-short-in-safari).
- Do not rely on `onend` firing for every utterance in Safari; add a watchdog timer to re-kick the queue if an utterance stalls.
- Keep a "skip narration" affordance so a stalled queue never blocks the experience.
**Detection:** Narration stops at ~15 s on Safari/iOS; first `speak()` after navigation does nothing.
**Source confidence:** 15 s cutoff + gesture requirement **[HIGH]** (multiple independent reports, WebKit-related threads); watchdog necessity **[MEDIUM]**.
**Spike recommended:** A Safari 26 + iOS Safari behavior spike is warranted before building the full narration pipeline (see Phase-Specific Warnings).

### Pitfall 4: Chrome's long-utterance cutoff (~15 s / network-voice timeout) and pause/resume bugs
**What goes wrong:** Desktop Chrome also has a widely reported long-utterance bug where speech stops (or the `end` event never fires) for utterances longer than roughly 15 seconds, or when the utterance's `end` event never fires and hangs the queue. `pause()`/`resume()` are additionally broken in Chrome: `pause()` during speech can freeze synthesis irrecoverably, and `resume()` is a no-op if called when not paused on some platforms.
**Why it happens:** Chromium bug tracker items, e.g. https://issues.chromium.org/issues/40108622 (speechSynthesis stops after ~15 s for network voices / long text; long-standing), https://issues.chromium.org/issues/41671978 (utterance never ends / queue hangs), https://issues.chromium.org/issues/40306004 (pause/resume behavior incorrect). Community write-ups: https://stackoverflow.com/questions/21947730/chrome-speechsynthesis-speech-text-long-text-doesnt-work, https://stackoverflow.com/questions/38886468/speechsynthesis-pause-not-working, https://stackoverflow.com/questions/51301469/speechsynthesis-resume-not-working-after-pause-in-chrome.
**Consequences:** Same as Safari: a monolithic long utterance is unreliable on the primary desktop browser; a pause button can permanently kill narration.
**Prevention:**
- The sentence-chunking strategy from Pitfall 3 solves this too — keep each utterance well under ~15 s (~200–300 chars for Malay prose is a safe bound).
- Prefer stop-and-restart over pause/resume: on "pause", call `cancel()` and remember the chunk index; on "resume", re-queue from that index. Do not ship a UI that depends on `pause()`/`resume()` semantics.
- Never rely on `onend` alone to advance the narration script; keep a timeout-based fallback.
**Detection:** Queue stalls after a long paragraph; pause button leaves synthesis dead.
**Source confidence:** **[HIGH]** — Chromium tracker + multiple Stack Overflow reports. (Note: several of the crbug numbers refer to the legacy Monorail tracker; behavior remains reported on current Chrome.)

### Pitfall 5: No `ms-MY` system voice on many platforms — narration silently falls back to Indonesian or English
**What goes wrong:** The entire premise ("narrate in Malay via Web Speech API") fails at the voice-availability layer on a large fraction of devices, and the failure is silent: `speak()` with Malay text and no Malay voice produces garbled pronunciation via the default voice (English voice reading Malay text phonetically), or an Indonesian (`id-ID`) voice reading Malay with wrong words.
**Why it happens:** Voice availability is OS/browser-controlled, not web-controlled.

Platform matrix for Malay (`ms-MY`) speech synthesis voices:

| Platform | ms-MY voice status | Notes | Confidence |
|----------|--------------------|-------|------------|
| Windows 10/11 | **Available** ("Microsoft Anang"/Yusuf-style Malay voice) but **only as an optional language pack** the user must install via Settings → Time & Language → Speech | Not present on default installs; Edge exposes it only after the pack is added. Microsoft's language/voice list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support | **[MEDIUM]** (documented that Malay voices exist as optional packs; exact voice names change by Windows release) |
| macOS | **Not available** by default. Apple's documented `SpeechSynthesis` voice list has no Malay voice; Malay speakers get Indonesian or nothing. https://developer.apple.com/documentation/avfoundation/speechsynthesis/adding-a-voice | "Enhanced"/downloadable voices also do not include Malay | **[MEDIUM-HIGH]** (absence from Apple's published list; absence is harder to "document" than presence — verify at spike time) |
| iOS | Same as macOS: no Malay voice in Apple's voice catalog; Indonesian may be offered as the nearest | Affects Safari on iPhone/iPad | **[MEDIUM-HIGH]** — verify at spike |
| Android | **Usually available** via Google TTS (Speech Services for Google), which lists Malay (`ms-MY`) among supported languages, but only if the user's TTS language is set or the pack auto-downloaded | Chrome on Android uses the system TTS engine; user can also select a third-party engine | **[MEDIUM]** (Google TTS language list: https://support.google.com/accessibility/android/answer/6006983; behavior varies by OEM/ROM) |
| Chrome desktop (network voices) | **Available**: Chrome ships server-side "Google Bahasa Melayu" voices on Windows/Mac/Linux when online | These are the "Google networked" voices with `localService: false`; they vanish offline — see Pitfall 6 | **[HIGH]** (visible in chrome://settings and documented behavior) |
| Edge | Uses "Microsoft Online (Natural)" voices; a Malay natural voice exists in the Azure/Edge voice catalog | Requires network | **[MEDIUM]** |

**Consequences:** "Speak `lang = 'ms-MY'`" is not a sufficient plan. On stock macOS/iOS and default Windows, there is no local Malay voice at all; Chrome's network voice is the only thing that saves the demo on desktop.
**Prevention:**
- Voice resolution must be a graded strategy, not a single lookup: (1) any voice whose `lang` is exactly `ms-MY`; (2) `localService: true` preferred for reliability; (3) explicit user-facing fallback offer (subtitles-only or fetched TTS — Pitfall 7) rather than silent mispronunciation.
- Consider detecting `id-ID` Indonesian voices as a *deliberate, labeled* fallback ("narration in Indonesian") since Malay/Indonesian are partially mutually intelligible — but never substitute silently.
- Show the resolved voice name in the UI debug/perf HUD during development.
**Detection:** `getVoices()` filtered by `ms-MY` returns zero on a clean macOS/iOS device.
**Source confidence:** Matrix above; the *absence* claims are the ones to re-verify in the spike (Apple does not publish a "voices we don't have" page).

### Pitfall 6: Chrome network voices disappear offline / mid-session; `localService` flag matters
**What goes wrong:** Chrome's Google networked voices (`localService: false`) stop being listed (or stop speaking) when the device goes offline, and `voiceschanged` can fire again later with a different voice set — invalidating a voice reference captured earlier. A page that captured a network voice and then loses connectivity hangs or speaks with the default voice.
**Why it happens:** Network voices are fetched on demand from Google servers (documented behavior of Chrome's speech synthesis; see MDN's `SpeechSynthesisVoice.localService` — https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService — and the Chrome autoplay/voice docs referenced above).
**Consequences:** Intermittent narration failure that only reproduces on flaky networks or offline demo laptops — the worst kind of bug for a showcase deployed to Vercel.
**Prevention:**
- Listen for `voiceschanged` for the whole session and re-resolve the voice (ties into Pitfall 1).
- Prefer `localService: true` voices when available, even if lower quality.
- Treat narration as an *enhancement*, not a blocker: the intro story must be fully readable as text on screen with narration optional. This matches the project's existing "optional features return null, keep optional chaining" composition rule (AGENTS.md).
**Detection:** Narration dies after toggling airplane mode; voice list shrinks in DevTools inspection.
**Source confidence:** **[HIGH]** for offline disappearance (MDN `localService` + broad community reports); mid-session `voiceschanged` refire **[MEDIUM]**.

---

## Moderate Pitfalls

### Pitfall 7: Fallback TTS engine options are all meaningfully constrained
**What goes wrong:** The plan "fetch a Malay TTS voice as fallback" hits real limitations for every candidate:

| Option | Malay support | Size / cost | Key limitations | Confidence |
|--------|---------------|-------------|-----------------|------------|
| **Cloud TTS APIs** (Azure Cognitive Services `ms-MY-Osman`/`Yasmin`, Google Cloud TTS `ms-MY-Standard`) | Excellent, documented voices | Pay-per-character; needs API key + backend proxy | **Cannot be called with a secret key from a static Vercel site.** Needs a serverless function; adds latency and cost per play; offline = dead | **[HIGH]** (voice lists: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support, https://cloud.google.com/speech-to-text... text-to-text docs) |
| **piper-tts-web** (WASM/ONNX in browser, rhasspy/piper voices) | Has `ms-MY` voices in the piper voice repo (e.g. `ms_MY-gnu-glasso-medium` and `ms_MY-muhammad-medium` exist in the piper samples/voices collection — https://github.com/rhasspy/piper/blob/master/VOICES.md / rhasspy/piper-voices) | ~60–100 MB ONNX model download, WebAssembly inference | Very large download for a demo; model quality for Malay varies; needs careful memory management alongside a WebGPU scene that already saturates GPU/RAM; ONNX Runtime Web or custom WASM adds ~5–10 MB itself | **[MEDIUM]** (voices exist; *browser runtime fitness with concurrent WebGPU* is unverified — flag as spike) |
| **meSpeak.js / eSpeak-ng WASM** | Malay is supported by eSpeak's language list (https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages.md) | ~2–5 MB | **Robotic quality** — acceptable as accessibility fallback, poor as "cyberpunk narration"; eSpeak's Malay is a formant synthesizer, not neural | **[HIGH]** for support claim, **[HIGH]** that quality is bad for showcase narration |
| **Pre-recorded audio files (narration as MP3/OGG fetched from Vercel)** | Perfect quality, zero runtime risk | Static asset weight; must be re-recorded per script change | Not dynamic, but for a *fixed intro story* this is by far the most reliable path; `<audio>` autoplay still needs the same user-gesture gate (Chrome autoplay policy, same source as Pitfall 2) | **[HIGH]** |

**Prevention / opinionated recommendation:** Because the intro story is fixed content, **prefer pre-recorded narration audio as the "fallback"** (generated once via Azure/Google `ms-MY` neural voices at build time), with live `speechSynthesis` as the zero-download fast path when a local ms-MY voice exists. Only reach for piper-tts-web if narration text must be dynamic. meSpeak is an anti-recommendation for quality reasons.
**Detection:** n/a (design-time decision).
**Source confidence:** Table above.

### Pitfall 8: `speechSynthesis.cancel()` and utterance event races corrupt the narration queue
**What goes wrong:** Calling `cancel()` while an utterance is starting can leave Chrome in a state where subsequent `speak()` calls are ignored; and `onerror` fires with `interrupted`/`canceled` error types that must not be treated as fatal. Also, assigning handlers after `speak()` misses events.
**Prevention:**
- Set all utterance handlers (`onstart`, `onend`, `onerror`, `onboundary`) before calling `speak()`.
- Debounce user-initiated skip/cancel: call `cancel()`, wait a tick (or `onend`/`onerror` of the active utterance), then re-queue.
- Distinguish `error.interrupted`/`error.canceled` from real errors (MDN `SpeechSynthesisErrorEvent`, https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisErrorEvent).
**Source confidence:** **[MEDIUM]** — consistent community reports; exact semantics vary by Chrome version.

### Pitfall 9: iOS Safari-specific synthesis gating and page-visibility interactions
**What goes wrong:** On iOS, speech can stop when the tab is backgrounded or the screen locks, and may not resume; additionally iOS Safari historically required `speak()` inside the direct call stack of the touch handler (not merely after prior activation).
**Prevention:** Queue narration only while `document.visibilityState === 'visible'`; pause the narration queue (via cancel-and-remember, not `pause()`) on `visibilitychange`. Test on real iOS hardware, not just desktop Safari responsive mode.
**Source confidence:** **[MEDIUM]** — long-standing community reports (Stack Overflow Safari threads cited under Pitfall 3); iOS behavior changes frequently across releases — re-verify on current iOS in the spike.

### Pitfall 10: Malay text length / layout expansion in the UI
**What goes wrong:** Translating UI strings from English to Bahasa Melayu typically *expands* text length (commonly 15–30% for EN→MS on short UI strings; Malay uses more function words — "mulakan perjalanan" vs "start"). Fixed-width cyberpunk-styled HUD elements, neon sign labels, and button chrome can clip or wrap badly.
**Prevention:**
- Audit the intro/loading UI and any caption overlay for fixed widths; prefer min-width + wrapping.
- Cap the *narration* text length per chunk (already required by Pitfalls 3/4); Malay sentence structure is slightly longer per proposition than English, so budget chunks by characters, not sentence count.
- Keep the HUD fonts: Malay is Latin-script (plus occasional Arabic-script Jawi which this project does not need), so the existing display fonts render Malay fine — **no font-fallback chain needed** (see Pitfall 11). https://www.w3.org/International/articles/article-text-size (W3C text-expansion guidance).
**Source confidence:** **[MEDIUM]** — expansion percentages are W3C/localization-industry rules of thumb, not Malay-specific measurements.

### Pitfall 11: Hyphenation and CSS `lang` attribute
**What goes wrong:** Browser hyphenation dictionaries for `ms` are inconsistently available (Chrome's hyphenation data and Firefox's dictionaries cover a language list that historically excluded Malay; WebKit's is macOS-dictionary-based where Malay is absent per Pitfall 5's voice-adjacent catalog). Relying on `hyphens: auto` for Malay produces either no hyphenation (acceptable) or long unbroken words overflowing narrow caption boxes.
**Prevention:**
- Set `<html lang="ms">` and `lang` on caption elements (required for correct font shaping, translation tools, and a11y regardless).
- Do not depend on `hyphens: auto`; size caption containers for the longest word or allow horizontal ellipsis on overflow.
**Source confidence:** **[MEDIUM]** — hyphenation dictionary coverage is poorly documented per-language; treat "no hyphenation in some browsers" as the safe assumption.

---

## Minor Pitfalls

### Pitfall 12: `SpeechSynthesisUtterance.rate`/`pitch` clamping and per-voice limits
**What goes wrong:** The spec allows engines to clamp `rate` (0.1–10) and ignore `pitch` for some voices (notably Chrome network voices largely ignore pitch). Cinematic narration settings may silently not apply.
**Prevention:** Test chosen settings with the actual resolved voice; expose rate in the settings panel rather than hardcoding.
**Source confidence:** **[MEDIUM]** — MDN notes engine-dependent behavior (https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance).

### Pitfall 13: `speechSynthesis.speaking`/`pending` are unreliable as state
**What goes wrong:** `speaking` can remain `true` after a hang (Pitfall 4), and `pending` does not reflect queued-but-not-started reliably across browsers.
**Prevention:** Track narration state in app code (current chunk index), not via these flags.
**Source confidence:** **[MEDIUM]** — MDN marks behavior notes; community reports.

### Pitfall 14: WebGPU + WASM TTS contention (if piper-tts-web fallback is chosen)
**What goes wrong:** Running ONNX/WASM inference on the main thread while the WebGPU render loop runs causes frame drops and audio glitches; Worker + `SharedArrayBuffer` requires COOP/COEP headers on Vercel, which can break other embeds.
**Prevention:** If WASM TTS is pursued: run inference in a Web Worker, synthesize ahead-of-time (prefetch whole narration during the loading screen), decode to `AudioBuffer`, and play via Web Audio. Note that `SharedArrayBuffer` needs cross-origin isolation headers (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) — decide deliberately whether to add COOP/COEP to the Vercel config.
**Source confidence:** **[MEDIUM]** — SAB header requirement is **[HIGH]** (MDN); contention magnitude is **[LOW/speculation** until measured — flag as spike**.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **Narration engine (speechSynthesis wrapper)** | Everything in Pitfalls 1–4, 6, 8, 13 hits at once: voice race, gesture gate, 15 s cutoffs, queue hangs | **Highest-risk phase. Needs a dedicated spike FIRST** (see below). Build the wrapper as a chunked queue with watchdog, cancel-and-restart (not pause), and session-long `voiceschanged` handling |
| **Malay voice resolution + fallback selection** | Pitfall 5: no ms-MY voice on macOS/iOS/default Windows; silent mispronunciation | Graded resolution; explicit UI fallback; log resolved voice in debug HUD |
| **Fallback audio path** | Pitfall 7: secret-key-in-static-site mistake; 60 MB WASM download on mobile | Prefer pre-recorded audio fetched from Vercel; gate any WASM option behind desktop + WiFi heuristics like existing `performanceProfile` patterns |
| **i18n / Malay UI strings** | Pitfalls 10–11: text expansion clipping cyberpunk HUD chrome; hyphenation absent | Audit fixed widths; `<html lang="ms">`; no reliance on `hyphens: auto` |
| **Settings/UX (voice picker, rate)** | Pitfall 12: per-voice clamping; also voice list differs per platform so a hardcoded voice list in settings UI will be wrong | Enumerate `getVoices()` at runtime; filter client-side |
| **Mobile / Safari 26 verification** | Pitfalls 3, 9: iOS gesture scoping, visibility stalls | Real-device test matrix: Chrome Win (online + offline), Edge Win, Safari macOS, iOS Safari, Chrome Android |
| **Deploy (Vercel)** | Pitfall 14 (only if WASM route taken): COOP/COEP headers; large model files in repo size limits | Decide early; if pre-recorded audio chosen, no header changes needed |

**Recommended pre-roadmap spike (flag for the roadmap):** a one-day spike building a minimal "click → speak Malay sentence, chunked" page tested on the full device matrix above. It resolves the **[MEDIUM]** platform-matrix entries (macOS/iOS ms-MY absence, Safari 26 15 s behavior, Android Google TTS availability) which are currently the least-certain, highest-impact unknowns.

---

## Testing / Verification Gaps the Roadmap Must Flag

1. **No headless/CI coverage is possible for speechSynthesis.** Chrome's speech synthesis does not work in headless mode (community-documented; Playwright/Puppeteer do not exercise real TTS engines), so narration cannot be covered by automated browser tests — UAT must be manual on real devices. **[MEDIUM]**
2. **Offline behavior** (Chrome network voices vanishing — Pitfall 6) needs an explicit test case: load page online, go offline, play narration.
3. **`voiceschanged` timing** varies by OS voice count — test on a device with many installed voices vs. a clean VM.
4. **Cross-browser event semantics** (`onerror` types, `onend` reliability) — a small per-browser behavior matrix should be produced during the spike and kept as a doc in `docs/techniques/` per project convention.
5. **Malay text expansion** — no automated layout regression test exists in the project; at minimum add a manual checklist item for the HUD/caption components at the longest string.
6. **Audio/scene contention** (frame budget while narration plays) — extend the existing `performanceProfile` verification with "narration playing" as a test condition, per the AGENTS.md rule that new expensive work must have a budget.

## Sources

- MDN Web Docs — `SpeechSynthesis.getVoices()`, `voiceschanged`, `SpeechSynthesisVoice.localService`, `SpeechSynthesisErrorEvent`, `SpeechSynthesisUtterance`, `SharedArrayBuffer` (developer.mozilla.org)
- Chrome autoplay policy — https://developer.chrome.com/blog/autoplay/
- Chromium bug tracker — issues 40108622, 41671978, 40306004 (long-utterance cutoff, hanging end events, pause/resume)
- Stack Overflow — 21947730, 38886468, 51301469 (Chrome long text / pause / resume), 59682332, 59927299, 68099299, 66725299 (Safari gating, 15 s cutoff, priming workaround)
- WebKit / W3C — WebKit speech synthesis dispatch behavior discussions on WICG discourse
- Microsoft — Azure Speech language/voice support (ms-MY voices, Windows language packs): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
- Apple — AVFoundation SpeechSynthesis voice documentation (voice catalog, no Malay entry): https://developer.apple.com/documentation/avfoundation/speechsynthesis/adding-a-voice
- Google — Android Text-to-speech supported languages: https://support.google.com/accessibility/android/answer/6006983
- rhasspy/piper — VOICES.md / piper-voices repo (ms_MY voice availability)
- espeak-ng — docs/languages.md (Malay supported, formant quality)
- W3C Internationalization — article-text-size (EN→MS expansion guidance)
