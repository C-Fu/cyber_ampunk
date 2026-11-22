import { bm } from "./dictionaries/bm.js";
import { en } from "./dictionaries/en.js";
import { isDevEnvironment } from "../platform/userPreferences.js";
import { applyStaticHead } from "./staticHead.js";

/**
 * Bilingual dictionary store (D-01/D-02): replicates the module-scope
 * pub/sub shape of src/audio/audioState.js — a Set of listeners, notify()
 * on state change, and subscribe() with immediate sync on registration.
 */
const DICTIONARIES = { bm, en };

const listeners = new Set();

let currentLanguage = "bm";

function notify() {
  for (const listener of listeners) {
    listener({ language: currentLanguage });
  }
}

function interpolate(value, vars) {
  if (!vars || Object.keys(vars).length === 0) {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (token, name) => vars[name] ?? token);
}

/**
 * Flat single-property lookup (D-07 — dots are cosmetic namespacing, no
 * path traversal). Missing keys: loud in dev, silent EN fallback in
 * production (D-08).
 */
export function t(key, vars = {}) {
  const value = DICTIONARIES[currentLanguage][key] ?? en[key];

  if (value === undefined) {
    if (isDevEnvironment()) {
      console.warn(`[i18n] missing key: ${key}`);
      return key;
    }
    return key;
  }

  return interpolate(value, vars);
}

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(language) {
  if (!DICTIONARIES[language] || language === currentLanguage) {
    return;
  }

  currentLanguage = language;
  document.documentElement.lang = language === "bm" ? "ms" : "en"; // D-06
  applyStaticHead();
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);
  listener({ language: currentLanguage }); // immediate sync — audioState contract
  return () => listeners.delete(listener);
}
