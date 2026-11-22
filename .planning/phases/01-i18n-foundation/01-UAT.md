---
status: testing
phase: 01-i18n-foundation
source: [01-VERIFICATION.md]
started: 2026-11-23T12:30:00Z
updated: 2026-11-23T12:30:00Z
---

## Current Test

number: 1
name: Full UI surface walk in BM (SC-1 / LOC-01)
expected: |
  Loader statuses (MENYALAKAN BABAK, MEMUTAR PENJANA, MENYAMBUNG WEBGPU, MENYAMBUNG POST FX...), intro (melepasi kaca, MASUK, BM tagline), header (TENTANG/SUMBER), settings (Tetapan/Penampilan/Mod pembangunan/Set semula konfigurasi + BM confirm dialog), about (BM lead paragraphs, KOD SUMBER, SEDIAAN DISYORKAN), walk controls hint (BM SVG callouts, ESC UNTUK TUTUP), HUD (VITAL/TENAGA/ISYARAT), move hint (Pergerakan/Gunakan WASD untuk berjalan), walk prompt (Mod berjalan), audio button aria (Togol bunyi) — all BM, zero visible English beyond the keep-list (brands, key caps WASD/Shift/C/Esc)
awaiting: user response

## Tests

### 1. Full UI surface walk in BM (SC-1 / LOC-01)
expected: Loader statuses, intro, header, settings, about, walk controls hint, HUD, move hint, walk prompt, audio button — all BM, zero visible English beyond the keep-list (brands, WASD/Shift/C/Esc key caps)
result: [pending]

### 2. Runtime head/document assertions (SC-2 / LOC-03)
expected: DevTools console: document.documentElement.lang === "ms"; document.title is the BM title ("Cyberpunk Malaya | Game hujan siberpunk oleh Adri 'C-Fu'")
result: [pending]

### 3. OG/Twitter meta localization (SC-4 / LOC-05)
expected: Elements panel: og:title/og:description/og:image:alt and twitter equivalents carry BM content; og:locale is ms_MY
result: [pending]

### 4. Raw HTML source is BM before JS (SC-3 / LOC-04)
expected: View source with JS disabled: BM title, BM meta description, BM og/twitter content, og:locale ms_MY, BM noscript line
result: [pending]

### 5. BM text no-clipping at 360px and 1920px (E-5 / LOC-01 layout)
expected: Loader status single line, HUD chips, look buttons, walk prompt — no clipping, no wrap in single-line lockups, no horizontal overflow
result: [pending]

### 6. AGENTS.md regression checklist
expected: Rain still collides (drops land on roofs); no rain/sky in height map; mobile profile unchanged (no new render passes)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
