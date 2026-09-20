import {
  BadgeDollarSign,
  BadgeEuro,
  BadgeIndianRupee,
  BadgeJapaneseYen,
  BadgePoundSterling,
  BadgeRussianRuble,
  BadgeSwissFranc,
  Banknote
} from 'lucide-react';
import { getAppCurrency } from './currency.js';

const DOLLAR_CURRENCIES = new Set([
  'USD', 'AUD', 'CAD', 'NZD', 'SGD', 'HKD', 'MXN', 'ARS', 'CLP', 'COP', 'TWD'
]);

const ICON_BY_CURRENCY = {
  EUR: BadgeEuro,
  GBP: BadgePoundSterling,
  JPY: BadgeJapaneseYen,
  CHF: BadgeSwissFranc,
  INR: BadgeIndianRupee,
  RUB: BadgeRussianRuble
};

// Currency-matching badge for money headers; neutral banknote when unknown.
export function currencyBadgeIcon(currency = getAppCurrency()) {
  if (ICON_BY_CURRENCY[currency]) return ICON_BY_CURRENCY[currency];
  if (DOLLAR_CURRENCIES.has(currency)) return BadgeDollarSign;
  return Banknote;
}
