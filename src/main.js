import "./ui/core/global.css";
import * as THREE from "three/webgpu";
import { createScene } from "./world/scene.js";
import { createWorld, createLightingController } from "./world/createWorld.js";
import { applyEnvironmentMap } from "./world/envMap.js";
import { createPostProcessing } from "./post/postprocessing.js";
import { createLoaderOverlay } from "./app/createLoaderOverlay.js";
import { createAppShell } from "./app/createAppShell.js";
import { createIntroFlow } from "./app/createIntroFlow.js";
import {
  createLanguageHintToast,
  shouldShowHint,
} from "./ui/chrome/createLanguageHintToast.js";
import {
  createCamera,
  createCameraLayoutSync,
  cameraParams,
} from "./bootstrap/createCamera.js";
import {
  createRenderer,
  createShadowUpdater,
  resizeRenderer,
} from "./bootstrap/createRenderer.js";
import { createCameraDirector } from "./runtime/createCameraDirector.js";
import { createRenderLoop } from "./runtime/createRenderLoop.js";
import {
  compileDeferredStartup,
  finalizeStartupLighting,
} from "./runtime/warmup.js";
import { createPerformanceDevTools } from "./debug/createPerformanceDevTools.js";
import { createInspectorSession } from "./debug/createInspectorSession.js";
import {
  createDevAppApi,
  attachDevAudio,
  attachDevPerf,
} from "./debug/createDevAppApi.js";
import {
  syncLayoutClass,
  onMobileLayoutChange,
} from "./platform/deviceLayout.js";
import { createAdaptiveDprController } from "./platform/adaptiveDpr.js";
import {
  performanceProfile,
  applyDevicePerformanceDefaults,
  shouldCompileBeforeRenderLoop,
} from "./platform/performanceProfile.js";
import { getStoredLookPreset, isDevelopmentModeEnabled } from "./platform/userPreferences.js";
import { applyStaticHead } from "./i18n/staticHead.js";
import { t } from "./i18n/i18n.js";
import { createIntroNarration } from "./audio/createIntroNarration.js";
import { subscribe } from "./audio/audioState.js";
import {
  DEFAULT_LOOK_PRESET,
  LOOK_PRESETS,
} from "./post/look/cyberpunkLook.js";

const STORY_LINE_COUNT = 49;
// Shipped with the build (public/) — the .planning/ source path is
// repo-only and 404s on the deployed site.
const NARRATION_CUE_URL =
  `${import.meta.env.BASE_URL}audio/narration/narration-cue.json`;

// Load the per-line cue durations map (Task 3 / carried decision: audio
// drives scroll length). Returns null on any missing or non-numeric
// duration — the caller keeps the CSS default (100s) then.
async function loadNarrationCue() {
  try {
    const response = await fetch(NARRATION_CUE_URL);
    if (!response.ok) {
      return null;
    }
    const cue = await response.json();
    let total = 0;
    for (let i = 1; i <= STORY_LINE_COUNT; i += 1) {
      const seconds = cue[`l${String(i).padStart(2, "0")}`];
      if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
        return null;
      }
      total += seconds;
    }
    return total > 0 ? { cue, total } : null;
  } catch {
    return null;
  }
}

const loader = createLoaderOverlay();

init(loader).catch((error) => {
  loader.fail();
  console.error("Failed to initialize scene:", error);
});

async function init(loaderOverlay) {
  // Must run before createRenderer so the initial setPixelRatio sees iOS caps.
  applyDevicePerformanceDefaults();
  syncLayoutClass();
  applyStaticHead();

  loaderOverlay.setProgress(0.03);
  loaderOverlay.setStatus(t("loader.bootingScene"));

  const camera = createCamera();
  const sceneResult = createScene();
  const { scene, sunLight } = sceneResult;

  loaderOverlay.setProgress(0.1);
  loaderOverlay.setStatus(t("loader.spinningRenderer"));

  const { renderer } = await createRenderer();

  loaderOverlay.setProgress(0.2);
  loaderOverlay.setStatus(t("loader.linkingWebgpu"));

  const { requestShadowMapUpdate } = createShadowUpdater({
    renderer,
    getSunLight: () => sunLight,
  });

  const world = await createWorld({
    scene,
    renderer,
    camera,
    loaderOverlay,
    requestShadowMapUpdate,
  });

  const envMapBaseIntensity = { value: 0.08 };
  const lighting = createLightingController({
    sceneResult,
    envMapBaseIntensity,
    requestShadowMapUpdate,
  });

  lighting.syncLighting();
  requestShadowMapUpdate("init");

  loaderOverlay.setProgress(0.8);

  applyEnvironmentMap(scene, renderer, world.envTexture, {
    intensity: envMapBaseIntensity.value,
  });
  scene.environmentRotation.set(
    0,
    THREE.MathUtils.degToRad(70),
    THREE.MathUtils.degToRad(51),
  );

  loaderOverlay.setProgress(0.85);
  loaderOverlay.setStatus(t("loader.wiringPostFx"));

  const pipeline = createPostProcessing(renderer, scene, camera, {
    rain: world.rain,
    smoke: world.smoke,
  });
  const post = pipeline.post;

  const storedLookPreset = getStoredLookPreset();
  const initialLookPreset =
    storedLookPreset && LOOK_PRESETS[storedLookPreset]
      ? storedLookPreset
      : DEFAULT_LOOK_PRESET;

  pipeline.applyLookPreset(initialLookPreset, {
    bloomPass: pipeline.bloomPass,
    lensflare: pipeline.lensflare,
  });

  const adaptiveDpr = createAdaptiveDprController({
    renderer,
    pipeline,
    // Once FPS forces the pixel ratio down, also shed DOF, lensflare, and
    // billboard video decode — all comparatively expensive once we know the
    // device is struggling.
    onForcedLow: () => {
      performanceProfile.dof = false;
      pipeline.perf.setDofEnabled(false);
      performanceProfile.lensflare = false;
      pipeline.perf.setLensflareEnabled(false);
      world.billboards?.userData?.billboardMaterials?.billboard?.disable();
    },
  });
  adaptiveDpr.onResize();

  // Adaptive DPR must not react to intro / rain-glass FPS — that hitch was
  // permanently locking capable Androids into the low-DPR path before ENTER.
  const adaptiveSampleGate = { allow: false };

  const performanceTools = createPerformanceDevTools({
    pipeline,
    ground: world.ground,
    adaptiveDpr,
    getAllowAdaptiveSample: () => adaptiveSampleGate.allow,
  });

  const walkModeBridge = { onChange: null };

  const cameraDirector = createCameraDirector({
    camera,
    renderer,
    world,
    getFinishedIntro: () => appShell?.isFinishedIntro?.() ?? false,
    onWalkModeChange: (walk) => walkModeBridge.onChange?.(walk),
  });

  const cameraLayout = createCameraLayoutSync({
    camera,
    getWalkControls: () => cameraDirector.walkControls,
  });

  const inspectorSession = createInspectorSession({
    renderer,
    pipeline,
    sceneResult,
    world,
    cameraDirector,
    cameraParams,
    applyCameraFovForLayout: cameraLayout.applyCameraFovForLayout,
    syncWalkEyeHeight: cameraLayout.syncWalkEyeHeight,
    syncLighting: lighting.syncLighting,
    syncEnvironmentIntensity: lighting.syncEnvironmentIntensity,
    envMapBaseIntensity,
    requestShadowMapUpdate,
    adaptiveDpr,
  });

  const appShell = createAppShell({
    renderer,
    camera,
    cameraDirector,
    world,
    pipeline,
    inspectorSession,
    syncLighting: lighting.syncLighting,
  });

  walkModeBridge.onChange = appShell.onWalkModeChange;

  const devApp = createDevAppApi({
    scene,
    world,
    camera,
    controls: cameraDirector.controls,
  });
  attachDevPerf(devApp, performanceTools.perfApi);

  const { carEngineAudio, planeEngineAudio, wetFootstepAudio } =
    await appShell.initAudio();
  cameraDirector.setFootstepAudio(wetFootstepAudio);
  attachDevAudio(devApp, carEngineAudio, planeEngineAudio, wetFootstepAudio);

  // --- Narration wiring (phase 3 TTS-01..06) ---
  // Build the per-line narration factory with the bm story keys, the
  // committed lNN.mp3 assets, cue-driven watchdogs, and the overlay's
  // highlight/scroll callbacks. startNarration is passed into the flow and
  // invoked synchronously inside the ENTER gesture handler (Pitfall 2).
  const narrationKeys = Array.from(
    { length: STORY_LINE_COUNT },
    (_, i) => `intro.story.l${String(i + 1).padStart(2, "0")}`,
  );
  const narrationCue = await loadNarrationCue();

  // Returns the gesture-anchored narration handle for the given overlay;
  // also applies the cue-driven scroll duration once, at setup time.
  function setupNarration(introOverlay) {
    const narration = createIntroNarration({
      keys: narrationKeys,
      getSourceUrl: (nn) => `${import.meta.env.BASE_URL}audio/narration/l${nn}.mp3`,
      getT: (key) => t(key),
      cueDurations: narrationCue?.cue ?? null,
      onLineChange: (index) => introOverlay.setStoryHighlight(index),
      onFinish: () => {},
      // TTS-04: label state machine — bundled / device TTS / unavailable.
      onSourceChange: (source) => introOverlay.setNarrationSource(source),
    });
    if (narrationCue?.total) {
      introOverlay.setScrollDuration(narrationCue.total);
    }
    // MU-2: mute dims the label and disables replay (R-1/MU-3). One-way
    // read of audioState — narration never writes music state (TTS-03).
    const unsubscribeMute = subscribe(({ isMusicPlaying }) => {
      introOverlay.setNarrationMuted(!isMusicPlaying);
      // Owner direction 2026-11-23: un-muting after mute restarts the
      // narration (mute stops it; unmute resumes from the stopped line).
      if (isMusicPlaying) {
        narration.resume();
      }
    });
    narration._unsubscribeMute = unsubscribeMute;
    return {
      start: () => narration.start(),
      stop: () => narration.stop(),
      restart: () => narration.restart(),
      narration,
    };
  }

  appShell.bindIdleListeners();
  appShell.bindOrbitIdleListeners(cameraDirector.controls);

  cameraDirector.preparePreRevealPose();

  const introFlow = createIntroFlow({
    pipeline,
    renderer,
    loaderOverlay,
    revealAppUi: () => {
      appShell.revealAppUi();
      adaptiveSampleGate.allow = true;
    },
    world,
    // LANG-04: the toast guards itself (TO-3) and never shows when the
    // guard fails; creation-time t() only (TO-8).
    showLanguageHintToast: () => {
      const toast = createLanguageHintToast();
      if (shouldShowHint()) {
        toast.show();
      } else {
        toast.destroy();
      }
    },
    // TTS-01: gesture-anchored narration start — the flow passes its
    // overlay here so main.js wires the factory + UI callbacks and returns
    // the synchronous start() caller.
    setupNarration,
  });

  const renderLoop = createRenderLoop({
    camera,
    cameraDirector,
    world,
    pipeline,
    post,
    performanceTools,
    renderer,
    getRainGlassIntro: introFlow.getRainGlassIntro,
    getIntroActive: introFlow.isIntroActive,
    onFrame: (delta) => appShell.updateHud(delta),
  });

  await finalizeStartupLighting({
    loaderOverlay,
    syncLighting: lighting.syncLighting,
    requestShadowMapUpdate,
    renderer,
    scene,
    pipeline,
    camera,
    world,
    post,
  });

  const deferredCompile = compileDeferredStartup({
    renderer,
    scene,
    pipeline,
    camera,
    world,
  }).catch((error) => {
    console.warn("[warmup] Deferred shader compile failed:", error);
  });

  if (shouldCompileBeforeRenderLoop()) {
    await deferredCompile;
  }

  renderLoop.startLoop();

  window.addEventListener("resize", () => {
    syncLayoutClass();
    cameraLayout.onWindowResizeAspect();
    resizeRenderer(renderer, pipeline, adaptiveDpr);
    requestShadowMapUpdate("resize");
  });

  onMobileLayoutChange(() => {
    syncLayoutClass();
    cameraLayout.applyCameraFovForLayout();
  });

  await introFlow.run();

  if (!shouldCompileBeforeRenderLoop()) {
    await deferredCompile;
  }

  // Inspector attaches only via Development Mode (never on load).
  inspectorSession.bootstrapInspector(appShell.settingsPanel);

  if (isDevelopmentModeEnabled()) {
    inspectorSession.revealInspector();
  }
}
