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

const DOLLAR_CURRENCIES = new Set([
  'USD', 'AUD', 'CAD', 'NZD', 'SGD', 'HKD', 'MXN', 'ARS', 'CLP', 'COP', 'TWD'
]);
const BANKNOTE_BY_CURRENCY = { EUR: '💶', GBP: '💷', JPY: '💴', CNY: '💴' };
const EURO_BANKNOTE = '💶';

// Emoji banknote matching the currency (💰 when there is no specific note).
export function currencyBanknoteEmoji(currency = DEFAULT_CURRENCY) {
  if (BANKNOTE_BY_CURRENCY[currency]) return BANKNOTE_BY_CURRENCY[currency];
  return DOLLAR_CURRENCIES.has(currency) ? '💵' : '💰';
}

// Older bookings stored the euro note as their icon; show the configured
// currency's note instead without rewriting stored data.
export function displayMoneyIcon(icon, currency = DEFAULT_CURRENCY) {
  if (!icon || icon === EURO_BANKNOTE) return currencyBanknoteEmoji(currency);
  return icon;
}
