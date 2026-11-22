import { FEATURES } from "../world/features.js";
import { createRainGlassIntro } from "../intro/createRainGlassIntro.js";
import { createIntroOverlay } from "../ui/intro/createIntroOverlay.js";
import { createPerformanceNotice } from "../ui/intro/createPerformanceNotice.js";

export function createIntroFlow({
  pipeline,
  renderer,
  loaderOverlay,
  revealAppUi,
  world,
  showLanguageHintToast,
  setupNarration,
}) {
  let rainGlassIntro = null;
  let introActive = false;
  let narrationStop = null;
  let startNarrationRef = null;

  function setIntroWorldPaused(paused) {
    if (!world) {
      return;
    }

    for (const emitter of world.smoke?.emitters ?? []) {
      emitter.mesh.visible = !paused;
    }
  }

  async function revealCanvas() {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    renderer.domElement.style.opacity = "1";
    renderer.domElement.style.zIndex = "14";
    await loaderOverlay.finish();
  }

  async function runIntroSequence() {
    introActive = true;
    setIntroWorldPaused(true);
    // Block look / pointer-lock while the glass + title are up. Overlay uses
    // pointer-events: none except the ENTER button, so clicks would otherwise
    // hit the canvas under it (walk is already active for pose stability).
    renderer.domElement.style.pointerEvents = "none";
    rainGlassIntro = createRainGlassIntro({ pipeline });

    const introOverlay = createIntroOverlay({
      // TTS-01 gesture anchor: invoked synchronously at the top of the
      // ENTER click handler (before playExit awaits) — the narration start
      // closure must kick the first audio play() inside the gesture window
      // (Pitfall 2). setupNarration is DI'd from main.js.
      onStart: () => {
        startNarrationRef?.start();
      },
      // Post-exit app reveal (glass fade, DoF restore, UI reveal) runs after
      // the keepStory exit completes so narration keeps the story window up.
      onExited: async () => {
        const notice = createPerformanceNotice();
        notice.show();
        await new Promise((resolve) => setTimeout(resolve, 450));

        await rainGlassIntro?.fadeOut({ duration: 1.2 });
        rainGlassIntro?.destroy();
        rainGlassIntro = null;
        introActive = false;
        setIntroWorldPaused(false);

        await new Promise((resolve) => setTimeout(resolve, 1000));
        await notice.hide();
        notice.destroy();
        renderer.domElement.style.pointerEvents = "auto";
        revealAppUi();
        showLanguageHintToast?.();
      },
      // Pitfall 6: language switch during playback stops narration and
      // clears the highlight (no EN audio exists per D-02).
      onLanguageSwitchDuringPlayback: () => {
        narrationStop?.();
      },
      // RP-4/TTS-06: replay restarts narration from l01 — the overlay
      // already reset the highlight scroll in the same frame.
      onReplay: () => {
        narrationHandle?.restart();
      },
    });

    // main.js builds the narration factory against THIS overlay and
    // returns the synchronous gesture-anchored start() caller (TTS-01);
    // the returned handle also exposes stop for the language-switch path.
    const narrationHandle = setupNarration?.(introOverlay) ?? null;
    startNarrationRef = narrationHandle;
    narrationStop = narrationHandle
      ? () => narrationHandle.stop()
      : null;

    await revealCanvas();
    introOverlay.playEnter();
  }

  async function enterAppWithoutIntro() {
    await revealCanvas();
    renderer.domElement.style.pointerEvents = "auto";
    revealAppUi();
  }

  async function run() {
    if (FEATURES.intro) {
      await runIntroSequence();
    } else {
      await enterAppWithoutIntro();
    }
  }

  return {
    run,
    getRainGlassIntro: () => rainGlassIntro,
    isIntroActive: () => introActive,
  };
}
