import {
  DEFAULT_CURRENCY,
  normalizeCurrencyCode
} from '../../shared/currency.js';

// Kept separate from formatting.js so i18n can set it without a circular import.
const STORAGE_KEY = 'lx_family_currency';

function readStoredCurrency() {
  try {
    return normalizeCurrencyCode(
      globalThis.localStorage?.getItem(STORAGE_KEY),
      DEFAULT_CURRENCY
    );
  } catch {
    return DEFAULT_CURRENCY;
  }
}

let appCurrency = readStoredCurrency();

export function getAppCurrency() {
  return appCurrency;
}

export function setAppCurrency(value) {
  appCurrency = normalizeCurrencyCode(value, appCurrency);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, appCurrency);
  } catch {
    // Storage may be unavailable (private mode); the in-memory value still applies.
  }
  return appCurrency;
}
