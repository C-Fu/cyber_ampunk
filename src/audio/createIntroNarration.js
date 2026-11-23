import { subscribe } from "./audioState.js";

// Default watchdog: if the audio element's `ended` event never fires (stalled
// decode, dropped network tail), skip to the next line so the queue never
// hangs. Real watchdogs use the per-line cue duration when available.
const DEFAULT_WATCHDOG_MS = 12000;
// Sentence-chunk cap for the browser-TTS fallback (PITFALLS.md): utterances
// over ~250 chars get cut off on some engines, so split harder.
const FALLBACK_CHUNK_MAX = 250;

function zeroPad(index) {
  return String(index + 1).padStart(2, "0");
}

// Split a story line into sentence-sized chunks (max FALLBACK_CHUNK_MAX) so
// SpeechSynthesisUtterance chains don't truncate long paragraphs.
function chunkSentence(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
    } else if (current.length + sentence.length + 1 <= FALLBACK_CHUNK_MAX) {
      current = `${current} ${sentence}`;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) {
    chunks.push(current);
  }
  // Hard cap any single oversized sentence (no sentence boundaries).
  const capped = [];
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i += FALLBACK_CHUNK_MAX) {
      capped.push(chunk.slice(i, i + FALLBACK_CHUNK_MAX));
    }
  }
  return capped.length > 0 ? capped : [text];
}

/**
 * Intro narration playback — per-line Audio queue over the committed
 * public/audio/narration/lNN.mp3 assets, with a sentence-chunked browser
 * TTS fallback when the bundled asset fails and a text-only floor when
 * speechSynthesis is absent (TTS-02, D-04).
 *
 * Mute integration (TTS-03): one-way subscription to audioState. When
 * isMusicPlaying flips to false the queue stops and the highlight clears.
 * This module READS audio state and NEVER writes it — it must never call
 * the audioState music setter.
 */
export function createIntroNarration({
  keys,
  getSourceUrl,
  getT,
  cueDurations = null,
  onLineChange = () => {},
  onFinish = () => {},
  onSourceChange = () => {},
} = {}) {
  if (!Array.isArray(keys) || keys.length === 0 || typeof getSourceUrl !== "function") {
    // Disabled factory — same no-op shape as createWetFootstepAudio.
    return {
      start() {},
      stop() {},
      restart() {},
      dispose() {},
    };
  }

  const audioEl = new Audio();
  audioEl.preload = "auto";

  let lineIndex = 0;
  let playing = false;
  let source = "asset"; // "asset" | "fallback" | "unavailable"
  // Once the bundled asset has failed for a line, replay keeps using the
  // fallback from that line onward — retrying a known-dead asset on every
  // restart would just churn failures (harden-the-queue, Task 3).
  let assetFailedAt = null;
  let watchdogTimer = null;
  // Generation token for per-line playback handlers (see playLine).
  let playGeneration = 0;
  let disposed = false;

  function setSource(next) {
    if (source === next) {
      return;
    }
    source = next;
    onSourceChange(next);
  }

  function clearWatchdog() {
    if (watchdogTimer !== null) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  }

  function armWatchdog(index) {
    clearWatchdog();
    const seconds = cueDurations?.[keys[index]];
    const ms =
      typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0
        ? seconds * 2 * 1000 + 3000
        : DEFAULT_WATCHDOG_MS;
    watchdogTimer = setTimeout(() => {
      // 'ended' never fired — skip forward so the queue cannot stall.
      if (playing) {
        advance(1);
      }
    }, ms);
  }

  // --- TTS-02 fallback: sentence-chunked SpeechSynthesisUtterance chain ---
  function speakFallback(index) {
    if (disposed || !playing) {
      return;
    }
    if (typeof speechSynthesis === "undefined") {
      // Graded floor: text-only, no audio at all (D-04).
      setSource("unavailable");
      onLineChange(index);
      const floorTimer = setTimeout(() => {
        if (playing) {
          advance(1);
        }
      }, DEFAULT_WATCHDOG_MS);
      // Floor pacing uses the plain watchdog budget per line.
      void floorTimer;
      return;
    }

    setSource("fallback");
    onLineChange(index);
    const text = getT(keys[index]);
    const chunks = chunkSentence(text);
    const lang = document.documentElement.lang || "ms-MY";

    const speakChunk = (i) => {
      if (disposed || !playing) {
        return;
      }
      if (i >= chunks.length) {
        // Done with this line — move on after a small gap.
        floorNext(index);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[i]);
      utterance.lang = lang;
      utterance.onend = () => speakChunk(i + 1);
      utterance.onerror = () => speakChunk(i + 1);
      speechSynthesis.speak(utterance);
    };

    // If the whole chain somehow stalls (no onend), the watchdog still
    // advances; arm it against the line's duration.
    armWatchdog(index);
    speakChunk(0);
  }

  function floorNext(index) {
    clearWatchdog();
    if (disposed || !playing) {
      return;
    }
    if (index + 1 < keys.length) {
      lineIndex = index + 1;
      if (source === "fallback") {
        speakFallback(lineIndex);
      } else {
        // Unavailable floor: pace the text-only run with the watchdog.
        onLineChange(lineIndex);
        armWatchdog(lineIndex);
      }
    } else {
      finish();
    }
  }

  function finish() {
    clearWatchdog();
    playing = false;
    onLineChange(null); // HL-3: highlight clears at story end.
    onFinish();
  }

  function advance(step = 1) {
    clearWatchdog();
    if (disposed || !playing) {
      return;
    }
    const next = lineIndex + step;
    if (next >= keys.length) {
      finish();
      return;
    }
    lineIndex = next;
    playLine(lineIndex);
  }

  function playLine(index) {
    // Stick to the fallback once an asset failure has been seen at or
    // before this line (Task 3 hardening).
    if (assetFailedAt !== null && index >= assetFailedAt) {
      speakFallback(index);
      return;
    }
    onLineChange(index);
    armWatchdog(index);

    // Generation token: bumped on every playLine. Stale handlers from an
    // aborted prior play check it and no-op — this kills the race where a
    // rejected play() from line N fired onError with line M's index,
    // poisoning the queue into permanent fallback (boot-deploy bug, 2026-11-23).
    const generation = ++playGeneration;

    audioEl.src = getSourceUrl(zeroPad(index));

    const onEnded = () => {
      if (generation !== playGeneration) return;
      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("error", onError);
      clearWatchdog();
      advance(1);
    };
    const onError = () => {
      if (generation !== playGeneration) return;

      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("error", onError);
      // Asset failed to load/play — hand the rest of the queue to the
      // browser TTS fallback starting from this same line (TTS-02).
      assetFailedAt =
        assetFailedAt === null ? index : Math.min(assetFailedAt, index);
      audioEl.removeAttribute("src");
      speakFallback(index);
    };

    audioEl.addEventListener("ended", onEnded);
    audioEl.addEventListener("error", onError);

    const playPromise = audioEl.play();
    if (playPromise) {
      playPromise.catch((err) => {
        // AbortError = the src was swapped by advance() while this play()
        // was still resolving — the line finished or moved on; NOT an asset
        // failure. Treating it as one poisoned the queue from a later line
        // (stale onError ran with the CURRENT lineIndex) and permanently
        // routed every remaining line to the fallback.
        if (err?.name === "AbortError") {
          return;
        }
        onError();
      });
    }
  }

  function start() {
    if (disposed || playing) {
      return;
    }
    playing = true;
    lineIndex = 0;
    setSource("asset");
    // Called synchronously inside the ENTER gesture handler (Pitfall 2):
    // the first play() must run in the same task as the click.
    playLine(0);
  }

  function stop() {
    playing = false;
    clearWatchdog();
    audioEl.pause();
    audioEl.removeAttribute("src");
    if (typeof speechSynthesis !== "undefined") {
      speechSynthesis.cancel();
    }
    onLineChange(null);
  }

  function restart() {
    if (disposed) {
      return;
    }
    stop();
    // Replay starts from l01 with the highlight reset in the same frame
    // (RP-4). assetFailedAt is deliberately NOT reset — a known-dead asset
    // stays on the fallback path (Task 3 hardening).
    playing = true;
    lineIndex = 0;
    setSource(assetFailedAt === null ? "asset" : source);
    playLine(0);
  }

  // --- TTS-03 mute trap: one-way read-only subscription. On mute the
  // queue stops and the highlight clears; narration NEVER writes music
  // state. The subscribe() helper fires immediately with the current
  // state — the initial call is a no-op for control flow because playing
  // is still false at construction time.
  const unsubscribe = subscribe(({ isMusicPlaying }) => {
    if (disposed) {
      return;
    }
    if (!isMusicPlaying && playing) {
      stop();
    }
  });

  return {
    start,
    stop,
    restart,
    dispose() {
      disposed = true;
      unsubscribe();
      stop();
    },
  };
}
