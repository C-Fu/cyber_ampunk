import "./walkPrompt.css";
import { isCoarsePointerDevice } from "../../platform/deviceLayout.js";
import { t, subscribe } from "../../i18n/i18n.js";

/**
 * HUD tip shown whenever pointer lock is unlocked (desktop) or before the
 * first touch look (mobile).
 */
export function createWalkPrompt({ domElement, walkControls, state } = {}) {
  const root = document.createElement("button");
  root.type = "button";
  root.className = "walk-prompt";
  root.setAttribute("data-ui-block-look", "true");
  root.hidden = true;
  root.setAttribute("aria-label", t("walkPrompt.clickToActivate"));
  root.innerHTML = `
    <div class="walk-prompt-frame">
      <div class="walk-prompt-pulse" aria-hidden="true"></div>
      <span class="walk-prompt-corner walk-prompt-corner--tl"></span>
      <span class="walk-prompt-corner walk-prompt-corner--tr"></span>
      <span class="walk-prompt-corner walk-prompt-corner--bl"></span>
      <span class="walk-prompt-corner walk-prompt-corner--br"></span>
      <div class="walk-prompt-inner">
        <span class="walk-prompt-kicker">${t("walkPrompt.kicker")}</span>
        <span class="walk-prompt-title">${t("walkPrompt.clickToLook")}</span>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const titleEl = root.querySelector(".walk-prompt-title");
  const kickerEl = root.querySelector(".walk-prompt-kicker");

  let enabled = false;
  let panelOpen = Boolean(state?.openedPanel);
  let hasTouchLooked = walkControls?.hasTouchLooked?.() ?? false;

  function isPointerLocked() {
    return document.pointerLockElement != null;
  }

  function syncCopy() {
    kickerEl.textContent = t("walkPrompt.kicker");
    if (isCoarsePointerDevice()) {
      titleEl.textContent = t("walkPrompt.dragToLook");
      root.setAttribute("aria-label", t("walkPrompt.dragToLook"));
      root.classList.add("walk-prompt--passive");
    } else {
      titleEl.textContent = t("walkPrompt.clickToLook");
      root.setAttribute("aria-label", t("walkPrompt.clickToActivate"));
      root.classList.remove("walk-prompt--passive");
    }
  }

  function sync() {
    syncCopy();

    const coarse = isCoarsePointerDevice();
    const shouldShow = coarse
      ? enabled && !hasTouchLooked && !panelOpen
      : enabled && !isPointerLocked() && !panelOpen;

    root.hidden = !shouldShow;
    root.classList.toggle("walk-prompt--visible", shouldShow);
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    sync();
  }

  function onPointerLockChange() {
    if (isCoarsePointerDevice()) {
      return;
    }

    sync();
  }

  function onClick(event) {
    if (isCoarsePointerDevice()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (!domElement || isPointerLocked() || panelOpen) {
      return;
    }

    domElement.requestPointerLock();
  }

  function onWalkChange({ hasTouchLooked: nextHasTouchLooked } = {}) {
    if (!isCoarsePointerDevice()) {
      return;
    }

    hasTouchLooked = Boolean(nextHasTouchLooked);
    sync();
  }

  document.addEventListener("pointerlockchange", onPointerLockChange);
  root.addEventListener("click", onClick);
  const unsubscribeWalk = walkControls?.subscribe?.(onWalkChange);
  const unsubscribeState = state?.subscribe?.(({ openedPanel }) => {
    panelOpen = Boolean(openedPanel);
    sync();
  });
  const unsubscribeLanguage = subscribe(syncCopy);

  return {
    root,
    setEnabled,
    show() {
      setEnabled(true);
    },
    hide() {
      setEnabled(false);
    },
    destroy() {
      unsubscribeLanguage?.();
      unsubscribeWalk?.();
      unsubscribeState?.();
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      root.removeEventListener("click", onClick);
      root.remove();
    },
  };
}
