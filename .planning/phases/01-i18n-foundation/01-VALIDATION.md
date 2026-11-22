---
phase: "1"
slug: "i18n-foundation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-22"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `01-RESEARCH.md` § Validation Architecture. No test framework exists; introducing one is deliberately rejected (violates D-01 zero-dependency decision). Validation is build + static scripts + manual browser matrix.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — build + Node-native static scripts (deliberate; no new dependencies) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && node scripts/check-i18n-parity.mjs` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && node scripts/check-i18n-parity.mjs` + residual-English grep sweep
- **Before `$gsd-verify-work`:** Full manual browser matrix (below) complete
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (filled by planner from PLAN.md tasks — see below for the requirement-level map) | | | | | | | | | |

**Requirement-level map (from research):**

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-------------|
| LOC-01 | Factories compile with i18n imports | build | `npm run build` | ✅ existing |
| LOC-01 | No residual EN in migrated factories | guided grep sweep | residual-English grep (documented in VERIFICATION.md) | ❌ Wave 0 |
| LOC-01 | BM text actually displays in DOM | manual-only | — no DOM harness, WebGPU context required | manual |
| LOC-03 | `documentElement.lang === "ms"`, BM title | manual-only | — runtime JS value | manual |
| LOC-04 | `index.html` baseline BM (`lang="ms"`, BM head) | static | `grep -c 'lang="ms"' index.html` + EN-absence check | ✅ after migration |
| LOC-05 | OG/Twitter metas localize | manual-only | — runtime JS swap | manual |
| LANG-03 | BM/EN dictionaries have identical key sets | static unit | `node scripts/check-i18n-parity.mjs` | ❌ Wave 0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-i18n-parity.mjs` — imports `src/i18n/dictionaries/bm.js` + `en.js`, compares `Object.keys()` sets both directions, exits 1 with diff on mismatch (covers LANG-03). ~20 lines Node ESM; dictionaries are plain ESM modules importable directly.
- [ ] Residual-English grep sweep one-liner documented in VERIFICATION.md — `grep -rnE '"[A-Z][a-z]+ [a-z ]+"' src/ui src/app/createLoaderOverlay.js src/main.js src/runtime/warmup.js src/world/createWorld.js` then hand-triage against the research inventory's keep-list (brands, key caps, code identifiers). Guided checklist, not pass/fail.
- [ ] Framework install: none (deliberate — D-01).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BM renders across full UI surface | LOC-01 | No DOM harness; rendering needs WebGPU context | `npm run dev` → walk loader → intro → header/settings/about/walk hints/HUD/walk prompt; all BM |
| `lang` attr + BM title | LOC-03 | Runtime JS value, not statically checkable | DevTools console: `document.documentElement.lang` → `"ms"`; `document.title` → BM |
| OG/Twitter metas localized | LOC-05 | Runtime JS meta swap | Elements panel: `og:title`/`og:description`/`og:image:alt` BM, `og:locale` `ms_MY` |
| AGENTS.md regression checklist | cross | Visual/runtime | Rain still collides; no rain/sky in height map; mobile profile unchanged |
| BM text doesn't clip (expansion) | LOC-01 | Visual layout | Longest BM strings in loader status, look buttons, HUD chips — no clipping |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
