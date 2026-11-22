# Technology Stack — i18n + Malay TTS

**Project:** Cyberpunk Malaya (Threejs-Punk fork, Vite + vanilla ES modules, WebGPU/TSL)
**Dimension:** STACK (client-side i18n and Malay text-to-speech options)
**Researched:** 2026-11-22
**Overall confidence:** HIGH (i18n approach, Web Speech API constraints) / MEDIUM (exact per-OS ms-MY voice availability — must be feature-detected at runtime regardless)

## Key Findings

1. **The UI text surface is tiny and factory-generated.** All user-visible copy lives in ~8 files (`src/ui/chrome/createHeader.js`, `createSettingsPanel.js`, `createAboutPanel.js`, `createAudioButton.js`, `src/ui/intro/createIntroOverlay.js`, `createPerformanceNotice.js`, `src/ui/walk/createWalkPrompt.js`, `createWalkControlsHint.js`, `createMoveHint.js`, `createHudPanel.js`, `createVirtualJoystick.js`) as `innerHTML` template strings inside factory functions. A full i18n library buys nothing here — a hand-rolled dictionary-module approach is smaller than any library's gzip footprint and matches the existing composition pattern (`main.js` builds plain objects; optional features return `null`).
2. **i18next is the only library worth considering — and it's still overkill.** Latest is 27.2.4 (verified against the npm registry), actively maintained, framework-agnostic, ES-module native. But its value (namespaces, ICU plurals, backend plugins, many locales) is wasted on 2 locales × ~100 strings. Everything else in the ecosystem (Lingui, FormatJS, Fluent) is worse fit for a no-framework, no-build-macro codebase.
3. **Web Speech API `speechSynthesis` is the right TTS choice for the stated goal, with a mandatory voice-selection strategy.** Voices come from the OS plus browser network voices — availability of `ms-MY` varies wildly per platform. Edge desktop exposes 250+ Azure neural voices across ~75 languages (includes ms-MY "Online (Natural)"); Chrome desktop ships only ~19 Google network voices across 15 languages (no Malay expected); Android uses the system TTS engine (Google TTS supports Malay, with documented Chrome-on-Android voice-list quirks); iOS/macOS use Apple system voices (Malay availability varies, often downloadable).
4. **Piper (WASM TTS) has no viable Malay voice.** The official `rhasspy/piper-voices` catalog (VOICES.md, verified) contains no `ms` entry — closest is Indonesian (`id_ID`). A third-party "malay-ms-medium" model exists on PiperHub but was trained with a Vietnamese phonemizer and has an unspecified license: unusable. Models are also ~60 MB each. Rule out Piper for this milestone.
5. **The Web Speech API has hard runtime constraints the intro narration must be designed around:** user-gesture requirement (Chrome 71+; iOS requires the first `speak()` to fire synchronously inside a tap handler), asynchronous voice list (`getVoices()` empty on first call in Chromium — wait for `voiceschanged`), a ~15-second silent cutoff on Chrome's *network* voices (split narration into sentence-sized utterances), broken `pause()` on Android, and **no access to the synthesized audio stream** (narration cannot be routed through the app's WebAudio graph or post effects).

## Recommendations

### i18n: hand-rolled ES-module dictionaries (no dependency)

Use `src/i18n/` with:

| Module | Responsibility |
|--------|----------------|
| `src/i18n/createI18n.js` | Factory returning `{ t(key), getLocale(), setLocale(), onChange(cb) }`; persists to `localStorage`; sets `document.documentElement.lang` |
| `src/i18n/locales/ms.js` | `export default { ... }` — Bahasa Melayu strings (the default locale) |
| `src/i18n/locales/en.js` | English strings (full parity) |

**Why this wins for this codebase:**

- **Zero dependencies, zero bytes of library code.** The entire UI corpus is a few KB of plain object literals.
- **ES modules over JSON** — allows template literals for the intro story, comments for translator context, and Vite handles both identically.
- **Fits the factory pattern** — each UI factory receives the `t` function (or the i18n object) like it receives `features`/`performanceProfile` today; on locale toggle, re-run the DOM-building factories (they already rebuild `innerHTML` from scratch, so a `render()`-per-factory or recreate-UI pass is a small mechanical change).
- **Default `ms`, toggle to `en`** wired into the existing `createSettingsPanel.js`; use `Intl.DisplayNames` (built-in, zero-dep) to render native labels ("Bahasa Melayu" / "English").
- **No lazy-loading complexity** — with 2 locales, import both eagerly; Vite bundles them into the JS graph. Switch to dynamic `import()` per locale only if locale count ever grows past ~4.
- **Narration parity for free** — keep the intro-story narration script (the text TTS speaks) in each locale module, so language toggle switches both UI and narration text atomically.

**Choose i18next instead if:** the project ever needs >4–5 locales, ICU-style pluralization/gender rules, or server-driven translations. Migration from dictionary modules to i18next is mechanical (keys map 1:1), so this choice is cheap to reverse.

### TTS: Web Speech API with an explicit voice fallback chain

Implement a `createNarration.js` (suggested home: `src/ui/intro/` or `src/audio/`) that:

1. **Voice selection strategy (ordered):**
   1. Local `ms-MY` / `ms-*` voice (`voice.lang.startsWith('ms')`, prefer `voice.localService === true`).
   2. Network `ms-MY` voice — Edge's "Microsoft … Online (Natural)" Azure neural voices (Khalisa/Osman) are network voices; they need connectivity and can be disabled by enterprise policy (`ConfigureOnlineTextToSpeech`).
   3. **Cross-language fallback: `id-ID` (Indonesian)** — mutually intelligible with Malay for narration purposes and far more commonly installed (Chrome's Google network voices include Indonesian; Piper/Azure/Google all ship Indonesian voices). Offer this explicitly rather than silently.
   4. No usable voice → show narration as on-screen text only (the intro overlay already renders the story text; narration is an enhancement, not a gate).
2. **Handle the constraints (all verified):**
   - Start narration from a user gesture — the intro overlay's start/click interaction satisfies this; on iOS the first `speak()` must be synchronous inside that handler.
   - Call `getVoices()` once, listen for `voiceschanged`, stop waiting after a timeout (Safari returns immediately; Chromium populates late).
   - **Split the narration into sentence-sized utterances** chained via `onend` — this defeats Chrome's ~15 s network-voice cutoff and enables cancel-per-sentence.
   - Treat `pause()` as stop-and-remember-position (Android); treat `cancel()`-triggered `error` events (`interrupted`/`canceled`) as non-errors.
3. **Ultimate-quality fallback (recommended as a follow-up phase, not v1):** since the intro story is fixed copy, pre-synthesize the narration once with a cloud TTS (Azure `ms-MY-KhalisaNeural`/`ms-MY-OsmanNeural`, or Google Cloud `ms-MY-*` voices) and ship it as a small compressed audio asset (~1–2 MB for a 60–90 s story). This gives every visitor identical, high-quality Malay narration with zero runtime voice risk, and the Web Speech API path remains for dynamic text. Cloud TTS APIs require an API key and therefore a server proxy — never ship a key in this client-side bundle.

### Recommended Stack table

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Hand-rolled i18n modules (`src/i18n/`) | — | UI + story localization, ms default / en parity | Zero deps; matches factory/composition pattern; text surface is ~8 files |
| `Intl.DisplayNames` | browser built-in | Native locale names in settings toggle | Zero-dep, correct diacritics |
| Web Speech API (`speechSynthesis`) | browser built-in | Malay TTS narration + fallback chain | No bundle cost; only option with zero-dep runtime synthesis; user-gesture and chunking constraints are manageable for a fixed intro script |
| Pre-synthesized narration audio (optional, later) | — | Guaranteed-quality Malay narration asset | Fixed story copy makes runtime TTS risk avoidable; generated offline via Azure/Google cloud TTS |

### Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| i18n | Hand-rolled dictionary modules | i18next 27.2.4 | Excellent library, wrong scale: namespaces/ICU/backends unused at 2 locales × ~100 strings; adds a dependency to a deliberately dependency-light project. Correct choice if locale count grows. |
| i18n | Hand-rolled | Lingui / FormatJS (intl-messageformat) / Fluent | Macro- or DOM-centric designs aimed at React/complex-app workflows; add build complexity for no benefit here. |
| TTS | Web Speech API | Piper TTS (WASM, onnxruntime-web) | No official Malay voice in rhasspy/piper-voices (verified); only third-party ms model uses a Vietnamese phonemizer, unspecified license; ~60 MB model downloads. |
| TTS | Web Speech API | meSpeak.js (eSpeak-ng WASM) | eSpeak-ng does support Malay (`ms`), and meSpeak runs fully offline — but multi-MB payload, distinctly robotic quality that clashes with a polished cinematic intro, and stale maintenance. Viable only as a "guaranteed offline" last resort; the id-ID speechSynthesis fallback achieves more for less. |
| TTS | Web Speech API (runtime) | Cloud TTS at runtime (Azure / Google Cloud / ElevenLabs) | Requires API key + server proxy (project is static, deployed to Vercel); adds latency, cost, and privacy surface. Only sensible as an offline pre-generation step (see above). |

### Installation

```bash
# Recommended path: nothing to install
# (i18n = local ES modules in src/i18n/; TTS = browser built-ins)

# Only if locale count grows and i18next is adopted later:
# npm install i18next
```

## Sources

- i18next on npm — latest 27.2.4, 617 KB unpacked, no deprecation: https://registry.npmjs.org/i18next (fetched 2026-11-22) — HIGH
- MDN Web Speech API overview: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API — HIGH
- Browser speechSynthesis support matrix, autoplay/user-gesture rule, ~15 s Chrome network-voice cutoff, voiceschanged behavior (reviewed 2026-10-04): https://textintoaudio.com/browser-support — HIGH (cross-checked with MDN)
- Readium speech — per-browser/OS voice provenance (Edge 250+ voices/75 languages incl. natural neural voices; Chrome desktop 19 network voices/15 languages; Android Chrome voice-list quirks; Edge `ConfigureOnlineTextToSpeech` policy): https://readium.org/speech/docs/WebSpeech.html — HIGH
- Microsoft Edge policy `ConfigureOnlineTextToSpeech` (online voice fonts = Azure Cognitive Services, policy-gated): https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/configureonlinetexttospeech — HIGH
- Azure Speech language support (ms-MY neural voices: `ms-MY-KhalisaNeural`, `ms-MY-OsmanNeural`; page truncated at fetch, names cross-checked against Azure voice catalog knowledge): https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts — MEDIUM
- Piper official voice list (no Malay entry; Indonesian `id_ID` present): https://github.com/rhasspy/piper/blob/master/VOICES.md — HIGH
- PiperHub third-party Malay model (Vietnamese phonemizer, unspecified license — not production-usable): https://piperhub.org/model/malay-malay-ms-medium/ — HIGH (as evidence of unusability)
- eSpeak-ng languages doc (Malay `ms` supported — relevant only to meSpeak fallback): https://github.com/espeak-ng/espeak-ng/blob/master/docs/languages.md — HIGH
- Google Cloud Text-to-Speech Malay voices (ms-MY Standard/WaveNet): https://cloud.google.com/text-to-speech/docs/list-voices-and-types — MEDIUM (not re-verified this session)

## Codebase evidence (local, HIGH)

- `package.json` — dependencies are only `gsap`, `three`, `three-mesh-bvh`; adding an i18n library would be the first non-graphics runtime dep.
- Text-bearing UI files enumerated via grep: `src/ui/chrome/` (header, settings, about, audio button), `src/ui/intro/` (overlay, performance notice), `src/ui/walk/` (hud, prompts, hints, joystick) — all `innerHTML` template strings in factories, plus two `textContent` assignments in `createWalkPrompt.js` ("Drag to look around" / "Click to look around").
- No existing i18n, locale, or `speechSynthesis` code in `src/` (one unrelated `localeCompare` in `src/debug/createDevAppApi.js`).

## Open Questions (for phase-level research)

- Exact ms-MY voice presence on target OS matrix (Windows speech pack names, macOS/iOS downloadable Malay voices) — resolve empirically at runtime via `getVoices()` feature detection; the fallback chain makes this a non-blocker.
- Whether Edge's Online (Natural) ms-MY voices honor `pitch`/`rate` reliably (documented issues with pitch on natural voices) — test during implementation.
- Best UX for the id-ID cross-language fallback (explicit "suara Bahasa Melayu tidak dijumpai" notice vs. silent fallback) — copy/product decision, not technical.
