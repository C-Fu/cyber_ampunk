import "./introOverlay.css";
import gsap from "gsap";
import { t, subscribe } from "../../i18n/i18n.js";
import { phosphorArrowCounterClockwise } from "../core/phosphorIcons.js";

// Per-line keys — the owner's full-length BM story verbatim (D-07), one key
// per non-empty line (l01..l49). Phase 3 TTS narration source (D-06). Each
// line renders as its own paragraph inside the scrolling story region.
const STORY_KEYS = Array.from({ length: 49 }, (_, i) =>
  `intro.story.l${String(i + 1).padStart(2, "0")}`,
);

function splitIntoLetters(element, className = "intro-letter") {
  const text = element.textContent.trim();
  element.textContent = "";
  element.setAttribute("aria-label", text);

  return [...text].map((char) => {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = char === " " ? "\u00a0" : char;
    span.setAttribute("aria-hidden", "true");
    element.appendChild(span);
    return span;
  });
}

export function createIntroOverlay({
  onStart,
  onExited,
  onLanguageSwitchDuringPlayback,
  onReplay,
} = {}) {
  const root = document.createElement("div");
  root.className = "intro-container";
  root.setAttribute("aria-hidden", "false");
  root.innerHTML = `
    <div class="intro-stack">
      <p class="intro-kicker">${t("intro.kicker")}</p>
      <h1 class="intro-brand" aria-label="CYBER_AMPUNK">
        <span class="intro-brand-line intro-brand-line--accent">CYBER_AMPUNK</span>
      </h1>
      <p class="intro-rule" aria-hidden="true"></p>
      <div class="intro-story" aria-live="off" style="opacity:0">
        <div class="intro-story-scroll"></div>
      </div>
      <p class="intro-source-label" aria-live="off"></p>
      <div class="intro-actions">
        <button type="button" class="intro-button" disabled>${t("intro.enter")}</button>
        <button type="button" class="intro-replay-button" aria-label="${t("intro.voice.replay")}" disabled>${phosphorArrowCounterClockwise}</button>
      </div>
      <p class="intro-credit">://BY ADRI 'C-FU'</p>
    </div>
  `;

  const button = root.querySelector(".intro-button");
  const replayButton = root.querySelector(".intro-replay-button");
  const sourceLabel = root.querySelector(".intro-source-label");
  const kicker = root.querySelector(".intro-kicker");
  const brandLines = [...root.querySelectorAll(".intro-brand-line")];
  const rule = root.querySelector(".intro-rule");
  const story = root.querySelector(".intro-story");
  const storyScroll = root.querySelector(".intro-story-scroll");
  const credit = root.querySelector(".intro-credit");

  document.body.appendChild(root);

  const brandLetters = brandLines.flatMap((line) =>
    splitIntoLetters(line, "intro-letter"),
  );

  // Story lines are built with createElement/textContent only — no
  // innerHTML interpolation of t() output (T-2-03, D-04). Every line is its
  // own <p>; NEVER letter-split the story (D-05). Line elements are kept in
  // an array at render time so the narration highlight can rebind after any
  // rebuild (HL-4).
  const storyLineEls = [];

  // SL-2/SL-4: three-state narration source enum; the label re-derives from
  // language AND source state on every syncText (SL-4). "idle" pre-ENTER
  // renders empty but keeps the element's space (H-2 zero-reflow).
  let narrationSource = "idle"; // "idle" | "asset" | "fallback" | "unavailable"
  let narrationMuted = false;

  const SOURCE_LABEL_KEYS = {
    asset: "intro.voice.sourceAsset",
    fallback: "intro.voice.sourceTts",
    unavailable: "intro.voice.sourceNone",
  };

  function renderSourceLabel() {
    const key = SOURCE_LABEL_KEYS[narrationSource];
    sourceLabel.textContent = key ? t(key) : "";
    // SL-3: cyan only in the unavailable state (the one degraded moment).
    // MU-2: muted dims the label to the quiet state.
    sourceLabel.classList.toggle(
      "intro-source-label--unavailable",
      narrationSource === "unavailable",
    );
    sourceLabel.classList.toggle("intro-source-label--muted", narrationMuted);
  }

  // R-1/MU-3: replay disabled-quiet (opacity 0.4) while muted, finished, or
  // fallback-failed; enabled while narration is running. Never shows broken.
  function renderReplayState() {
    const canReplay =
      !narrationMuted &&
      narrationSource !== "idle" &&
      narrationSource !== "unavailable";
    replayButton.disabled = !canReplay;
  }

  // setNarrationSource from the narration module's onSourceChange callback
  // (Task 1 wiring); null index onLineChange also arrives via highlight.
  function setNarrationSource(source, { muted = narrationMuted } = {}) {
    narrationSource = source;
    if (muted !== undefined) {
      narrationMuted = muted;
    }
    renderSourceLabel();
    renderReplayState();
  }

  function setNarrationMuted(muted) {
    narrationMuted = muted;
    renderSourceLabel();
    renderReplayState();
  }

  function renderStory() {
    storyScroll.textContent = "";
    storyLineEls.length = 0;
    for (const key of STORY_KEYS) {
      const line = document.createElement("p");
      line.className = "intro-story-line";
      line.textContent = t(key);
      storyScroll.appendChild(line);
      storyLineEls.push(line);
    }
    // Rebuild restarts the scroll from the top on language switch.
    restartStoryScroll();
    // HL-4: fresh line elements need the current highlight re-applied.
    rebindStoryHighlight();
  }

  // Credits-style slow upward auto-scroll on the inner wrapper (owner
  // direction: "slowly scroll up"). Pure CSS animation — no render-loop
  // coupling; the GSAP timelines keep tweening the container box untouched.
  function restartStoryScroll() {
    storyScroll.style.animation = "none";
    // Force a reflow so re-assigning the animation name restarts it.
    void storyScroll.offsetHeight;
    storyScroll.style.animation = "";
  }

  // D-05/S-4: kicker/story/ENTER only — the brand aria-label and the credit
  // are fixed brand tokens and must NEVER re-sync (letter-split region stays
  // untouched; textContent-only, no innerHTML interpolation of t() — T-2-03).
  function syncText() {
    kicker.textContent = t("intro.kicker");
    renderStory();
    button.textContent = t("intro.enter");
    // SL-4: label + aria re-derive from language and source state.
    renderSourceLabel();
    if (narrationSource !== "idle") {
      replayButton.setAttribute("aria-label", t("intro.voice.replay"));
    }
    // Language switch during playback stops narration and clears the
    // highlight (Pitfall 6 — no EN audio exists per D-02, simplest correct
    // behavior). Rebind the highlight targets after the rebuild (HL-4).
    onLanguageSwitchDuringPlayback?.();
  }

  // Page-lifetime subscription (same convention as createHeader.js): the
  // overlay self-removes in playExit/destroy; the unsubscribe is stored for
  // future teardown but deliberately never released here.
  // TTS-05 highlight: exactly zero-or-one active line (HL-2). index === null
  // clears the highlight (story end, mute, HL-3). Targets are the live
  // storyLineEls array, so a renderStory() rebuild is picked up on the next
  // call; the current index is re-applied instantly after rebuilds (HL-4).
  // NOTE: must be declared BEFORE subscribe(syncText) — subscribe fires
  // syncText immediately (audioState contract), and renderStory ->
  // rebindStoryHighlight reads this binding; a later declaration put it in
  // the TDZ during the first immediate sync (boot crash for every visitor).
  let activeLineIndex = null;

  const unsubscribeLanguage = subscribe(syncText);
  void unsubscribeLanguage;

  function setStoryHighlight(index) {
    activeLineIndex =
      typeof index === "number" && index >= 0 && index < storyLineEls.length
        ? index
        : null;
    storyLineEls.forEach((line, i) => {
      line.classList.toggle("intro-story-line--active", i === activeLineIndex);
    });
  }

  // Rebind after every renderStory() rebuild (HL-4): language switches
  // rebuild the DOM, so re-apply the current highlight index to the fresh
  // elements.
  function rebindStoryHighlight() {
    const index = activeLineIndex;
    setStoryHighlight(null);
    if (index !== null) {
      setStoryHighlight(index);
    }
  }

  // Scroll tuning (TTS-03 plan / carried decision): set the CSS var driving
  // the story scroll duration, then restart the animation so the new
  // duration takes effect from the top.
  function setScrollDuration(seconds) {
    if (
      typeof seconds !== "number" ||
      !Number.isFinite(seconds) ||
      seconds <= 0
    ) {
      return;
    }
    root.style.setProperty("--intro-story-dur", `${seconds}s`);
    restartStoryScroll();
  }

  let started = false;
  let enterTween = null;
  let exitTween = null;

  gsap.set(kicker, { opacity: 0, y: 12 });
  gsap.set(brandLetters, {
    opacity: 0,
    y: 28,
    filter: "blur(8px)",
  });
  gsap.set(rule, { scaleX: 0, opacity: 0 });
  gsap.set(story, { opacity: 0, y: 14 });
  gsap.set(button, { opacity: 0, y: 10 });
  gsap.set(replayButton, { opacity: 0, y: 10 });
  gsap.set(sourceLabel, { opacity: 0 });
  gsap.set(credit, { opacity: 0, y: 8 });

  function playEnter() {
    enterTween?.kill();
    enterTween = gsap
      .timeline()
      .to(kicker, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
      })
      .to(
        brandLetters,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.9,
          ease: "power3.out",
          stagger: {
            each: 0.035,
            from: "start",
          },
        },
        "-=0.35",
      )
      .to(
        rule,
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.75,
          ease: "power2.inOut",
        },
        "-=0.55",
      )
      .to(
        story,
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: "power2.out",
        },
        "-=0.4",
      )
      .to(
        button,
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: "power2.out",
          onComplete: () => {
            button.disabled = false;
          },
        },
        "-=0.25",
      )
      .to(
        replayButton,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.45",
      )
      .to(
        sourceLabel,
        {
          // SL-1 idle: present but quiet — animated in to 0.45, then the
          // state classes govern opacity from there.
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.4",
      )
      .to(
        credit,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.35",
      );
  }

  function playExit({ duration = 0.6, keepStory = false } = {}) {
    return new Promise((resolve) => {
      enterTween?.kill();
      exitTween?.kill();
      if (keepStory) {
        // Narration mode: reveal the story window (it was hidden pre-ENTER
        // per owner direction — appears + scrolls only after MASUK) and
        // fade only the surrounding chrome. The story window stays for the
        // whole narration run. The ENTER button fades and becomes inert
        // (replay takes over, RP-1).
        story.classList.add("intro-story--narrating");
        story.style.opacity = "";
        // Owner direction: the scroll starts ~2s AFTER the voice begins, so the
        // story follows the narration instead of leading it.
        setTimeout(() => restartStoryScroll(), 2000);
        exitTween = gsap
          .timeline({
            onComplete: () => {
              resolve();
            },
          })
          .to(kicker, { opacity: 0, duration, ease: "power1.out" }, 0)
          .to(brandLines, { opacity: 0, duration, ease: "power1.out" }, 0)
          .to(rule, { opacity: 0, duration, ease: "power1.out" }, 0)
          .to(button, { opacity: 0, duration, ease: "power1.out" }, 0)
          .to(credit, { opacity: 0, duration, ease: "power1.out" }, 0);
        // Story window, replay button, and source label persist (RP-1/SL-1).
        return;
      }
      exitTween = gsap.to(root, {
        opacity: 0,
        duration,
        ease: "power1.out",
        onComplete: () => {
          root.remove();
          resolve();
        },
      });
    });
  }

  function handleStart() {
    if (started || button.disabled) {
      return;
    }

    started = true;
    button.disabled = true;
    button.style.pointerEvents = "none";

    // TTS-01 gesture anchor: narration start() is invoked synchronously at
    // the top of the ENTER click handler — before any await — so the first
    // audio play() lands inside the user-gesture window (Pitfall 2).
    onStart?.();
    void (async () => {
      await playExit({ keepStory: true });
      // Chrome faded with the story kept — hand off to the app reveal
      // sequence (glass fade, DoF restore, UI reveal) in the flow layer.
      onExited?.();
    })();
  }

  button.addEventListener("click", handleStart);

  function handleReplayClick() {
    if (replayButton.disabled) {
      return;
    }
    // RP-4: restart from l01 — highlight resets to line 1 in the same frame
    // (the narration module's onLineChange drives it) and the scroll
    // restarts via restartStoryScroll.
    restartStoryScroll();
    onReplay?.();
  }

  replayButton.addEventListener("click", handleReplayClick);

  return {
    root,
    playEnter,
    playExit,
    setStoryHighlight,
    rebindStoryHighlight,
    setScrollDuration,
    setNarrationSource,
    setNarrationMuted,
    destroy() {
      enterTween?.kill();
      exitTween?.kill();
      button.removeEventListener("click", handleStart);
      replayButton.removeEventListener("click", handleReplayClick);
      root.remove();
    },
  };
}
