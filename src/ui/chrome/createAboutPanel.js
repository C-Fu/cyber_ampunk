import "./aboutPanel.css";
import { t, subscribe } from "../../i18n/i18n.js";
import { isMobileLayout, onMobileLayoutChange } from "../../platform/deviceLayout.js";
import { SOURCE_CODE_URL } from "../core/externalLinks.js";

const CLOSE_ICON = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
`;

export function createAboutPanel({ state } = {}) {
  const root = document.createElement("div");
  root.className = "about-overlay";
  root.hidden = true;
  root.innerHTML = `
    <button type="button" class="close-button-panel" aria-label="${t("about.close")}" data-i18n-aria="about.close">
      ${CLOSE_ICON}
    </button>

    <div class="about-content">
      <div class="about-body">
        <div class="about-brand">
          <!-- Brand name threejs-punk stays hardcoded in both languages (Pitfall 3). -->
          <p class="about-brand-title">THREEJS-PUNK</p>
          <small class="about-brand-subtitle">BY ANDERSON MANCINI &amp; SUNAG</small>
        </div>
        <div class="about-copy">
          <div class="about-copy-col">
            <p class="about-lead" data-i18n="about.lead1">
              ${t("about.lead1")}
            </p>
            <p class="about-lead" data-i18n="about.lead2">
              ${t("about.lead2")}
            </p>
          </div>
          <div class="about-copy-col">
            <p class="about-lead" data-i18n="about.lead3">
              ${t("about.lead3")}
            </p>
            <p class="about-lead" data-i18n="about.lead4">
              ${t("about.lead4")}
            </p>
          </div>
        </div>
      </div>

      <div class="about-footer">
        <div class="about-buttons">
          <button type="button" class="refresh-button-panel about-link-anderson">
            Anderson Mancini
          </button>
          <button type="button" class="refresh-button-panel about-link-sunag">
            Sunag
          </button>
          <button type="button" class="refresh-button-panel about-link-source" data-i18n="about.sourceLink">
            ${t("about.sourceLink")}
          </button>
        </div>
        <p class="about-model-credits">
          By Anderson Mancini &amp; Sunag
        </p>
        <p class="about-recommended about-recommended--desktop">
          <span class="about-recommended-title" data-i18n="about.recommendedTitle">${t("about.recommendedTitle")}</span>
          <span data-i18n="about.recommendedDesktop">${t("about.recommendedDesktop")}</span>
        </p>
        <p class="about-recommended about-recommended--mobile">
          <span class="about-recommended-title" data-i18n="about.recommendedTitle">${t("about.recommendedTitle")}</span>
          <span data-i18n="about.recommendedMobile">${t("about.recommendedMobile")}</span>
        </p>
      </div>
    </div>
  `;

  const closeButton = root.querySelector(".close-button-panel");
  const andersonButton = root.querySelector(".about-link-anderson");
  const sunagButton = root.querySelector(".about-link-sunag");
  const sourceButton = root.querySelector(".about-link-source");
  const desktopRecommended = root.querySelector(".about-recommended--desktop");
  const mobileRecommended = root.querySelector(".about-recommended--mobile");

  function syncRecommendedVisibility() {
    const mobile = isMobileLayout();
    desktopRecommended.hidden = mobile;
    mobileRecommended.hidden = !mobile;
  }

  // D-04 walker: dictionary values reach the DOM ONLY via textContent —
  // never an innerHTML write. dataset.i18n is a dictionary key; unknown
  // keys hit the D-08 missing-key path.
  function syncText() {
    for (const el of root.querySelectorAll("[data-i18n]")) {
      el.textContent = t(el.dataset.i18n);
    }

    for (const el of root.querySelectorAll("[data-i18n-aria]")) {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    }
  }

  syncRecommendedVisibility();
  const unsubscribeLayout = onMobileLayoutChange(syncRecommendedVisibility);
  const unsubscribeLanguage = subscribe(syncText);

  function open() {
    root.classList.remove("about-overlay--force-hidden");
    syncRecommendedVisibility();
    root.hidden = false;
  }

  function close() {
    root.hidden = true;
    state?.closePanel();
  }

  closeButton.addEventListener("click", close);

  andersonButton.addEventListener("click", () => {
    window.open("https://andersonmancini.dev", "_blank", "noopener,noreferrer");
  });

  sunagButton.addEventListener("click", () => {
    window.open("https://x.com/sea3dformat", "_blank", "noopener,noreferrer");
  });

  sourceButton.addEventListener("click", () => {
    window.open(SOURCE_CODE_URL, "_blank", "noopener,noreferrer");
  });

  function onKeyDown(event) {
    if (event.key === "Escape" && !root.hidden) {
      close();
    }
  }

  document.addEventListener("keydown", onKeyDown);

  state?.subscribe(({ openedPanel }) => {
    if (openedPanel === "about") {
      open();
    } else if (!root.hidden) {
      root.hidden = true;
    }
  });

  function setForceHidden(hidden) {
    if (hidden && !root.hidden) {
      return;
    }

    root.classList.toggle("about-overlay--force-hidden", hidden);
  }

  document.body.appendChild(root);

  return {
    root,
    open,
    close,
    setForceHidden,
    destroy() {
      unsubscribeLanguage?.();
      unsubscribeLayout?.();
      document.removeEventListener("keydown", onKeyDown);
      root.remove();
    },
  };
}
