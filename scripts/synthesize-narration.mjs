/**
 * Offline Malay narration synthesis (VOICE-01): reads the 49
 * `intro.story.lNN` lines verbatim from src/i18n/dictionaries/bm.js
 * and synthesizes one mp3 per line via the Azure Speech REST endpoint.
 * Build-time only — nothing here runs in the browser (VOICE-02).
 *
 * Credentials come from the environment ONLY (T-3-01): SPEECH_KEY and
 * SPEECH_REGION must be exported in the shell; the script never reads
 * a .env file and never embeds a key.
 *
 * Usage:
 *   export SPEECH_KEY=... SPEECH_REGION=southeastasia
 *   node scripts/synthesize-narration.mjs [--voice ms-MY-OsmanNeural]
 *                                         [--out public/audio/narration]
 *                                         [--lines l01,l02,l03]
 */
import { bm } from "../src/i18n/dictionaries/bm.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

/** Zero-padded `lNN` key for story line i (0-based), matching STORY_KEYS. */
function lineKey(i) {
  return `l${String(i + 1).padStart(2, "0")}`;
}

/** XML-escape &, <, > before interpolating story text into SSML (T-3-02). */
function xmlEscape(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Parse simple --flag value CLI args. */
function parseArgs(argv) {
  const args = { voice: "ms-MY-OsmanNeural", out: "public/audio/narration", lines: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--voice") args.voice = argv[(i += 1)];
    else if (arg === "--out") args.out = argv[(i += 1)];
    else if (arg === "--lines") args.lines = argv[(i += 1)];
    else {
      console.error(`[narration] unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return args;
}

/**
 * Estimate mp3 duration in seconds by walking MPEG frame headers.
 * Mono 24 kHz @ 48 kbit/s => MPEG-1 Layer III frames (1152 samples/frame,
 * 144 * bitrate / sampleRate bytes each). ±0.1s tolerance is fine — the
 * consumer only tunes a CSS animation duration. Returns null on parse
 * failure (caller falls back to "unknown" + warning).
 */
function mp3DurationSeconds(bytes) {
  // Skip any ID3v2 header at the start of the stream.
  let offset = 0;
  if (bytes.length > 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    const size =
      ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    offset = 10 + size;
  }
  // MPEG version / layer / bitrate / samplerate tables (bits 19-20, 17-18, etc.)
  const VERSIONS = { 0x00: 2.5, 0x08: null, 0x10: 2, 0x18: 1 }; // (byte>>3)&3
  const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
  const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
  const SAMPLE_RATES = { 1: [44100, 48000, 32000, 0], 2: [22050, 24000, 16000, 0], 2.5: [11025, 12000, 8000, 0] };
  let frames = 0;
  let spf = 1152;
  let duration = 0;
  let cursor = offset;
  while (cursor + 4 <= bytes.length) {
    // Frame sync: 11 set bits + version/layer not reserved.
    if (bytes[cursor] !== 0xff || (bytes[cursor + 1] & 0xe0) !== 0xe0) {
      cursor += 1;
      continue;
    }
    const verBits = (bytes[cursor + 1] >> 3) & 0x03;
    const layerBits = (bytes[cursor + 1] >> 1) & 0x03;
    const version = VERSIONS[verBits << 3];
    if (version === null || layerBits === 0 || layerBits === 2) {
      cursor += 1;
      continue;
    }
    const bitrateIdx = (bytes[cursor + 2] >> 4) & 0x0f;
    const srIdx = (bytes[cursor + 2] >> 2) & 0x03;
    const bitrateKbps = (version === 1 ? BITRATES_V1_L3 : BITRATES_V2_L3)[bitrateIdx];
    const sampleRate = (SAMPLE_RATES[version] || [])[srIdx];
    if (!bitrateKbps || !sampleRate) {
      cursor += 1;
      continue;
    }
    const padding = (bytes[cursor + 2] >> 1) & 0x01;
    const samplesPerFrame = version === 1 ? 1152 : 576;
    const frameBytes =
      Math.floor((samplesPerFrame / 8) * (bitrateKbps * 1000) / sampleRate) + padding;
    if (frameBytes < 4) {
      cursor += 1;
      continue;
    }
    frames += 1;
    spf = samplesPerFrame;
    duration += spf / sampleRate;
    cursor += frameBytes;
  }
  if (frames === 0 || duration < 0.1) return null;
  return Math.round(duration * 100) / 100;
}

const SPEECH_KEY = process.env.SPEECH_KEY;
const SPEECH_REGION = process.env.SPEECH_REGION;
if (!SPEECH_KEY || !SPEECH_REGION) {
  console.error(
    "[narration] SPEECH_KEY and SPEECH_REGION must be set in the environment " +
      "(never committed to any file). Azure Portal -> Speech resource -> Keys and Endpoint.",
  );
  process.exit(1);
}

const { voice, out: outDir, lines } = parseArgs(process.argv.slice(2));
const ALLOWED_VOICES = ["ms-MY-OsmanNeural", "ms-MY-YasminNeural"];
if (!ALLOWED_VOICES.includes(voice)) {
  console.error(
    `[narration] voice "${voice}" is not a known ms-MY neural voice. ` +
      `Use one of: ${ALLOWED_VOICES.join(", ")}.`,
  );
  process.exit(1);
}

const storyKeys = Array.from({ length: 49 }, (_, i) => lineKey(i));
const wantedKeys = lines
  ? lines.split(",").map((s) => s.trim())
  : storyKeys;
const unknown = wantedKeys.filter((k) => !storyKeys.includes(k));
if (unknown.length > 0) {
  console.error(`[narration] unknown --lines keys: ${unknown.join(", ")}`);
  process.exit(1);
}

const endpoint = `https://${SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
await mkdir(outDir, { recursive: true });

const cue = {};
const failures = [];

for (const key of wantedKeys) {
  const text = bm[`intro.story.${key}`];
  if (!text) {
    failures.push(`${key}: missing in bm.js`);
    continue;
  }
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ms-MY">` +
    `<voice name="${voice}"><prosody rate="-8%">${xmlEscape(text)}</prosody></voice></speak>`;
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    });
  } catch (error) {
    failures.push(`${key}: network error ${error?.message ?? error}`);
    continue;
  }
  if (!response.ok) {
    failures.push(`${key}: HTTP ${response.status} ${response.statusText}`);
    continue;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const file = path.join(outDir, `${key}.mp3`);
  await writeFile(file, bytes);
  const seconds = mp3DurationSeconds(bytes);
  cue[key] = seconds ?? "unknown";
  console.log(
    `[narration] ${key}: ${(bytes.length / 1024).toFixed(1)} KB` +
      (seconds !== null ? ` ${seconds}s` : " (duration unknown — frame parse failed)"),
  );
  // Rate-limit courtesy: small delay between sequential requests.
  await new Promise((resolve) => setTimeout(resolve, 150));
}

if (failures.length > 0) {
  console.error(`[narration] synthesis FAILED for ${failures.length} line(s):`);
  for (const failure of failures) console.error(`[narration]   ${failure}`);
  process.exit(1);
}

const cuePath = path.join(".planning/phases/03-malay-tts-narration", "narration-cue.json");
await mkdir(path.dirname(cuePath), { recursive: true });
await writeFile(cuePath, `${JSON.stringify(cue, null, 2)}\n`);
const total = Object.values(cue).reduce((sum, v) => (typeof v === "number" ? sum + v : sum), 0);
console.log(`[narration] ${wantedKeys.length} file(s) written to ${outDir} (voice ${voice}).`);
console.log(`[narration] cue map -> ${cuePath} (total ${total.toFixed(1)}s of measured speech).`);
