# Phase 3: Malay Narration - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning

<domain>
## Phase Boundary

The full ~49-line Ghost Runner story is narrated in Malay from the ENTER click, synced to the intro story scroll with per-line highlighting, using a bundled pre-synthesized neural ms-MY audio asset as the primary narration source. Delivers: offline narration synthesis + per-line audio chunking (asset generation), the narration playback module (gesture-anchored start, mute integration, replay button), scroll-synced highlighting, and a labeled source indicator. Browser TTS remains only as an emergency fallback if the asset fails to load. Former Phase 4 (Guaranteed Narration Asset) is MERGED into this phase per owner decision — VOICE-01/VOICE-02 are delivered here.

</domain>

<decisions>
## Implementation Decisions

### Owner decisions (2026-11-23, this discussion — LOCKED)
- **D-01:** Full story narrated (~49 lines, ~3-5 min of speech) — matches the scroll duration
- **D-02:** Bundled pre-synthesized audio is the PRIMARY narration source (merges former Phase 4). Generate offline with a cloud neural ms-MY voice (e.g. Azure `ms-MY-OsmanNeural`/`ms-MY-KhalisaNeural`); chunk per story line (one audio segment per `intro.story.lNN` key) so highlighting syncs exactly
- **D-03:** Per-line highlight: the line currently being spoken is highlighted in the story, synced to audio playback (TTS-05)
- **D-04:** Browser TTS demoted to emergency fallback only (asset-load failure) — no voice chain, no device-matrix spike needed for the primary path
- **D-05:** TTS-01 gesture-anchored start (ENTER click), TTS-03 mute kills narration immediately, TTS-06 replay button — all carried over unchanged

### Carried from milestone (locked)
- Narration reads the `intro.story.lNN` dictionary keys — single source of truth (Phase 2 D-06)
- The story scroll is a 100s CSS animation; narration duration will NOT match 100s exactly — the sync design (audio drives highlight; scroll duration may need tuning to match total audio length) is a planning decision
- Audio button state governs all sound (`audioState` pub/sub) — narration must subscribe and cancel on mute
- No new runtime dependencies (D-01 milestone); audio asset is a build artifact, not a dependency

### the agent's Discretion
- Which neural voice/tier to synthesize with (owner reviews the audio before it ships — checkpoint)
- Asset format (mp3 vs ogg vs per-line files vs single file with cue table) — per-line files (~49 small mp3s) vs one concatenated file + cue map: planner decides based on highlighting mechanism
- Where the asset lives (public/audio/narration/) and its loading strategy (lazy-load on ENTER vs preload)
- Scroll-duration tuning: adjust the CSS animation duration to match measured audio length, or let them diverge slightly (audio holds last line)
- UI for the source label + replay button (follows existing chrome patterns per UI-SPEC culture)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project planning
- `.planning/ROADMAP.md` §Phase 3 (merged) — goal, requirements list, plan-shape guidance
- `.planning/REQUIREMENTS.md` — TTS-01/02/03/04/05/06 + VOICE-01/02 as rewritten 2026-11-23
- `.planning/PROJECT.md` — constraints

### Phase 2 artifacts (the foundation)
- `.planning/phases/02-language-toggle-kl-intro-story/02-RESEARCH.md` — intro overlay structure, storyText()/syncText path, scroll animation design
- `src/ui/intro/createIntroOverlay.js` + `introOverlay.css` — the story region the narration syncs to
- `src/audio/audioState.js` — the mute state to subscribe to
- `src/ui/intro/createIntroFlow.js` — where revealAppUi/ENTER gesture lives (the anchor point)

### Research (milestone-level)
- `.planning/research/PITFALLS.md` — Web Speech quirks (now fallback-only), audio asset considerations
- `.planning/research/STACK.md` — rejected WASM/cloud-at-runtime options (offline synthesis remains the sanctioned route)

### Project instructions
- `AGENTS.md` — hard constraints

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `intro.story.l01..l49` keys in both dictionaries — the narration script and the highlight targets
- `introOverlay.css` scroll animation (`--intro-story-h`, 100s linear) — the sync counterpart
- `audioState.js` pub/sub — mute integration point
- `createAudioButton.js` — the mute UI narration must respect
- The ENTER click in `createIntroFlow` — gesture anchor (WebAudio context unlock + narration start)

### Established Patterns
- Audio factories in `src/audio/` (createWetFootstepAudio etc.) — narration playback module follows this shape
- Asset handling: static files under `public/`, no build pipeline

### Integration Points
- `createIntroFlow.runIntroSequence()` — narration start on ENTER
- `createIntroOverlay.js` syncText — highlight targets are the story line elements
- `createRenderLoop.js` — MUST NOT be touched
- Audio button state — narration cancel on mute

</code_context>

<specifics>
## Specific Ideas

The owner's story is the narration script, verbatim. The narration should feel like the Ghost Runner speaking their own story — a measured, cinematic read, not a rush.

</specifics>

<deferred>
## Deferred Ideas

- Language-switch behavior for narration mid-play (restart in new language? stop?) — planner decides simplest correct behavior; EN narration audio is NOT generated this phase (BM is the default experience)
- Subtitle-style display of the spoken line outside the story region — unnecessary; highlighting covers it

</deferred>

---

*Phase: 3-Malay Narration (merged)*
*Context gathered: 2026-11-23*
