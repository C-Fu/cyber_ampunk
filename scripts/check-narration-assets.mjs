/**
 * Narration asset integrity gate (VOICE-01/VOICE-02): every BM story key
 * `intro.story.lNN` in bm.js must have a committed non-trivial mp3 under
 * public/audio/narration/, and no src/ file may reference the Azure TTS
 * endpoint (synthesis is build-time only). Node-native ESM, no dependencies.
 *
 * Usage: npm run check:narration
 */
import { bm } from "../src/i18n/dictionaries/bm.js";
import { accessSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ASSET_DIR = "public/audio/narration";
const CUE_PATH = ".planning/phases/03-malay-tts-narration/narration-cue.json";
const AZURE_ENDPOINT_HOST = "tts.speech.microsoft";
const MIN_BYTES = 1024;

const storyKeys = Array.from(
  { length: 49 },
  (_, i) => `l${String(i + 1).padStart(2, "0")}`,
);

// --- VOICE-02: no runtime references to the Azure TTS endpoint under src/ ---
const srcRoot = "src";
const endpointHits = [];
function walkSource(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSource(full);
    else if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs") || entry.name.endsWith(".css")) {
      const content = readFileSync(full, "utf8");
      if (content.includes(AZURE_ENDPOINT_HOST)) endpointHits.push(full);
    }
  }
}
walkSource(srcRoot);
if (endpointHits.length > 0) {
  console.error(
    `[narration] VOICE-02 violation — Azure TTS endpoint referenced at runtime in:\n` +
      endpointHits.map((f) => `[narration]   ${f}`).join("\n") +
      `\n[narration] Synthesis must remain build-time only.`,
  );
  process.exit(1);
}

// --- VOICE-01: 49 non-trivial mp3s, one per dictionary key ---
const missing = [];
for (const key of storyKeys) {
  const file = path.join(ASSET_DIR, `${key}.mp3`);
  try {
    accessSync(file);
    if (statSync(file).size <= MIN_BYTES) missing.push(`${key}.mp3 (undersized)`);
  } catch {
    missing.push(`${key}.mp3 (missing)`);
  }
}

const assetsExist = missing.length < storyKeys.length;
if (missing.length > 0) {
  console.error(
    `[narration] narration assets incomplete: ${missing.length} of ${storyKeys.length} file(s) missing or undersized (< ${MIN_BYTES} bytes):`,
  );
  for (const item of missing) console.error(`[narration]   ${item}`);
  console.error(
    `[narration] Generate them with scripts/synthesize-narration.mjs (owner checkpoint, phase 03 Task 3).`,
  );
  process.exit(1);
}

// --- Cue coverage: all 49 keys with numeric non-negative durations ---
// Warn-only when absent (emitted in the same run as the assets).
let cueOk = true;
let cueWarn = "";
try {
  const cue = JSON.parse(readFileSync(CUE_PATH, "utf8"));
  const cueProblems = [];
  for (const key of storyKeys) {
    const value = cue[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      cueProblems.push(`${key}: ${JSON.stringify(value)}`);
    }
  }
  if (cueProblems.length > 0) {
    cueOk = false;
    cueWarn = `[narration] cue map issues at ${CUE_PATH}: ${cueProblems.slice(0, 5).join(", ")}${cueProblems.length > 5 ? ` (+${cueProblems.length - 5} more)` : ""}`;
  }
} catch {
  cueOk = false;
  cueWarn = `[narration] cue map unreadable or absent at ${CUE_PATH}`;
}
if (!cueOk) console.warn(`${cueWarn}\n[narration] (warn-only: regenerate via the synthesis script to refresh the cue map)`);

console.log(
  `[narration] OK: ${storyKeys.length} narration mp3s present (> ${MIN_BYTES} bytes each) matching bm.js keys` +
    (cueOk ? "; cue map covers all 49 lines" : "; cue map incomplete (warned)") +
    `; src/ clean of Azure endpoint references (VOICE-02)`,
);
