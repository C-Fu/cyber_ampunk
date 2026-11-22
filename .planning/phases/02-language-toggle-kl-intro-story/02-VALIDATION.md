---
phase: "2"
slug: "language-toggle-kl-intro-story"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-23"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `02-RESEARCH.md` § Validation Architecture. Same zero-framework approach as Phase 1: build + parity script + grep gates + manual browser round-trip.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — build + `scripts/check-i18n-parity.mjs` + grep gates (deliberate, D-01 zero deps) |
| **Config file** | `scripts/check-i18n-parity.mjs` (exists from Phase 1) |
| **Quick run command** | `npm run check:i18n` |
| **Full suite command** | `npm run check:i18n && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run check:i18n`
- **After every plan wave:** Run `npm run check:i18n && npm run build` + per-plan grep gates
- **Before `$gsd-verify-work`:** Full manual browser round-trip checklist (below) complete
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (planner fills task-level rows; requirement-level map below) | | | | | | | | | |

**Requirement-level map (from research):**

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-------------|
| LANG-03 (gate) | BM/EN key parity incl. new `intro.story.*`, toggle/toast keys | script | `npm run check:i18n` | ✅ |
| LOC-02/LANG-01 | Toggle present in header + settings; calls setLanguage+setStoredLanguage; no innerHTML-with-t() in new modules | grep | `grep -c "lang-toggle-segment" src/ui/chrome/createHeader.js` ≥1; `grep -c "setStoredLanguage" src/ui/chrome/*.js src/app/*.js` ≥2; innerHTML-t() gate in toast = 0 | ❌ grep-only |
| D-05 guard | `splitIntoLetters` only on brand lines; story `<p>` not letter-split | grep | `grep -c "splitIntoLetters" src/ui/intro/createIntroOverlay.js` = 1 call site over `.intro-brand-line` | ✅ invariant |
| LOC-02/LANG-02/INTRO-01/INTRO-02 | BM→EN→BM round-trip, persistence across reload, toast behavior, 360px story fit | manual browser | round-trip checklist | manual |
| Build | Compiles, no new deps | build | `npm run build` | ✅ |

---

## Wave 0 Requirements

None — existing gates (parity script + build) cover all automatable checks; Phase 1 installed the tooling.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BM→EN→BM round-trip, zero mixed strings | LOC-02, LANG-01 | Live DOM/visual behavior | Fresh profile → BM; toggle → EN (all chrome + title flips in one frame); back → BM; check lang/title/og:locale each side |
| Persistence across reload | LANG-02 | Requires reload cycle | Toggle EN → reload → boots EN everywhere; toggle BM → reload → boots BM |
| Toggle state mirroring | LANG-01 | Visual | Settings row and header pill always agree, both directions |
| Hint toast behavior | LANG-04 | Timing/interaction | Non-ms/id browser profile + fresh localStorage → toast after ENTER; action switches live; X dismiss persists; hover pauses; timeout doesn't persist |
| Story fit at 360px + 1080p | INTRO-01 | Visual layout | Story ≤ budget, no ENTER clipping, overflow-hidden clips tail only (never scroll) |
| Letter-split brand animates unchanged | D-05 | GSAP visual | Toggle language mid-intro; brand lines animate identically |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or documented manual-only routing
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (none needed)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
