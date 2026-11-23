# Phase 1: i18n Foundation - Research

**Researched:** 2026-11-22
**Domain:** Hand-rolled bilingual dictionary store (BM default / EN parity) for a no-framework Three.js WebGPU factory-composition UI
**Confidence:** HIGH (every claim below verified by reading the actual source files this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Hand-rolled ES-module dictionaries in `src/i18n/` — no i18n framework, no new dependencies — **Reversibility:** costly — every migrated factory imports the store API; migrating away later touches all call sites
- **D-02:** Store replicates the `src/audio/audioState.js` module-scope pub/sub pattern: `t()`, `setLanguage`, `subscribe` — plain, matches codebase conventions
- **D-03:** Factory consumption via lookup function + per-factory `syncText()` re-sync on subscription (NOT string injection, NOT appShell teardown). `createWalkPrompt` already has a `syncCopy` hook proving the pattern
- **D-04:** `innerHTML` blocks (about panel) migrate via `data-i18n` spans + `textContent` writes (XSS-safe)
- **D-05:** `index.html` static head is BM in the raw HTML source (hardcoded baseline); JS swaps to EN only when a stored preference says EN (toggle arrives in Phase 2 — the swap path is built now, dormant)
- **D-06:** `document.documentElement.lang` must be `"ms"` for BM (the HTML language code, not any internal store key)
- **D-07:** Flat dot-notation keys (`header.title`, `settings.quality`) in a single dictionary object per language — simple greppability, no deep-merge complexity
- **D-08:** Missing-key behavior: loud fallback in dev (console.warn + show the key so gaps are visible during the owner's BM review), silent EN fallback in production
- **D-09:** BM tone for UI chrome: formal-clean BM ("Tetapan", "Tentang", "Kualiti") with light cyberpunk flavor reserved for the intro story (Phase 2) — labels stay functional, not slangy
- **D-10:** AI drafts all Malay copy; the owner reviews and corrects wording in the dictionary files (milestone-level decision). Dictionary files must be easy to review — plain, alphabetically stable structure

### the agent's Discretion

- Dictionary file naming (`dictionaries/bm.js` + `dictionaries/en.js` per ARCHITECTURE.md research vs `strings-ms.js`)
- Exact key taxonomy/grouping per UI factory
- How loader statuses in `src/main.js` reach the loader overlay (direct `t()` calls at set time vs a small sync helper)
- CSS adjustments for the 15–30% EN→MS text expansion (HUD chrome widths) — follow existing CSS patterns, no layout redesign

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. Phase 2 owns: language toggle UI (LANG-01), persistence restore UX (LANG-02), browser-language hint (LANG-04), intro story BM rewrite (INTRO-01/02). Phase 3 owns TTS.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOC-01 | All user-facing text renders in BM by default across every UI surface | Complete string-site inventory below (every hardcoded English string, file, line, DOM target); migration order with dependencies |
| LOC-03 | `document.documentElement.lang` and `document.title` swap at runtime with the active language | `setLanguage` side-effect slot in the store shape (§ Store Shape); `staticHead.js` swap path reading stored preference |
| LOC-04 | Static `index.html` head text (title, meta description) is localized with BM hardcoded baseline, EN via JS only when stored preference says EN | `index.html` full inventory below (all 20+ meta/localizable nodes); `userPreferences.js` extension point verified |
| LOC-05 | OG/Twitter card meta tags localize with the active language | og/twitter/twitter:image:alt nodes catalogued with their `content`-attribute write mechanism |
| LANG-03 | Every string exists in both BM and EN dictionaries — full parity | Static parity check design (§ Validation Architecture) — a Node script comparing key sets of `bm.js` vs `en.js`, no test framework needed |
</phase_requirements>

## Summary

Phase 1 is a **pure additive migration** over a codebase that has zero i18n today. Every user-facing string lives in one of 15 JS factories plus `index.html` plus 8 loader-status call sites in three non-UI files. This research read every one of those source files and produced a complete string-site inventory (below), the exact `src/i18n/` store shape (a verbatim-shaped replication of `src/audio/audioState.js`, quoted below), and a factory-by-factory migration order sequenced so the store and dictionaries land first, then leaf factories (no dependents), then the two composite surfaces (about panel `innerHTML` block, `index.html` head).

Two structural findings matter for planning. First, **loader statuses are spread across 3 files, not 1**: `src/main.js` (4 calls), `src/runtime/warmup.js` (2 calls — a file the CONTEXT.md didn't list but AGENTS.md routing covers under "Startup"), and `src/world/createWorld.js` (2 calls — inside the world subtree AGENTS.md says to touch minimally). These are `t()`-at-call-time sites (no subscription needed since each call re-renders), keeping the change surgical. Second, **the HUD (`createHudPanel.js`) is aria-hidden decorative chrome whose labels ("VITALS", "ENERGY", "SIGNAL", "%") are set-dressing English tech jargon** — the phase decision is whether these count as LOC-01 text (translate) or stay as in-world aesthetic. Milestone research treats `hud.*` as a namespace, and the REQUIREMENTS LOC-01 list explicitly includes "HUD", so they translate; the % values are interpolated numbers, not dictionary strings.

**Primary recommendation:** Build `src/i18n/i18n.js` + `dictionaries/bm.js`/`en.js` + `staticHead.js` first (Wave 1), migrate factories leaf-first (Wave 2: walk/intro/loader; Wave 3: chrome panels + header; Wave 4: main.js/warmup/createWorld statuses + index.html), and gate every wave with `npm run build` + the parity script (§ Validation Architecture).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dictionary storage + lookup (`t()`) | Browser / Client (ES module singleton) | — | Static site, no SSR, no backend; dictionaries are a few KB and must live in the single Vite bundle for runtime swap |
| Language state + pub/sub | Browser / Client (`src/i18n/i18n.js`) | — | Replicates the sanctioned `audioState.js` module-scope store pattern (D-02) |
| `<html lang>` / `<title>` / meta swap | Browser / Client (`staticHead.js`) | — | DOM attribute writes at boot + on `setLanguage` |
| Language persistence | Browser / Client (`userPreferences.js` + localStorage) | — | Existing pattern; Phase 2 restores it, Phase 1 only builds the swap path (D-05) |
| Loader status text | Browser / Client (call-time `t()`) | — | Statuses re-render on every `setStatus` call — no subscription machinery needed |
| Render loop / GPU work | — | — | **Not touched at all** (AGENTS.md: `createRenderLoop.js` per-frame order is off-limits) |

## Project Constraints (from AGENTS.md)

- Import from `three/webgpu` and `three/tsl` — irrelevant to this phase (no three imports change); i18n touches only DOM/string code.
- No custom GLSL under `src/` — no shader files touched.
- Factory composition pattern must not break: `main.js` builds plain objects; optional features return `null`; keep optional chaining on new calls. i18n imports are leaf-safe (no factory signature changes needed — D-03 lookup, not injection).
- New expensive work: half-res / frame-skip — N/A; i18n does zero per-frame work by design (event-driven `syncText` on language change only).
- Verification checklist after changes: `npm run build` succeeds; rain still collides; mobile profile unchanged — this phase cannot affect any of these (no render pipeline files touched except `warmup.js` string literals only, which runs pre-loop).
- "Avoid large unrelated refactors when fixing a single effect; match existing factory style" — each factory migration must be text-only: swap literals for `t()` calls, add `syncText()`, add unsubscribe in existing `destroy()`. No DOM restructure beyond `data-i18n` spans in the about panel (D-04 sanctions exactly that).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none — hand-rolled) | — | Dictionary store | D-01 locks zero new dependencies. `package.json` currently: `gsap ^3.15.0`, `three ^0.185.1`, `three-mesh-bvh ^0.9.13`, `vercel ^56.2.0` — the phase adds nothing to this list. [VERIFIED: package.json read this session] |

**Installation:** `npm install` — nothing. There is no Package Legitimacy Audit for this phase because no external packages are installed.

## Architecture Patterns

This phase implements exactly the milestone-researched architecture (`.planning/research/ARCHITECTURE.md`, read this session). What follows is the **phase-level implementation detail** that research didn't cover: the exhaustive string inventory, the exact store shape, and migration sequencing.

### String-Site Inventory (complete, read this session)

Legend: Type **S** = static literal in `innerHTML` template (migrate via `data-i18n` or `syncText()` querySelector); **F** = functional write in a `sync`-style function (migrate the assignment to `t()`); **C** = call-time argument (migrate the argument to `t()`); **HTML** = static `index.html` node.

#### 1. `src/ui/chrome/createHeader.js`
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 14 | `aria-label="About"` | `.app-header-about-btn:not(.source)` attribute | S |
| 16 | `ABOUT` | `.app-header-about-label` textContent | S |
| 18 | `aria-label="Source code"` | `.app-header-source-btn` attribute | S |
| 20 | `SOURCE` | `.app-header-source-label` textContent | S |
| 22 | `aria-label="Settings"` | `.app-header-settings-btn` attribute | S |

No `destroy()` exists on the header (it returns without one — line 70: `{ root, show, hide, setForceHidden, bindWalkControls, updateHud }`). The language subscription's unsubscribe function must be stored and either added to a new `destroy()` or left un-destroyed (header lives for the page lifetime — acceptable, but note it in the plan).

#### 2. `src/ui/chrome/createAboutPanel.js` (largest single migration — D-04 territory)
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 22 | `aria-label="Close"` | `.close-button-panel` attribute | S |
| 29 | `THREEJS-PUNK` | `.about-brand-title` | S — brand name, **keep as-is both languages** (proper noun) |
| 30 | `BY ANDERSON MANCINI &amp; SUNAG` | `.about-brand-subtitle` | S — proper-noun line; translate only "BY" → "OLEH" or keep — owner review (D-10) |
| 34–37 | lead paragraph 1 ("Threejs-Punk drops you into a rain-soaked alley…") | `.about-copy-col:nth(1) .about-lead:first` | S → `data-i18n="about.lead1"` |
| 39–43 | lead paragraph 2 ("Every reflection, droplet and glow…") | `.about-lead` #2 | S → `data-i18n="about.lead2"` |
| 47–50 | lead paragraph 3 ("That flickering readout…") | `.about-lead` #3 | S → `data-i18n="about.lead3"` |
| 51–55 | lead paragraph 4 ("Originally built for the Three.js Conference…") | `.about-lead` #4 | S → `data-i18n="about.lead4"` |
| 62 | `Anderson Mancini` | `.about-link-anderson` | S — proper noun, keep |
| 64 | `Sunag` | `.about-link-sunag` | S — proper noun, keep |
| 68 | `Source code` | `.about-link-source` | S → `about.sourceLink` |
| 72 | `By Anderson Mancini &amp; Sunag` | `.about-model-credits` | S — same OLEH decision |
| 75 | `Recommended setup` | `.about-recommended--desktop .about-recommended-title` | S → `about.recommendedTitle` |
| 76–79 | desktop recommended body (multi-sentence) | `.about-recommended--desktop` (text after the title span) | S → wrap in `data-i18n` span `about.recommendedDesktop` |
| 82 | `Recommended setup` | `.about-recommended--mobile .about-recommended-title` | S → same key |
| 83–85 | mobile recommended body | `.about-recommended--mobile` body | S → `about.recommendedMobile` |

Has `destroy()` (line 163) — add the language unsubscribe there alongside `unsubscribeLayout`.

#### 3. `src/ui/chrome/createSettingsPanel.js`
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 40 | `aria-label="Settings"` | `.settings-glass` attribute | S |
| 41 | `aria-label="Close"` | `.settings-close` attribute | S |
| 47 | `Look` | `.settings-section-title` | S → `settings.look` |
| 48 | `aria-label="Color look"` | `.settings-look-grid` attribute | S |
| 18 (renderLookButtons) | `${option.label}` — resolves from `LOOK_PRESETS.*.label` | `.settings-look-label` per button | S — **indirect**: label comes from `cyberpunkLook.js` via `createAppShell.js` `LOOK_OPTIONS` (see §8 below) |
| 57 | `Development mode` | `.settings-option-title` | S → `settings.developmentMode` |
| 63 | `aria-label="Development mode"` | `[data-development-mode]` attribute | S |
| 72 | `Reset configs` | `.settings-restart-btn > span` | S → `settings.resetConfigs` |
| 75 | `Resets look preference and turns off development mode` | `.settings-restart-hint` | S → `settings.resetHint` |
| 153–155 | `window.confirm("Reset configs? Look preference will return to default and development mode will turn off.")` | native dialog | C → `t("settings.resetConfirm")` at click time |

Has `destroy()` (line 189) — add unsubscribe. Existing `syncLookPreset` (line 92) is the natural place to also refresh look-button labels if labels move to `t()` lookup (`t("look." + option.id)`).

#### 4. `src/ui/chrome/createAudioButton.js`
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 57 | `aria-label="Toggle sound"` | `#buttonAudio` attribute | S → `audio.toggle` |

Has `destroy()` (line 200) — add unsubscribe. Single-string factory; trivial.

#### 5. `src/ui/walk/createWalkPrompt.js` (the pattern exemplar — D-03)
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 14 | `aria-label="Click to activate walk mode"` | root button attribute | F (initial) — overridden by `syncCopy` |
| 23 | `Walk mode` | `.walk-prompt-kicker` | S → `walkPrompt.kicker` (needs a `syncText` addition — `syncCopy` currently only touches the title) |
| 24 | `Click to look around` | `.walk-prompt-title` | S — overwritten by `syncCopy` anyway |
| 43 | `"Drag to look around"` (textContent + aria-label) | titleEl / root | F → `t("walkPrompt.dragToLook")` |
| 47 | `"Click to look around"` | titleEl | F → `t("walkPrompt.clickToLook")` |
| 48 | `"Click to activate walk mode"` | root aria-label | F → `t("walkPrompt.clickToActivate")` |

`syncCopy` (lines 41–51) is the exact hook D-03 cites. `destroy()` exists (line 119). Migration: add the kicker line to `syncCopy`, convert the three literals, register `syncCopy` with the i18n subscription, unsubscribe in `destroy()`.

#### 6. `src/ui/walk/createMoveHint.js`
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 61 | `Movement` | `.move-hint__kicker` | S → `moveHint.kicker` |
| 62 | `Use WASD to walk` | `.move-hint__title` | S → `moveHint.title` |

No aria-labels with words (role=status, aria-live=polite only). Has `destroy()` (line 192). Needs a new small `syncText()` + subscription.

#### 7. `src/ui/walk/createWalkControlsHint.js` (SVG text nodes — special)
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 102 | `aria-label="Show walk controls"`, `Controls` chip label | `.walk-controls__chip` / `.walk-controls__chip-label` | S → `walkControls.chipLabel` |
| 109 | `aria-label="Close controls"` | `.walk-controls__close` | S |
| 112 | `aria-label="Walk controls"` | `.walk-controls__content` | S |
| 114 | `Interface` | `.walk-controls__eyebrow` | S |
| 115 | `Navigation` | `.walk-controls__title` | S |
| 118 | `Esc to close` | `.walk-controls__footer` | S |
| 80 | `"Movement"`, `"WASD to move"` | SVG `<text>` via `renderCallout(318, 18, 224, "Movement", "WASD to move")` | F — **rendered into an inline SVG template string**; keys must avoid `<`/`&` (SVG text nodes are XML-ish inside innerHTML — plain text is fine) |
| 81 | `"Sprint"`, `"Hold Shift"` | SVG callout | F |
| 82 | `"Crouch"`, `"Press C to toggle"` | SVG callout | F |
| 83 | `"Look"`, `"Click to lock mouse"` | SVG callout | F |
| 74 | `aria-label="Walk mode controls"` on the diagram `<svg>` | attribute | S |

Migration wrinkle: the callouts are baked into `renderExpandedDiagram()` which runs once at factory creation. `syncText()` must re-set these SVG `<text>` nodes — give them classes/queryable attributes (e.g., `data-i18n="walkControls.calloutMoveTitle"`) and let the generic `data-i18n` walker handle them (it sets `textContent`, which works on SVG text elements too). Has `destroy()` (line 214).

#### 8. `src/app/createAppShell.js` — `LOOK_OPTIONS` labels
Lines 37–68: `LOOK_OPTIONS` copies `LOOK_PRESETS.*.label` (English: `"Neutral"`, `"Neon Noir"`, `"Magenta Rain"`, `"Teal Dusk"`, `"Silent Hill"`, `"Sin City"` — [VERIFIED: `src/post/look/cyberpunkLook.js:106,131,156,181,206,236`]). Options (agent's discretion per milestone research): (a) resolve labels at render time in `renderLookButtons` via `t("look." + option.id)` — keeps `LOOK_OPTIONS` data-only, no appShell change; (b) keep `label` in `LOOK_OPTIONS` but make it a key. **Recommend (a):** zero `createAppShell.js` structural change — only the settings panel template changes (`${t("look." + option.id)}` inside `renderLookButtons`) and `syncLookPreset`-triggered label refresh already lands there. The preset ids (`neutral`, `neonNoir`, `magentaRain`, `tealDusk`, `silentHill`, `sinCity`) are the stable key suffixes.

#### 9. `src/ui/walk/createHudPanel.js`
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 90 | `VITALS` | `.hud-vitals-header .hud-label` | S → `hud.vitals` |
| 103 | `ENERGY` | `.hud-substats .hud-stat-chip:nth(1) .hud-label` | S → `hud.energy` |
| 108 | `SIGNAL` | second chip `.hud-label` | S → `hud.signal` |

Numbers (`82%`, `64%`, `98%`) are interpolated constants — not dictionary strings. Root is `aria-hidden="true"` (line 73) — decorative. HUD is created inside `createHeader` (line 29) — its subscription can live on the HUD factory itself; it has no `destroy()` but neither does the header; page-lifetime acceptable (note in plan). CSS risk: BM labels ("VITAL", "TENAGA", "ISYARAT") in the fixed-width chips — see Common Pitfalls.

#### 10. `src/ui/walk/createVirtualJoystick.js`
**No visible strings.** Root is `aria-hidden="true"`; the markup is base + knob divs only. Context/REQUIREMENTS list "virtual joystick" as a surface, but the verified inventory shows nothing to localize. LOC-01 coverage for the joystick = "no string sites exist" (document this in VERIFICATION.md).

#### 11. `src/ui/intro/createIntroOverlay.js`
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 26 | `aria-label="THREEJS-PUNK"` | `.intro-brand` attribute | S — brand, keep |
| 27–28 | `THREEJS` / `PUNK` | `.intro-brand-line` ×2 | S — brand, keep (Phase 2 may rebrand to "CYBERPUNK MALAYA" — out of scope now) |
| 25 | `through the glass` | `.intro-kicker` | S → `intro.kicker` — **GSAP constraint:** `splitIntoLetters` is NOT applied to the kicker (only brand lines), so a `syncText` swap is safe pre-animation |
| 31 | `A rain-soaked alley under neon.` | `.intro-tagline` | S → `intro.tagline` — not letter-split; safe |
| 33 | `ENTER` (button, `disabled` initially) | `.intro-button` | S → `intro.enter` |
| 35 | `Anderson Mancini · Sunag` | `.intro-credit` | S — proper nouns, keep |

Critical constraint [VERIFIED: `splitIntoLetters` lines 4–17]: brand lines are letter-split into spans at creation. **Do not translate brand lines and do not re-sync them on language change** — mid-animation re-split is explicitly out of scope per milestone research. The subscription-safe elements are kicker, tagline, button, credit — all set via `textContent` before `playEnter()` starts. Since the intro is one-shot and language is BM from boot (D-05), the subscription can even be skipped for this factory — but adding it is harmless if it only touches non-split nodes. Recommendation: set initial values from `t()` at creation, no subscription (simplest, zero risk to the GSAP timeline).

#### 12. `src/ui/intro/createPerformanceNotice.js`
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 4 | `message = "Adjusting performance"` (default parameter) | `root.textContent` | F → replace default with `t("performanceNotice.adjusting")` at construction (the notice is created and shown once during the intro exit — call-time enough; no subscription needed since it's transient) |

#### 13. `src/app/createLoaderOverlay.js`
| Line(s) | String | DOM target | Type |
|---|---|---|---|
| 151 | `aria-label="Loading"` | `#app-loader` attribute | S — overwritten by `syncAriaLabel` |
| 178–190 | `` `Loading ${Math.round(currentProgress * 100)}%. ${currentStatus}` `` / `` `Loading ${p}%` `` | root aria-label | F → `t("loader.ariaLoading", { percent })`-style — needs an interpolation slot in `t()` (see Store Shape) |
| 220 | `setStatus("LINK FAILED")` | `.app-loader__status` | F → `t("loader.linkFailed")` |
| 221 | `aria-label="Failed to load"` | root attribute | F → `t("loader.failedToLoad")` |

Note line 52 of `src/main.js`: `loader.fail("Failed to load. Check the console for details.")` — **`fail()` takes an argument but ignores it** (the signature is `fail()` with no params, line 218). The passed string is dead code. Migration: localize inside `fail()` via `t()`, drop the ignored argument at the main.js call site (or start honoring it — simpler to drop).

#### 14. Loader statuses — the three non-UI files (call-time `t()`, no subscription)
| File | Line | String | Key suggestion |
|---|---|---|---|
| `src/main.js` | 62 | `"BOOTING SCENE"` | `loader.bootingScene` |
| `src/main.js` | 69 | `"SPINNING UP RENDERER"` | `loader.spinningRenderer` |
| `src/main.js` | 74 | `"LINKING WEBGPU"` | `loader.linkingWebgpu` |
| `src/main.js` | 111 | `"WIRING POST FX"` | `loader.wiringPostFx` |
| `src/main.js` | 52 | `"Failed to load. Check the console for details."` (dead arg — see above) | `loader.failedToLoad` |
| `src/runtime/warmup.js` | 87 | `"SYNCING LIGHTS"` | `loader.syncingLights` |
| `src/runtime/warmup.js` | 97 | `"ASSEMBLING SECTOR"` | `loader.assemblingSector` |
| `src/world/createWorld.js` | 65 | `"STREAMING MESHES"` | `loader.streamingMeshes` |
| `src/world/createWorld.js` | 98 | `"WIRING WORLD"` | `loader.wiringWorld` |

**Import-order constraint [VERIFIED: `src/main.js:49` — `const loader = createLoaderOverlay();` runs before `init()`]**: `i18n` is a module-scope store, so merely importing `t` at the top of `main.js` initializes the language state before any `setStatus` call — no ordering hazard. The statuses uppercase via CSS `text-transform: uppercase` (`.app-loader__status`, line 112 of the injected style), so BM strings render uppercase automatically — no case-munging in the dictionary.

#### 15. `index.html` — static head (D-05: BM hardcoded baseline, EN swap path)
| Line(s) | Node | Current EN value | Migration |
|---|---|---|---|
| 2 | `<html lang="en">` | — | → `lang="ms"` (D-06); JS swaps to `en` when stored pref is EN |
| 12 | `<title>` | "Threejs-Punk \| Raining scene inspired…" | → BM literal; `staticHead` swaps on EN pref; runtime `setLanguage` also updates (LOC-03) |
| 14–16 | `meta[name=title]` | same family | → BM + swap |
| 17–20 | `meta[name=description]` | long EN description | → BM + swap |
| 21–24 | `meta[name=keywords]` | keyword list | Agent's discretion: translate or keep EN-only (keywords are crawl-irrelevant-ish; recommend BM+EN merge, keep it simple: BM) |
| 25–27 | `meta[name=author/creator/publisher]` | proper nouns | Keep as-is |
| 34 | `link[rel=canonical]` | URL | Never touch (milestone research) |
| 41 | `og:site_name` | "Threejs-Punk" | Brand — keep |
| 44–46 | `og:title` | EN title | → BM + swap |
| 47–50 | `og:description` | EN description | → BM + swap |
| 58–61 | `og:image:alt` | EN alt text | → BM + swap (LOC-05) |
| 62 | `og:locale` | `en_US` | → `ms_MY` baseline; swap to `en_US` with EN (LOC-05) |
| 74–76 | `twitter:title` | EN | → BM + swap |
| 77–80 | `twitter:description` | EN | → BM + swap |
| 83–87 | `twitter:image:alt` | EN | → BM + swap |
| 91/92/95 | `application-name`, `mobile-web-app-title`, `apple-mobile-web-app-title` | "Threejs-Punk" | Brand — keep |
| 100–130 | JSON-LD `name`/`description` | EN | Agent's discretion per CONTEXT.md — recommend: localize `description` via JS swap, keep `name` as brand. The JSON-LD is a `<script>` node — swap via parsed re-serialize or `textContent` template; simplest: leave JSON-LD static BM for `description` (crawler sees baseline; JS swap optional) |
| 133–135 | `<noscript>` | EN one-liner | → BM hardcoded (JS never runs there — milestone research) |

`staticHead.js` mechanism: query `meta[name="title"]`, `meta[name="description"]`, `meta[property="og:title"]`, etc. by selector and `setAttribute("content", t(key))`; `document.title = t("meta.title")`; `document.documentElement.lang = currentLanguage === "bm" ? "ms" : "en"` (D-06). Run once at `i18n` import time or explicitly at the top of `src/main.js` `init()` before `createLoaderOverlay()` (any point pre-first-paint is equivalent here since it's the same module tick).

### Recommended Project Structure

```
src/i18n/
├── i18n.js               # store: t, setLanguage, getLanguage, subscribe (audioState shape)
├── staticHead.js         # index.html head swap (data-driven selector map, not data-i18n attrs —
│                         #   meta tags can't carry data-i18n meaningfully; a SELECTOR_MAP constant
│                         #   in this file is simpler and keeps index.html clean)
└── dictionaries/
    ├── bm.js             # export const bm = { "about.lead1": "...", ... } — flat, alphabetical
    └── en.js             # export const en = { ... } — identical key set
```

Deviation from milestone research, justified: milestone ARCHITECTURE.md suggests `data-i18n` attributes in `index.html`; after reading the actual file, a **selector map in `staticHead.js`** is cleaner — the head is ~20 nodes with stable selectors (`meta[property="og:title"]` etc.), and sprinkling `data-i18n` on `<title>`/meta/JSON-LD buys nothing. The `data-i18n` attribute pattern stays **inside factory-generated innerHTML** (about panel, walk controls hint) where it's the right tool (D-04). This is within the agent's discretion ("How loader statuses reach the loader overlay"-class wiring decisions).

### Store Shape (exact, replicating `src/audio/audioState.js`)

`src/audio/audioState.js` verbatim contract [VERIFIED: read this session, 41 lines]:

```javascript
const listeners = new Set();

let audioVolume = 0.5;
let isMusicPlaying = false;

function notify() {
  for (const listener of listeners) {
    listener({ audioVolume, isMusicPlaying });
  }
}
// ... getters/setters ...

export function subscribe(listener) {
  listeners.add(listener);
  listener({ audioVolume, isMusicPlaying });  // immediate sync on registration
  return () => listeners.delete(listener);
}
```

`src/i18n/i18n.js` replicates this shape exactly (D-02):

```javascript
// src/i18n/i18n.js — implementation skeleton (every value also in the verbatim quotes above/below)
import { bm } from "./dictionaries/bm.js";
import { en } from "./dictionaries/en.js";
import { isDevEnvironment } from "../platform/userPreferences.js"; // exists: [VERIFIED: userPreferences.js:13-15]

const DICTIONARIES = { bm, en };
const listeners = new Set();
let currentLanguage = "bm"; // Phase 1: always "bm" — Phase 2 adds stored-preference restore

function notify() {
  for (const listener of listeners) {
    listener({ language: currentLanguage });
  }
}

export function t(key, vars = {}) {
  const value = DICTIONARIES[currentLanguage][key] ?? en[key] ?? undefined;
  if (value === undefined) {
    if (isDevEnvironment()) {
      console.warn(`[i18n] missing key: ${key}`);
      return key; // D-08: loud fallback — show the key
    }
    return en[key] ?? key; // D-08: silent EN fallback in prod
  }
  if (vars && Object.keys(vars).length > 0) {
    return value.replace(/\{(\w+)\}/g, (m, name) => vars[name] ?? m);
  }
  return value;
}

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(language) {
  if (!DICTIONARIES[language] || language === currentLanguage) {
    return;
  }
  currentLanguage = language;
  document.documentElement.lang = language === "bm" ? "ms" : "en"; // D-06
  applyStaticHead(); // title + meta swap (LOC-03/04/05) — imported from staticHead.js
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);
  listener({ language: currentLanguage }); // immediate sync — audioState contract
  return () => listeners.delete(listener);
}
```

**Flat-key lookup, not dot-path traversal (D-07):** because keys are flat (`"about.lead1"`), lookup is a single property access `DICTIONARIES[lang][key]` — no path splitting, no deep merge. The dots are cosmetic namespacing inside flat object literals. This is simpler than the milestone sketch's "dot-path lookup" comment and matches D-07's intent.

**Interpolation need:** exactly one site requires vars — the loader aria-label `` `Loading ${p}%. ${status}` ``. The `{percent}` replace above covers it. Keep interpolation minimal; do not add plurals/gender (BM/EN don't need them — milestone research).

**`userPreferences.js` extension (Phase 1 minimal):** add `getStoredLanguage()` / `setStoredLanguage()` copying the `getStoredLookPreset`/`setStoredLookPreset` pattern [VERIFIED: `src/platform/userPreferences.js:25-43` — quoted shape: `localStorage.getItem(LOOK_PRESET_KEY)` in try/catch returning `null` on failure]. Phase 1 only needs `getStoredLanguage()` (read once at store init: if `"en"`, swap the static head to EN — the dormant path D-05 requires); `setStoredLanguage` can land now (unused) or in Phase 2 — recommend landing both now so the file is touched once. Add the language key to `clearAllStoredPreferences` (line 45–53) only in Phase 2 when "Reset configs" semantics are decided (resetting language on config reset is a product call — flag it, don't decide it here).

### Migration Order (dependency-driven)

**Wave 1 — foundation (no factory touched yet):**
1. `src/i18n/dictionaries/bm.js` + `en.js` — all keys, BM drafted (D-10 owner review flagged), EN = current strings verbatim.
2. `src/i18n/i18n.js` — store per shape above.
3. `src/i18n/staticHead.js` — selector map + swap function.
4. `src/platform/userPreferences.js` — `getStoredLanguage`/`setStoredLanguage`.
5. Verify: `npm run build` + parity script (below).

Dependencies: none. Everything after this imports from here.

**Wave 2 — leaf factories with existing sync hooks (lowest risk, proves the pattern):**
6. `createWalkPrompt.js` (has `syncCopy` + `destroy` — the exemplar).
7. `createAudioButton.js` (1 string, has `destroy`).
8. `createMoveHint.js` (2 strings, needs new `syncText`, has `destroy`).
9. `createPerformanceNotice.js` (1 default param, no subscription).
10. `createLoaderOverlay.js` (aria-labels + `fail()` — call-time + `syncAriaLabel` re-run; note `fail()`'s dead argument).
11. Loader statuses: `src/main.js`, `src/runtime/warmup.js`, `src/world/createWorld.js` — call-time `t()` swaps only.
12. `createIntroOverlay.js` — `t()` at creation for kicker/tagline/button; NO subscription (GSAP letter-split safety).
13. `createHudPanel.js` — 3 labels + new `syncText` (no destroy — page-lifetime subscription, noted).

**Wave 3 — composite surfaces:**
14. `createSettingsPanel.js` — labels + `data-i18n` on template + look labels via `t("look." + id)` in `renderLookButtons` + `settings.resetConfirm` in the confirm call + label refresh hook (extend `syncLookPreset` or the new `syncText`) + unsubscribe in `destroy`.
15. `createAboutPanel.js` — `data-i18n` spans for the 4 leads + recommended blocks (D-04), generic `[data-i18n]` walker, unsubscribe in `destroy`.
16. `createHeader.js` — aria-labels + 2 labels, subscription (no destroy — page lifetime).
17. `createWalkControlsHint.js` — template labels + SVG callout `<text>` nodes via `data-i18n` walker, unsubscribe in `destroy`.

**Wave 4 — static HTML:**
18. `index.html` — BM baseline for all catalogued nodes (title, meta title/description, og/twitter title/description/image:alt, og:locale → `ms_MY`, noscript, `lang="ms"`), JSON-LD decision (description BM, name brand).
19. `createVirtualJoystick.js` — verify no-op (document the empty inventory).

**Wave 5 — CSS text-expansion pass:**
20. Sweep the co-located CSS (hudPanel.css chips, header labels, walkPrompt inner, settingsPanel look labels, loader status `letter-spacing: 0.38em` — long BM statuses with wide tracking will overflow) for width/flex adjustments. AGENTS.md-compliant: follow existing patterns, no redesign.

Rationale for the order: Wave 2 factories have no dependents and mostly existing hooks — failures isolate cleanly. Settings/about/header (Wave 3) are the biggest templates and benefit from the pattern being proven. index.html last because its BM baseline is a content decision best finalized once all dictionary keys exist (title/description copy echoes dictionary `meta.*` keys).

### Anti-Patterns to Avoid (from milestone research, phase-verified)

- **Full appShell teardown on language change** — `createAppShell.js` wires audio init, inspector, idle managers; rebuilding re-triggers all of it. (Milestone anti-pattern 2.)
- **String injection as factory options** — freezes language at creation. (Milestone anti-pattern 3.)
- **`innerHTML = t(...)`** — XSS surface; about panel must use the `data-i18n` → `textContent` walker. (Milestone anti-pattern 4, D-04.)
- **Letter-split re-sync in `createIntroOverlay`** — brand lines are GSAP-staggered spans; never touch post-split. (Verified constraint in `splitIntoLetters`.)
- **Honoring `loader.fail(message)`'s argument** — it's currently dead code (`fail()` takes no params); don't build translation plumbing for it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| i18n framework features | plural rules, ICU messages, interpolation engine | flat dictionaries + the 3-line `{var}` replace above | BM/EN have trivial morphology; exactly one interpolation site exists (loader aria) |
| Reactivity system | observed DOM bindings, MutationObserver scanning | explicit `syncText()` + pub/sub subscription | matches audioState precedent; 15 factories × a few writes is nothing |
| Key-parity checking | ad-hoc manual eyeballing | the 20-line Node parity script (§ Validation Architecture) | LANG-03 is a hard requirement; automation costs less than one missed key |

**Key insight:** the entire i18n surface is ~150 strings across 15 factories. Every "hard" i18n problem (RTL, plurals, date formats, lazy chunks) is absent by scope. The only real work is inventory discipline and not breaking GSAP/listener lifecycles.

## Common Pitfalls

### Pitfall 1: EN→MS text expansion breaks fixed-width chrome
**What goes wrong:** BM strings run 15–30% longer (milestone PITFALLS.md); the loader status has `letter-spacing: 0.38em` + `text-transform: uppercase` (verified in the injected loader CSS), HUD chips and look-preset buttons are tight flex items — BM text overflows or clips.
**Why it happens:** chrome was designed around short EN labels.
**How to avoid:** Wave 5 CSS sweep; prefer `min-width`/`flex-wrap`/reduced tracking over fixed widths; test the longest BM string per surface (e.g., `settings.resetHint`, loader statuses).
**Warning signs:** clipped text in the loader status line during boot; look buttons wrapping unevenly.

### Pitfall 2: Subscription leak in factories with `destroy()`
**What goes wrong:** the i18n subscription's unsubscribe function isn't stored alongside `unsubscribeLayout`/`unsubscribeState`, so `destroy()` leaves a live listener referencing removed DOM.
**Why it happens:** factories already juggle 2–3 unsubscribes; i18n adds a fourth.
**How to avoid:** mirror the exact pattern: `const unsubscribeLanguage = subscribe(syncText);` then `unsubscribeLanguage?.()` inside the existing `destroy()`. Factories without `destroy()` (header, HUD) are page-lifetime — acceptable, but the plan must say so explicitly rather than silently.
**Warning signs:** `setLanguage` in Phase 2 throwing on detached nodes.

### Pitfall 3: Translating non-translatable things
**What goes wrong:** brand names ("THREEJS-PUNK", "THREEJS", "PUNK", "Anderson Mancini", "Sunag"), the WASD/Shift/C key labels inside SVG diagrams, and interpolated numbers get pulled into dictionaries, creating parity noise and re-render hazards.
**Why it happens:** blanket grep-and-replace of every English-looking string.
**How to avoid:** the inventory above marks every keep-as-is site; key caps (W/A/S/D/Shift/C/Esc) are physical key names — keep Latin. "Esc to close" translates the words around the key name only (`Esc untuk tutup`-style, owner wording D-10).
**Warning signs:** `intro.brand*` keys appearing in dictionaries.

### Pitfall 4: Missing the non-obvious string sites
**What goes wrong:** the phase ships with English leftovers in `warmup.js`/`createWorld.js` statuses (not listed in the CONTEXT's factory list) or the `og:image:alt` metas.
**Why it happens:** CONTEXT.md names "loader statuses in `src/main.js`" as the only non-UI site — but grep shows 4 more `setStatus` calls in `warmup.js` (2) and `createWorld.js` (2), plus `main.js:52`'s dead fail-message string.
**How to avoid:** use this research's inventory (§ String-Site Inventory, items 13–15) as the plan's checklist; the residual-English grep (§ Validation Architecture) catches stragglers.
**Warning signs:** "STREAMING MESHES" flashing in English during load while everything else is BM.

### Pitfall 5: `og:locale` and `document.title` forgotten
**What goes wrong:** LOC-03/LOC-05 fail verification because `document.title` and `og:locale` weren't in the swap map.
**Why it happens:** they're attribute/meta writes outside the visible page.
**How to avoid:** `staticHead.js` selector map covers `title`, `meta[name=title]`, `meta[name=description]`, `og:title/description/image:alt/locale`, `twitter:title/description/image:alt`, `document.title`, `document.documentElement.lang`. The dormant swap path runs at import when stored pref = EN (D-05).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| i18next-class frameworks for every localization need | Hand-rolled stores for ≤2-locale static demos | — (project decision D-01, not ecosystem drift) | Zero bundle/runtime cost; owner-reviewable dictionaries |

Nothing in this phase depends on fast-moving ecosystem state — all patterns are in-repo. Research stays valid indefinitely (valid until the 15 UI factories change).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | BM status/head copy drafted by AI will read acceptably enough for the owner to refine (D-10 process works) | Dictionaries | Low — owner review is the designed loop; wording churn is confined to dictionary files |
| A2 | `og:locale` value for BM is `ms_MY` | index.html inventory | Trivial — a string constant; worst case a correction in review |
| A3 | Proper nouns and physical key caps (WASD, Shift, C, Esc) stay Latin in both dictionaries | Pitfall 3 | Low — conventional; flagged for owner confirmation during D-10 review |
| A4 | Header/HUD subscriptions living for the page lifetime (no destroy) is acceptable | Migration order | Low — these factories already never destroy; Phase 2's no-reload toggle still works since nodes persist |

No `[ASSUMED]` package claims exist — the phase installs nothing.

## Open Questions (RESOLVED)

1. **JSON-LD localization depth — RESOLVED:** Localize JSON-LD `description` to BM in the static baseline; keep `name` as the brand (proper noun). Encoded by plan 01-04 Task 1 step 6; revisit in Phase 2 only if SEO priorities change. Record the choice in the dictionary file comments.

2. **`settings.resetConfirm` semantics with language (Phase 2 boundary) — RESOLVED:** Phase 1 does NOT add the language key to `clearAllStoredPreferences` — the current reset semantics must not change; Phase 2 decides the product call. Encoded by plan 01-01 Task 3 step 1; noted for the Phase 2 context.

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` [VERIFIED: read this session] — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **None exists.** `package.json` scripts: `dev`/`build`/`preview`/`deploy` only [VERIFIED: package.json read this session] |
| Config file | none — see Wave 0 |
| Quick run command | `npm run build` (Vite build ~seconds; catches import/syntax errors) |
| Full suite command | `npm run build && node scripts/check-i18n-parity.mjs` (script created in Wave 0, below) |

**Decision framing for the planner:** introducing vitest/playwright for ~150 dictionary strings is disproportionate and violates the spirit of D-01 (no new dependencies). The validation architecture below is deliberately **build + static scripts + manual browser checks**, matching AGENTS.md's verification checklist culture. If the planner prefers a real framework, it must add Wave 0 install tasks and a `checkpoint:human-verify` for the dependency decision — not recommended.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOC-01 | Every BM string renders (no residual EN) | build + static grep | `npm run build && grep -rn` residual-English sweep (below) | ❌ Wave 0 (grep one-liner, documented in VERIFICATION.md) |
| LOC-01 | Factories compile with i18n imports | build | `npm run build` | ✅ existing |
| LOC-01 | BM text actually displays in DOM | manual-only (browser) | — justified: rendering requires WebGPU context; no DOM test harness exists | ❌ manual |
| LOC-03 | `document.documentElement.lang === "ms"`; `document.title` is BM | manual-only (browser console) | — `document.documentElement.lang` is set by JS at runtime; static check impossible | ❌ manual |
| LOC-04 | `index.html` baseline is BM (`lang="ms"`, BM title/description/noscript) | static | `grep -c 'lang="ms"' index.html` + absence of EN strings in head | ✅ after Wave 4 (part of sweep) |
| LOC-04 | EN swap path exists and is dormant | build (import graph) + manual (Phase 2 activates) | `npm run build` | partial |
| LOC-05 | OG/Twitter metas localize | manual-only | — meta `content` swap is runtime JS | ❌ manual |
| LANG-03 | BM and EN dictionaries have identical key sets | static unit | `node scripts/check-i18n-parity.mjs` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run build` (fast, catches broken imports/templates).
- **Per wave merge:** `npm run build && node scripts/check-i18n-parity.mjs` + residual-English grep sweep.
- **Phase gate:** full manual browser pass before `$gsd-verify-work`: dev server (HTTPS, WebGPU), walk the full UI surface tree (loader → intro → header/settings/about/walk hints/HUD/walk prompt), verify `document.documentElement.lang`, `document.title`, meta tags via DevTools Elements panel.

### Wave 0 Gaps

- [ ] `scripts/check-i18n-parity.mjs` — imports `src/i18n/dictionaries/bm.js` + `en.js`, compares `Object.keys()` sets both directions, exits 1 with the diff on any mismatch (covers LANG-03). ~20 lines, Node-native ESM, no dependency. Because the dictionaries are plain ESM modules and `package.json` has `"type": "module"` [VERIFIED: package.json line 4], Node imports them directly — no build step needed.
- [ ] Residual-English grep sweep — documented one-liner for VERIFICATION.md: search the migrated factory set for literal English strings not in the keep-list (brands, key caps, code identifiers). Example shape: `grep -rnE '"[A-Z][a-z]+ [a-z ]+"' src/ui src/app/createLoaderOverlay.js src/main.js src/runtime/warmup.js src/world/createWorld.js` then hand-triage against the inventory's keep-list. Not fully automatable (false positives on non-UI strings) — this is a guided checklist, not a pass/fail gate.
- [ ] Framework install: **none** (deliberate — see decision framing above).

### Manual verification matrix (browser, end of phase)

1. `npm run dev` (HTTPS) on Chrome/Edge Windows: loader shows BM statuses through boot ("MEMUAT AWDAL"—final wording D-10); intro kicker/tagline/ENTER in BM; post-ENTER chrome (header TENTANG/SUMBER, settings TETAPAN, about panel, walk prompt, move hint, controls hint, HUD labels) all BM.
2. DevTools console: `document.documentElement.lang` → `"ms"`; `document.title` → BM; Elements → head: `og:title`/`og:description`/`og:image:alt` BM, `og:locale` `ms_MY`.
3. AGENTS.md verification checklist: rain still collides; no rain/sky in height map (untouched by design — confirm no accidental world edits beyond the two `setStatus` literals in `createWorld.js`); mobile profile unchanged (no new passes — i18n adds zero render work).
4. Layout: longest BM strings don't clip in loader status, look buttons, HUD chips.

## Security Domain

> `security_enforcement: true`, ASVS level 1 [VERIFIED: .planning/config.json]. The phase's only security-relevant surface is the D-04 XSS constraint.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | no auth in a static demo |
| V3 Session Management | no | none |
| V4 Access Control | no | none |
| V5 Input Validation | marginal | dictionary values are static strings authored in-repo; the `{var}` interpolator only substitutes caller-supplied values into `textContent` targets — never into `innerHTML` |
| V6 Cryptography | no | none |
| V12 File and Resources | marginal | no user-supplied files |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via dictionary content | Tampering | D-04: all dictionary writes go through `textContent`/`setAttribute`; the only `innerHTML` use is the existing static factory templates (unchanged, contain no dictionary values); never `innerHTML = t(...)` |
| DOM clobbering via `data-i18n` walker | Tampering | walker reads `el.dataset.i18n` as a dictionary key — unknown keys fall to the missing-key path (D-08), no property sink |

## Sources

### Primary (HIGH confidence — read this session)
- `src/audio/audioState.js` — the store pattern replicated (verbatim quote in § Store Shape)
- `src/platform/userPreferences.js` — persistence pattern to extend (lines 25–43 quoted shape)
- `src/ui/chrome/createHeader.js`, `createAboutPanel.js`, `createSettingsPanel.js`, `createAudioButton.js` — chrome factories, full read
- `src/ui/walk/createWalkPrompt.js`, `createMoveHint.js`, `createWalkControlsHint.js`, `createHudPanel.js`, `createVirtualJoystick.js` — walk factories, full read
- `src/ui/intro/createIntroOverlay.js`, `createPerformanceNotice.js` — intro factories, full read
- `src/app/createAppShell.js`, `createLoaderOverlay.js`, `createIntroFlow.js` — app shell + loader, full read
- `src/main.js`, `src/runtime/warmup.js`, `src/world/createWorld.js` (status lines only) — loader status call sites
- `src/post/look/cyberpunkLook.js` (label fields, lines 106–236) — look preset labels
- `index.html` — full head inventory
- `package.json`, `.planning/config.json` — scripts, deps, workflow flags
- `.planning/research/ARCHITECTURE.md` — milestone architecture this phase extends (not repeated)

### Secondary (MEDIUM confidence)
- BM text-expansion ratio 15–30% — milestone PITFALLS.md (project artifact, not independently re-verified this session; treat sizing as estimate, verified empirically during Wave 5 CSS pass)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — it's "nothing"; verified against package.json
- Architecture: HIGH — every integration point read in source this session; store shape quoted verbatim from audioState.js
- Pitfalls: HIGH — all grounded in verified code constraints (GSAP letter-split, dead fail() arg, distributed setStatus sites, subscription lifecycles)

**Research date:** 2026-11-22
**Valid until:** stable — in-repo facts only; re-verify only if the 15 UI factories are refactored before planning

---

*Phase: 1-i18n Foundation*
