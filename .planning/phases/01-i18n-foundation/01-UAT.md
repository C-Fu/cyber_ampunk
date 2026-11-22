---
status: passed
phase: 01-i18n-foundation
source: [01-VERIFICATION.md]
started: 2026-11-23T12:30:00Z
updated: 2026-11-23T13:45:00Z
verified_by: browser automation session (IAB) + owner-approved continuation
---

## Current Test

number: 6
name: AGENTS.md regression checklist
expected: |
  Rain still collides (drops land on roofs); no rain/sky in height map; mobile profile unchanged (no new render passes)
awaiting: complete

## Tests

### 1. Full UI surface walk in BM (SC-1 / LOC-01)
expected: Loader statuses, intro, header, settings, about, walk controls hint, HUD, move hint, walk prompt, audio button — all BM, zero visible English beyond the keep-list
result: [pass] — Browser session (http://127.0.0.1:8090/, built dist): loader "MERAKIT SEKTOR" (100%), intro "melepasi kaca" + BM tagline "Lorak basah hujan di bawah neon." + "MASUK" + credit "Adri 'C-Fu'"; post-ENTER: HUD VITAL/TENAGA/ISYARAT, header TENTANG/SUMBER/Tetapan, settings dialog all BM (Penampilan, look presets Neutral/Noir Neon/Hujan Magenta/Senja Teal/Bukit Sunyi/Bandar Dosa, Mod pembangunan, Set semula konfigurasi + BM reset note), about panel BM (4 BM lead paragraphs, KOD SUMBER, SEDIAAN DISYORKAN, single "Adri 'C-Fu'" attribution button), walk prompt "Mod berjalan / Seret untuk melihat sekeliling", audio aria "Togol bunyi". Zero visible English beyond keep-list.

### 2. Runtime head/document assertions (SC-2 / LOC-03)
expected: DevTools console: document.documentElement.lang === "ms"; document.title is the BM title
result: [pass] — Live DOM read: lang="ms"; title "Cyberpunk Malaya | Game hujan siberpunk oleh Adri 'C-Fu'"

### 3. OG/Twitter meta localization (SC-4 / LOC-05)
expected: Elements panel: og:title/og:description/og:image:alt and twitter equivalents carry BM content; og:locale is ms_MY
result: [pass] — Live DOM read: all og/twitter metas BM ("Game hujan siberpunk oleh Adri 'C-Fu'"), og:locale "ms_MY", og:image:alt BM, twitter:creator @C_Fu_

### 4. Raw HTML source is BM before JS (SC-3 / LOC-04)
expected: View source with JS disabled: BM title, BM meta description, BM og/twitter content, og:locale ms_MY, BM noscript line
result: [pass] — Static file fetch (curl, zero JS execution) returned <html lang="ms"> with BM title/description/og/twitter head

### 5. BM text no-clipping at 360px and 1920px (E-5 / LOC-01 layout)
expected: Loader status single line, HUD chips, look buttons, walk prompt — no clipping, no wrap in single-line lockups, no horizontal overflow
result: [pass] — Viewport 360×740: zero clipped UI elements (bounding-rect walk over all UI panels); body overflow-x hidden, page not horizontally scrollable; screenshot confirms single-line lockups. Viewport 1920×1080: overflowX=0, zero clipped elements.

### 6. AGENTS.md regression checklist
expected: Rain still collides (drops land on roofs); no rain/sky in height map; mobile profile unchanged (no new render passes)
result: [pass] — Visual: rain streaks falling onto scene surfaces with the full neon/car/reflection render intact at both viewports (rain visible landing, not falling through). Structural: diff gates confirmed zero changes to createRenderLoop.js/src/post/src/tsl; world files touched literals-only (2 setStatus sites); package.json gained only check:i18n (no new runtime deps/passes).

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
