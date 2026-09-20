import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_CURRENCY,
  normalizeCurrencyCode
} from '../shared/currency.js';

test('currency defaults to EUR when not configured', () => {
  assert.equal(DEFAULT_CURRENCY, 'EUR');
  assert.equal(normalizeCurrencyCode(undefined), 'EUR');
  assert.equal(normalizeCurrencyCode(''), 'EUR');
});

test('valid ISO 4217 codes are accepted case-insensitively', () => {
  assert.equal(normalizeCurrencyCode('AUD'), 'AUD');
  assert.equal(normalizeCurrencyCode(' chf '), 'CHF');
});

test('invalid codes fall back instead of breaking formatting', () => {
  assert.equal(normalizeCurrencyCode('EURO'), 'EUR');
  assert.equal(normalizeCurrencyCode('€'), 'EUR');
  assert.equal(normalizeCurrencyCode('QQQ'), 'EUR');
  assert.equal(normalizeCurrencyCode('bad', 'AUD'), 'AUD');
});

test('normalized codes format as currency', () => {
  const formatted = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: normalizeCurrencyCode('aud')
  }).format(12.5);
  assert.equal(formatted, '$12.50');
});

import {
  currencyBanknoteEmoji,
  displayMoneyIcon
} from '../shared/currency.js';

test('banknote emoji follows the configured currency', () => {
  assert.equal(currencyBanknoteEmoji('EUR'), '💶');
  assert.equal(currencyBanknoteEmoji('AUD'), '💵');
  assert.equal(currencyBanknoteEmoji('GBP'), '💷');
  assert.equal(currencyBanknoteEmoji('CHF'), '💰');
});

test('stored euro icons display in the configured currency', () => {
  assert.equal(displayMoneyIcon('💶', 'AUD'), '💵');
  assert.equal(displayMoneyIcon('💶', 'EUR'), '💶');
  assert.equal(displayMoneyIcon('🧾', 'AUD'), '🧾');
  assert.equal(displayMoneyIcon('', 'AUD'), '💵');
});
