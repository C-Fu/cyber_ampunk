import "./header.css";
import { getLanguage, setLanguage, t, subscribe } from "../../i18n/i18n.js";
import { setStoredLanguage } from "../../platform/userPreferences.js";
import { SOURCE_CODE_URL } from "../core/externalLinks.js";
import { phosphorGearSix, phosphorGithubLogo, phosphorInfo } from "../core/phosphorIcons.js";
import { createHudPanel } from "../walk/createHudPanel.js";

export function createHeader({ state, onOpenSettings, onOpenAbout } = {}) {
  const root = document.createElement("div");
  // Hidden until revealAppUi — coordinator mounts later in init.
  root.className = "app-header app-header--force-hidden";
  root.setAttribute("data-ui-block-look", "true");
  root.innerHTML = `
    <div class="app-header-brand"></div>
    <div class="app-header-actions">
      <button type="button" class="app-header-lang-btn">
        <span class="lang-toggle-segment" data-lang="bm" aria-hidden="true">BM</span>
        <span class="lang-toggle-segment" data-lang="en" aria-hidden="true">EN</span>
      </button>
      <button type="button" class="app-header-about-btn" aria-label="${t("header.aboutAria")}">
        <span class="app-header-action-icon">${phosphorInfo}</span>
        <span class="app-header-about-label">${t("header.about")}</span>
      </button>
      <button type="button" class="app-header-about-btn app-header-source-btn" aria-label="${t("header.sourceAria")}">
        <span class="app-header-action-icon">${phosphorGithubLogo}</span>
        <span class="app-header-source-label">${t("header.source")}</span>
      </button>
      <button type="button" class="app-header-action-btn app-header-icon-btn app-header-settings-btn" aria-label="${t("header.settingsAria")}">
        <span class="app-header-action-icon">${phosphorGearSix}</span>
      </button>
    </div>
  `;

  const brandSlot = root.querySelector(".app-header-brand");
  const hud = createHudPanel();
  brandSlot.appendChild(hud.root);

  const settingsButton = root.querySelector(".app-header-settings-btn");
  const langButton = root.querySelector(".app-header-lang-btn");
  const langSegments = [...root.querySelectorAll(".lang-toggle-segment")];
  const aboutButton = root.querySelector(".app-header-about-btn:not(.app-header-source-btn)");
  const sourceButton = root.querySelector(".app-header-source-btn");
  const aboutLabel = root.querySelector(".app-header-about-label");
  const sourceLabel = root.querySelector(".app-header-source-label");

  function syncText() {
    aboutLabel.textContent = t("header.about");
    sourceLabel.textContent = t("header.source");
    aboutButton.setAttribute("aria-label", t("header.aboutAria"));
    sourceButton.setAttribute("aria-label", t("header.sourceAria"));
    settingsButton.setAttribute("aria-label", t("header.settingsAria"));
    const currentLanguage = getLanguage();
    langButton.setAttribute(
      "aria-label",
      t(currentLanguage === "bm" ? "header.langAriaBm" : "header.langAriaEn"),
    );
    for (const segment of langSegments) {
      segment.classList.toggle(
        "lang-toggle-segment--active",
        currentLanguage === segment.dataset.lang,
      );
    }
  }

  // Page-lifetime subscription (research A4): createHeader has no destroy()
  // and lives for the whole page — the unsubscribe is stored for future
  // teardown but deliberately never released here.
  const unsubscribeLanguage = subscribe(syncText);

  // Persist-first (LANG-02/D-03): the UI layer owns localStorage; setLanguage
  // itself never persists. Unconditional setLanguage is safe — it early-returns
  // when the language is unchanged (Pitfall 6).
  langButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state?.showAllUi?.();
    const next = getLanguage() === "bm" ? "en" : "bm";
    setStoredLanguage(next);
    setLanguage(next);
  });

  settingsButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state?.showAllUi?.();
    state?.openPanel("settings");
    onOpenSettings?.();
  });

  aboutButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state?.showAllUi?.();
    state?.openPanel("about");
    onOpenAbout?.();
  });

  sourceButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state?.showAllUi?.();
    window.open(SOURCE_CODE_URL, "_blank", "noopener,noreferrer");
  });

  document.body.appendChild(root);

  function show() {
    root.classList.add("show");
  }

  function hide() {
    root.classList.remove("show");
  }

  function setForceHidden(hidden) {
    root.classList.toggle("app-header--force-hidden", hidden);
  }

  return { root, show, hide, setForceHidden, bindWalkControls: hud.bindWalkControls, updateHud: hud.update };
}
