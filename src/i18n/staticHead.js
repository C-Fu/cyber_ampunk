/**
 * index.html head localization (LOC-03/04/05): swaps document.title, meta
 * content, og:locale, and documentElement.lang from the active dictionary.
 *
 * applyStaticHead is called at boot from src/main.js init() and at runtime
 * from setLanguage() in i18n.js.
 *
 * A selector map (not data-i18n attributes) drives the swap — the head is
 * ~20 nodes with stable selectors and this keeps index.html clean.
 *
 * No module-eval-time side effects (import-cycle safety with i18n.js —
 * both modules only call each other at runtime).
 */
import { t, getLanguage } from "./i18n.js";
import { isDevEnvironment } from "../platform/userPreferences.js";

const SELECTOR_MAP = {
  'meta[name="title"]': "meta.metaTitle",
  'meta[name="description"]': "meta.description",
  'meta[property="og:title"]': "meta.ogTitle",
  'meta[property="og:description"]': "meta.ogDescription",
  'meta[property="og:image:alt"]': "meta.ogImageAlt",
  'meta[name="twitter:title"]': "meta.twitterTitle",
  'meta[name="twitter:description"]': "meta.twitterDescription",
  'meta[name="twitter:image:alt"]': "meta.twitterImageAlt",
};

export function applyStaticHead() {
  document.title = t("meta.title");

  for (const [selector, key] of Object.entries(SELECTOR_MAP)) {
    const element = document.querySelector(selector);
    if (!element) {
      if (isDevEnvironment()) {
        console.warn(`[i18n] head selector missed: ${selector}`);
      }
      continue;
    }

    element.setAttribute("content", t(key));
  }

  const ogLocale = document.querySelector('meta[property="og:locale"]');
  ogLocale?.setAttribute(
    "content",
    getLanguage() === "bm" ? "ms_MY" : "en_US",
  );

  document.documentElement.lang = getLanguage() === "bm" ? "ms" : "en"; // D-06
}
