import "./createLanguageHintToast.css";
import { getLanguage, setLanguage, t } from "../../i18n/i18n.js";
import {
  getLanguageHintDismissed,
  getStoredLanguage,
  setLanguageHintDismissed,
  setStoredLanguage,
} from "../../platform/userPreferences.js";
import { phosphorX } from "../core/phosphorIcons.js";

const AUTO_DISMISS_MS = 10000;
const HIDE_SETTLE_MS = 420;

function shouldShowHint() {
  // TO-3 guard order (Pitfall 5): stored language first, then current
  // language, then browser locales, then prior dismissal.
  if (getStoredLanguage()) {
    return false;
  }
  if (getLanguage() !== "bm") {
    return false;
  }
  const languages = navigator.languages;
  if (Array.isArray(languages) && languages.length > 0) {
    const prefersMsOrId = languages.some(
      (code) =>
        typeof code === "string" &&
        (code.toLowerCase().startsWith("ms") ||
          code.toLowerCase().startsWith("id")),
    );
    if (prefersMsOrId) {
      return false;
    }
  }
  if (getLanguageHintDismissed()) {
    return false;
  }
  return true;
}

/**
 * One-shot language hint toast (LANG-04, D-09). Text resolves at creation
 * time via t() — no store subscription (TO-8): the toast self-removes on
 * switch, so a live-update subscription is unnecessary on this simplest
 * compliant path.
 */
export function createLanguageHintToast() {
  const root = document.createElement("div");
  root.className = "lang-hint-toast";
  root.setAttribute("aria-live", "polite");
  root.hidden = true;

  // Skeleton from hardcoded literals; dictionary strings enter via
  // textContent/setAttribute only (D-04, T-2-05 — never innerHTML).
  const message = document.createElement("p");
  message.className = "lang-hint-toast__message";
  message.textContent = t("langHint.message");

  const action = document.createElement("button");
  action.type = "button";
  action.className = "lang-hint-toast__action";
  action.textContent = t("langHint.action");

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.className = "lang-hint-toast__dismiss";
  dismiss.setAttribute("aria-label", t("langHint.dismissAria"));
  dismiss.innerHTML = `<span aria-hidden="true">${phosphorX}</span>`;

  root.append(message, action, dismiss);

  let hideTimer = null;
  let removed = false;

  function clearHideTimer() {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function scheduleAutoDismiss() {
    clearHideTimer();
    // Auto-timeout does NOT persist the dismissal flag (TO-4/TO-7) — only
    // explicit action / dismiss clicks persist it.
    hideTimer = window.setTimeout(() => {
      hide();
    }, AUTO_DISMISS_MS);
  }

  function show() {
    if (removed) {
      return;
    }
    if (!root.isConnected) {
      document.body.appendChild(root);
    }
    root.hidden = false;
    requestAnimationFrame(() => {
      root.classList.add("lang-hint-toast--visible");
    });
    scheduleAutoDismiss();
  }

  function hide({ delay = HIDE_SETTLE_MS } = {}) {
    clearHideTimer();
    root.classList.remove("lang-hint-toast--visible");
    window.setTimeout(() => {
      removed = true;
      root.remove();
    }, delay);
  }

  function persistDismissal() {
    setLanguageHintDismissed(true);
  }

  function onActionClick() {
    // Persist-first contract, same as the header pill and settings segments.
    const other = getLanguage() === "bm" ? "en" : "bm";
    setStoredLanguage(other);
    setLanguage(other);
    persistDismissal();
    hide();
  }

  function onDismissClick() {
    persistDismissal();
    hide();
  }

  function onKeyDown(event) {
    // Escape scoped to focus-within (TO-9), not a document-level handler.
    if (event.key === "Escape" && root.contains(document.activeElement)) {
      event.stopPropagation();
      persistDismissal();
      hide();
    }
  }

  action.addEventListener("click", onActionClick);
  dismiss.addEventListener("click", onDismissClick);
  root.addEventListener("keydown", onKeyDown);

  // Hover / focus-within pauses the auto-dismiss timer (TO-7).
  root.addEventListener("mouseenter", clearHideTimer);
  root.addEventListener("mouseleave", scheduleAutoDismiss);
  root.addEventListener("focusin", clearHideTimer);
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) {
      scheduleAutoDismiss();
    }
  });

  return {
    root,
    show,
    hide,
    destroy() {
      clearHideTimer();
      removed = true;
      root.remove();
    },
  };
}

export { shouldShowHint };
