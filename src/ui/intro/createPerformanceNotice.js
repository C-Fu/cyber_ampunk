import "./performanceNotice.css";
import { t } from "../../i18n/i18n.js";

export function createPerformanceNotice({
  message = t("performanceNotice.adjusting"),
} = {}) {
  const root = document.createElement("p");
  root.className = "performance-notice";
  root.textContent = message;
  root.setAttribute("aria-live", "polite");
  root.hidden = true;
  document.body.appendChild(root);

  function show() {
    root.hidden = false;
    requestAnimationFrame(() => {
      root.classList.add("performance-notice--visible");
    });
  }

  function hide({ delay = 420 } = {}) {
    return new Promise((resolve) => {
      root.classList.remove("performance-notice--visible");
      window.setTimeout(() => {
        root.hidden = true;
        resolve();
      }, delay);
    });
  }

  function destroy() {
    root.remove();
  }

  return {
    show,
    hide,
    destroy,
  };
}
