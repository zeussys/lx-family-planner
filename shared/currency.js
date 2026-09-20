// Installation-wide currency for pocket money and other amounts.
// Configured once per server via LX_CURRENCY (ISO 4217, e.g. EUR, AUD, CHF).
export const DEFAULT_CURRENCY = 'EUR';

function isSupportedCurrency(code) {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('currency').includes(code);
    } catch {
      // Fall through to the formatter check below.
    }
  }
  try {
    new Intl.NumberFormat('en', { style: 'currency', currency: code });
    return true;
  } catch {
    return false;
  }
}

export function normalizeCurrencyCode(value, fallback = DEFAULT_CURRENCY) {
  const code = String(value ?? '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return fallback;
  return isSupportedCurrency(code) ? code : fallback;
}
