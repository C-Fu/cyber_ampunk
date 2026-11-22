# Feature Landscape

**Domain:** Localized bilingual (BM/EN) WebGPU/TSL demo experience — subsequent milestone on existing app
**Project:** Cyberpunk Malaya
**Researched:** 2026-11-22
**Overall confidence:** HIGH (UX patterns well-sourced; TTS platform reality well-sourced; project-fit findings verified against code)

## Scope Note

This research answers: *what do users expect from a localized bilingual (BM/EN) web experience?* It is grounded in UX best-practice sources (NN/g, Smashing Magazine, W3C WAI, Google Search Central, MDN, Readium speech) and in a scan of the existing codebase (`src/ui/`, `src/platform/userPreferences.js`, `src/app/createIntroFlow.js`, `index.html`). Existing app facts used below: settings live in a modal panel (`createSettingsPanel.js`); there is already a `localStorage` wrapper with try/catch (`userPreferences.js`); the intro is an overlay + ENTER button flow (`createIntroFlow.js`); `index.html` has `lang="en"`, title, OG/Twitter meta; the UI already uses `aria-label`, `aria-live`, `role="dialog"`; no TTS code exists yet.

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Language toggle in the header (visible before entering) | NN/g and Smashing Magazine both find users look to top corners first, then footer. Since BM is the default, an EN speaker's *first* action will be finding the switch — it must be visible without opening a modal. Existing header (`createHeader.js`) is the natural host. | Low | For a two-language site, USWDS recommends *skipping the selector UI entirely*: plain-text toggle "BM | EN" in the header, each in its own language, always visible. Avoid flags (they map countries to languages; NN/g, Smashing, USWDS all recommend against). If a labeled control is preferred, globe icon + label works. |
| BM as default with persisted override (localStorage) | The milestone goal. NN/g Tip 1: default should match user needs, but an explicit user choice must always outrank any guess; persistence across visits is expected. Existing `userPreferences.js` already has the safe localStorage wrapper pattern to copy. | Low | First-visit behavior: use `navigator.languages` to detect — if none start with `ms` or `id`, consider still defaulting to BM (project's stated identity) but make the EN toggle prominent. Do NOT auto-redirect or force; "suggest, don't force" (Smashing/Bablic). |
| Full parity of ALL user-facing strings in both languages | Partial translation reads as broken. NN/g: users whose language is half-present have a worse experience than a clean single-language site. Must cover: header, settings panel, about, intro story, walk hints, HUD, performance notice, loader overlay. | Med | Central string dictionary (per-language JSON or JS object) with a `t(key)` lookup, applied at render and on language switch. Avoid scattering literals across `innerHTML` templates. |
| Instant language switch without reload | Users expect switching to keep them in place (Bablic: "keep visitors on the same page"). For an SPA demo, a reload would kill the WebGPU scene and feel like a crash. | Med | Re-render text-bearing DOM from the dictionary; update `document.documentElement.lang` at switch time. Test that all text nodes are covered — the switch is the parity test. |
| Update `<html lang>` and `document.title` on switch | W3C i18n: always declare `lang` on `<html>`; screen readers use it to pick pronunciation. Stale `lang="en"` while showing BM text makes screen readers read Malay with English phonemes. Title localization is expected for bookmarks/tabs. | Low | Also update `meta name="description"` / OG tags is *nice-to-have* (see below) since they matter for crawlers, not runtime users. |
| Narration is user-initiated or clearly announced + stoppable | WCAG 1.4.2 (Level A): audio playing >3 s needs pause/stop/mute control; W3C explicitly states audio "started by an action initiated by the user" is the preferred pattern, and that a "button with clear labelling or context that it will start an experience where audio will play" counts as user-initiated, not autoplay. Section508.gov and BBC accessibility guidance say the same. **This is the key tension with "auto-starting TTS"** — see Anti-Features. | Low–Med | The intro's existing ENTER button is a user gesture — starting narration *on ENTER press* is both WCAG-compliant (sufficient technique G171: "playing sounds only on user request") and satisfies the autoplay policies (first `speak()` must be inside the tap handler on iOS; Chrome has required user activation since M71). |
| Narration mute/stop control that persists | BBC: "user preferences should persist." A user who muted narration once should not get it again next visit. | Low | Store alongside language preference in localStorage. |
| Graceful degradation when ms-MY voice is missing | ms-MY is rarely preloaded (Readium: Chrome desktop ships 15 languages, voices vary wildly by OS/browser; Chrome Android may silently substitute an English voice). A predictable fallback (closest Malay/Indonesian voice, else network voice, else clear "narration unavailable" state) is table stakes — silent wrong-language speech is worse than none. | Med | Readium + crash-course sources: call `getVoices()` AND listen to `voiceschanged` (async load); normalize `voice.lang` (`ms_MY` underscores on Android); pick by `lang` prefix, never by voice name or `default` flag; set `utterance.lang` to match the chosen voice. |
| Screen-reader / a11y basics carried through both languages | Existing UI already has `aria-label`/`aria-live`/dialogs (verified in code). All localized strings that feed ARIA labels must come from the dictionary so language switch updates them too; otherwise SR users get mixed-language announcements. | Low | Also: `aria-live` regions should announce language changes if they re-announce content. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| KL-cyberpunk-flavored BM intro story rewrite | The emotional core of the milestone — a localization that is *culturally* specific (KL references, BM register) rather than translated boilerplate. NN/g notes localization (not just translation) is what international users notice and value. | Med | Creative writing task + integration with `createIntroOverlay` text nodes. Keep EN version as a parallel flavor, not a literal translation, for parity of tone. |
| Auto-starting Malay TTS narration of the intro (gesture-anchored) | A narrated, cinematic intro is rare on web demos and fits the cyberpunk mood. Delivered as: narration starts automatically when user presses ENTER (the gesture), with a visible pre-entry notice ("naratasi bunyi akan dimulakan" + mute toggle). This matches WCAG 1.4.2's preferred "user-initiated start" pattern (G171) and clears browser autoplay policies (iOS requires the first `speak()` in the same tap handler; Chrome has required user activation since M71). | Med | Technical musts from MDN/crash-course: first `speak()` synchronously inside the ENTER tap handler; `utterance.lang = "ms-MY"`; voices loaded via `voiceschanged`; cancel on skip (`speechSynthesis.cancel()`); **Chromium bug: utterances >~15 s can cut off / fire `end` early** (Chrome-only) — chunk the story text into sentence-level utterances queued in sequence, which also makes pause/resume and highlight-per-sentence possible later. |
| Network-voice fallback chain (ms-MY → id-ID → any `ms`/`id` prefix → default + notice) | Robust narration on devices without local Malay voices; Indonesia-Malay mutual intelligibility makes id-ID the natural network fallback. Nobody expects this level of care; everyone notices when it works. | Med | Chrome desktop Google voices and Edge natural voices are network (`localService: false`) — check at runtime before promising offline. Readium testing confirms ms-MY is commonly missing or silently substituted on Android; chunking + lang-prefix matching is the resilient combination. |
| Language preference honored by TTS (narrate in the displayed language) | Narration language follows UI language — EN UI gets EN narration. Feels obvious when done, jarring when missed. | Low | Driven off the same dictionary entry used for the intro text. |
| Localized social/meta surface (title, description, OG/Twitter) | For a shareable demo, localized meta + title makes BM shares read natively in messaging apps and search snippets. Google states it detects language from visible content, not `lang` attributes, so the *content* being BM matters most; meta localization is polish. | Low | Runtime swap of title/description/OG tags on language switch. Single-URL SPA means no hreflang needed (Google: different URLs recommended for full sites, but a client-side demo toggle does not require it — do not build URL-based locale routing for this project). |
| Replay-narration / tap-to-listen button on the intro | Accessibility-friendly pattern: even with auto-start, a replay control lets users re-hear the story, and acts as the recovery path if autoplay was blocked. | Low | Reuse the same utterance builder; safe because it is a user gesture. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-starting narration *before any user gesture* (on page load / loader overlay) | Blocked by browser autoplay policy (Chrome: `not-allowed` error event, silent; iOS WebKit: silently dropped) — so it technically fails for first-time visitors, exactly the audience a welcome narration targets. WCAG 1.4.2 + W3C guidance: unannounced audio interferes with screen readers and startles users. A test on the dev's own machine passes only because of media-engagement allowlisting. | Anchor narration to the existing ENTER button press: auto-play *from that gesture*, with prior on-screen notice and a visible mute. |
| Un-mutable, un-stoppable narration of any length | WCAG 1.4.2 Level A failure (F23/F93); BBC: must be "fully and immediately accessible" stop. | Visible mute/stop from the first seconds of narration; persisted preference. |
| Flags as the language toggle icon | Both NN/g and Smashing/Bablic: flags represent countries, not languages, and the mapping breaks (BM spans MY/BN/ID region; no flag owns English). | Text labels ("BM"/"EN") or a globe glyph, per Helios pattern. |
| IP-based language auto-redirect or forced locale routing | Project is a single-URL SPA demo; Google recommends against redirect-based language switching; Smashing catalogues the frustration. Detection via `navigator.languages` as a *default hint* only, with the explicit toggle always winning. | Default BM (project identity), prominent header toggle, localStorage persistence. |
| Full i18n framework (ICU messages, pluralization rules, locale date/number formatting) | Two languages, a few dozen strings, zero locale-formatted numbers/dates. An i18n *framework* is over-engineering. | A small typed string dictionary + `t(key)` + a `setLanguage()` that re-renders text nodes and swaps `lang`/title. Match existing factory style (AGENTS.md). |
| Pre-recorded/streamed audio narration files (mp3 per language) | Bundle weight, asset management, and the milestone explicitly targets Web Speech API. Recorded audio only becomes worthwhile if TTS quality is unacceptable — decide after testing ms-MY voices on target browsers. | Web Speech API with fallback chain; revisit only if quality fails. |
| Choosing TTS voice by name or `voice.default` flag | Readium: `voiceURI`/`name` are inconsistently implemented; `default` is unreliable across Chrome/Safari/Firefox. | Match on normalized `voice.lang` prefix (`ms` → `id` → documented fallback), set `utterance.lang` to agree. |

## Feature Dependencies

```
String dictionary (all surfaces) → Language toggle + instant switch → <html lang>/title swap
String dictionary → BM intro story rewrite → TTS narration (intro strings)
TTS narration → gesture-anchored start (ENTER button) → mute/stop control → persisted preference
TTS narration → voice selection chain (getVoices + voiceschanged + lang matching) → network fallback + unavailable state
```

## MVP Recommendation

Prioritize:
1. String dictionary + full BM localization of every user-facing surface (header, settings, about, intro, walk hints, HUD, performance notice, loader) — the parity switch is the core.
2. Header language toggle, persisted via existing `userPreferences.js` pattern; instant switch; `<html lang>` + `document.title` update.
3. BM intro story rewrite (KL flavor) — the milestone's identity; ship with the dictionary, not after.
4. Gesture-anchored TTS narration with mute control and the ms-MY → id-ID → fallback chain (the one true differentiator).

Defer:
- Localized OG/Twitter meta runtime swap: low value for a demo; title alone covers the tab/bookmark case. Reason: polish, not visible to most users.
- Replay/tap-to-listen button: cheap follow-up, but not needed if auto-start-from-ENTER works. Reason: recovery path only matters once failure modes are observed in the wild.
- Any URL-based locale routing / hreflang: single-URL SPA; Google's own guidance makes it optional here. Reason: over-engineering.

## Sources

- Nielsen Norman Group, "6 Tips for Improving Language Switchers" (nngroup.com/articles/language-switching-ecommerce) — placement, defaults, persistence. Confidence: HIGH.
- Smashing Magazine, "Designing A Perfect Language Selector UX" (Vitaly Friedman, 2022) — avoid auto-redirects, flags, decoupling language from country. Confidence: HIGH.
- US Web Design System (USWDS), "Language selector" pattern (designsystem.digital.gov) — recommends *no language selector at all* for two-language experiences: always offer both languages with plain-text links in the header; never use flags or maps; offer the language in its native name ("English | Malti"). Directly applicable to a BM/EN pair. Confidence: HIGH (US government design system).
- Bablic, "Website Language Selector: Design Best Practices" (2026-10) — native names, no flags, stay on page, remember choice. Confidence: MEDIUM (vendor content, consistent with NN/g).
- Helios (HashiCorp) Design System, "Language selection" pattern — header utility placement, native-name-first list, persistence. Confidence: MEDIUM (single design system, aligned with NN/g).
- W3C WAI, "Understanding SC 1.4.2: Audio Control" (WCAG 2.2 Level A) — autoplay audio must be pausable/stoppable/mutable; explicit clarification that a labeled button triggering the audio experience counts as user-initiated, not autoplay; technique G171 "playing sounds only on user request". Confidence: HIGH (normative standard).
- Section508.gov, "Avoid Auto-Playing Content" (rev. 2026-05) — autoplay interferes with screen readers; controls within first elements. Confidence: HIGH.
- BBC Accessibility for Products, "Autoplay" — warn user + provide control; preferences persist. Confidence: HIGH.
- MDN, "Autoplay guide for media and Web Audio APIs" — autoplay blocking rules, user-activation requirement. Confidence: HIGH.
- MDN, "SpeechSynthesis" — API surface, `voiceschanged`, queue. Confidence: HIGH.
- TryDeputize, "SpeechSynthesis Crash Course" (2026-09) — measured Chrome behavior: user-activation gate (live in Chrome ≥71), iOS synchronous-first-tap requirement, async voice loading, pick by `lang`, keep `utterance.lang` in agreement, underscore normalization, Chromium long-utterance cutoff (~15 s) with sentence-chunking workaround. Confidence: MEDIUM (practitioner blog, but measurement-backed and consistent with MDN/Readium).
- Readium speech, "SpeechSynthesis in browsers and OSes" — voice availability by OS/browser, ms-MY scarcity, Chrome Android substitution behavior, `localService`/network voices. Confidence: HIGH (dedicated cross-platform testing project).
- W3C Internationalization, "Declaring language in HTML" — `lang` on `<html>`, BCP 47 tags, screen-reader impact. Confidence: HIGH.
- Google Search Central, "Localized Versions of your Pages" + "Managing multi-regional and multilingual sites" — hreflang optional for single-URL SPA, language detected from visible content. Confidence: HIGH.
- Codebase scan (2026-11-22): `src/platform/userPreferences.js`, `src/ui/chrome/createSettingsPanel.js`, `src/app/createIntroFlow.js`, `index.html`, `src/ui/*` aria usage. Confidence: HIGH (directly verified).
