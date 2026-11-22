import "./introOverlay.css";
import gsap from "gsap";
import { t, subscribe } from "../../i18n/i18n.js";

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

export function createIntroOverlay({ onStart } = {}) {
  const root = document.createElement("div");
  root.className = "intro-container";
  root.setAttribute("aria-hidden", "false");
  root.innerHTML = `
    <div class="intro-stack">
      <p class="intro-kicker">${t("intro.kicker")}</p>
      <h1 class="intro-brand" aria-label="THREEJS-PUNK">
        <span class="intro-brand-line">THREEJS</span>
        <span class="intro-brand-line intro-brand-line--accent">PUNK</span>
      </h1>
      <p class="intro-rule" aria-hidden="true"></p>
      <div class="intro-story" aria-live="off">
        <div class="intro-story-scroll"></div>
      </div>
      <div class="intro-actions">
        <button type="button" class="intro-button" disabled>${t("intro.enter")}</button>
      </div>
      <p class="intro-credit">Adri 'C-Fu'</p>
    </div>
  `;

  const button = root.querySelector(".intro-button");
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
  // own <p>; NEVER letter-split the story (D-05).
  function renderStory() {
    storyScroll.textContent = "";
    for (const key of STORY_KEYS) {
      const line = document.createElement("p");
      line.className = "intro-story-line";
      line.textContent = t(key);
      storyScroll.appendChild(line);
    }
    // Rebuild restarts the scroll from the top on language switch.
    restartStoryScroll();
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
  }

  // Page-lifetime subscription (same convention as createHeader.js): the
  // overlay self-removes in playExit/destroy; the unsubscribe is stored for
  // future teardown but deliberately never released here.
  const unsubscribeLanguage = subscribe(syncText);
  void unsubscribeLanguage;

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

  function playExit({ duration = 0.6 } = {}) {
    return new Promise((resolve) => {
      enterTween?.kill();
      exitTween?.kill();
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

    void (async () => {
      await playExit();
      await onStart?.();
    })();
  }

  button.addEventListener("click", handleStart);

  return {
    root,
    playEnter,
    playExit,
    destroy() {
      enterTween?.kill();
      exitTween?.kill();
      button.removeEventListener("click", handleStart);
      root.remove();
    },
  };
}
