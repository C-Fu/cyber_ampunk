const DEVELOPMENT_MODE_KEY = "threejs-punk-development-mode";
const LOOK_PRESET_KEY = "threejs-punk-look-preset";
const LANGUAGE_KEY = "threejs-punk-language";
const LANGUAGE_HINT_DISMISSED_KEY = "threejs-punk-lang-hint-dismissed";

let developmentModeEnabled = false;

try {
  // Develop mode used to persist in localStorage; keep it session-only.
  localStorage.removeItem(DEVELOPMENT_MODE_KEY);
} catch {
  // localStorage may be unavailable
}

export function isDevEnvironment() {
  return import.meta.env.DEV;
}

export function isDevelopmentModeEnabled() {
  return developmentModeEnabled;
}

export function setDevelopmentModeEnabled(enabled) {
  developmentModeEnabled = Boolean(enabled);
}

export function getStoredLookPreset() {
  try {
    return localStorage.getItem(LOOK_PRESET_KEY);
  } catch {
    return null;
  }
}

export function setStoredLookPreset(presetId) {
  try {
    if (presetId) {
      localStorage.setItem(LOOK_PRESET_KEY, presetId);
    } else {
      localStorage.removeItem(LOOK_PRESET_KEY);
    }
  } catch {
    // localStorage may be unavailable
  }
}

export function getStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredLanguage(language) {
  try {
    if (language) {
      localStorage.setItem(LANGUAGE_KEY, language);
    } else {
      localStorage.removeItem(LANGUAGE_KEY);
    }
  } catch {
    // localStorage may be unavailable
  }
}

// Note: the hint-dismissed flag is intentionally NOT cleared by
// clearAllStoredPreferences — a dismissed hint is not a config (TO-4).
export function getLanguageHintDismissed() {
  try {
    return localStorage.getItem(LANGUAGE_HINT_DISMISSED_KEY);
  } catch {
    return null;
  }
}

export function setLanguageHintDismissed(dismissed) {
  try {
    if (dismissed) {
      localStorage.setItem(LANGUAGE_HINT_DISMISSED_KEY, "1");
    } else {
      localStorage.removeItem(LANGUAGE_HINT_DISMISSED_KEY);
    }
  } catch {
    // localStorage may be unavailable
  }
}

export function clearAllStoredPreferences() {
  developmentModeEnabled = false;
  try {
    localStorage.removeItem(DEVELOPMENT_MODE_KEY);
    localStorage.removeItem(LOOK_PRESET_KEY);
  } catch {
    // localStorage may be unavailable
  }
}
