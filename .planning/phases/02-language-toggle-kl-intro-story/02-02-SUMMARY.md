---
phase: 02-language-toggle-kl-intro-story
plan: 02
subsystem: ui
tags: [i18n, intro, css-animation, bm, story, github-pages]

requires:
  - phase: 02-language-toggle-kl-intro-story
    provides: "Plan 02-01 — i18n store activation surfaces (header pill + Tetapan row), persist-first toggle pattern"
  - phase: 01-i18n-foundation
    provides: "i18n pub/sub store (t/getLanguage/setLanguage/subscribe), subscribe-with-immediate-sync convention"
provides:
  - Owner-written full-length BM intro story as per-line dictionary keys intro.story.l01..l49 in BOTH dictionaries (135-key parity)
  - Orchestrator-drafted EN counterpart (pending owner post-hoc review, editable in en.js)
  - Credits-style slow upward auto-scroll story region in the intro overlay with language-switch scroll reset
  - Fork identity: SUMBER link + index.html head (canonical/og/twitter/JSON-LD) pointed at C-Fu/cyberpunk-malaya GitHub Pages; vite base for the Pages subpath
affects: [02-03 language hint toast, phase 3 TTS narration source]

actuals:
  tokens: 34000
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "CSS-keyframes credits scroll with JS restart via animation:none + reflow + animation:'' reset"
    - "Shared CSS custom property (--intro-story-h) so scroll end offset keeps last lines visible"

key-files:
  created: []
  modified:
    - src/i18n/dictionaries/bm.js
    - src/i18n/dictionaries/en.js
    - src/ui/intro/createIntroOverlay.js
    - src/ui/intro/introOverlay.css
    - index.html
    - src/ui/core/externalLinks.js
    - vite.config.js

key-decisions:
  - "OWNER REPLACED THE STORY (D-07 wording authority, checkpoint response): the 6-sentence draft is superseded by a full-length ~49-line BM narrative supplied VERBATIM at the checkpoint; ST-4 char budget (<=460 BM / <=420 EN) is owner-override DEAD — the old budget gate is replaced by parity (identical key sets) + scroll-treatment presence"
  - "'Slowly scroll up' interpreted as a credits-style continuous upward auto-scroll (100s linear CSS keyframes on the inner wrapper, translateY from 0 to -(100% - window height)) — start at the beginning, drift to the end, hold the last lines ('Inilah kisahku.' / 'This is my story.'); owner may correct the interpretation"
  - "Per-line key structure intro.story.l01..l49: one key per non-empty line in the author's order; paragraph rhythm is preserved by rendering each line as its own <p> with flex gap — no empty spacer keys needed; both dictionaries have IDENTICAL key sets (check:i18n parity 135 keys)"
  - "Reduced motion: prefers-reduced-motion: reduce disables the auto-scroll (animation:none, opening lines shown statically) — first reduced-motion pattern in the codebase, noted here since no prior convention existed"
  - "Scroll restart on language switch: renderStory() rebuilds the line paragraphs via createElement/textContent (never letter-split, D-05; never innerHTML of t() output, T-2-03) then restartStoryScroll() resets the animation (animation:none -> forced reflow -> animation:'')"
  - "ENTER stays clickable: the button sits outside the overflow-hidden story window; the story container has pointer-events none inherited from .intro-container"
  - "URL identity (owner additional scope): SOURCE_CODE_URL -> github.com/C-Fu/cyberpunk-malaya; index.html canonical/og:url/twitter:domain/twitter:url/JSON-LD url -> https://c-fu.github.io/cyberpunk-malaya/; og:image/twitter:image/JSON-LD screenshot -> .../preview.jpg (absolute per OG spec; preview.jpg ships in public/); vite base '/cyberpunk-malaya/' for the Pages subpath"

patterns-established:
  - "CSS credits scroll: @keyframes on inner wrapper + shared height custom property; restart pattern = style.animation reset with reflow"
  - "prefers-reduced-motion opt-out for decorative auto-motion"

requirements-completed: [INTRO-01, INTRO-02, LOC-02]

coverage:
  - id: D1
    description: Intro renders the owner's full-length BM story natively (verbatim), EN counterpart drafted
    requirement: INTRO-01/INTRO-02
    verification:
      - kind: other
        ref: "npm run check:i18n parity OK 135 keys; grep intro.story = 49 in each dictionary"
        status: pass
    human_judgment: true
    rationale: "Story wording authority is the owner (D-07) — BM verbatim from checkpoint; EN is orchestrator-drafted and explicitly pending owner post-hoc review in en.js"
  - id: D2
    description: Language switch re-renders kicker/story/ENTER and restarts the scroll from the top
    requirement: LOC-02
    verification:
      - kind: other
        ref: "npm run build + grep subscribe=1 in createIntroOverlay.js; restartStoryScroll animation-reset pattern in syncText path"
        status: pass
    human_judgment: true
    rationale: "Live toggle while the intro is up is visually verified in the deferred end-of-phase manual round (overlay practically unreachable mid-intro; header force-hidden)"
  - id: D3
    description: D-05 letter-split boundary — splitIntoLetters exclusive to .intro-brand-line, story is plain text
    requirement: INTRO-01
    verification:
      - kind: other
        ref: "grep splitIntoLetters count = 2 (1 definition + 1 call site) — gate green"
        status: pass
    human_judgment: false
    rationale: ""
  - id: D4
    description: Fork identity — SUMBER and head URLs point at this fork's GitHub Pages, vite base set
    requirement: N/A (owner-directed additional scope)
    verification:
      - kind: other
        ref: "npm run build green; dist/index.html asset src/href carry /cyberpunk-malaya/ prefix; grep threejspunk in src+index.html = 0"
        status: pass
    human_judgment: true
    rationale: "GitHub Pages is NOT yet enabled — owner must enable it (Settings -> Pages -> Source: GitHub Actions). The og:url/canonical targets will 404 until then — accepted by owner. Local note: the static-verification server used earlier served dist at root; dist must now be served under the /cyberpunk-malaya/ prefix (or `vite preview`, which respects base). The three-inspector-extensions middleware was left untouched — only the base option was added."

deviations:
  - "[Owner-directed] Full story replacement: the plan's Task 3 checkpoint was a story review, but the owner replaced the entire story with a ~49-line BM narrative and directed a slow upward auto-scroll — invalidating the ST-4 <=460/<=420 char budget and the S-1 'never scroll' constraint. The old max-height overflow guard (.intro-tagline--story) was replaced by the fixed-height scroll window; the Task 3 budget script is superseded by parity + scroll-presence checks. Documented as owner-authority per D-07."
  - "[Owner-directed additional scope] URL identity commit (c710bc5): SUMBER link, index.html head identity, JSON-LD, and vite base — folded into plan 02-02 at the coordinator's direction, committed separately before the story commit."

duration: ~20min (continuation session)
completed: 2026-11-23
status: complete
---

# Phase 2 Plan 02: KL Intro Story + Auto-Scroll Summary

**Owner-written full-length BM story in per-line dictionary keys, orchestrator-drafted EN counterpart, credits-style slow upward auto-scroll in the intro overlay, plus fork URL identity**

## Performance

- **Duration:** ~20 min (continuation after D-07 checkpoint)
- **Completed:** 2026-11-23
- **Tasks:** 3 (2 production commits + gate pass)
- **Files modified:** 7

## Accomplishments

- Story dictionaries restructured: `intro.story.s1..s6` replaced by per-line keys `intro.story.l01..l49` in BOTH `bm.js` and `en.js` — the owner's BM narrative verbatim (D-07 wording authority), EN as orchestrator-drafted counterpart pending owner post-hoc review. Dictionary parity 92 -> 135 keys, `npm run check:i18n` green
- Intro overlay: story region is now a fixed-height window (clamp 7.5rem-13rem desktop, 6.5rem-10rem <=480px) whose inner wrapper auto-scrolls upward credits-style over 100s linear, holding the last lines at the end; top/bottom mask fade for the cinematic edge; each story line is its own `<p>` (createElement/textContent only)
- Language switch rebuilds the lines and restarts the scroll from the top (animation reset via `animation:none` + reflow); ENTER button remains outside the scroll region and clickable at all times; brand letter-split untouched (D-05 gate green); `prefers-reduced-motion` disables the auto-scroll
- Fork identity: `SOURCE_CODE_URL` -> `github.com/C-Fu/cyberpunk-malaya`; index.html canonical/og:url/twitter:domain/twitter:url/JSON-LD url -> `https://c-fu.github.io/cyberpunk-malaya/`; og:image/twitter:image/JSON-LD screenshot -> `.../preview.jpg`; vite `base: "/cyberpunk-malaya/"` with the inspector-extensions middleware untouched; zero `threejspunk` refs remain in src+index.html; dist asset URLs verified under the `/cyberpunk-malaya/` prefix

## Owner Checkpoint Outcome (Task 3, D-07/ST-5)

- **Owner replaced the story entirely** — the 6-sentence draft is superseded by the full-length ~49-line BM narrative provided verbatim at the checkpoint (preserved line-for-line, including the short dramatic one-liners)
- **EN counterpart is orchestrator-drafted** — applied as drafted; owner reviews after (editable in en.js; parity gate enforces symmetric key edits)
- **"Slowly scroll up" interpreted as a credits-style continuous upward auto-scroll** (CSS keyframes, 100s linear) — owner may correct this interpretation or the duration

## Task Commits

1. **URL identity (owner additional scope)** - `c710bc5` — feat(02-02): point SUMBER and head identity at this fork's GitHub Pages
2. **Story rewrite + scroll treatment** - `867911f` — feat(02-02): apply owner story rewrite with slow upward auto-scroll

## Files Created/Modified

- `src/i18n/dictionaries/bm.js` — intro.story.l01..l49 verbatim owner BM prose
- `src/i18n/dictionaries/en.js` — intro.story.l01..l49 orchestrator-drafted EN counterpart
- `src/ui/intro/createIntroOverlay.js` — STORY_KEYS generator (l01..l49), renderStory()/restartStoryScroll(), story window in template, GSAP timeline retargeted from tagline to story container
- `src/ui/intro/introOverlay.css` — .intro-story window + .intro-story-scroll keyframes + reduced-motion + mobile sizing; old .intro-tagline/.intro-tagline--story rules removed
- `index.html` — canonical, og:url, twitter:domain/url/image, JSON-LD url/screenshot -> c-fu.github.io/cyberpunk-malaya
- `src/ui/core/externalLinks.js` — SOURCE_CODE_URL -> this fork
- `vite.config.js` — base "/cyberpunk-malaya/" (only the base option added)

## Verification (gates)

- `npm run check:i18n` — parity OK, 135 keys in both dictionaries
- `grep -c intro.story` — 49 in bm.js, 49 in en.js
- D-05 gate — `splitIntoLetters` occurrences = 2 (1 definition + 1 call site over .intro-brand-line); story lines built with textContent only, never letter-split, no innerHTML of t() output
- `npm run build` — green; dist/index.html asset URLs carry the `/cyberpunk-malaya/` prefix
- ST-4 budget check — **owner-override dead** (see deviations); superseded by parity + scroll-treatment presence

## Deferred / Owner Actions

- **GitHub Pages NOT yet enabled** — owner must enable it: Settings -> Pages -> Source: GitHub Actions. The canonical/og:url targets will 404 until then — accepted by owner
- **EN counterpart owner review** — post-hoc, directly in en.js (symmetric key edits required)
- **Scroll duration/treatment** — 100s linear chosen; owner may tune in introOverlay.css
- **Local dist serving** — after the vite base change, dist must be served under `/cyberpunk-malaya/` (or `vite preview`)
- Visual/interaction verification (360px/1080p fit, scroll feel, toggle round-trip) deferred to end-of-phase human_verify_mode per project convention
