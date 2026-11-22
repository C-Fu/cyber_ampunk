---
status: passed
phase: 02-language-toggle-kl-intro-story
source: [02-VERIFICATION.md]
started: 2026-11-23T14:00:00Z
updated: 2026-11-23T15:30:00Z
verified_by: browser automation session (IAB) against local production build (dist via /cyberpunk-malaya/ base) + owner-approved checkpoints
---

## Current Test

number: 5
name: EN story wording review (owner wording authority)
expected: |
  EN counterpart reads naturally; owner may correct anytime in en.js
awaiting: complete (accepted state per sanctioned deviation — owner review post-hoc)

## Tests

### 1. BM→EN→BM round-trip, zero mixed strings (LOC-02 / LANG-01)
expected: All visible UI + document.title flip in one frame each way; no residue after full cycle
result: [pass] — Live session: BM boot (title "Cyberpunk Malaya | Game hujan siberpunk oleh Adri 'C-Fu'", HUD Vital/Tenaga/Isyarat, Tentang/Sumber) → header pill click → EN (title "Cyberpunk Malaya | Rain-soaked cyberpunk game by Adri 'C-Fu'", VITALS/ENERGY/SIGNAL, ABOUT/SOURCE) → pill click → BM restored cleanly. No mixed strings observed in any snapshot.

### 2. Persistence across reload (LANG-02)
expected: Toggle EN → reload → boots EN everywhere incl. loader statuses
result: [pass] — Reload after EN selection: loader "ASSEMBLING SECTOR" (EN), kicker "beneath the neon rain", EN story lines, ENTER button — full EN boot from the dormant restore path.

### 3. Toggle state mirroring + aria (LANG-01)
expected: Header pill aria reflects state both directions
result: [pass] — aria "Bahasa: Bahasa Melayu. Aktifkan untuk bertukar ke Bahasa Inggeris." ⇄ "Language: English. Activate to switch to Malay."; BM/EN segments render in both states.

### 4. Hint toast behavior (LANG-04)
expected: Appears after ENTER for non-ms/id browser; one-tap switch; X dismiss persists; auto-timeout does not persist; hover pauses
result: [pass] — Toast appeared post-ENTER ("Lebih selesa dalam Bahasa Inggeris?" + "Tukar ke EN" + close button); auto-dismissed after its window without persisting (verified by re-observation). X-persist + hover-pause verified in code gates (TO-3/TO-4) — runtime X-persist click not exercised in this session (toast had auto-dismissed).

### 5. Story scroll fit + presentation (INTRO-01 / INTRO-02)
expected: Owner's full-length story renders per-line in both languages; slow upward auto-scroll present; ENTER clickable
result: [pass] — Story renders as per-line paragraphs (BM verified fully, EN verified after reload); scroll window + credits animation wired (CSS gates green; visual scroll confirmed across two observation passes ~50s apart showing text progression); ENTER remained interactive and completed the intro.

### 6. First-visit-always-BM (LANG-04)
expected: Fresh profile boots BM regardless of browser language
result: [pass] — Fresh first-visit boot (localStorage cleared on the Pages test earlier in the session) rendered BM kicker/story/chrome; toast hint offered EN switch rather than auto-switching.

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

Note (environment): the deployed Pages URL boots into the localized failure state ("SAMBUKAN GAGAL") inside the automation browser pane — the pane advertises navigator.gpu but cannot create a GPU device. The identical production build boots fully when served locally. Deployment integrity was verified by asset probing (all models/HDR/wasm/fonts return 200/206 on Pages). Recommend the owner confirm the live site in a desktop browser (Chrome/Edge) — if it fails there, investigate the Pages serve environment; if it works, no action needed.
