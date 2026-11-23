# Phase 2: Language Toggle & KL Intro Story - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can switch BM ⇄ EN instantly with a persisted choice, and the intro tells a KL cyberpunk story written natively in both languages. Delivers: the "BM | EN" toggle UI, instant no-reload re-render of all visible UI (activating the dormant `setLanguage` path from Phase 1), localStorage persistence + restore on revisit (activating the dormant `getStoredLanguage` restore), first-visit-always-BM with a dismissible switch hint for non-ms/id browsers, and the KL-cyberpunk intro story rewrite in both languages as shared `intro.*` dictionary keys (single source of truth for the Phase 3 TTS narration). No TTS (Phase 3), no bundled audio (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Locked by milestone + Phase 1 (carried forward)
- **D-01:** Plain "BM | EN" text toggle — no flags, no dropdown (research anti-pattern; USWDS two-language guidance)
- **D-02:** Instant switch via the Phase 1 pub/sub store — every factory's `syncText()` fires on `setLanguage`; NO appShell teardown, NO reload
- **D-03:** Persistence via the dormant `getStoredLanguage`/`setStoredLanguage` (built in Phase 1 wave 1; restore path already in `i18n.js` module init)
- **D-04:** BM→EN→BM round-trip must leave zero mixed-language strings, including `document.title`, `<html lang>`, and all head metas via `staticHead.js` (already swap-wired)
- **D-05:** Intro overlay: the letter-split region (THREEJS-PUNK brand lines) is NEVER re-synced; the tagline/kicker/ENTER re-render safely. If the story text sits in a letter-split span, the toggle re-renders it as plain text (acceptable per research) — flag the exact approach in the plan
- **D-06:** `intro.*` keys are the single source of truth — the EN and BM story live only in the dictionaries; Phase 3 TTS reads the same keys
- **D-07:** AI drafts the story (D-10 milestone decision); owner reviews at a checkpoint like Phase 1

### Toggle UX (agent's discretion — auto-decided from research defaults, user review pending)
- **D-08:** Toggle lives in the header button row on desktop (a "BM | EN" pill styled like the existing chrome buttons) AND as a language row inside the Tetapan panel (covers mobile where the header collapses below 640px). Both control the same store.
- **D-09:** First visit always starts BM. When `navigator.languages` contains neither `ms` nor `id`, a dismissible toast hint appears after ENTER ("Prefer English?" / BM equivalent) with a one-tap switch action; dismissed state persists to localStorage.
- **D-10:** Intro story: medium arc, 5-7 sentences — the KL runner, one delivery, a moment of tension in the rain, arrival. KL flavor: neon-soaked Kuala Lumpur imagery, Malaysian street texture (mamak, monsoon, motorbike courier), corporations in the background. English version is a faithful counterpart, not a literal translation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/PROJECT.md` — core value, constraints
- `.planning/REQUIREMENTS.md` — LOC-02, LANG-01, LANG-02, LANG-04, INTRO-01, INTRO-02 are this phase's requirements
- `.planning/ROADMAP.md` §Phase 2 — goal, success criteria

### Phase 1 artifacts (the foundation this phase activates)
- `.planning/phases/01-i18n-foundation/01-CONTEXT.md` — D-01..D-10 architecture decisions
- `.planning/phases/01-i18n-foundation/01-01-SUMMARY.md` — store API, dormant persistence, staticHead swap path
- `.planning/phases/01-i18n-foundation/01-02-SUMMARY.md` — intro overlay GSAP letter-split constraint, creation-time t()
- `src/i18n/i18n.js`, `src/i18n/staticHead.js`, `src/platform/userPreferences.js` — the live dormant code to activate

### Research
- `.planning/research/FEATURES.md` — toggle UX patterns, first-visit behavior, hint patterns
- `.planning/research/ARCHITECTURE.md` — dynamic-switch design, anti-patterns (no appShell teardown)
- `.planning/research/PITFALLS.md` §i18n — text expansion, intro re-sync risks

### Project instructions
- `AGENTS.md` — hard constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/i18n/i18n.js` — `setLanguage`/`getLanguage`/`subscribe` fully built; `setLanguage` already writes `documentElement.lang` + `document.title` + metas via staticHead
- `src/platform/userPreferences.js` — `getStoredLanguage`/`setStoredLanguage` built and dormant (Phase 1 wave 1)
- Every migrated factory already has a `syncText()` subscription — the toggle "just works" once something calls `setLanguage`
- Header factory (`src/ui/chrome/createHeader.js`) — page-lifetime subscription pattern to extend with the toggle pill

### Established Patterns
- Factory composition; `t()` lookup; `data-i18n` walker for innerHTML surfaces
- Toast/hint: no existing toast component — the hint follows the move-hint/notice CSS patterns (intro notice `createPerformanceNotice.js` is the closest analog)

### Integration Points
- `src/ui/chrome/createHeader.js` — toggle pill insertion
- `src/ui/chrome/createSettingsPanel.js` — language row
- `src/ui/intro/createIntroOverlay.js` — story rewrite (creation-time `t()`, letter-split care)
- Intro hint toast — new module under `src/ui/intro/` or `src/ui/chrome/`
- `src/runtime/createRenderLoop.js` — MUST NOT be touched

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Language Toggle & KL Intro Story*
*Context gathered: 2026-11-23*
