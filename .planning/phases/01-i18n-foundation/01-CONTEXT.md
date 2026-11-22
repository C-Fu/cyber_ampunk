# Phase 1: i18n Foundation - Context

**Gathered:** 2026-11-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Every user-facing surface renders in Bahasa Melayu by default, backed by a hand-rolled bilingual dictionary store (`src/i18n/`): dictionaries + pub/sub store, migration of all ~15 UI factories (header, settings, about, intro overlay, walk hints, HUD, virtual joystick, walk prompt, performance notice, loader overlay, loader statuses in `src/main.js`), static `index.html` head localization (BM baseline), `document.documentElement.lang`/`document.title` runtime swap, and OG/Twitter meta localization. No toggle UI yet (Phase 2), no story rewrite (Phase 2), no TTS (Phase 3). EN dictionaries exist for parity but nothing switches to them in this phase.

</domain>

<decisions>
## Implementation Decisions

### Architecture (locked by milestone-level decisions)
- **D-01:** Hand-rolled ES-module dictionaries in `src/i18n/` — no i18n framework, no new dependencies — **Reversibility:** costly — every migrated factory imports the store API; migrating away later touches all call sites
- **D-02:** Store replicates the `src/audio/audioState.js` module-scope pub/sub pattern: `t()`, `setLanguage`, `subscribe` — plain, matches codebase conventions
- **D-03:** Factory consumption via lookup function + per-factory `syncText()` re-sync on subscription (NOT string injection, NOT appShell teardown). `createWalkPrompt` already has a `syncCopy` hook proving the pattern
- **D-04:** `innerHTML` blocks (about panel) migrate via `data-i18n` spans + `textContent` writes (XSS-safe)
- **D-05:** `index.html` static head is BM in the raw HTML source (hardcoded baseline); JS swaps to EN only when a stored preference says EN (toggle arrives in Phase 2 — the swap path is built now, dormant)
- **D-06:** `document.documentElement.lang` must be `"ms"` for BM (the HTML language code, not any internal store key)

### Dictionary design (agent's discretion — auto-decided from research defaults, user review pending)
- **D-07:** Flat dot-notation keys (`header.title`, `settings.quality`) in a single dictionary object per language — simple greppability, no deep-merge complexity
- **D-08:** Missing-key behavior: loud fallback in dev (console.warn + show the key so gaps are visible during the owner's BM review), silent EN fallback in production
- **D-09:** BM tone for UI chrome: formal-clean BM ("Tetapan", "Tentang", "Kualiti") with light cyberpunk flavor reserved for the intro story (Phase 2) — labels stay functional, not slangy

### Content authority
- **D-10:** AI drafts all Malay copy; the owner reviews and corrects wording in the dictionary files (milestone-level decision). Dictionary files must be easy to review — plain, alphabetically stable structure

### the agent's Discretion
- Dictionary file naming (`dictionaries/bm.js` + `dictionaries/en.js` per ARCHITECTURE.md research vs `strings-ms.js`)
- Exact key taxonomy/grouping per UI factory
- How loader statuses in `src/main.js` reach the loader overlay (direct `t()` calls at set time vs a small sync helper)
- CSS adjustments for the 15–30% EN→MS text expansion (HUD chrome widths) — follow existing CSS patterns, no layout redesign

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/PROJECT.md` — Core value: natively Malay feel, full EN parity; constraints (no new frameworks, factory composition pattern)
- `.planning/REQUIREMENTS.md` — LOC-01, LOC-03, LOC-04, LOC-05, LANG-03 are this phase's requirements
- `.planning/ROADMAP.md` §Phase 1 — goal, success criteria, boundaries

### Research (authoritative for this milestone)
- `.planning/research/ARCHITECTURE.md` — the i18n layer design: `src/i18n/` leaf module, store shape, per-factory `syncText()` migration table, integration points, anti-patterns (no appShell teardown)
- `.planning/research/STACK.md` — zero-dependency decision, i18next rejection rationale
- `.planning/research/FEATURES.md` — toggle UX patterns (applies mostly to Phase 2), `lang`/title swap requirements
- `.planning/research/PITFALLS.md` §i18n — EN→MS text expansion 15–30%, fixed-width HUD risk, `hyphens: auto` unreliable for `ms`

### Codebase map
- `.planning/codebase/ARCHITECTURE.md` — composition pattern, appShell wiring, per-frame order (must not be touched)
- `.planning/codebase/CONVENTIONS.md` — `create*`/`apply*` factory naming, options objects, optional chaining for nullable features
- `.planning/codebase/STRUCTURE.md` — where `src/i18n/` fits in the tree

### Project instructions
- `AGENTS.md` — hard constraints: `three/webgpu` + `three/tsl` imports, no custom GLSL, factory composition, verification checklist

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/audio/audioState.js` — the sanctioned module-scope pub/sub store shape to replicate for i18n
- `src/platform/userPreferences.js` — localStorage persistence pattern (look preset); language persistence (Phase 2) follows it
- `createWalkPrompt.js` `syncCopy` hook — proves per-factory text re-sync works

### Established Patterns
- Factory composition (`create*`, options objects, `null` optional returns with `?.` callers)
- UI text set via `textContent` in factories; about panel uses `innerHTML` blocks (needs `data-i18n` spans)
- Fonts self-hosted (`public/fonts/`, orbitron/gloock Latin) — Malay is Latin-script, no font work needed

### Integration Points
- `src/app/createAppShell.js` — UI factories are created here; i18n subscriptions hang off factory lifecycles
- `index.html` — `<title>`, meta description, OG/Twitter tags; JSON-LD stays EN or gets BM `name`/`description` (agent's discretion, keep consistent)
- `src/main.js` loader statuses — the only non-`src/ui/` string site
- `src/runtime/createRenderLoop.js` — MUST NOT be touched (zero render-loop changes)

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above — standard approaches per research docs.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-i18n Foundation*
*Context gathered: 2026-11-22*
