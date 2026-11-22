import "./settingsPanel.css";
import { getLanguage, setLanguage, t, subscribe } from "../../i18n/i18n.js";
import { setStoredLanguage } from "../../platform/userPreferences.js";
import {
  phosphorArrowCounterClockwise,
  phosphorX,
} from "../core/phosphorIcons.js";

function renderLookButtons(lookOptions) {
  // Labels resolve at render time from the dictionary (research §8, option a)
  // so createAppShell.js LOOK_OPTIONS stays data-only.
  return lookOptions
    .map(
      (option) => `
      <button
        type="button"
        class="settings-look-btn"
        data-look-preset="${option.id}"
        aria-pressed="false"
      >
        <span class="settings-look-icon">${option.icon}</span>
        <span class="settings-look-label">${t("look." + option.id)}</span>
      </button>
    `,
    )
    .join("");
}

export function createSettingsPanel({
  state,
  lookOptions = [],
  defaultLookPreset = "neutral",
  getDevelopmentMode = () => false,
  onDevelopmentModeChange,
  getCurrentLookPreset = () => defaultLookPreset,
  onLookPresetChange,
  onRestart,
} = {}) {
  const root = document.createElement("div");
  root.className = "settings-overlay";
  root.setAttribute("data-ui-block-look", "true");
  root.hidden = true;
  root.innerHTML = `
    <div class="settings-glass" role="dialog" aria-modal="true" aria-label="${t("settings.aria")}">
      <button type="button" class="settings-close" aria-label="${t("settings.close")}">
        ${phosphorX}
      </button>

      <div class="settings-options">
        <div class="settings-section">
          <p class="settings-section-title">${t("settings.look")}</p>
          <div class="settings-look-grid" role="group" aria-label="${t("settings.lookAria")}">
            ${renderLookButtons(lookOptions)}
          </div>
        </div>

        <div class="settings-divider" role="separator"></div>

        <div class="settings-section">
          <p class="settings-section-title">${t("settings.language")}</p>
          <div class="settings-lang-grid" role="group" aria-label="${t("settings.language")}">
            <button
              type="button"
              class="settings-look-btn"
              data-lang="bm"
              aria-pressed="false"
            >BM</button>
            <button
              type="button"
              class="settings-look-btn"
              data-lang="en"
              aria-pressed="false"
            >EN</button>
          </div>
        </div>

        <div class="settings-divider" role="separator"></div>

        <label class="settings-option">
          <span class="settings-option-text">
            <span class="settings-option-title">${t("settings.developmentMode")}</span>
          </span>
          <input
            type="checkbox"
            class="settings-toggle-input"
            data-development-mode
            aria-label="${t("settings.developmentModeAria")}"
          />
          <span class="settings-toggle" aria-hidden="true"></span>
        </label>

        <div class="settings-divider" role="separator"></div>

        <button type="button" class="settings-restart-btn" data-restart>
          <span class="settings-restart-icon">${phosphorArrowCounterClockwise}</span>
          <span>${t("settings.resetConfigs")}</span>
        </button>
        <p class="settings-restart-hint">
          ${t("settings.resetHint")}
        </p>
      </div>
    </div>
  `;

  const glass = root.querySelector(".settings-glass");
  const closeButton = root.querySelector(".settings-close");
  const devToggle = root.querySelector("[data-development-mode]");
  const restartButton = root.querySelector("[data-restart]");
  const sectionTitle = root.querySelector(".settings-section-title");
  const lookGrid = root.querySelector(".settings-look-grid");
  const devTitle = root.querySelector(".settings-option-title");
  const restartLabel = restartButton.querySelector("span:not(.settings-restart-icon)");
  const restartHint = root.querySelector(".settings-restart-hint");
  const lookButtons = [...root.querySelectorAll("[data-look-preset]")];
  const lookOptionIds = new Set(lookOptions.map((option) => option.id));
  const langSectionTitle = root.querySelector(".settings-lang-grid").previousElementSibling;
  const langButtons = [...root.querySelectorAll("[data-lang]")];

  function syncDevelopmentMode(enabled) {
    devToggle.checked = Boolean(enabled);
  }

  // D-03: textContent/setAttribute writes only — dictionary values never
  // reach an innerHTML write (D-04).
  function syncText() {
    glass.setAttribute("aria-label", t("settings.aria"));
    closeButton.setAttribute("aria-label", t("settings.close"));
    sectionTitle.textContent = t("settings.look");
    lookGrid.setAttribute("aria-label", t("settings.lookAria"));
    langSectionTitle.textContent = t("settings.language");
    devTitle.textContent = t("settings.developmentMode");
    devToggle.setAttribute("aria-label", t("settings.developmentModeAria"));
    restartLabel.textContent = t("settings.resetConfigs");
    restartHint.textContent = t("settings.resetHint");

    const currentLanguage = getLanguage();
    for (const button of langButtons) {
      const ariaKey =
        button.dataset.lang === "bm" ? "settings.langBmAria" : "settings.langEnAria";
      button.setAttribute("aria-label", t(ariaKey));
      button.setAttribute(
        "aria-pressed",
        currentLanguage === button.dataset.lang ? "true" : "false",
      );
    }

    for (const button of lookButtons) {
      const label = button.querySelector(".settings-look-label");
      label.textContent = t("look." + button.dataset.lookPreset);
    }
  }

  function syncLanguageSelection() {
    const currentLanguage = getLanguage();
    for (const button of langButtons) {
      const selected = currentLanguage === button.dataset.lang;
      button.classList.toggle("settings-look-btn--active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }
  }

  function syncLookPreset(presetId = getCurrentLookPreset()) {
    const activeId = lookOptionIds.has(presetId)
      ? presetId
      : defaultLookPreset;

    for (const button of lookButtons) {
      const selected = button.dataset.lookPreset === activeId;
      button.classList.toggle("settings-look-btn--active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }
  }

  function open() {
    root.classList.remove("settings-overlay--force-hidden");
    syncDevelopmentMode(getDevelopmentMode());
    syncLookPreset();
    root.hidden = false;
  }

  function close() {
    root.hidden = true;
    state?.closePanel();
  }

  function setForceHidden(hidden) {
    if (hidden && !root.hidden) {
      return;
    }

    root.classList.toggle("settings-overlay--force-hidden", hidden);
  }

  root.addEventListener("pointerdown", () => {
    state?.showAllUi?.();
  });

  root.addEventListener("click", (event) => {
    if (event.target === root) {
      close();
    }
  });

  closeButton.addEventListener("click", close);

  glass.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  for (const button of lookButtons) {
    button.addEventListener("click", () => {
      const presetId = button.dataset.lookPreset;
      onLookPresetChange?.(presetId);
      syncLookPreset(presetId);
    });
  }

  for (const button of langButtons) {
    // Persist-first (LANG-02/D-03) — identical to the header pill handler.
    // Clicking the already-active segment is a harmless no-op (setLanguage
    // early-returns on same language).
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      state?.showAllUi?.();
      const language = button.dataset.lang;
      setStoredLanguage(language);
      setLanguage(language);
      syncLanguageSelection();
    });
  }

  devToggle.addEventListener("change", () => {
    onDevelopmentModeChange?.(devToggle.checked);
  });

  restartButton.addEventListener("click", () => {
    // Call-time t() — the native confirm dialog is not retroactively
    // translatable, so it resolves at click time (PATTERN: call-time lookup).
    const confirmed = window.confirm(t("settings.resetConfirm"));
    if (!confirmed) {
      return;
    }

    onRestart?.();
    close();
  });

  function onKeyDown(event) {
    if (event.key === "Escape" && !root.hidden) {
      close();
    }
  }

  document.addEventListener("keydown", onKeyDown);

  state?.subscribe(({ openedPanel }) => {
    if (openedPanel === "settings") {
      open();
    } else if (!root.hidden) {
      root.hidden = true;
    }
  });

  const unsubscribeLanguage = subscribe(syncText);

  syncLanguageSelection();

  document.body.appendChild(root);

  return {
    root,
    open,
    close,
    setForceHidden,
    syncDevelopmentMode,
    syncLookPreset,
    destroy() {
      unsubscribeLanguage?.();
      document.removeEventListener("keydown", onKeyDown);
      root.remove();
    },
  };
}
