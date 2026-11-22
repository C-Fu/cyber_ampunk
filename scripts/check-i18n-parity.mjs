/**
 * i18n dictionary parity check (LANG-03): BM and EN dictionaries must
 * carry identical key sets. Node-native ESM, no dependencies.
 *
 * Usage: node scripts/check-i18n-parity.mjs
 */
import { bm } from "../src/i18n/dictionaries/bm.js";
import { en } from "../src/i18n/dictionaries/en.js";

const bmKeys = new Set(Object.keys(bm));
const enKeys = new Set(Object.keys(en));

const missingInEn = [...bmKeys].filter((key) => !enKeys.has(key));
const missingInBm = [...enKeys].filter((key) => !bmKeys.has(key));

if (missingInEn.length > 0 || missingInBm.length > 0) {
  if (missingInEn.length > 0) {
    console.error(
      `[i18n] keys missing in en.js: ${missingInEn.join(", ")}`,
    );
  }
  if (missingInBm.length > 0) {
    console.error(
      `[i18n] keys missing in bm.js: ${missingInBm.join(", ")}`,
    );
  }
  process.exit(1);
}

console.log(
  `[i18n] parity OK: bm.js and en.js both carry ${bmKeys.size} keys`,
);
